import React from "react";
import { HelpCircle } from "lucide-react";
import Avatar from "./home/avatar";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-between p-4 px-6 bg-white  border-gray-200">
      <div className="flex items-center">
        <h1 className="text-gray-900 text-2xl font-medium flex items-center">
          <span className="text-[24px] font-semibold mr-1">Google </span>
          <span className="font-medium">News</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={22} />
        </button>

        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="relative px-4 py-2 font-medium text-gray-700 transition-all duration-300 hover:text-gray-900 group"
          >
            Login
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
          </Link>

          <Link
            href="/signup"
            className="relative px-5 py-2 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm shadow-sm hover:shadow-md transition-all duration-300 hover:from-blue-600 hover:to-blue-700 group"
          >
            Sign Up
            <span className="absolute inset-0 rounded-md bg-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
