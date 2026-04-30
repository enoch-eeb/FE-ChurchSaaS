"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { 
  Search, ChevronLeft, ChevronRight, Gift, Copy, MessageCircle,
  ChevronDown, Loader2, ArrowUp, ArrowDown, ArrowUpDown, X, CheckCircle2
} from "lucide-react";

type Member = {
  memberId: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | "default";
};

export default function MemberBirthdayPage() {
  const t = useTranslations("MemberManagementsPage.birthday");
  const tCommon = useTranslations("Common");
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [greetingMember, setGreetingMember] = useState<Member | null>(null);
  const [greetingText, setGreetingText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

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
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, sortConfig, getToken]);

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

  const openGreetingModal = (member: Member) => {
    setGreetingMember(member);
    setIsCopied(false);
    setGreetingText(`Selamat Ulang Tahun, ${member.name}! 🎉\n\nSemoga panjang umur, sehat selalu, dan terus bertumbuh di dalam kasih Tuhan. Biarlah tahun yang baru ini membawa lebih banyak berkat dan sukacita bagi kamu dan keluarga.\n\nTuhan Yesus memberkati! 🙏`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(greetingText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendWA = () => {
    if (!greetingMember?.phone) return;
    const phone = greetingMember.phone.replace(/\D/g, "");
    const encodedText = encodeURIComponent(greetingText);
    window.open(`https://wa.me/${phone}?text=${encodedText}`, "_blank");
  };

  const tableHeaders = [
    { key: "no", label: t("table.no"), sortable: false },
    { key: "name", label: t("table.name"), sortable: true },
    { key: "email", label: t("table.email"), sortable: true },
    { key: "phone", label: t("table.phone"), sortable: true },
    { key: "dateOfBirth", label: t("table.dob"), sortable: true },
    { key: "gender", label: t("table.gender"), sortable: true },
    { key: "action", label: t("table.action"), sortable: false },
  ];

  return (
    <div className="p-4 md:p-6 max-w-400 mx-auto flex flex-col min-h-screen text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-left">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
          <p className="text-text-muted text-sm mt-1">{t("description")}</p>
        </div>
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
        </div>

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
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-border/50 rounded-lg w-full animate-pulse mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : members.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-text-muted">{t("no_data")}</td></tr>
              ) : (
                members.map((m, idx) => (
                  <tr key={m.memberId} className="hover:bg-background/40 transition-colors text-sm"> 
                    <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + idx + 1}</td>
                    <td className="py-4 px-4 text-foreground font-medium">{m.name}</td>
                    <td className="py-4 px-4 text-text-muted">{m.email || "-"}</td>
                    <td className="py-4 px-4 text-text-muted font-mono">{m.phone || "-"}</td>
                    <td className="py-4 px-4 text-foreground font-mono font-bold">{m.dateOfBirth || "-"}</td>
                    <td className="py-4 px-4 text-[11px] uppercase text-text-muted">
                      {m.gender === "MALE" ? "Male" : m.gender === "FEMALE" ? "Female" : "-"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center">
                        <button 
                          onClick={() => openGreetingModal(m)} 
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors cursor-pointer text-xs font-bold"
                        >
                          <Gift size={14} /> Generate
                        </button>
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

      {greetingMember && (
        <div onClick={() => setGreetingMember(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden cursor-default">
            <div className="flex justify-between items-center p-6 border-b border-border/60">
              <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Gift className="text-primary" size={24} /> {t("modal_title")}
              </h3>
              <button onClick={() => setGreetingMember(null)} className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"><X size={20} /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-text-muted mb-4">{t("modal_desc")} <strong className="text-foreground">{greetingMember.name}</strong>.</p>
              
              <textarea 
                rows={6}
                value={greetingText}
                onChange={(e) => setGreetingText(e.target.value)}
                className="w-full p-4 bg-bg-alt border border-border rounded-lg text-foreground text-sm focus:border-primary focus:outline-none resize-none mb-6"
              />

              <div className="flex gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-background border border-border text-foreground hover:bg-border/50 rounded-lg font-bold transition-colors cursor-pointer"
                >
                  {isCopied ? <CheckCircle2 size={18} className="text-green-500" /> : <Copy size={18} />}
                  {isCopied ? t("btn_copied") : t("btn_copy")}
                </button>
                <button 
                  onClick={handleSendWA}
                  disabled={!greetingMember.phone}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  <MessageCircle size={18} /> {t("btn_whatsapp")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}