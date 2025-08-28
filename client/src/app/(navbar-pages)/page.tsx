import NewsFeed from "@/components/home/news-feed";
import { NewsCardProps } from "@/types/news-card-type";
import { formatDistanceToNow } from 'date-fns';

// ISR Configuration - revalidate every 2.5 hours (9000 seconds)
export const revalidate = 9000;

// Post limits for each platform
const POST_LIMITS = {
  RSS: 30,
  YOUTUBE: 20,
  FACEBOOK: 20
} as const;

// Fetch data from each API directly
async function getUnifiedFeed() {
  console.log('🏗️ [BUILD] getUnifiedFeed function started');
  console.log('🏗️ [BUILD] Server URL:', process.env.NEXT_PUBLIC_API_URL);
  
  try {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
    console.log('🏗️ [BUILD] Starting sequential API calls to:', serverUrl);
    
    // Sequential calls to avoid overwhelming the server (deployment-friendly)
    const youtubeResponse = await fetch(`${serverUrl}/youtube/videos?type=channels&maxResults=${POST_LIMITS.YOUTUBE}&page=1&limit=${POST_LIMITS.YOUTUBE}`);
    const facebookResponse = await fetch(`${serverUrl}/facebook/posts?maxPosts=${POST_LIMITS.FACEBOOK}&page=1&limit=${POST_LIMITS.FACEBOOK}`);
    const rssResponse = await fetch(`${serverUrl}/news/bangladesh?page=1&limit=${POST_LIMITS.RSS}`);
    
    console.log('🏗️ [BUILD] API responses received:');
    console.log('🏗️ [BUILD] YouTube:', youtubeResponse.ok ? 'success' : 'failed');
    console.log('🏗️ [BUILD] Facebook:', facebookResponse.ok ? 'success' : 'failed');
    console.log('🏗️ [BUILD] RSS:', rssResponse.ok ? 'success' : 'failed');

    const allItems = [];
    
    // Process YouTube data
    if (youtubeResponse.ok) {
      try {
        const data = await youtubeResponse.json();
        if (data.success && data.videos) {
          const youtubeItems = data.videos.map((video: any, index: number) => ({
            id: `yt_${video.videoId || index}`,
            title: video.title,
            description: video.description || '',
            link: video.videoUrl || `https://www.youtube.com/watch?v=${video.videoId}`,
            image: video.thumbnail,
            date: video.publishedAt,
            source: video.channelTitle || 'YouTube',
            platform: 'youtube',
            type: 'video',
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
    if (facebookResponse.ok) {
      try {
        const data = await facebookResponse.json();
        if (data.success && data.posts) {
          const facebookItems = data.posts.map((post: any, index: number) => ({
            id: `fb_${post.postId || index}`,
            title: post.title,
            description: post.description || '',
            link: post.url || '#',
            image: post.image,
            date: post.publishedAt,
            source: post.author || 'Facebook',
            platform: 'facebook',
            type: post.type || 'post',
            profilePicture: post.profilePicture || null,
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
    if (rssResponse.ok) {
      try {
        const data = await rssResponse.json();
        if (data.success && data.news) {
          const rssItems = data.news.map((item: any, index: number) => ({
            id: `rss_${index}`,
            title: item.title,
            description: item.description || '',
            link: item.link,
            image: null, // RSS typically doesn't have images
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

    // Return success even if some APIs failed, as long as we have some data
    const hasData = allItems.length > 0;
    return {
      success: hasData,
      items: allItems,
      sources: {
        youtube: allItems.filter(item => item.platform === 'youtube').length,
        facebook: allItems.filter(item => item.platform === 'facebook').length,
        rss: allItems.filter(item => item.platform === 'rss').length,
        total: allItems.length
      },
      lastUpdated: new Date().toISOString(),
      errors: {
        youtube: !youtubeResponse.ok ? 'Failed to fetch' : null,
        facebook: !facebookResponse.ok ? 'Failed to fetch' : null,
        rss: !rssResponse.ok ? 'Failed to fetch' : null
      }
    };

  } catch (error) {
    console.error('Error in unified feed function:', error);
    // Even if there's a critical error, try to return any data we might have
    return {
      success: false,
      items: [],
      sources: { youtube: 0, facebook: 0, rss: 0, total: 0 },
      lastUpdated: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default async function Page() {
  const feedData = await getUnifiedFeed();
  
  // Transform data to match NewsCardProps format
  const newsItems: NewsCardProps[] = feedData.items?.map((item: any, index: number) => ({
    title: item.title,
    description: item.description,
    link: item.link,
    imageUrl: item.image,
    timeAgo: item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : undefined,
    author: item.author,
    date: item.date,
    source: item.source,
    platform: item.platform,
    type: item.type,
    profilePicture: item.profilePicture,
    engagement: item.engagement,
    slug: `${item.platform}-${index}`,
    id: item.id
  })) || [];

  return (
    <main className="max-w-[840px] mx-auto">      
      <NewsFeed newsItems={newsItems} />
    </main>
  );
}
