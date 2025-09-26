"use client";
import React, { useState } from "react";
import { NewsCardProps } from "@/types/news-card-type";
import Image from "next/image";
import CustomComments from "../config/custom-comments";
import ShareButton from "./share-button";
import { Send, MessageSquare } from "lucide-react";

interface NewsCardPropsWithCommentControl extends NewsCardProps {
  openCommentId: string | null;
  onCommentToggle: (id: string) => void;
  postSlug?: string;
}

const NewsCard: React.FC<NewsCardPropsWithCommentControl> = ({
  id,
  source,
  title,
  timeAgo,
  author,
  imageUrl,
  link,
  openCommentId,
  onCommentToggle,
  postSlug,
  platform,
}) => {
  // Create a consistent post slug that matches individual tabs
  const createPostSlug = (url: string, platform?: string, id?: string) => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        // Extract video ID from YouTube URL or use provided ID
        const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : (id ? id.replace('yt_', '') : 'unknown');
        return `youtube_${videoId}`;

      case 'facebook':
        // Use provided ID or extract from URL
        const fbId = id ? id.replace('fb_', '') : 'unknown';
        return `facebook_${fbId}`;

      case 'rss':
        console.log('🔍 RSS tab home page:', {
          title: title.substring(0, 40) + '...',
          link: url,
          slug: `rss_${btoa(url).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}`
        });
        // Use the same logic as RSS tab
        return `rss_${btoa(url).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}`;

      default:
        // Default URL-based slug for other content
        try {
          const urlObj = new URL(url);
          return `${urlObj.hostname}${urlObj.pathname}`.replace(/[^a-zA-Z0-9]/g, '_');
        } catch {
          return btoa(url).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
        }
    }
  };

  // Determine the correct postType based on platform
  const getPostType = (platform?: string): 'youtube' | 'facebook' | 'news' | 'rss' => {
    switch (platform?.toLowerCase()) {
      case 'youtube':
        return 'youtube';
      case 'facebook':
        return 'facebook';
      case 'rss':
        return 'rss';
      default:
        return 'news';
    }
  };

  const generatedSlug = createPostSlug(link, platform, id);
  const post = { slug: generatedSlug, title };
  const postType = getPostType(platform);

  // Debug logging
  console.log('🔍 Home page post:', {
    platform,
    postType,
    link,
    id,
    generatedSlug,
    title: title.substring(0, 30) + '...'
  });

  const isCommentsOpen = openCommentId === postSlug || openCommentId === link;

  return (
    <div className="bg-white dark:bg-[#1f2125] px-4">
      <div className="border-b border-gray-200 dark:border-gray-700 py-4">
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 pr-0 sm:pr-4 sm:mb-0">
              <span className="text-xs sm:text-sm font-[400] text-gray-700 dark:text-gray-100">
                {source}
              </span>
              <h3 className="mt-1 mb-4 sm:mb-0 leading-6 sm:leading-normal hover:underline text-lg sm:text-xl font-[400] text-gray-900 dark:text-gray-100">
                {title}
              </h3>
            </div>
            {imageUrl && (
              <div className="relative w-full sm:w-[200px] h-40 sm:h-28 bg-gray-100 dark:bg-gray-700 rounded-[12px] overflow-hidden">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </a>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-gray-600 dark:text-gray-100 text-xs sm:text-sm">
          <div className="flex text-[12px] text-[#c4c7c5] items-center gap-x-2">
            <span>{timeAgo}</span>
            {author && (
              <>
                <span className="hidden md:inline">•</span>
                <span>By {author}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ShareButton url={link} title={title} />
              <button
                onClick={() => onCommentToggle(postSlug || link)}
                className="px-3 hover:cursor-pointer py-2 text-sm rounded transition border border-gray-300 dark:border-gray-600 text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700"
              >
                {isCommentsOpen ? "Close Comments" : "Show Comments"}
              </button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ShareButton url={link} title={title} />

              <button
                onClick={() => onCommentToggle(postSlug || link)}
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

        {isCommentsOpen && (
          <div className="mt-4 border-t  dark:border-gray-700 pt-4">
            <CustomComments post={post} postType={postType} key={post.slug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
