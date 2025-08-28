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
  const [videos, setVideos] = useState<YouTubeVideo[]>(initialData.channels.videos || []);
  const [loading, setLoading] = useState(false); // Start with false since we have initial data
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>("channels");
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);

  const onCommentToggle = (id: string) => {
    setOpenCommentId(openCommentId === id ? null : id);
  };

  // API Quota Management - Adjust these for free API limits also see line 140
  const API_QUOTA_LIMITS = {
    // Free API: Reduce these numbers to save quota
    INITIAL_LOAD_SIZE: 20, // Reduced from 20 to 10 for free API
    PAGE_SIZE: 10, // Reduced from 10 to 5 for free API
    MAX_TOTAL_VIDEOS: 50, // Maximum total videos to load across all pages
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
    { type: "channels", label: "News Channels", icon: "📺" },
    { type: "talkshows", label: "Talk Shows", icon: "🎤" },
    { type: "youtube", label: "YouTube Shorts", icon: "📱" },
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
    } else if (activeTab === "talkshows" && initialData.talkshows.videos.length > 0) {
      setVideos(initialData.talkshows.videos);
      setDisplayed(initialData.talkshows.videos);
      setHasMore(initialData.talkshows.hasMore);
      setTabLoading(false);
    } else if (activeTab === "youtube" && initialData.youtube.videos.length > 0) {
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

  // Function to load more videos for infinite scroll
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
    setSelectedVideo(video);
  };

  const closeVideo = () => {
    setSelectedVideo(null);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedVideo) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [selectedVideo]);

  return (
    <div className="container max-w-[840px] mx-auto pb-8">
      {/* Tab Navigation */}
      <div className="flex sticky justify-center">
        <div className="mb-6 w-full lg:max-w-[90%]">
          <div className="flex gap-[8px] justify-center">
            {contentTypes.map(({ type, label, icon }, index) => (
              <button
                key={type}
                onClick={() => handleTabClick(type)}
                disabled={tabLoading}
                className={` text-[14px] hover:cursor-pointer px-4 py-1 font-[500] rounded-[8px] transition-all duration-200 ${
                  activeTab === type
                    ? "dark:bg-[#004a77] bg-[#c2e7ff] dark:text-[#c2e7ff] text-[#001d35]"
                    : "bg-transparent hover:bg-[#3a3b3e] dark:text-[#c2c7c5] text-[#444746] border-[1px] border-[#5e5e5e] "
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

      <div className="space-y-0 rounded-2xl  overflow-hidden">
        {loading && !tabLoading && (!initialData.channels.videos.length && !initialData.talkshows.videos.length && !initialData.youtube.videos.length) ? (
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
                className="bg-white dark:bg-[#1f2125] px-4 cursor-pointer"
                onClick={() => handleCardClick(video)}
              >
                <div className="border-b border-gray-200 dark:border-gray-700 py-4">
                  {/* Big Image on Top */}
                  <div className="mb-6">
                    {video.thumbnail ? (
                      <div className="relative w-full h-72 bg-gray-100 dark:bg-gray-700 rounded-[16px] overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                            <p className="text-lg font-medium">
                              {video.channelTitle}
                            </p>
                          </div>
                        </div>
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <Play className="h-10 w-10 text-black" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full h-64 bg-gradient-to-br from-red-500 to-red-600 rounded-[16px] flex items-center justify-center group cursor-pointer hover:shadow-xl transition-all duration-300">
                        <div className="text-center text-white">
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                            <Play className="h-8 w-8" />
                          </div>
                          <p className="text-lg font-medium">
                            {video.channelTitle}
                          </p>
                        </div>

                      </div>
                    )}
                  </div>

                  {/* Content Layout: Text on Left, Buttons on Right */}
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Left Side - Text Content */}
                    <div className="flex-1">
                      <span className="inline-block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full mb-4">
                          <>
                            <span className="block sm:hidden ">
                                {video.source.length > 8 ? video.source.substring(0, 24) + '...' : video.source}
                              </span>
                            <span className="hidden sm:block">
                              {video.source}
                            </span>
                          </>

                      </span>
                      <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight hover:underline cursor-pointer transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400">
                        {video.title}
                      </h3>

                      {/* Commented out description as requested */}
                      {/* <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mt-2">
                        {video.description}
                      </p> */}

                      {/* Metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex flex-row gap-2">
                          <div className="flex items-center gap-2 rounded bg-gray-50 dark:bg-gray-800 px-3 py-2 ">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
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
                          <div className="flex items-center rounded gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 ">
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="text-xs sm:text-sm font-medium">
                              {video.channelTitle}
                            </span>
                          </div>
                        </div>
                        {/* Right Side - Action Buttons */}
                        <div className="flex flex-row  gap-3 lg:flex-shrink-0 ">
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className=""
                          >
                            <ShareButton url={video.url} title={video.title} />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCommentToggle(video.videoId);
                            }}
                            className="flex-1 lg:flex-none md:px-6 text-sm font-medium rounded transition-all duration-200 md:border border-gray-300 text-black hover:bg-gray-100 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700 hover:shadow-md active:scale-95"
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

                {/* Comments section */}
                {openCommentId === video.videoId && (
                  <div className="mt-4 border-b border-gray-200 dark:border-gray-700 pt-4">
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

      {/* Embedded Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/30  flex items-center justify-center z-50 p-4">
          <div className="bg-white  dark:bg-[#1f2125] rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedVideo.title}
              </h3>
              <button
                onClick={closeVideo}
                className="text-gray-500 hover:cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div
                className="relative w-full"
                style={{ paddingBottom: "56.25%" }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo.videoId}`}
                  title={selectedVideo.title}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {selectedVideo.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {selectedVideo.description}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <span className="mr-4">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {selectedVideo.publishedAt
                      ? formatDistanceToNow(
                          new Date(selectedVideo.publishedAt),
                          {
                            addSuffix: true,
                          }
                        )
                      : "Unknown date"}
                  </span>
                  <span>
                    <User className="inline w-4 h-4 mr-1" />
                    {selectedVideo.channelTitle}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
