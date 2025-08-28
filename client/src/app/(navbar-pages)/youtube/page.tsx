import YouTubeNews from "@/components/youtube/youtube";
import { Metadata } from "next";
import { YouTubeVideo, ContentType } from "@/api/youtube/api";

// ISR Configuration - revalidate every 2.5 hours (9000 seconds)
export const revalidate = 9000;

// Fetch YouTube videos data at build time
async function getYouTubeVideos() {
  try {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    
    // Fetch initial videos for each content type
    const [channelsResponse, talkshowsResponse, youtubeResponse] = await Promise.allSettled([
      fetch(`${serverUrl}/youtube/videos?type=channels&maxResults=20&page=1&limit=20`, {
        next: { revalidate: 9000 }
      }),
      fetch(`${serverUrl}/youtube/videos?type=talkshows&maxResults=20&page=1&limit=20`, {
        next: { revalidate: 9000 }
      }),
      fetch(`${serverUrl}/youtube/videos?type=youtube&maxResults=20&page=1&limit=20`, {
        next: { revalidate: 9000 }
      })
    ]);

    const initialData = {
      channels: { videos: [], hasMore: false, success: false },
      talkshows: { videos: [], hasMore: false, success: false },
      youtube: { videos: [], hasMore: false, success: false }
    };

    // Process channels data
    if (channelsResponse.status === 'fulfilled' && channelsResponse.value.ok) {
      const data = await channelsResponse.value.json();
      initialData.channels = data;
    }

    // Process talkshows data
    if (talkshowsResponse.status === 'fulfilled' && talkshowsResponse.value.ok) {
      const data = await talkshowsResponse.value.json();
      initialData.talkshows = data;
    }

    // Process youtube data
    if (youtubeResponse.status === 'fulfilled' && youtubeResponse.value.ok) {
      const data = await youtubeResponse.value.json();
      initialData.youtube = data;
    }

    return initialData;
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    return {
      channels: { videos: [], hasMore: false, success: false },
      talkshows: { videos: [], hasMore: false, success: false },
      youtube: { videos: [], hasMore: false, success: false }
    };
  }
}

export const metadata: Metadata = {
  title: "Bangladesh News Videos - Latest YouTube News | NCP",
  description: "Watch the latest Bangladesh news videos from top Bangladeshi TV channels and news sources on YouTube.",
  keywords: [
    "Bangladesh news videos",
    "Bangladesh YouTube news",
    "Bangladesh news channels",
    "Somoy TV", "Jamuna TV", "ATN Bangla", "Channel 24",
    "Bangladesh news video aggregation",
    "Bangladesh news YouTube channels"
  ],
};

export default async function YouTubePage() {
  const initialData = await getYouTubeVideos();
  
  return <YouTubeNews initialData={initialData} />;
}