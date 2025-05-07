import React, { useState } from "react";
import { Clipboard } from "lucide-react";
import { FaFacebookF, FaWhatsapp, FaViber } from "react-icons/fa";
import { ShareOptionProps } from "@/types/share-option-types";

const iconMap: Record<ShareOptionProps["iconType"], React.ReactNode> = {
  copy: <Clipboard className="w-5 h-5 text-white" />,
  facebook: <FaFacebookF className="w-5 h-5 text-white" />,
  whatsapp: <FaWhatsapp className="w-5 h-5 text-white" />,
  viber: <FaViber className="w-5 h-5 text-white" />,
};

const bgColorMap: Record<ShareOptionProps["iconType"], string> = {
  copy: "bg-gray-500",
  facebook: "bg-[#3b5998]",
  whatsapp: "bg-[#25D366]",
  viber: "bg-[#7360F2]",
};

const ShareOption: React.FC<ShareOptionProps> = ({
  label,
  onClick,
  iconType,
}) => {
  const [clicked, setClicked] = useState(false);

  const handle = () => {
    onClick();
    setClicked(true);
    setTimeout(() => setClicked(false), 500);
  };

  return (
    <button
      onClick={handle}
      className="flex flex-col items-center space-y-1 focus:outline-none"
      aria-label={`Share via ${label}`}
    >
      <div
        className={`p-3 rounded-full shadow-md transform transition-transform ${
          clicked ? "scale-90" : "hover:scale-105"
        } ${bgColorMap[iconType]}`}
      >
        {iconMap[iconType]}
      </div>
      <span className="text-sm text-gray-700 dark:text-white">{label}</span>
    </button>
  );
};

export default ShareOption;
