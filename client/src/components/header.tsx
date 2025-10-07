"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL, logout } from "../api/auth/api";
import { ModeToggle } from "./mode-toggle";
import Navigation from "./navigation";
import { ProfileModal } from "./profile-modal";
import Image from "next/image";

const Header: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1️⃣ Load token, username, and any saved preview/image from localStorage
  useEffect(() => {
    const tok = localStorage.getItem("token");
    if (tok) setToken(tok);

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setUsername(u.username || u.name || "");
      } catch {}
    }
    const preview = localStorage.getItem("profilePreview");
    if (preview) setProfilePreview(preview);

    const stored = localStorage.getItem("profileImage");
    if (stored) setProfileImage(stored);
  }, []);

  useEffect(() => {
    if (!token) return;

    const fetchAvatar = async () => {
      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        if (data.avatar) {
          setProfileImage(data.avatar);
          localStorage.setItem("profileImage", data.avatar);
        }
      } catch (err) {
        console.error("Error loading avatar:", err);
      }
    };

    fetchAvatar();
  }, [token]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    if (!token) return;
    await logout(token);
    localStorage.removeItem("token");
    router.push("/login");
  };

  // 3️⃣ Build avatarSrc: preview → DB image → initials → default
  const avatarSrc =
    profilePreview ||
    profileImage ||
    (username
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          username[0].toUpperCase()
        )}&background=3b82f6&color=ffffff`
      : "/Icons/profile-picture.jpg");

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#202124]/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
        <div className="flex justify-between items-center md:px-6 px-1 pt-4">
          <Link href="/" className="flex items-center space-x-1 group">
            <div className="relative">
              <Image
                src="/Icons/logo.jpeg"
                alt="NCP Logo"
                width={38}
                height={38}
                className="rounded-2xl transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <h1 className="text-xl md:block hidden sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              NCP
            </h1>
          </Link>
          
          <div className="flex-1 overflow-x-auto scrollbar-hide mx-6">
            <Navigation />
          </div>

          <div className="relative flex-shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-10 h-10 hover:cursor-pointer rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200 hover:scale-105 active:scale-95 group"
            >
              <Image
                src={avatarSrc}
                alt="User Avatar"
                width={40}
                height={40}
                className="object-cover w-full h-full rounded-full transition-all duration-200 group-hover:brightness-110"
                priority
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  // Show fallback initials
                  const fallback = document.createElement("div");
                  fallback.className = "w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg";
                  fallback.textContent = username ? username[0].toUpperCase() : "?";
                  target.parentNode?.appendChild(fallback);
                }}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white/95 dark:bg-[#2a2d31]/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                <div className="p-3">
                  {token && (
                    <div className="px-3 py-2 mb-2">
                      <p className="text-xs md:text-base text-gray-500 dark:text-gray-400 truncate">{username}</p>
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    {token ? (
                      <>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setIsProfileModalOpen(true);
                          }}
                          className="w-full hover:cursor-pointer text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-all duration-200 hover:translate-x-1 flex items-center space-x-3"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Edit Profile</span>
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full hover:cursor-pointer text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:translate-x-1 flex items-center space-x-3"
                        >
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Logout</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="flex items-center space-x-3 hover:cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 rounded-lg transition-all duration-200 hover:translate-x-1"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Login</span>
                        </Link>
                        <Link
                          href="/signup"
                          className="flex items-center space-x-3 hover:cursor-pointer px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:translate-x-1"
                          onClick={() => setDropdownOpen(false)}
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Sign Up</span>
                        </Link>
                      </>
                    )}
                  </div>
                  
                  <hr className="my-3 border-gray-200/50 dark:border-gray-700/50" />
                  <div className="px-1">
                    <ModeToggle />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {isProfileModalOpen && token && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          username={username}
          token={token}
        />
      )}
    </>
  );
};

export default Header;
