"use client";
import { useEffect } from "react";

declare global {
  interface Window {
    DiscourseEmbed: {
      discourseUrl: string;
      topicId?: number;
    };
  }
}

export default function DiscourseForum() {
  useEffect(() => {
    window.DiscourseEmbed = {
      discourseUrl: "https://n-cp.discourse.group/latest", // Replace with your new forum URL
      topicId: 1, // Replace with your new topic ID (number)
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://n-cp.discourse.group/javascripts/embed.js"; // Replace with your new forum URL
    (
      document.getElementsByTagName("head")[0] ||
      document.getElementsByTagName("body")[0]
    ).appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div>
      <div id="discourse-comments"></div>
    </div>
  );
}
