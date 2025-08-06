import RSSNews from "@/components/rss/rss";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bangladesh RSS News - Latest News Feeds | NCP",
  description: "Get the latest Bangladesh news from RSS feeds. Real-time news aggregation from top Bangladeshi news sources and channels.",
  keywords: [
    "Bangladesh RSS news",
    "Bangladesh news feeds", 
    "Bangladesh latest news",
    "Bangladesh news aggregation",
    "RSS feeds Bangladesh",
    "Bangladesh news sources"
  ],
};

export default function RSSPage() {
  return <RSSNews />;
}