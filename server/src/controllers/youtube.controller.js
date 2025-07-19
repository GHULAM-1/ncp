// YouTube Controller
const searchBangladeshNews = async (req, res) => {
  try {
    const apiKey = process.env.YT_API_KEY;
    const { maxResults = 50 } = req.query;

    if (!apiKey) {
      return res.status(400).json({
        error: "YouTube API key is required",
      });
    }

    const searchQuery = "Bangladesh news";
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(
      searchQuery
    )}&part=snippet&order=date&type=video&maxResults=${maxResults}`;

    const bangladeshNewsChannels = [
      "Somoy TV",
      "Jamuna TV",
      "ATN Bangla",
      "Channel 24",
      "SA TV",
      "Independent TV",
      "Ekattor TV",
      "News 24 BD",
      "Bangla Vision",
      "Maasranga TV",
      "NTV Bangladesh",
      "Channel i",
      "Boishakhi TV",
      "RTV",
      "MY TV",
      "Al Jazeera",
      "BBC Bangla",
      "DW Bangla",
      "VOA Bangla",
      "TRT World",
      "Ayman Sadiq",
      "Pinaki",
      "Saimum Parvez",
      "Asif Nazrul",
      "Nuh Keller",
      "Arif Jebtik",
      "Saimullah Khar",
      "Ragib Hassan",
      "Anupam",
      "Debanshis Roy",
      "Shafquat",
      "Iajur Islam",
      "Official",
      "Talk Show BD",
      "Political",
      "News BD",
      "Ajker",
      "Ekattor Matra",
      "Ekattor Journal",
      "Tomorrow Now",
      "Front Line",
      "Inside",
      "Policy Dialogue",
      "Bangladesh",
      "Politics Today",
      "Citizen Voice BD",
      "Student Voice",
      "Activist",
      "Bangladesh",
      "Democracy",
      "Chronicles",
      "Rights",
      "Voice of Reform",
      "Journalism",
      "Women in Politics BD",
      "Youth",
      "Parliament BD",
      "Grassroots BD",
    ];

    const response = await fetch(url);
    console.log(response);
    const data = await response.json();

    if (data.error) {
      throw new Error(`YouTube API Error: ${data.error.message}`);
    }

            // Filter videos to only include those from our specified channels
        let filteredVideos = data.items.filter((item) => {
            const channelTitle = item.snippet.channelTitle;
            return bangladeshNewsChannels.some((channel) =>
                channelTitle.toLowerCase().includes(channel.toLowerCase())
            );
        });

        // Fallback: if no channels match, return top 5 videos
        if (filteredVideos.length === 0) {
            console.log('No videos found from specified channels, falling back to top 5 videos');
            filteredVideos = data.items.slice(0, 5);
        }

        const videos = filteredVideos.map((item) => {
      // Get the best available thumbnail
      const thumbnails = item.snippet.thumbnails;
      const thumbnail =
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        "";

      // Debug: Log thumbnail info
      console.log(`Video: ${item.snippet.title}`);
      console.log(`Available thumbnails:`, Object.keys(thumbnails));
      console.log(`Selected thumbnail:`, thumbnail);

      return {
        title: item.snippet.title,
        videoId: item.id.videoId,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        publishedAt: item.snippet.publishedAt,
        thumbnail: thumbnail,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
      };
    });

    res.json({
      success: true,
      count: videos.length,
      videos: videos,
    });
  } catch (error) {
    console.error("Error fetching Bangladesh news videos:", error);
    res.status(500).json({
      error: "Failed to fetch YouTube videos",
      message: error.message,
    });
  }
};

module.exports = {
  searchBangladeshNews,
};
