import FacebookNews from "@/components/facebook/facebook";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bangladesh Facebook News - Social Media Updates | NCP",
  description: "Get the latest Bangladesh news from Facebook posts and social media updates. Real-time social media news aggregation.",
  keywords: [
    "Bangladesh Facebook news",
    "Bangladesh social media news",
    "Bangladesh Facebook posts",
    "Bangladesh social media updates",
    "Bangladesh news social media",
    "Facebook news Bangladesh"
  ],
};

export default function FacebookPage() {
  return <FacebookNews />;
}