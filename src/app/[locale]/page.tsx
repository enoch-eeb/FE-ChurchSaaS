"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { TopHeader } from "@/components/top-header";
import { ProfileDropdown } from "@/components/profile-dropdown";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CONTACT_EMAIL = "hello@coma.church";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "id";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Cek token saat komponen pertama kali dimuat
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    
    checkAuth();

    // Dengarkan perubahan di storage untuk sinkronisasi tab
    window.addEventListener("storage", checkAuth);

    // Deteksi aktivitas klik untuk menangkap logout dari komponen TopHeader
    const handleInteraction = () => {
      setTimeout(() => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken) {
          setIsLoggedIn(false);
        }
      }, 100);
    };

    document.addEventListener("click", handleInteraction);

    return () => {
      window.removeEventListener("storage", checkAuth);
      document.removeEventListener("click", handleInteraction);
    };
  }, []);

  // Fungsi logout untuk menghapus cookie httponly jwt
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error("Gagal memproses logout", error);
    } finally {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  if (!mounted) return null;

  const modules = [
    { id: "app" },
    { id: "member" },
    { id: "finance" },
    { id: "inventory" },
    { id: "service" },
    { id: "event" },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground transition-colors duration-300 flex flex-col">
      {/* NAVBAR */}
      <nav className="border-b border-border h-14 px-8 flex justify-between items-center bg-bg-alt/80 backdrop-blur-md sticky top-0 z-20">
        <span className="font-bold text-2xl tracking-tighter text-primary font-mono italic">
          SIMAGE.
        </span>

        {/* Gunakan gap-2 (8px) untuk merapatkan jarak elemen */}
        <div className="flex items-center gap-2">
          <TopHeader />

          {isLoggedIn ? (
            <ProfileDropdown onLogout={handleLogout} />
          ) : (
            <>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Request Akses COMA`}
                className="hidden sm:block text-sm font-bold tracking-widest uppercase text-text-muted hover:text-primary transition-colors pr-2"
              >
                {t("nav_request")}
              </a>

              <Link
                href={`/${locale}/auth/login`}
                className="text-sm font-black tracking-widest uppercase px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                {t("nav_login")}
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-7xl mx-auto p-8 md:p-12 w-full flex flex-col space-y-20">
        
        {/* HERO SECTION */}
        <header className="text-center space-y-8 pt-16 md:pt-24">
          <div className="space-y-4">
            <p className="text-xs font-bold tracking-[0.4em] uppercase text-accent opacity-80">
              {t("hero_badge")}
            </p>

            <h1 className="text-6xl md:text-9xl font-black tracking-tighter text-primary italic drop-shadow-sm">
              {t("title")}
            </h1>

            <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase opacity-50 text-secondary">
              {t("subtitle")}
            </p>
          </div>

          <div className="w-24 h-1.5 bg-accent mx-auto rounded-full" />

          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          {/* DYNAMIC CALL TO ACTION (CTA) */}
          <div className="pt-8">
            {isLoggedIn ? (
              <div className="flex justify-center">
                <Link
                  href={`/${locale}/managements/member-managements`}
                  className="px-8 py-3 bg-primary text-primary-foreground font-black text-sm tracking-widest uppercase rounded-md hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  {t("cta_login")}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Request Akses COMA`}
                  className="px-8 py-3 bg-primary text-primary-foreground font-black text-sm tracking-widest uppercase rounded-md hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                >
                  {t("cta_request")}
                </a>

                <Link
                  href={`/${locale}/auth/login`}
                  className="px-8 py-3 border border-border text-foreground font-bold text-sm tracking-widest uppercase rounded-md hover:border-primary hover:text-primary transition-colors"
                >
                  {t("nav_login")}
                </Link>
              </div>
            )}
          </div>

          {/* Cta Note */}
          <p className="text-xs text-text-muted opacity-60 tracking-wide pt-4">
            {t("cta_note")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-primary transition-colors font-medium"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </header>

        {/* MODULES SECTION DIVIDER */}
        <div className="flex items-center gap-6 pt-8">
          <div className="flex-1 h-px bg-border/60" />
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-text-muted opacity-60 whitespace-nowrap">
            {t("modules_section_label")}
          </p>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
          {modules.map((m) => (
            <div
              key={m.id}
              className="group p-8 rounded-xl bg-secondary/5 border border-border/60 hover:border-primary/40 hover:bg-secondary/10 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-center min-h-[192px] cursor-default"
            >
              <h3 className="text-xl font-bold tracking-tight mb-4 group-hover:text-primary transition-colors">
                {t(`modules.${m.id}.title`)}
              </h3>
              <p className="text-text-muted text-sm leading-relaxed opacity-90">
                {t(`modules.${m.id}.desc`)}
              </p>
            </div>
          ))}
        </section>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-border py-12 flex flex-col items-center gap-6 bg-bg-alt/30 mt-auto">
        <p className="text-center italic text-text-muted max-w-lg px-4 text-sm font-medium">
          {t("footer_quote")}
        </p>

        {!isLoggedIn && (
          <div className="flex items-center gap-6">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Request Akses COMA`}
              className="text-xs font-bold tracking-widest uppercase text-primary hover:opacity-70 transition-opacity"
            >
              {t("nav_request")}
            </a>

            <span className="text-border">|</span>

            <Link
              href={`/${locale}/auth/login`}
              className="text-xs font-bold tracking-widest uppercase text-text-muted hover:text-primary transition-colors"
            >
              {t("nav_login")}
            </Link>
          </div>
        )}

        <div className="text-[10px] font-bold uppercase tracking-[0.5em] opacity-40 text-primary">
          {t("footer_est")}
        </div>
      </footer>
    </main>
  );
}