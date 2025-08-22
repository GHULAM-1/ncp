"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { fetchBangladeshNews, NewsItem } from "@/api/news/api";
import Loader from "../loader";
import {
  Loader2,
  ExternalLink,
  Calendar,
  Globe,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ShareButton from "../home/share-button";
import DisqusComments from "../config/disqus-comments";

export default function RSSNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const REFRESH_INTERVAL = 4 * 60 * 60 * 1000;
  const [openCommentId, setOpenCommentId] = useState<string | null>(null);
  const onCommentToggle = (id: string) => {
    setOpenCommentId(openCommentId === id ? null : id);
  };

  // Infinite scroll states
  const PAGE_SIZE = 30; // Match server limit
  const [displayed, setDisplayed] = useState<NewsItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const page = useRef(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  // Function to load news
  const loadNews = useCallback(async () => {
    try {
      setRefreshing(true);
      console.log("🔄 Refreshing RSS news...");

      const response = await fetchBangladeshNews(1, PAGE_SIZE);
      console.log(response);
      setNews(response.news);
      setDisplayed(response.news);
      setHasMore(response.hasMore);
      setLastUpdated(new Date().toISOString());
      page.current = 1;

      console.log(
        `✅ RSS news refreshed! Found ${response.news.length} articles. Has more: ${response.hasMore}`
      );
    } catch (err) {
      setError("Failed to load news");
      console.error("Error loading news:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Function to load more news for infinite scroll
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const nextPage = page.current + 1;
      console.log(`🔄 Loading page ${nextPage}...`);

      const response = await fetchBangladeshNews(nextPage, PAGE_SIZE);

      if (response.success && response.news.length > 0) {
        setDisplayed((prev) => [...prev, ...response.news]);
        setHasMore(response.hasMore);
        page.current = nextPage;
        console.log(
          `✅ Loaded page ${nextPage}. Total items: ${
            displayed.length + response.news.length
          }`
        );
      } else {
        setHasMore(false);
        console.log("No more news available");
      }
    } catch (err) {
      console.error("Error loading more news:", err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, displayed.length]);

  // Initial load
  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Set up auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        // Only refresh if not currently loading
        loadNews();
      }
    }, REFRESH_INTERVAL);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [loadNews, loading, REFRESH_INTERVAL]);

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

  const handleCardClick = (link: string) => {
    window.open(link, "_blank");
  };

  if (loading && news.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading news...</span>
      </div>
    );
  }

  if (error && news.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => loadNews()}
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
        {displayed.map((item, index) => (
          <div
            key={`${item.title}-${index}`}
            className="bg-white dark:bg-[#1f2125] px-4 cursor-pointer"
            onClick={() => handleCardClick(item.link)}
          >
            <div className="border-b border-gray-200 dark:border-gray-700 py-4">
              <div className="flex flex-col sm:flex-row">
                <div className="flex-1 pr-0 sm:pr-4 sm:mb-0">
                  <span className="text-xs sm:text-sm font-[400] text-[#202124] dark:text-gray-100">
                    {item.source}
                  </span>
                  <h3 className="mt-1 mb-4 sm:mb-0 leading-6 sm:leading-normal hover:underline text-lg sm:text-xl font-[400] text-[#202124] dark:text-gray-100">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[#202124] dark:text-gray-100 text-xs sm:text-sm">
                <div className="flex text-[12px] text-[#717478] dark:text-[#c4c7c5] items-center gap-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {item.date
                      ? formatDistanceToNow(new Date(item.date), {
                          addSuffix: true,
                        })
                      : "Unknown date"}
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="font-semibold text-[#5a5a5a] dark:text-[#c4c7c5]">
                    By {item.source}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="hidden md:flex items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareButton url={item.link} title={item.title} />
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCommentToggle(item.link);
                        }}
                        className="px-3 py-2 text-sm rounded transition border border-gray-300 text-black hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                      >
                        {openCommentId === item.link
                          ? "Close Comments"
                          : "Show Comments"}
                      </button>
                    </div>

                    <div className="flex md:hidden items-center gap-2">
                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareButton url={item.link} title={item.title} />
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCommentToggle(item.link);
                        }}
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
              </div>
            </div>
            {/* Comments section */}
            {openCommentId === item.link && (
              <div className="mt-4 border-b border-gray-200 dark:border-gray-700 pt-4">
                <DisqusComments
                  post={{ slug: item.link, title: item.title }}
                  key={item.link}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Infinite Scroll Loader */}
      {hasMore && (
        <div
          ref={loaderRef}
          className="flex justify-center py-8 text-gray-700 dark:text-gray-300"
        >
          {loadingMore && <Loader />}
        </div>
      )}

      {news.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No news articles found.</p>
        </div>
      )}
    </div>
  );
}
