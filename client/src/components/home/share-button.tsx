import React, { useState } from "react";
import { Share2 } from "lucide-react";
import ShareModal from "./share-model";
import { ShareButtonProps } from "@/types/share-button-prop";
import { Send } from 'lucide-react';
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
        className="px-3 py-1 text-sm rounded transition 
            cursor-pointer
                       bg-white hover:bg-gray-300 dark:bg-red-600 dark:hover:bg-blue-800 text-black border border-gray-300 dark:border-gray-700"
        aria-label="Share"
      >
        {/* <Share2 className="w-5 h-5 text-gray-600" /> */}
        // made a change
        
        Share
      </button>

      {isOpen && (
        <ShareModal url={url} title={title} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export default ShareButton;
