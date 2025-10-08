"use client";
import React, { useState } from "react";
import { NewsCardProps } from "@/types/news-card-type";
import CustomComments from "../config/custom-comments";
import ShareButton from "./share-button";
import { MessageSquare, Play, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UnifiedCardProps extends NewsCardProps {
  openCommentId: string | null;
  onCommentToggle: (id: string) => void;
  postSlug?: string;
  playingVideoId?: string | null;
  onVideoPlay?: (videoId: string) => void;
}

const UnifiedCard: React.FC<UnifiedCardProps> = ({
  id,
  source,
  title,
  description,
  timeAgo,
  author,
  imageUrl,
  link,
  openCommentId,
  onCommentToggle,
  postSlug,
  platform,
  date,
  channelLogo,
  channelTitle,
  videoId,
  thumbnail,
  profilePicture,
  videoUrl,
  playingVideoId,
  onVideoPlay,
}) => {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  // Create a consistent post slug that matches individual tabs
  const createPostSlug = (url: string, platform?: string, id?: string) => {
    switch (platform?.toLowerCase()) {
      case "youtube":
        const videoIdMatch = url.match(
          /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
        );
        const extractedVideoId = videoIdMatch
          ? videoIdMatch[1]
          : id
          ? id.replace("yt_", "")
          : "unknown";
        return `youtube_${extractedVideoId}`;
      case "facebook":
        const fbId = id ? id.replace("fb_", "") : "unknown";
        return `facebook_${fbId}`;
      case "rss":
        return `rss_${btoa(url)
          .replace(/[^a-zA-Z0-9]/g, "_")
          .substring(0, 20)}`;
      default:
        try {
          const urlObj = new URL(url);
          return `${urlObj.hostname}${urlObj.pathname}`.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          );
        } catch {
          return btoa(url)
            .replace(/[^a-zA-Z0-9]/g, "_")
            .substring(0, 20);
        }
    }
  };

  const getPostType = (
    platform?: string
  ): "youtube" | "facebook" | "news" | "rss" => {
    switch (platform?.toLowerCase()) {
      case "youtube":
        return "youtube";
      case "facebook":
        return "facebook";
      case "rss":
        return "rss";
      default:
        return "news";
    }
  };

  const toggleDescription = (postId: string) => {
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const handleAuthorClick = (source: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const facebookPageUrl = source.startsWith("http")
      ? source
      : `https://www.facebook.com/${source}`;
    window.open(facebookPageUrl, "_blank");
  };

  const handleCardClick = (url: string) => {
    window.open(url, "_blank");
  };

  const handleVideoClick = () => {
    if (videoId && onVideoPlay) {
      onVideoPlay(videoId);
    }
  };

  const generatedSlug = createPostSlug(link, platform, id);
  const post = { slug: generatedSlug, title };
  const postType = getPostType(platform);
  const isCommentsOpen = openCommentId === postSlug || openCommentId === link;

  // RSS/News Card UI
  if (platform === "rss" || platform === "news" || !platform) {
    return (
      <div
        className="bg-white dark:bg-[#1f2125] px-4 cursor-pointer"
        onClick={() => handleCardClick(link)}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 pt-2 pb-2">
          <div className="flex flex-row gap-4">
            <div className="flex-1">
              <span className="text-xs sm:text-sm font-[400] text-[#202124] dark:text-gray-100">
                {source}
              </span>
              <h3 className="mt-1 mb-2 leading-6 sm:leading-normal hover:underline text-[18px] lg:text-[20px] font-[400] line-clamp-3 text-[#202124] dark:text-gray-100">
                {title}
              </h3>
              <p className="text-[12px] hidden md:block text-[#717478] dark:text-[#c4c7c5]">
                {date
                  ? formatDistanceToNow(new Date(date), { addSuffix: true })
                  : "Unknown date"}
              </p>
            </div>
            {imageUrl && (
              <div className="flex-shrink-0 rounded">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-[100px] h-[100px] md:w-50 md:h-28 object-cover rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between md:justify-end gap-2 text-[#202124] dark:text-gray-100 text-xs sm:text-sm">
            <p className="text-[12px] md:hidden block text-[#717478] dark:text-[#c4c7c5]">
              {date
                ? formatDistanceToNow(new Date(date), { addSuffix: true })
                : "Unknown date"}
            </p>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareButton url={link} title={title} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommentToggle(link);
                  }}
                  className="px-3 hover:cursor-pointer py-2 text-sm rounded transition text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700 dark:bg-[#292a2d] bg-[#f6f8fc]"
                >
                  {openCommentId === link ? "Close Comments" : "Show Comments"}
                </button>
              </div>

              <div className="flex md:hidden items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <ShareButton url={link} title={title} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCommentToggle(link);
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

        {openCommentId === link && (
          <div
            className=" border-b border-gray-200 dark:border-gray-700 "
            onClick={(e) => e.stopPropagation()}
          >
            <CustomComments post={post} postType={postType} key={link} />
          </div>
        )}
      </div>
    );
  }

  // YouTube Card UI
  if (platform === "youtube") {
    return (
      <div
        className="bg-white dark:bg-[#1f2125] px-0 cursor-pointer rounded-lg overflow-hidden"
        onClick={handleVideoClick}
      >
        <div className="border-b border-gray-200 dark:border-gray-700 pt-0 mb-2 pb-2">
          {/* Video Player or Thumbnail */}
          <div className="mb-6">
            {playingVideoId === videoId ? (
              <div
                className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700  overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  title={title}
                  className="w-full h-full  object-cover"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : thumbnail ? (
              <div className="relative w-full bg-gray-100 dark:bg-gray-700 overflow-hidden group cursor-pointer hover:shadow-xl transition-all duration-300" style={{ aspectRatio: '16/9' }}>
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full h-full object-cover object-center transition-transform duration-300"
                  style={{ 
                    objectPosition: 'center center',
                    transform: 'scale(1.1)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                      <Play className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium">{channelTitle}</p>
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
                  <p className="text-lg font-medium">{channelTitle}</p>
                </div>
              </div>
            )}
          </div>

          {/* Content Layout: Text on Left, Buttons on Right */}
          <div className="flex flex-col gap-4 px-4">
            <div className="flex-1">
              <div className="flex gap-2">
                <a
                  href={
                    channelTitle
                      ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
                          channelTitle
                        )}`
                      : "#"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={channelLogo}
                    alt={channelTitle}
                    className="w-10 h-10 rounded-full hover:opacity-80 transition-opacity"
                  />
                </a>

                <div className="w-full">
                  <div>
                    <a
                      href={videoUrl || link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-[18px] lg:text-[20px] font-bold text-gray-900 dark:text-gray-100 leading-tight hover:underline cursor-pointer transition-all line-clamp-3 duration-200 hover:text-blue-600 dark:hover:text-blue-400">
                        {title}
                      </h3>
                    </a>
                  </div>
                  <div className="flex text-[#AAAAAA] justify-between gap-1">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center rounded gap-2 pt-1">
                        <a
                          href={
                            channelTitle
                              ? `https://www.youtube.com/results?search_query=${encodeURIComponent(
                                  channelTitle
                                )}`
                              : "#"
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs sm:text-sm line-clamp-3 font-medium hover:underline hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                          {channelTitle}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 rounded">
                        <span className="text-xs sm:text-sm sm:font-medium">
                          {date
                            ? formatDistanceToNow(new Date(date), {
                                addSuffix: true,
                              })
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex flex-row gap-3 lg:flex-shrink-0">
                        <div onClick={(e) => e.stopPropagation()}>
                          <ShareButton url={videoUrl || link} title={title} />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onCommentToggle(videoId || "");
                          }}
                          className="flex-1 lg:flex-none md:px-6 text-sm font-medium rounded transition-all duration-200 text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700 hover:cursor-pointer active:scale-95 dark:bg-[#292a2d] bg-[#f6f8fc]"
                        >
                          <span className="block md:hidden">
                            <MessageSquare className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                          </span>
                          <span className="hidden md:block">
                            {openCommentId === videoId
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

        {openCommentId === videoId && (
          <div
            className=" border-b border-gray-200 dark:border-gray-700 "
            onClick={(e) => e.stopPropagation()}
          >
            <CustomComments post={post} postType={postType} key={videoId} />
          </div>
        )}
      </div>
    );
  }

  // Facebook Card UI
  if (platform === "facebook") {
    const postId = id?.replace("fb_", "") || "";

    return (
      <div className="bg-white dark:bg-[#1f2125] px-4">
        <div className="cursor-pointer" onClick={() => handleCardClick(link)}>
          <div className="border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center gap-5 mb-3">
              {profilePicture ? (
                <div
                  className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => handleAuthorClick(source || "", e)}
                >
                  <img
                    src={profilePicture}
                    alt={author}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.nextElementSibling?.classList.remove("hidden");
                    }}
                  />
                  <div className="hidden w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
              ) : (
                <div
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={(e) => handleAuthorClick(source || "", e)}
                >
                  <User className="h-5 w-5 text-white" />
                </div>
              )}
              <div className="flex-1">
                <h4
                  className="font-semibold text-gray-900 dark:text-white text-sm cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => handleAuthorClick(source || "", e)}
                >
                  {author}
                </h4>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {date
                      ? formatDistanceToNow(new Date(date), { addSuffix: true })
                      : "Unknown date"}
                  </span>
                  <span>•</span>
                  <span>{source?.split("facebook.com/")[1] || source}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {description &&
              description.trim() &&
              !description.startsWith("[Post without text content") && (
                <div className="mb-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {(() => {
                      const isExpanded = expandedDescriptions.has(postId);
                      const shouldShowReadMore =
                        description && description.length > 200;
                      const displayText =
                        shouldShowReadMore && !isExpanded
                          ? description.substring(0, 200)
                          : description;

                      return (
                        <p>
                          {displayText}
                          {shouldShowReadMore && !isExpanded && "... "}
                          {shouldShowReadMore && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDescription(postId);
                              }}
                              className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium text-sm inline"
                            >
                              {isExpanded ? " Read less" : "See more"}
                            </button>
                          )}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

            {/* Image */}
            {imageUrl &&
            typeof imageUrl === "string" &&
            imageUrl.trim() !== "" ? (
              <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <p className="text-sm font-medium">{author}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                <div className="text-center text-white">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-medium">{author}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons and comments */}
        <div className="mt-3 flex flex-wrap border-gray-200 border-b-[1px] pb-2 items-center justify-end gap-2 text-gray-600 dark:text-gray-100 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ShareButton url={link} title={title} />
              <button
                onClick={() => onCommentToggle(postId)}
                className="px-3 hover:cursor-pointer py-2 text-sm rounded transition text-black hover:bg-gray-200 dark:text-white dark:hover:bg-gray-700 dark:bg-[#292a2d] bg-[#f6f8fc]"
              >
                {openCommentId === postId ? "Close Comments" : "Show Comments"}
              </button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ShareButton url={link} title={title} />
              <button
                onClick={() => onCommentToggle(postId)}
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
        {openCommentId === postId && (
          <div className="border-b border-gray-200 dark:border-gray-700 ">
            <CustomComments post={post} postType={postType} key={postId} />
          </div>
        )}
      </div>
    );
  }

  // Default fallback to generic card
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
              <h3 className="mt-1 mb-4 sm:mb-0 leading-6 sm:leading-normal hover:underline text-[18px] lg:text-[20px] font-[400] text-gray-900 dark:text-gray-100">
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
                    target.style.display = "none";
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
          <div className="mt-4 border-t dark:border-gray-700 pt-4">
            <CustomComments post={post} postType={postType} key={post.slug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedCard;
