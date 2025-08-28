const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface Comment {
  _id: string;
  author: string;
  content: string;
  postSlug: string;
  postTitle: string;
  postType: 'youtube' | 'facebook' | 'news' | 'rss';
  userId?: string;
  userEmail?: string;
  isApproved: boolean;
  isSpam: boolean;
  parentCommentId?: string;
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
  depth?: number; // Track nesting level (0 = top level, 1 = first reply, etc.)
}

export interface CommentResponse {
  success: boolean;
  count: number;
  comments: Comment[];
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateCommentRequest {
  author: string;
  content: string;
  postSlug: string;
  postTitle: string;
  postType: 'youtube' | 'facebook' | 'news' | 'rss';
  userEmail?: string;
  parentCommentId?: string;
}

export interface CommentStats {
  totalComments: number;
  totalLikes: number;
  totalDislikes: number;
  avgLikes: number;
  avgDislikes: number;
}

// Fetch comments for a specific post
export const fetchCommentsByPost = async (
  postSlug: string, 
  page: number = 1, 
  limit: number = 20,
  postType?: string,
  userEmail?: string
): Promise<CommentResponse> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });
    
    if (postType) {
      params.append('postType', postType);
    }
    
    if (userEmail) {
      params.append('userEmail', userEmail);
    }
    
    const response = await fetch(`${API_BASE_URL}/comments/${postSlug}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Create a new comment
export const createComment = async (commentData: CreateCommentRequest): Promise<{ success: boolean; comment: Comment; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
};

// Update a comment
export const updateComment = async (commentId: string, content: string): Promise<{ success: boolean; comment: Comment; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// React to a comment (like/dislike)
export const reactToComment = async (commentId: string, reaction: 'like' | 'dislike', userEmail: string): Promise<{ success: boolean; comment: Comment; message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reaction, userEmail }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error reacting to comment:', error);
    throw error;
  }
};

// Get comment statistics for a post
export const getCommentStats = async (postSlug: string): Promise<{ success: boolean; stats: CommentStats }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/comments/stats/${postSlug}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    throw error;
  }
};
