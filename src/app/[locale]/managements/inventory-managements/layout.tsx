import { Sidebar } from "@/components/sidebar-layout";
import { TopHeader } from "@/components/top-header";
import { INVENTORY_SIDEBAR_MENUS } from "@/config/sidebar-menus";

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar items={INVENTORY_SIDEBAR_MENUS} title="Inventory" />

      <div className="flex flex-1 flex-col overflow-hidden">

        <TopHeader />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}