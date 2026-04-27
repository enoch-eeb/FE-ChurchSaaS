"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");

    try {
      // Tembak ke endpoint BE untuk trigger email
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal mengirim permintaan");

      setMessage({ type: "success", text: "Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <header className="flex justify-end items-center p-6 px-8 gap-4">
        <LocaleToggle />
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pb-20">
        <div className="w-full max-w-md p-8 bg-bg-alt border border-border/60 rounded-lg shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic text-primary font-mono tracking-tighter">COMA.</h1>
            <h2 className="text-xl font-bold mt-4">{t("forgot_password_title")}</h2>
            <p className="text-text-muted text-sm mt-2">{t("forgot_password_subtitle")}</p>
          </div>

          {message && (
            <div className={`mb-6 p-3 border rounded-lg text-sm text-center ${
              message.type === "success" 
                ? "bg-green-500/10 border-green-500/50 text-green-600 dark:text-green-400" 
                : "bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400"
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-primary">{t("email")}</label>
              <input
                name="email"
                type="email"
                required
                className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                placeholder="admin@church.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || message?.type === "success"}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity mt-4 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (t("loading") || "Loading...") : t("send_reset_link")}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted mt-6">
            <Link href={`/${locale}/auth/login`} className="text-primary font-bold hover:underline">
              &larr; {t("back_to_login")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}