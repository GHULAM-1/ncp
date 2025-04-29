import NewsFeed from "@/components/home/news-feed";
import { getNewsItems } from "@/components/config/rss-feed";
export default async function Page() {
  const newsItems = await getNewsItems();

  return (
    <main className="max-w-[870px] mx-auto px-4">
      <NewsFeed newsItems={newsItems} />
    </main>
  );
}
