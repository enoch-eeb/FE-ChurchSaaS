"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLoaderStore } from "@/store/useLoaderStore";
import {
  Package,
  ClipboardList,
  Tags,
  MapPin,
  BarChart2,
  AlertTriangle,
  PackageCheck,
  Wrench,
} from "lucide-react";

export default function InventoryManagementsPage() {
  const t = useTranslations("InventoryManagementsPage");
  const { showLoader } = useLoaderStore();
  const router = useRouter();

  const handleNavigation = async (href: string, message: string) => {
    showLoader(message);
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(href);
  };

  const shortcuts = [
    {
      id: "inventory-list",
      href: "/managements/inventory-managements/inventory-list",
      icon: <ClipboardList className="w-6 h-6" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      hoverBg: "group-hover:bg-blue-500",
    },
    {
      id: "inventory-category",
      href: "/managements/inventory-managements/inventory-category",
      icon: <Tags className="w-6 h-6" />,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      hoverBg: "group-hover:bg-purple-500",
    },
    {
      id: "inventory-location",
      href: "/managements/inventory-managements/inventory-location",
      icon: <MapPin className="w-6 h-6" />,
      color: "text-green-500",
      bg: "bg-green-500/10",
      hoverBg: "group-hover:bg-green-500",
    },
    {
      id: "inventory-report",
      href: "/managements/inventory-managements/inventory-report",
      icon: <BarChart2 className="w-6 h-6" />,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      hoverBg: "group-hover:bg-orange-500",
    },
  ];

  const statCards = [
    {
      label: "Total Items",
      value: "—",
      icon: <Package size={18} className="text-blue-500" />,
      bg: "bg-blue-500/10",
    },
    {
      label: "Good Condition",
      value: "—",
      icon: <PackageCheck size={18} className="text-green-500" />,
      bg: "bg-green-500/10",
    },
    {
      label: "Needs Repair",
      value: "—",
      icon: <Wrench size={18} className="text-orange-500" />,
      bg: "bg-orange-500/10",
    },
    {
      label: "Broken",
      value: "—",
      icon: <AlertTriangle size={18} className="text-red-500" />,
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-10">

      {/* Header */}
      <header className="border-b border-border/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          {t("title")}
        </h1>
        <p className="mt-2 text-text-muted">
          {t("description")}
        </p>
      </header>

      {/* Stat Preview Cards */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Ringkasan Inventaris</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 p-4 bg-bg-alt border border-border/60 rounded-lg"
            >
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                {stat.icon}
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground leading-none">{stat.value}</p>
                <p className="text-[10px] uppercase font-bold text-text-muted mt-1.5 leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Access */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-foreground">Akses Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.id}
              onClick={() =>
                handleNavigation(
                  shortcut.href,
                  `Memuat ${t(`menus.${shortcut.id}.title`)}...`
                )
              }
              className="group flex flex-col p-6 bg-bg-alt border border-border/60 rounded-lg hover:border-primary hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-lg ${shortcut.bg} ${shortcut.color} flex items-center justify-center mb-4 group-hover:scale-110 ${shortcut.hoverBg} group-hover:text-white transition-all duration-300`}
              >
                {shortcut.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                {t(`menus.${shortcut.id}.title`)}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t(`menus.${shortcut.id}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Placeholder Widget */}
      <section className="mt-10 p-8 bg-secondary/10 border border-border/60 rounded-lg border-dashed flex flex-col items-center justify-center text-center min-h-50">
        <Package className="text-text-muted/40 mb-3" size={32} />
        <p className="text-text-muted font-medium">Widget Statistik Inventaris akan tampil di sini</p>
        <span className="text-xs text-text-muted/60 mt-2">(Dalam Pengembangan)</span>
      </section>

    </div>
  );
}