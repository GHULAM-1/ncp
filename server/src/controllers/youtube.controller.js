// YouTube Controller
//
// Content Type Behavior:
// - 'channels' (News Channels): Fetches regular videos from channels, EXCLUDES Shorts
// - 'talkshows': Fetches from playlists, EXCLUDES Shorts
// - 'youtube': Fetches Shorts from channel URLs in YOUTUBE_CONFIG_SHEET_ID
//
// 🎲 AUTO-SHUFFLE: Videos are automatically shuffled for random display order
//
const https = require("https");
const http = require("http");
const configService = require("../services/config.service");

// Function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to make HTTP requests (replaces global fetch)
async function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;
    const req = protocol.request(url, { method: "GET" }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode < 400,
            status: res.statusCode,
            json: () => jsonData,
          });
        } catch (e) {
          reject(new Error("Invalid JSON response"));
        }
      });
    });
    req.on("error", reject);
    req.end();
  });
}

// Main function to get videos by content type
const getVideosByType = async (req, res) => {
  try {
    const { type = "channels" } = req.query;
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
        error:
          "Invalid content type. Available types: channels, talkshows, youtube",
      });
    }
    console.log(`🎯 Fetching ${type} content from dynamic configuration`);

    const config = contentTypes[type];
    const { maxResults = 10 } = req.query; // Default maxResults is 10

    console.log(`🎯 Fetching ${type} content with ${maxResults} max results`);
    console.log(`🔧 Config for ${type}:`, JSON.stringify(config, null, 2));

    let youtubeResponse = [];
    let playlistResponse = [];

    // For talkshows, only fetch from playlists (EXCLUDES Shorts)
    if (type === "talkshows" && config.playlists) {
      console.log(`📺 Processing ${config.playlists.length} playlists:`, config.playlists);
      playlistResponse = await fetchPlaylistVideos(
        config.playlists,
        maxResults,
        apiKey
      );
      console.log(`📺 All playlist IDs processed:`, config.playlists);
    } else if (type === "youtube" && config.channelUrls) {
      // For youtube type, fetch Shorts from specific channel URLs
      console.log(`📱 Attempting to fetch Shorts from ${config.channelUrls.length} channels...`);
      youtubeResponse = await fetchShortsFromChannels(
        config.channelUrls,
        maxResults,
        apiKey
      );
      console.log(
        `📱 Shorts fetch result: ${youtubeResponse.length} videos found`
      );
      
      // Debug: Log each channel URL being processed
      config.channelUrls.forEach((url, index) => {
        console.log(`📱 Channel ${index + 1}: ${url}`);
      });
    } else {
      // For news channels and other types, fetch from search (EXCLUDES Shorts)
      if (!config.channels || config.channels.length === 0) {
        console.log(
          `⚠️ No channels configured for ${type}, using fallback search`
        );
        youtubeResponse = await fetchYouTubeVideos(
          ["Bangladesh news"],
          maxResults,
          apiKey
        );
      } else {
        youtubeResponse = await fetchYouTubeVideos(
          config.channels,
          maxResults,
          apiKey
        );
        console.log("📺 Channels:", config.channels.join(", "));
      }
    }

    // Process and combine results
    const allVideos = [...youtubeResponse, ...playlistResponse];

    // Sort by date first (no deduplication needed since we handle it per channel)
    allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // 🎲 AUTO-SHUFFLE: Shuffle videos for random display order
    const shuffledVideos = shuffleArray(allVideos);
    console.log(`🎲 Videos shuffled for random display order`);

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const sourceInfo =
      type === "talkshows"
        ? `${playlistResponse.length} from playlists`
        : `${youtubeResponse.length} from YouTube search, ${playlistResponse.length} from playlists`;

    // For talkshows, show detailed playlist distribution
    if (type === "talkshows" && playlistResponse.length > 0) {
      const playlistDistribution = {};
      playlistResponse.forEach(video => {
        playlistDistribution[video.playlistId] = (playlistDistribution[video.playlistId] || 0) + 1;
      });
      console.log(`📊 Final playlist distribution in response:`, playlistDistribution);
    }

    console.log(
      `✅ ${type}: ${shuffledVideos.length} total videos (${sourceInfo})`
    );
    console.log(
      `📄 Page ${page}: showing ${startIndex + 1}-${Math.min(
        endIndex,
        shuffledVideos.length
      )} of ${shuffledVideos.length}`
    );

    res.json({
      success: true,
      type: type,
      count: shuffledVideos.length,
      videos: shuffledVideos.slice(startIndex, endIndex),
      page: page,
      limit: limit,
      hasMore: endIndex < shuffledVideos.length,
      sources: {
        youtube: youtubeResponse.length,
        playlists: playlistResponse.length,
        total: allVideos.length,
      },
      config: {
        searchQuery: config.searchQuery || null,
        channelsCount: config.channels ? config.channels.length : 0,
        playlistsCount: config.playlists ? config.playlists.length : 0,
        maxResults: maxResults,
      },
    });
  } catch (error) {
    console.error(`Error fetching ${req.query.type} videos:`, error);

    // Handle YouTube API quota exceeded specifically
    if (error.message.includes("quota exceeded")) {
      return res.status(429).json({
        error: "YouTube API quota exceeded",
        message:
          "The YouTube API quota has been exceeded. Please try again later.",
        retryAfter: "1 hour",
        suggestion:
          "Contact administrator to increase API quota or wait for quota reset",
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
  const allChannelVideos = []; // Collect videos from all channels first

  // Fetch videos directly from each channel instead of general search
  for (const channelName of channels) {
    try {
      console.log(`🔍 Fetching videos from channel: "${channelName}"`);

      // Use channel-specific search to get unique videos from each channel
      const searchQueries = [
        `${channelName} news`,
        `${channelName} latest`,
        `${channelName} bulletin`,
        `${channelName} update`,
      ];

      let channelVideos = [];

      for (const query of searchQueries) {
        // IMPORTANT: Exclude Shorts by adding videoDuration=medium and excluding 'shorts' from search
        const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(
          query
        )}&part=snippet&order=date&type=video&maxResults=${maxResults}&videoDuration=medium`;

        const response = await makeHttpRequest(url);

        if (response.json().error) {
          if (
            response.json().error.code === 403 &&
            response.json().error.message.includes("quota")
          ) {
            throw new Error(
              "YouTube API quota exceeded. Please try again later or contact administrator."
            );
          }
          throw new Error(
            `YouTube API Error: ${response.json().error.message}`
          );
        }

        const videos = response.json().items;

        // Filter videos that are actually from this channel AND are NOT Shorts
        const filteredVideos = videos.filter((video) => {
          // Check if video is from this channel
          const isFromChannel =
            video.snippet.channelTitle
              .toLowerCase()
              .includes(channelName.toLowerCase()) ||
            channelName
              .toLowerCase()
              .includes(video.snippet.channelTitle.toLowerCase());

          // Check if video is NOT a Short (exclude titles containing 'shorts', 'short', etc.)
          const isNotShort =
            !video.snippet.title.toLowerCase().includes("shorts") &&
            !video.snippet.title.toLowerCase().includes("short") &&
            !video.snippet.title.toLowerCase().includes("vertical") &&
            !video.snippet.title.toLowerCase().includes("reel");

          return isFromChannel && isNotShort;
        });

        // Add only videos we don't already have
        filteredVideos.forEach((video) => {
          const exists = channelVideos.some(
            (existing) => existing.videoId === video.videoId
          );
          if (!exists) {
            channelVideos.push(video);
          }
        });

        // Small delay to be respectful to API
        await new Promise((resolve) => setTimeout(resolve, 100));

        // If we have enough videos, break early
        if (channelVideos.length >= maxResults) break;
      }

      console.log(
        `✅ Found ${channelVideos.length} unique videos (excluding Shorts) from "${channelName}"`
      );
      
      // Add all videos from this channel to the main collection
      allChannelVideos.push(...channelVideos);

      // Small delay to be respectful to API
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(
        `Error fetching videos for channel "${channelName}":`,
        error.message
      );
    }
  }

  console.log(
    `🎯 Total videos collected from all channels: ${allChannelVideos.length}`
  );

  // 🎲 SHUFFLE ALL VIDEOS TO ENSURE RANDOM MIXING FROM ALL SOURCES
  const shuffledVideos = shuffleArray(allChannelVideos);
  console.log(`🎲 All videos shuffled for random distribution from all channels`);

  // Sort by date (newest first) after shuffling
  shuffledVideos.sort(
    (a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
  );

  // Return only the requested number of videos
  const finalVideos = shuffledVideos.slice(0, maxResults);

  // Log distribution to show fair representation
  const channelDistribution = {};
  finalVideos.forEach(video => {
    const channel = video.snippet.channelTitle;
    channelDistribution[channel] = (channelDistribution[channel] || 0) + 1;
  });
  
  console.log("📊 Final distribution across channels:", channelDistribution);
  console.log(`✅ Returning ${finalVideos.length} shuffled videos from all channels`);

  return Promise.all(finalVideos.map(async (item) => {
    const thumbnails = item.snippet.thumbnails;
    const thumbnail =
      thumbnails.high?.url ||
      thumbnails.medium?.url ||
      thumbnails.default?.url ||
      "";

    // Fetch channel logo - defensive check for channelId
    const channelLogo = item.snippet.channelId ?
      await fetchChannelLogo(item.snippet.channelId, apiKey) : "";

    return {
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt,
      thumbnail: thumbnail,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      channelLogo: channelLogo,
      source: "YouTube",
    };
  }));
};

// Function to fetch Shorts from specific channels
const fetchShortsFromChannels = async (channelUrls, maxResults, apiKey) => {
  const channelVideosMap = new Map(); // Track videos per channel for fair distribution

  // First pass: collect all videos from all channels
  for (const channelUrl of channelUrls) {
    try {
      // Extract channel handle from URL
      const channelHandle = channelUrl.match(/@([^\/]+)/)?.[1];
      if (!channelHandle) {
        console.warn(
          `Could not extract channel handle from URL: ${channelUrl}`
        );
        continue;
      }

      console.log(`🔍 Fetching Shorts from channel: @${channelHandle}`);

      // First, get channel ID and uploads playlist ID from handle
      const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&forHandle=@${channelHandle}&part=id,contentDetails`;
      const channelInfo = await makeHttpRequest(channelInfoUrl);

      if (!channelInfo.ok) {
        console.warn(`Could not find channel info for: @${channelHandle}`);
        continue;
      }

      const channelId = channelInfo.json().items[0].id;
      const uploadsPlaylistId = channelInfo.json().items[0].contentDetails.relatedPlaylists.uploads;
      
      console.log(`Found channel ID ${channelId} for @${channelHandle}`);
      console.log(`Uploads playlist ID: ${uploadsPlaylistId}`);

      // CORRECT METHOD: Get videos from the channel's uploads playlist
      // This is the same as what you see in the /shorts tab
      const uploadsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${uploadsPlaylistId}&part=snippet,contentDetails&maxResults=${maxResults}`;
      
      console.log(`🔍 Getting videos from uploads playlist to find actual Shorts...`);
      
      const response = await makeHttpRequest(uploadsUrl);

      if (!response.ok) {
        console.warn(
          `YouTube API Error for uploads playlist in channel @${channelHandle}: ${
            response.json().error.message
          }`
        );
        continue;
      }

      const uploadVideos = response.json().items;
      console.log(`Found ${uploadVideos.length} videos in uploads playlist from channel @${channelHandle}`);

      const channelVideos = []; // Store videos for this specific channel

      // Now we need to get the actual duration of each video to identify Shorts
      // Shorts are typically under 60 seconds (1 minute)
      for (const item of uploadVideos) {
        try {
          // Get video details including duration
          const videoDetailsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${item.contentDetails.videoId}&part=contentDetails,statistics,snippet`;
          const videoDetailsResponse = await makeHttpRequest(videoDetailsUrl);

          if (videoDetailsResponse.ok && videoDetailsResponse.json().items.length > 0) {
            const videoDetails = videoDetailsResponse.json().items[0];
            const duration = videoDetails.contentDetails.duration; // ISO 8601 format like "PT1M30S"

            // Parse duration and check if it's a Short (under 60 seconds = 1 minute)
            const durationInSeconds = parseDuration(duration);
            const isShort = durationInSeconds <= 60;

            console.log(`Video: ${videoDetails.snippet.title} - Duration: ${duration} (${durationInSeconds}s) - Is Short: ${isShort}`);

            if (isShort) {
              const thumbnails = videoDetails.snippet.thumbnails;
              const thumbnail =
                thumbnails.high?.url ||
                thumbnails.medium?.url ||
                thumbnails.default?.url ||
                "";

              // Fetch channel logo - channelId is already validated from channel lookup
              const channelLogo = channelId ?
                await fetchChannelLogo(channelId, apiKey) : "";

              // Add to channel's video collection
              channelVideos.push({
                title: videoDetails.snippet.title,
                videoId: item.contentDetails.videoId,
                url: `https://www.youtube.com/shorts/${item.contentDetails.videoId}`, // Use /shorts/ URL format
                publishedAt: videoDetails.snippet.publishedAt,
                thumbnail: thumbnail,
                description: videoDetails.snippet.description,
                channelTitle: videoDetails.snippet.channelTitle,
                channelId: channelId,
                channelLogo: channelLogo,
                source: "YouTube Shorts",
                channelHandle: channelHandle,
                isShort: true,
                duration: duration,
                durationInSeconds: durationInSeconds,
              });
            }
          }

          // Small delay to be respectful to API
          await new Promise((resolve) => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Error getting details for video ${item.contentDetails.videoId}:`, error.message);
        }
      }

      // Store videos for this channel
      channelVideosMap.set(channelHandle, channelVideos);
      console.log(`✅ Found ${channelVideos.length} Shorts from channel @${channelHandle}`);

      // Small delay to be respectful to API
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching Shorts for channel ${channelUrl}:`, error);
    }
  }

  console.log(`🎯 Total Shorts collected from all channels: ${Array.from(channelVideosMap.values()).reduce((sum, videos) => sum + videos.length, 0)}`);
  
  // 🎲 IMPLEMENT FAIR DISTRIBUTION ACROSS ALL CHANNELS
  const finalVideos = [];
  const videosPerChannel = Math.ceil(maxResults / channelUrls.length);
  
  console.log(`📊 Implementing fair distribution: ${videosPerChannel} Shorts per channel (target: ${maxResults} total)`);
  
  // For each channel, take a proportional number of videos
  for (const [channelHandle, videos] of channelVideosMap) {
    if (videos.length > 0) {
      // Shuffle videos from this channel for variety
      const shuffledChannelVideos = shuffleArray(videos);
      
      // Take up to the proportional amount from this channel
      const videosToTake = Math.min(videosPerChannel, shuffledChannelVideos.length);
      const selectedVideos = shuffledChannelVideos.slice(0, videosToTake);
      
      finalVideos.push(...selectedVideos);
      
      console.log(`📱 Channel @${channelHandle}: contributing ${selectedVideos.length} Shorts`);
    }
  }
  
  // If we don't have enough videos, fill from remaining videos across all channels
  if (finalVideos.length < maxResults) {
    const remainingVideos = [];
    for (const [channelHandle, videos] of channelVideosMap) {
      const usedVideos = finalVideos.filter(v => v.channelHandle === channelHandle);
      const unusedVideos = videos.filter(v => !usedVideos.some(used => used.videoId === v.videoId));
      remainingVideos.push(...unusedVideos);
    }
    
    const shuffledRemaining = shuffleArray(remainingVideos);
    const additionalVideos = shuffledRemaining.slice(0, maxResults - finalVideos.length);
    finalVideos.push(...additionalVideos);
    
    console.log(`🔄 Added ${additionalVideos.length} additional Shorts to reach target`);
  }
  
  // 🎲 SHUFFLE ALL VIDEOS TO ENSURE RANDOM MIXING FROM ALL CHANNELS
  const shuffledVideos = shuffleArray(finalVideos);
  console.log(`🎲 All Shorts shuffled for random distribution from all channels`);
  
  // Sort by date (newest first) after shuffling
  shuffledVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  // Ensure we don't exceed maxResults
  const finalResult = shuffledVideos.slice(0, maxResults);
  
  // Log distribution to show fair representation
  const channelDistribution = {};
  finalResult.forEach(video => {
    channelDistribution[video.channelHandle] = (channelDistribution[video.channelHandle] || 0) + 1;
  });
  
  console.log(`📊 Final distribution across channels:`, channelDistribution);
  console.log(`✅ Returning ${finalResult.length} shuffled Shorts from all channels`);
  
  return finalResult;
};

// Helper function to parse YouTube duration (ISO 8601 format)
const parseDuration = (duration) => {
  // YouTube duration format: PT1M30S (1 minute 30 seconds)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;

  return hours * 3600 + minutes * 60 + seconds;
};

// Helper function to fetch channel logo
const fetchChannelLogo = async (channelId, apiKey) => {
  try {
    if (!channelId || !apiKey) {
      return "";
    }

    const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?key=${apiKey}&id=${channelId}&part=snippet`;
    const response = await makeHttpRequest(channelInfoUrl);

    if (response.ok && response.json().items && response.json().items.length > 0) {
      const channelData = response.json().items[0];
      const thumbnails = channelData.snippet.thumbnails;
      return thumbnails.high?.url ||
             thumbnails.medium?.url ||
             thumbnails.default?.url ||
             "";
    }
  } catch (error) {
    console.error(`Error fetching channel logo for ${channelId}:`, error.message);
  }
  return "";
};

// Function to fetch videos from a specific playlist
const fetchPlaylistVideos = async (playlistIds, maxResults, apiKey) => {
  const allPlaylistVideos = []; // Collect videos from all playlists first
  const playlistVideosMap = new Map(); // Track videos per playlist for fair distribution

  // First pass: collect all videos from all playlists
  for (const playlistId of playlistIds) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?key=${apiKey}&playlistId=${playlistId}&part=snippet,contentDetails&maxResults=${maxResults}`;
      const response = await makeHttpRequest(url);

      if (!response.ok) {
        console.warn(
          `YouTube API Error for playlist ${playlistId}: ${
            response.json().error.message
          }`
        );
        continue;
      }

      console.log(
        `YouTube API returned ${
          response.json().items.length
        } videos for playlist ${playlistId}`
      );

      const playlistVideos = [];
      for (const item of response.json().items) {
        const snippet = item.snippet;

        // IMPORTANT: Filter out Shorts from playlist videos
        const isNotShort =
          !snippet.title.toLowerCase().includes("shorts") &&
          !snippet.title.toLowerCase().includes("short") &&
          !snippet.title.toLowerCase().includes("vertical") &&
          !snippet.title.toLowerCase().includes("reel");

        // Only add videos that are NOT Shorts
        if (isNotShort) {
          const thumbnails = snippet.thumbnails;
          const thumbnail =
            thumbnails.high?.url ||
            thumbnails.medium?.url ||
            thumbnails.default?.url ||
            "";

          // Fetch channel logo - use videoOwnerChannelId for playlist items (video owner, not playlist owner)
          const videoChannelId = snippet.videoOwnerChannelId || snippet.channelId;
          const channelLogo = videoChannelId ?
            await fetchChannelLogo(videoChannelId, apiKey) : "";

          playlistVideos.push({
            title: snippet.title,
            videoId: item.contentDetails.videoId,
            url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
            publishedAt: snippet.publishedAt,
            thumbnail: thumbnail,
            description: snippet.description,
            channelTitle: snippet.channelTitle,
            channelId: videoChannelId,
            channelLogo: channelLogo,
            source: "YouTube Playlist",
            playlistId: playlistId,
          });
        }
      }

      // Store videos for this playlist
      playlistVideosMap.set(playlistId, playlistVideos);
      allPlaylistVideos.push(...playlistVideos);

      console.log(
        `✅ Filtered playlist ${playlistId}: ${playlistVideos.length} videos (excluding Shorts)`
      );
    } catch (error) {
      console.error(`Error fetching playlist ${playlistId}:`, error);
    }
  }

  console.log(`🎯 Total playlist videos collected from all playlists: ${allPlaylistVideos.length}`);
  
  // 🎲 IMPLEMENT FAIR DISTRIBUTION ACROSS ALL PLAYLISTS
  const finalVideos = [];
  const videosPerPlaylist = Math.ceil(maxResults / playlistIds.length);
  
  console.log(`📊 Implementing fair distribution: ${videosPerPlaylist} videos per playlist (target: ${maxResults} total)`);
  
  // For each playlist, take a proportional number of videos
  for (const [playlistId, videos] of playlistVideosMap) {
    if (videos.length > 0) {
      // Shuffle videos from this playlist for variety
      const shuffledPlaylistVideos = shuffleArray(videos);
      
      // Take up to the proportional amount from this playlist
      const videosToTake = Math.min(videosPerPlaylist, shuffledPlaylistVideos.length);
      const selectedVideos = shuffledPlaylistVideos.slice(0, videosToTake);
      
      finalVideos.push(...selectedVideos);
      
      console.log(`📺 Playlist ${playlistId}: contributing ${selectedVideos.length} videos`);
    }
  }
  
  // If we don't have enough videos, fill from remaining videos across all playlists
  if (finalVideos.length < maxResults) {
    const remainingVideos = [];
    for (const [playlistId, videos] of playlistVideosMap) {
      const usedVideos = finalVideos.filter(v => v.playlistId === playlistId);
      const unusedVideos = videos.filter(v => !usedVideos.some(used => used.videoId === v.videoId));
      remainingVideos.push(...unusedVideos);
    }
    
    const shuffledRemaining = shuffleArray(remainingVideos);
    const additionalVideos = shuffledRemaining.slice(0, maxResults - finalVideos.length);
    finalVideos.push(...additionalVideos);
    
    console.log(`🔄 Added ${additionalVideos.length} additional videos to reach target`);
  }
  
  // 🎲 SHUFFLE ALL VIDEOS TO ENSURE RANDOM MIXING FROM ALL PLAYLISTS
  const shuffledVideos = shuffleArray(finalVideos);
  console.log(`🎲 All playlist videos shuffled for random distribution from all playlists`);
  
  // Sort by date (newest first) after shuffling
  shuffledVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  
  // Ensure we don't exceed maxResults
  const finalResult = shuffledVideos.slice(0, maxResults);
  
  // Log distribution to show fair representation
  const playlistDistribution = {};
  finalResult.forEach(video => {
    playlistDistribution[video.playlistId] = (playlistDistribution[video.playlistId] || 0) + 1;
  });
  
  console.log(`📊 Final distribution across playlists:`, playlistDistribution);
  console.log(`✅ Returning ${finalResult.length} shuffled playlist videos from all playlists`);
  
  return finalResult;
};

// Legacy function for backward compatibility
const searchBangladeshNews = async (req, res) => {
  req.query.type = "channels";
  return getVideosByType(req, res);
};

module.exports = {
  searchBangladeshNews,
  getVideosByType,
};
