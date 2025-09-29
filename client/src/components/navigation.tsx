"use client";
import React from "react";
import NavItem from "./nav-item";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center w-full sm:justify-center">
      <div className="flex items-end mt-1 whitespace-nowrap ">
        <Link href="/">
          <NavItem label="Home" active={pathname === "/"} />
        </Link>
        <Link href="/rss">
          <NavItem label="News" active={pathname === "/rss"} />
        </Link>
        <Link href="/youtube">
          <NavItem label="Videos" active={pathname === "/youtube"} />
        </Link>
        <Link href="/facebook">
          <NavItem label="Social" active={pathname === "/facebook"} />
        </Link>
        <Link href="https://n-cp.discourse.group/latest" target="_blank">
          <NavItem label="Forum" active={pathname === "/forum"} />
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
