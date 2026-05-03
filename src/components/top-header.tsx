import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end bg-transparent">
      <div className="flex items-center gap-2">
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}