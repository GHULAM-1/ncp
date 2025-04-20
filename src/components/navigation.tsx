"use client";
import React from "react";
import NavItem from "./nav-item";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 flex items-center justify-center mx-auto mb-4">
      <div className="flex items-center px-4">
        <Link href="/">
          <NavItem label="Home" active={pathname === "/"} />
        </Link>
        <Link href="https://ncp.discourse.group/latest" target="_blank">
          <NavItem label="Forum" active={pathname === "/forum"} />
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
