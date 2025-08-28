import NewsFeed from "@/components/home/news-feed";
import { NewsCardProps } from "@/types/news-card-type";
import { formatDistanceToNow } from 'date-fns';

// ISR Configuration - revalidate every 2.5 hours (9000 seconds)
export const revalidate = 9000;

// Global configurable timeout (default 55s to stay under Vercel's 60s limit)
const REQUEST_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_REQUEST_TIMEOUT_MS || 55000);

// Simple fetch with timeout to avoid long hangs during build/ISR
async function fetchWithTimeout(resource: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Fetch the unified feed from our internal API route (which already aggregates/caches sources)
async function getUnifiedFeed() {
  try {
    const res = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_CLIENT_URL || ''}/api/unified-feed?page=1&limit=70`, { next: { revalidate } });
    if (!res.ok) {
      console.log('🏗️ [BUILD] unified-feed failed with status', res.status);
      return { success: false, items: [], lastUpdated: new Date().toISOString() };
    }
    const data = await res.json();
    return { success: true, items: data.items || [], lastUpdated: data.lastUpdated };
  } catch (error) {
    console.error('Error in unified feed fetch:', error);
    return { success: false, items: [], lastUpdated: new Date().toISOString() };
  }
}

export default async function Page() {
  const feedData = await getUnifiedFeed();
  
  // Transform data to match NewsCardProps format
  const newsItems: NewsCardProps[] = (feedData.items || []).map((item: any, index: number) => ({
    title: item.title,
    description: item.description,
    link: item.link,
    imageUrl: item.image,
    timeAgo: item.date ? formatDistanceToNow(new Date(item.date), { addSuffix: true }) : undefined,
    author: item.source || item.author,
    date: item.date,
    source: item.source || '',
    platform: item.platform,
    type: item.type,
    profilePicture: item.profilePicture,
    engagement: item.engagement,
    slug: `${item.platform}-${index}`,
    id: item.id
  }));

  return (
    <main className="max-w-[840px] mx-auto">      
      <NewsFeed newsItems={newsItems} />
    </main>
  );
}
