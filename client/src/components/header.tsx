"use client";
import React, { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../api/auth/api";
import { ModeToggle } from "./mode-toggle";
import Navigation from "./navigation";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  const handleLogout = async () => {
    if (!token) return;
    await logout(token);
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 p-2 mb-4 bg-white dark:bg-[#1f2125] border-b border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center sm:px-4 h-20">
        <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
          <span>Google</span>
          <span className="font-medium">News</span>
        </h1>

        <div className="flex items-end h-full">
          <Navigation />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            aria-label="Help"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <HelpCircle size={20} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarImage src="/path/to/profile.jpg" alt="User profile" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {token ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Edit Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleLogout}
                    className="cursor-pointer"
                  >
                    Logout
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login">Login</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup">Sign Up</Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ModeToggle />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
