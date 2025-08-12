const { ApifyClient } = require('apify-client');

const getFacebookPosts = async (req, res) => {
    try {
        const apifyToken = process.env.APIFY;
        const { maxPosts = 5, batch = 'true', timeout = 300000 } = req.query; // 5 min timeout
        
        if (!apifyToken) {
            return res.status(400).json({ 
                error: 'Apify token is required' 
            });
        }

        const client = new ApifyClient({
            token: apifyToken,
        });
        // Prioritized Facebook sources (most important first)
        const FACEBOOK_SOURCES = [
            "https://www.facebook.com/1NationalCitizenParty",
            "https://www.facebook.com/NCPSpeaks",
            // "https://www.facebook.com/nahidislamjuly",
            // "https://www.facebook.com/MAYOR.AH.FAISAL",
            // "https://www.facebook.com/arifulislamadiv1",
            // "https://www.facebook.com/DoctorTasnimJara",
            // "https://www.facebook.com/nahidasarwer.niva.5",
            // "https://www.facebook.com/Munasabduh",
            // "https://www.facebook.com/abdul.hannan.masud.480487",
            // "https://www.facebook.com/hasnat.ab1",
            // "https://www.facebook.com/sarjis.nirob",
            // "https://www.facebook.com/Asif07M",
            // "https://www.facebook.com/theredjulybd",
            // "https://www.facebook.com/shadik.kayem",





            // "https://www.facebook.com/Professor.Muhammad.Yunus",
            // "https://www.facebook.com/ChiefAdviserGOB",
            // "https://www.facebook.com/shujanbd",
            // "https://www.facebook.com/tibangladesh",
            // "https://www.facebook.com/mpitom",
            // "https://www.facebook.com/asifmudmudofficial07",
            // "https://www.facebook.com/shadik.kayem",
            // "https://www.facebook.com/rkrony88",
            // "https://www.facebook.com/sarjis.nirob",
            // "https://www.facebook.com/sanjida.tulee",
            // "https://www.facebook.com/DrTasnimJara",
            // "https://www.facebook.com/profile.php?id=100091595383906",
            // "https://www.facebook.com/saerzulkarnain",
            // "https://www.facebook.com/zahed.urrahman.77",
            // "https://www.facebook.com/zahedstake"
        ];

        const startTime = Date.now();

        if (batch === 'true') {
            // FAST METHOD: Process in batches of 5 sources
            return await processBatches(client, FACEBOOK_SOURCES, maxPosts, res, startTime, timeout, req, 5);
        } else {
            // SINGLE CALL: All sources at once (slower but simpler)
            return await processSingleCall(client, FACEBOOK_SOURCES, maxPosts, res, startTime, timeout, req, 5);
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

async function processBatches(client, sources, maxPosts, res, startTime, timeout, req, postsPerPage) {
    const batchSize = 5; // Process 5 URLs at a time
    const allPosts = [];
    const failedBatches = [];
    
    console.log(`🚀 FAST MODE: Processing ${sources.length} sources in batches of ${batchSize}`);

    for (let i = 0; i < sources.length; i += batchSize) {
        const batch = sources.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(sources.length / batchSize);
        
        console.log(`📦 Processing batch ${batchNum}/${totalBatches}: ${batch.length} sources`);
        
        // Check timeout
        if (Date.now() - startTime > timeout * 0.8) { // 80% of timeout
            console.log('⏰ Approaching timeout, stopping here');
            break;
        }

        try {
            const batchPosts = await scrapeBatch(client, batch, postsPerPage);
            allPosts.push(...batchPosts);
            console.log(`✅ Batch ${batchNum} completed: ${batchPosts.length} posts`);
        } catch (error) {
            console.error(`❌ Batch ${batchNum} failed:`, error.message);
            failedBatches.push(batchNum);
        }
        
        // Wait between batches to avoid rate limits
        if (i + batchSize < sources.length) {
            console.log('⏳ Waiting 2 seconds between batches...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    return sendResponse(req, res, allPosts, sources.length, startTime, 'batch', failedBatches, postsPerPage);
}

async function processSingleCall(client, sources, maxPosts, res, startTime, timeout, req, postsPerPage) {
    console.log(`🐌 SINGLE MODE: Processing all ${sources.length} sources in one call`);
    
    try {
        // Set a timeout for the actor run
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Operation timed out')), timeout);
        });

        const scrapingPromise = scrapeBatch(client, sources, postsPerPage);
        
        const posts = await Promise.race([scrapingPromise, timeoutPromise]);
        
        return sendResponse(req, res, posts, sources.length, startTime, 'single', [], postsPerPage);
        
    } catch (error) {
        if (error.message === 'Operation timed out') {
            console.error('⏰ Single call timed out after', timeout / 1000, 'seconds');
            return res.status(408).json({
                error: 'Request timed out',
                message: 'Try using batch mode: add ?batch=true to the URL',
                suggestion: 'GET /api/facebook/posts?batch=true&maxPosts=30&postsPerPage=5'
            });
        }
        throw error;
    }
}

async function scrapeBatch(client, urls, postsPerPage = 5) {
    const totalRequestedPosts = urls.length * 8; // Request more to account for filtering
    
    const inputData = {
        profile_urls: urls.map(url => ({ url })),
        post_urls: [],
        results_amount: totalRequestedPosts,
        posts_newer_than: "",
        posts_older_than: "",
        proxy_configuration: {
            use_apify_proxy: true
        }
    };

    console.log(`🔧 Requesting ${totalRequestedPosts} posts for ${urls.length} pages (target: ${postsPerPage} per page)`);

    const run = await client.actor('caprolok/facebook-pages-scraper').call(inputData);
    
    const runTimeout = 120000; // 2 minutes per batch
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Run timed out')), runTimeout);
    });

    const runPromise = client.run(run.id).waitForFinish();
    await Promise.race([runPromise, timeoutPromise]);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`📊 Retrieved ${items.length} raw items from all sources`);
    
    // Transform posts using the ACTUAL caprolok field structure
    const allPosts = items.map((post, index) => {
        const text = post.caption || '';
        
        // Extract engagement data using the actual structure
        const totalReactions = post.top_reactions ? 
            Object.values(post.top_reactions).reduce((sum, count) => sum + count, 0) : 0;
        
        // Convert Unix timestamp to ISO string
        const publishedAt = post.creation_time ? 
            new Date(post.creation_time * 1000).toISOString() : null;
        
        // Use thumbnail_url or first media_url for image
        const image = post.thumbnail_url || 
                     (post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null);
        
        // Extract author info from the user object
        const author = post.user?.name || post.page_name || 'Unknown';
        
        // Extract source URL from user profile
        const source = post.user?.profile_url || post.user?.url || 'Unknown';
        
        const transformedPost = {
            title: text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : `Post by ${author}`,
            postId: post.post_id || `fb_${Date.now()}_${Math.random()}`,
            url: post.post_url || '',
            publishedAt: publishedAt,
            image: image,
            description: text || `[Post without text content by ${author}]`,
            author: author,
            source: source,
            engagement: {
                likes: post.top_reactions?.Like || 0,
                love: post.top_reactions?.Love || 0,
                sad: post.top_reactions?.Sad || 0,
                care: post.top_reactions?.Care || 0,
                haha: post.top_reactions?.Haha || 0,
                wow: post.top_reactions?.Wow || 0,
                angry: post.top_reactions?.Angry || 0,
                totalReactions: totalReactions,
                comments: post.total_comment_count || 0,
                shares: post.share_count || 0
            },
            facebookId: post.facebook_id,
            pageId: post.page_id,
            mediaCount: post.media_urls_count || 0,
            mediaUrls: post.media_urls || [],
            topComments: post.top_comments || [],
            videoDetails: post.video_details || {},
            type: (post.video_details && Object.keys(post.video_details).length > 0) ? 'video' : 'post',
            platform: 'facebook'
        };
        
        if (index < 5) {
            console.log(`✅ Post ${index + 1}: "${transformedPost.title}" by ${transformedPost.author} from ${transformedPost.source}`);
        }
        
        return transformedPost;
    });

    console.log(`📊 Transformed ${allPosts.length} posts`);
    
    // More lenient filtering - include posts even without text if they have engagement or valid info
    const validPosts = allPosts.filter(post => {
        const hasContent = post.description && post.description.length > 0;
        const hasEngagement = post.engagement.totalReactions > 0 || post.engagement.comments > 0;
        const hasBasicInfo = post.postId && post.author !== 'Unknown';
        
        const isValid = hasBasicInfo && (hasContent || hasEngagement);
        
        if (!isValid) {
            console.log(`❌ Filtered out: ${post.title} - hasBasicInfo: ${hasBasicInfo}, hasContent: ${hasContent}, hasEngagement: ${hasEngagement}`);
        }
        
        return isValid;
    });

    console.log(`📊 Valid posts after filtering: ${validPosts.length}`);

    // Group posts by source and limit per source
    const postsPerSource = limitPostsPerSource(validPosts, urls, postsPerPage);
    
    console.log(`📊 Final posts after limiting to ${postsPerPage} per source: ${postsPerSource.length}`);
    
    return postsPerSource;
}

// Function to limit posts per source
function limitPostsPerSource(posts, sourceUrls, maxPerSource = 5) {
    const postsBySource = {};
    
    // Initialize counters for each source
    sourceUrls.forEach(url => {
        const normalizedUrl = url.replace('http://', 'https://').replace('www.', '');
        postsBySource[normalizedUrl] = [];
    });
    
    console.log(`🔍 Matching ${posts.length} posts to ${sourceUrls.length} sources`);
    
    // Group posts by source using profile URLs
    posts.forEach((post, index) => {
        let matchedSource = null;
        
        // Method 1: Try to match using the source URL from the post
        if (post.source && post.source !== 'Unknown') {
            const postSourceUrl = post.source.replace('http://', 'https://').replace('www.', '');
            
            for (const sourceUrl of sourceUrls) {
                const normalizedSourceUrl = sourceUrl.replace('http://', 'https://').replace('www.', '');
                
                // Extract the username/path from both URLs
                const postPath = postSourceUrl.split('facebook.com/')[1] || '';
                const sourcePath = normalizedSourceUrl.split('facebook.com/')[1] || '';
                
                if (postPath && sourcePath) {
                    // Clean up paths for comparison
                    const cleanPostPath = postPath.split('?')[0].split('/')[0];
                    const cleanSourcePath = sourcePath.split('?')[0].split('/')[0];
                    
                    if (cleanPostPath === cleanSourcePath) {
                        matchedSource = normalizedSourceUrl;
                        break;
                    }
                }
            }
        }
        
        // Method 2: If source matching failed, try author-based matching
        if (!matchedSource && post.author && post.author !== 'Unknown') {
            // Look for pages that might match the author name
            for (const sourceUrl of sourceUrls) {
                const normalizedSourceUrl = sourceUrl.replace('http://', 'https://').replace('www.', '');
                const sourcePath = normalizedSourceUrl.split('facebook.com/')[1] || '';
                
                // Check if the author name might correspond to the page URL
                if (sourcePath.toLowerCase().includes(post.author.toLowerCase().replace(/\s+/g, '')) ||
                    post.author.toLowerCase().includes(sourcePath.toLowerCase())) {
                    matchedSource = normalizedSourceUrl;
                    break;
                }
            }
        }
        
        // Method 3: Fallback - distribute evenly among sources with space
        if (!matchedSource) {
            for (const sourceUrl of sourceUrls) {
                const normalizedSourceUrl = sourceUrl.replace('http://', 'https://').replace('www.', '');
                if (postsBySource[normalizedSourceUrl].length < maxPerSource) {
                    matchedSource = normalizedSourceUrl;
                    break;
                }
            }
        }
        
        // Add post to matched source if found and under limit
        if (matchedSource && postsBySource[matchedSource].length < maxPerSource) {
            postsBySource[matchedSource].push(post);
            if (index < 10) {
                console.log(`📌 Post ${index + 1} "${post.title}" by ${post.author} → ${matchedSource.split('facebook.com/')[1]}`);
            }
        } else {
            console.log(`❌ Could not place post: "${post.title}" by ${post.author}`);
        }
    });
    
    // Flatten the results
    const limitedPosts = [];
    Object.values(postsBySource).forEach(sourcePosts => {
        limitedPosts.push(...sourcePosts);
    });
    
    // Log distribution
    console.log('📈 Final distribution:');
    Object.entries(postsBySource).forEach(([source, posts]) => {
        const domain = source.split('facebook.com/')[1] || source.split('/')[2] || source;
        console.log(`   ${domain}: ${posts.length} posts`);
        
        // Show first post from each source for verification
        if (posts.length > 0) {
            console.log(`      └─ "${posts[0].title}" by ${posts[0].author}`);
        }
    });
    
    return limitedPosts;
}

function sendResponse(req, res, allPosts, totalSources, startTime, mode, failedBatches, postsPerPage) {
    // Remove duplicates
    const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.postId === post.postId)
    );

    // Sort by date (most recent first)
    uniquePosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`🎉 Completed in ${executionTime}s: ${uniquePosts.length} unique posts (max ${postsPerPage} per page)`);
    console.log(`📄 Page ${page}: showing ${startIndex + 1}-${Math.min(endIndex, uniquePosts.length)} of ${uniquePosts.length}`);

    res.json({
        success: true,
        count: uniquePosts.length,
        posts: uniquePosts.slice(startIndex, endIndex),
        page: page,
        limit: limit,
        hasMore: endIndex < uniquePosts.length,
        settings: {
            postsPerPage: postsPerPage,
            totalSources: totalSources,
            maxPossiblePosts: totalSources * postsPerPage
        },
        performance: {
            executionTimeSeconds: parseFloat(executionTime),
            mode: mode,
            postsPerSecond: (uniquePosts.length / parseFloat(executionTime)).toFixed(2),
            failedBatches: failedBatches
        },
        summary: {
            rawItemsRetrieved: allPosts.length,
            finalUniquePostCount: uniquePosts.length
        }
    });
}

// Cron job function to refresh Facebook data every 2 hours
const refreshFacebookData = async () => {
    try {
        console.log('🕐 [CRON] Starting Facebook data refresh...');
        const startTime = Date.now();
        
        // Simulate a request object for the cron job
        const mockReq = {
            query: {
                maxPosts: 50,
                batch: 'true',
                timeout: 300000,
                page: 1,
                limit: 50
            }
        };
        
        // Create a mock response object to capture the data
        let capturedData = null;
        const mockRes = {
            json: (data) => {
                capturedData = data;
                console.log('✅ [CRON] Facebook data refreshed successfully');
                console.log(`📊 [CRON] Retrieved ${data.count} posts in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
            },
            status: () => mockRes
        };
        
        // Call the main function
        await getFacebookPosts(mockReq, mockRes);
        
        // Store the refreshed data (you can save this to a database or cache)
        if (capturedData && capturedData.success) {
            // Here you could save to Redis, database, or file system
            console.log('💾 [CRON] Data captured and ready for ISR');
        }
        
    } catch (error) {
        console.error('❌ [CRON] Facebook refresh failed:', error.message);
    }
};

// Export the cron function
module.exports = {
    getFacebookPosts,
    refreshFacebookData,
};