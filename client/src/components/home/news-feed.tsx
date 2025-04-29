"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import LocationSelector from "./location-selector";
import LocationChip from "./location-chip";
import NewsCard from "./news-card";
import Loader from "../loader";
import { NewsCardProps } from "@/types/news-card-type";

interface NewsFeedProps {
  newsItems: NewsCardProps[];
}

export default function NewsFeed({ newsItems }: NewsFeedProps) {
  const PAGE_SIZE = 10;
  //STATES
  const [displayed, setDisplayed] = useState(() =>
    newsItems.slice(0, PAGE_SIZE)
  );
  const [loading, setLoading] = useState(false);
  const page = useRef(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  //HANDLERS
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
    }, 1500);
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
    <div className="max-w-3xl mx-auto px-4">
      <LocationSelector currentLocation="Lahore" />
      <div className="flex gap-2 mb-6">
        <LocationChip name="Lahore" active />
      </div>

      <div className="shadow-sm rounded-2xl overflow-hidden">
        {displayed.map((item, idx) => (
          <NewsCard key={idx} {...item} />
        ))}
      </div>

      <div ref={loaderRef} className="flex justify-center py-8">
        {loading && <Loader />}
      </div>
    </div>
  );
}
