// components/VotingWidget.js
// ENHANCED: Added optimistic updates and better error handling while maintaining backward compatibility

import { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/auth-utils';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

export default function VotingWidget({ 
  contentType, 
  contentId, 
  initialNetScore = 0, 
  initialTotalVotes = 0,
  className = '' 
}) {
  const { isAuthenticated, userId, sessionExpired } = useContext(AuthContext);
  
  // Separate server state from optimistic state
  const [serverVotes, setServerVotes] = useState({
    netScore: initialNetScore,
    totalVotes: initialTotalVotes,
    userVote: null,
    upvotes: 0,
    downvotes: 0
  });
  
  // Optimistic state for immediate UI updates
  const [optimisticVotes, setOptimisticVotes] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState(false);

  // Handle session expiration
  useEffect(() => {
    if (sessionExpired && error !== 'Session expired. Please sign in again.') {
      setError('Session expired. Please sign in again.');
      setOptimisticVotes(null); // Clear any pending updates
    }
  }, [sessionExpired, error]);

  // Current displayed votes (optimistic if available, otherwise server state)
  const displayVotes = optimisticVotes || serverVotes;

  // Fetch current vote status on component mount
  useEffect(() => {
    if (isAuthenticated && contentType && contentId) {
      fetchVoteStatus();
    }
  }, [isAuthenticated, contentType, contentId]);

  // Sync with server periodically if there was an error
  useEffect(() => {
    if (syncError) {
      const timer = setTimeout(() => {
        fetchVoteStatus();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [syncError]);

  const fetchVoteStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/votes/${contentType}/${contentId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        const data = await response.json();
        setServerVotes(data);
        setOptimisticVotes(null); // Clear optimistic state when we get fresh server data
        setSyncError(false);
      }
    } catch (error) {
      console.error('Error fetching vote status:', error);
      setSyncError(true);
    }
  }, [contentType, contentId]);

  const calculateOptimisticState = (currentState, newVoteType) => {
    const { userVote, upvotes, downvotes } = currentState;
    
    let newUpvotes = upvotes;
    let newDownvotes = downvotes;
    let newUserVote = newVoteType;

    // Remove previous vote if any
    if (userVote === 'up') {
      newUpvotes--;
    } else if (userVote === 'down') {
      newDownvotes--;
    }

    // Add new vote if not removing
    if (newVoteType === 'up') {
      newUpvotes++;
    } else if (newVoteType === 'down') {
      newDownvotes++;
    } else {
      newUserVote = null; // Removing vote
    }

    return {
      upvotes: newUpvotes,
      downvotes: newDownvotes,
      userVote: newUserVote,
      netScore: newUpvotes - newDownvotes,
      totalVotes: newUpvotes + newDownvotes
    };
  };

  const handleVote = async (voteType) => {
    // Check authentication with session expiration awareness
    if (!isAuthenticated) {
      if (sessionExpired) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Please sign in to vote');
      }
      return;
    }

    // Clear any previous errors
    setError('');
    setSyncError(false);

    // Determine if we're removing a vote
    const isRemovingVote = serverVotes.userVote === voteType;
    const finalVoteType = isRemovingVote ? null : voteType;

    // Apply optimistic update immediately
    const optimisticState = calculateOptimisticState(serverVotes, finalVoteType);
    setOptimisticVotes(optimisticState);

    setLoading(true);

    try {
      const method = isRemovingVote ? 'DELETE' : 'POST';
      const body = isRemovingVote ? undefined : JSON.stringify({ voteType });

      const response = await fetch(`/api/votes/${contentType}/${contentId}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body
      });

      if (response.ok) {
        const serverResponse = await response.json();
        
        // Update server state with actual response
        setServerVotes(serverResponse);
        
        // Check if optimistic state matches server response
        const stateMatches = (
          optimisticState.netScore === serverResponse.netScore &&
          optimisticState.totalVotes === serverResponse.totalVotes &&
          optimisticState.userVote === serverResponse.userVote
        );

        if (stateMatches) {
          // Optimistic update was correct, clear it
          setOptimisticVotes(null);
        } else {
          // There was a discrepancy, keep server state and clear optimistic
          console.warn('Optimistic update mismatch, using server state');
          setOptimisticVotes(null);
        }
      } else {
        // Server error - revert optimistic update
        const errorData = await response.json();
        setError(errorData.error || 'Failed to vote');
        setOptimisticVotes(null); // Revert optimistic update
      }
    } catch (error) {
      console.error('Vote error:', error);
      setError('Network error. Please try again.');
      setOptimisticVotes(null); // Revert optimistic update
      setSyncError(true);
    } finally {
      setLoading(false);
    }
  };

  const getButtonClass = (voteType) => {
    const baseClass = "flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 disabled:opacity-50";
    const isActive = displayVotes.userVote === voteType;
    const isOptimistic = optimisticVotes !== null;
    
    let colorClass;
    if (voteType === 'up') {
      colorClass = isActive
        ? 'bg-green-600 text-white shadow-lg'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white';
    } else {
      colorClass = isActive
        ? 'bg-red-600 text-white shadow-lg'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white';
    }

    // Add subtle indicator for optimistic updates
    const optimisticClass = isOptimistic ? 'ring-2 ring-blue-400 ring-opacity-50' : '';

    return `${baseClass} ${colorClass} ${optimisticClass}`;
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Voting buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleVote('up')}
          disabled={loading || !isAuthenticated}
          className={getButtonClass('up')}
          title={isAuthenticated ? 'Thumbs up' : 'Sign in to vote'}
        >
          <ThumbsUp size={18} />
          <span>{displayVotes.upvotes}</span>
        </button>
        
        <button
          onClick={() => handleVote('down')}
          disabled={loading || !isAuthenticated}
          className={getButtonClass('down')}
          title={isAuthenticated ? 'Thumbs down' : 'Sign in to vote'}
        >
          <ThumbsDown size={18} />
          <span>{displayVotes.downvotes}</span>
        </button>

        {/* Net score display */}
        <div className="flex items-center space-x-2 text-gray-400">
          <span className="text-sm">Score:</span>
          <span className={`font-semibold ${
            displayVotes.netScore > 0 ? 'text-green-400' : 
            displayVotes.netScore < 0 ? 'text-red-400' : 'text-gray-400'
          }`}>
            {displayVotes.netScore > 0 ? '+' : ''}{displayVotes.netScore}
          </span>
          {optimisticVotes && (
            <span className="text-xs text-blue-400">*</span>
          )}
        </div>
      </div>

      {/* Enhanced status messages */}
      {error && (
        <div className={`text-sm ${
          sessionExpired ? 'text-amber-400' : 'text-red-400'
        }`}>
          {sessionExpired ? (
            <div className="flex items-center space-x-2">
              <span>Session expired.</span>
              <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
                Sign in again
              </a>
            </div>
          ) : (
            error
          )}
        </div>
      )}

      {syncError && (
        <div className="text-yellow-400 text-sm">
          Sync issue detected. Retrying...
        </div>
      )}

      {/* Sign in prompt */}
      {!isAuthenticated && !sessionExpired && (
        <div className="text-gray-500 text-sm">
          <a href="/login" className="text-blue-400 hover:text-blue-300 underline">
            Sign in
          </a> to vote and comment
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-gray-500 text-sm flex items-center space-x-1">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
          <span>Updating vote...</span>
        </div>
      )}

      {/* Optimistic update indicator */}
      {optimisticVotes && !loading && (
        <div className="text-blue-400 text-xs">
          * Update pending
        </div>
      )}
    </div>
  );
}
