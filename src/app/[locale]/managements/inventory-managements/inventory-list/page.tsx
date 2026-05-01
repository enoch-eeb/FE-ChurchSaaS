"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Search, ChevronLeft, ChevronRight, Plus,
  Eye, Edit2, Trash2, Loader2,
  X, AlertTriangle, Package, PackageCheck, PackageX,
  MapPin, Tag, Hash, Wrench, ChevronDown,
  ArrowUp, ArrowDown, ArrowUpDown, Filter,
  LayoutGrid, List, CheckCircle2, BarChart2,
  Archive, ShieldAlert, TrendingUp
} from "lucide-react";

/* ================= TYPES ================= */

type InventoryCondition = "GOOD" | "NEEDS_REPAIR" | "BROKEN";
type ActiveTab = "list" | "analysis";

type Inventory = {
  id: string;
  itemName: string;
  category: string;
  quantity: number;
  condition: InventoryCondition;
  location: string;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | "default";
};

/* ================= CONSTANTS ================= */

const EMPTY_ITEM = {
  itemName: "",
  category: "",
  quantity: 0,
  condition: "GOOD" as InventoryCondition,
  location: ""
};

const CONDITION_CONFIG: Record<InventoryCondition, {
  label: string;
  icon: React.ElementType;
  classes: string;
  dot: string;
}> = {
  GOOD: {
    label: "Good",
    icon: PackageCheck,
    classes: "bg-green-500/10 text-green-600 border border-green-500/20",
    dot: "bg-green-500"
  },
  NEEDS_REPAIR: {
    label: "Needs Repair",
    icon: Wrench,
    classes: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
    dot: "bg-orange-500"
  },
  BROKEN: {
    label: "Broken",
    icon: PackageX,
    classes: "bg-red-500/10 text-red-600 border border-red-500/20",
    dot: "bg-red-500"
  }
};

/* ================= COMPONENT ================= */

export default function InventoryListPage() {
  const t = useTranslations("InventoryManagementsPage.list");
  const tCommon = useTranslations("Common");

  /* ===== STATE ===== */
  const [items, setItems] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ category: "", location: "", condition: "" });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* ===== MODAL ===== */
  const [viewItem, setViewItem] = useState<Inventory | null>(null);
  const [editItem, setEditItem] = useState<Inventory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ ...EMPTY_ITEM });

  /* ===== TOKEN ===== */
  const getToken = useCallback(() => {
    return document.cookie.split("; ").find((row) => row.startsWith("coma_token="))?.split("=")[1]
      ?? localStorage.getItem("token") ?? "";
  }, []);

  /* ===== DEBOUNCE SEARCH ===== */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  /* ===== PAGINATION RANGE ===== */
  const paginationRange = useMemo(() => {
    const range: (number | string)[] = [];
    const delta = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [page, totalPages]);

  /* ===== FETCH ===== */
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`/api/v1/inventory`, window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      Object.entries(activeFilters).forEach(([key, val]) => { if (val) url.searchParams.set(key, val); });
      if (sortConfig.direction !== "default" && sortConfig.key) {
        url.searchParams.set("sortBy", sortConfig.key);
        url.searchParams.set("sortDir", sortConfig.direction);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();

      if (res.ok) {
        setItems(data.data?.items ?? data.data ?? []);
        setTotalItems(data.data?.totalItems ?? data.data?.length ?? 0);
        setTotalPages(data.data?.totalPages ?? 1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, activeFilters, sortConfig, getToken]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  /* ===== SORT ===== */
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: "", direction: "default" };
      return { key: "", direction: "default" };
    });
    setPage(1);
  };

  /* ===== FILTERS ===== */
  const handleApplyFilters = () => { setActiveFilters(filters); setPage(1); };
  const handleResetFilters = () => {
    const reset = { category: "", location: "", condition: "" };
    setFilters(reset);
    setActiveFilters(reset);
    setPage(1);
  };

  /* ===== CRUD ===== */
  const handleAdd = async () => {
    await fetch(`/api/v1/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(newItem)
    });
    setIsAddOpen(false);
    setNewItem({ ...EMPTY_ITEM });
    fetchItems();
  };

  const handleEdit = async () => {
    if (!editItem) return;
    await fetch(`/api/v1/inventory/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(editItem)
    });
    setEditItem(null);
    fetchItems();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/v1/inventory/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    setDeleteId(null);
    fetchItems();
  };

  /* ===== ANALYSIS DATA ===== */
  const analysisData = useMemo(() => {
    const good = items.filter(i => i.condition === "GOOD").length;
    const needsRepair = items.filter(i => i.condition === "NEEDS_REPAIR").length;
    const broken = items.filter(i => i.condition === "BROKEN").length;
    const totalQty = items.reduce((acc, i) => acc + i.quantity, 0);

    const byCategory = items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byLocation = items.reduce((acc, item) => {
      acc[item.location] = (acc[item.location] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { good, needsRepair, broken, totalQty, byCategory, byLocation };
  }, [items]);

  /* ===== TABLE HEADERS ===== */
  const tableHeaders = [
    { key: "no", label: "No", sortable: false },
    { key: "itemName", label: t("table.item_name"), sortable: true },
    { key: "category", label: t("table.category"), sortable: true },
    { key: "quantity", label: t("table.quantity"), sortable: true },
    { key: "condition", label: t("table.condition"), sortable: true },
    { key: "location", label: t("table.location"), sortable: true },
    { key: "action", label: t("table.action"), sortable: false },
  ];

  /* ===== FORM FIELD COMPONENT (shared for add/edit) ===== */
  const currentForm = editItem ?? newItem;
  const setCurrentForm = (val: Partial<Inventory>) => {
    if (editItem) setEditItem({ ...editItem, ...val });
    else setNewItem({ ...newItem, ...val } as typeof newItem);
  };

  /* ================= UI ================= */

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div className="text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
            {t("title")}
          </h1>
          <p className="text-sm text-text-muted mt-1">{t("description")}</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-bg-alt border border-border rounded-lg w-fit overflow-x-auto scrollbar-hide">
          {[
            { key: "list", label: "Inventory List", icon: List },
            { key: "analysis", label: "Analysis", icon: BarChart2 }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as ActiveTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-text-muted hover:text-primary"
              }`}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all text-sm cursor-pointer"
        >
          <Plus size={18} /> {t("btn_add")}
        </button>
      </div>

      {/* ===== ANALYSIS TAB ===== */}
      {activeTab === "analysis" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Items", val: totalItems, icon: Archive, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Good Condition", val: analysisData.good, icon: PackageCheck, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Needs Repair", val: analysisData.needsRepair, icon: Wrench, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Broken", val: analysisData.broken, icon: ShieldAlert, color: "text-red-500", bg: "bg-red-500/10" },
            ].map((stat) => (
              <div key={stat.label} className="bg-bg-alt border border-border/60 rounded-lg p-4 flex items-center gap-4 text-left">
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground leading-none">{stat.val}</p>
                  <p className="text-[10px] uppercase font-bold text-text-muted mt-1.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* BY CATEGORY */}
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
                <Tag size={18} /> Items by Category
              </div>
              <div className="p-5 space-y-4">
                {Object.entries(analysisData.byCategory).length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">No data available</p>
                ) : Object.entries(analysisData.byCategory).map(([cat, count]) => {
                  const pct = totalItems > 0 ? (count / totalItems) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1.5 text-left">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                        <span>{cat}</span><span>{count} items</span>
                      </div>
                      <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BY LOCATION */}
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
                <MapPin size={18} /> Items by Location
              </div>
              <div className="divide-y divide-border/40">
                {Object.entries(analysisData.byLocation).length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">No data available</p>
                ) : Object.entries(analysisData.byLocation).map(([loc, count], i) => (
                  <div key={loc} className="flex items-center justify-between p-4 px-5 text-left">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${i < 3 ? "bg-yellow-500/20 text-yellow-600" : "bg-border/40 text-text-muted"}`}>
                        {i + 1}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate max-w-48">{loc}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-foreground">{count}</p>
                      <p className="text-[10px] text-text-muted">items</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== LIST TAB ===== */}
      {activeTab === "list" && (
        <div className="bg-bg-alt border border-border rounded-lg shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">

          {/* SEARCH + FILTER BAR */}
          <div className="p-4 border-b border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder={t("search_placeholder")}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-all text-foreground"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer border ${
                showFilters
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border-border text-foreground hover:bg-border/50"
              }`}
            >
              <Filter size={16} /> Advanced Filters
            </button>
          </div>

          {/* ADVANCED FILTERS */}
          {showFilters && (
            <div className="p-4 border-b border-border/60 bg-background/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="Category"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
              />
              <input
                type="text"
                placeholder="Location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
              />
              <div className="relative">
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters({ ...filters, condition: e.target.value })}
                  className="w-full appearance-none p-2 pr-8 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground cursor-pointer"
                >
                  <option value="">All Conditions</option>
                  <option value="GOOD">Good</option>
                  <option value="NEEDS_REPAIR">Needs Repair</option>
                  <option value="BROKEN">Broken</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-transparent border border-border rounded-lg text-sm font-bold hover:bg-border/50 cursor-pointer text-foreground"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-center border-collapse min-w-250">
              <thead>
                <tr className="bg-background/80 border-b border-border/60 text-[11px] uppercase tracking-wider text-text-muted select-none">
                  {tableHeaders.map((header) => (
                    <th
                      key={header.key}
                      onClick={() => header.sortable && handleSort(header.key)}
                      className={`py-4 px-4 font-semibold text-center ${header.sortable ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" : ""}`}
                    >
                      <div className="items-center justify-center gap-1.5 inline-flex">
                        {header.label}
                        {header.sortable && (
                          <span className="opacity-70">
                            {sortConfig.key === header.key && sortConfig.direction === "asc" ? (
                              <ArrowUp size={14} className="text-foreground opacity-100" />
                            ) : sortConfig.key === header.key && sortConfig.direction === "desc" ? (
                              <ArrowDown size={14} className="text-foreground opacity-100" />
                            ) : (
                              <ArrowUpDown size={14} className="opacity-30" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-center">
                {isLoading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-4 px-4">
                          <div className="h-4 bg-border/50 rounded-lg w-20 mx-auto animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-text-muted text-sm">
                      No inventory items found.
                    </td>
                  </tr>
                ) : items.map((item, i) => {
                  const condConfig = CONDITION_CONFIG[item.condition];
                  const CondIcon = condConfig.icon;
                  return (
                    <tr key={item.id} className="hover:bg-background/40 transition-colors text-sm">
                      <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + i + 1}</td>
                      <td className="py-4 px-4 text-foreground font-medium">{item.itemName}</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-alt border border-border/60 rounded-md text-xs font-bold text-text-muted uppercase tracking-wide">
                          <Tag size={11} /> {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-foreground font-mono font-bold">{item.quantity}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${condConfig.classes}`}>
                          <CondIcon size={12} /> {condConfig.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1.5 text-text-muted text-xs">
                          <MapPin size={12} className="shrink-0" /> {item.location}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => setViewItem(item)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-blue-500/10 hover:text-blue-500 transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setEditItem(item)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteId(item.id)}
                            className="p-1.5 rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 border-t border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs text-text-muted pr-4 border-r border-border/60">
                {tCommon("total")}<span className="font-bold text-foreground pl-1">{totalItems}</span>
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-muted">{tCommon("rows_per_page")}:</p>
                <div className="relative">
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="appearance-none bg-bg-alt border border-border text-foreground rounded-lg px-3 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {[10, 25, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={12} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="flex items-center gap-1 mx-1">
                {paginationRange.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => typeof p === "number" && setPage(p)}
                    disabled={p === "..." || p === page}
                    className={`min-w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      p === page
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : p === "..."
                        ? "text-text-muted cursor-default"
                        : "text-text-muted hover:bg-border/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}

      {/* VIEW MODAL */}
      {viewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setViewItem(null)}
        >
          <div
            className="bg-background border border-border w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-border/50">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <Package className="text-primary" size={20} /> Item Detail
              </h3>
              <button onClick={() => setViewItem(null)} className="text-text-muted hover:text-red-500 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: Package, label: "Item Name", value: viewItem.itemName },
                { icon: Tag, label: "Category", value: viewItem.category },
                { icon: Hash, label: "Quantity", value: viewItem.quantity.toString() },
                { icon: MapPin, label: "Location", value: viewItem.location },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{value || "-"}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <Wrench size={14} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Condition</p>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${CONDITION_CONFIG[viewItem.condition].classes}`}>
                    {viewItem.condition}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(isAddOpen || editItem) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => { setIsAddOpen(false); setEditItem(null); }}
        >
          <div
            className="bg-background border border-border w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-5 border-b border-border/50">
              <h3 className="font-bold text-lg text-foreground">
                {editItem ? t("edit_title") : t("add_title")}
              </h3>
              <button
                onClick={() => { setIsAddOpen(false); setEditItem(null); }}
                className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {[
                { field: "itemName", label: "Item Name", placeholder: "e.g. Projector" },
                { field: "category", label: "Category", placeholder: "e.g. Electronics" },
                { field: "location", label: "Location", placeholder: "e.g. Storage Room A" },
              ].map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">{label}</label>
                  <input
                    placeholder={placeholder}
                    value={(currentForm as any)[field] ?? ""}
                    onChange={(e) => setCurrentForm({ [field]: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Quantity</label>
                <input
                  type="number"
                  min={0}
                  value={currentForm.quantity}
                  onChange={(e) => setCurrentForm({ quantity: Number(e.target.value) })}
                  className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Condition</label>
                <div className="relative">
                  <select
                    value={currentForm.condition}
                    onChange={(e) => setCurrentForm({ condition: e.target.value as InventoryCondition })}
                    className="w-full appearance-none p-2.5 pr-10 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="GOOD">Good</option>
                    <option value="NEEDS_REPAIR">Needs Repair</option>
                    <option value="BROKEN">Broken</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setIsAddOpen(false); setEditItem(null); }}
                  className="flex-1 py-2.5 bg-transparent border border-border rounded-lg text-sm font-bold hover:bg-border/50 cursor-pointer text-foreground transition-colors"
                >
                  {t("btn_cancel")}
                </button>
                <button
                  onClick={editItem ? handleEdit : handleAdd}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 cursor-pointer transition-all"
                >
                  {t("btn_save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setDeleteId(null)}
        >
          <div
            className="bg-background border border-border w-full max-w-sm rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h3 className="font-bold text-lg text-foreground mb-2">{t("delete_confirm_title")}</h3>
              <p className="text-text-muted text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-transparent border border-border rounded-lg text-sm font-bold hover:bg-border/50 cursor-pointer text-foreground"
                >
                  {t("btn_cancel")}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 cursor-pointer transition-colors"
                >
                  {t("btn_delete")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}