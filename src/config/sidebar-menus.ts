export type MenuItem = {
  titleKey: string;
  href: string;
  icon?: string;
};

export type MenuSection = {
  sectionKey: string;
  items: MenuItem[];
};

export const MAIN_SIDEBAR_MENUS: MenuSection[] = [
  {
    sectionKey: "member_management",
    items: [
      { titleKey: "member_dashboard", href: "/managements/member-managements" },
      { titleKey: "member_directory", href: "/managements/member-managements/member-directory" },
      { titleKey: "member_attendance", href: "/managements/member-managements/member-attendance" },
      { titleKey: "member_structure", href: "/managements/member-managements/structure" },
      { titleKey: "member_birthday", href: "/managements/member-managements/member-birthday" },
      { titleKey: "member_document", href: "/managements/member-managements/document" },
    ]
  },
  {
    sectionKey: "inventory_management",
    items: [
      { titleKey: "inventory_dashboard", href: "/managements/inventory-managements" },
      { titleKey: "inventory_list", href: "/managements/inventory-managements/inventory-list" },
      { titleKey: "inventory_category", href: "/managements/inventory-managements/inventory-category" },
      { titleKey: "inventory_location", href: "/managements/inventory-managements/inventory-location" }, 
      { titleKey: "inventory_report", href: "/managements/inventory-managements/inventory-report" },
    ]
  },
];