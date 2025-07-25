const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface NewsItem {
  title: string;
  link: string;
  date: string;
  source: string;
}

export interface NewsResponse {
  success: boolean;
  count: number;
  news: NewsItem[];
}

export const fetchBangladeshNews = async (): Promise<NewsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/bangladesh`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}; 