"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import NewsCard from "./news-card";
import Loader from "../loader";
import { NewsCardProps } from "@/types/news-card-type";

interface NewsFeedProps {
  newsItems: NewsCardProps[];
}

export default function NewsFeed({ newsItems }: NewsFeedProps) {
  const PAGE_SIZE = 6;
  // STATES
  const [displayed, setDisplayed] = useState(() =>
    newsItems.slice(0, PAGE_SIZE)
  );
  const [loading, setLoading] = useState(false);
  const page = useRef(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // HANDLERS (Delay Added)
  const loadMore = useCallback(() => {
    if (loading) return;
    if (displayed.length >= newsItems.length) return;

    setLoading(true);
    setTimeout(() => {
      const next = newsItems.slice(
        page.current * PAGE_SIZE,
        (page.current + 1) * PAGE_SIZE
      );
      setDisplayed((prev) => [...prev, ...next]);
      page.current += 1;
      setLoading(false);
    }, 1000);
  }, [displayed.length, loading, newsItems]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([ent]) => {
        if (ent.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) obs.unobserve(loaderRef.current);
    };
  }, [loadMore]);

  return (
    <div className="max-w-3xl mx-auto  bg-white rounded-[18px] dark:bg-[#1f1f1f] dark:text-white">
      <div className="shadow-sm rounded-2xl overflow-hidden bg-gray-50 dark:bg-[#1f1f1f]">
        {displayed.map((item) => (
          <NewsCard key={item.slug} {...item} />
        ))}
      </div>

      <div
        ref={loaderRef}
        className="flex justify-center py-8 text-gray-700 dark:text-gray-300"
      >
        {loading && <Loader />}
      </div>
    </div>
  );
}
