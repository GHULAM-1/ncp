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
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Dark mode
      </span>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`relative w-14 h-7 rounded-full px-1 flex items-center transition-colors duration-300 ${
          isDark ? "bg-gray-700" : "bg-yellow-300"
        }`}
      >
        <div
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 transform ${
            isDark ? "translate-x-7" : "translate-x-0"
          }`}
        />
        <Sun
          className={`w-4 h-4 absolute left-1 text-yellow-500 transition-opacity ${
            isDark ? "opacity-0" : "opacity-100"
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute right-1 text-white transition-opacity ${
            isDark ? "opacity-100" : "opacity-0"
          }`}
        />
      </button>
    </div>
  );
}
