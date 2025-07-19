"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { fetchBangladeshNews, NewsItem } from '@/api/news/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ExternalLink, Calendar, Globe, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RSSNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const REFRESH_INTERVAL = 4 * 60 * 60 * 1000;
  // Function to load news
  const loadNews = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Refreshing RSS news...');
      
      const response = await fetchBangladeshNews();
      console.log(response);
      setNews(response.news);
      setLastUpdated(new Date().toISOString());
      
      console.log(`✅ RSS news refreshed! Found ${response.news.length} articles.`);
    } catch (err) {
      setError('Failed to load news');
      console.error('Error loading news:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Set up auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) { // Only refresh if not currently loading
        loadNews();
      }
    }, REFRESH_INTERVAL);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [loadNews, loading, REFRESH_INTERVAL]);

  const handleCardClick = (link: string) => {
    window.open(link, '_blank');
  };

  if (loading && news.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading news...</span>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => loadNews()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bangladesh News</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest news from RSS feeds ({news.length} articles)
        </p>
        

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map((item, index) => (
          <Card 
            key={`${item.title}-${index}`} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105"
            onClick={() => handleCardClick(item.link)}
          >
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Globe className="h-4 w-4 mr-2" />
                  <span>{item.source}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : 'Unknown date'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400">Click to read more</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {news.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No news articles found.</p>
        </div>
      )}
    </div>
  );
};
