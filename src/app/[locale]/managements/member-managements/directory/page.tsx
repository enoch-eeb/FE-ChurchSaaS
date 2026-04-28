"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { 
  Search, ChevronLeft, ChevronRight, UserPlus,
  ChevronDown, Edit2, Trash2, AlertTriangle, Eye, 
  Loader2, Filter, ArrowUp, ArrowDown, ArrowUpDown, X
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  divisionRole: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
  address: string;
  marriageStatus: "SINGLE" | "MARRIED" | "DIVORCED" | "WIDOWED";
  position: string;
  role: "CHURCH_ADMIN" | "VOLUNTEER" | "MEMBER";
  isActive: boolean;
  Division?: { name: string };
  Church?: { name: string };
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | "default";
};

export default function MemberDirectoryPage() {
  const t = useTranslations("MemberManagementsPage.directory");
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    name: "", email: "", phone: "", dobStart: "", dobEnd: "", gender: "", marriageStatus: "", role: ""
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
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

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      if (activeFilters.name) url.searchParams.set("name", activeFilters.name);
      if (activeFilters.email) url.searchParams.set("email", activeFilters.email);
      if (activeFilters.phone) url.searchParams.set("phone", activeFilters.phone);
      if (activeFilters.dobStart) url.searchParams.set("dobStart", activeFilters.dobStart);
      if (activeFilters.dobEnd) url.searchParams.set("dobEnd", activeFilters.dobEnd);
      if (activeFilters.gender) url.searchParams.set("gender", activeFilters.gender);
      if (activeFilters.marriageStatus) url.searchParams.set("marriageStatus", activeFilters.marriageStatus);
      if (activeFilters.role) url.searchParams.set("role", activeFilters.role);

      if (sortConfig.direction !== "default" && sortConfig.key) {
        url.searchParams.set("sortBy", sortConfig.key);
        url.searchParams.set("sortDir", sortConfig.direction);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        setMembers(data.data.items ?? []);
        setTotalPages(data.data.totalPages ?? 1);
        setTotalItems(data.data.totalItems ?? 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, activeFilters, sortConfig, getToken]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

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

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members/${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        setDeleteId(null);
        fetchMembers();
      }
    } catch (err) { console.error(err); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members/${editMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(editMember)
      });
      if (res.ok) {
        setEditMember(null);
        fetchMembers();
      }
    } catch (err) { console.error(err); } 
    finally { setIsSaving(false); }
  };

  const handleApplyFilters = () => { setActiveFilters(filters); setPage(1); };
  
  const handleResetFilters = () => {
    const reset = { name: "", email: "", phone: "", dobStart: "", dobEnd: "", gender: "", marriageStatus: "", role: "" };
    setFilters(reset); setActiveFilters(reset); setPage(1);
  };

  const handleDobStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFilters(prev => ({
      ...prev,
      dobStart: val,
      dobEnd: (prev.dobEnd && val > prev.dobEnd) ? val : prev.dobEnd
    }));
  };

  const tableHeaders = [
    { key: "no", label: t("table.no"), sortable: false },
    { key: "name", label: t("table.name"), sortable: true },
    { key: "dateOfBirth", label: t("table.dob"), sortable: true },
    { key: "email", label: t("table.email"), sortable: true },
    { key: "phone", label: t("table.phone"), sortable: true },
    { key: "gender", label: t("table.gender"), sortable: true },
    { key: "marriageStatus", label: t("table.marriage"), sortable: true },
    { key: "role", label: t("table.role"), sortable: true },
    { key: "action", label: t("table.action"), sortable: false },
  ];

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
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
              placeholder={t("search_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-all text-foreground"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer border ${showFilters ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border text-foreground hover:bg-border/50'}`}
          >
            <Filter size={16} /> {t("filter_title")}
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border/60 bg-background/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("table.name")}</label>
              <input type="text" value={filters.name} onChange={(e) => setFilters({...filters, name: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("table.email")}</label>
              <input type="email" value={filters.email} onChange={(e) => setFilters({...filters, email: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("table.phone")}</label>
              <input type="text" value={filters.phone} onChange={(e) => setFilters({...filters, phone: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("filter_dob_start")}</label>
              <input type="date" value={filters.dobStart} onChange={handleDobStartChange} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("filter_dob_end")}</label>
              <input type="date" min={filters.dobStart} value={filters.dobEnd} onChange={(e) => setFilters({...filters, dobEnd: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer" />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("table.gender")}</label>
              <select value={filters.gender} onChange={(e) => setFilters({...filters, gender: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer">
                <option value="">{t("all_genders")}</option>
                <option value="MALE">MALE</option>
                <option value="FEMALE">FEMALE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("table.marriage")}</label>
              <select value={filters.marriageStatus} onChange={(e) => setFilters({...filters, marriageStatus: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer">
                <option value="">{t("all_marriage")}</option>
                <option value="SINGLE">SINGLE</option>
                <option value="MARRIED">MARRIED</option>
                <option value="DIVORCED">DIVORCED</option>
                <option value="WIDOWED">WIDOWED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted mb-1">{t("table.role")}</label>
              <select value={filters.role} onChange={(e) => setFilters({...filters, role: e.target.value})} className="w-full p-2 text-sm bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary cursor-pointer">
                <option value="">{t("all_roles")}</option>
                <option value="MEMBER">MEMBER</option>
                <option value="VOLUNTEER">VOLUNTEER</option>
                <option value="CHURCH_ADMIN">CHURCH_ADMIN</option>
              </select>
            </div>
            <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
              <button onClick={handleResetFilters} className="px-5 py-2 bg-transparent border border-border text-foreground rounded-lg text-sm font-bold hover:bg-border/50 transition-colors cursor-pointer">{t("filter_reset")}</button>
              <button onClick={handleApplyFilters} className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer">{t("filter_apply")}</button>
            </div>
          </div>
        )}

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
                            <ArrowUpDown size={14} className="opacity-40" />
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
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-border/50 rounded-lg w-full animate-pulse mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr><td colSpan={9} className="py-20 text-center text-text-muted">{t("no_data")}</td></tr>
              ) : (
                members.map((m, idx) => (
                  <tr key={m.id} className="hover:bg-background/40 transition-colors text-sm">
                    <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-4 px-4 text-foreground">{m.name}</td>
                    <td className="py-4 px-4 text-text-muted">{m.dateOfBirth || "-"}</td>
                    <td className="py-4 px-4 text-text-muted">{m.email || "-"}</td>
                    <td className="py-4 px-4 text-text-muted font-mono">{m.phone || "-"}</td>
                    <td className="py-4 px-4 text-[11px] uppercase text-text-muted">
                      {m.gender === "MALE" ? "Male" : m.gender === "FEMALE" ? "Female" : "-"}
                    </td>
                    <td className="py-4 px-4 text-[11px] uppercase text-text-muted">{m.marriageStatus || "-"}</td>
                    <td className="py-4 px-4 text-[11px] uppercase text-text-muted">
                      {m.role ? m.role.replace("_", " ") : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => setViewMember(m)} className="p-2 text-foreground hover:bg-border/50 rounded-lg transition-colors cursor-pointer"><Eye size={16} /></button>
                        <button onClick={() => setEditMember(m)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer"><Edit2 size={16} /></button>
                        <button onClick={() => setDeleteId(m.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-text-muted pr-4 border-r border-border/60">
              {t("total")}<span className="font-bold text-foreground pl-1">{totalItems}</span>
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-muted">{t("rows_per_page")}:</p>
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
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {paginationRange.map((p, i) => (
                <button key={i} onClick={() => typeof p === "number" && setPage(p)} disabled={p === "..." || p === page} className={`min-w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${p === page ? "bg-primary text-primary-foreground shadow-sm" : p === "..." ? "text-text-muted cursor-default" : "text-text-muted hover:bg-border/50"}`}>
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading} className="p-2 text-text-muted hover:bg-border/50 rounded-lg disabled:opacity-30 transition-colors cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {viewMember && (
        <div onClick={() => setViewMember(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden cursor-default">
            <div className="flex justify-between items-center p-6 border-b border-border/60">
              <h3 className="text-xl font-bold text-center w-full text-foreground">{t("view_detail")}</h3>
              <button onClick={() => setViewMember(null)} className="absolute right-6 text-text-muted hover:text-red-500 transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div>
                <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-center text-foreground">{t("detail_info")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-alt p-4 rounded-lg border border-border/50">
                  <div><p className="text-xs text-text-muted">{t("table.id")}</p><p className="text-sm text-foreground">{viewMember.id}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.name")}</p><p className="text-sm text-foreground">{viewMember.name}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.email")}</p><p className="text-sm text-foreground">{viewMember.email || "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.phone")}</p><p className="text-sm text-foreground">{viewMember.phone || "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.dob")}</p><p className="text-sm text-foreground">{viewMember.dateOfBirth || "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.gender")}</p><p className="text-sm text-foreground capitalize">{viewMember.gender ? viewMember.gender.toLowerCase() : "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.marriage")}</p><p className="text-sm text-foreground capitalize">{viewMember.marriageStatus ? viewMember.marriageStatus.toLowerCase() : "-"}</p></div>
                  <div className="sm:col-span-2"><p className="text-xs text-text-muted">{t("table.address")}</p><p className="text-sm text-foreground">{viewMember.address || "-"}</p></div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-center text-foreground">{t("detail_church")}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-alt p-4 rounded-lg border border-border/50">
                  <div className="sm:col-span-2"><p className="text-xs text-text-muted">{t("table.church")}</p><p className="text-sm text-foreground">{viewMember.Church?.name || "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.division")}</p><p className="text-sm text-foreground">{viewMember.Division?.name || "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.division_role")}</p><p className="text-sm text-foreground capitalize">{viewMember.divisionRole ? viewMember.divisionRole.replace("_", " ").toLowerCase() : "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.position")}</p><p className="text-sm text-foreground">{viewMember.position || "-"}</p></div>
                  <div><p className="text-xs text-text-muted">{t("table.role")}</p><p className="text-sm text-foreground capitalize">{viewMember.role ? viewMember.role.replace("_", " ").toLowerCase() : "-"}</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editMember && (
        <div onClick={() => setEditMember(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full max-w-3xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden cursor-default">
            <div className="flex justify-between items-center p-6 border-b border-border/60">
              <h3 className="text-xl font-bold text-center w-full text-foreground">{t("edit_title")}</h3>
              <button onClick={() => setEditMember(null)} className="absolute right-6 text-text-muted hover:text-red-500 transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.name")}</label>
                    <input type="text" required value={editMember.name} onChange={e => setEditMember({...editMember, name: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.email")}</label>
                    <input type="email" required value={editMember.email} onChange={e => setEditMember({...editMember, email: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.phone")}</label>
                    <input type="text" value={editMember.phone || ""} onChange={e => setEditMember({...editMember, phone: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.dob")}</label>
                    <input type="date" value={editMember.dateOfBirth || ""} onChange={e => setEditMember({...editMember, dateOfBirth: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.gender")}</label>
                    <select value={editMember.gender} onChange={e => setEditMember({...editMember, gender: e.target.value as "MALE" | "FEMALE"})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
                      <option value="MALE">MALE</option>
                      <option value="FEMALE">FEMALE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.marriage")}</label>
                    <select value={editMember.marriageStatus} onChange={e => setEditMember({...editMember, marriageStatus: e.target.value as any})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
                      <option value="SINGLE">SINGLE</option>
                      <option value="MARRIED">MARRIED</option>
                      <option value="DIVORCED">DIVORCED</option>
                      <option value="WIDOWED">WIDOWED</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.role")}</label>
                    <select value={editMember.role} onChange={e => setEditMember({...editMember, role: e.target.value as any})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
                      <option value="MEMBER">MEMBER</option>
                      <option value="VOLUNTEER">VOLUNTEER</option>
                      <option value="CHURCH_ADMIN">CHURCH_ADMIN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.position")}</label>
                    <input type="text" value={editMember.position || ""} onChange={e => setEditMember({...editMember, position: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.division_role")}</label>
                    <select value={editMember.divisionRole} onChange={e => setEditMember({...editMember, divisionRole: e.target.value as any})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none">
                      <option value="MEMBER">MEMBER</option>
                      <option value="SECRETARY">SECRETARY</option>
                      <option value="VICE_LEADER">VICE_LEADER</option>
                      <option value="LEADER">LEADER</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-text-muted mb-1">{t("table.address")}</label>
                    <textarea rows={3} value={editMember.address || ""} onChange={e => setEditMember({...editMember, address: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-foreground focus:border-primary focus:outline-none resize-none" />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-border/60 flex justify-end gap-3 bg-bg-alt/50">
                <button type="button" onClick={() => setEditMember(null)} className="px-5 py-2.5 bg-transparent border border-border text-foreground hover:bg-border/50 rounded-lg font-bold transition-colors cursor-pointer">
                  {t("btn_cancel")}
                </button>
                <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
                  {isSaving && <Loader2 size={16} className="animate-spin" />} {t("btn_save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div onClick={() => setDeleteId(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full max-w-sm rounded-lg p-6 shadow-2xl cursor-default relative">
            <button onClick={() => setDeleteId(null)} className="absolute right-4 top-4 text-text-muted hover:text-red-500 transition-colors cursor-pointer"><X size={20} /></button>
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 text-red-500 rounded-lg mb-4 mx-auto mt-2">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-center text-foreground mb-2">{t("delete_confirm_title")}</h3>
            <p className="text-text-muted text-sm text-center mb-6">{t("delete_confirm_desc")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-bold hover:bg-border/50 transition-colors cursor-pointer">{t("btn_cancel")}</button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors cursor-pointer">{t("btn_delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}