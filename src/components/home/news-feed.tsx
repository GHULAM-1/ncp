import React from "react";
import NewsCard from "./news-card";
import LocationChip from "./location-chip";
import LocationSelector from "./location-selector";
import { NewsFeedProps } from "@/types/news-item-type";

const NewsFeed: React.FC<NewsFeedProps> = ({ newsItems }) => {
  return (
    <div className="">
      <LocationSelector currentLocation="Lahore" />

      <div className="flex gap-2 mb-6">
        <LocationChip name="Lahore" active={true} />
      </div>

      <div className=" shadow-sm  rounded-2xl">
        {newsItems.map((item, index) => (
          <NewsCard key={index} {...item} />
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
