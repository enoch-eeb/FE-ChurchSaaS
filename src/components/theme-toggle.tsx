"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className={[
        "flex items-center justify-center",
        "h-8 w-8 rounded-full",
        "bg-muted border border-border",
        "text-muted-foreground hover:text-foreground hover:border-ring",
        "transition-all duration-200",
        "cursor-pointer",
      ].join(" ")}
    >
      {mounted ? (
        isDark ? (
          <Moon className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <Sun className="h-3.5 w-3.5" strokeWidth={2} />
        )
      ) : (
        <span className="block h-3.5 w-3.5" />
      )}
    </button>
  );
}