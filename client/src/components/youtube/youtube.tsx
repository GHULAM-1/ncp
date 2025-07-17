"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { fetchBangladeshNewsVideos, YouTubeVideo } from '@/api/youtube/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ExternalLink, Calendar, Play, User, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function YouTubeNews() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const REFRESH_INTERVAL = 4 * 60 * 60 * 1000;
  // Function to load videos
  const loadVideos = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Refreshing YouTube videos...');
      
      const response = await fetchBangladeshNewsVideos(20);
      setVideos(response.videos);
      setLastUpdated(new Date().toISOString());
      
      // Debug: Log thumbnail URLs
      response.videos.forEach((video, index) => {
        console.log(`Video ${index + 1} thumbnail:`, video.thumbnail);
      });
      
      console.log(`✅ Videos refreshed! Found ${response.videos.length} videos.`);
    } catch (err) {
      setError('Failed to load videos');
      console.error('Error loading videos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // Set up auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) { // Only refresh if not currently loading
        loadVideos();
      }
    }, REFRESH_INTERVAL);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [loadVideos, loading, REFRESH_INTERVAL]);

  const handleCardClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading videos...</span>
      </div>
    );
  }

  if (error && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => loadVideos()} 
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
        <h1 className="text-3xl font-bold mb-2">Bangladesh News Videos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest news videos from YouTube ({videos.length} videos)
        </p>
        
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video, index) => (
          <Card 
            key={`${video.videoId}-${index}`} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105"
            onClick={() => handleCardClick(video.url)}
          >
            <div className="relative">
              <img 
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-48 object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{video.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-2" />
                  <span className="line-clamp-1">{video.channelTitle}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {formatDistanceToNow(new Date(video.publishedAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {video.description}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-red-600 dark:text-red-400">Watch on YouTube</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {videos.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No videos found.</p>
        </div>
      )}
    </div>
  );
}