import React, { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal from "./share-model";
import { ShareButtonProps } from "@/types/share-button-prop";
const ShareButton: React.FC<ShareButtonProps> = ({
  url = typeof window !== "undefined" ? window.location.href : "",
  title = typeof document !== "undefined" ? document.title : "",
}) => {
  //STATES
  const [isOpen, setIsOpen] = useState(false);
  //HANDLERS
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => setIsOpen(true));
    } else {
      setIsOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="p-2 rounded-full hover:bg-gray-200 transition"
        aria-label="Share"
      >
        <Share2 className="w-5 h-5 text-gray-600" />
      </button>

      {isOpen && (
        <ShareModal url={url} title={title} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default ShareButton;
