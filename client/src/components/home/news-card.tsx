"use client";
import React, { useState } from "react";
import { NewsCardProps } from "@/types/news-card-type";
import Image from "next/image";
import DisqusComments from "../config/disqus-comments";
import ShareButton from "./share-button";

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

  return (
    <div className="border-b border-gray-200 p-4 sm:p-6">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 pr-0 sm:pr-4 mb-4 sm:mb-0">
            <span className="text-xs sm:text-sm font-medium text-gray-900">
              {source}
            </span>
            <h3 className="mt-1 text-gray-900 text-lg sm:text-xl font-semibold">
              {title}
            </h3>
          </div>
          {imageUrl && (
            <div className="relative w-full sm:w-[200px] h-40 sm:h-28 bg-gray-100 rounded-md overflow-hidden">
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

      <div className="mt-3 flex items-center justify-between text-gray-600 text-xs sm:text-sm">
        <div className="flex items-center">
          <span>{timeAgo}</span>
          {author && (
            <>
              <span className="mx-2">•</span>
              <span>By {author}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowComments((v) => !v)}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            {showComments ? "Close Comments" : "Show Comments"}
          </button>
          <ShareButton url={link} title={title} />
        </div>
      </div>

      {showComments && (
        <div className="mt-4 border-t pt-4">
          <DisqusComments post={post} key={post.slug} />
        </div>
      )}
    </div>
  );
};

export default NewsCard;
