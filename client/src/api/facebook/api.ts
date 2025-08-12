const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface FacebookPost {
  title: string;
  postId: string;
  url: string;
  publishedAt: string;
  image: string | null;
  description: string;
  author: string;
  source: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface FacebookResponse {
  success: boolean;
  count: number;
  posts: FacebookPost[];
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export const fetchFacebookPosts = async (maxPosts: number = 5, page: number = 1, limit: number = 15): Promise<FacebookResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/facebook/posts?maxPosts=${maxPosts}&page=${page}&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Facebook posts:', error);
    throw error;
  }
}; 