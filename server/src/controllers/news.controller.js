// News Controller
const https = require('https');

const getBangladeshNews = async (req, res) => {
    try {
        const NEWS_SOURCES = [           
            "https://news.google.com/rss/search?q=bangladesh&hl=en-US&gl=US&ceid=US:en",        
        ];

        function fetchURL(url) {
            return new Promise((resolve) => {
                https.get(url, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(data));
                }).on('error', (error) => {
                    console.error('Fetch error:', error);
                    resolve(null);
                });
            });
        }

        function decodeHTMLEntities(text) {
            return text
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/&nbsp;/g, ' ');
        }

        function extractNews(xmlData, source) {
            if (!xmlData) return [];
            
            console.log('Processing XML data for', source);
            
            const items = [];
            const itemRegex = /<item>(.*?)<\/item>/gs;
            let match;
            
            while ((match = itemRegex.exec(xmlData)) !== null && items.length < 20) {
                const item = match[1];
                
                try {
                    // Extract title with better cleaning
                    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/s);
                    let title = '';
                    if (titleMatch) {
                        title = titleMatch[1] || titleMatch[2] || '';
                        title = decodeHTMLEntities(title.trim());
                        // Remove " - Source Name" from the end of titles
                        title = title.replace(/ - [^-]+$/, '');
                    }
                    
                    // Extract link
                    const linkMatch = item.match(/<link>(.*?)<\/link>/s);
                    const link = linkMatch ? linkMatch[1].trim() : '';
                    
                    // Extract GUID (often a cleaner link)
                    const guidMatch = item.match(/<guid[^>]*>(.*?)<\/guid>/s);
                    const guid = guidMatch ? guidMatch[1].trim() : '';
                    
                    // Use the shorter, cleaner URL if available
                    const finalLink = (guid && guid.length < link.length) ? guid : link;
                    
                    // Extract publication date
                    const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
                    let date = dateMatch ? dateMatch[1].trim() : '';
                    
                    // Format date to be more readable
                    if (date) {
                        try {
                            const dateObj = new Date(date);
                            date = dateObj.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        } catch (e) {
                            // Keep original date if parsing fails
                        }
                    }
                    
                    // Extract source with multiple methods
                    let newsSource = 'Unknown';
                    
                    // Method 1: From description
                    const sourceMatch1 = item.match(/<description>.*?<font color="#6f6f6f">(.*?)<\/font>/s);
                    if (sourceMatch1) {
                        newsSource = sourceMatch1[1].trim();
                    }
                    
                    // Method 2: From source tag
                    const sourceMatch2 = item.match(/<source[^>]*>(.*?)<\/source>/s);
                    if (sourceMatch2 && newsSource === 'Unknown') {
                        newsSource = sourceMatch2[1].trim();
                    }
                    
                    // Method 3: From source URL attribute
                    const sourceMatch3 = item.match(/<source url="([^"]*)"[^>]*>([^<]*)<\/source>/s);
                    if (sourceMatch3 && newsSource === 'Unknown') {
                        newsSource = sourceMatch3[2].trim() || sourceMatch3[1].trim();
                    }
                    
                    // Clean up source name
                    newsSource = decodeHTMLEntities(newsSource);
                    
                    // Extract description/summary
                    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/s);
                    let description = '';
                    if (descMatch) {
                        description = descMatch[1] || descMatch[2] || '';
                        description = decodeHTMLEntities(description);
                        // Remove HTML tags
                        description = description.replace(/<[^>]*>/g, '');
                        // Limit length
                        description = description.substring(0, 200) + (description.length > 200 ? '...' : '');
                    }
                    
                    // Validate and add item
                    if (title && finalLink && title.length > 10) {
                        items.push({
                            title: title.substring(0, 200),
                            link: finalLink,
                            date: date,
                            source: newsSource,
                            description: description
                        });
                        
                        console.log(`Added: ${title.substring(0, 50)}... from ${newsSource}`);
                    }
                } catch (itemError) {
                    console.error('Error processing item:', itemError);
                }
            }
            
            console.log(`Extracted ${items.length} items from ${source}`);
            return items;
        }

        const allNews = [];
        
        for (const url of NEWS_SOURCES) {
            try {
                console.log('Fetching from:', url);
                const xmlData = await fetchURL(url);
                
                if (xmlData) {
                    const news = extractNews(xmlData, 'Google News');
                    allNews.push(...news);
                } else {
                    console.log('No data received from', url);
                }
                
                // Wait 1 second between requests to be respectful
                await new Promise(r => setTimeout(r, 1000));
            } catch (sourceError) {
                console.error('Error with source:', url, sourceError);
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

        res.json({
            success: true,
            count: uniqueNews.length,
            news: uniqueNews.slice(0, 15), // Limit to 15 most recent
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