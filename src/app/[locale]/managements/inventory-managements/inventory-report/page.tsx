"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  MapPin, Building2, Hash, Package, PackageX,
  TrendingUp, Layers, FileText, Printer,
  BarChart2, List, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown,
  ChevronLeft, ChevronRight, Search, Filter, X
} from "lucide-react";

/* ================= TYPES ================= */

type ActiveTab = "overview" | "list";

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

/* ================= COMPONENT ================= */

export default function InventoryReportPage() {
  const t = useTranslations("InventoryReportPage");
  const tCommon = useTranslations("Common");

  /* ===== STATE ===== */
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  /* List tab state */
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

  /* ===== TOKEN ===== */
  const getToken = useCallback(() => {
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("coma_token="))
        ?.split("=")[1] ??
      localStorage.getItem("token") ??
      ""
    );
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

  /* ===== FETCH (Overview — all locations, no pagination) ===== */
  const fetchAllLocations = useCallback(async () => {
    try {
      const url = new URL(`/api/v1/inventory/locations`, window.location.origin);
      url.searchParams.set("limit", "9999");
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLocations(data.data?.items ?? data.data ?? []);
      }
    } catch {
      // silent
    }
  }, [getToken]);

  /* ===== FETCH (List tab — paginated + filtered) ===== */
  const fetchPaginatedLocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`/api/v1/inventory/locations`, window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      Object.entries(activeFilters).forEach(([key, val]) => {
        if (val) url.searchParams.set(key, val);
      });
      if (sortConfig.direction !== "default" && sortConfig.key) {
        url.searchParams.set("sortBy", sortConfig.key);
        url.searchParams.set("sortDir", sortConfig.direction);
      }
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
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

  useEffect(() => {
    if (activeTab === "overview") {
      fetchAllLocations();
    } else {
      fetchPaginatedLocations();
    }
  }, [activeTab, fetchAllLocations, fetchPaginatedLocations]);

  /* ===== SORT ===== */
  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
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

  /* ===== ANALYSIS DATA ===== */
  const analysisData = useMemo(() => {
    const withItemsCount = locations.filter((l) => (l.itemCount ?? 0) > 0).length;
    const emptyCount = locations.filter((l) => (l.itemCount ?? 0) === 0).length;
    const grandTotal = locations.reduce((acc, l) => acc + (l.itemCount ?? 0), 0);

    const byBuilding = locations.reduce((acc, loc) => {
      if (loc.building) {
        acc[loc.building] = (acc[loc.building] || 0) + (loc.itemCount ?? 0);
      }
      return acc;
    }, {} as Record<string, number>);

    const byFloor = locations.reduce((acc, loc) => {
      const key = loc.floor || "Unknown";
      acc[key] = (acc[key] || 0) + (loc.itemCount ?? 0);
      return acc;
    }, {} as Record<string, number>);

    const topLocations = [...locations]
      .sort((a, b) => (b.itemCount ?? 0) - (a.itemCount ?? 0))
      .slice(0, 5);

    const maxBuilding = Math.max(...Object.values(byBuilding), 1);
    const maxFloor = Math.max(...Object.values(byFloor), 1);

    const utilizationRate =
      locations.length > 0 ? Math.round((withItemsCount / locations.length) * 100) : 0;

    return {
      withItemsCount,
      emptyCount,
      grandTotal,
      byBuilding,
      byFloor,
      topLocations,
      maxBuilding,
      maxFloor,
      utilizationRate,
    };
  }, [locations]);

  /* ===== PRINT ===== */
  const handlePrint = () => window.print();

  /* ===== TABLE HEADERS ===== */
  const tableHeaders = [
    { key: "no", label: "No", sortable: false },
    { key: "name", label: t("table.name"), sortable: true },
    { key: "building", label: t("table.building"), sortable: true },
    { key: "floor", label: t("table.floor"), sortable: true },
    { key: "itemCount", label: t("table.item_count"), sortable: true },
    { key: "status", label: t("table.status"), sortable: false },
  ];

  /* ===== REPORT DATE ===== */
  const reportDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* ================= UI ================= */

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="text-left">
          <div className="flex items-center gap-2.5 mb-1">
            <FileText size={22} className="text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">
              {t("title")}
            </h1>
          </div>
          <p className="text-sm text-text-muted mt-1">
            {t("description")} · {t("generated_on")} <span className="font-semibold text-foreground">{reportDate}</span>
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg-alt border border-border text-foreground rounded-lg font-bold hover:bg-border/50 transition-all text-sm cursor-pointer print:hidden"
        >
          <Printer size={16} /> {t("btn_print")}
        </button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-bg-alt border border-border rounded-lg w-fit mb-6 overflow-x-auto scrollbar-hide print:hidden">
        {[
          { key: "overview", label: t("tab_overview"), icon: BarChart2 },
          { key: "list", label: t("tab_list"), icon: List },
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

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: t("stats.total_locations"),
                val: locations.length,
                icon: MapPin,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                label: t("stats.active_locations"),
                val: analysisData.withItemsCount,
                icon: Package,
                color: "text-green-500",
                bg: "bg-green-500/10",
              },
              {
                label: t("stats.empty_locations"),
                val: analysisData.emptyCount,
                icon: PackageX,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
              },
              {
                label: t("stats.total_items"),
                val: analysisData.grandTotal.toLocaleString(),
                icon: Hash,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-bg-alt border border-border/60 rounded-lg p-4 flex items-center gap-4 text-left"
              >
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

          {/* UTILIZATION BANNER */}
          <div className="bg-bg-alt border border-border/60 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">
                {t("utilization_rate")}
              </p>
              <p className="text-3xl font-black text-primary">{analysisData.utilizationRate}%</p>
            </div>
            <div className="flex-1 w-full sm:w-auto">
              <div className="h-3 bg-border/40 rounded-full overflow-hidden w-full">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-700"
                  style={{ width: `${analysisData.utilizationRate}%` }}
                />
              </div>
              <p className="text-xs text-text-muted mt-1.5">
                {analysisData.withItemsCount} {t("of")} {locations.length} {t("locations_in_use")}
              </p>
            </div>
          </div>

          {/* CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ITEMS BY BUILDING */}
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
                <Building2 size={18} /> {t("chart_by_building")}
              </div>
              <div className="p-5 space-y-4">
                {Object.entries(analysisData.byBuilding).length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">{t("no_data")}</p>
                ) : (
                  Object.entries(analysisData.byBuilding)
                    .sort((a, b) => b[1] - a[1])
                    .map(([building, count]) => {
                      const pct =
                        analysisData.maxBuilding > 0
                          ? (count / analysisData.maxBuilding) * 100
                          : 0;
                      return (
                        <div key={building} className="space-y-1.5 text-left">
                          <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                            <span>{building}</span>
                            <span>{count.toLocaleString()} {t("items")}</span>
                          </div>
                          <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-700 ease-out"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* ITEMS BY FLOOR */}
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
                <Layers size={18} /> {t("chart_by_floor")}
              </div>
              <div className="p-5 space-y-4">
                {Object.entries(analysisData.byFloor).length === 0 ? (
                  <p className="text-text-muted text-sm text-center py-8">{t("no_data")}</p>
                ) : (
                  Object.entries(analysisData.byFloor)
                    .sort((a, b) => b[1] - a[1])
                    .map(([floor, count]) => {
                      const pct =
                        analysisData.maxFloor > 0
                          ? (count / analysisData.maxFloor) * 100
                          : 0;
                      return (
                        <div key={floor} className="space-y-1.5 text-left">
                          <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase">
                            <span>{t("floor")} {floor}</span>
                            <span>{count.toLocaleString()} {t("items")}</span>
                          </div>
                          <div className="h-1.5 bg-border/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/70 transition-all duration-700 ease-out"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>

          {/* TOP LOCATIONS */}
          <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
            <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center">
              <TrendingUp size={18} /> {t("top_locations_title")}
            </div>
            <div className="divide-y divide-border/40">
              {analysisData.topLocations.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-8">{t("no_data")}</p>
              ) : (
                analysisData.topLocations.map((loc, i) => (
                  <div key={loc.id} className="flex items-center justify-between p-4 px-5 text-left">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center text-[11px] font-black ${
                          i < 3
                            ? "bg-yellow-500/20 text-yellow-600"
                            : "bg-border/40 text-text-muted"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground truncate max-w-48">
                          {loc.name}
                        </p>
                        {loc.building && (
                          <p className="text-[10px] text-text-muted">
                            {loc.building}
                            {loc.floor ? ` · ${t("floor")} ${loc.floor}` : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-foreground font-mono">
                        {(loc.itemCount ?? 0).toLocaleString()}
                      </p>
                      <p className="text-[10px] text-text-muted">{t("items")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PRINT TABLE (hidden on screen, visible on print) */}
          <div className="hidden print:block">
            <PrintTable locations={locations} t={t} />
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
              <Filter size={16} /> {t("advanced_filters")}
            </button>
          </div>

          {/* ADVANCED FILTERS */}
          {showFilters && (
            <div className="p-4 border-b border-border/60 bg-background/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                placeholder={t("filter_building")}
                value={filters.building}
                onChange={(e) => setFilters({ ...filters, building: e.target.value })}
                className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
              />
              <input
                type="text"
                placeholder={t("filter_floor")}
                value={filters.floor}
                onChange={(e) => setFilters({ ...filters, floor: e.target.value })}
                className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
              />
              <div className="flex gap-2 justify-end col-span-full sm:col-span-2 lg:col-span-2">
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-transparent border border-border rounded-lg text-sm font-bold hover:bg-border/50 cursor-pointer text-foreground"
                >
                  {t("btn_reset")}
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 cursor-pointer"
                >
                  {t("btn_apply")}
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
                      className={`py-4 px-4 font-semibold text-center ${
                        header.sortable
                          ? "cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                          : ""
                      }`}
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
                      {t("no_locations_found")}
                    </td>
                  </tr>
                ) : (
                  locations.map((item, i) => (
                    <tr key={item.id} className="hover:bg-background/40 transition-colors text-sm">
                      <td className="py-4 px-4 text-text-muted font-mono">
                        {(page - 1) * limit + i + 1}
                      </td>
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
                        {(item.itemCount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-4">
                        {(item.itemCount ?? 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/10 text-green-600 text-xs font-bold rounded-full">
                            <Package size={10} /> {t("status_active")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500/10 text-orange-500 text-xs font-bold rounded-full">
                            <PackageX size={10} /> {t("status_empty")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="p-4 border-t border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <p className="text-xs text-text-muted pr-4 border-r border-border/60">
                {tCommon("total")}
                <span className="font-bold text-foreground pl-1">{totalItems}</span>
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-text-muted">{tCommon("rows_per_page")}:</p>
                <div className="relative">
                  <select
                    value={limit}
                    onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    className="appearance-none bg-bg-alt border border-border text-foreground rounded-lg px-3 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:border-primary cursor-pointer"
                  >
                    {[10, 25, 50, 100].map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                    size={12}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= PRINT TABLE (sub-component) ================= */

function PrintTable({
  locations,
  t,
}: {
  locations: Location[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="bg-bg-alt border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2">
        <List size={18} /> {t("tab_list")}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-background/80 border-b border-border/60 text-[11px] uppercase tracking-wider text-text-muted">
              {["No", t("table.name"), t("table.building"), t("table.floor"), t("table.item_count"), t("table.status")].map(
                (h) => (
                  <th key={h} className="py-3 px-4 text-left font-semibold">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {locations.map((item, i) => (
              <tr key={item.id}>
                <td className="py-3 px-4 text-text-muted font-mono">{i + 1}</td>
                <td className="py-3 px-4 font-medium">{item.name}</td>
                <td className="py-3 px-4 text-text-muted">{item.building || "—"}</td>
                <td className="py-3 px-4 text-text-muted font-mono">{item.floor || "—"}</td>
                <td className="py-3 px-4 font-mono font-bold">{(item.itemCount ?? 0).toLocaleString()}</td>
                <td className="py-3 px-4">
                  {(item.itemCount ?? 0) > 0 ? t("status_active") : t("status_empty")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}