"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { TopHeader } from "@/components/top-header";
//importkomponenprofiledropdown
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
    
    //cektokensaatkomponenpertamakalidimuat
    const checkAuth = () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    
    checkAuth();

    //dengarkanperubahandistorageuntuksinkronisasitab
    window.addEventListener("storage", checkAuth);

    //deteksiaktivitasklikuntukmenangkaplogoutdarikomponentopheader
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

  //fungsilogoutuntukmenghapuscookiehttponlyjwt
  const handleLogout = async () => {
    try {
      //panggilapilogoutuntukmenghapuscookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error("gagal memproses logout", error);
    } finally {
      //hapuspenandadarilocalstorage
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      
      //kembalikankehalamanlocaledanrefresh
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
      <nav className="border-b border-border p-4 px-8 flex justify-between items-center bg-bg-alt/80 backdrop-blur-md sticky top-0 z-20">
        <span className="font-bold text-2xl tracking-tighter text-primary font-mono italic">
          SIMAGE.
        </span>

        <div className="flex items-center gap-4">
          <TopHeader />

          {/*tampilkanprofiledropdownjikasudahloginatautomboljikabelum*/}
          {isLoggedIn ? (
            //lemparfungsihandlelogoutkekomponenprofiledropdown
            <ProfileDropdown onLogout={handleLogout} />
          ) : (
            <>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Request Akses COMA`}
                className="hidden sm:block text-sm font-bold tracking-widest uppercase text-text-muted hover:text-primary transition-colors"
              >
                {t("nav_request")}
              </a>

              <Link
                href={`/${locale}/auth/login`}
                className="text-sm font-black tracking-widest uppercase px-5 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
              >
                {t("nav_login")}
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="flex-1 max-w-7xl mx-auto p-8 md:p-12 w-full flex flex-col space-y-20">
        <header className="text-center space-y-8 pt-16 md:pt-24">
          <div className="space-y-3">
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

          <div className="w-24 h-1.5 bg-accent mx-auto rounded-lg" />

          <p className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
            {t("description")}
          </p>

          {/*sembunyikantomboljikasudahlogin*/}
          {!isLoggedIn && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Request Akses COMA`}
                className="px-10 py-3.5 bg-primary text-primary-foreground font-black text-sm tracking-widest uppercase rounded-md hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                {t("cta_request")}
              </a>

              <Link
                href={`/${locale}/auth/login`}
                className="px-10 py-3.5 border border-border text-foreground font-bold text-sm tracking-widest uppercase rounded-md hover:border-primary hover:text-primary transition-colors"
              >
                {t("cta_login")}
              </Link>
            </div>
          )}

          <p className="text-xs text-text-muted opacity-60 tracking-wide">
            {t("cta_note")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-primary transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </header>

        <div className="flex items-center gap-6">
          <div className="flex-1 h-px bg-border/60" />
          <p className="text-[10px] font-bold tracking-[0.4em] uppercase text-text-muted opacity-60 whitespace-nowrap">
            {t("modules_section_label")}
          </p>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-10">
          {modules.map((m) => (
            //ubahdivmenjadilinkagarseluruhcardmenjadiclickabledanarahkansesuaistatuslogin
            <Link
              key={m.id}
              href={isLoggedIn ? `/${locale}/managements/${m.id}-managements` : `/${locale}/auth/login`}
              className="group p-10 rounded-lg bg-secondary/10 border border-border/60 hover:border-primary/40 hover:bg-secondary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col justify-center min-h-48 block cursor-pointer"
            >
              <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-primary transition-colors">
                {t(`modules.${m.id}.title`)}
              </h3>

              <p className="text-text-muted text-sm leading-relaxed opacity-90">
                {t(`modules.${m.id}.desc`)}
              </p>
            </Link>
          ))}
        </section>
      </div>

      <footer className="border-t border-border py-12 flex flex-col items-center gap-6 bg-bg-alt/30">
        <p className="text-center italic text-text-muted max-w-lg px-4 text-sm">
          {t("footer_quote")}
        </p>

        {/*sembunyikanlinkjikasudahlogin*/}
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