// components/CommentsSection.js
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { MessageCircle, Users } from 'lucide-react';
import CommentForm from './CommentForm';
import CommentThread from './CommentThread';

export default function CommentsSection({ contentType, contentId, initialCount = 0 }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalCount, setTotalCount] = useState(initialCount);

  useEffect(() => {
    fetchComments();
  }, [contentType, contentId]);

  const fetchComments = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/comments/${contentType}/${contentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
        setTotalCount(data.totalCount);
      } else {
        setError('Failed to load comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Network error loading comments');
    } finally {
      setLoading(false);
    }
  };

  const handleNewComment = (newComment) => {
    if (newComment.parentId) {
      // This is a reply - update the comment tree
      setComments(prev => updateCommentTree(prev, newComment));
    } else {
      // This is a top-level comment
      setComments(prev => [newComment, ...prev]);
    }
    setTotalCount(prev => prev + 1);
  };

  const handleUpdateComment = (updatedComment) => {
    setComments(prev => updateCommentInTree(prev, updatedComment));
  };

  const handleDeleteComment = (commentId) => {
    // Refresh comments to get updated tree structure
    fetchComments();
  };

  // Helper function to update comment tree with new reply
  const updateCommentTree = (comments, newReply) => {
    return comments.map(comment => {
      if (comment.id === newReply.parentId) {
        return {
          ...comment,
          replies: [newReply, ...(comment.replies || [])]
        };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentTree(comment.replies, newReply)
        };
      }
      return comment;
    });
  };

  // Helper function to update a comment in the tree
  const updateCommentInTree = (comments, updatedComment) => {
    return comments.map(comment => {
      if (comment.id === updatedComment.id) {
        return { ...comment, ...updatedComment };
      } else if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, updatedComment)
        };
      }
      return comment;
    });
  };

  if (loading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-400">Loading comments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center space-x-2">
          <MessageCircle size={20} />
          <span>Comments</span>
          {totalCount > 0 && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded-full text-sm">
              {totalCount}
            </span>
          )}
        </h3>

        {totalCount > 0 && (
          <div className="flex items-center text-sm text-gray-400">
            <Users size={16} className="mr-1" />
            <span>{totalCount} {totalCount === 1 ? 'comment' : 'comments'}</span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchComments}
            className="mt-2 text-red-300 hover:text-red-200 underline text-sm"
          >
            Try again
          </button>
        </div>
      )}

      {/* Comment form */}
      <div className="mb-8">
        <CommentForm
          contentType={contentType}
          contentId={contentId}
          onSubmit={handleNewComment}
          placeholder="Share your thoughts..."
        />
      </div>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map(comment => (
            <CommentThread
              key={comment.id}
              comment={comment}
              contentType={contentType}
              contentId={contentId}
              onReply={handleNewComment}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
              depth={0}
            />
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-8">
            <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg mb-2">No comments yet</p>
            <p className="text-gray-500">
              {isAuthenticated 
                ? "Be the first to share your thoughts!" 
                : "Sign in to start the conversation"
              }
            </p>
          </div>
        )
      )}
    </div>
  );
}
