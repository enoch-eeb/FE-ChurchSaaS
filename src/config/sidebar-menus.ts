export type MenuItem = {
  title: string;
  href: string;
  icon?: string;
};

export const MEMBER_SIDEBAR_MENUS: MenuItem[] = [
  { title: "Dashboard", href: "/managements/member-managements" },
  { title: "Daftar Member", href: "/managements/member-managements/member-directory" },
  { title: "Absen Member", href: "/managements/member-managements/member-attendance" },
  { title: "Structure", href: "/managements/member-managements/structure" },
  { title: "Member Birthday", href: "/managements/member-managements/member-birthday" },
  { title: "Documents", href: "/managements/member-managements/document" },
];

export const INVENTORY_SIDEBAR_MENUS: MenuItem[] = [
  { title: "Dashboard", href: "/managements/inventory-managements" },
  { title: "Daftar Inventaris", href: "/managements/inventory-managements/inventory-list" },
  { title: "Manajemen Kategori", href: "/managements/inventory-managements/inventory-category" },
  { title: "Manajemen Lokasi", href: "/managements/inventory-managements/inventory-location" }, 
  { title: "Laporan Inventaris", href: "/managements/inventory-managements/inventory-report" },
  { title: "Inventory Loan", href: "/managements/inventory-managements/inventory-loan" },
];