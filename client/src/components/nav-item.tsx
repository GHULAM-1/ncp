import React from "react";
import { NavItemProps } from "@/types/nav-item-prop-type";
const NavItem: React.FC<NavItemProps> = ({ label, active }) => {
  return (
    <div className="relative py-[10px] px-2 md:px-6 cursor-pointer group">
      <span
        className={`text-[14px] font-[500] transition-colors ${
          active
            ? "text-[#1a73e8] dark:text-[#87b6f8]"
            : "text-gray-600 dark:text-[#bdc1c6] group-hover:text-black dark:group-hover:text-white"
        }`}
      >
        {label}
      </span>
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-1 dark:bg-[#89b4f8]  bg-[#1a73e8] rounded-t-[4px]"></div>
      )}
    </div>
  );
};

export default NavItem;
