"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  //STATES
  const [mounted, setMounted] = useState(false);
  //HANDLERS
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <div className="flex items-center px-3 py-2">
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative hover:cursor-pointer w-16 h-8 rounded-full px-1 flex items-center transition-all duration-500 ease-in-out hover:scale-105 active:scale-95 ${
          isDark 
            ? "bg-gradient-to-r from-gray-700 to-gray-800 shadow-lg shadow-gray-900/50" 
            : "bg-gradient-to-r from-yellow-300 to-yellow-400 shadow-lg shadow-yellow-300/50"
        }`}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      >
        <div
          className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-lg transition-all duration-500 ease-in-out transform ${
            isDark ? "translate-x-8" : "translate-x-0"
          }`}
        />
        <Sun
          className={`w-4 h-4 absolute left-1.5 text-yellow-500 transition-all duration-500 ease-in-out ${
            isDark ? "opacity-0 scale-75" : "opacity-100 scale-100"
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute right-1.5 text-slate-600 transition-all duration-500 ease-in-out ${
            isDark ? "opacity-100 scale-100" : "opacity-0 scale-75"
          }`}
        />
      </button>
    </div>
  );
}
