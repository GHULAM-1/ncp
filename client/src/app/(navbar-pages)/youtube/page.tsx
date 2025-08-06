import YouTubeNews from "@/components/youtube/youtube";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bangladesh News Videos - Latest YouTube News | NCP",
  description: "Watch the latest Bangladesh news videos from top Bangladeshi TV channels and news sources on YouTube.",
  keywords: [
    "Bangladesh news videos",
    "Bangladesh YouTube news",
    "Bangladesh news channels",
    "Somoy TV", "Jamuna TV", "ATN Bangla", "Channel 24",
    "Bangladesh news video aggregation",
    "Bangladesh news YouTube channels"
  ],
};

export default function YouTubePage() {
  return <YouTubeNews />;
}