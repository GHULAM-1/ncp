const { ApifyClient } = require('apify-client');

const getFacebookPosts = async (req, res) => {
    try {
        const apifyToken = process.env.APIFY;
        const { maxPosts = 5 } = req.query;
        
        if (!apifyToken) {
            return res.status(400).json({ 
                error: 'Apify token is required' 
            });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });

        // Facebook pages/profiles to scrape
        const FACEBOOK_SOURCES = [
            "https://www.facebook.com/Professor.Muhammad.Yunus",
            "https://www.facebook.com/ChiefAdviserGOB",
            "https://www.facebook.com/mpitom",
            "https://www.facebook.com/asifmudmudofficial07",
            "https://www.facebook.com/shadik.kayem",
            "https://www.facebook.com/rkrony88",
            "https://www.facebook.com/sarjis.nirob",
            "https://www.facebook.com/sanjida.tulee",
            "https://www.facebook.com/DrTasnimJara",
            "https://www.facebook.com/profile.php?id=100091595383906",
            "https://www.facebook.com/saerzulkarnain",
            "https://www.facebook.com/zahed.urrahman.77",
            "https://www.facebook.com/zahedstake",
            "http://www.facebook.com/shujanbd",
            "http://www.facebook.com/tibangladesh"
        ];

        try {
            console.log('Scraping Facebook posts with caprolok/facebook-pages-scraper');
            
            const inputData = {
                profile_urls: FACEBOOK_SOURCES.map(url => ({ url })),
                post_urls: [],
                results_amount: parseInt(maxPosts),
                posts_newer_than: "",
                posts_older_than: "",
                proxy_configuration: {
                    use_apify_proxy: true
                }
            };

            console.log('Input data:', JSON.stringify(inputData, null, 2));

            const run = await client.actor('caprolok/facebook-pages-scraper').call(inputData);
            console.log('Run ID:', run.id);
            
            const runInfo = await client.run(run.id).waitForFinish();
            console.log('Run finished with status:', runInfo.status);
            console.log('Run stats:', runInfo.stats);

            const { items } = await client.dataset(run.defaultDatasetId).listItems();
            
            console.log(`Retrieved ${items.length} total items from all sources`);
            if (items.length > 0) {
                console.log('Sample item:', JSON.stringify(items[0], null, 2));
            }
            
            const posts = items.map(post => ({
                title: post.caption ? post.caption.substring(0, 100) + '...' : 
                       post.text ? post.text.substring(0, 100) + '...' : 
                       post.post_text ? post.post_text.substring(0, 100) + '...' : 'No text',
                postId: post.post_id || post.postId || post.id || post.post_url || `fb_${Date.now()}_${Math.random()}`,
                url: post.post_url || post.url || post.postUrl || post.link,
                publishedAt: post.creation_time ? new Date(post.creation_time * 1000).toISOString() : 
                           post.time ? new Date(post.time).toISOString() : 
                           post.timestamp ? new Date(post.timestamp).toISOString() : null,
                image: post.thumbnail_url || post.image || post.photo || 
                       (post.media_urls && post.media_urls[0]) || 
                       (post.attachments && post.attachments[0]?.media?.image?.src) || null,
                description: post.caption || post.text || post.post_text || post.content || '',
                author: post.page_name || post.user?.name || post.author || post.profile_name || 'Unknown',
                source: post.page_url || post.pageUrl || post.profile_url || 'Unknown',
                engagement: {
                    likes: post.top_reactions?.Like || post.likes || post.reactions?.like || 0,
                    love: post.top_reactions?.Love || post.love || post.reactions?.love || 0,
                    haha: post.top_reactions?.Haha || post.haha || post.reactions?.haha || 0,
                    care: post.top_reactions?.Care || post.care || post.reactions?.care || 0,
                    wow: post.top_reactions?.Wow || post.wow || post.reactions?.wow || 0,
                    sad: post.top_reactions?.Sad || post.sad || post.reactions?.sad || 0,
                    angry: post.top_reactions?.Angry || post.angry || post.reactions?.angry || 0,
                    totalReactions: post.total_reactions || 
                                  Object.values(post.top_reactions || {}).reduce((sum, count) => sum + count, 0) ||
                                  Object.values(post.reactions || {}).reduce((sum, count) => sum + count, 0) ||
                                  (post.likes || 0),
                    comments: post.total_comment_count || post.comments || post.comment_count || 0,
                    shares: post.share_count || post.shares || 0
                },
                facebookId: post.facebook_id || post.id,
                pageId: post.page_id || post.profile_id,
                mediaCount: post.media_urls_count || post.media_count || 0,
                mediaUrls: post.media_urls || post.attachments || [],
                topComments: post.top_comments || post.comments || [],
                videoDetails: post.video_details || post.video || {},
                type: (post.video_details && Object.keys(post.video_details).length > 0) || 
                      (post.video && Object.keys(post.video).length > 0) ? 'video' : 'post',
                platform: 'facebook'
            }));

            // Filter out empty posts
            const validPosts = posts.filter(post => 
                post.description && post.description.length > 0 && post.description !== 'No text'
            );

            // Remove duplicates
            const uniquePosts = validPosts.filter((post, index, self) => 
                index === self.findIndex(p => p.postId === post.postId || p.url === post.url)
            );

            // Sort by date (most recent first)
            uniquePosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

            console.log(`Total unique posts: ${uniquePosts.length}`);

            res.json({
                success: true,
                count: uniquePosts.length,
                posts: uniquePosts,
                summary: {
                    totalSources: FACEBOOK_SOURCES.length,
                    rawItemsRetrieved: items.length,
                    validPostsAfterFiltering: validPosts.length,
                    finalUniquePostCount: uniquePosts.length
                },
                debug: {
                    runId: run.id,
                    runStatus: runInfo.status,
                    runStats: runInfo.stats,
                    inputUsed: inputData
                }
            });
            
        } catch (error) {
            console.error('Error with caprolok scraper:', error.message);
            console.error('Full error:', error);
            
            res.status(500).json({ 
                error: 'Failed to scrape Facebook posts',
                message: error.message,
                details: 'Check console logs for full error details'
            });
        }
        
    } catch (error) {
        console.error('Error scraping Facebook:', error);
        res.status(500).json({ 
            error: 'Failed to scrape Facebook posts',
            message: error.message,
            stack: error.stack
        });
    }
};

// Test function for a single page

module.exports = {
    getFacebookPosts,
};