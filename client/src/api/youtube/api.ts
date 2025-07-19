const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface YouTubeVideo {
  title: string;
  videoId: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  channelTitle: string;
}

export interface YouTubeResponse {
  success: boolean;
  count: number;
  videos: YouTubeVideo[];
}

export const fetchBangladeshNewsVideos = async (maxResults: number = 50): Promise<YouTubeResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/youtube/bangladesh-news?maxResults=${maxResults}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw error;
  }
}; 