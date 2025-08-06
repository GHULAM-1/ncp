"use client";
import React, { useState } from "react";
import { NewsCardProps } from "@/types/news-card-type";
import Image from "next/image";
import DisqusComments from "../config/disqus-comments";
import ShareButton from "./share-button";
import { Send, MessageSquare } from "lucide-react";

const NewsCard: React.FC<NewsCardProps> = ({
  source,
  title,
  timeAgo,
  author,
  imageUrl,
  link,
}) => {
  const [showComments, setShowComments] = useState(false);
  const post = { slug: link, title };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: link,
        });
      } catch (error) {
        console.error("Sharing failed:", error);
      }
    } else {
      alert("Sharing is not supported on this browser.");
    }
  };

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
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 640px) 100vw, 200px"
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
                onClick={() => setShowComments((prev) => !prev)}
                className="px-3 py-1.5 text-sm rounded transition border border-gray-300 text-black hover:bg-gray-200 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
              >
                {showComments ? "Close Comments" : "Show Comments"}
              </button>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <ShareButton url={link} title={title} />

              <button
                onClick={() => setShowComments((prev) => !prev)}
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

        {showComments && (
          <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <DisqusComments post={post} key={post.slug} />
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
