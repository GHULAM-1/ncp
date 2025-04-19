import React from "react";
import { HelpCircle } from "lucide-react";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4 bg-white  border-gray-200">
      <h1 className="flex items-center text-lg sm:text-2xl font-semibold text-gray-900">
        <span className="mr-1">Google</span>
        <span className="font-medium">News</span>
      </h1>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={20} />
        </button>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/login"
            className="relative px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-medium text-gray-700 transition-all duration-300 hover:text-gray-900 group"
          >
            Login
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full" />
          </Link>

          <Link
            href="/signup"
            className="relative px-3 py-1 sm:px-5 sm:py-2 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm shadow-sm hover:shadow-md transition-all duration-300 group"
          >
            Sign Up
            <span className="absolute inset-0 rounded-sm bg-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
