# SheetDB Integration Setup Guide

This guide explains how to set up SheetDB to make your data sources configurable through Google Sheets.

## 1. Create Google Sheets

### YouTube Configuration Sheet
Create a Google Sheet with these columns:
- `type` - Content type: channels, talkshows, or youtube
- `channels` - Comma-separated channel names (for channels type)
- `playlists` - Comma-separated playlist IDs (for talkshows type)
- `channelUrls` - Comma-separated YouTube channel URLs (for youtube type)

**Example rows:**
```
type        | channels                    | playlists | channelUrls
channels    | Somoy TV,Jamuna TV,ATN News|           | 
talkshows   |                            | PLO_Gwx3ZefnVLAf9ygmFJ0P98T1ONNSb3,PLvaPMOKVZLDGuiutnNiw3XA6CAThQwYli | 
youtube     |                            |           | https://www.youtube.com/@EtvTalkShow,https://www.youtube.com/@Counternarrative-TBD
```

**Note:** 
- `maxResults` is handled by the API query parameter (default: 100)
- `searchQuery` is automatically set to "Bangladesh news politics latest"
- Only provide the data that clients can control: channel names, playlist IDs, and channel URLs

### Facebook Configuration Sheet
Create a Google Sheet with these columns:
- `pageUrl` - Facebook page URL

**Example rows:**
```
pageUrl
https://www.facebook.com/1NationalCitizenParty
https://www.facebook.com/NCPSpeaks
```

### News Configuration Sheet
Create a Google Sheet with these columns:
- `url` - RSS feed URL

**Example rows:**
```
url
https://news.google.com/rss/search?q=bangladesh&hl=en-US&gl=US&ceid=US:en
```

## 2. Set Up SheetDB

1. Go to [https://sheetdb.io/](https://sheetdb.io/)
2. Sign in with your Google account
3. Click "Create Free API"
4. Select your Google Sheet
5. Copy the API endpoint (it will look like: `https://sheetdb.io/api/v1/abc123def456`)

## 3. Update Environment Variables

Add these to your `.env` file:

```bash
# SheetDB Configuration
YOUTUBE_CONFIG_SHEET_ID=your_youtube_sheet_id_here
FACEBOOK_CONFIG_SHEET_ID=your_facebook_sheet_id_here
NEWS_CONFIG_SHEET_ID=your_news_sheet_id_here
```

## 4. Test the Configuration

### View Current Configurations
```bash
GET /api/youtube/config
GET /api/facebook/config
GET /api/news/config
```

### Refresh Configuration Cache
```bash
POST /api/youtube/config/refresh
POST /api/facebook/config/refresh
POST /api/news/config/refresh
```

## 5. Benefits

- **Client Control**: Clients can modify sources without code changes
- **Real-time Updates**: Changes in Google Sheets are reflected in your API
- **Fallback Safety**: If SheetDB fails, your app still works with fallback data
- **Caching**: Reduces API calls to SheetDB for better performance
- **Priority System**: Clients can prioritize which sources to use first
- **Easy Management**: Non-technical users can manage sources in familiar Google Sheets

## 6. Troubleshooting

### Common Issues

1. **"No sources configured" error**
   - Check if your Google Sheet has the correct column names
   - Ensure URLs are properly formatted and not empty
   - Verify the SheetDB API endpoint is correct

2. **Configuration not updating**
   - The cache refreshes every hour automatically
   - Use `POST /api/config/refresh` to force refresh
   - Check SheetDB status at [sheetdb.io](https://sheetdb.io/)

3. **Fallback configuration being used**
   - Check server logs for SheetDB errors
   - Verify environment variables are set correctly
   - Ensure Google Sheets are shared with the correct permissions

4. **YouTube API quota exceeded**
   - YouTube API has daily quota limits
   - Check your quota usage in [Google Cloud Console](https://console.cloud.google.com/)
   - Consider increasing quota or implementing rate limiting
   - The system will return a 429 status with helpful error message

### Log Messages

The service provides detailed logging:
- ✅ Success messages when config loads from SheetDB
- ❌ Error messages when SheetDB fails
- 🔄 Fallback configuration usage notifications
- 📱📰🎯 Source count information

## 7. Maintenance

- **Regular Updates**: Update your Google Sheets as needed
- **Cache Management**: The cache automatically refreshes every hour
- **Monitoring**: Use the status endpoint to monitor configuration health
- **Backup**: Keep a copy of your current hardcoded configurations as backup 