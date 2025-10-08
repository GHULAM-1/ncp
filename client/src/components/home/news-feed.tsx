"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import UnifiedCard from "./unified-card";
import Loader from "../loader";
import { NewsCardProps } from "@/types/news-card-type";

interface NewsFeedProps {
  newsItems: NewsCardProps[];
}

export default function NewsFeed({ newsItems }: NewsFeedProps) {
  const PAGE_SIZE = 6;
  // STATES
  const [displayed, setDisplayed] = useState(() =>
    newsItems.slice(0, PAGE_SIZE)
  );
  const [loading, setLoading] = useState(false);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const page = useRef(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // Comment toggle handler - automatically closes other comments
  const handleCommentToggle = (id: string) => {
    setOpenCommentId(openCommentId === id ? null : id);
  };

  // Video play handler for YouTube videos
  const handleVideoPlay = (videoId: string) => {
    setPlayingVideoId(playingVideoId === videoId ? null : videoId);
  };

  // HANDLERS (Delay Added)
  const loadMore = useCallback(() => {
    if (loading) return;
    if (displayed.length >= newsItems.length) return;

    setLoading(true);
    setTimeout(() => {
      const next = newsItems.slice(
        page.current * PAGE_SIZE,
        (page.current + 1) * PAGE_SIZE
      );
      setDisplayed((prev) => [...prev, ...next]);
      page.current += 1;
      setLoading(false);
    }, 1000);
  }, [displayed.length, loading, newsItems]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([ent]) => {
        if (ent.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) obs.unobserve(loaderRef.current);
    };
  }, [loadMore]);

  return (
    <div className="w-full  md:rounded-[18px] dark:bg[#292a2d] dark:text-white">
      <div className="shadow-sm md:rounded-2xl overflow-hidden bg-white dark:bg-[#1f2125]">
        {displayed.map((item) => {
          // Create consistent post slug for comment identification
          const createPostSlug = (url: string) => {
            try {
              const urlObj = new URL(url);
              return `${urlObj.hostname}${urlObj.pathname}`.replace(/[^a-zA-Z0-9]/g, '_');
            } catch {
              return btoa(url).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
            }
          };

          const postSlug = createPostSlug(item.link);

          // Extract additional data based on platform
          let additionalProps = {};

          if (item.platform === 'youtube') {
            // Extract video ID from URL or use ID
            const videoIdMatch = item.link.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
            const videoId = videoIdMatch ? videoIdMatch[1] : (item.id ? item.id.replace('yt_', '') : 'unknown');

            additionalProps = {
              videoId,
              thumbnail: item.imageUrl,
              channelTitle: item.source,
              channelLogo: item.imageUrl, // You might want to add channelLogo to your data structure
              videoUrl: item.link,
            };
          } else if (item.platform === 'facebook') {
            additionalProps = {
              profilePicture: item.profilePicture,
            };
          }

          return (
            <UnifiedCard
              key={item.slug}
              {...item}
              {...additionalProps}
              openCommentId={openCommentId}
              onCommentToggle={handleCommentToggle}
              onVideoPlay={handleVideoPlay}
              playingVideoId={playingVideoId}
              postSlug={postSlug}
            />
          );
        })}
      </div>

      <div
        ref={loaderRef}
        className="flex justify-center py-8 text-gray-700 dark:text-gray-300"
      >
        {loading && <Loader />}
      </div>
    </div>
  );
}
