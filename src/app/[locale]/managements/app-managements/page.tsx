"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { 
  Search, ChevronLeft, ChevronRight, UserPlus,
  ChevronDown, Edit2, Trash2, AlertTriangle, Eye, 
  Loader2, Filter, ArrowUp, ArrowDown, ArrowUpDown, X,
  CheckCircle, UserX, Building2, Clock, ShieldAlert
} from "lucide-react";

type User = {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  isActive: boolean;
  banUntil: string | null;
  Church?: { name: string; uniqueCode: string };
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | "default";
};

export default function UserDirectoryPage() {
  const t = useTranslations("AppManagement.UserList");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ email: "", role: "", churchName: "" });
  const [activeFilters, setActiveFilters] = useState({ ...filters });
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals State
  const [banUserId, setBanUserId] = useState<string | null>(null);
  const [banDays, setBanDays] = useState(7);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const getToken = useCallback(() => {
    return document.cookie.split("; ").find((row) => row.startsWith("coma_token="))?.split("=")[1] ?? localStorage.getItem("token") ?? "";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/global`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      if (activeFilters.email) url.searchParams.set("email", activeFilters.email);
      if (activeFilters.role) url.searchParams.set("role", activeFilters.role);
      if (activeFilters.churchName) url.searchParams.set("churchName", activeFilters.churchName);

      if (sortConfig.direction !== "default" && sortConfig.key) {
        url.searchParams.set("sortBy", sortConfig.key);
        url.searchParams.set("sortDir", sortConfig.direction);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        setUsers(data.data.rows ?? []);
        setTotalPages(data.data.totalPages ?? 1);
        setTotalItems(data.data.totalItems ?? 0);
      }
    } catch (err) {
      console.error("Gagal fetch users:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, activeFilters, sortConfig, getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const paginationRange = useMemo(() => {
    const range = [];
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

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: "default" };
    });
    setPage(1);
  };

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUserId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${banUserId}/ban`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ durationDays: banDays }),
      });
      if (res.ok) {
        setBanUserId(null);
        fetchUsers();
      }
    } finally { setIsSaving(false); }
  };

  const handleUnban = async (id: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${id}/unban`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) fetchUsers();
    } catch (err) {}
  };

  const handleApplyFilters = () => { setActiveFilters(filters); setPage(1); };
  const handleResetFilters = () => {
    const reset = { email: "", role: "", churchName: "" };
    setFilters(reset); setActiveFilters(reset); setPage(1);
  };

  const tableHeaders = [
    { key: "no", label: "NO", sortable: false },
    { key: "email", label: "USER IDENTITY", sortable: true },
    { key: "church", label: "AFFILIATION", sortable: true },
    { key: "role", label: "ROLE", sortable: true },
    { key: "status", label: "STATUS", sortable: true },
    { key: "action", label: "SECURITY ACTION", sortable: false },
  ];

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-text-muted text-sm mt-1">{t("description")}</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer whitespace-nowrap">
          <UserPlus size={18} /> {t("btn_add")}
        </button>
      </div>

      <div className="bg-bg-alt border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder={t("filter_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-all text-foreground"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer border ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:bg-border/50'}`}
          >
            <Filter size={16} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border/60 bg-background/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Email</label>
              <input type="text" value={filters.email} onChange={(e) => setFilters({...filters, email: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Church Name</label>
              <input type="text" value={filters.churchName} onChange={(e) => setFilters({...filters, churchName: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">Role</label>
              <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:border-primary cursor-pointer">
                <option value="">All Roles</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button onClick={handleResetFilters} className="px-5 py-2 bg-transparent border border-border text-foreground rounded-lg text-sm font-bold hover:bg-border/50 transition-colors cursor-pointer">Reset</button>
              <button onClick={handleApplyFilters} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer">Apply</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-center border-collapse min-w-250">
            <thead>
              <tr className="bg-background/80 border-b border-border/60 text-[11px] uppercase tracking-wider text-text-muted select-none">
                {tableHeaders.map((h) => (
                  <th key={h.key} onClick={() => h.sortable && handleSort(h.key)} className={`py-4 px-4 font-semibold text-center ${h.sortable ? "cursor-pointer hover:bg-black/5 transition-colors" : ""}`}>
                    <div className="items-center justify-center gap-1.5 inline-flex">
                      {h.label}
                      {h.sortable && (
                        <span className="opacity-70">
                          {sortConfig.key === h.key && sortConfig.direction === "asc" ? <ArrowUp size={14}/> : sortConfig.key === h.key && sortConfig.direction === "desc" ? <ArrowDown size={14}/> : <ArrowUpDown size={14} className="opacity-40"/>}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-center">
              {isLoading ? Array.from({ length: limit }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 6 }).map((_, j) => (<td key={j} className="py-4 px-4"><div className="h-4 bg-border/50 rounded-lg w-full animate-pulse mx-auto"></div></td>))}</tr>
              )) : users.map((u, idx) => (
                <tr key={u.userId} className="hover:bg-background/40 transition-colors text-sm">
                  <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + idx + 1}</td>
                  <td className="py-4 px-4 font-bold">{u.email}</td>
                  <td className="py-4 px-4 flex items-center justify-center gap-2"><Building2 size={14} className="text-text-muted"/>{u.Church?.name || "-"}</td>
                  <td className="py-4 px-4"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${u.role === 'SUPER_ADMIN' ? 'bg-primary text-primary-foreground' : 'bg-border text-text-muted'}`}>{u.role}</span></td>
                  <td className="py-4 px-4">
                    {u.isActive ? (
                      <span className="flex items-center justify-center gap-1.5 text-green-500 font-bold text-xs"><CheckCircle size={14} /> Active</span>
                    ) : (
                      <div className="flex flex-col items-center"><span className="flex items-center gap-1.5 text-red-500 font-bold text-xs"><UserX size={14} /> Banned</span>{u.banUntil && <span className="text-[9px] text-text-muted">Ends: {new Date(u.banUntil).toLocaleDateString()}</span>}</div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-1">
                      {u.role !== 'SUPER_ADMIN' && (
                        u.isActive ? (
                          <button onClick={() => setBanUserId(u.userId)} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer">Ban</button>
                        ) : (
                          <button onClick={() => handleUnban(u.userId)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 cursor-pointer">Unban</button>
                        )
                      )}
                      <button className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg cursor-pointer"><Edit2 size={16}/></button>
                      <button onClick={() => setDeleteId(u.userId)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGING - IDENTIK DENGAN MEMBER DIRECTORY */}
        <div className="p-4 border-t border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-text-muted pr-4 border-r border-border/60">{tCommon("total")}<span className="font-bold text-foreground pl-1">{totalItems}</span></p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-muted">{tCommon("rows_per_page")}:</p>
              <div className="relative">
                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="appearance-none bg-bg-alt border border-border text-foreground rounded-lg px-3 py-1.5 pr-8 text-xs font-bold focus:outline-none focus:border-primary cursor-pointer">
                  {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={12} />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 cursor-pointer"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-1 mx-1">
              {paginationRange.map((p, i) => (
                <button key={i} onClick={() => typeof p === "number" && setPage(p)} disabled={p === "..." || p === page} className={`min-w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${p === page ? "bg-primary text-primary-foreground" : p === "..." ? "text-text-muted cursor-default" : "text-text-muted hover:bg-border/50"}`}>{p}</button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 cursor-pointer"><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>

      {/* BAN MODAL (Popup) */}
      {banUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border border-border w-full max-w-sm rounded-lg p-6 shadow-2xl relative">
            <button onClick={() => setBanUserId(null)} className="absolute right-4 top-4 text-text-muted hover:text-red-500 cursor-pointer"><X size={20} /></button>
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 text-red-500 rounded-lg mb-4 mx-auto"><AlertTriangle size={24}/></div>
            <h3 className="text-lg font-bold text-center mb-2">Ban User Duration</h3>
            <p className="text-xs text-text-muted text-center mb-6">Input the duration (in days) to restrict this user's access.</p>
            <form onSubmit={handleBanSubmit} className="space-y-4">
              <input type="number" required value={banDays} onChange={(e) => setBanDays(Number(e.target.value))} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-center font-bold text-foreground focus:border-primary outline-none" min={1} />
              <button type="submit" disabled={isSaving} className="w-full py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                {isSaving && <Loader2 size={16} className="animate-spin"/>} Confirm Ban
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}