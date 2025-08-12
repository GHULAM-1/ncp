"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { fetchFacebookPosts, FacebookPost, FacebookResponse } from '@/api/facebook/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ExternalLink, Calendar, User, ThumbsUp, MessageCircle, Share2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FacebookNewsProps {
  initialData?: FacebookResponse | null;
}

export default function FacebookNews({ initialData }: FacebookNewsProps) {
  const [posts, setPosts] = useState<FacebookPost[]>(initialData?.posts || []);
  const [loading, setLoading] = useState(!initialData); // No loading if we have initial data
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(
    initialData ? new Date().toISOString() : ''
  );
  // Function to load posts (only when needed)
  const loadPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log('🔄 Loading Facebook posts...');
      
      const response = await fetchFacebookPosts(15, 1, 15); // Use pagination
      setPosts(response.posts);
      setLastUpdated(new Date().toISOString());
      
      console.log(`✅ Facebook posts loaded! Found ${response.posts.length} posts.`);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load - only if we don't have initial data
  useEffect(() => {
    if (!initialData) {
      loadPosts();
    }
  }, [initialData, loadPosts]);

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
    <div className="container max-w-[1000px] mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Facebook Posts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Latest posts from Facebook ({posts.length} posts)
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </p>
            )}
          </div>
          <button
            onClick={loadPosts}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, index) => (
          <Card 
            key={`${post.title}-${index}`} 
            className="group cursor-pointer bg-white dark:bg-[#1f2125] rounded-[8px] border-0 shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:scale-[102%] hover:shadow-xl"
            onClick={() => handleCardClick(post.url)}
          >
            {post.image && typeof post.image === 'string' && post.image.trim() !== '' ? (
              <div className="relative">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* Fallback placeholder */}
                <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center flex flex-col items-center justify-center text-white">
                    <p className="text-sm font-medium">{post.author}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <User className="h-8 w-8 mx-auto" />
                </div>
              </div>
            )}
            
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Source badge */}
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    Facebook
                  </span>
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                  {post.title}
                </h3>
                
                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {post.description}
                </p>
                
                {/* Engagement metrics */}
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    <span>{post.engagement.likes}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <span>{post.engagement.comments}</span>
                  </div>
                  <div className="flex items-center">
                    <Share2 className="h-3 w-3 mr-1" />
                    <span>{post.engagement.shares}</span>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>
                      {post.publishedAt ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true }) : 'Unknown date'}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <User className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1">{post.author}</span>
                  </div>
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
