import React, { useState } from "react";
import { 
  History, 
  Search, 
  Trash2, 
  UserPlus, 
  UserMinus, 
  UserCog, 
  Briefcase, 
  Settings, 
  ShieldAlert, 
  Database,
  Filter,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Download
} from "lucide-react";
import { ActivityLog } from "../types";

interface ActivityLogsTabProps {
  logs: ActivityLog[];
  onClearLogs?: () => void;
  showToast?: (message: string, type?: "info" | "success") => void;
}

export default function ActivityLogsTab({ logs, onClearLogs, showToast }: ActivityLogsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | "siswa" | "perusahaan" | "sistem">("ALL");
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");

  // Helper to parse dynamic timestamp into a Date object
  const parseLogTimestampToDate = (timestampStr: string): Date | null => {
    if (!timestampStr) return null;
    
    // If it's ISO format
    if (timestampStr.includes("T") && timestampStr.endsWith("Z")) {
      const d = new Date(timestampStr);
      return isNaN(d.getTime()) ? null : d;
    }
    
    try {
      // Indonesian format: "13 Juni 2026, 10:35 WIB"
      const cleanStr = timestampStr.replace(" WIB", "").trim();
      const parts = cleanStr.split(",");
      if (parts.length < 1) return null;
      
      const datePart = parts[0].trim(); // "13 Juni 2026"
      const timePart = parts[1] ? parts[1].trim() : "00:00"; // "10:35"
      
      const dateTokens = datePart.split(" ");
      if (dateTokens.length < 3) return null;
      
      const day = parseInt(dateTokens[0], 10);
      const monthStr = dateTokens[1].toLowerCase();
      const year = parseInt(dateTokens[2], 10);
      
      const timeTokens = timePart.split(":");
      const hours = timeTokens[0] ? parseInt(timeTokens[0], 10) : 0;
      const minutes = timeTokens[1] ? parseInt(timeTokens[1], 10) : 0;
      
      const months: { [key: string]: number } = {
        januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
        juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
      };
      
      const month = months[monthStr] !== undefined ? months[monthStr] : 0;
      return new Date(year, month, day, hours, minutes);
    } catch (e) {
      const d = new Date(timestampStr);
      return isNaN(d.getTime()) ? null : d;
    }
  };

  // Get action icon
  const getActionIcon = (category: string, action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("hapus") || actionLower.includes("delete")) {
      return <UserMinus className="w-4 h-4 text-rose-450" />;
    }
    if (actionLower.includes("tambah siswa") || actionLower.includes("impor siswa")) {
      return <UserPlus className="w-4 h-4 text-emerald-400" />;
    }
    if (actionLower.includes("status") || actionLower.includes("penempatan") || actionLower.includes("ubah profil")) {
      return <UserCog className="w-4 h-4 text-sky-450" />;
    }
    if (category === "perusahaan") {
      return <Briefcase className="w-4 h-4 text-amber-450" />;
    }
    if (category === "sistem") {
      return <Settings className="w-4 h-4 text-indigo-400" />;
    }
    return <Database className="w-4 h-4 text-slate-400" />;
  };

  // Get row bg class based on action type
  const getActionRowBg = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes("hapus") || actionLower.includes("delete")) {
      return "border-l-2 border-l-rose-500 bg-rose-500/5";
    }
    if (actionLower.includes("tambah") || actionLower.includes("impor")) {
      return "border-l-2 border-l-emerald-500 bg-emerald-500/5";
    }
    if (actionLower.includes("ubah kuota")) {
      return "border-l-2 border-l-amber-500 bg-amber-500/5";
    }
    return "border-l-2 border-l-blue-500 bg-blue-500/5";
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesCategory = categoryFilter === "ALL" || log.category === categoryFilter;
    if (!matchesCategory) return false;

    // Filter by Date Range
    if (startDateStr || endDateStr) {
      const logDate = parseLogTimestampToDate(log.timestamp);
      if (logDate) {
        if (startDateStr) {
          const startComp = new Date(startDateStr);
          startComp.setHours(0, 0, 0, 0);
          if (logDate < startComp) return false;
        }
        if (endDateStr) {
          const endComp = new Date(endDateStr);
          endComp.setHours(23, 59, 59, 999);
          if (logDate > endComp) return false;
        }
      }
    }

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      log.user.toLowerCase().includes(term)
    );
  });

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      if (showToast) showToast("Tidak ada log untuk diekspor", "info");
      return;
    }

    // Convert to CSV string with BOM for correct character encoding
    const csvContent = "\uFEFF" + [
      ["ID Log", "Waktu (WIB)", "Operator", "Tindakan", "Detail Perubahan", "Kategori"].join(","),
      ...filteredLogs.map(log => [
        `"${log.id}"`,
        `"${log.timestamp}"`,
        `"${log.user}"`,
        `"${log.action}"`,
        `"${log.details.replace(/"/g, '""')}"`,
        `"${log.category.toUpperCase()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit_log_pkl_dkv_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    if (showToast) showToast("Berhasil mengunduh dokumen audit CSV!", "success");
  };

  const handleClearLogsClick = () => {
    if (!onClearLogs) return;
    if (window.confirm("Apakah Anda yakin ingin menghapus semua catatan log audit? Tindakan ini hanya disarankan oleh Administrator.")) {
      onClearLogs();
      if (showToast) showToast("Semua log audit berhasil dikosongkan.", "info");
    }
  };

  return (
    <div className="space-y-6" id="activity-logs-workspace">
      {/* Banner Header with Stats */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/40 shadow-2xl relative overflow-hidden" id="logs-header-panel">
        <div className="absolute top-0 right-0 w-80 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-12 w-64 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shadow-inner">
                <History className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-black block">Log Audit Keamanan</span>
                <h2 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">RIWAYAT AKTIVITAS SISTEM</h2>
              </div>
            </div>
            <p className="text-white/60 text-xs max-w-2xl leading-relaxed">
              Log aktivitas mencatat seluruh perubahan seketika (real-time) pada database sekolah—seperti penambahan/penghapusan siswa, perubahan status penempatan, serta penambahan kuota mitra perusahaan—demi kebutuhan audit administratif guru penanggung jawab.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl border border-white/10 hover:border-white/20 shadow flex items-center gap-2 transition cursor-pointer"
              title="Unduh log data audit ke format CSV Excel"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              Ekspor Laporan Audit
            </button>

            {onClearLogs && (
              <button
                onClick={handleClearLogsClick}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/20 flex items-center gap-2 transition cursor-pointer"
                title="Kosongkan log audit internal"
              >
                <Trash2 className="w-4 h-4" />
                Dekomisi Log
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-slate-900/25 p-5 rounded-2xl border border-white/5 font-sans space-y-4" id="logs-toolbar">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-grow sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari tindakan, nama siswa atau operator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-white/10 hover:border-white/15 focus:border-indigo-500/60 outline-none text-slate-100 rounded-xl placeholder-slate-500 transition text-xs font-semibold"
            />
          </div>

          {/* Categories Tab Selector */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/5 text-[11px] font-sans font-bold">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "ALL" 
                  ? "bg-indigo-650 text-white shadow" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Semua Log ({logs.length})
            </button>
            <button
              onClick={() => setCategoryFilter("siswa")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "siswa" 
                  ? "bg-indigo-650 text-white shadow" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Siswa & Penempatan ({logs.filter(l => l.category === "siswa").length})
            </button>
            <button
              onClick={() => setCategoryFilter("perusahaan")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "perusahaan" 
                  ? "bg-indigo-650 text-white shadow" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Mitra & Kuota ({logs.filter(l => l.category === "perusahaan").length})
            </button>
            <button
              onClick={() => setCategoryFilter("sistem")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "sistem" 
                  ? "bg-indigo-650 text-white shadow" 
                  : "text-white/60 hover:text-white"
              }`}
            >
              Sistem ({logs.filter(l => l.category === "sistem").length})
            </button>
          </div>
        </div>

        {/* Date Filters and Controls Row */}
        <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-white/50 font-bold">
            <Filter className="w-4 h-4 text-indigo-400" />
            <span>Saring Rentang Tanggal:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-950/60 px-2 py-1 rounded-lg border border-white/5">
              <span className="text-white/40 text-[10.5px] font-semibold">Dari</span>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 px-2 py-1 rounded-lg border border-white/5">
              <span className="text-white/40 text-[10.5px] font-semibold">Sampai</span>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs outline-none cursor-pointer [color-scheme:dark]"
              />
            </div>
          </div>

          {(searchTerm || categoryFilter !== "ALL" || startDateStr || endDateStr) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("ALL");
                setStartDateStr("");
                setEndDateStr("");
                if (showToast) showToast("Filter berhasil dibersihkan.", "info");
              }}
              className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline transition sm:ml-auto flex items-center gap-1 cursor-pointer bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 text-[11px]"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Main Logging Sheet / Timeline View */}
      <div className="glass-panel rounded-2xl border border-white/5 bg-slate-950/40 shadow-2xl overflow-hidden" id="logs-timeline-sheet">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/30">
          <span className="text-xs font-mono font-black text-white/70 select-none uppercase tracking-wider flex items-center gap-2">
            📁 Tampilan Hasil Log ({filteredLogs.length} Aktivitas Terfilter)
          </span>
          <span className="text-[10px] bg-indigo-505/25 text-indigo-300 font-mono font-semibold px-2 py-0.5 rounded border border-indigo-500/20 select-none">
            Audit Ready
          </span>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-3 font-sans" id="logs-empty-state">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6 text-slate-650" />
            </div>
            <div className="max-w-md mx-auto">
              <p className="text-sm font-bold text-slate-400">Tidak ada catatan log ditemukan</p>
              <p className="text-xs text-slate-500 mt-1">Gunakan kata kunci pencarian yang lebih umum atau ubah penyaringan kategori.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5 font-sans" id="logs-list-container">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className={`p-4 hover:bg-white/[0.01] transition-colors flex flex-col md:flex-row items-start justify-between gap-4 ${getActionRowBg(log.action)}`}
              >
                <div className="flex items-start gap-4 flex-grow min-w-0">
                  {/* Category Action Circle Badge */}
                  <div className="p-2.5 bg-[#121221] text-indigo-400 rounded-xl border border-white/10 shrink-0 shadow-sm mt-0.5">
                    {getActionIcon(log.category, log.action)}
                  </div>

                  <div className="space-y-1.5 flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white text-xs block font-display tracking-tight bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
                        {log.action}
                      </span>
                      <span className="text-[10px] bg-slate-900 text-slate-400 font-bold px-2 py-0.5 rounded-md border border-white/5 uppercase tracking-wider">
                        Kategori: {log.category}
                      </span>
                      <span className="text-[9px] font-mono text-[#a5b4fc] font-bold">
                        ID: {log.id}
                      </span>
                    </div>

                    <p className="text-white/80 text-xs leading-relaxed font-sans font-medium">
                      {log.details}
                    </p>

                    {/* Metadata line (Operator email & timestamp) */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-450 font-semibold font-mono">
                      <span className="text-indigo-300 font-semibold flex items-center gap-1 select-all">
                        👤 {log.user}
                      </span>
                      <span className="text-slate-500 select-none">
                        •
                      </span>
                      <span className="text-emerald-450">
                        🕒 {log.timestamp}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Audit Approval Status Mark */}
                <div className="shrink-0 self-center hidden sm:flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20 text-[10px] font-bold select-none">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  TERAUDIT
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
