"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchVideosByType,
  YouTubeVideo,
  ContentType,
} from "@/api/youtube/api";
// import Loader from "../loader"; // Not needed for mock data
import {
  Loader2,
  Play,
  ExternalLink,
  Calendar,
  User,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import CustomComments from "../config/custom-comments";
import ShareButton from "../home/share-button";
import Loader from "../loader";

interface YouTubeNewsProps {
  initialData: {
    channels: { videos: YouTubeVideo[]; hasMore: boolean; success: boolean };
    talkshows: { videos: YouTubeVideo[]; hasMore: boolean; success: boolean };
    youtube: { videos: YouTubeVideo[]; hasMore: boolean; success: boolean };
  };
}

export default function YouTubeNews({ initialData }: YouTubeNewsProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>(
    initialData.channels.videos || []
  );
  const [loading, setLoading] = useState(false); // Start with false since we have initial data
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>("channels");
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const onCommentToggle = (id: string) => {
    setOpenCommentId(openCommentId === id ? null : id);
  };

  // API Quota Management - Adjust these for free API limits also see line 140
  const API_QUOTA_LIMITS = {
    // Free API: Reduce these numbers to save quota
    INITIAL_LOAD_SIZE: 5, // Reduced from 20 to 10 for free API
    PAGE_SIZE: 5, // Reduced from 10 to 5 for free API
    MAX_TOTAL_VIDEOS: 1, // Maximum total videos to load across all pages
    SEARCH_QUERIES_PER_CHANNEL: 4, // Reduce search queries per channel (was 4)
    DELAY_BETWEEN_REQUESTS: 100, // Increase delay between API calls (was 100ms)
  } as const;

  // Infinite scroll states
  const PAGE_SIZE = API_QUOTA_LIMITS.PAGE_SIZE;
  const INITIAL_LOAD_SIZE = API_QUOTA_LIMITS.INITIAL_LOAD_SIZE;
  const [displayed, setDisplayed] = useState<YouTubeVideo[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const page = useRef(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const contentTypes: { type: ContentType; label: string; icon: string }[] = [
    { type: "youtube", label: "Shorts", icon: "📱" },
    { type: "channels", label: "News", icon: "📺" },
    { type: "talkshows", label: "Talk Shows", icon: "🎤" },
  ];

  // Function to load videos by type
  const loadVideos = useCallback(
    async (type: ContentType) => {
      try {
        setLoading(true);
        setError(null);
        console.log(`🔄 Loading ${type} videos...`);

        const response = await fetchVideosByType(type, 1, INITIAL_LOAD_SIZE);

        setVideos(response.videos);
        setDisplayed(response.videos);
        setHasMore(response.hasMore);
        page.current = 1;

        console.log(
          `✅ ${type} videos loaded! Found ${response.videos.length} videos. Has more: ${response.hasMore}`
        );
      } catch (err) {
        console.error(`Error loading ${type} videos:`, err);

        // Set error message for user
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load videos";
        setError(errorMessage);

        // Check if it's a network error (server not running)
        if (err instanceof Error && err.message.includes("fetch")) {
          setError(
            "Server not accessible. Please check if the backend server is running."
          );
        }

        // Reset state on error
        setVideos([]);
        setDisplayed([]);
        setHasMore(false);
        page.current = 1;
      } finally {
        setLoading(false);
        setTabLoading(false);
        console.log(
          `📊 Loading states reset: loading=${false}, tabLoading=${false}`
        );
      }
    },
    [INITIAL_LOAD_SIZE]
  );

  // Load videos when tab changes
  useEffect(() => {
    // Use initial data from ISR for the default tab (channels)
    if (activeTab === "channels" && initialData.channels.videos.length > 0) {
      setVideos(initialData.channels.videos);
      setDisplayed(initialData.channels.videos);
      setHasMore(initialData.channels.hasMore);
      setTabLoading(false);
    } else if (
      activeTab === "talkshows" &&
      initialData.talkshows.videos.length > 0
    ) {
      setVideos(initialData.talkshows.videos);
      setDisplayed(initialData.talkshows.videos);
      setHasMore(initialData.talkshows.hasMore);
      setTabLoading(false);
    } else if (
      activeTab === "youtube" &&
      initialData.youtube.videos.length > 0
    ) {
      setVideos(initialData.youtube.videos);
      setDisplayed(initialData.youtube.videos);
      setHasMore(initialData.youtube.hasMore);
      setTabLoading(false);
    } else {
      // Only call API if no initial data available
      loadVideos(activeTab);
    }
  }, [activeTab, loadVideos, initialData]);

  // Debug: Monitor loading states
  useEffect(() => {
    console.log(
      `🔍 State change - loading: ${loading}, tabLoading: ${tabLoading}, videos: ${videos.length}, displayed: ${displayed.length}`
    );
  }, [loading, tabLoading, videos.length, displayed.length]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    // Check if we've reached the maximum total videos limit
    if (displayed.length >= API_QUOTA_LIMITS.MAX_TOTAL_VIDEOS) {
      console.log(
        `🚫 Reached maximum videos limit: ${API_QUOTA_LIMITS.MAX_TOTAL_VIDEOS}`
      );
      setHasMore(false);
      return;
    }

    setLoadingMore(true);
    try {
      const nextPage = page.current + 1;
      console.log(`🔄 Loading page ${nextPage} for ${activeTab}...`);

      const response = await fetchVideosByType(activeTab, nextPage, PAGE_SIZE);

      if (response.success && response.videos.length > 0) {
        setDisplayed((prev) => [...prev, ...response.videos]);
        setHasMore(response.hasMore);
        page.current = nextPage;
        console.log(
          `✅ Loaded page ${nextPage}. Total items: ${
            displayed.length + response.videos.length
          }`
        );
      } else {
        setHasMore(false);
        console.log("No more videos available");
      }
    } catch (err) {
      console.error("Error loading more videos:", err);
      // Fallback: set hasMore to false to prevent infinite retries
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, activeTab, displayed.length]);

  // Set up intersection observer for infinite scroll
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

  const handleTabClick = (type: ContentType) => {
    if (type !== activeTab) {
      setActiveTab(type);
      setError(null);
      setPlayingVideoId(null); // Reset playing video when changing tabs

      // Use initial data from ISR if available
      let initialVideos: YouTubeVideo[] = [];
      let initialHasMore = false;

      switch (type) {
        case "channels":
          initialVideos = initialData.channels.videos || [];
          initialHasMore = initialData.channels.hasMore || false;
          break;
        case "talkshows":
          initialVideos = initialData.talkshows.videos || [];
          initialHasMore = initialData.talkshows.hasMore || false;
          break;
        case "youtube":
          initialVideos = initialData.youtube.videos || [];
          initialHasMore = initialData.youtube.hasMore || false;
          break;
      }

      if (initialVideos.length > 0) {
        // Use initial data from ISR
        setVideos(initialVideos);
        setDisplayed(initialVideos);
        setHasMore(initialHasMore);
        setTabLoading(false);
      } else {
        // Show loading and fetch from API if no initial data
        setTabLoading(true);
        setDisplayed([]);
        setVideos([]);
        setHasMore(true);
        loadVideos(type);
      }

      page.current = 1;
    }
  };

  const handleCardClick = (video: YouTubeVideo) => {
    setPlayingVideoId(playingVideoId === video.videoId ? null : video.videoId);
  };

  return (
    <div className="w-full md:container md:max-w-[840px] md:mx-auto pb-8">
      {/* Tab Navigation */}
      <div className="flex sticky justify-center">
        <div className="my-2 w-full lg:max-w-[90%]">
          <div className="flex gap-[8px] justify-center">
            {contentTypes.map(({ type, label, icon }, index) => (
              <button
                key={type}
                onClick={() => handleTabClick(type)}
                disabled={tabLoading}
                className={` text-[14px] hover:cursor-pointer px-4 py-1 font-[500] rounded-[8px] transition-all duration-200 ${
                  activeTab === type
                    ? "dark:bg-[#004a77] bg-[#c2e7ff] dark:text-[#c2e7ff] text-[#001d35]"
                    : "bg-transparent hover:bg-[#3a3b3e] hover:text-white dark:text-[#c2c7c5] text-[#444746] border-[1px] border-[#5e5e5e] "
                } ${tabLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Loading Indicator */}
      {tabLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
          </div>
        </div>
      )}

      <div className="space-y-0 bg-white dark:bg-[#1f2125] overflow-hidden">
        {loading &&
        !tabLoading &&
        !initialData.channels.videos.length &&
        !initialData.talkshows.videos.length &&
        !initialData.youtube.videos.length ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <span className="text-gray-600 dark:text-gray-400">
                Loading {contentTypes.find((t) => t.type === activeTab)?.label}{" "}
                videos...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => loadVideos(activeTab)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {displayed.map((video, index) => (
              <div
                key={`${video.videoId}-${index}`}
                className="bg-white dark:bg-[#1f2125] px-0 cursor-pointer rounded-lg overflow-hidden"
                onClick={() => handleCardClick(video)}
              >
                <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
                  {/* Video Player or Thumbnail */}
                  <div className="mb-6">
                    {playingVideoId === video.videoId ? (
                      <div
                        className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700  overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <iframe
                          src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1`}
                          title={video.title}
                          className="w-full h-full  object-cover"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    ) : video.thumbnail ? (
                      <div className="relative w-full bg-gray-100 dark:bg-gray-700 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300" style={{ aspectRatio: '16/9' }}>
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover object-center transition-transform duration-300"
                          style={{ 
                            objectPosition: 'center center',
                            transform: 'scale(1.1)'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            target.nextElementSibling?.classList.remove(
                              "hidden"
                            );
                          }}
                        />
                        {/* Fallback placeholder */}
                        <div className="hidden absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                              <Play className="h-8 w-8" />
                            </div>
                            <p className="text-lg line-clamp-3 font-medium">
                              {video.channelTitle}
                            </p>
                          </div>
                        </div>
                        {/* Play button overlay */}
                        <div className="absolute inset-0  bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-105 transition-all duration-200 shadow-lg">
                            <Play className="h-6 w-6 text-gray-800 ml-1" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-64 bg-gradient-to-br from-red-500 to-red-600 rounded-[16px] flex items-center justify-center group cursor-pointer hover:shadow-xl transition-all duration-300">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
                            <Play className="h-6 w-6 text-gray-800 ml-1" fill="currentColor" />
                          </div>
                          <p className="text-lg line-clamp-3 font-medium">
                            {video.channelTitle}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Layout: Text on Left, Buttons on Right */}
                  <div className="flex flex-col gap-4 px-4">
                    {/* Left Side - Text Content */}
                    <div className="flex-1">
                      <div className="flex gap-2">
                        <a
                          href={
                            video.channelHandle
                              ? `https://www.youtube.com/@${video.channelHandle}`
                              : video.channelId
                              ? `https://www.youtube.com/channel/${video.channelId}`
                              : `https://www.youtube.com/results?search_query=${encodeURIComponent(
                                  video.channelTitle
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <img
                            src={video.channelLogo}
                            alt={video.channelTitle}
                            className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
                          />
                        </a>

                        <div className="w-full">
                          <div>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h3 className="text-[18px] lg:text-[20px] font-[400] line-clamp-3 text-gray-900 dark:text-gray-100 leading-tight hover:underline cursor-pointer transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400">
                                {video.title}
                              </h3>
                            </a>
                          </div>
                          <div className="flex text-[#AAAAAA] justify-between gap-1">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center rounded gap-2 pt-1 ">
                                {/* <User className="h-3 w-3 sm:h-4 sm:w-4" /> */}
                                <a
                                  href={
                                    video.channelHandle
                                      ? `https://www.youtube.com/@${video.channelHandle}`
                                      : video.channelId
                                      ? `https://www.youtube.com/channel/${video.channelId}`
                                      : `https://www.youtube.com/results?search_query=${encodeURIComponent(
                                          video.channelTitle
                                        )}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs sm:text-sm font-medium hover:underline hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                >
                                  {video.channelTitle}
                                </a>
                              </div>
                              <div className="flex items-center gap-2 rounded ">
                                {/* <Calendar className="h-3 w-3 sm:h-4 sm:w-4" /> */}
                                <span className="text-xs sm:text-sm sm:font-medium">
                                  {video.publishedAt
                                    ? formatDistanceToNow(
                                        new Date(video.publishedAt),
                                        {
                                          addSuffix: true,
                                        }
                                      )
                                    : "Unknown date"}
                                </span>
                              </div>
                            </div>
                            {/* Metadata */}
                            <div className="flex mt-[6px] flex-wrap items-center justify-end gap-4  text-sm text-gray-500 dark:text-gray-400">
                              {/* Right Side - Action Buttons */}
                              <div className="flex flex-row  gap-3 lg:flex-shrink-0 ">
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className=""
                                >
                                  <ShareButton
                                    url={video.url}
                                    title={video.title}
                                  />
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCommentToggle(video.videoId);
                                  }}
                                  className="flex-1 lg:flex-none md:px-6 text-sm font-medium rounded  transition-all duration-200   text-black hover:bg-gray-100  dark:text-white dark:hover:bg-gray-700 
                                hover:cursor-pointer
                                 active:scale-95 dark:bg-[#292a2d] bg-[#f6f8fc]
                                "
                                >
                                  <span className="block md:hidden">
                                    <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                  </span>
                                  <span className="hidden md:block">
                                    {openCommentId === video.videoId
                                      ? "Close Comments"
                                      : "Show Comments"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments section */}
                {openCommentId === video.videoId && (
                  <div
                    className=" border-b border-gray-200 dark:border-gray-700 "
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CustomComments
                      post={{
                        slug: `youtube_${video.videoId}`,
                        title: video.title,
                      }}
                      postType="youtube"
                      key={video.videoId}
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Infinite scroll loader */}
        {hasMore && displayed.length > 0 && (
          <div
            ref={loaderRef}
            className="flex justify-center py-8 text-gray-700 dark:text-gray-300"
          >
            {loadingMore && (
              <div className="flex items-center gap-2">
                <Loader />
              </div>
            )}
          </div>
        )}
      </div>

      {/* No videos found message - only show when not loading and no videos */}
      {!loading && !tabLoading && videos.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No videos found for{" "}
            {contentTypes.find((t) => t.type === activeTab)?.label}.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Try switching to a different tab.
          </p>
        </div>
      )}
    </div>
  );
}
