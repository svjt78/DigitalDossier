// components/CommentForm.js
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/auth-utils';
import { Send, X } from 'lucide-react';

export default function CommentForm({ 
  contentType, 
  contentId, 
  parentId = null,
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  isReply = false,
  editMode = false,
  initialContent = '',
  editCommentId = null
}) {
  const { isAuthenticated, username, sessionExpired } = useContext(AuthContext);
  const [content, setContent] = useState(initialContent);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle session expiration
  useEffect(() => {
    if (sessionExpired) {
      setError('Session expired. Please sign in to continue commenting.');
    }
  }, [sessionExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      if (sessionExpired) {
        setError('Session expired. Please sign in again.');
      } else {
        setError('Please sign in to comment');
      }
      return;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.trim().length > 2000) {
      setError('Comment too long (max 2000 characters)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      let response;
      
      if (editMode && editCommentId) {
        // Edit existing comment
        response = await fetch(`/api/comments/${editCommentId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ content: content.trim() })
        });
      } else {
        // Create new comment
        response = await fetch(`/api/comments/${contentType}/${contentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({ 
            content: content.trim(),
            parentId 
          })
        });
      }

      if (response.ok) {
        const newComment = await response.json();
        
        // Reset form
        setContent('');
        setError('');
        
        // Call parent callback
        if (onSubmit) {
          onSubmit(newComment);
        }
        
        // Close reply form if this was a reply
        if (onCancel && isReply) {
          onCancel();
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Comment submission error:', error);
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    setError('');
    if (onCancel) {
      onCancel();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-4">Sign in to join the conversation</p>
        <a 
          href="/login" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Sign In
        </a>
      </div>
    );
  }

  const remainingChars = 2000 - content.length;
  const isNearLimit = remainingChars < 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[100px]"
          disabled={submitting}
        />
        
        {/* Character counter */}
        <div className={`absolute bottom-2 right-2 text-xs ${
          isNearLimit ? 'text-red-400' : 'text-gray-500'
        }`}>
          {remainingChars} characters remaining
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-700 rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-400">
          Commenting as <span className="text-white font-medium">{username}</span>
        </div>
        
        <div className="flex items-center space-x-3">
          {(isReply || editMode) && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={submitting}
            >
              <X size={16} />
              <span>Cancel</span>
            </button>
          )}
          
          <button
            type="submit"
            disabled={submitting || !content.trim() || remainingChars < 0}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <Send size={16} />
            <span>
              {submitting ? 'Posting...' : editMode ? 'Update' : 'Post Comment'}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}
