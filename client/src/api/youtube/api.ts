const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface YouTubeVideo {
  title: string;
  videoId: string;
  url: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  channelTitle: string;
  source: string;
}

export interface YouTubeResponse {
  success: boolean;
  type: string;
  count: number;
  videos: YouTubeVideo[];
  sources: {
    youtube: number;
    googleAlerts: number;
    total: number;
  };
  config: {
    searchQuery: string;
    channelsCount: number;
    maxResults: number;
  };
}

// Content types available
export type ContentType = 'channels' | 'talkshows' | 'youtube';

// Fetch videos by content type
export const fetchVideosByType = async (type: ContentType, maxResults?: number): Promise<YouTubeResponse> => {
  try {
    const params = new URLSearchParams({ type });
    if (maxResults) params.append('maxResults', maxResults.toString());
    
    const response = await fetch(`${API_BASE_URL}/youtube/videos?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${type} videos:`, error);
    throw error;
  }
};

// Legacy function for backward compatibility
export const fetchBangladeshNews = async (maxResults: number = 50): Promise<YouTubeResponse> => {
  return fetchVideosByType('channels', maxResults);
};

// Convenience functions for each content type
export const fetchChannelVideos = async (maxResults?: number) => 
  fetchVideosByType('channels', maxResults);

export const fetchTalkShowVideos = async (maxResults?: number) => 
  fetchVideosByType('talkshows', maxResults);

export const fetchYouTubeChannelVideos = async (maxResults?: number) => 
  fetchVideosByType('youtube', maxResults); 