"use client";

import React, { useState, useEffect } from "react";
import { DisqusCommentsProps } from "@/types/disqus-comment-prop-types";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Reply, ThumbsUp, ThumbsDown, Trash2, MoreHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { 
  fetchCommentsByPost, 
  createComment, 
  deleteComment, 
  reactToComment,
  Comment,
  CreateCommentRequest 
} from "@/api/comments/api";
import { useAuth } from "../context/AuthContext";

interface CustomCommentsProps extends DisqusCommentsProps {
  postType?: 'youtube' | 'facebook' | 'news' | 'rss';
}

// Separate CommentItem component to prevent re-creation on every render
const CommentItem: React.FC<{
  comment: Comment;
  isReply?: boolean;
  depth?: number;
  onReply: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReaction: (commentId: string, reaction: 'like' | 'dislike') => void;
  replyingTo: string | null;
  replyContent: string;
  onReplyContentChange: (content: string) => void;
  onSubmitReply: (commentId: string) => void;
  onCancelReply: () => void;
  user: any;
}> = ({ 
  comment, 
  isReply = false, 
  depth = 0,
  onReply, 
  onDelete, 
  onReaction, 
  replyingTo, 
  replyContent, 
  onReplyContentChange, 
  onSubmitReply, 
  onCancelReply,
  user 
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);
  
  // Count total replies in the entire thread
  const countTotalReplies = (replies: Comment[]): number => {
    if (!replies || replies.length === 0) return 0;
    return replies.reduce((total, reply) => {
      return total + 1 + countTotalReplies(reply.replies || []);
    }, 0);
  };
  
  const totalRepliesInThread = countTotalReplies(comment.replies || []);
  
  // Toggle all replies in the thread
  const toggleAllReplies = () => {
    setShowAllReplies(!showAllReplies);
  };
  
  // Auto-expand replies when someone is replying to this comment
  useEffect(() => {
    if (replyingTo === comment._id && comment.replies && comment.replies.length > 0) {
      setShowReplies(true);
    }
  }, [replyingTo, comment._id, comment.replies]);
  
  // Calculate indentation based on depth
  const getIndentation = (depth: number) => {
    if (depth === 0) return '';
    const indentSize = Math.min(depth * 16, 80); // Max 80px indentation
    return `ml-[${indentSize}px]`;
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const commentDate = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return commentDate.toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get border color based on depth
  const getBorderColor = (depth: number) => {
    const colors = [
      'border-blue-200 dark:border-blue-700',
      'border-green-200 dark:border-green-700',
      'border-purple-200 dark:border-purple-700',
      'border-orange-200 dark:border-orange-700',
      'border-pink-200 dark:border-pink-700',
      'border-indigo-200 dark:border-indigo-700',
      'border-teal-200 dark:border-teal-700',
      'border-amber-200 dark:border-amber-700',
      'border-rose-200 dark:border-rose-700',
      'border-cyan-200 dark:border-cyan-700'
    ];
    return colors[depth % colors.length];
  };

  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 20)}` : '';
  const borderClass = depth > 0 ? `border-l-2 ${getBorderColor(depth)} pl-4` : '';

  return (
    <div className={`${indentClass} ${isReply ? 'mt-3' : 'mb-6'}`}>
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-gray-100 dark:ring-gray-700">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
            {getInitials(comment.author)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-3">
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {comment.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
              {formatTimestamp(comment.createdAt)}
            </span>
          </div>
          
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
            {comment.content}
          </p>
          
          <div className="flex items-center gap-3 text-xs">
            <button 
              onClick={() => onReaction(comment._id, 'like')}
              className={`flex items-center gap-2 transition-all duration-200 px-3 py-2 rounded-lg font-medium ${
                comment.userVote === 'like' 
                  ? 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${comment.userVote === 'like' ? 'fill-current' : ''}`} />
              <span>{comment.likes}</span>
            </button>
            <button 
              onClick={() => onReaction(comment._id, 'dislike')}
              className={`flex items-center gap-2 transition-all duration-200 px-3 py-2 rounded-lg font-medium ${
                comment.userVote === 'dislike' 
                  ? 'text-red-600 bg-red-100 dark:bg-red-900/30 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <ThumbsDown className={`w-4 h-4 ${comment.userVote === 'dislike' ? 'fill-current' : ''}`} />
              <span>{comment.dislikes}</span>
            </button>
            
            {/* Allow replies at any level, but limit depth to prevent abuse */}
            {depth < 10 && (
              <button 
                onClick={() => onReply(comment._id)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 px-3 py-2 rounded-lg font-medium"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>
            )}
            
            {user?.email === comment.userEmail && (
              <button 
                onClick={() => onDelete(comment._id)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 px-3 py-2 rounded-lg font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyingTo === comment._id && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-7 h-7 ring-2 ring-blue-200 dark:ring-blue-700">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-xs font-semibold">
                    {getInitials(user?.name || '')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    Replying to {comment.author}
                  </span>
                  {/* Show thread context for nested replies */}
                  {depth > 0 && (
                    <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Thread context:</span> 
                      <span className="ml-1 text-blue-600 dark:text-blue-400">
                        {depth === 1 ? 'Reply to a comment' : 
                         depth === 2 ? 'Reply to a reply' : 
                         `Reply at level ${depth}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <Textarea
                placeholder={`Write a thoughtful reply${depth > 0 ? ' to continue the conversation' : ''}...`}
                value={replyContent}
                onChange={(e) => onReplyContentChange(e.target.value)}
                rows={3}
                className="mb-3 resize-none border-blue-200 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200"
              />
              <div className="flex gap-3">
                <Button 
                  size="sm"
                  onClick={() => onSubmitReply(comment._id)}
                  disabled={!replyContent.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Post Reply
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={onCancelReply}
                  className="text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="flex hover:cursor-pointer items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 font-medium"
                >
                  {showReplies ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}

                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
    
                    </>
                  )}
                </button>
                

              </div>
              
              {showReplies && (
                <div className="space-y-4">
                  {comment.replies.map((reply) => (
                    <CommentItem 
                      key={reply._id} 
                      comment={reply} 
                      isReply={true}
                      depth={reply.depth || depth + 1}
                      onReply={onReply}
                      onDelete={onDelete}
                      onReaction={onReaction}
                      replyingTo={replyingTo}
                      replyContent={replyContent}
                      onReplyContentChange={onReplyContentChange}
                      onSubmitReply={onSubmitReply}
                      onCancelReply={onCancelReply}
                      user={user}
                    />
                  ))}
                </div>
              )}
              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomComments: React.FC<CustomCommentsProps> = ({ post, postType = 'news' }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  // Load comments from database on component mount
  useEffect(() => {
    loadComments();
  }, [post.slug]);

  const loadComments = async () => {
    try {
      setLoading(true);
      console.log("🔍 Loading comments for post:", post.slug, "type:", postType);
      const response = await fetchCommentsByPost(post.slug, 1, 50, postType, user?.email);
      console.log("📝 Comments response:", response);
      setComments(response.comments);
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user?.name) {
      return;
    }

    setIsSubmitting(true);

    try {
      const commentData: CreateCommentRequest = {
        author: user.name,
        content: newComment.trim(),
        postSlug: post.slug,
        postTitle: post.title,
        postType: postType,
        userEmail: user.email,
      };

      console.log("💬 Creating comment with data:", commentData);
      const response = await createComment(commentData);
      console.log("✅ Comment created:", response);
      
      if (response.success) {
        setComments(prev => [response.comment, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyContent.trim() || !user?.name) {
      return;
    }

    try {
      const commentData: CreateCommentRequest = {
        author: user.name,
        content: replyContent.trim(),
        postSlug: post.slug,
        postTitle: post.title,
        postType: postType,
        userEmail: user.email,
        parentCommentId: parentCommentId,
      };

      const response = await createComment(commentData);
      
      if (response.success) {
        // Recursively update the comments tree to add the new reply
        const addReplyToComment = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
          return comments.map(comment => {
            if (comment._id === parentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), { ...newReply, depth: (comment.depth || 0) + 1 }]
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToComment(comment.replies, parentId, newReply)
              };
            }
            return comment;
          });
        };

        setComments(prev => addReplyToComment(prev, parentCommentId, response.comment));
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId);
      
      // Recursively remove the comment from the comments tree
      const removeCommentFromTree = (comments: Comment[], commentId: string): Comment[] => {
        return comments
          .filter(comment => comment._id !== commentId)
          .map(comment => {
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: removeCommentFromTree(comment.replies, commentId)
              };
            }
            return comment;
          });
      };

      setComments(prev => removeCommentFromTree(prev, commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const updateCommentVote = (commentId: string, reaction: 'like' | 'dislike', likes: number, dislikes: number) => {
    // Recursively update comment votes in the tree
    const updateVoteInTree = (comments: Comment[], commentId: string, reaction: 'like' | 'dislike', likes: number, dislikes: number): Comment[] => {
      return comments.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            likes,
            dislikes,
            userVote: comment.userVote === reaction ? null : reaction
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateVoteInTree(comment.replies, commentId, reaction, likes, dislikes)
          };
        }
        return comment;
      });
    };

    setComments(prev => updateVoteInTree(prev, commentId, reaction, likes, dislikes));
  };

  const handleReaction = async (commentId: string, reaction: 'like' | 'dislike') => {
    try {
      if (!user?.email) return;
      
      const response = await reactToComment(commentId, reaction, user.email);
      if (response.success) {
        updateCommentVote(commentId, reaction, response.comment.likes, response.comment.dislikes);
      }
    } catch (error) {
      console.error("Error reacting to comment:", error);
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleReplyContentChange = (content: string) => {
    setReplyContent(content);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Please log in to view and add comments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800">
      {/* Comment Form */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-4 mb-4">
          <Avatar className="w-10 h-10 ring-2 ring-blue-100 dark:ring-blue-900/30">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-sm">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Comment as {user.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Share your thoughts with the community
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <div className="relative">
            <Textarea
              placeholder="What are your thoughts? Share your perspective..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
              rows={4}
              className="resize-none border-gray-200 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-all duration-200 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400 dark:text-gray-500">
              {newComment.length}/500
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              💡 Be respectful and constructive
            </div>
            <Button 
              type="submit" 
              disabled={isSubmitting || !newComment.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            Comments ({comments.length})
          </h4>
          {comments.length > 0 && (
            <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="w-full h-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
            </div>
            <p className="text-lg font-medium">Loading comments...</p>
            <p className="text-sm opacity-75">Please wait while we fetch the latest discussions</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10 opacity-50" />
            </div>
            <p className="text-lg font-medium mb-2">No comments yet</p>
            <p className="text-sm opacity-75">Be the first to share your thoughts and start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map((comment) => (
              <CommentItem 
                key={comment._id} 
                comment={comment}
                depth={comment.depth || 0}
                onReply={handleReplyClick}
                onDelete={handleDeleteComment}
                onReaction={handleReaction}
                replyingTo={replyingTo}
                replyContent={replyContent}
                onReplyContentChange={handleReplyContentChange}
                onSubmitReply={handleSubmitReply}
                onCancelReply={handleCancelReply}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomComments;
