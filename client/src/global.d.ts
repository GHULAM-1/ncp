export {};

declare global {
  interface Window {
    DISQUS: {
      reset: (opts: {
        reload: boolean;

        config: () => void;

        div?: string;
      }) => void;
    };

    disqus_config?: () => void;
  }
}
