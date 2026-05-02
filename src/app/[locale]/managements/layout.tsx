import { Sidebar } from "@/components/sidebar-layout";
import { TopHeader } from "@/components/top-header";
import { MAIN_SIDEBAR_MENUS } from "@/config/sidebar-menus";

export default function ManagementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Memanggil Sidebar Global yang sudah digabung */}
      <Sidebar menus={MAIN_SIDEBAR_MENUS} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopHeader />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}