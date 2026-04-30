"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);

    try {
      // Menggunakan rute proxy API Next.js agar cookie httpOnly bisa terpasang
      const res = await fetch(`/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal login");
      }

      // Token sekarang dikelola oleh API Proxy via httpOnly cookie untuk keamanan Web3 yang lebih baik
      router.push(`/${locale}/managements/member-managements/directory`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      {/* TOP HEADER */}
      <header className="flex justify-end items-center p-6 px-8 gap-4">
        <LocaleToggle />
        <ThemeToggle />
      </header>

      {/* KONTEN LOGIN */}
      <div className="flex-1 flex items-center justify-center p-4 pb-20">
        <div className="w-full max-w-md p-8 bg-bg-alt border border-border/60 rounded-lg shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic text-primary font-mono tracking-tighter">COMA.</h1>
            <h2 className="text-xl font-bold mt-4">{t("login_title")}</h2>
            <p className="text-text-muted text-sm mt-1">{t("login_subtitle")}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-600 rounded-lg text-sm text-center animate-in fade-in zoom-in-95">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">{t("church_code")}</label>
              <input
                name="churchCode"
                type="text"
                required
                className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors uppercase placeholder:text-text-muted/30"
                placeholder="e.g. GRJ001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-primary">{t("email")}</label>
              <input
                name="email"
                type="email"
                required
                className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/30"
                placeholder="admin@church.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-primary">{t("password")}</label>
                <Link
                  href={`/${locale}/auth/forgot-password`}
                  className="text-xs text-accent hover:text-primary transition-colors font-medium"
                >
                  {t("forgot_password")}
                </Link>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full p-3 pr-11 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted/30"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-all mt-4 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={18} className="animate-spin" />}
              {isLoading ? "Authenticating..." : t("btn_login")}
            </button>
          </form>

          {/* Bagian register sudah dihapus sesuai instruksi */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center">
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} COMA Ecosystem. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}