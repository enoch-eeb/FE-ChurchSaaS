"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData);

    try {
      // Menembak ke API Route Handler Next.js
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mendaftar");
      }

      setSuccess(data.message);
      
      // Tunggu 2 detik agar user sempat membaca pesan sukses, lalu arahkan ke login
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-10">
      <div className="w-full max-w-lg p-8 bg-bg-alt border border-border/60 rounded-[8px] shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black italic text-primary font-mono tracking-tighter">COMA.</h1>
          <h2 className="text-xl font-bold mt-4">{t("register_title")}</h2>
          <p className="text-text-muted text-sm mt-1">{t("register_subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 text-red-600 rounded-[8px] text-sm text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 text-green-600 rounded-[8px] text-sm text-center">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">{t("church_name")}</label>
              <input 
                name="churchName"
                type="text" 
                required
                className="w-full p-3 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors"
                placeholder="GBI Pusat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">{t("church_code")}</label>
              <input 
                name="churchCode"
                type="text" 
                required
                className="w-full p-3 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors uppercase"
                placeholder="GBI-PST"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-primary">{t("admin_name")}</label>
            <input 
              name="adminName"
              type="text" 
              required
              className="w-full p-3 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-primary">{t("email")}</label>
            <input 
              name="adminEmail"
              type="email" 
              required
              className="w-full p-3 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors"
              placeholder="admin@church.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-primary">{t("password")}</label>
            <input 
              name="adminPassword"
              type="password" 
              required
              className="w-full p-3 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || !!success}
            className="w-full bg-primary text-primary-foreground py-3 rounded-[8px] font-bold hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? "Loading..." : t("btn_register")}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          {t("have_account")}{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            {t("btn_login")}
          </Link>
        </p>
      </div>
    </div>
  );
}