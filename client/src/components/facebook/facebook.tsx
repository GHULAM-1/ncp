"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  fetchFacebookPosts,
  FacebookPost,
  FacebookResponse,
} from "@/api/facebook/api";

import {
  Loader2,
  ExternalLink,
  Calendar,
  User,
  ThumbsUp,
  MessageCircle,
  Share2,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CustomComments from "../config/custom-comments";
import ShareButton from "../home/share-button";

interface FacebookNewsProps {
  initialData?: FacebookResponse | null;
}

export default function FacebookNews({ initialData }: FacebookNewsProps) {
  const [posts, setPosts] = useState<FacebookPost[]>(initialData?.posts || []);
  const [loading, setLoading] = useState(!initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>(
    initialData ? new Date().toISOString() : ""
  );
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);

  const onCommentToggle = (id: string) => {
    setOpenCommentId(openCommentId === id ? null : id);
  };

  // Function to load posts (only when needed)
  const loadPosts = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log("🔄 Loading Facebook posts...");

      const response = await fetchFacebookPosts(15, 1, 15); // Use pagination
      setPosts(response.posts);
      setLastUpdated(new Date().toISOString());

      console.log(
        `✅ Facebook posts loaded! Found ${response.posts.length} posts.`
      );
    } catch (err) {
      setError("Failed to load posts");
      console.error("Error loading posts:", err);
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
    window.open(url, "_blank");
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
      <div className="space-y-0 rounded-2xl overflow-hidden">
        {posts.map((post, index) => (
          <div key={`${post.postId}-${index}`} className="bg-white dark:bg-[#1f2125] px-4">
            <div
              className="cursor-pointer"
              onClick={() => handleCardClick(post.url)}
            >
              <div className=" border-gray-200 dark:border-gray-700 py-4">
                <div className="flex items-center gap-5 mb-3">
                  {post.profilePicture ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img
                        src={post.profilePicture}
                        alt={post.author}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          target.nextElementSibling?.classList.remove("hidden");
                        }}
                      />
                      {/* Fallback placeholder */}
                      <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {post.author}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        {post.publishedAt
                          ? formatDistanceToNow(new Date(post.publishedAt), {
                              addSuffix: true,
                            })
                          : "Unknown date"}
                      </span>
                      <span>•</span>
                      <span>{post.source.split('facebook.com/')[1] || post.source}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 leading-relaxed">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                    {post.description}
                  </p>
                </div>

                {/* Image */}
                {post.image &&
                typeof post.image === "string" &&
                post.image.trim() !== "" ? (
                  <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                    {/* Fallback placeholder */}
                    <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="text-sm font-medium">{post.author}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <p className="text-sm font-medium">{post.author}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons and comments */}
            <div className="mt-3 flex flex-wrap border-gray-200  border-b-[1px] pb-4 items-center justify-between gap-2 text-gray-600 dark:text-gray-100 text-xs sm:text-sm">
              <div className="flex text-[12px] text-[#c4c7c5] items-center gap-x-2">
                <span>
                  {post.publishedAt
                    ? formatDistanceToNow(new Date(post.publishedAt), {
                        addSuffix: true,
                      })
                    : "Unknown date"}
                </span>
                <span>•</span>
                <span>{post.source.split('facebook.com/')[1] || post.source}</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2">
                  <ShareButton url={post.url} title={post.title} />
                  <button
                    onClick={() => onCommentToggle(post.postId)}
                    className="px-3 hover:cursor-pointer py-1.5 text-sm rounded transition border border-gray-300 text-black hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  >
                    {openCommentId === post.postId ? "Close Comments" : "Show Comments"}
                  </button>
                </div>

                <div className="flex md:hidden items-center gap-2">
                  <ShareButton url={post.url} title={post.title} />

                  <button
                    onClick={() => onCommentToggle(post.postId)}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Comments"
                  >
                    <MessageSquare
                      size={16}
                      className="text-gray-600 dark:text-gray-300"
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments section */}
            {openCommentId === post.postId && (
              <div className="mt-4 border-b border-gray-200 dark:border-gray-700 pt-4">
                <CustomComments 
                  post={{ slug: `facebook_${post.postId}`, title: post.title }} 
                  postType="facebook"
                  key={post.postId} 
                />
              </div>
            )}
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
}
