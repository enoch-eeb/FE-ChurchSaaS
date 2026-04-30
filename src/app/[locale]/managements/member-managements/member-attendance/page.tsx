"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search, CheckCircle2, Circle, Download, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, AlertCircle, Plus, FileSpreadsheet, AlertTriangle, X,
  BarChart2, UserCheck, Phone, Trophy, TrendingUp, Users, ChevronDown, Filter,
  ArrowUp, ArrowDown, ArrowUpDown
} from "lucide-react";
import QRCode from "react-qr-code";

type Member = { 
  id: string; 
  name: string; 
  phone: string; 
  email: string; 
  marriageStatus: string; 
  role: string 
};

type EventSession = { id: string; name: string; date: string };
type AttendanceRecord = Record<string, Record<string, boolean>>;
type ActiveTab = "attendance" | "followup" | "analysis";
type SortConfig = { key: string; direction: "asc" | "desc" | "default" };

type AIAlert = {
  id: string;
  member_id: string;
  trigger_reason: string;
  severity: string;
  status: string;
};

export default function AttendancePage() {
  const t = useTranslations("MemberManagementsPage.AttendancePage");
  const tCommon = useTranslations("Common");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<ActiveTab>("attendance");
  const [events, setEvents] = useState<EventSession[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [attendance, setAttendance] = useState<AttendanceRecord>({});

  const [members, setMembers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allMembersLoaded, setAllMembersLoaded] = useState(false);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ 
    name: "", email: "", phone: "", marriageStatus: "", role: "" 
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");

  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  const getToken = useCallback(() => 
    document.cookie.split("; ").find((row) => row.startsWith("coma_token="))?.split("=")[1] ?? 
    localStorage.getItem("token") ?? "", []);

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

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, { 
        headers: { Authorization: `Bearer ${getToken()}` } 
      });
      const data = await res.json();
      if (res.ok && data.data) setEvents(data.data);
    } catch (err) {}
  }, [getToken]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      
      Object.entries(activeFilters).forEach(([key, val]) => { if (val) url.searchParams.set(key, val); });
      
      if (sortConfig.direction !== "default" && sortConfig.key) {
        url.searchParams.set("sortBy", sortConfig.key);
        url.searchParams.set("sortDir", sortConfig.direction);
      }

      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();

      if (res.ok && data.data) {
        setMembers(data.data.items ?? []);
        setTotalPages(data.data.totalPages ?? 1);
        setTotalItems(data.data.totalItems ?? 0);
      }
    } catch (err) {} finally { setIsLoading(false); }
  }, [page, limit, debouncedSearch, activeFilters, sortConfig, getToken]);

  useEffect(() => { fetchEvents(); fetchMembers(); }, [fetchEvents, fetchMembers]);

  const fetchAllMembers = useCallback(async () => {
    if (allMembersLoaded) return;
    setIsLoadingAll(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members?page=1&limit=9999`, { 
        headers: { Authorization: `Bearer ${getToken()}` } 
      });
      const data = await res.json();
      if (res.ok && data.data) { 
        setAllMembers(data.data.items ?? []); 
        setAllMembersLoaded(true); 
      }
    } catch (err) {} finally { setIsLoadingAll(false); }
  }, [allMembersLoaded, getToken]);

  useEffect(() => { if (activeTab !== "attendance") fetchAllMembers(); }, [activeTab, fetchAllMembers]);

  const fetchFollowUpAlerts = useCallback(async () => {
    setIsLoadingAlerts(true);
    try {
      const res = await fetch(`/api/alerts?status=PENDING`);
      const result = await res.json();
      if (result.success && result.data) {
        setAlerts(result.data);
      }
    } catch (error) {} finally {
      setIsLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "followup") {
      fetchFollowUpAlerts();
    }
  }, [activeTab, fetchFollowUpAlerts]);

  const handleMarkAsContacted = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONTACTED' })
      });
      
      if (res.ok) {
        setAlerts(prev => prev.filter(a => a.id !== alertId));
      }
    } catch (error) {}
  };

  const toggleAttendance = async (memberId: string) => {
    if (!selectedEventId) return;
    const current = attendance[selectedEventId]?.[memberId] ?? false;
    setIsToggling(memberId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ eventId: selectedEventId, memberId, present: !current }),
      });
      setAttendance(prev => ({ ...prev, [selectedEventId]: { ...prev[selectedEventId], [memberId]: !current } }));
    } catch (err) {} finally { setIsToggling(null); }
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      if (prev.direction === "desc") return { key: "", direction: "default" };
      return { key: "", direction: "default" };
    });
    setPage(1);
  };

  const handleApplyFilters = () => { setActiveFilters(filters); setPage(1); };
  const handleResetFilters = () => {
    const reset = { name: "", email: "", phone: "", marriageStatus: "", role: "" };
    setFilters(reset); setActiveFilters(reset); setPage(1);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ name: newEventName.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEvents((prev) => [data.data, ...prev]);
        setSelectedEventId(data.data.id);
        setIsEventModalOpen(false);
        setNewEventName("");
      }
    } catch (err) {}
  };

  const downloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40; canvas.height = img.height + 40;
      if (ctx) { ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 20, 20); }
      const link = document.createElement("a");
      link.download = `QR-${selectedEventId}.png`; link.href = canvas.toDataURL("image/png"); link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const followUpList = useMemo(() => {
    if (events.length === 0 || allMembers.length === 0) return [];
    return allMembers
      .map((m: Member) => {
        const absenceCount = events.filter((evt) => !(attendance[evt.id]?.[m.id] ?? false)).length;
        return { ...m, absenceCount };
      })
      .filter((m) => m.absenceCount >= 3)
      .sort((a, b) => b.absenceCount - a.absenceCount);
  }, [allMembers, events, attendance]);

  const analysisData = useMemo(() => {
    const eventStats = events.map(evt => ({ ...evt, presentTotal: Object.values(attendance[evt.id] ?? {}).filter(Boolean).length }));
    const maxPresent = Math.max(1, ...eventStats.map(e => e.presentTotal));
    const topActive = [...allMembers].map((m: Member) => {
      const count = events.filter(evt => attendance[evt.id]?.[m.id]).length;
      return { ...m, count, rate: events.length > 0 ? (count / events.length) * 100 : 0 };
    }).sort((a, b) => b.count - a.count).slice(0, 10);
    return { eventStats, maxPresent, topActive };
  }, [events, attendance, allMembers]);

  const presentCount = Object.values(attendance[selectedEventId] ?? {}).filter(Boolean).length;

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground">
      <div className="mb-8 text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-tight">{t("title")}</h1>
        <p className="text-text-muted text-sm mt-1">{t("description")}</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex gap-1 p-1 bg-bg-alt border border-border rounded-lg w-fit overflow-x-auto scrollbar-hide">
          {[{ key: "attendance", label: "tabs.attendance", icon: UserCheck }, { key: "followup", label: "tabs.followup", icon: AlertTriangle }, { key: "analysis", label: "tabs.analysis", icon: BarChart2 }].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as ActiveTab)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${activeTab === tab.key ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:text-primary"}`}><tab.icon size={15} /> {t(tab.label)}</button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <button onClick={downloadQR} disabled={!selectedEventId} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 cursor-pointer transition-all">
            <Download size={18} /> <span className="hidden sm:inline">QR Code</span>
          </button>
          <div className="relative min-w-56">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full pl-10 pr-10 py-2.5 bg-bg-alt border border-border rounded-lg focus:outline-none focus:border-primary appearance-none font-medium cursor-pointer text-sm">
              <option value="" disabled>Select Event Session...</option>
              {events.map((evt) => (<option key={evt.id} value={evt.id}>{evt.name}</option>))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
          </div>
          <button onClick={() => setIsEventModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-background border border-border text-primary rounded-lg font-bold hover:bg-border/40 transition-colors cursor-pointer text-sm">
            <Plus size={18} /> Create Session
          </button>
        </div>
      </div>

      {activeTab === "attendance" && (
        <div className="bg-bg-alt border border-border rounded-lg shadow-sm flex flex-col overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input type="text" placeholder="Search member by name or phone..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-all text-foreground" />
            </div>
            <div className="flex items-center gap-3">
              {selectedEventId && <p className="text-sm text-text-muted hidden md:block"><span className="font-bold text-green-500">{presentCount}</span> {t("attendance.present")}</p>}
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer border ${showFilters ? 'bg-primary text-primary-foreground' : 'bg-background border-border text-foreground hover:bg-border/50'}`}>
                <Filter size={16} /> Advanced Filters
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="p-4 border-b border-border/60 bg-background/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
              <input type="text" placeholder="Name" value={filters.name} onChange={e => setFilters({...filters, name: e.target.value})} className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none" />
              <input type="text" placeholder="Email" value={filters.email} onChange={e => setFilters({...filters, email: e.target.value})} className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none" />
              <input type="text" placeholder="Phone" value={filters.phone} onChange={e => setFilters({...filters, phone: e.target.value})} className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={handleResetFilters} className="px-4 py-2 bg-transparent border border-border rounded-lg text-sm font-bold hover:bg-border/50 cursor-pointer">Reset</button>
                <button onClick={handleApplyFilters} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:opacity-90 cursor-pointer">Apply</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full text-center border-collapse min-w-250">
              <thead>
                <tr className="bg-background/80 border-b border-border/60 text-[11px] uppercase tracking-wider text-text-muted select-none">
                  <th className="py-4 px-6 font-semibold w-16 text-center">No</th>
                  {[
                    { key: "name", label: "NAME" },
                    { key: "email", label: "EMAIL" },
                    { key: "phone", label: "PHONE" }
                  ].map(header => (
                    <th key={header.key} onClick={() => handleSort(header.key)} className="py-4 px-4 font-semibold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-center">
                      <div className="flex items-center justify-center gap-1.5 w-full">
                        {header.label}
                        <span className="opacity-70">
                          {sortConfig.key === header.key && sortConfig.direction === "asc" ? <ArrowUp size={14} className="text-foreground" /> : sortConfig.key === header.key && sortConfig.direction === "desc" ? <ArrowDown size={14} className="text-foreground" /> : <ArrowUpDown size={14} className="opacity-30" />}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="py-4 px-6 font-semibold text-center uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-center">
                {isLoading ? Array.from({ length: limit }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (<td key={j} className="py-4 px-4"><div className="h-4 bg-border/50 rounded-lg w-20 mx-auto animate-pulse"></div></td>))}</tr>
                )) : members.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-text-muted text-sm">No members found.</td></tr>
                ) : members.map((m, i) => {
                  const isPresent = attendance[selectedEventId]?.[m.id] ?? false;
                  return (
                    <tr key={m.id} className="hover:bg-background/40 transition-colors text-sm">
                      <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + i + 1}</td>
                      <td className="py-4 px-4 text-foreground">{m.name}</td>
                      <td className="py-4 px-4 text-text-muted">{m.email || "-"}</td>
                      <td className="py-4 px-4 text-text-muted font-mono">{m.phone || "-"}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => toggleAttendance(m.id)} 
                            disabled={isToggling === m.id || !selectedEventId} 
                            className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${isPresent ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-background border border-border text-text-muted hover:bg-border/50"} disabled:opacity-50`}
                          >
                            {isToggling === m.id ? <Loader2 size={14} className="animate-spin" /> : isPresent ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            {isPresent ? "Already Present" : "Mark Present"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
                    className={`min-w-8 h-8 text-xs font-bold rounded-lg transition-all cursor-pointer ${p === page ? "bg-primary text-primary-foreground shadow-sm" : p === "..." ? "text-text-muted cursor-default" : "text-text-muted hover:bg-border/50"}`}
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

      {activeTab === "followup" && (
        <div className="bg-bg-alt border border-border rounded-lg shadow-sm animate-in fade-in duration-300">
          <div className="p-5 border-b border-border/60 text-center">
            <h2 className="font-bold text-primary text-lg">{t("followup.title")}</h2>
            <p className="text-text-muted text-sm mt-0.5">AI-generated alerts for members who require attention.</p>
          </div>

          <div className="p-5">
            {isLoadingAlerts ? (
              <div className="py-24 flex flex-col items-center justify-center text-text-muted">
                <Loader2 size={32} className="animate-spin mb-4 text-primary" />
                <p>Loading AI Alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="py-24 text-center">
                <CheckCircle2 className="mx-auto mb-4 text-green-500" size={48} />
                <p className="font-bold text-xl text-foreground">{t("followup.allActive")}</p>
                <p className="text-text-muted text-sm mt-2">No pending follow-ups required at the moment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {alerts.map((alert) => {
                  const member = allMembers.find(m => m.id === alert.member_id);
                  
                  return (
                    <div key={alert.id} className="flex flex-col p-5 border border-border/60 rounded-lg bg-background hover:border-primary/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-lg text-foreground">
                            {member?.name || alert.member_id}
                          </span>
                          <span className="text-sm text-text-muted font-mono mt-1">
                            {member?.phone || "No Phone Number"}
                          </span>
                        </div>
                        <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md flex items-center gap-1.5 ${
                          alert.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 
                          alert.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 
                          'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20'
                        }`}>
                          <AlertTriangle size={14} />
                          {alert.severity} PRIORITY
                        </div>
                      </div>

                      <div className="flex flex-col mb-5">
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Trigger Reason</span>
                        <span className="text-sm text-foreground bg-bg-alt px-3 py-2.5 rounded-md border border-border/50">
                          {alert.trigger_reason.replace(/_/g, " ")}
                        </span>
                      </div>

                      <div className="flex gap-3 mt-auto pt-4 border-t border-border/40">
                        <button 
                          onClick={() => handleMarkAsContacted(alert.id)}
                          className="flex-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer"
                        >
                          Mark as Contacted
                        </button>
                        {member?.phone && (
                          <a 
                            href={`https://wa.me/${member.phone.replace(/\D/g, "")}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="px-4 py-2.5 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition-colors flex items-center justify-center"
                          >
                            <Phone size={18} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "analysis.stats.totalSessions", val: events.length, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
              { key: "analysis.stats.totalMembers", val: totalItems, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
              { key: "analysis.stats.presentThisSession", val: Object.values(attendance[selectedEventId] ?? {}).filter(Boolean).length, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
              { key: "analysis.stats.needFollowup", val: followUpList.length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" }
            ].map((stat) => (
              <div key={stat.key} className="bg-bg-alt border border-border/60 rounded-lg p-4 flex items-center gap-4 text-left">
                <div className={`p-3 rounded-lg ${stat.bg}`}><stat.icon size={20} className={stat.color} /></div>
                <div><p className="text-2xl font-bold text-foreground leading-none">{stat.val}</p><p className="text-[10px] uppercase font-bold text-text-muted mt-1.5">{t(stat.key)}</p></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm flex flex-col">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center"><TrendingUp size={18} /> {t("analysis.perSession.title")}</div>
              <div className="p-5 space-y-4">
                {analysisData.eventStats.map(evt => {
                  const pct = analysisData.maxPresent > 0 ? (evt.presentTotal / analysisData.maxPresent) * 100 : 0;
                  return (
                    <div key={evt.id} className="space-y-1.5 text-left">
                      <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase"><span>{evt.name}</span><span>{evt.presentTotal} present</span></div>
                      <div className="h-1.5 bg-border/40 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-bg-alt border border-border rounded-lg shadow-sm">
              <div className="p-5 border-b border-border/60 font-bold text-primary flex items-center gap-2 justify-center"><Trophy size={18} /> {t("analysis.mostActive.title")}</div>
              <div className="divide-y divide-border/40">
                {analysisData.topActive.map((m: any, i: number) => (
                  <div key={m.id} className="flex items-center justify-between p-4 px-5 text-left">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${i < 3 ? "bg-yellow-500/20 text-yellow-600" : "bg-border/40 text-text-muted"}`}>{i + 1}</div>
                      <p className="text-sm font-bold text-foreground truncate max-w-37.5">{m.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-foreground">{Math.round(m.rate)}%</p>
                      <p className="text-[10px] text-text-muted">{m.count} sessions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="hidden"><QRCode id="qr-code-svg" value={`https://coma.church/${locale}/attend?event=${selectedEventId}`} size={512} level="H" /></div>

      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" onClick={() => setIsEventModalOpen(false)}>
          <div className="bg-background border border-border w-full max-w-md rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-border/50"><h3 className="font-bold text-lg text-foreground text-center w-full">{t("modal.title")}</h3><button onClick={() => setIsEventModalOpen(false)} className="absolute right-5 text-text-muted hover:text-red-500 transition-colors cursor-pointer"><X size={20} /></button></div>
            <form onSubmit={handleCreateEvent} className="p-6">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-2 text-center">{t("modal.label")}</label>
                <input type="text" required autoFocus value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder={t("modal.placeholder")} className="w-full p-3 bg-bg-alt border border-border rounded-lg focus:ring-2 focus:ring-primary/20 mb-6 text-sm text-center outline-none text-foreground" />
                <button type="submit" className="w-full bg-primary text-primary-foreground py-3.5 rounded-lg font-bold hover:opacity-90 flex items-center justify-center gap-2 cursor-pointer transition-all"><Plus size={18} /> {t("modal.submit")}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}