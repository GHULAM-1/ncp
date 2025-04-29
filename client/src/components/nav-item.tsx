import React from "react";
import { NavItemProps } from "@/types/nav-item-prop-type";
const NavItem: React.FC<NavItemProps> = ({ label, active }) => {
  return (
    <div className="relative py-2 px-6 cursor-pointer">
      <span
        className={`${
          active ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
        } transition-colors`}
      >
        {label}
      </span>
      {active && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-sm"></div>
      )}
    </div>
  );
};

export default NavItem;
