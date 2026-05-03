"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Search, ChevronLeft, ChevronRight, Plus,
  Eye, Edit2, Trash2,
  X, AlertTriangle,
  MapPin, Hash, ChevronDown,
  ArrowUp, ArrowDown, ArrowUpDown, Filter,
  List, BarChart2,
  Package, PackageX,
  TrendingUp, Building2, Layers
} from "lucide-react";

/* ================= TYPES ================= */

type ActiveTab = "list" | "analysis";

type Location = {
  id: string;
  name: string;
  building: string;
  floor: string;
  description: string;
  itemCount?: number;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | "default";
};

/* ================= CONSTANTS ================= */

const EMPTY_LOCATION: Omit<Location, "id"> = {
  name: "",
  building: "",
  floor: "",
  description: "",
};

/* ================= COMPONENT ================= */

export default function InventoryLocationPage() {
  const t = useTranslations("InventoryLocationPage");
  const tCommon = useTranslations("Common");

  /* ===== STATE ===== */
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("list");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ building: "", floor: "" });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* ===== MODAL ===== */
  const [viewItem, setViewItem] = useState<Location | null>(null);
  const [editItem, setEditItem] = useState<Location | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ ...EMPTY_LOCATION });

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
  const fetchLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`/api/v1/inventory/locations`, window.location.origin);
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
        setLocations(data.data?.items ?? data.data ?? []);
        setTotalItems(data.data?.totalItems ?? data.data?.length ?? 0);
        setTotalPages(data.data?.totalPages ?? 1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, activeFilters, sortConfig, getToken]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

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
    const reset = { building: "", floor: "" };
    setFilters(reset);
    setActiveFilters(reset);
    setPage(1);
  };

  /* ===== CRUD ===== */
  const handleAdd = async () => {
    await fetch(`/api/v1/inventory/locations`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(newItem)
    });
    setIsAddOpen(false);
    setNewItem({ ...EMPTY_LOCATION });
    fetchLocations();
  };

  const handleEdit = async () => {
    if (!editItem) return;
    await fetch(`/api/v1/inventory/locations/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(editItem)
    });
    setEditItem(null);
    fetchLocations();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/v1/inventory/locations/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    setDeleteId(null);
    fetchLocations();
  };

  /* ===== ANALYSIS DATA ===== */
  const analysisData = useMemo(() => {
    const withItems = locations.filter(l => (l.itemCount ?? 0) > 0).length;
    const empty = locations.filter(l => (l.itemCount ?? 0) === 0).length;
    const totalItemsInLocations = locations.reduce((acc, l) => acc + (l.itemCount ?? 0), 0);

    const byBuilding = locations.reduce((acc, loc) => {
      if (loc.building) acc[loc.building] = (acc[loc.building] || 0) + (loc.itemCount ?? 0);
      return acc;
    }, {} as Record<string, number>);

    const topLocations = [...locations]
      .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))
      .slice(0, 5);

    return { withItems, empty, totalItemsInLocations, byBuilding, topLocations };
  }, [locations]);

  /* ===== TABLE HEADERS ===== */
  const tableHeaders = [
    { key: "no", label: "No", sortable: false },
    { key: "name", label: t("table.name"), sortable: true },
    { key: "building", label: t("table.building"), sortable: true },
    { key: "floor", label: t("table.floor"), sortable: true },
    { key: "itemCount", label: t("table.item_count"), sortable: true },
    { key: "action", label: t("table.action"), sortable: false },
  ];

  /* ===== SHARED FORM ===== */
  const currentForm = editItem ?? newItem;
  const setCurrentForm = (val: Partial<Location>) => {
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

      {/* TABS + ADD BUTTON */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-bg-alt border border-border rounded-lg w-fit overflow-x-auto scrollbar-hide">
          {[
            { key: "list", label: "Location List", icon: List },
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
              { label: "Total Locations", val: totalItems, icon: MapPin, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Has Items", val: analysisData.withItems, icon: Package, color: "text-green-500", bg: "bg-green-500/10" },
              { label: "Empty", val: analysisData.empty, icon: PackageX, color: "text-orange-500", bg: "bg-orange-500/10" },
              { label: "Total Items", val: analysisData.totalItemsInLocations, icon: Hash, color: "text-purple-500", bg: "bg-purple-500/10" },
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
            {/* ITEMS BY BUILDING */}
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
                <Building2 size={18} /> Items by Building
              </div>
              <div className="p-5 space-y-4">
                {Object.entries(analysisData.byBuilding).length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">No data available</p>
                ) : Object.entries(analysisData.byBuilding).map(([building, count]) => {
                  const pct = analysisData.totalItemsInLocations > 0
                    ? (count / analysisData.totalItemsInLocations) * 100
                    : 0;
                  return (
                    <div key={building} className="space-y-1.5 text-left">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                        <span>{building}</span>
                        <span>{count} items</span>
                      </div>
                      <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOP LOCATIONS RANKING */}
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
                <TrendingUp size={18} /> Top Locations by Items
              </div>
              <div className="divide-y divide-border/40">
                {analysisData.topLocations.length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">No data available</p>
                ) : analysisData.topLocations.map((loc, i) => (
                  <div key={loc.id} className="flex items-center justify-between p-4 px-5 text-left">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${i < 3 ? "bg-yellow-500/20 text-yellow-600" : "bg-border/40 text-text-muted"}`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground truncate max-w-36">{loc.name}</p>
                        {loc.building && (
                          <p className="text-[10px] text-text-muted">{loc.building}{loc.floor ? ` · Floor ${loc.floor}` : ""}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-foreground">{loc.itemCount ?? 0}</p>
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
                placeholder="Building"
                value={filters.building}
                onChange={(e) => setFilters({ ...filters, building: e.target.value })}
                className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
              />
              <input
                type="text"
                placeholder="Floor"
                value={filters.floor}
                onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
                className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
              />
              <div className="flex gap-2 justify-end col-span-full sm:col-span-2 lg:col-span-2">
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
            <table className="w-full text-center border-collapse min-w-200">
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
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="py-4 px-4">
                          <div className="h-4 bg-border/50 rounded-lg w-20 mx-auto animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-text-muted text-sm">
                      No locations found.
                    </td>
                  </tr>
                ) : locations.map((item, i) => (
                  <tr key={item.id} className="hover:bg-background/40 transition-colors text-sm">
                    <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + i + 1}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                        <MapPin size={13} className="text-text-muted shrink-0" /> {item.name}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {item.building ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-alt border border-border/60 rounded-md text-xs font-bold text-text-muted uppercase tracking-wide">
                          <Building2 size={11} /> {item.building}
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs italic opacity-40">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-text-muted text-sm font-mono">
                      {item.floor || <span className="italic opacity-40">—</span>}
                    </td>
                    <td className="py-4 px-4 text-foreground font-mono font-bold">
                      {item.itemCount ?? 0}
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
                ))}
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
                <MapPin className="text-primary" size={20} /> Location Detail
              </h3>
              <button onClick={() => setViewItem(null)} className="text-text-muted hover:text-red-500 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: MapPin, label: "Location Name", value: viewItem.name },
                { icon: Building2, label: "Building", value: viewItem.building },
                { icon: Layers, label: "Floor", value: viewItem.floor },
                { icon: Hash, label: "Item Count", value: (viewItem.itemCount ?? 0).toString() },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <Icon size={14} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{value || "—"}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <List size={14} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Description</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {viewItem.description || <span className="italic opacity-40">No description</span>}
                  </p>
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
                { field: "name", label: "Location Name", placeholder: "e.g. Storage Room A" },
                { field: "building", label: "Building", placeholder: "e.g. Main Building" },
                { field: "floor", label: "Floor", placeholder: "e.g. 2nd Floor" },
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
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Description</label>
                <textarea
                  placeholder="e.g. Ground floor storage near loading dock"
                  value={currentForm.description}
                  onChange={(e) => setCurrentForm({ description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none resize-none"
                />
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