"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { 
  Search, ChevronLeft, ChevronRight, UserPlus,
  ChevronDown, Edit2, Trash2, AlertTriangle, 
  Loader2, Filter, ArrowUpDown, X, CheckCircle, UserX, Ban 
} from "lucide-react";

type User = {
  userId: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MEMBER";
  isActive: boolean;
  banUntil?: string | null;
  churchId?: string;
  Church?: { name: string };
};

const formatUIEnum = (val?: string) => {
  if (!val) return "-";
  return val.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
};

const initialNewUser = { email: "", password: "", role: "MEMBER", churchId: "" };

export default function UserDirectoryPage() {
  const t = useTranslations("AppManagement.UserDirectoryPage");
  const tCommon = useTranslations("Common");
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ email: "", churchName: "", role: "" });
  const [activeFilters, setActiveFilters] = useState({ ...filters });
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState(initialNewUser);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [banId, setBanId] = useState<string | null>(null);
  const [banDays, setBanDays] = useState(7);
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const getToken = useCallback(() => {
    return document.cookie.split("; ").find((row) => row.startsWith("coma_token="))?.split("=")[1] ?? localStorage.getItem("token") ?? "";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1); }, 500);
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
      
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      
      if (res.ok && data.data) {
        setUsers(data.data.rows || []);
        setTotalPages(data.data.totalPages || 1);
        setTotalItems(data.data.totalItems || 0);
      }
    } catch (err) { console.error(err); } finally { setIsLoading(false); }
  }, [page, limit, debouncedSearch, activeFilters, getToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const paginationRange = useMemo(() => {
    const range = [];
    for (let i = 1; i <= totalPages; i++) range.push(i);
    return range;
  }, [totalPages]);

  // Aksi CRUD
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true); setErrorMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(newUser)
      });
      if (res.ok) { setIsAddModalOpen(false); fetchUsers(); } 
      else { const d = await res.json(); setErrorMsg(d.message || "Failed to add user"); }
    } finally { setIsSaving(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setIsSaving(true); setErrorMsg(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${editUser.userId}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ role: editUser.role })
      });
      if (res.ok) { setEditUser(null); fetchUsers(); }
    } finally { setIsSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${deleteId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) { setDeleteId(null); fetchUsers(); }
    } catch (err) {}
  };

  const handleBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${banId}/ban`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ durationDays: banDays })
      });
      if (res.ok) { setBanId(null); fetchUsers(); }
    } finally { setIsSaving(false); }
  };

  const handleUnban = async (id: string) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${id}/unban`, {
      method: "PATCH", headers: { Authorization: `Bearer ${getToken()}` }
    });
    fetchUsers();
  };

  const tableHeaders = [
    { label: t("table.no") },
    { label: t("table.email") },
    { label: t("table.church_name") },
    { label: t("table.role") },
    { label: t("table.status") },
    { label: t("table.action") },
  ];

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground text-left">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-text-muted text-sm mt-1">{t("description")}</p>
        </div>
        <button onClick={() => { setNewUser(initialNewUser); setIsAddModalOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all">
          <UserPlus size={18} /> {t("btn_add")}
        </button>
      </div>

      <div className="bg-bg-alt border border-border rounded-lg shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input type="text" placeholder={t("search_placeholder")} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-all" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-sm border border-border bg-background hover:bg-border/50 transition-all">
            <Filter size={16} /> {t("filter_title")}
          </button>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-border/60 bg-background/30 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
            <input type="text" placeholder="Email" value={filters.email} onChange={e => setFilters({...filters, email: e.target.value})} className="p-2 text-sm bg-background border border-border rounded-lg outline-none" />
            <input type="text" placeholder="Church Name" value={filters.churchName} onChange={e => setFilters({...filters, churchName: e.target.value})} className="p-2 text-sm bg-background border border-border rounded-lg outline-none" />
            <select value={filters.role} onChange={e => setFilters({...filters, role: e.target.value})} className="p-2 text-sm bg-background border border-border rounded-lg outline-none cursor-pointer">
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
            </select>
            <div className="md:col-span-3 flex justify-end gap-3 mt-2">
              <button onClick={() => { setFilters({email:"", churchName:"", role:""}); setActiveFilters({email:"", churchName:"", role:""}); setPage(1); }} className="px-5 py-2 border border-border rounded-lg text-sm font-bold">{t("filter_reset")}</button>
              <button onClick={() => { setActiveFilters(filters); setPage(1); }} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold">{t("filter_apply")}</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-background/80 border-b border-border/60 text-[11px] uppercase tracking-wider text-text-muted">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="py-4 px-4 font-semibold text-center"><div className="inline-flex items-center gap-1.5">{h.label}</div></th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr><td colSpan={6} className="py-10"><Loader2 className="animate-spin mx-auto text-primary" /></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-text-muted">No data found.</td></tr>
              ) : users.map((u, idx) => (
                <tr key={u.userId} className="hover:bg-background/40 transition-colors text-sm">
                  <td className="py-4 px-4 text-text-muted">{(page-1)*limit + idx + 1}</td>
                  <td className="py-4 px-4 font-medium">{u.email}</td>
                  <td className="py-4 px-4 text-text-muted">{u.Church?.name || "-"}</td>
                  {/* UX FIX: Plain Text Role instead of Chip */}
                  <td className="py-4 px-4 font-bold text-text-muted">{formatUIEnum(u.role)}</td>
                  <td className="py-4 px-4">
                    {u.isActive ? <span className="text-green-500 font-bold flex items-center justify-center gap-1.5"><CheckCircle size={14}/> Active</span> : 
                    <span className="text-red-500 font-bold flex items-center justify-center gap-1.5"><UserX size={14}/> Banned</span>}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditUser(u); setErrorMsg(null); }} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg"><Edit2 size={16}/></button>
                      {/* UX FIX: Icon Ban & Unban */}
                      {u.role !== 'SUPER_ADMIN' && (
                        u.isActive ? (
                          <button onClick={() => setBanId(u.userId)} className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg"><Ban size={16}/></button>
                        ) : (
                          <button onClick={() => handleUnban(u.userId)} className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg"><CheckCircle size={16}/></button>
                        )
                      )}
                      <button onClick={() => setDeleteId(u.userId)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-xs text-text-muted pr-4 border-r border-border/60">{tCommon("total")} <span className="font-bold text-foreground">{totalItems}</span></p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-muted">{tCommon("rows_per_page")}</p>
              <select value={limit} onChange={(e) => {setLimit(Number(e.target.value)); setPage(1);}} className="bg-bg-alt border border-border text-foreground rounded px-2 py-1 text-xs font-bold focus:outline-none">
                {[10, 25, 50].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} className="p-2 disabled:opacity-30" disabled={page === 1}><ChevronLeft size={18}/></button>
            <div className="flex items-center gap-1 mx-1">
              {paginationRange.map((p, i) => (
                <button key={i} onClick={() => setPage(p)} className={`min-w-8 h-8 text-xs font-bold rounded-lg ${p === page ? "bg-primary text-primary-foreground" : "text-text-muted hover:bg-border/50"}`}>{p}</button>
              ))}
            </div>
            <button onClick={() => setPage(p => Math.min(totalPages, p+1))} className="p-2 disabled:opacity-30" disabled={page === totalPages}><ChevronRight size={18}/></button>
          </div>
        </div>
      </div>

      {/* MODAL ADD */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background border border-border w-full max-w-md rounded-lg shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border/60">
              <h3 className="text-lg font-bold">{t("modal.add_title")}</h3>
              <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-text-muted hover:text-red-500" /></button>
            </div>
            {errorMsg && <div className="mx-6 mt-4 p-3 bg-red-500/10 text-red-500 text-sm rounded-lg">{errorMsg}</div>}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Email</label>
                <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Password</label>
                <input type="password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Role</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg outline-none focus:border-primary">
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2 border border-border rounded-lg text-sm">{t("modal.btn_cancel")}</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm">{isSaving ? <Loader2 size={16} className="animate-spin" /> : t("modal.btn_save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background border border-border w-full max-w-md rounded-lg shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-border/60">
              <h3 className="text-lg font-bold">{t("modal.edit_title")}</h3>
              <button onClick={() => setEditUser(null)}><X size={20} className="text-text-muted hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Email</label>
                <input type="email" disabled value={editUser.email} className="w-full p-2.5 bg-bg-alt/50 border border-border rounded-lg text-text-muted cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Role</label>
                <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value as any})} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg outline-none focus:border-primary">
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditUser(null)} className="px-5 py-2 border border-border rounded-lg text-sm">{t("modal.btn_cancel")}</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2 bg-primary text-white rounded-lg text-sm">{isSaving ? <Loader2 size={16} className="animate-spin" /> : t("modal.btn_save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BAN */}
      {banId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background border border-border w-full max-w-sm rounded-lg p-6 shadow-2xl relative text-center">
            <button onClick={() => setBanId(null)} className="absolute right-4 top-4 text-text-muted hover:text-red-500"><X size={20} /></button>
            <div className="flex items-center justify-center w-12 h-12 bg-orange-500/10 text-orange-500 rounded-lg mb-4 mx-auto"><AlertTriangle size={24}/></div>
            <h3 className="text-lg font-bold mb-2">{t("modal.ban_title")}</h3>
            <p className="text-sm text-text-muted mb-6">{t("modal.ban_desc")}</p>
            <form onSubmit={handleBan} className="space-y-4">
              <input type="number" required min={1} value={banDays} onChange={e => setBanDays(Number(e.target.value))} className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-center outline-none focus:border-primary" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setBanId(null)} className="flex-1 py-2 border border-border rounded-lg font-bold">{t("modal.btn_cancel")}</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-orange-500 text-white rounded-lg font-bold">{isSaving ? <Loader2 size={16} className="animate-spin mx-auto"/> : t("modal.btn_ban")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DELETE */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-background border border-border w-full max-w-sm rounded-lg p-6 shadow-2xl relative text-center">
            <button onClick={() => setDeleteId(null)} className="absolute right-4 top-4 text-text-muted hover:text-red-500"><X size={20} /></button>
            <div className="flex items-center justify-center w-12 h-12 bg-red-500/10 text-red-500 rounded-lg mb-4 mx-auto"><Trash2 size={24}/></div>
            <h3 className="text-lg font-bold mb-2">{t("modal.delete_title")}</h3>
            <p className="text-sm text-text-muted mb-6">{t("modal.delete_desc")}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 border border-border rounded-lg font-bold">{t("modal.btn_cancel")}</button>
              <button onClick={handleDelete} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-bold">{t("modal.btn_delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}