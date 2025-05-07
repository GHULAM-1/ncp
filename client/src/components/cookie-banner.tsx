"use client";
import { useEffect, useState } from "react";

export default function CookieBanner() {
  //STATES
  const [isVisible, setIsVisible] = useState(false);
  //HANDLERS
  useEffect(() => {
    const accepted = localStorage.getItem("cookiesAccepted");
    if (!accepted) setIsVisible(true);
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 p-4 shadow-lg z-50">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          We use cookies to improve your experience. By using our site, you
          agree to our{" "}
          <a
            href="/privacy"
            className="underline text-blue-600 dark:text-blue-400"
          >
            Privacy Policy
          </a>
          .
        </p>
        <button
          onClick={acceptCookies}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Accept Cookies
        </button>
      </div>
    </div>
  );
}
