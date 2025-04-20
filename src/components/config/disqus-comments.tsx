"use client";

import React from "react";
import { DiscussionEmbed } from "disqus-react";
import { DisqusCommentsProps } from "@/types/disqus-comment-prop-types";

const DisqusComments: React.FC<DisqusCommentsProps> = ({ post }) => {
  const disqusConfig = {
    url: post.slug,
    identifier: post.slug,
    title: post.title,
  };

  return (
    <DiscussionEmbed
      shortname="npc-5"
      config={disqusConfig}
      key={disqusConfig.identifier}
    />
  );
};

export default DisqusComments;
