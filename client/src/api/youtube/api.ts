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
  channelHandle?: string;
  isShort?: boolean;
}

export interface YouTubeResponse {
  success: boolean;
  type: string;
  count: number;
  videos: YouTubeVideo[];
  page: number;
  limit: number;
  hasMore: boolean;
  sources: {
    youtube: number;
    playlists: number; // Changed from googleAlerts to playlists
    total: number;
  };
  config: {
    searchQuery: string | null; // Made nullable to match backend
    channelsCount: number;
    playlistsCount: number; // Added to match backend
    maxResults: number;
  };
}

// Content types available
export type ContentType = 'channels' | 'talkshows' | 'youtube';

// Fetch videos by content type
export const fetchVideosByType = async (type: ContentType, page: number = 1, maxResults: number = 15): Promise<YouTubeResponse> => {
  try {
    const params = new URLSearchParams({ type });
    params.append('page', page.toString());
    params.append('maxResults', maxResults.toString()); // Changed from 'limit' to 'maxResults'
    
    console.log(`🌐 API Call: ${API_BASE_URL}/youtube/videos?${params}`);
    
    const response = await fetch(`${API_BASE_URL}/youtube/videos?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`📡 API Response:`, data);
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

export const fetchYouTubeShorts = async (maxResults?: number) => 
  fetchVideosByType('youtube', maxResults);

// Legacy function for backward compatibility
export const fetchYouTubeChannelVideos = async (maxResults?: number) => 
  fetchVideosByType('youtube', maxResults); 