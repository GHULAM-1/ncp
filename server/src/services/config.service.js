const https = require('https');
const http = require('http');

class ConfigService {
    constructor() {
        // Initialize HTTP clients instead of problematic sheetdb-node
        this.youtubeConfig = process.env.YOUTUBE_CONFIG_SHEET_ID ? 
            process.env.YOUTUBE_CONFIG_SHEET_ID : null;
        this.facebookConfig = process.env.FACEBOOK_CONFIG_SHEET_ID ? 
            process.env.FACEBOOK_CONFIG_SHEET_ID : null;
        this.newsConfig = process.env.NEWS_CONFIG_SHEET_ID ? 
            process.env.NEWS_CONFIG_SHEET_ID : null;
        
        // Cache configuration data
        this.cache = {
            youtube: null,
            facebook: null,
            news: null,
            lastUpdated: null
        };
        
        // Cache duration: 1 hour
        this.cacheDuration = 60 * 60 * 1000;
        
        // Log initialization status
        console.log('🔧 ConfigService initialized:');
        console.log(`   YouTube: ${this.youtubeConfig ? '✅' : '❌'} (${process.env.YOUTUBE_CONFIG_SHEET_ID || 'Not configured'})`);
        console.log(`   Facebook: ${this.facebookConfig ? '✅' : '❌'} (${process.env.FACEBOOK_CONFIG_SHEET_ID || 'Not configured'})`);
        console.log(`   News: ${this.newsConfig ? '✅' : '❌'} (${process.env.NEWS_CONFIG_SHEET_ID || 'Not configured'})`);
    }

    // Helper function to make HTTP requests (replaces sheetdb-node)
    async makeHttpRequest(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https:') ? https : http;
            const req = protocol.request(url, { method: 'GET' }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve(jsonData);
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }

    async getYouTubeConfig() {
        if (this.isCacheValid('youtube')) {
            return this.cache.youtube;
        }

        // Check if SheetDB URL is available
        if (!this.youtubeConfig) {
            console.log('⚠️ YouTube SheetDB not configured, using fallback configuration');
            return this.getFallbackYouTubeConfig();
        }

        try {
            let data = await this.makeHttpRequest(this.youtubeConfig);
            
            // Debug: Log the data structure
            console.log('🔍 YouTube SheetDB raw data:', {
                type: typeof data,
                isArray: Array.isArray(data),
                length: data?.length,
                sample: data ? (Array.isArray(data) ? data[0] : data) : 'no data'
            });
            
            // Handle different data formats from SheetDB
            if (typeof data === 'string') {
                try {
                    // Try to parse as JSON if it's a string
                    data = JSON.parse(data);
                    console.log('🔄 Parsed string data as JSON');
                } catch (parseError) {
                    console.warn('⚠️ Could not parse string data as JSON, using fallback');
                    return this.getFallbackYouTubeConfig();
                }
            }
            
            // Ensure data is an array and has the expected structure
            if (!Array.isArray(data)) {
                console.warn('⚠️ YouTube SheetDB returned non-array data after parsing:', typeof data);
                return this.getFallbackYouTubeConfig();
            }
            
            const config = this.parseYouTubeConfig(data);
            
            // Debug: Log the parsed configuration
            console.log('🔧 Parsed YouTube config:', JSON.stringify(config, null, 2));
            
            this.cache.youtube = config;
            this.cache.lastUpdated = Date.now();
            
            console.log('✅ YouTube config loaded from SheetDB:', Object.keys(config));
            return config;
        } catch (error) {
            console.error('❌ Error fetching YouTube config from SheetDB:', error.message);
            console.log('🔄 Using fallback YouTube configuration');
            // Return fallback config if SheetDB fails
            return this.getFallbackYouTubeConfig();
        }
    }

    async getFacebookConfig() {
        if (this.isCacheValid('facebook')) {
            return this.cache.facebook;
        }

        // Check if SheetDB URL is available
        if (!this.facebookConfig) {
            console.log('⚠️ Facebook SheetDB not configured, using fallback configuration');
            return this.getFallbackFacebookConfig();
        }

        try {
            let data = await this.makeHttpRequest(this.facebookConfig);
            
            // Debug: Log the data structure
            console.log('🔍 Facebook SheetDB raw data:', {
                type: typeof data,
                isArray: Array.isArray(data),
                length: data?.length,
                sample: data ? (Array.isArray(data) ? data[0] : data) : 'no data'
            });
            
            // Handle different data formats from SheetDB
            if (typeof data === 'string') {
                try {
                    // Try to parse as JSON if it's a string
                    data = JSON.parse(data);
                    console.log('🔄 Parsed Facebook string data as JSON');
                } catch (parseError) {
                    console.warn('⚠️ Could not parse Facebook string data as JSON, using fallback');
                    return this.getFallbackFacebookConfig();
                }
            }
            
            // Ensure data is an array and has the expected structure
            if (!Array.isArray(data)) {
                console.warn('⚠️ Facebook SheetDB returned non-array data after parsing:', typeof data);
                return this.getFallbackFacebookConfig();
            }
            
            const config = data
                .filter(row => row && typeof row === 'object' && row.pageUrl && row.pageUrl.trim()) // Only include rows with valid URLs
                .map(row => row.pageUrl.trim());
            
            this.cache.facebook = config;
            this.cache.lastUpdated = Date.now();
            
            console.log('✅ Facebook config loaded from SheetDB:', config.length, 'sources');
            return config;
        } catch (error) {
            console.error('❌ Error fetching Facebook config from SheetDB:', error.message);
            console.log('🔄 Using fallback Facebook configuration');
            return this.getFallbackFacebookConfig();
        }
    }

    async getNewsConfig() {
        if (this.isCacheValid('news')) {
            return this.cache.news;
        }

        // Check if SheetDB URL is available
        if (!this.newsConfig) {
            console.log('⚠️ News SheetDB not configured, using fallback configuration');
            return this.getFallbackNewsConfig();
        }

        try {
            let data = await this.makeHttpRequest(this.newsConfig);
            
            // Debug: Log the data structure
            console.log('🔍 News SheetDB raw data:', {
                type: typeof data,
                isArray: Array.isArray(data),
                length: data?.length,
                sample: data ? (Array.isArray(data) ? data[0] : data) : 'no data'
            });
            
            // Handle different data formats from SheetDB
            if (typeof data === 'string') {
                try {
                    // Try to parse as JSON if it's a string
                    data = JSON.parse(data);
                    console.log('🔄 Parsed News string data as JSON');
                } catch (parseError) {
                    console.warn('⚠️ Could not parse News string data as JSON, using fallback');
                    return this.getFallbackNewsConfig();
                }
            }
            
            // Ensure data is an array and has the expected structure
            if (!Array.isArray(data)) {
                console.warn('⚠️ News SheetDB returned non-array data after parsing:', typeof data);
                return this.getFallbackNewsConfig();
            }
            
            const config = data
                .filter(row => row && typeof row === 'object' && row.url && row.url.trim()) // Only include rows with valid URLs
                .map(row => row.url.trim());
            
            this.cache.news = config;
            this.cache.lastUpdated = Date.now();
            
            console.log('✅ News config loaded from SheetDB:', config.length, 'sources');
            return config;
        } catch (error) {
            console.error('❌ Error fetching News config from SheetDB:', error.message);
            console.log('🔄 Using fallback News configuration');
            return this.getFallbackNewsConfig();
        }
    }

         parseYouTubeConfig(data) {
         const config = {
             channels: { channels: [], playlists: [], channelUrls: [] },
             talkshows: { channels: [], playlists: [], channelUrls: [] },
             youtube: { channels: [], playlists: [], channelUrls: [] }
         };

         // Your SheetDB has columns: channels, playlists, channelUrls
         // Each row represents one content type - we need to accumulate all rows
         data.forEach(row => {
             // Check if this row has channels (news channels)
             if (row.channels && row.channels.trim()) {
                 const channelList = row.channels.split(',').map(c => c.trim()).filter(c => c);
                 if (config.channels.channels) {
                     // Append to existing channels
                     config.channels.channels.push(...channelList);
                 } else {
                     // Initialize channels
                     config.channels.channels = channelList;
                 }
             }
             
             // Check if this row has playlists (talkshows)
             if (row.playlists && row.playlists.trim()) {
                 const playlistList = row.playlists.split(',').map(p => p.trim()).filter(p => p);
                 if (config.talkshows.playlists) {
                     // Append to existing playlists
                     config.talkshows.playlists.push(...playlistList);
                 } else {
                     // Initialize playlists
                     config.talkshows.playlists = playlistList;
                 }
             }
             
             // Check if this row has channel URLs (youtube channels)
             if (row.channelUrls && row.channelUrls.trim()) {
                 const urlList = row.channelUrls.split(',').map(u => u.trim()).filter(u => u);
                 if (config.youtube.channelUrls) {
                     // Append to existing channel URLs
                     config.youtube.channelUrls.push(...urlList);
                 } else {
                     // Initialize channel URLs
                     config.youtube.channelUrls = urlList;
                 }
             }
         });

         // Ensure all required fields exist with defaults
         if (!config.channels.channels || config.channels.channels.length === 0) {
             config.channels.channels = [];
         }
         if (!config.talkshows.playlists || config.talkshows.playlists.length === 0) {
             config.talkshows.playlists = [];
         }
         if (!config.youtube.channelUrls || config.youtube.channelUrls.length === 0) {
             config.youtube.channelUrls = [];
         }

         return config;
     }

    isCacheValid(type) {
        return this.cache[type] && 
               this.cache.lastUpdated && 
               (Date.now() - this.cache.lastUpdated) < this.cacheDuration;
    }

    // Fallback configurations (your current hardcoded data)
    getFallbackYouTubeConfig() {
        return {
            channels: {
                searchQuery: "Bangladesh news politics latest",
                channels: [
                    "Somoy TV", "Jamuna TV", "ATN News", "Channel 24", "DBC News",
                    "Independent TV", "Ekattor TV", "News24 BD", "Bangla Vision",
                    "Maasranga TV", "NTV Bangladesh", "Channel i", "Boishakhi TV",
                    "RTV", "Gazi TV", "BanglaTV", "Desh TV", "Global TV News",
                    "SATV", "MY TV",
                    "Al Jazeera English", "BBC News Bangla", "DW Bangla", "TRT World",
                    "BBC News", "VOA Bangla"
                ],
                maxResults: 100
            },
            talkshows: {
                playlists: [
                    "PLO_Gwx3ZefnVLAf9ygmFJ0P98T1ONNSb3",
                    "PLvaPMOKVZLDGuiutnNiw3XA6CAThQwYli",
                    "PLCEH8lWGo0VGLaQ8XJppkIqV3mOYPvO93",
                    "PL452k3Pdf5mLIv77RgATVYs6vA3pZQAbJ",
                    "PL452k3Pdf5mJp6XSWDfoh9qiWa3tS5ouU",
                    "PLc_kkJn0dwWvlVQmfEkBcbdXKjdUvEXAo",
                    "PLx-2-qPB6h_tRWE5ze_TXUNnN7vvyVxSO",
                    "PLyIUJWkJsJ9foKbKOBR7ahnG8gU6kNaLq",
                    "PLc0L9mM0RWAv9WXBKghsXDhCA2HAqWKdR",
                    "PLO_Gwx3ZefnVLAf9ygmFJ0P98T1ONNSb3",
                    "PLCEH8lWGo0VFvfvCtmlC61wp658GxIyHT",
                    "PLMtDlkozHHFe2DSSgP976XMOXFHsACs6X",
                    "PLAQmWbFYOcadG83b034uWIeHjuxKuAVU-",
                    "PLFv6mvxs9kPNKuyt_TXOrJ6-OpNNwxAO-",
                    "PLyIUJWkJsJ9dHSeaWuVq-F-kTxp9IB2fA",
                    "PLpqwqQnMCaTvQ3ogr-AEWO06W0mWjoSCF",
                    "PLx4tNTRz-dJ3BgbPRqR6VUoT__FHbqP6b",
                    "PLAHVDBLW1GY4h1MCE5EcMGs6XQGnUEncf",
                    "PLFv6mvxs9kPMwdI2efnIy-oAkFpRM3ZCU"
                ],
                maxResults: 100
            },
            youtube: {
                channelUrls: [
                    "https://www.youtube.com/@EtvTalkShow",
                    "https://www.youtube.com/@Counternarrative-TBD",
                    "https://www.youtube.com/@zahedstakebd/videos",
                    "https://www.youtube.com/@PinakiBhattacharya/videos",
                    "https://www.youtube.com/@ATNBanglaTalkShow/videos",
                    "https://www.youtube.com/@zillur_rahman/videos",
                    "https://www.youtube.com/@ThikanayKhaledMuhiuddin/streams",
                    "https://www.youtube.com/@kanaksarwarnews/streams",
                    "https://www.youtube.com/@EliasHossain/streams"
                ],
                maxResults: 100
            }
        };
    }

    getFallbackFacebookConfig() {
        return [
            "https://www.facebook.com/1NationalCitizenParty",
            "https://www.facebook.com/NCPSpeaks"
        ];
    }

    getFallbackNewsConfig() {
        return [
            "https://news.google.com/rss/search?q=bangladesh&hl=en-US&gl=US&ceid=US:en"
        ];
    }

    // Method to refresh cache manually
    async refreshCache() {
        this.cache = {
            youtube: null,
            facebook: null,
            news: null,
            lastUpdated: null
        };
        console.log('🔄 Configuration cache refreshed');
    }

    // Get cache status
    getCacheStatus() {
        return {
            youtube: {
                cached: !!this.cache.youtube,
                lastUpdated: this.cache.lastUpdated ? new Date(this.cache.lastUpdated).toISOString() : null,
                isValid: this.isCacheValid('youtube')
            },
            facebook: {
                cached: !!this.cache.facebook,
                lastUpdated: this.cache.lastUpdated ? new Date(this.cache.lastUpdated).toISOString() : null,
                isValid: this.isCacheValid('facebook')
            },
            news: {
                cached: !!this.cache.news,
                lastUpdated: this.cache.lastUpdated ? new Date(this.cache.lastUpdated).toISOString() : null,
                isValid: this.isCacheValid('news')
            },
            cacheDuration: this.cacheDuration
        };
    }
}

module.exports = new ConfigService(); 