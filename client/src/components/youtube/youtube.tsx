"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchVideosByType,
  YouTubeVideo,
  ContentType,
} from "@/api/youtube/api";
import Loader from "../loader";
import {
  Loader2,
  Play,
  ExternalLink,
  Calendar,
  User,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function YouTubeNews() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>("channels");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  
  // Infinite scroll states
  const PAGE_SIZE = 15;
  const [displayed, setDisplayed] = useState<YouTubeVideo[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const page = useRef(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const contentTypes: { type: ContentType; label: string; icon: string }[] = [
    { type: "channels", label: "News Channels", icon: "📺" },
    { type: "talkshows", label: "Talk Shows", icon: "🎤" },
    { type: "youtube", label: "YouTube Channels", icon: "📱" },
  ];

  // Function to load videos by type
  const loadVideos = useCallback(async (type: ContentType) => {
    try {
      setRefreshing(true);
      setError(null);
      console.log(`🔄 Loading ${type} videos...`);

      const response = await fetchVideosByType(type, 1, PAGE_SIZE);
      setVideos(response.videos);
      setDisplayed(response.videos);
      setHasMore(response.hasMore);
      setLastUpdated(new Date().toISOString());
      page.current = 1;

      console.log(
        `✅ ${type} videos loaded! Found ${response.videos.length} videos. Has more: ${response.hasMore}`
      );
    } catch (err) {
      setError(`Failed to load ${type} videos`);
      console.error(`Error loading ${type} videos:`, err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load videos when tab changes
  useEffect(() => {
    loadVideos(activeTab);
  }, [activeTab, loadVideos]);

    // Function to load more videos for infinite scroll
    const loadMore = useCallback(async () => {
      if (loadingMore || !hasMore) return;
  
      setLoadingMore(true);
      try {
        const nextPage = page.current + 1;
        console.log(`🔄 Loading page ${nextPage} for ${activeTab}...`);
        
        const response = await fetchVideosByType(activeTab, nextPage, PAGE_SIZE);
        
        if (response.success && response.videos.length > 0) {
          setDisplayed((prev) => [...prev, ...response.videos]);
          setHasMore(response.hasMore);
          page.current = nextPage;
          console.log(`✅ Loaded page ${nextPage}. Total items: ${displayed.length + response.videos.length}`);
        } else {
          setHasMore(false);
          console.log('No more videos available');
        }
      } catch (err) {
        console.error('Error loading more videos:', err);
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
      setLoading(true); // Show loader on tab change
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
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restore scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
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
                className={` text-[14px] hover:cursor-pointer px-4 py-1 font-[500] rounded-[8px] transition-all duration-200 ${
                  activeTab === type
                    ? "dark:bg-[#004a77] bg-[#c2e7ff] dark:text-[#c2e7ff] text-[#001d35]"
                    : "bg-transparent hover:bg-[#3a3b3e] dark:text-[#c2c7c5] text-[#444746] border-[1px] border-[#5e5e5e] "
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="space-y-0 rounded-2xl  overflow-hidden">
        {loading ? (
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
                className="bg-white  dark:bg-[#1f2125] px-4 cursor-pointer"
                onClick={() => handleCardClick(video)}
              >
                <div className="border-b border-gray-200 dark:border-gray-700 py-4">
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex-1 pr-0 sm:pr-4 sm:mb-0">
                      <span className="text-xs sm:text-sm font-[400] text-gray-700 dark:text-gray-100">
                        {video.source}
                      </span>
                      <h3 className="mt-1 mb-4 sm:mb-0 leading-6 sm:leading-normal hover:underline text-lg sm:text-xl font-[400] text-gray-900 dark:text-gray-100">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mt-2">
                        {video.description}
                      </p>
                    </div>
                    {video.thumbnail ? (
                      <div className="relative w-full sm:w-[200px] h-40 sm:h-28 bg-gray-100 dark:bg-gray-700 rounded-[12px] overflow-hidden">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
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
                            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                              <Play className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium">
                              {video.channelTitle}
                            </p>
                          </div>
                        </div>
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                            <Play className="h-6 w-6 text-black" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full sm:w-[200px] h-40 sm:h-28 bg-gradient-to-br from-red-500 to-red-600 rounded-[12px] flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                            <Play className="h-6 w-6" />
                          </div>
                          <p className="text-sm font-medium">
                            {video.channelTitle}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-gray-600 dark:text-gray-100 text-xs sm:text-sm">
                    <div className="flex text-[12px] text-[#c4c7c5] items-center gap-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {video.publishedAt
                          ? formatDistanceToNow(new Date(video.publishedAt), {
                              addSuffix: true,
                            })
                          : "Unknown date"}
                      </span>
                      <span className="hidden md:inline">•</span>
                      <User className="h-3 w-3" />
                      <span>{video.channelTitle}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(video);
                        }}
                        className="px-3 py-1.5 text-sm rounded transition border border-gray-300 text-black hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                      >
                        Watch Video
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Infinite Scroll Loader */}
        {hasMore && displayed.length > 0 && (
          <div
            ref={loaderRef}
            className="flex justify-center py-8 text-gray-700 dark:text-gray-300"
          >
            {loadingMore && <Loader />}
          </div>
        )}
      </div>

      {videos.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No videos found for{" "}
            {contentTypes.find((t) => t.type === activeTab)?.label}.
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
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
                      ? formatDistanceToNow(new Date(selectedVideo.publishedAt), {
                          addSuffix: true,
                        })
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
