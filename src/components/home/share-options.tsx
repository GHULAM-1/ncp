import React, { useState } from "react";
import { Clipboard, Facebook } from "lucide-react";
import Image from "next/image";
import whatsappSrc from "../../../public/Icons/what.svg";
import { ShareOptionProps } from "@/types/share-option-types";
const WhatsappSVG: React.FC = () => (
  <Image
    src={whatsappSrc}
    alt="WhatsApp logo"
    width={24}
    height={24}
    className="w-6 h-6 text-green-500"
  />
);
const iconMap: Record<ShareOptionProps["iconType"], React.ReactNode> = {
  copy: <Clipboard className="w-6 h-6 text-gray-700" />,
  facebook: <Facebook className="w-6 h-6 text-blue-600" />,
  whatsapp: <WhatsappSVG />,
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
        className={`p-3 rounded-full bg-gray-100 shadow-md transform transition-transform ${
          clicked ? "scale-90" : "hover:scale-105"
        }`}
      >
        {iconMap[iconType]}
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </button>
  );
};

export default ShareOption;
