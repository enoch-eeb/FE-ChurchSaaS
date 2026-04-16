"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

type Locale = "id" | "en";

export function LocaleToggle() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    if (isPending) return;
    const next: Locale = locale === "id" ? "en" : "id";
    const newPath = pathname.replace(new RegExp(`^/${locale}`), `/${next}`);
    startTransition(() => router.replace(newPath, { scroll: false }));
  };

  const isEN = locale === "en";

  return (
    <button
      role="switch"
      aria-checked={isEN}
      aria-label="Toggle language"
      onClick={handleToggle}
      disabled={isPending}
      className={[
        "relative flex items-center",
        "w-17 h-8 rounded-full p-0.75",
        "bg-muted border border-border",
        "transition-opacity duration-150",
        "hover:border-ring",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-40",
        "cursor-pointer select-none",
      ].join(" ")}
    >
      <span
        aria-hidden
        className={[
          "absolute top-0.75 left-0.75",
          "w-7.75 h-6.5 rounded-full",
          "bg-primary shadow-sm",
          "transition-transform duration-300 ease-[cubic-bezier(0.65,0,0.35,1)]",
          isEN ? "translate-x-7.75" : "translate-x-0",
        ].join(" ")}
      />

      {(["id", "en"] as Locale[]).map((l) => (
        <span
          key={l}
          className={[
            "relative z-10 flex-1 text-center text-[10px] font-semibold uppercase tracking-wider",
            "transition-colors duration-300",
            locale === l ? "text-primary-foreground" : "text-muted-foreground/60",
          ].join(" ")}
        >
          {l}
        </span>
      ))}
    </button>
  );
}