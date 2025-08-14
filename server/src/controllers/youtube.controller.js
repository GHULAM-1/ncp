// YouTube Controller
const https = require('https');
const http = require('http');
const configService = require('../services/config.service');

// Helper function to make HTTP requests (replaces global fetch)
async function makeHttpRequest(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;
        const req = protocol.request(url, { method: 'GET' }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ ok: res.statusCode < 400, status: res.statusCode, json: () => jsonData });
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

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

    // Get configuration from SheetDB
    const contentTypes = await configService.getYouTubeConfig();
    
    if (!contentTypes[type]) {
      return res.status(400).json({
        error: "Invalid content type. Available types: channels, talkshows, youtube"
      });
    }
    console.log(`🎯 Fetching ${type} content from dynamic configuration`);

    const config = contentTypes[type];
    const { maxResults = 100 } = req.query; // Default maxResults is 100

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
      youtubeResponse = await fetchYouTubeVideos(config.channels, maxResults, apiKey);
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
    
    // Handle YouTube API quota exceeded specifically
    if (error.message.includes('quota exceeded')) {
      return res.status(429).json({
        error: "YouTube API quota exceeded",
        message: "The YouTube API quota has been exceeded. Please try again later.",
        retryAfter: "1 hour",
        suggestion: "Contact administrator to increase API quota or wait for quota reset"
      });
    }
    
    res.status(500).json({
      error: "Failed to fetch videos",
      message: error.message,
    });
  }
};

// Function to fetch YouTube videos
const fetchYouTubeVideos = async (channels, maxResults, apiKey) => {
    // Default search query for Bangladesh news
    const searchQuery = "Bangladesh news politics latest";
  const allVideos = [];
  const maxApiResults = 50; // YouTube API max per request
  const totalRequests = Math.ceil(maxResults * 3 / maxApiResults); // Request more to account for filtering
  
  console.log(`🔄 Making ${totalRequests} requests to get more videos...`);
  
  let nextPageToken = '';
  for (let i = 0; i < totalRequests; i++) {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(
      searchQuery
    )}&part=snippet&order=date&type=video&maxResults=${maxApiResults}&pageToken=${nextPageToken}`;

    const response = await makeHttpRequest(url);

    const responseData = response.json();
    if (responseData.error) {
      if (responseData.error.code === 403 && responseData.error.message.includes('quota')) {
        throw new Error('YouTube API quota exceeded. Please try again later or contact administrator.');
      }
      throw new Error(`YouTube API Error: ${responseData.error.message}`);
    }

    console.log(`📡 Request ${i + 1}: YouTube API returned ${response.json().items.length} videos`);
    allVideos.push(...response.json().items);
    
    // Update nextPageToken for next iteration
    nextPageToken = response.json().nextPageToken || '';
    
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
      const channelInfo = await makeHttpRequest(channelInfoUrl);
      
      if (!channelInfo.ok) {
        console.warn(`Could not find channel info for: @${channelHandle}`);
        continue;
      }
      
      const channelId = channelInfo.json().items[0].id;
      console.log(`Found channel ID ${channelId} for @${channelHandle}`);
      
      // Now fetch videos from this channel
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&type=video&maxResults=${Math.min(50, maxResults * 2)}`;
      const response = await makeHttpRequest(videosUrl);
      
      if (!response.ok) {
        console.warn(`YouTube API Error for channel @${channelHandle}: ${response.json().error.message}`);
        continue;
      }
      
      console.log(`YouTube API returned ${response.json().items.length} videos for channel @${channelHandle}`);
      
      response.json().items.forEach(item => {
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
      const response = await makeHttpRequest(url);

      if (!response.ok) {
        console.warn(`YouTube API Error for playlist ${playlistId}: ${response.json().error.message}`);
        continue;
      }

      console.log(`YouTube API returned ${response.json().items.length} videos for playlist ${playlistId}`);

      response.json().items.forEach(item => {
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
