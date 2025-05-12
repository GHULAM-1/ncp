"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../api/auth/api";
import { ModeToggle } from "./mode-toggle";
import Navigation from "./navigation";
import { ProfileModal } from "./profile-modal";
import Image from "next/image";

const Header: React.FC = () => {
  //STATES
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

<<<<<<< HEAD

  const handleLogout = async () => {
    try {
      if (token) {
        await logout();

        router.push("/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
=======
  const avatarSrc =
    profilePreview ||
    profileImage ||
    (username
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          username[0].toUpperCase()
        )}&background=3b82f6&color=ffffff`
      : "/Icons/profile-picture.jpg");
  //HANDLERS
  useEffect(() => {
    const tok = localStorage.getItem("token");
    if (tok) setToken(tok);

    const userString = localStorage.getItem("user");
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        setUsername(userObj.username || userObj.name || "");
      } catch (e) {
        console.error("Failed to parse `user` from localStorage:", e);
      }
    }

    const preview = localStorage.getItem("profilePreview");
    if (preview) setProfilePreview(preview);

    const stored = localStorage.getItem("profileImage");
    if (stored) setProfileImage(stored);
  }, []);

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
>>>>>>> stagging
  };

  return (
    <>
      <header className="sticky top-0 z-50 p-2 mb-4 bg-white dark:bg-[#1f2125] border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center px-4 h-20">
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 dark:text-white">
            <Image
              src="/Icons/logo.jpeg"
              alt="NCP Logo"
              width={44}
              height={44}
              className="rounded-2xl"
            />
          </h1>

          <div className="flex items-end h-full">
            <Navigation />
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full overflow-hidden focus:outline-none"
            >
<<<<<<< HEAD
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
=======
              <Image
                src={avatarSrc}
                alt="User Avatar"
                width={32}
                height={32}
                className="object-cover rounded-full"
                priority
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#2a2d31] border dark:border-gray-700 rounded-md shadow-lg z-50">
                <div className="p-2 text-sm text-gray-800 dark:text-gray-200">
                  {token ? (
                    <>
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        Edit Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}

                  <hr className="my-2 border-gray-200 dark:border-gray-700" />

                  <div className="px-4 py-2">
                    <ModeToggle />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {isProfileModalOpen && (
        <ProfileModal
          onClose={() => setIsProfileModalOpen(false)}
          username={username}
        />
      )}
    </>
>>>>>>> stagging
  );
};

export default Header;