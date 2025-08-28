import RSSNews from "@/components/rss/rss";
import { Metadata } from "next";
import { NewsItem } from "@/api/news/api";

// ISR Configuration - revalidate every 2.5 hours (9000 seconds)
export const revalidate = 9000;

// Fetch RSS news data at build time
async function getRSSNews() {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    const response = await fetch(`${serverUrl}/news/bangladesh?page=1&limit=30`, {
      next: { revalidate: 9000 }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching RSS news:', error);
    return {
      success: false,
      news: [],
      hasMore: false,
      count: 0
    };
  }
}

export const metadata: Metadata = {
  title: "Bangladesh RSS News - Latest News Feeds | NCP",
  description: "Get the latest Bangladesh news from RSS feeds. Real-time news aggregation from top Bangladeshi news sources and channels.",
  keywords: [
    "Bangladesh RSS news",
    "Bangladesh news feeds", 
    "Bangladesh latest news",
    "Bangladesh news aggregation",
    "RSS feeds Bangladesh",
    "Bangladesh news sources"
  ],
};

export default async function RSSPage() {
  const newsData = await getRSSNews();
  
  return <RSSNews initialNews={newsData} />;
}