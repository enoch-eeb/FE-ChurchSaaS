"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { 
  Search, MoreVertical, ChevronLeft, ChevronRight, Loader2, UserPlus 
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: string;
};

export default function MemberDirectoryPage() {
  const t = useTranslations("MemberManagementsPage.directory");
  
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

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
      url.searchParams.set("limit", "10");
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        const memberList = Array.isArray(data.data) ? data.data : (data.data.items ?? []);
        setMembers(memberList);
        setTotalPages(data.data.totalPages ?? 1);
        setTotalItems(data.data.totalItems ?? memberList.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, getToken]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {t("title")}
          </h1>
          <p className="text-text-muted mt-1">
            {t("description")}
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer">
          <UserPlus size={18} /> {t("btn_add")}
        </button>
      </div>

      <div className="bg-bg-alt border border-border/60 rounded-xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border/60 bg-background/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder={t("search_placeholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-sm transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-background/80 border-b border-border/60 text-sm text-text-muted">
                <th className="py-4 px-6 font-medium">{t("table.id")}</th>
                <th className="py-4 px-6 font-medium">{t("table.name")}</th>
                <th className="py-4 px-6 font-medium">{t("table.contact")}</th>
                <th className="py-4 px-6 font-medium">{t("table.status")}</th>
                <th className="py-4 px-6 font-medium text-right">{t("table.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    <Loader2 className="mx-auto animate-spin mb-2" /> {t("loading")}
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-text-muted">
                    {t("no_data")}
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-background/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="text-sm text-text-muted">{m.id}.</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-primary">{m.name}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-mono">{m.phone}</div>
                      <div className="text-xs text-text-muted">{m.email ?? "-"}</div>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-bold uppercase">
                        {t("status_active")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button className="p-2 text-text-muted hover:text-primary transition-colors cursor-pointer">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border/60 bg-background/50 flex justify-between items-center">
          <p className="text-sm text-text-muted italic">
            {t("total_member")}: <span className="font-bold text-primary">{totalItems}</span>
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
              className="p-2 border border-border rounded-lg hover:bg-border/50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
              className="p-2 border border-border rounded-lg hover:bg-border/50 disabled:opacity-50 cursor-pointer"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}