import NewsFeed from "@/components/home/news-feed";
import { getNewsItems } from "@/components/config/rss-feed";
import { NewsCardProps } from "@/types/news-card-type";

export default async function Page() {
  const newsItemsRaw = await getNewsItems();
  const newsItems: NewsCardProps[] = newsItemsRaw.map((item, index) => ({
    ...item,
    link: item.url ?? "#",
    slug: `news-${index}`,
  }));

  return (
    <main className="max-w-[870px] mx-auto px-4">
      <NewsFeed newsItems={newsItems} />
    </main>
  );
}
