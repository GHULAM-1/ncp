import RSSParser from "rss-parser";
import { formatDistanceToNow } from "date-fns";
import type { NewsItem } from "@/types/news-item-type";

const RSS_URL = "http://rss.cnn.com/rss/edition.rss";

type FeedItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  creator?: string;
  description?: string;
  content?: string;
  "content:encoded"?: string;
  enclosure?: { url: string };
  "media:thumbnail"?: { url: string };
  categories?: string[];
};
const parser = new RSSParser<FeedItem>({
  customFields: {
    item: ["media:thumbnail", "enclosure"],
  },
});
const validCategories = [
  "sport",
  "tech",
  "politics",
  "entertainment",
  "business",
] as const;

export async function getNewsItems(): Promise<NewsItem[]> {
  const res = await fetch(RSS_URL, { next: { revalidate: 3600 } });
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  // console.log(feed.items);
  return feed.items.map((item) => {
    const imageUrl = item.enclosure?.url || item["media:thumbnail"]?.url;
    const firstCategory = item.categories?.[0]?.toLowerCase();
    const validCategory = validCategories.find((cat) => cat === firstCategory);

    return {
      source: feed.title ?? "CNN",
      title: item.title ?? "",
      timeAgo: item.pubDate
        ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })
        : "",
      author: item.creator,
      imageUrl: imageUrl || feed.image?.url,
      category: validCategory,
      location: undefined,
      url: item.link || "",
    };
  });
}
