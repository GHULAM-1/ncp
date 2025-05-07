"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";

interface ProfileModalProps {
  onClose: () => void;
  username: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  onClose,
  username,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  //STATES
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  //HANDLERS
  useEffect(() => {
    const preview = localStorage.getItem("profilePreview");
    if (preview) setProfilePreview(preview);

    const stored = localStorage.getItem("profileImage");
    if (stored) setProfileImage(stored);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setProfilePreview(dataUrl);
      localStorage.setItem("profilePreview", dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const avatarSrc: string =
    profilePreview ||
    profileImage ||
    (username
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
          username[0].toUpperCase()
        )}&background=3b82f6&color=ffffff`
      : "/Icons/profile-picture.jpg");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/50 backdrop-blur-sm overflow-auto">
      <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#1f2125] rounded-xl shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 dark:text-gray-300 hover:text-red-500 text-2xl"
        >
          &times;
        </button>

        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white mb-6">
          Edit Profile
        </h2>

        <form className="space-y-5">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600">
              <Image
                src={avatarSrc}
                alt="Profile Avatar"
                width={96}
                height={96}
                className="object-cover rounded-full"
                priority
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change Profile Picture
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageChange}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name
            </label>
            <input
              type="text"
              defaultValue={username}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2d31] text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};
