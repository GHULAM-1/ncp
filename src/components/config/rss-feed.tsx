import RSSParser from "rss-parser";
import { formatDistanceToNow } from "date-fns";
import type { NewsItem } from "@/types/news-item-type";

const RSS_URL = "https://techcrunch.com/startups/feed/";
type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  enclosure?: { url: string };
  categories?: string[];
};

const parser = new RSSParser<{}, FeedItem>({
  customFields: { item: ["enclosure"] },
});

export async function getNewsItems(): Promise<NewsItem[]> {
  const res = await fetch(RSS_URL, { next: { revalidate: 3600 } });
  const xml = await res.text();
  const feed = await parser.parseString(xml);

  const items = await Promise.all(
    feed.items.map(async (item) => {
      let imageUrl = item.enclosure?.url ?? "";

      if (!imageUrl && item.link) {
        try {
          const html = await fetch(item.link).then((r) => r.text());
          const m = html.match(
            /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
          );
          imageUrl = m ? m[1] : "";
        } catch {
          imageUrl = "";
        }
      }

      return {
        source: feed.title ?? "TechCrunch",
        title: item.title ?? "",
        timeAgo: item.pubDate
          ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })
          : "",
        author: item.creator ?? undefined,
        imageUrl: imageUrl,
        category: item.categories?.[0]?.toLowerCase() ?? undefined,
        location: undefined,
        url: item.link || "",
        link: item.link || "",
      } as NewsItem;
    })
  );

  return items;
}
