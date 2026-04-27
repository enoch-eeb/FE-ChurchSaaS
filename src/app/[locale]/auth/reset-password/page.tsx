"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  //Mengambil token dari URL (?token=...)
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token) {
      setError("Token tidak valid atau tidak ditemukan di URL.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Kata sandi tidak cocok!");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Gagal mengatur ulang kata sandi");

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 3000); //Otomatis pindah ke login setelah 3 detik

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Kata Sandi Berhasil Diubah!</h3>
        <p className="text-text-muted text-sm mb-6">Anda akan diarahkan ke halaman login dalam beberapa detik...</p>
        <Link href={`/${locale}/auth/login`} className="w-full inline-block bg-primary text-primary-foreground py-3 rounded-[8px] font-bold hover:opacity-90">
          Ke Halaman Login Sekarang
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-600 rounded-[8px] text-sm text-center">
          {error}
        </div>
      )}

      {!token && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/50 text-yellow-600 rounded-[8px] text-sm text-center mb-4">
          Token reset kata sandi tidak ditemukan di URL. Pastikan Anda membuka tautan yang benar dari email Anda.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1 text-primary">{t("new_password")}</label>
        <div className="relative">
          <input
            name="newPassword"
            type={showPassword ? "text" : "password"}
            required
            minLength={8}
            className="w-full p-3 pr-11 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 text-primary">{t("confirm_password")}</label>
        <input
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          required
          minLength={8}
          className="w-full p-3 bg-background border border-border rounded-[8px] focus:outline-none focus:border-primary transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !token}
        className="w-full bg-primary text-primary-foreground py-3 rounded-[8px] font-bold hover:opacity-90 transition-opacity mt-6 disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? (t("loading") || "Loading...") : t("btn_reset_password")}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const t = useTranslations("Auth");

  return (
    <div className="min-h-screen flex flex-col bg-background transition-colors duration-300">
      <header className="flex justify-end items-center p-6 px-8 gap-4">
        <LocaleToggle />
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pb-20">
        <div className="w-full max-w-md p-8 bg-bg-alt border border-border/60 rounded-[8px] shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black italic text-primary font-mono tracking-tighter">COMA.</h1>
            <h2 className="text-xl font-bold mt-4">{t("reset_password_title")}</h2>
            <p className="text-text-muted text-sm mt-2">{t("reset_password_subtitle")}</p>
          </div>

          <Suspense fallback={<div className="text-center text-text-muted">Memuat...</div>}>
            <ResetPasswordForm />
          </Suspense>

        </div>
      </div>
    </div>
  );
}