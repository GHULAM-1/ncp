import NewsFeed from "@/components/home/news-feed";
import { NewsCardProps } from "@/types/news-card-type";
import { formatDistanceToNow } from 'date-fns';

// ISR Configuration - revalidate every 2.5 hours (9000 seconds)
export const revalidate = 9000;

// Post limits for each platform
const POST_LIMITS = {
  RSS: 30,       // matches RSS page
  YOUTUBE: 20,   // matches YouTube page initial load
  FACEBOOK: 15   // matches Facebook page initial load
} as const;

// Global configurable timeout (default 55s to stay under Vercel's 60s limit)
const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS || 55000);

// Simple fetch with timeout to avoid long hangs during build/ISR
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Fetch data from each API directly, cache for 2 hours, then combine and return
async function getUnifiedFeed() {
  console.log('🏗️ [BUILD] getUnifiedFeed function started');
  console.log('🏗️ [BUILD] Server URL:', process.env.NEXT_PUBLIC_API_URL);
  
  try {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    console.log('🏗️ [BUILD] Starting API calls to:', serverUrl);
    
    // Run calls in parallel with timeouts so build never hangs >60s
    const [youtubeResponse, facebookResponse, rssResponse] = await Promise.allSettled([
      fetchWithTimeout(`${serverUrl}/youtube/videos?type=channels&maxResults=${POST_LIMITS.YOUTUBE}&page=1&limit=${POST_LIMITS.YOUTUBE}`, { next: { revalidate } }),
      fetchWithTimeout(`${serverUrl}/facebook/posts?maxPosts=${POST_LIMITS.FACEBOOK}&page=1&limit=${POST_LIMITS.FACEBOOK}`, { next: { revalidate } }),
      fetchWithTimeout(`${serverUrl}/news/bangladesh?page=1&limit=${POST_LIMITS.RSS}`, { next: { revalidate } }),
    ]);
    
    console.log('🏗️ [BUILD] API responses received:');
    console.log('🏗️ [BUILD] YouTube:', youtubeResponse.status === 'fulfilled' && youtubeResponse.value.ok ? 'success' : 'failed');
    console.log('🏗️ [BUILD] Facebook:', facebookResponse.status === 'fulfilled' && facebookResponse.value.ok ? 'success' : 'failed');
    console.log('🏗️ [BUILD] RSS:', rssResponse.status === 'fulfilled' && rssResponse.value.ok ? 'success' : 'failed');

    const allItems: any[] = [];
    
    // Process YouTube data
    if (youtubeResponse.status === 'fulfilled' && youtubeResponse.value.ok) {
      try {
        const data = await youtubeResponse.value.json();
        if (data.success && data.videos) {
          const youtubeItems = data.videos.map((video: any, index: number) => ({
            id: `yt_${video.videoId || index}`,
            title: video.title,
            description: video.description || '',
            link: video.videoUrl || video.url || `https://www.youtube.com/watch?v=${video.videoId}`,
            image: video.thumbnail,
            date: video.publishedAt,
            source: video.channelTitle || 'YouTube',
            platform: 'youtube',
            type: 'video',
            // Additional YouTube-specific data
            videoId: video.videoId,
            channelLogo: video.channelLogo,
            channelTitle: video.channelTitle,
            channelHandle: video.channelHandle,
            channelId: video.channelId,
            engagement: {
              views: video.viewCount || 0,
              likes: video.likeCount || 0,
              comments: video.commentCount || 0
            }
          }));
          allItems.push(...youtubeItems);
        }
      } catch (error) {
        console.log('🏗️ [BUILD] Failed to process YouTube data:', error);
      }
    }

    // Process Facebook data
    if (facebookResponse.status === 'fulfilled' && facebookResponse.value.ok) {
      try {
        const data = await facebookResponse.value.json();
        if (data.success && data.posts) {
          const facebookItems = data.posts.map((post: any, index: number) => ({
            id: `fb_${post.postId || index}`,
            title: post.title,
            description: post.description || '',
            link: post.url || '#',
            image: post.image,
            date: post.publishedAt,
            source: post.source || post.author || 'Facebook',
            platform: 'facebook',
            type: post.type || 'post',
            // Additional Facebook-specific data
            author: post.author,
            profilePicture: post.profilePicture || null,
            postId: post.postId,
            engagement: {
              reactions: post.engagement?.totalReactions || 0,
              likes: post.engagement?.likes || 0,
              comments: post.engagement?.comments || 0,
              shares: post.engagement?.shares || 0
            }
          }));
          allItems.push(...facebookItems);
        }
      } catch (error) {
        console.log('🏗️ [BUILD] Failed to process Facebook data:', error);
      }
    }

    // Process RSS data
    if (rssResponse.status === 'fulfilled' && rssResponse.value.ok) {
      try {
        const data = await rssResponse.value.json();
        if (data.success && data.news) {
          const rssItems = data.news.map((item: any, index: number) => ({
            id: `rss_${index}`,
            title: item.title,
            description: item.description || '',
            link: item.link,
            image: item.image || null, // RSS now includes images
            date: item.date,
            source: item.source || 'RSS Feed',
            platform: 'rss',
            type: 'news',
            engagement: {
              views: 0,
              likes: 0,
              comments: 0
            }
          }));
          allItems.push(...rssItems);
        }
      } catch (error) {
        console.log('🏗️ [BUILD] Failed to process RSS data:', error);
      }
    }

    // Sort all items by date (most recent first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    });

    return {
      success: allItems.length > 0,
      items: allItems,
      lastUpdated: new Date().toISOString(),
    };

  } catch (error) {
    console.error('Error in unified feed function:', error);
    return {
      success: false,
      items: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default async function Page() {
  // Wait for the three routes to resolve (cached for 2 hours), then render
  const feedData = await getUnifiedFeed();
  
  // Transform data to match NewsCardProps format
  const newsItems: NewsCardProps[] = (feedData.items || []).map((item: any, index: number) => ({
    title: item.title,
    description: item.description,
    link: item.link,
    imageUrl: item.image,
    timeAgo: item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : undefined,
    author: item.author || item.source,
    date: item.date,
    source: item.source || '',
    platform: item.platform,
    type: item.type,
    profilePicture: item.profilePicture,
    engagement: item.engagement,
    slug: `${item.platform}-${index}`,
    id: item.id,
    // Pass through additional platform-specific data
    ...(item.platform === 'youtube' && {
      videoId: item.videoId,
      channelLogo: item.channelLogo,
      channelTitle: item.channelTitle,
      channelHandle: item.channelHandle,
      channelId: item.channelId,
    }),
    ...(item.platform === 'facebook' && {
      postId: item.postId,
    }),
  }));

  return (
    <main className="max-w-[840px] mx-auto px-4 py-4">      
      <NewsFeed newsItems={newsItems} />
    </main>
  );
}
