"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuItem } from "@/config/sidebar-menus";

export function Sidebar({ items, title }: { items: MenuItem[]; title: string }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <div
        className={`
          md:hidden fixed top-0 left-0 right-0 z-40
          flex items-center justify-start
          bg-bg-alt border-b border-border
          px-3 h-11
          transition-transform duration-200 ease-in-out
          ${isOpen ? "-translate-y-full" : "translate-y-0"}
        `}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md text-text-muted hover:text-foreground hover:bg-secondary/15 transition-colors"
        >
          <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <button
        onClick={() => setIsOpen(true)}
        className={`
          hidden md:flex fixed top-4 left-4 z-40
          p-1.5 rounded-md
          text-text-muted hover:text-foreground
          bg-bg-alt border border-border
          transition-all duration-200 ease-in-out
          ${isOpen
            ? "opacity-0 pointer-events-none -translate-x-2"
            : "opacity-100 pointer-events-auto translate-x-0"
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed inset-0 z-40 md:hidden
          bg-black/40 backdrop-blur-[2px]
          transition-opacity duration-200
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      <aside
        style={{ willChange: "transform" }}
        className={`
          fixed inset-y-0 left-0 z-50
          md:relative md:inset-y-auto md:left-auto
          w-56 flex flex-col
          bg-bg-alt border-r border-border
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/60 shrink-0">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/80 truncate pr-2">
            {title}
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-secondary/15 transition-colors shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="px-2 py-2 shrink-0 border-b border-border/40">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-text-muted hover:text-primary hover:bg-primary/5 transition-all group"
          >
            <svg
              className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-1"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px]
                  transition-all duration-150
                  ${isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text-muted hover:bg-secondary/15 hover:text-foreground"
                  }
                `}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-4 rounded-r-full bg-primary" />
                )}
                <span className="pl-1">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}