"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  fetchVideosByType,
  YouTubeVideo,
  ContentType,
} from "@/api/youtube/api";
import { Card, CardContent } from "@/components/ui/card";
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

      const response = await fetchVideosByType(type, 30);
      setVideos(response.videos);
      setLastUpdated(new Date().toISOString());

      console.log(
        `✅ ${type} videos loaded! Found ${response.videos.length} videos.`
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

  const handleTabClick = (type: ContentType) => {
    if (type !== activeTab) {
      setActiveTab(type);
      setLoading(true); // Show loader on tab change
    }
  };

  const handleCardClick = (url: string) => {
    window.open(url, "_blank");
  };

  return (
    <div className="container max-w-[1000px] mx-auto px-4 pb-8">
      {/* Tab Navigation */}
      <div className="flex sticky justify-center">
        <div className="mb-6 w-full lg:max-w-[50%]">
          <div className="flex gap-[8px] justify-center">
            {contentTypes.map(({ type, label, icon }, index) => (
              <button
                key={type}
                onClick={() => handleTabClick(type)}
                className={` text-[14px] hover:cursor-pointer px-4 py-1 font-[500] rounded-[8px] transition-all duration-200 ${
                  activeTab === type
                    ? "bg-[#004a77] text-[#c2e7ff]"
                    : "bg-transparent hover:bg-[#3a3b3e] text-[#c2c7c5] border-[1px] border-[#5e5e5e] "
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">YouTube Videos</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Latest videos from{" "}
          {contentTypes.find((t) => t.type === activeTab)?.label} (
          {videos.length} videos)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <span className="text-gray-600 dark:text-gray-400">
                Loading {contentTypes.find(t => t.type === activeTab)?.label} videos...
              </span>
            </div>
          </div>
        ) : error ? (
          <div className="col-span-full flex items-center justify-center py-12">
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
          videos.map((video, index) => (
            <Card
              key={`${video.videoId}-${index}`}
              className="group cursor-pointer bg-white dark:bg-[#1f2125] rounded-[8px] border-0 shadow-md overflow-hidden transition-all duration-300 ease-in-out hover:scale-[102%] hover:shadow-xl"
              onClick={() => handleCardClick(video.url)}
            >
              {video.thumbnail ? (
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  {/* Fallback placeholder */}
                  <div className="hidden absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                        <Play className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium">{video.channelTitle}</p>
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
                <div className="h-48 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                      <Play className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">{video.channelTitle}</p>
                  </div>
                </div>
              )}

              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Source badge */}
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {video.source}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                    {video.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
                    {video.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {video.publishedAt
                          ? formatDistanceToNow(new Date(video.publishedAt), {
                              addSuffix: true,
                            })
                          : "Unknown date"}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <User className="h-3 w-3 mr-1" />
                      <span className="line-clamp-1">{video.channelTitle}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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
    </div>
  );
}
