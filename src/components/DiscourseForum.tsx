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
      discourseUrl: "https://ncp.discourse.group/",
      topicId: 5,
    };

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://ncp.discourse.group/javascripts/embed.js";
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
