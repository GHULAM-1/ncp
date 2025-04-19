export interface NewsItem {
  source: string;
  title: string;
  timeAgo: string;
  author?: string;
  imageUrl: string;
  category?: "politics" | "sports" | "technology" | "entertainment" | "health";
  location?: string;
}

export const newsData: NewsItem[] = [
  {
    source: "CP24",
    title:
      "Police identify victims of double homicide in Toronto's Riverdale area",
    timeAgo: "13 hours ago",
    author: "Joanna Lavoie",
    imageUrl:
      "https://images.pexels.com/photos/3944104/pexels-photo-3944104.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "politics",
    location: "Toronto",
  },
  {
    source: "CBC",
    title:
      "Hundreds gather in downtown Toronto to protest against 'bubble zone' bylaw plan",
    timeAgo: "11 hours ago",
    author: "Dale Manucdoc & Muriel Draaisma",
    imageUrl:
      "https://images.pexels.com/photos/2604991/pexels-photo-2604991.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "politics",
    location: "Toronto",
  },
  {
    source: "CP24",
    title:
      "Frank Stronach committed to stand trial after preliminary inquiry into two charges",
    timeAgo: "12 hours ago",
    imageUrl:
      "https://images.pexels.com/photos/6940031/pexels-photo-6940031.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "politics",
    location: "Toronto",
  },

  // New items - Sports
  {
    source: "ESPN",
    title:
      "Raptors secure playoff spot with dramatic overtime win against Heat",
    timeAgo: "5 hours ago",
    author: "Marc J. Spears",
    imageUrl:
      "https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "sports",
    location: "Miami",
  },
  {
    source: "Sportsnet",
    title: "Blue Jays pitcher Alek Manoah throws complete game shutout",
    timeAgo: "8 hours ago",
    author: "Arden Zwelling",
    imageUrl:
      "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "sports",
    location: "Toronto",
  },

  // Technology
  {
    source: "TechCrunch",
    title: "New AI model can predict weather patterns with 95% accuracy",
    timeAgo: "1 day ago",
    author: "Devin Coldewey",
    imageUrl:
      "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "technology",
    location: "San Francisco",
  },
  {
    source: "The Verge",
    title:
      "Apple announces new AR glasses with revolutionary display technology",
    timeAgo: "2 days ago",
    author: "Nilay Patel",
    imageUrl:
      "https://images.pexels.com/photos/3568518/pexels-photo-3568518.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "technology",
    location: "Cupertino",
  },

  // Entertainment
  {
    source: "Variety",
    title: "Toronto International Film Festival announces 2023 lineup",
    timeAgo: "3 days ago",
    author: "Rebecca Rubin",
    imageUrl:
      "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "entertainment",
    location: "Toronto",
  },
  {
    source: "Rolling Stone",
    title: "Drake announces surprise concert at Toronto's Scotiabank Arena",
    timeAgo: "6 hours ago",
    imageUrl:
      "https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "entertainment",
    location: "Toronto",
  },

  // Health
  {
    source: "Health Canada",
    title: "New study shows benefits of Mediterranean diet for heart health",
    timeAgo: "1 day ago",
    author: "Dr. Sarah Henderson",
    imageUrl:
      "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "health",
    location: "Ottawa",
  },
  {
    source: "WebMD",
    title: "Breakthrough in cancer research at Toronto General Hospital",
    timeAgo: "2 days ago",
    author: "Dr. Michael Smith",
    imageUrl:
      "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "health",
    location: "Toronto",
  },

  // International
  {
    source: "BBC",
    title: "UK Prime Minister announces new economic stimulus package",
    timeAgo: "4 hours ago",
    author: "Chris Mason",
    imageUrl:
      "https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "politics",
    location: "London",
  },
  {
    source: "Al Jazeera",
    title: "Climate summit in Dubai reaches historic agreement on emissions",
    timeAgo: "1 day ago",
    imageUrl:
      "https://images.pexels.com/photos/2210128/pexels-photo-2210128.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    category: "politics",
    location: "Dubai",
  },
];
