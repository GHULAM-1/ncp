import Header from "@/components/header";
import NewsFeed from "@/components/home/news-feed";
import Navigation from "@/components/navigation";
import { newsData } from "@/data/mock-cards-data";

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Navigation />
      <main className="max-w-[870px] mx-auto px-4">
        <NewsFeed newsItems={newsData} />
      </main>
    </div>
  );
}
