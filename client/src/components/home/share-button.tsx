import React, { useState } from "react";
import { Send, Share2 } from "lucide-react";
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
    setIsOpen(true);
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="px-3 py-2 border text-sm hidden md:flex border-gray-300 text-black rounded transition hover:cursor-pointer 
             hover:bg-gray-200 
             dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
        aria-label="Share"
      >
        Share
      </button>
      <button
        onClick={handleShare}
        className="p-2 rounded md:hidden hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Send size={16} className="text-gray-600 dark:text-gray-300" />
      </button>

      {isOpen && (
        <ShareModal url={url} title={title} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default ShareButton;
