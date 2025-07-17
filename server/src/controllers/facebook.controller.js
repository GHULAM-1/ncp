// Facebook Controller
const { ApifyClient } = require('apify-client');

const getFacebookPosts = async (req, res) => {
    try {
        const apifyToken = process.env.APIFY;
        console.log(apifyToken);
        const {maxPosts = 5 } = req.query;
        
        if (!apifyToken) {
            return res.status(400).json({ 
                error: 'Apify token is required' 
            });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // List of Facebook pages/groups to scrape
        const FACEBOOK_SOURCES = [
            "https://www.facebook.com/groups/874728723021553",
        ];
        

        async function scrapeFacebookSource(url, maxPosts) {
            try {
                // Choose scraper based on URL
                const actorId = url.includes('/groups/') 
                    ? 'apify/facebook-groups-scraper' 
                    : 'apify/facebook-posts-scraper';
                
                const run = await client.actor(actorId).call({
                    startUrls: [{ url: url }],
                    maxPosts: maxPosts,
                    scrapeComments: false,
                    scrapeReactions: true,
                });

                const { items } = await client.dataset(run.defaultDatasetId).listItems();
                
                return items.map(post => ({
                    title: post.text ? post.text.substring(0, 100) + '...' : 'No text',
                    postId: post.id,
                    url: post.url,
                    publishedAt: post.time,
                    image: post.images?.[0] || null,
                    description: post.text || '',
                    author: post.author?.name || post.ownerName || 'Unknown',
                    source: url,
                    engagement: {
                        likes: post.likesCount || 0,
                        comments: post.commentsCount || 0,
                        shares: post.sharesCount || 0
                    }
                }));
                
            } catch (error) {
                console.error(`Error scraping ${url}:`, error.message);
                return [];
            }
        }

        const allPosts = [];
        
        for (const url of FACEBOOK_SOURCES) {
            const posts = await scrapeFacebookSource(url, maxPosts);
            allPosts.push(...posts);
            
            // Wait 2 seconds between requests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        res.json({
            success: true,
            count: allPosts.length,
            posts: allPosts
        });
        
    } catch (error) {
        console.error('Error scraping Facebook:', error);
        res.status(500).json({ 
            error: 'Failed to scrape Facebook posts',
            message: error.message 
        });
    }
};

module.exports = {
    getFacebookPosts
}; 