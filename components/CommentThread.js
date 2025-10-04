// components/CommentThread.js
import { useState, useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';
import { getAuthHeaders } from '@/lib/auth-utils';
import { formatDistanceToNow } from 'date-fns';
import { Reply, Edit3, Trash2, MoreVertical } from 'lucide-react';
import CommentForm from './CommentForm';

export default function CommentThread({ 
  comment, 
  contentType,
  contentId,
  onReply, 
  onUpdate,
  onDelete,
  depth = 0,
  maxDepth = null 
}) {
  const { isAuthenticated, userId } = useContext(AuthContext);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isAuthor = isAuthenticated && userId && parseInt(userId) === comment.author_id;
  const canReply = isAuthenticated && (!maxDepth || depth < maxDepth);
  
  const handleReply = (newComment) => {
    setShowReplyForm(false);
    if (onReply) {
      onReply(newComment);
    }
  };

  const handleEdit = (updatedComment) => {
    setShowEditForm(false);
    if (onUpdate) {
      onUpdate(updatedComment);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });

      if (response.ok) {
        if (onDelete) {
          onDelete(comment.id);
        }
      } else {
        console.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    } finally {
      setDeleting(false);
      setShowActions(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'some time ago';
    }
  };

  // Calculate left margin for indentation
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : '';

  return (
    <div className={`${indentClass} ${depth > 0 ? 'border-l border-gray-700 pl-4' : ''}`}>
      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        {/* Comment header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {/* Author avatar placeholder */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {(comment.user?.name || 'U')[0].toUpperCase()}
            </div>
            
            <div>
              <span className="text-white font-medium">
                {comment.user?.name || 'Unknown User'}
              </span>
              <span className="text-gray-400 text-sm ml-2">
                {formatDate(comment.created_at)}
                {comment.isEdited && (
                  <span className="ml-1 text-xs">(edited)</span>
                )}
              </span>
            </div>
          </div>

          {/* Actions menu */}
          {isAuthor && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-gray-400 hover:text-white rounded"
                disabled={deleting}
              >
                <MoreVertical size={16} />
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-8 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                  <button
                    onClick={() => {
                      setShowEditForm(true);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-600 flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>{deleting ? 'Deleting...' : 'Delete'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Comment content */}
        {showEditForm ? (
          <CommentForm
            contentType={contentType}
            contentId={contentId}
            editMode={true}
            editCommentId={comment.id}
            initialContent={comment.content}
            onSubmit={handleEdit}
            onCancel={() => setShowEditForm(false)}
            placeholder="Edit your comment..."
          />
        ) : (
          <>
            <div className="text-gray-200 mb-3 whitespace-pre-wrap">
              {comment.isDeleted ? (
                <span className="italic text-gray-500">[Comment deleted]</span>
              ) : (
                comment.content
              )}
            </div>

            {/* Comment actions */}
            {!comment.isDeleted && (
              <div className="flex items-center space-x-4">
                {canReply && (
                  <button
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 text-sm transition-colors"
                  >
                    <Reply size={14} />
                    <span>Reply</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-4 border-t border-gray-700 pt-4">
            <CommentForm
              contentType={contentType}
              contentId={contentId}
              parentId={comment.id}
              onSubmit={handleReply}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.user?.name || 'this comment'}...`}
              isReply={true}
            />
          </div>
        )}
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              contentType={contentType}
              contentId={contentId}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </div>
      )}
    </div>
  );
}
