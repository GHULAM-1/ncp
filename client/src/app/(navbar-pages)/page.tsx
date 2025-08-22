import NewsFeed from "@/components/home/news-feed";
import { NewsCardProps } from "@/types/news-card-type";

// ISR Configuration - revalidate every 2.5 hours (9000 seconds)
export const revalidate = 9000;
// Fetch data from each API directly
async function getUnifiedFeed() {
  console.log('🏗️ [BUILD] getUnifiedFeed function started');
  console.log('🏗️ [BUILD] Server URL:', process.env.NEXT_PUBLIC_API_URL);
  
  try {
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    
    // Fetch data from all sources concurrently
    console.log('🏗️ [BUILD] Starting API calls to:', serverUrl);
    
    const [youtubeResponse, facebookResponse, rssResponse] = await Promise.allSettled([
      fetch(`${serverUrl}/api/youtube/videos?type=channels&maxResults=20&page=1&limit=20`),
      fetch(`${serverUrl}/api/facebook/posts?maxPosts=20&page=1&limit=20`),
      fetch(`${serverUrl}/api/news/bangladesh?page=1&limit=20`)
    ]);
    
    console.log('🏗️ [BUILD] API responses received:');
    console.log('🏗️ [BUILD] YouTube:', youtubeResponse.status);
    console.log('🏗️ [BUILD] Facebook:', facebookResponse.status);
    console.log('🏗️ [BUILD] RSS:', rssResponse.status);

    const allItems = [];
    
    // Process YouTube data
    if (youtubeResponse.status === 'fulfilled' && youtubeResponse.value.ok) {
      const data = await youtubeResponse.value.json();
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
    }

    // Process Facebook data
    if (facebookResponse.status === 'fulfilled' && facebookResponse.value.ok) {
      const data = await facebookResponse.value.json();
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
    }

    // Process RSS data
    if (rssResponse.status === 'fulfilled' && rssResponse.value.ok) {
      const data = await rssResponse.value.json();
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
        youtube: youtubeResponse.status === 'rejected' ? 'Failed to fetch' : null,
        facebook: facebookResponse.status === 'rejected' ? 'Failed to fetch' : null,
        rss: rssResponse.status === 'rejected' ? 'Failed to fetch' : null
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
    image: item.image,
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
      {/* Feed Header with Source Stats */}
      {feedData.success && (
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Unified News Feed
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span>YouTube: {feedData.sources?.youtube || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span>Facebook: {feedData.sources?.facebook || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>RSS: {feedData.sources?.rss || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <span>Total: {feedData.sources?.total || 0}</span>
            </div>
          </div>
          {feedData.lastUpdated && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Last updated: {new Date(feedData.lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
      )}
      
      <NewsFeed newsItems={newsItems} />
    </main>
  );
}
