export interface NewsCardProps {
  id?: string;
  source: string;
  title: string;
  description?: string;
  timeAgo?: string;
  author?: string;
  imageUrl?: string;
  image?: string;
  slug: string;
  link: string;
  date?: string;
  platform?: 'youtube' | 'facebook' | 'rss' | 'news';
  type?: 'video' | 'post' | 'news';
  profilePicture?: string | null;
  engagement?: {
    views?: number;
    likes?: number;
    comments?: number;
    reactions?: number;
    shares?: number;
  };
  // Additional platform-specific properties
  videoId?: string;
  channelLogo?: string;
  channelTitle?: string;
  channelHandle?: string;
  channelId?: string;
  postId?: string;
  thumbnail?: string;
  videoUrl?: string;
}
