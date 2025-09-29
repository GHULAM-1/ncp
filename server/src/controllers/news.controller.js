// News Controller
const Parser = require('rss-parser');
const configService = require('../services/config.service');

const parser = new Parser({
  customFields: {
    feed: ['image', 'logo', 'itunes:image'],
    item: ['media:thumbnail', 'media:content', 'enclosure', 'image', 'media:group', 'source']
  }
});

const getBangladeshNews = async (req, res) => {
    try {
        // Get news sources from SheetDB
        let NEWS_SOURCES = [];
        try {
            NEWS_SOURCES = await configService.getNewsConfig();
            console.log(`📰 Loaded ${NEWS_SOURCES.length} news sources from configuration`);
        } catch (error) {
            console.error('❌ Error loading news config, using fallback:', error.message);
            NEWS_SOURCES = [
                "https://news.google.com/rss/search?q=bangladesh&hl=en-US&gl=US&ceid=US:en"
            ];
        }
        if (NEWS_SOURCES.length === 0) {
            return res.status(500).json({
                error: 'No active news sources configured'
            });
        }

        // Helper function to extract image from RSS item
        function extractImage(item) {
            // Try multiple sources for images
            let imageUrl = '';

            // Method 1: media:thumbnail
            if (item['media:thumbnail'] && item['media:thumbnail'].$ && item['media:thumbnail'].$.url) {
                imageUrl = item['media:thumbnail'].$.url;
            }

            // Method 2: media:content
            if (!imageUrl && item['media:content'] && item['media:content'].$ && item['media:content'].$.url) {
                if (item['media:content'].$.type && item['media:content'].$.type.startsWith('image')) {
                    imageUrl = item['media:content'].$.url;
                }
            }

            // Method 3: enclosure (for podcasts/images)
            if (!imageUrl && item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('image')) {
                imageUrl = item.enclosure.url;
            }

            // Method 4: Look for image in content
            if (!imageUrl && item.content) {
                const imgMatch = item.content.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) {
                    imageUrl = imgMatch[1];
                }
            }

            // Method 5: Look for image in description
            if (!imageUrl && item.contentSnippet) {
                const imgMatch = item.contentSnippet.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) {
                    imageUrl = imgMatch[1];
                }
            }

            return imageUrl;
        }

        // Helper function to extract provider logo from RSS feed
        function extractProviderLogo(feed) {
            let logoUrl = '';

            // Method 1: feed.image.url (most common)
            if (feed.image && feed.image.url) {
                logoUrl = feed.image.url;
            }

            // Method 2: feed.image (if it's a string)
            if (!logoUrl && typeof feed.image === 'string') {
                logoUrl = feed.image;
            }

            // Method 3: iTunes image
            if (!logoUrl && feed.itunes && feed.itunes.image) {
                logoUrl = feed.itunes.image;
            }

            // Method 4: Look in feed description for logo
            if (!logoUrl && feed.description) {
                const imgMatch = feed.description.match(/<img[^>]+src="([^"]+)"/);
                if (imgMatch) {
                    logoUrl = imgMatch[1];
                }
            }

            return logoUrl;
        }

        async function parseRSSFeed(url, sourceName) {
            try {
                console.log(`🔄 Parsing RSS feed: ${url}`);
                const feed = await parser.parseURL(url);

                // Extract provider info
                const providerName = sourceName || feed.title || 'Unknown';

                const items = feed.items.map(item => {
                    // Extract image
                    const imageUrl = extractImage(item);

                    // Clean title
                    let title = item.title || '';
                    title = title.replace(/ - [^-]+$/, ''); // Remove source suffix

                    // Format date
                    let date = '';
                    if (item.pubDate || item.isoDate) {
                        try {
                            date = new Date(item.pubDate || item.isoDate).toISOString();
                        } catch (e) {
                            date = item.pubDate || item.isoDate || '';
                        }
                    }

                    // Get description
                    let description = item.contentSnippet || item.content || '';
                    description = description.replace(/<[^>]*>/g, ''); // Remove HTML
                    description = description.substring(0, 200) + (description.length > 200 ? '...' : '');

                    // Extract source name from RSS item source element or use provider name as fallback
                    let itemSource = providerName;
                    if (item.source && typeof item.source === 'string') {
                        itemSource = item.source;
                    } else if (item.source && item.source._) {
                        itemSource = item.source._;
                    } else if (item.source && item.source.name) {
                        itemSource = item.source.name;
                    }

                    return {
                        title: title.substring(0, 200),
                        link: item.link,
                        date: date,
                        source: itemSource,
                        description: description,
                        image: imageUrl || ''
                    };
                }).filter(item => item.title && item.link && item.title.length > 10);

                console.log(`✅ Extracted ${items.length} items from ${providerName}`);
                return items;

            } catch (error) {
                console.error(`❌ Error parsing RSS feed ${url}:`, error.message);
                return [];
            }
        }

        const allNews = [];

        for (const source of NEWS_SOURCES) {
            try {
                // Handle both string URLs and objects with name/url
                const url = typeof source === 'string' ? source : source.url;
                const sourceName = typeof source === 'string' ? 'RSS Feed' : source.name;

                console.log(`🔄 Fetching from: ${sourceName} (${url})`);
                const news = await parseRSSFeed(url, sourceName);
                allNews.push(...news);

                // Wait 1 second between requests to be respectful
                await new Promise(r => setTimeout(r, 1000));
            } catch (sourceError) {
                console.error('❌ Error with source:', sourceError);
            }
        }

        // Remove duplicates based on title similarity
        const uniqueNews = [];
        for (const item of allNews) {
            const isDuplicate = uniqueNews.some(existing => 
                existing.title.toLowerCase().includes(item.title.toLowerCase().substring(0, 30)) ||
                item.title.toLowerCase().includes(existing.title.toLowerCase().substring(0, 30))
            );
            
            if (!isDuplicate) {
                uniqueNews.push(item);
            }
        }

        // Sort by date (most recent first)
        uniqueNews.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`Returning ${uniqueNews.length} unique news items`);

        // Get pagination parameters
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30; // Increased from 15 to 30
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;

        res.json({
            success: true,
            count: uniqueNews.length,
            news: uniqueNews.slice(startIndex, endIndex),
            page: page,
            limit: limit,
            hasMore: endIndex < uniqueNews.length,
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ 
            error: 'Failed to fetch news',
            message: error.message,
            success: false
        });
    }
};

module.exports = {
    getBangladeshNews
};