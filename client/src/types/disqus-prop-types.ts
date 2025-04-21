export interface Post {
  slug: string;
  title: string;
}

export interface DisqusCommentsProps {
  post: Post;
  onCommentCountChange?: (count: number) => void;
}
