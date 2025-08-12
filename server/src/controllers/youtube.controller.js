// YouTube Controller
const https = require('https');

// Content type configurations
const CONTENT_TYPES = {
  channels: {
    searchQuery: "Bangladesh news politics latest",
    channels: [
      // Major Bangladeshi News Channels
      "Somoy TV", "Jamuna TV", "ATN News", "Channel 24", "DBC News",
      "Independent TV", "Ekattor TV", "News24 BD", "Bangla Vision",
      "Maasranga TV", "NTV Bangladesh", "Channel i", "Boishakhi TV",
      "RTV", "Gazi TV", "BanglaTV", "Desh TV", "Global TV News",
      "SATV", "MY TV",
      // International News Channels
      "Al Jazeera English", "BBC News Bangla", "DW Bangla", "TRT World",
      "BBC News", "VOA Bangla"
    ],
    maxResults: 100
  },
  talkshows: {
    playlists: [
      "PLO_Gwx3ZefnVLAf9ygmFJ0P98T1ONNSb3",
      "PLvaPMOKVZLDGuiutnNiw3XA6CAThQwYli",
      "PLCEH8lWGo0VGLaQ8XJppkIqV3mOYPvO93",
      "PL452k3Pdf5mLIv77RgATVYs6vA3pZQAbJ",
      "PL452k3Pdf5mJp6XSWDfoh9qiWa3tS5ouU",
      "PLc_kkJn0dwWvlVQmfEkBcbdXKjdUvEXAo",
      "PLx-2-qPB6h_tRWE5ze_TXUNnN7vvyVxSO",
      "PLyIUJWkJsJ9foKbKOBR7ahnG8gU6kNaLq",
      "PLc0L9mM0RWAv9WXBKghsXDhCA2HAqWKdR",
      "PLO_Gwx3ZefnVLAf9ygmFJ0P98T1ONNSb3",
      "PLCEH8lWGo0VFvfvCtmlC61wp658GxIyHT",
      "PLMtDlkozHHFe2DSSgP976XMOXFHsACs6X",
      "PLAQmWbFYOcadG83b034uWIeHjuxKuAVU-",
      "PLFv6mvxs9kPNKuyt_TXOrJ6-OpNNwxAO-",
      "PLyIUJWkJsJ9dHSeaWuVq-F-kTxp9IB2fA",
      "PLpqwqQnMCaTvQ3ogr-AEWO06W0mWjoSCF",
      "PLx4tNTRz-dJ3BgbPRqR6VUoT__FHbqP6b",
      "PLAHVDBLW1GY4h1MCE5EcMGs6XQGnUEncf",
      "PLFv6mvxs9kPMwdI2efnIy-oAkFpRM3ZCU"
    ],
    maxResults: 100
  },
  youtube: {
    channelUrls: [
      "https://www.youtube.com/@EtvTalkShow",
      "https://www.youtube.com/@Counternarrative-TBD",
      "https://www.youtube.com/@zahedstakebd/videos",
      "https://www.youtube.com/@PinakiBhattacharya/videos",
      "https://www.youtube.com/@ATNBanglaTalkShow/videos",
      "https://www.youtube.com/@zillur_rahman/videos",
      "https://www.youtube.com/@ThikanayKhaledMuhiuddin/streams",
      "https://www.youtube.com/@kanaksarwarnews/streams",
      "https://www.youtube.com/@EliasHossain/streams"
    ],
    maxResults: 100
  }
};

// Main function to get videos by content type
const getVideosByType = async (req, res) => {
  try {
    const { type = 'channels' } = req.query;
    const apiKey = process.env.YT_API_KEY;

    if (!apiKey) {
      return res.status(400).json({
        error: "YouTube API key is required",
      });
    }

    if (!CONTENT_TYPES[type]) {
      return res.status(400).json({
        error: "Invalid content type. Available types: channels, talkshows, youtube"
      });
    }
    console.log(type);

    const config = CONTENT_TYPES[type];
    const { maxResults = config.maxResults } = req.query;

    console.log(`🎯 Fetching ${type} content with ${maxResults} max results`);

    let youtubeResponse = [];
    let playlistResponse = [];

    // For talkshows, only fetch from playlists
    if (type === 'talkshows' && config.playlists) {
      playlistResponse = await fetchPlaylistVideos(config.playlists, maxResults, apiKey);
    } else if (type === 'youtube' && config.channelUrls) {
      // For youtube type, fetch from specific channel URLs
      youtubeResponse = await fetchChannelVideos(config.channelUrls, maxResults, apiKey);
    } else {
      // For other types, fetch from search
      youtubeResponse = await fetchYouTubeVideos(config.searchQuery, config.channels, maxResults, apiKey);
    }

    // Process and combine results
    const allVideos = [...youtubeResponse, ...playlistResponse];
    
    // Remove duplicates and sort
    const uniqueVideos = allVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.videoId === video.videoId)
    );

    uniqueVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const sourceInfo = type === 'talkshows' 
      ? `${playlistResponse.length} from playlists`
      : `${youtubeResponse.length} from YouTube search, ${playlistResponse.length} from playlists`;
    
    console.log(`✅ ${type}: ${uniqueVideos.length} total videos (${sourceInfo})`);
    console.log(`📄 Page ${page}: showing ${startIndex + 1}-${Math.min(endIndex, uniqueVideos.length)} of ${uniqueVideos.length}`);

    res.json({
      success: true,
      type: type,
      count: uniqueVideos.length,
      videos: uniqueVideos.slice(startIndex, endIndex),
      page: page,
      limit: limit,
      hasMore: endIndex < uniqueVideos.length,
      sources: {
        youtube: youtubeResponse.length,
        playlists: playlistResponse.length,
        total: uniqueVideos.length
      },
      config: {
        searchQuery: config.searchQuery || null,
        channelsCount: config.channels ? config.channels.length : 0,
        playlistsCount: config.playlists ? config.playlists.length : 0,
        maxResults: maxResults
      }
    });

  } catch (error) {
    console.error(`Error fetching ${req.query.type} videos:`, error);
    res.status(500).json({
      error: "Failed to fetch videos",
      message: error.message,
    });
  }
};

// Function to fetch YouTube videos
const fetchYouTubeVideos = async (searchQuery, channels, maxResults, apiKey) => {
  const allVideos = [];
  const maxApiResults = 50; // YouTube API max per request
  const totalRequests = Math.ceil(maxResults * 3 / maxApiResults); // Request more to account for filtering
  
  console.log(`🔄 Making ${totalRequests} requests to get more videos...`);
  
  let nextPageToken = '';
  for (let i = 0; i < totalRequests; i++) {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(
      searchQuery
    )}&part=snippet&order=date&type=video&maxResults=${maxApiResults}&pageToken=${nextPageToken}`;

    const response = await fetch(url).then(res => res.json());

    if (response.error) {
      throw new Error(`YouTube API Error: ${response.error.message}`);
    }

    console.log(`📡 Request ${i + 1}: YouTube API returned ${response.items.length} videos`);
    allVideos.push(...response.items);
    
    // Update nextPageToken for next iteration
    nextPageToken = response.nextPageToken || '';
    
    // If no more pages, break
    if (!nextPageToken) {
      console.log('No more pages available from YouTube API');
      break;
    }
    
    // Small delay to be respectful to API
    if (i < totalRequests - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`🎯 Total videos from YouTube API: ${allVideos.length}`);

  // Debug: Show all channel titles from API response
  const allChannelTitles = [...new Set(allVideos.map(v => v.snippet.channelTitle))];
  console.log('🔍 All channel titles from API response:', allChannelTitles);

  // Filter by channels with more lenient matching
  let filteredVideos = allVideos.filter((item) => {
    const channelTitle = item.snippet.channelTitle;
    
    // Method 1: Exact substring matching
    let isMatch = channels.some((channel) =>
      channelTitle.toLowerCase().includes(channel.toLowerCase())
    );
    
    // Method 2: If no exact match, try partial matching
    if (!isMatch) {
      isMatch = channels.some((channel) => {
        const channelWords = channel.toLowerCase().split(' ');
        const titleWords = channelTitle.toLowerCase().split(' ');
        return channelWords.some(word => 
          titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
        );
      });
    }
    
    // Method 3: Try matching without spaces and special characters
    if (!isMatch) {
      isMatch = channels.some((channel) => {
        const cleanChannel = channel.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanTitle = channelTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanTitle.includes(cleanChannel) || cleanChannel.includes(cleanTitle);
      });
    }
    
    if (!isMatch) {
      console.log(`❌ No match for: "${channelTitle}"`);
    } else {
      console.log(`✅ Matched: "${channelTitle}"`);
    }
    
    return isMatch;
  });

  console.log(`After channel filtering: ${filteredVideos.length} videos`);
  console.log('✅ Matched channels:', [...new Set(filteredVideos.map(v => v.snippet.channelTitle))]);

  // Fallback: if no channels match, return top videos
  if (filteredVideos.length === 0) {
    console.log('No videos found from specified channels, falling back to top videos');
    filteredVideos = allVideos.slice(0, Math.min(maxResults, allVideos.length));
  }

  return filteredVideos.map((item) => {
    const thumbnails = item.snippet.thumbnails;
    const thumbnail = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";

    return {
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
      thumbnail: thumbnail,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      source: 'YouTube'
    };
  });
};

// Function to fetch videos from specific channels by their URLs
const fetchChannelVideos = async (channelUrls, maxResults, apiKey) => {
  const videos = [];
  
  for (const channelUrl of channelUrls) {
    try {
      // Extract channel handle from URL
      const channelHandle = channelUrl.match(/@([^\/]+)/)?.[1];
      if (!channelHandle) {
        console.warn(`Could not extract channel handle from URL: ${channelUrl}`);
        continue;
      }
      
      console.log(`🔍 Checking channel: @${channelHandle}`);
      
      // First, get channel ID from handle
      const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forHandle=@${channelHandle}&part=id`;
      const channelInfo = await fetch(channelInfoUrl).then(res => res.json());
      
      if (channelInfo.error || !channelInfo.items || channelInfo.items.length === 0) {
        console.warn(`Could not find channel info for: @${channelHandle}`);
        continue;
      }
      
      const channelId = channelInfo.items[0].id;
      console.log(`Found channel ID ${channelId} for @${channelHandle}`);
      
      // Now fetch videos from this channel
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=${Math.min(50, maxResults * 2)}`;
      const response = await fetch(videosUrl).then(res => res.json());
      
      if (response.error) {
        console.warn(`YouTube API Error for channel @${channelHandle}: ${response.error.message}`);
        continue;
      }
      
      console.log(`YouTube API returned ${response.items.length} videos for channel @${channelHandle}`);
      
      response.items.forEach(item => {
        const thumbnails = item.snippet.thumbnails;
        const thumbnail = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";
        
        videos.push({
          title: item.snippet.title,
          videoId: item.id.videoId,
          url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          publishedAt: item.snippet.publishedAt,
          thumbnail: thumbnail,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          source: 'YouTube Channel',
          channelHandle: channelHandle
        });
      });
      
    } catch (error) {
      console.error(`Error fetching videos for channel ${channelUrl}:`, error);
    }
  }
  
  return videos;
};

// Function to fetch videos from a specific playlist
const fetchPlaylistVideos = async (playlistIds, maxResults, apiKey) => {
  const videos = [];
  
  for (const playlistId of playlistIds) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=snippet,contentDetails&maxResults=${Math.min(50, maxResults * 2)}`;
      const response = await fetch(url).then(res => res.json());

      if (response.error) {
        console.warn(`YouTube API Error for playlist ${playlistId}: ${response.error.message}`);
        continue;
      }

      console.log(`YouTube API returned ${response.items.length} videos for playlist ${playlistId}`);

      response.items.forEach(item => {
        const snippet = item.snippet;
        const thumbnails = snippet.thumbnails;
        const thumbnail = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || "";

        videos.push({
          title: snippet.title,
          videoId: item.contentDetails.videoId,
          url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
          publishedAt: snippet.publishedAt,
          thumbnail: thumbnail,
          description: snippet.description,
          channelTitle: snippet.channelTitle,
          source: 'YouTube Playlist',
          playlistId: playlistId
        });
      });
    } catch (error) {
      console.error(`Error fetching playlist ${playlistId}:`, error);
    }
  }
  
  return videos;
};


// Function to extract video links from Google Alerts
const extractVideoLinks = (xmlData) => {
  if (!xmlData) return [];
  
  const videos = [];
  const itemRegex = /<item>(.*?)<\/item>/gs;
  let match;
  
  while ((match = itemRegex.exec(xmlData)) !== null) {
    const item = match[1];
    
    try {
      const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s);
      const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
      
      const linkMatch = item.match(/<link>(.*?)<\/link>/s);
      const link = linkMatch ? linkMatch[1].trim() : '';
      
      const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
      const description = descMatch ? (descMatch[1] || descMatch[2] || '') : '';
      
      const youtubeMatch = description.match(/(https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/[^\s]+)/i);
      if (youtubeMatch) {
        const videoUrl = youtubeMatch[1];
        const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
        
        if (videoIdMatch) {
          const videoId = videoIdMatch[1];
          videos.push({
            title: title,
            videoId: videoId,
            url: videoUrl,
            publishedAt: new Date().toISOString(),
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            description: description.replace(/<[^>]*>/g, '').substring(0, 200),
            channelTitle: 'Google Alerts',
            source: 'Google Alerts'
          });
        }
      }
    } catch (error) {
      console.error('Error processing Google Alerts item:', error);
    }
  }
  
  return videos;
};

// Legacy function for backward compatibility
const searchBangladeshNews = async (req, res) => {
  req.query.type = 'channels';
  return getVideosByType(req, res);
};

module.exports = {
  searchBangladeshNews,
  getVideosByType,
};
