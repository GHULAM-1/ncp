export type NewsItem = {
  source: string;
  title: string;
  timeAgo: string;
  author?: string;
  imageUrl?: string;
  category?: string;
  location?: string;
};

export interface NewsFeedProps {
  newsItems: NewsItem[];
}
