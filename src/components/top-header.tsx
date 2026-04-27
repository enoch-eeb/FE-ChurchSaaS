import { ThemeToggle } from "@/components/theme-toggle";
import { LocaleToggle } from "@/components/locale-toggle";
import { ProfileDropdown } from "./profile-dropdown";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end px-6 bg-background/70 backdrop-blur-md shadow-[0_1px_0_0_hsl(var(--border)/0.4)]">
      <div className="flex items-center gap-3">
        <LocaleToggle />
        <ThemeToggle />
        <ProfileDropdown />
      </div>
    </header>
  );
}