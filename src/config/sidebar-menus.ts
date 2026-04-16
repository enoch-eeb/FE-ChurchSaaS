export type MenuItem = {
  title: string;
  href: string;
  icon?: string;
};

export const MEMBER_SIDEBAR_MENUS: MenuItem[] = [
  { title: "Dashboard", href: "/managements/member-managements" },
  { title: "Daftar Member", href: "/managements/member-managements/directory" },
  { title: "Absen Member", href: "/managements/member-managements/attendance" },
  { title: "Structure Management", href: "/managements/member-managements/structure" },
];
