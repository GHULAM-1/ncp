import Image from "next/image";
import React from "react";
import { NewsCardProps } from "@/types/news-card-type";
const NewsCard: React.FC<NewsCardProps> = ({
  source,
  title,
  timeAgo,
  author,
  imageUrl,
}) => {
  return (
    <div className="border-gray-200 first:p-4 pt-0 px-4 pb-4 cursor-pointer">
      <div className="flex">
        <div className="flex-1 pr-4">
          <div className="flex items-center mb-1">
            <span className="text-sm font-medium text-gray-900">{source}</span>
          </div>
          <h3 className="text-gray-900 text-xl font-medium mb-4">{title}</h3>
        </div>
        {imageUrl && (
          <div className="w-[200px] h-28 ml-4">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <div className="flex items-center text-sm border-b pb-4 text-gray-600">
        <span>{timeAgo}</span>
        {author && (
          <div className="flex items-center justify-center">
            <span className="mx-1">•</span>
            <span>By {author}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
