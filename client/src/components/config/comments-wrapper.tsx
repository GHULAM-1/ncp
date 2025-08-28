"use client";

import React from "react";
import { DisqusCommentsProps } from "@/types/disqus-comment-prop-types";
import DisqusComments from "./disqus-comments";
import CustomComments from "./custom-comments";

interface CommentsWrapperProps extends DisqusCommentsProps {
  useCustomComments?: boolean;
  postType?: 'youtube' | 'facebook' | 'news' | 'rss';
}

const CommentsWrapper: React.FC<CommentsWrapperProps> = ({ 
  post, 
  useCustomComments = true,
  postType = 'news'
}) => {
  if (useCustomComments) {
    return <CustomComments post={post} postType={postType} />;
  }
  
  return <DisqusComments post={post} />;
};

export default CommentsWrapper;
