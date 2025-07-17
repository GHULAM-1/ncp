// YouTube Controller
const searchBangladeshNews = async (req, res) => {
    try {
        const apiKey = process.env.YT_API_KEY;
        const { maxResults = 20 } = req.query;
        
        if (!apiKey) {
            return res.status(400).json({ 
                error: 'YouTube API key is required' 
            });
        }

        const searchQuery = "Bangladesh news";
        const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(searchQuery)}&part=snippet&order=date&type=video&maxResults=${maxResults}`;
        
        // List of Bangladeshi news channels to filter by
        const bangladeshNewsChannels = [
            'Jamuna TV',
            'Ekattor TV', 
            'Independent Television (ITV)',
            'Channel 24',
            'Somoy TV',
            'DBC News',
            'ATN News',
            'NTV News',
            'RTV News',
            'News24'
        ];
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(`YouTube API Error: ${data.error.message}`);
        }
        
        // Filter videos to only include those from our specified channels
        const filteredVideos = data.items.filter(item => {
            const channelTitle = item.snippet.channelTitle;
            return bangladeshNewsChannels.some(channel => 
                channelTitle.toLowerCase().includes(channel.toLowerCase())
            );
        });
        
        const videos = filteredVideos.map(item => {
            // Get the best available thumbnail
            const thumbnails = item.snippet.thumbnails;
            const thumbnail = thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default?.url || '';
            
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
                channelTitle: item.snippet.channelTitle
            };
        });

        res.json({
            success: true,
            count: videos.length,
            videos: videos
        });
        
    } catch (error) {
        console.error('Error fetching Bangladesh news videos:', error);
        res.status(500).json({ 
            error: 'Failed to fetch YouTube videos',
            message: error.message 
        });
    }
};

module.exports = {
    searchBangladeshNews
}; 