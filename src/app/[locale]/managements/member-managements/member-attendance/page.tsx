"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Search, CheckCircle2, Circle, Download, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, AlertCircle, Plus, FileSpreadsheet, AlertTriangle, X,
  BarChart2, UserCheck, Phone, Trophy, TrendingUp, Users, RefreshCw,
} from "lucide-react";
import QRCode from "react-qr-code";

type Member = { id: string; name: string; phone: string };
type EventSession = { id: string; name: string; date: string };
type AttendanceRecord = Record<string, Record<string, boolean>>;
type ActiveTab = "attendance" | "followup" | "analysis";

export default function AttendancePage() {
  const t = useTranslations("MemberManagementsPage.AttendancePage");
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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState("");

  const getToken = useCallback(
    () =>
      document.cookie
        .split("; ")
        .find((row) => row.startsWith("coma_token="))
        ?.split("=")[1] ?? localStorage.getItem("token") ?? "",
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (res.ok && data.data) setEvents(data.data);
    } catch (err) {
      console.error(err);
    }
  }, [getToken]);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members`);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", "10");
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        const list: Member[] = Array.isArray(data.data)
          ? data.data
          : (data.data.items ?? []);
        setMembers(list);
        setTotalPages(data.data.totalPages ?? data.totalPages ?? 1);
        setTotalItems(data.data.totalItems ?? data.total ?? list.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, getToken]);

  useEffect(() => {
    fetchEvents();
    fetchMembers();
  }, [fetchEvents, fetchMembers]);

  const fetchAllMembers = useCallback(async () => {
    if (allMembersLoaded) return;
    setIsLoadingAll(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members`);
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", "9999");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        const list: Member[] = Array.isArray(data.data)
          ? data.data
          : (data.data.items ?? []);
        setAllMembers(list);
        setAllMembersLoaded(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAll(false);
    }
  }, [allMembersLoaded, getToken]);

  useEffect(() => {
    if (activeTab === "followup" || activeTab === "analysis") {
      fetchAllMembers();
    }
  }, [activeTab, fetchAllMembers]);

  const toggleAttendance = async (memberId: string) => {
    if (!selectedEventId) return;
    const current = attendance[selectedEventId]?.[memberId] ?? false;
    setIsToggling(memberId);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          eventId: selectedEventId,
          memberId,
          present: !current,
        }),
      });
      setAttendance((prev) => ({
        ...prev,
        [selectedEventId]: {
          ...prev[selectedEventId],
          [memberId]: !current,
        },
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsToggling(null);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/events`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${getToken()}`
            },
            body: JSON.stringify({ name: newEventName.trim() })
        });
        const data = await res.json();
        if (res.ok) {
            setEvents(prev => [data.data, ...prev]);
            setSelectedEventId(data.data.id);
            setIsEventModalOpen(false);
            setNewEventName("");
        }
    } catch (err) {
        console.error(err);
    }
  };

  const exportToCSV = () => {
    if (!selectedEventId || members.length === 0) return;
    const event = events.find((e) => e.id === selectedEventId);
    const eventName = event?.name ?? selectedEventId;
    const eventDate = event?.date ?? "";

    const rows = [
      [
        t("csv.eventName"),
        t("csv.date"),
        t("csv.memberId"),
        t("csv.fullName"),
        t("csv.phone"),
        t("csv.status"),
      ],
      ...members.map((m) => [
        eventName,
        eventDate,
        m.id,
        m.name,
        m.phone,
        attendance[selectedEventId]?.[m.id] ? t("csv.present") : t("csv.absent"),
      ]),
    ];

    const csv =
      "data:text/csv;charset=utf-8," +
      rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `Attendance_${eventName.replace(/\s+/g, "_")}_${eventDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadQR = () => {
    const svgElement = document.getElementById("qr-code-svg");
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
      }
      const link = document.createElement("a");
      link.download = `QR-Attendance-${selectedEventId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const currentEventAttendance = attendance[selectedEventId] ?? {};
  const presentCount = Object.values(currentEventAttendance).filter(Boolean).length;

  const followUpList = useMemo(() => {
    if (events.length === 0 || allMembers.length === 0) return [];
    return allMembers
      .map((m) => {
        const absenceCount = events.filter(
          (evt) => !(attendance[evt.id]?.[m.id] ?? false)
        ).length;
        return { ...m, absenceCount };
      })
      .filter((m) => m.absenceCount >= 3)
      .sort((a, b) => b.absenceCount - a.absenceCount);
  }, [allMembers, events, attendance]);

  const analysisData = useMemo(() => {
    const eventStats = events.map((evt) => {
      const evtAttendance = attendance[evt.id] ?? {};
      const presentTotal = Object.values(evtAttendance).filter(Boolean).length;
      return { ...evt, presentTotal };
    });

    const maxPresent = Math.max(1, ...eventStats.map((e) => e.presentTotal));

    const memberStats = allMembers.map((m) => {
      const count = events.filter(
        (evt) => attendance[evt.id]?.[m.id] ?? false
      ).length;
      const rate = events.length > 0 ? (count / events.length) * 100 : 0;
      return { ...m, presentCount: count, rate };
    });

    const topActive = [...memberStats]
      .sort((a, b) => b.presentCount - a.presentCount)
      .slice(0, 10);

    return { eventStats, maxPresent, topActive };
  }, [events, attendance, allMembers]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {t("title")}
          </h1>
          <p className="text-text-muted mt-1">{t("description")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1 sm:flex-none">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-alt border border-border rounded-lg focus:outline-none focus:border-primary appearance-none font-medium cursor-pointer"
            >
              <option value="" disabled>{t("selectPlaceholder")}</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>{evt.name}</option>
              ))}
            </select>
          </div>

          <button onClick={() => setIsEventModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-background border border-border text-primary rounded-lg font-bold hover:bg-border/40 transition-colors cursor-pointer">
            <Plus size={18} /> {t("createSession")}
          </button>

          <button onClick={downloadQR} disabled={!selectedEventId} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer">
            <Download size={18} /> {t("qrCode")}
          </button>
        </div>
      </div>

      {!selectedEventId && (
        <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{t("noEventWarning")}</p>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-bg-alt border border-border/60 rounded-lg mb-6 w-fit">
        {[
          { key: "attendance", labelKey: "tabs.attendance", icon: UserCheck },
          { key: "followup", labelKey: "tabs.followup", icon: AlertTriangle },
          { key: "analysis", labelKey: "tabs.analysis", icon: BarChart2 }
        ].map(({ key, labelKey, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key as ActiveTab)} className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${activeTab === key ? "bg-primary text-primary-foreground shadow-sm" : "text-text-muted hover:text-primary"}`}>
            <Icon size={15} /> {t(labelKey)}
          </button>
        ))}
      </div>

      {activeTab === "attendance" && (
        <div className="bg-bg-alt border border-border/60 rounded-lg shadow-sm flex flex-col">
          <div className="p-4 border-b border-border/60 bg-background/50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input type="text" placeholder={t("attendance.searchPlaceholder")} value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-colors" />
              </div>
              {selectedEventId && <p className="text-sm text-text-muted shrink-0"><span className="font-bold text-green-500">{presentCount}</span> {t("attendance.present")}</p>}
            </div>
            <button onClick={exportToCSV} disabled={!selectedEventId || members.length === 0} className="flex items-center justify-center gap-2 px-3 py-2 bg-background border border-border text-text-muted hover:text-primary rounded-lg text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer">
              <FileSpreadsheet size={16} /> {t("attendance.exportCsv")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-150">
              <thead>
                <tr className="bg-background/80 border-b border-border/60 text-sm text-text-muted">
                  <th className="py-4 px-6 font-medium w-16">{t("attendance.table.no")}</th>
                  <th className="py-4 px-6 font-medium">{t("attendance.table.name")}</th>
                  <th className="py-4 px-6 font-medium">{t("attendance.table.phone")}</th>
                  <th className="py-4 px-6 font-medium text-right">{t("attendance.table.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {isLoading ? (
                  <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-primary mb-2" size={32} /><p className="text-text-muted text-sm">{t("attendance.loading")}</p></td></tr>
                ) : members.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-text-muted text-sm">{debouncedSearch ? t("attendance.emptySearch", { query: debouncedSearch }) : t("attendance.empty")}</td></tr>
                ) : (
                  members.map((member, index) => {
                    const isPresent = currentEventAttendance[member.id] ?? false;
                    return (
                      <tr key={member.id} className="hover:bg-background/40 transition-colors">
                        <td className="py-4 px-6 text-sm text-text-muted">{(page - 1) * 10 + index + 1}</td>
                        <td className="py-4 px-6 text-sm font-bold text-primary">{member.name}</td>
                        <td className="py-4 px-6 text-sm text-text-muted font-mono">{member.phone || "-"}</td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => toggleAttendance(member.id)} disabled={isToggling === member.id || !selectedEventId} className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${isPresent ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-background border border-border text-text-muted hover:bg-border/50"} disabled:opacity-50`}>
                            {isToggling === member.id ? <Loader2 size={14} className="animate-spin" /> : isPresent ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                            {isPresent ? t("attendance.alreadyPresent") : t("attendance.markPresent")}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-border/60 bg-background/50 flex justify-between items-center gap-4">
             <p className="text-sm text-text-muted">Halaman <span className="font-bold text-primary">{page}</span> dari {totalPages} ({totalItems} jemaat)</p>
             <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading} className="p-2 border border-border rounded-lg hover:bg-border/50 disabled:opacity-50 cursor-pointer"><ChevronLeft size={18} /></button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading} className="p-2 border border-border rounded-lg hover:bg-border/50 disabled:opacity-50 cursor-pointer"><ChevronRight size={18} /></button>
             </div>
          </div>
        </div>
      )}

      {activeTab === "followup" && (
        <div className="bg-bg-alt border border-border/60 rounded-lg shadow-sm">
          <div className="p-5 border-b border-border/60 flex items-center justify-between">
            <div><h2 className="font-bold text-primary text-lg">{t("followup.title")}</h2><p className="text-text-muted text-sm mt-0.5">{t("followup.description")}</p></div>
          </div>
          {isLoadingAll ? (
            <div className="py-16 text-center"><Loader2 className="mx-auto animate-spin text-primary mb-2" size={32} /></div>
          ) : events.length < 3 ? (
            <div className="py-24 pb-32 text-center flex flex-col items-center">
              <AlertTriangle className="mb-4 text-yellow-500" size={48} />
              <h3 className="text-xl font-bold text-primary">{t("followup.notEnoughData")}</h3>
              <p className="text-text-muted text-sm mt-2">{t("followup.notEnoughDataDesc")}</p>
            </div>
          ) : followUpList.length === 0 ? (
            <div className="py-24 pb-32 text-center flex flex-col items-center"><CheckCircle2 className="mb-4 text-green-500" size={48} /><p className="font-bold text-primary text-xl">{t("followup.allActive")}</p></div>
          ) : (
            <div className="divide-y divide-border/40">
              {followUpList.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-5 hover:bg-background/40 transition-colors">
                  <div><p className="font-bold text-primary">{m.name}</p><p className="text-sm text-text-muted font-mono">{m.phone || "-"}</p></div>
                  <div className="flex items-center gap-4 text-right">
                    <div><p className="text-xs text-text-muted">{t("followup.absences")}</p><p className={`font-bold text-lg leading-none ${m.absenceCount >= 5 ? "text-red-500" : "text-orange-500"}`}>{m.absenceCount}x</p></div>
                    {m.phone && <a href={`https://wa.me/${m.phone.replace(/\D/g, "")}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 border border-green-500/20 rounded-lg text-sm font-bold hover:bg-green-500/20 transition-colors"><Phone size={14} /> WhatsApp</a>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "analysis" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { labelKey: "analysis.stats.totalSessions", value: events.length, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
              { labelKey: "analysis.stats.totalMembers", value: totalItems, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
              { labelKey: "analysis.stats.presentThisSession", value: presentCount, icon: UserCheck, color: "text-green-500", bg: "bg-green-500/10" },
              { labelKey: "analysis.stats.needFollowup", value: followUpList.length, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" }
            ].map(({ labelKey, value, icon: Icon, color, bg }) => (
              <div key={labelKey} className="bg-bg-alt border border-border/60 rounded-lg p-5 flex items-center gap-4">
                <div className={`p-3 rounded-lg ${bg}`}><Icon size={20} className={color} /></div>
                <div><p className="text-2xl font-bold text-primary">{value}</p><p className="text-xs text-text-muted mt-0.5">{t(labelKey)}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-bg-alt border border-border/60 rounded-lg shadow-sm">
            <div className="p-5 border-b border-border/60"><h2 className="font-bold text-primary text-lg flex items-center gap-2"><TrendingUp size={18} /> {t("analysis.perSession.title")}</h2></div>
            <div className="p-5 pb-12 space-y-4">
              {events.length === 0 ? <p className="text-center text-text-muted py-8 text-sm">{t("analysis.perSession.empty")}</p> : analysisData.eventStats.map((evt) => {
                  const pct = analysisData.maxPresent > 0 ? (evt.presentTotal / analysisData.maxPresent) * 100 : 0;
                  return (
                    <div key={evt.id}>
                      <div className="flex justify-between text-sm mb-1.5"><span className="font-semibold text-primary">{evt.name}</span><span className="text-text-muted">{evt.presentTotal} {t("analysis.perSession.present")}</span></div>
                      <div className="h-2.5 bg-border/50 rounded-full overflow-hidden"><div className="h-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
            </div>
          </div>
          <div className="bg-bg-alt border border-border/60 rounded-lg shadow-sm">
            <div className="p-5 border-b border-border/60"><h2 className="font-bold text-primary text-lg flex items-center gap-2"><Trophy size={18} /> {t("analysis.mostActive.title")}</h2></div>
            <div className="divide-y divide-border/40">
                {analysisData.topActive.map((member, index) => (
                    <div key={member.id} className="flex items-center gap-4 px-5 py-4 hover:bg-background/40 transition-colors">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${index < 3 ? "bg-yellow-400/20 text-yellow-500" : "bg-border/40 text-text-muted"}`}>{index + 1}</div>
                        <div className="flex-1 min-w-0"><p className="font-bold text-primary text-sm truncate">{member.name}</p></div>
                        <div className="text-right shrink-0"><p className="font-bold text-primary">{member.presentCount}<span className="text-text-muted font-normal text-xs">{t("analysis.mostActive.sessions", { total: events.length })}</span></p><p className="text-xs text-text-muted">{t("analysis.mostActive.rate", { rate: Math.round(member.rate) })}</p></div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="hidden">
        <QRCode id="qr-code-svg" value={`https://coma.church/${locale}/attend?event=${selectedEventId}`} size={512} level="H" />
      </div>

      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-bg-alt border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-border/50"><h3 className="font-bold text-lg text-primary">{t("modal.title")}</h3><button onClick={() => setIsEventModalOpen(false)} className="text-text-muted hover:text-red-500 transition-colors"><X size={20} /></button></div>
            <form onSubmit={handleCreateEvent} className="p-5">
                <label className="block text-sm font-medium mb-2 text-primary">{t("modal.label")}</label>
                <input type="text" required autoFocus value={newEventName} onChange={(e) => setNewEventName(e.target.value)} placeholder={t("modal.placeholder")} className="w-full p-3 bg-background border border-border rounded-lg focus:outline-none focus:border-primary mb-6" />
                <button type="submit" className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity">{t("modal.submit")}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}