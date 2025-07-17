"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { fetchFacebookPosts, FacebookPost } from '@/api/facebook/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ExternalLink, Calendar, User, ThumbsUp, MessageCircle, Share2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function FacebookNews() {
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const REFRESH_INTERVAL = 4 * 60 * 60 * 1000;

  // Function to load posts
  const loadPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Refreshing Facebook posts...');
      
      const response = await fetchFacebookPosts(10);
      setPosts(response.posts);
      setLastUpdated(new Date().toISOString());
      
      console.log(`✅ Facebook posts refreshed! Found ${response.posts.length} posts.`);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Set up auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) { // Only refresh if not currently loading
        loadPosts();
      }
    }, REFRESH_INTERVAL);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [loadPosts, loading, REFRESH_INTERVAL]);

  const handleCardClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading posts...</span>
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => loadPosts()} 
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
        <h1 className="text-3xl font-bold mb-2">Facebook Posts</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest posts from Facebook ({posts.length} posts)
        </p>
        
        {/* Refresh Status */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              {refreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  <span>Refreshing posts...</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Auto-refresh active (every 30s)</span>
                </>
              )}
            </div>
            {lastUpdated && (
              <span>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <Card 
            key={`${post.title}-${index}`} 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200 hover:scale-105"
            onClick={() => handleCardClick(post.url)}
          >
            {post.image && (
              <div className="relative">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg line-clamp-2">{post.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-2" />
                  <span className="line-clamp-1">{post.author}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>
                    {post.publishedAt ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true }) : 'Unknown date'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {post.description}
                </p>
                
                {/* Engagement metrics */}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span>{post.engagement.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    <span>{post.engagement.comments}</span>
                  </div>
                  <div className="flex items-center">
                    <Share2 className="h-4 w-4 mr-1" />
                    <span>{post.engagement.shares}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400">View on Facebook</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No posts found.</p>
        </div>
      )}
    </div>
  );
};
