"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { fetchFacebookPosts, FacebookPost, FacebookResponse } from '@/api/facebook/api';

import { Loader2, ExternalLink, Calendar, User, ThumbsUp, MessageCircle, Share2, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FacebookNewsProps {
  initialData?: FacebookResponse | null;
}

export default function FacebookNews({ initialData }: FacebookNewsProps) {
  const [posts, setPosts] = useState<FacebookPost[]>(initialData?.posts || []);
  const [loading, setLoading] = useState(!initialData); 
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
    <div className="container max-w-[840px] mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Facebook Posts</h1>
            {lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Last updated: {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-0 rounded-2xl overflow-hidden">
        {posts.map((post, index) => (
          <div
            key={`${post.title}-${index}`}
            className="bg-white dark:bg-[#1f2125] px-4 cursor-pointer"
            onClick={() => handleCardClick(post.url)}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 pr-0 sm:pr-4 sm:mb-0">
                  <span className="text-xs sm:text-sm font-[400] text-gray-700 dark:text-gray-100">
                    {post.source}
                  </span>
                  <h3 className="mt-1 mb-4 sm:mb-0 leading-6 sm:leading-normal hover:underline text-lg sm:text-xl font-[400] text-gray-900 dark:text-gray-100">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mt-2">
                    {post.description}
                  </p>
                </div>
                {post.image && typeof post.image === 'string' && post.image.trim() !== '' ? (
                  <div className="relative w-full sm:w-[200px] h-40 sm:h-28 bg-gray-100 dark:bg-gray-700 rounded-[12px] overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                          <User className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-medium">{post.author}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full sm:w-[200px] h-40 sm:h-28 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[12px] flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                        <User className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium">{post.author}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-gray-600 dark:text-gray-100 text-xs sm:text-sm">
                <div className="flex text-[12px] text-[#c4c7c5] items-center gap-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {post.publishedAt ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true }) : 'Unknown date'}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <User className="h-3 w-3" />
                  <span>{post.author}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCardClick(post.url);
                    }}
                    className="px-3 py-1.5 text-sm rounded transition border border-gray-300 text-black hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  >
                    Read Article
                  </button>
                </div>
              </div>
            </div>
          </div>
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
