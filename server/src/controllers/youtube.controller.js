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
         // console.log("here areeeee",contentTypes); // Removed verbose logging
    
    if (!contentTypes[type]) {
      return res.status(400).json({
        error: "Invalid content type. Available types: channels, talkshows, youtube"
      });
    }
    console.log(`🎯 Fetching ${type} content from dynamic configuration`);

         const config = contentTypes[type];
     const { maxResults = 10 } = req.query; // Default maxResults is 100

     console.log(`🎯 Fetching ${type} content with ${maxResults} max results`);
     console.log(`🔧 Config for ${type}:`, JSON.stringify(config, null, 2));

    let youtubeResponse = [];
    let playlistResponse = [];

         // For talkshows, only fetch from playlists
     if (type === 'talkshows' && config.playlists) {
       playlistResponse = await fetchPlaylistVideos(config.playlists, maxResults, apiKey);
       console.log("📺 Playlist ID:", config.playlists[0]);
     } else if (type === 'youtube' && config.channelUrls) {
      // For youtube type, fetch from specific channel URLs
             youtubeResponse = await fetchChannelVideos(config.channelUrls, maxResults, apiKey);
       console.log("📱 Channel URL:", config.channelUrls[0]);
    } else {
           // For other types, fetch from search
     if (!config.channels || config.channels.length === 0) {
       console.log(`⚠️ No channels configured for ${type}, using fallback search`);
       youtubeResponse = await fetchYouTubeVideos(['Bangladesh news'], maxResults, apiKey);
     } else {
                youtubeResponse = await fetchYouTubeVideos(config.channels, maxResults, apiKey);
         console.log("📺 Channels:", config.channels.join(", "));
     }
    }

         // Process and combine results
     const allVideos = [...youtubeResponse, ...playlistResponse];
     
     // Sort by date (no deduplication needed since we handle it per channel)
     allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

         const sourceInfo = type === 'talkshows' 
       ? `${playlistResponse.length} from playlists`
       : `${youtubeResponse.length} from YouTube search, ${playlistResponse.length} from playlists`;
     
     console.log(`✅ ${type}: ${allVideos.length} total videos (${sourceInfo})`);
     console.log(`📄 Page ${page}: showing ${startIndex + 1}-${Math.min(endIndex, allVideos.length)} of ${allVideos.length}`);

         res.json({
       success: true,
       type: type,
       count: allVideos.length,
       videos: allVideos.slice(startIndex, endIndex),
       page: page,
       limit: limit,
       hasMore: endIndex < allVideos.length,
       sources: {
         youtube: youtubeResponse.length,
         playlists: playlistResponse.length,
         total: allVideos.length
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

// Function to fetch YouTube videos directly from specific channels
const fetchYouTubeVideos = async (channels, maxResults, apiKey) => {
  const allVideos = [];
  
  // Fetch videos directly from each channel instead of general search
  for (const channelName of channels) {
    try {
      console.log(`🔍 Fetching videos from channel: "${channelName}"`);
      
                     // Use channel-specific search to get unique videos from each channel
        const searchQueries = [
          `${channelName} news`,
          `${channelName} latest`,
          `${channelName} bulletin`,
          `${channelName} update`
        ];
        
        let channelVideos = [];
        
        for (const query of searchQueries) {
          const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(query)}&part=snippet&order=date&type=video&maxResults=${Math.min(15, maxResults)}`;
          
          const response = await makeHttpRequest(url);
          
          if (response.json().error) {
            if (response.json().error.code === 403 && response.json().error.message.includes('quota')) {
              throw new Error('YouTube API quota exceeded. Please try again later or contact administrator.');
            }
            throw new Error(`YouTube API Error: ${response.json().error.message}`);
          }
          
          const videos = response.json().items;
          
          // Filter videos that are actually from this channel
          const filteredVideos = videos.filter(video => 
            video.snippet.channelTitle.toLowerCase().includes(channelName.toLowerCase()) ||
            channelName.toLowerCase().includes(video.snippet.channelTitle.toLowerCase())
          );
          
          // Add only videos we don't already have
          filteredVideos.forEach(video => {
            const exists = channelVideos.some(existing => existing.videoId === video.videoId);
            if (!exists) {
              channelVideos.push(video);
            }
          });
          
          // Small delay to be respectful to API
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // If we have enough videos, break early
          if (channelVideos.length >= maxResults) break;
        }
        
        console.log(`✅ Found ${channelVideos.length} unique videos from "${channelName}"`);
        allVideos.push(...channelVideos);
        
        // Small delay to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`Error fetching videos for channel "${channelName}":`, error.message);
    }
  }
  
     console.log(`🎯 Total videos from all channels: ${allVideos.length}`);
   
       // Log channel distribution
    const channelCounts = {};
    allVideos.forEach(video => {
      const channel = video.snippet.channelTitle;
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });
    console.log('📊 Channel distribution:', channelCounts);
    
    // Sort by date (no deduplication needed since we handle it per channel)
    allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));
    
    console.log(`✅ Final videos: ${allVideos.length}`);
  
     return allVideos.map((item) => {
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

// Legacy function for backward compatibility
const searchBangladeshNews = async (req, res) => {
  req.query.type = 'channels';
  return getVideosByType(req, res);
};

module.exports = {
  searchBangladeshNews,
  getVideosByType,
};
