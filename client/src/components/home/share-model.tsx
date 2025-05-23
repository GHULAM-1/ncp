import React, { useRef, useEffect } from "react";
import { X } from "lucide-react";
import ShareOption from "./share-options";
import { copyToClipboard } from "@/utils/copy-to-clipboard";
import { ShareOptionProps, ShareModalProps } from "@/types/share-option-types";

const ShareModal: React.FC<ShareModalProps> = ({ url, title, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent | KeyboardEvent) => {
      if (
        (e instanceof MouseEvent &&
          modalRef.current &&
          !modalRef.current.contains(e.target as Node)) ||
        (e instanceof KeyboardEvent && e.key === "Escape")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  const shareOptions: ShareOptionProps[] = [
    {
      id: "copy",
      label: "Copy Link",
      onClick: () => copyToClipboard(url),
      iconType: "copy",
    },
    {
      id: "facebook",
      label: "Facebook",
      onClick: () =>
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`
        ),
      iconType: "facebook",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      onClick: () =>
        window.open(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(
            title + " " + url
          )}`
        ),
      iconType: "whatsapp",
    },
    {
      id: "viber",
      label: "Viber",
      onClick: () =>
        window.open(
          `viber://forward?text=${encodeURIComponent(title + " " + url)}`
        ),
      iconType: "viber",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white dark:bg-[#35373b] rounded-3xl shadow-xl max-w-sm w-full p-6 animate-slideUp"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Share
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close share modal"
          >
            <X className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6">
          {shareOptions.map((opt) => (
            <ShareOption key={opt.id} {...opt} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
