import { DiscussionEmbed } from "disqus-react";
import React, { useEffect } from "react";
import { Post, DisqusCommentsProps } from "@/types/disqus-prop-types";
const DisqusComments: React.FC<DisqusCommentsProps> = ({
  post,
  onCommentCountChange,
}) => {
  const disqusShortname = "npc-5";
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  const disqusConfig = {
    url: pageUrl,
    identifier: post.slug,
    title: post.title,
  };

  useEffect(() => {
    if (!onCommentCountChange) return;

    const handleMessage = (event: MessageEvent) => {
      if (
        typeof event.data === "object" &&
        event.data.type === "disqus.count" &&
        typeof event.data.count === "number"
      ) {
        onCommentCountChange(event.data.count);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onCommentCountChange]);

  return <DiscussionEmbed shortname={disqusShortname} config={disqusConfig} />;
};

export default DisqusComments;
