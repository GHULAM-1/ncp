"use client";
import React from "react";
import NavItem from "./nav-item";
import Link from "next/link";
import { usePathname } from "next/navigation";

const Navigation: React.FC = () => {
  const pathname = usePathname();

  return (
    <nav className="flex items-center w-full sm:justify-center">
      <div className="flex items-center whitespace-nowrap">
        <Link href="/">
          <NavItem label="Home" active={pathname === "/"} />
        </Link>
        <Link href="https://n-cp.discourse.group/latest" target="_blank">
          <NavItem label="Forum" active={pathname === "/forum"} />
        </Link>
        <Link href="/rss">
          <NavItem label="RSS" active={pathname === "/rss"} />
        </Link>
        <Link href="/youtube">
          <NavItem label="YouTube" active={pathname === "/youtube"} />
        </Link>
        <Link href="/facebook">
          <NavItem label="Facebook" active={pathname === "/facebook"} />
        </Link>
      </div>
    </nav>
  );
};

export default Navigation;
