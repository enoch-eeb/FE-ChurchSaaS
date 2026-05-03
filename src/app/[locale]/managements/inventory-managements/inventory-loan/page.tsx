"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  Search, ChevronLeft, ChevronRight, Plus,
  Eye, Edit2, Trash2,
  X, AlertTriangle,
  MapPin, Hash, ChevronDown,
  ArrowUp, ArrowDown, ArrowUpDown, Filter,
  Package, Clock, CheckCircle2, XCircle,
  RotateCcw, AlertCircle, HandCoins,
  User, CalendarDays, FileText, Tag,
} from "lucide-react";

/* ================= TYPES ================= */

type LoanStatus = "PENDING" | "APPROVED" | "BORROWED" | "RETURNED" | "REJECTED" | "OVERDUE";

type Loan = {
  id: string;
  borrowerName: string;
  borrowerDepartment: string;
  itemId: string;
  itemName: string;
  quantity: number;
  loanDate: string;
  returnDate: string;
  actualReturnDate?: string;
  status: LoanStatus;
  notes?: string;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc" | "default";
};

/* ================= CONSTANTS ================= */

const EMPTY_LOAN: Omit<Loan, "id"> = {
  borrowerName: "",
  borrowerDepartment: "",
  itemId: "",
  itemName: "",
  quantity: 1,
  loanDate: "",
  returnDate: "",
  actualReturnDate: "",
  status: "PENDING",
  notes: "",
};

const STATUS_CONFIG: Record<LoanStatus, {
  label: string;
  icon: React.ElementType;
  classes: string;
}> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    classes: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
  },
  APPROVED: {
    label: "Approved",
    icon: CheckCircle2,
    classes: "bg-blue-500/10 text-blue-600 border border-blue-500/20",
  },
  BORROWED: {
    label: "Borrowed",
    icon: HandCoins,
    classes: "bg-purple-500/10 text-purple-600 border border-purple-500/20",
  },
  RETURNED: {
    label: "Returned",
    icon: RotateCcw,
    classes: "bg-green-500/10 text-green-600 border border-green-500/20",
  },
  REJECTED: {
    label: "Rejected",
    icon: XCircle,
    classes: "bg-red-500/10 text-red-600 border border-red-500/20",
  },
  OVERDUE: {
    label: "Overdue",
    icon: AlertCircle,
    classes: "bg-orange-500/10 text-orange-600 border border-orange-500/20",
  },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as LoanStatus[];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
  });
};

/* ================= COMPONENT ================= */

export default function InventoryLoanPage() {
  const t = useTranslations("InventoryLoanPage");
  const tCommon = useTranslations("Common");

  /* ===== STATE ===== */
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: "", department: "" });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "", direction: "default" });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /* ===== MODAL ===== */
  const [viewItem, setViewItem] = useState<Loan | null>(null);
  const [editItem, setEditItem] = useState<Loan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ ...EMPTY_LOAN });

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
  const fetchLoans = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = new URL(`/api/v1/inventory/loans`, window.location.origin);
      url.searchParams.set("page", page.toString());
      url.searchParams.set("limit", limit.toString());
      if (debouncedSearch) url.searchParams.set("search", debouncedSearch);
      Object.entries(activeFilters).forEach(([key, val]) => { if (val) url.searchParams.set(key, val); });
      if (sortConfig.direction !== "default" && sortConfig.key) {
        url.searchParams.set("sortBy", sortConfig.key);
        url.searchParams.set("sortDir", sortConfig.direction);
      }

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok) {
        setLoans(data.data?.items ?? data.data ?? []);
        setTotalItems(data.data?.totalItems ?? data.data?.length ?? 0);
        setTotalPages(data.data?.totalPages ?? 1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, activeFilters, sortConfig, getToken]);

  useEffect(() => { fetchLoans(); }, [fetchLoans]);

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
    const reset = { status: "", department: "" };
    setFilters(reset);
    setActiveFilters(reset);
    setPage(1);
  };

  /* ===== CRUD ===== */
  const handleAdd = async () => {
    await fetch(`/api/v1/inventory/loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(newItem),
    });
    setIsAddOpen(false);
    setNewItem({ ...EMPTY_LOAN });
    fetchLoans();
  };

  const handleEdit = async () => {
    if (!editItem) return;
    await fetch(`/api/v1/inventory/loans/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(editItem),
    });
    setEditItem(null);
    fetchLoans();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/v1/inventory/loans/${deleteId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setDeleteId(null);
    fetchLoans();
  };

  /* ===== TABLE HEADERS ===== */
  const tableHeaders = [
    { key: "no", label: "No", sortable: false },
    { key: "borrowerName", label: t("table.borrower"), sortable: true },
    { key: "itemName", label: t("table.item"), sortable: true },
    { key: "quantity", label: t("table.quantity"), sortable: true },
    { key: "loanDate", label: t("table.loan_date"), sortable: true },
    { key: "returnDate", label: t("table.return_date"), sortable: true },
    { key: "status", label: t("table.status"), sortable: true },
    { key: "action", label: t("table.action"), sortable: false },
  ];

  /* ===== SHARED FORM ===== */
  const currentForm = editItem ?? newItem;
  const setCurrentForm = (val: Partial<Loan>) => {
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

      {/* STATUS SUMMARY CHIPS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const Icon = cfg.icon;
          const count = loans.filter(l => l.status === status).length;
          return (
            <button
              key={status}
              onClick={() => {
                const next = activeFilters.status === status ? "" : status;
                setFilters(f => ({ ...f, status: next }));
                setActiveFilters(f => ({ ...f, status: next }));
                setPage(1);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer border ${
                activeFilters.status === status
                  ? cfg.classes + " ring-2 ring-offset-1 ring-current"
                  : "bg-bg-alt border-border text-text-muted hover:border-current " + cfg.classes
              }`}
            >
              <Icon size={12} /> {cfg.label}
              <span className="ml-1 opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* ADD BUTTON */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all text-sm cursor-pointer"
        >
          <Plus size={18} /> {t("btn_add")}
        </button>
      </div>

      {/* ===== LIST TABLE ===== */}
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
              placeholder="Department"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="p-2 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground"
            />
            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full appearance-none p-2 pr-8 text-sm bg-background border border-border rounded-lg focus:border-primary outline-none text-foreground cursor-pointer"
              >
                <option value="">All Status</option>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
            </div>
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
          <table className="w-full text-center border-collapse min-w-[900px]">
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
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="py-4 px-4">
                        <div className="h-4 bg-border/50 rounded-lg w-20 mx-auto animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center text-text-muted text-sm">
                    No loan records found.
                  </td>
                </tr>
              ) : loans.map((item, i) => {
                const statusCfg = STATUS_CONFIG[item.status];
                const StatusIcon = statusCfg.icon;
                const isOverdue = item.status === "OVERDUE";
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-background/40 transition-colors text-sm ${isOverdue ? "bg-orange-500/5" : ""}`}
                  >
                    <td className="py-4 px-4 text-text-muted font-mono">{(page - 1) * limit + i + 1}</td>
                    <td className="py-4 px-4 text-left">
                      <p className="font-medium text-foreground">{item.borrowerName}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{item.borrowerDepartment}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-alt border border-border/60 rounded-md text-xs font-bold text-text-muted uppercase tracking-wide">
                        <Package size={11} /> {item.itemName}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-foreground font-mono font-bold">{item.quantity}</td>
                    <td className="py-4 px-4 text-text-muted text-xs font-mono">{formatDate(item.loanDate)}</td>
                    <td className="py-4 px-4 text-xs font-mono">
                      <span className={isOverdue ? "text-orange-500 font-bold" : "text-text-muted"}>
                        {formatDate(item.returnDate)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusCfg.classes}`}>
                        <StatusIcon size={12} /> {statusCfg.label}
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
                <HandCoins className="text-primary" size={20} /> Loan Detail
              </h3>
              <button onClick={() => setViewItem(null)} className="text-text-muted hover:text-red-500 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { icon: User, label: "Borrower", value: viewItem.borrowerName },
                { icon: Tag, label: "Department", value: viewItem.borrowerDepartment },
                { icon: Package, label: "Item", value: viewItem.itemName },
                { icon: Hash, label: "Quantity", value: viewItem.quantity.toString() },
                { icon: CalendarDays, label: "Loan Date", value: formatDate(viewItem.loanDate) },
                { icon: CalendarDays, label: "Return Date (Plan)", value: formatDate(viewItem.returnDate) },
                { icon: CalendarDays, label: "Actual Return", value: formatDate(viewItem.actualReturnDate) },
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

              {/* STATUS */}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                  <AlertCircle size={14} className="text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</p>
                  <span className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${STATUS_CONFIG[viewItem.status].classes}`}>
                    {viewItem.status}
                  </span>
                </div>
              </div>

              {/* NOTES */}
              {viewItem.notes && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg mt-0.5">
                    <FileText size={14} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Notes</p>
                    <p className="text-sm text-foreground mt-0.5">{viewItem.notes}</p>
                  </div>
                </div>
              )}
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
            className="bg-background border border-border w-full max-w-lg rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col"
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

            <div className="p-6 space-y-3 overflow-y-auto flex-1">
              {/* BORROWER NAME + DEPARTMENT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Borrower Name</label>
                  <input
                    placeholder="e.g. John Doe"
                    value={currentForm.borrowerName}
                    onChange={(e) => setCurrentForm({ borrowerName: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Department</label>
                  <input
                    placeholder="e.g. IT"
                    value={currentForm.borrowerDepartment}
                    onChange={(e) => setCurrentForm({ borrowerDepartment: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* ITEM NAME + QUANTITY */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Item Name</label>
                  <input
                    placeholder="e.g. Projector"
                    value={currentForm.itemName}
                    onChange={(e) => setCurrentForm({ itemName: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={currentForm.quantity}
                    onChange={(e) => setCurrentForm({ quantity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* LOAN DATE + RETURN DATE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Loan Date</label>
                  <input
                    type="date"
                    value={currentForm.loanDate}
                    onChange={(e) => setCurrentForm({ loanDate: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Return Date (Plan)</label>
                  <input
                    type="date"
                    value={currentForm.returnDate}
                    onChange={(e) => setCurrentForm({ returnDate: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* ACTUAL RETURN DATE (only edit mode) */}
              {editItem && (
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Actual Return Date</label>
                  <input
                    type="date"
                    value={currentForm.actualReturnDate ?? ""}
                    onChange={(e) => setCurrentForm({ actualReturnDate: e.target.value })}
                    className="w-full p-2.5 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  />
                </div>
              )}

              {/* STATUS */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Status</label>
                <div className="relative">
                  <select
                    value={currentForm.status}
                    onChange={(e) => setCurrentForm({ status: e.target.value as LoanStatus })}
                    className="w-full appearance-none p-2.5 pr-10 bg-bg-alt border border-border rounded-lg text-sm text-foreground focus:border-primary focus:outline-none cursor-pointer"
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
                </div>
              </div>

              {/* NOTES */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-1.5">Notes</label>
                <textarea
                  placeholder="Optional notes..."
                  value={currentForm.notes ?? ""}
                  onChange={(e) => setCurrentForm({ notes: e.target.value })}
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