"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CircleUser, LogOut } from "lucide-react";

export function ProfileDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        router.push(`/${locale}/auth/login`); 
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center p-1.5 rounded-lg text-primary hover:bg-border/40 hover:text-accent transition-colors cursor-pointer"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <CircleUser size={26} strokeWidth={1.5} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-background border border-border rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-border/50">
            <p className="text-sm font-bold text-primary truncate">Administrator</p>
            <p className="text-xs text-text-muted truncate">admin@church.com</p>
          </div>

          <div className="py-1">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2 font-medium"
            >
              {isLoading ? (
                <span className="truncate">{t("loading") || "Loading..."}</span>
              ) : (
                <>
                  <LogOut size={16} />
                  <span className="truncate">{t("btn_logout") || "Logout"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}