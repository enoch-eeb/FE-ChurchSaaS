"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuSection } from "@/config/sidebar-menus";
import { Menu, X, ArrowLeft, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

export function Sidebar({ menus }: { menus: MenuSection[] }) {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    menus.forEach((menu) => {
      initialState[menu.sectionKey] = true;
    });
    return initialState;
  });

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

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
  }, [pathname, isMobile]);

  return (
    <>
      {/* MOBILE HEADER */}
      <div
        className={`
          md:hidden fixed top-0 left-0 right-0 z-[60]
          flex items-center justify-start
          bg-background border-b border-border shadow-sm
          px-4 h-14
          transition-transform duration-300 ease-in-out
          ${isOpen ? "-translate-y-full" : "translate-y-0"}
        `}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 rounded-md text-text-muted hover:text-foreground hover:bg-secondary/15 transition-colors"
          aria-label="Buka Menu"
        >
          <Menu size={20} />
        </button>
        <span className="ml-4 text-sm font-black tracking-[0.15em] uppercase text-primary">
          COMA
        </span>
      </div>

      {/* DESKTOP TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          hidden md:flex fixed top-3 left-3 z-[60]
          p-2 rounded-md
          text-text-muted hover:text-foreground
          bg-background border border-border shadow-sm
          transition-all duration-300 ease-in-out
          ${isOpen ? "opacity-0 pointer-events-none -translate-x-4" : "opacity-100 pointer-events-auto translate-x-0"}
        `}
        aria-label="Buka Menu"
      >
        <Menu size={16} />
      </button>

      {/* MOBILE OVERLAY */}
      <div
        onClick={() => setIsOpen(false)}
        className={`
          fixed inset-0 z-[60] md:hidden
          bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        aria-hidden="true"
      />

      {/* DESKTOP LAYOUT SPACER */}
      <div
        className={`
          hidden md:block shrink-0
          transition-all duration-300 ease-in-out
          ${isOpen ? "w-56" : "w-0"}
        `}
        aria-hidden="true"
      />

      {/* SIDEBAR UTAMA */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-[70]
          w-56 flex flex-col
          bg-background border-r border-border shadow-2xl md:shadow-none
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
          <span className="text-sm font-black tracking-[0.15em] uppercase text-primary truncate">
            COMA
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 -mr-1.5 rounded-md text-text-muted hover:text-foreground hover:bg-secondary/15 transition-colors shrink-0"
            aria-label="Tutup Menu"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 py-3 shrink-0 border-b border-border/50">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] text-text-muted hover:text-primary hover:bg-primary/5 transition-all group"
          >
            <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" />
            <span className="font-medium">{t("back_to_home")}</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-2 scrollbar-hide">
          {menus.map((section, idx) => {
            const isSectionOpen = openSections[section.sectionKey];

            return (
              <div key={idx} className="flex flex-col">
                <button
                  onClick={() => toggleSection(section.sectionKey)}
                  className="flex items-center justify-between w-full px-2 py-1.5 mb-0.5 text-left group cursor-pointer"
                  aria-expanded={isSectionOpen}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-foreground transition-colors">
                    {t(`sections.${section.sectionKey}`)}
                  </span>
                  {isSectionOpen ? (
                    <ChevronDown size={14} className="text-text-muted group-hover:text-foreground transition-colors" />
                  ) : (
                    <ChevronRight size={14} className="text-text-muted group-hover:text-foreground transition-colors" />
                  )}
                </button>

                <div
                  className={`
                    grid transition-all duration-300 ease-in-out
                    ${isSectionOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}
                  `}
                >
                  <div className="overflow-hidden flex flex-col space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`
                            relative flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px]
                            transition-all duration-200
                            ${
                              isActive
                                ? "bg-primary/10 text-primary font-bold"
                                : "text-text-muted hover:bg-secondary/15 hover:text-foreground font-medium"
                            }
                          `}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-primary" />
                          )}
                          <span className="truncate">{t(`menus.${item.titleKey}`)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}