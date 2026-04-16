"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLoaderStore } from "@/store/useLoaderStore";

export default function MemberManagementsPage() {
  const t = useTranslations("MemberManagementsPage");
  const { showLoader } = useLoaderStore();
  const router = useRouter();

  const handleNavigation = async (href: string, message: string) => {
    showLoader(message);
    await new Promise(resolve => setTimeout(resolve, 500));
    router.push(href);
  };
  const shortcuts = [
    {
      id: "directory",
      href: "/managements/member-managements/directory",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: "attendance",
      href: "/managements/member-managements/attendance",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    {
      id: "structure",
      href: "/managements/member-managements/structure",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-10">
      
      {/* Header Section */}
      <header className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {t('title')}
        </h1>
        <p className="mt-2 text-text-muted">
          {t('description')}
        </p>
      </header>

      {/* Quick Actions / Shortcuts Grid */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Akses Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {shortcuts.map((shortcut) => (
            <div 
              key={shortcut.id} 
              onClick={() => handleNavigation(shortcut.href, `Memuat ${t(`menus.${shortcut.id}.title`)}...`)}
              className="group flex flex-col p-6 bg-bg-alt border border-border/60 rounded-lg hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                {shortcut.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {t(`menus.${shortcut.id}.title`)}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t(`menus.${shortcut.id}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tempat untuk Widget Statistik nantinya (Misal: Total Jemaat, Jemaat Hadir Minggu Ini) */}
      <section className="mt-10 p-8 bg-secondary/10 border border-border/60 rounded-lg border-dashed flex flex-col items-center justify-center text-center min-h-50">
        <p className="text-text-muted font-medium">Widget Statistik Jemaat akan tampil di sini</p>
        <span className="text-xs text-text-muted/60 mt-2">(Dalam Pengembangan)</span>
      </section>

    </div>
  );
}