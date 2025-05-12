"use client";
import React, { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../api/auth/api";
import { ModeToggle } from "./mode-toggle";

const Header: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const router = useRouter();


  const handleLogout = async () => {
    try {
      if (token) {
        await logout();

        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-2 sm:px-6 sm:py-4  border-gray-200 bg-white dark:bg-[#1f2125] dark:border-gray-700">
      <h1 className="flex items-center text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
        <span className="">Google</span>
        <span className="font-medium">News</span>
      </h1>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="Help"
        >
          <HelpCircle size={20} />
        </button>{" "}
        <ModeToggle />
        {!token ? (
          <>
            <Link
              href="/login"
              className="relative px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all duration-300 group"
            >
              Login
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-blue-500 transition-all duration-300 group-hover:w-full" />
            </Link>

            <Link
              href="/signup"
              className="relative px-3 py-1 sm:px-5 sm:py-2 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm shadow-sm hover:shadow-md transition-all duration-300 group dark:from-blue-600 dark:to-blue-700"
            >
              Sign Up 
              <span className="absolute inset-0 rounded-sm bg-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
            </Link>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="relative px-3 py-1 sm:px-5 sm:py-2 text-sm sm:text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm shadow-sm hover:shadow-md transition-all duration-300 group dark:from-blue-600 dark:to-blue-700"
          >
            Logout
            <span className="absolute inset-0 rounded-sm bg-blue-700 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;