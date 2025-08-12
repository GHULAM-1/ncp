import FacebookNews from "@/components/facebook/facebook";
import { Metadata } from "next";
import { fetchFacebookPosts } from "@/api/facebook/api";

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

export const revalidate = 9000;

export default async function FacebookPage() {
  // Fetch initial data at build time and during revalidation
  let initialData = null;
  
  try {
    console.log('🏗️ [ISR] Starting Facebook data fetch...');
    initialData = await fetchFacebookPosts(15, 1, 15); // maxPosts, page, limit
    
    if (initialData && initialData.success) {
      console.log('✅ [ISR] Initial Facebook data loaded:', initialData.count, 'posts');
    } else {
      console.warn('⚠️ [ISR] Facebook data response incomplete:', initialData);
    }
  } catch (error) {
    console.error('❌ [ISR] Failed to load initial Facebook data:', error);
    // Continue without initial data - component will handle loading state
  }

  return <FacebookNews initialData={initialData} />;
}