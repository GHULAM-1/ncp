import { NextRequest, NextResponse } from 'next/server';

// Unified Feed API - fetches from all sources and combines them
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5001';
    
    // Fetch data from all sources concurrently using simple fetch
    const [youtubeData, facebookData, rssData] = await Promise.allSettled([
      fetch(`${serverUrl}/api/youtube/videos?type=channels&maxResults=20&page=1&limit=20`),
      fetch(`${serverUrl}/api/facebook/posts?maxPosts=20&page=1&limit=20`),
      fetch(`${serverUrl}/api/news/bangladesh?page=1&limit=20`)
    ]);

    // Process and combine all data
    const allItems = [];
    
    // Process YouTube data
    if (youtubeData.status === 'fulfilled' && youtubeData.value.ok) {
      const data = await youtubeData.value.json();
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
    if (facebookData.status === 'fulfilled' && facebookData.value.ok) {
      const data = await facebookData.value.json();
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
    if (rssData.status === 'fulfilled' && rssData.value.ok) {
      const data = await rssData.value.json();
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

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      count: allItems.length,
      items: allItems.slice(startIndex, endIndex),
      page,
      limit,
      hasMore: endIndex < allItems.length,
      sources: {
        youtube: allItems.filter(item => item.platform === 'youtube').length,
        facebook: allItems.filter(item => item.platform === 'facebook').length,
        rss: allItems.filter(item => item.platform === 'rss').length,
        total: allItems.length
      },
      performance: {
        executionTimeMs: executionTime,
        executionTimeSeconds: (executionTime / 1000).toFixed(2)
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in unified feed API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch unified feed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 