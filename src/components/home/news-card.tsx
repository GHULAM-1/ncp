import React from "react";
import { NewsCardProps } from "@/types/news-card-type";
import Image from "next/image";

const NewsCard: React.FC<NewsCardProps> = ({
  source,
  title,
  timeAgo,
  author,
  imageUrl,
}) => {
  return (
    <a
      href="#"
      target="blank"
      className="border-gray-200 block first:p-4 pt-0 px-2 sm:px-4 pb-4 cursor-pointer"
    >
      <div className="flex">
        <div className="flex-1 pr-2 sm:pr-4">
          <div className="flex items-center mb-1">
            <span className="text-xs sm:text-sm font-medium text-gray-900">
              {source}
            </span>
          </div>
          <h3 className="text-gray-900 text-lg sm:text-xl font-medium mb-3 sm:mb-4">
            {title}
          </h3>
        </div>

        {imageUrl && (
          <div className="relative w-[100px] h-20 sm:w-[200px] sm:h-28 ml-2 sm:ml-4 bg-gray-100 rounded-md overflow-hidden">
            <Image
              src={imageUrl}
              alt={title}
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 640px) 100px, 200px"
            />
          </div>
        )}
      </div>

      <div className="flex items-center text-xs sm:text-sm border-b pb-3 sm:pb-4 text-gray-600">
        <span>{timeAgo}</span>
        {author && (
          <div className="flex items-center justify-center ml-2">
            <span className="mx-1">•</span>
            <span>By {author}</span>
          </div>
        )}
      </div>
    </a>
  );
};

export default NewsCard;
