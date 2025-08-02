import React from "react";
import { NavItemProps } from "@/types/nav-item-prop-type";
const NavItem: React.FC<NavItemProps> = ({ label, active }) => {
  return (
    <div className="relative py-2 px-2 md:px-6 cursor-pointer">
      <span
        className={`${
          active
            ? "text-blue-600 dark:text-[#87b6f4]"
            : "dark:text-[#87b6f4] hover:text-gray-900"
        } transition-colors`}
      >
        {label}
      </span>
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-[#89b4fa] rounded-t-[4px]"></div>
      )}
    </div>
  );
};

export default NavItem;
