import React, { useState } from "react";
import { Student, Company, LogbookEntry } from "../types";
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  Info, 
  ExternalLink, 
  ArrowRight, 
  Settings, 
  BookOpen, 
  FileCode, 
  Terminal, 
  CheckSquare, 
  Image,
  FolderOpen,
  AlertTriangle,
  MessageSquare,
  Mail,
  Bell,
  Target,
  Sliders,
  Search,
  Award
} from "lucide-react";

interface DashboardTabProps {
  students: Student[];
  companies: Company[];
  logbooks: LogbookEntry[];
  onTabChange: (tab: string) => void;
}

export default function DashboardTab({ students, companies, logbooks, onTabChange }: DashboardTabProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // KPI Target states with localStorage persistence
  const [weeklyTarget, setWeeklyTarget] = useState<number>(() => {
    const saved = localStorage.getItem("pkl_kpi_weekly_target");
    return saved ? parseInt(saved, 10) : 5;
  });

  const [totalWeeksTarget, setTotalWeeksTarget] = useState<number>(() => {
    const saved = localStorage.getItem("pkl_kpi_total_weeks");
    return saved ? parseInt(saved, 10) : 12;
  });

  const [kpiSearchTerm, setKpiSearchTerm] = useState("");
  const [kpiStatusFilter, setKpiStatusFilter] = useState<"ALL" | "Ongoing" | "Completed" | "Unassigned">("ALL");

  // Save changes to localStorage
  const handleWeeklyTargetChange = (val: number) => {
    setWeeklyTarget(val);
    localStorage.setItem("pkl_kpi_weekly_target", val.toString());
  };

  const handleTotalWeeksTargetChange = (val: number) => {
    setTotalWeeksTarget(val);
    localStorage.setItem("pkl_kpi_total_weeks", val.toString());
  };

  const getStudentKpiData = (student: Student) => {
    const studentLogs = logbooks.filter(l => l.studentId === student.id);
    const actualLogsCount = studentLogs.length;

    // Calculate weeks elapsed since start date to reference date
    let weeksElapsed = 1;
    if (student.pklStartDate) {
      const start = new Date(student.pklStartDate);
      if (!isNaN(start.getTime())) {
        const diffTime = referenceDate.getTime() - start.getTime();
        const diffDays = Math.max(1, Math.floor(diffTime / (1005 * 60 * 60 * 24))); // robust safety margin of 1005 ms/sec
        weeksElapsed = Math.max(1, Math.ceil(diffDays / 7));
      }
    }

    // Target logbooks so far based on weeks elapsed (clamped to total weeks)
    const effectiveWeeks = Math.min(weeksElapsed, totalWeeksTarget);
    const cumulativeTarget = effectiveWeeks * weeklyTarget;
    const overallFinalTarget = totalWeeksTarget * weeklyTarget;

    // Rata-rata log per minggu riil
    const averageWeeklyLogs = parseFloat((actualLogsCount / effectiveWeeks).toFixed(1));

    // Progress percentage against cumulative target so far (capped at 100)
    const cumulativeProgress = cumulativeTarget > 0 
      ? Math.round(Math.min(100, (actualLogsCount / cumulativeTarget) * 100))
      : 0;

    // Progress percentage against absolute total target
    const totalProgress = overallFinalTarget > 0
      ? Math.round(Math.min(100, (actualLogsCount / overallFinalTarget) * 100))
      : 0;

    return {
      actualLogsCount,
      weeksElapsed,
      effectiveWeeks,
      cumulativeTarget,
      overallFinalTarget,
      averageWeeklyLogs,
      cumulativeProgress,
      totalProgress,
    };
  };

  const totalStudents = students.length;
  const unassigned = students.filter(s => s.status === 'Unassigned').length;
  const pending = students.filter(s => s.status === 'Pending').length;
  const ongoing = students.filter(s => s.status === 'Ongoing').length;
  const completed = students.filter(s => s.status === 'Completed').length;

  // Compute stats of DKV specialization categories
  const skillCount: Record<string, number> = {};
  students.forEach(s => {
    s.skills.forEach(skill => {
      skillCount[skill] = (skillCount[skill] || 0) + 1;
    });
  });

  // Calculate reference date representing "today" (dynamic mock-aware)
  const getReferenceDate = () => {
    let refDate = new Date(); // fallback to current date
    // Find the latest date among all logbooks
    logbooks.forEach(log => {
      const logDate = new Date(log.date);
      if (!isNaN(logDate.getTime()) && logDate > refDate) {
        refDate = logDate;
      }
    });
    return refDate;
  };
  const referenceDate = getReferenceDate();

  // Find active students (Ongoing) whose logbooks have no updates for > 5 days
  const inactiveOngoingStudents = students
    .filter(s => s.status === 'Ongoing')
    .map(student => {
      const studentLogs = logbooks.filter(l => l.studentId === student.id);
      const company = companies.find(c => c.id === student.companyId);
      
      if (studentLogs.length === 0) {
        let daysSinceStart = 6; // default warning of > 5 days if never log
        if (student.pklStartDate) {
          const startDate = new Date(student.pklStartDate);
          if (!isNaN(startDate.getTime())) {
            const diffMs = referenceDate.getTime() - startDate.getTime();
            daysSinceStart = Math.max(1, Math.floor(diffMs / (1000 * 65 * 60 * 24)));
          }
        }
        return {
          student,
          companyName: company ? company.name : "Industri Mandiri",
          latestLog: null,
          daysSinceUpdate: daysSinceStart,
          lastDateStr: "Belum Pernah"
        };
      }
      
      const sortedLogs = [...studentLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestLog = sortedLogs[0];
      const lastLogDate = new Date(latestLog.date);
      
      const diffMs = referenceDate.getTime() - lastLogDate.getTime();
      const daysSinceUpdate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      
      return {
        student,
        companyName: company ? company.name : "Industri Mandiri",
        latestLog,
        daysSinceUpdate,
        lastDateStr: latestLog.date
      };
    })
    .filter(item => item.daysSinceUpdate > 5)
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  const toggleStep = (step: number) => {
    setCompletedSteps(prev => ({ ...prev, [step]: !prev[step] }));
  };

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Welcome & Motivational Card */}
      <div className="bg-gradient-to-r from-purple-900/20 via-indigo-950/30 to-blue-950/20 backdrop-blur-2xl text-white rounded-2xl p-6 shadow-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-y-1/4 translate-x-1/8">
          <BookOpen className="w-96 h-96" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <span className="bg-blue-500/15 text-blue-300 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-blue-500/25">
            PANEL KAJUR DKV ADMINISTRATOR PKL v1.0
          </span>
          <h2 className="text-3xl font-extrabold font-display mt-3 leading-tight text-white tracking-tight">
            Selamat Datang di Kajur DKV SMKN 14 KABUPATEN TANGERANG
          </h2>
          <p className="text-white/75 text-sm mt-3 leading-relaxed">
            Sistem terintegrasi ini merevolusi proses administrasi PKL dari <strong>3 hari manual menjadi 10 menit otomatis</strong>. 
            Kelola data siswa, generate dokumen PDF resmi secara instan, buat draft email HRD otomatis dengan dukungan kecerdasan buatan, 
            dan generate script Google Sheets Autocrat.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <button 
              onClick={() => onTabChange("siswa")}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4 text-white" />
              Kelola Database Siswa
            </button>
            <button 
              onClick={() => onTabChange("surat")}
              className="bg-white/5 border border-white/12 hover:bg-white/10 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-blue-400" />
              Cetak Dokumen PKL
            </button>
            <button 
              onClick={() => onTabChange("script")}
              className="bg-white/5 border border-white/12 hover:bg-white/10 text-white/80 font-semibold text-xs px-4 py-2.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-purple-405" />
              Ambil Code.gs
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Siswa */}
        <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-4 border border-white/10">
          <div className="bg-blue-500/10 p-3 rounded-lg text-blue-405 border border-blue-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">Total Siswa</p>
            <p className="text-2xl font-bold text-white">{totalStudents}</p>
          </div>
        </div>

        {/* Belum PKL */}
        <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-4 border border-white/10">
          <div className="bg-rose-550/10 p-3 rounded-lg text-rose-400 border border-rose-500/20">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">Belum PKL</p>
            <p className="text-2xl font-bold text-white">{unassigned}</p>
          </div>
        </div>

        {/* Proses Melamar */}
        <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-4 border border-white/10">
          <div className="bg-amber-500/10 p-3 rounded-lg text-amber-350 border border-amber-500/20">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">Menunggu HRD</p>
            <p className="text-2xl font-bold text-white">{pending}</p>
          </div>
        </div>

        {/* Sedang PKL */}
        <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-4 border border-white/10">
          <div className="bg-cyan-500/10 p-3 rounded-lg text-cyan-400 border border-cyan-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">Sedang PKL</p>
            <p className="text-2xl font-bold text-white">{ongoing}</p>
          </div>
        </div>

        {/* Selesai PKL */}
        <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all flex items-center gap-4 col-span-2 md:col-span-1 border border-white/10">
          <div className="bg-emerald-500/10 p-3 rounded-lg text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/40 text-[11px] uppercase tracking-wider font-semibold">Selesai PKL</p>
            <p className="text-2xl font-bold text-white">{completed}</p>
          </div>
        </div>
      </div>

      {/* Subtle Logbook Alert Notification System */}
      <div 
        className={`rounded-2xl p-5 border transition-all ${
          inactiveOngoingStudents.length > 0 
            ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/15" 
            : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/15"
        }`}
        id="logbook-alert-panel"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${
              inactiveOngoingStudents.length > 0 
                ? "bg-rose-500/10 text-rose-400" 
                : "bg-emerald-500/10 text-emerald-400"
            }`}>
              <Bell className={`w-4 h-4 ${inactiveOngoingStudents.length > 0 ? "animate-bounce" : ""}`} />
            </div>
            <div>
              <h3 className="font-display font-medium text-sm text-white flex items-center gap-2">
                Sistem Pemantauan Keaktifan Logbook
                {inactiveOngoingStudents.length > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {inactiveOngoingStudents.length} Siswa Terlambat
                  </span>
                )}
              </h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Mengevaluasi laporan pendaftaran aktivitas harian siswa PKL (Batas toleransi kenyamanan: 5 hari).
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono text-white/30 uppercase">
            Tanggal Survei: {referenceDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {inactiveOngoingStudents.length === 0 ? (
          <div className="flex items-center gap-3 pt-3 text-xs text-emerald-300 font-sans">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="font-bold">Semua Siswa Tertib Mengisi Laporan</p>
              <p className="text-white/40 text-[11px] leading-relaxed">Seluruh siswa dengan status sedang PKL (Ongoing) telah memperbaharui logbook dalam 5 hari terakhir.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {inactiveOngoingStudents.map(({ student, companyName, daysSinceUpdate, lastDateStr }) => {
              const waPhone = student.phone.startsWith("0") ? "62" + student.phone.slice(1) : student.phone;
              const waText = `Halo ${student.name}, saya Ibu Surti Wijaya selaku Kajur DKV ingin mengingatkan bahwa logbook laporan PKL harian kamu sudah ${daysSinceUpdate} hari belum diisi. Mohon segera dilengkapi ya. Terima kasih!`;
              const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
              
              const mailSubject = `SMK Negeri 14 Tangerang - Peringatan Pengisian Logbook PKL`;
              const mailBody = `Yth. ${student.name},\n\nBerdasarkan hasil pantauan sistem DKV SMKN 14 Kabupaten Tangerang, Anda tercatat belum memperbaharui logbook aktivitas harian PKL selama ${daysSinceUpdate} hari terakhir.\n\nTerakhir update: ${lastDateStr}\n\nMohon untuk segera melengkapi draf logbook harian Anda pada sistem agar pembimbing industri & Kajur dapat melakukan validasi tepat waktu.\n\nSalam hangat,\nSurti wijaya, S.Kom., Gr.\nKepala Program Studi DKV`;
              const mailUrl = `mailto:${student.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

              const isVeryLate = daysSinceUpdate >= 8;

              return (
                <div 
                  key={student.id} 
                  className="bg-white/5 border border-white/10 hover:border-white/15 p-4 rounded-xl flex items-start gap-3 transition-all relative overflow-hidden group"
                >
                  {/* Absolute subtle background warning text for retro layout feel */}
                  <div className="absolute right-2 -bottom-2 text-[48px] font-extrabold font-mono text-white/[0.02] select-none pointer-events-none">
                    ALERT
                  </div>

                  {/* Initial Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                    isVeryLate 
                      ? "bg-rose-500/20 border border-rose-500/30 text-rose-400" 
                      : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                  }`}>
                    {student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>

                  {/* Main Details */}
                  <div className="space-y-2 flex-grow min-w-0">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-white truncate">{student.name}</h4>
                        <span className={`text-[10px] font-extrabold font-sans flex-shrink-0 px-2 py-0.5 rounded-full ${
                          isVeryLate 
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/25" 
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                        }`}>
                          {daysSinceUpdate} hari terlambat
                        </span>
                      </div>
                      <p className="text-[10px] text-white/50 truncate">Kelas: {student.className} • {companyName}</p>
                      <p className="text-[9.5px] text-white/40 font-mono mt-0.5">Terakhir Update: <strong className="text-white/60">{lastDateStr}</strong></p>
                    </div>

                    {/* Quick Follow-up Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <a 
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white font-extrabold text-[10px] px-2.5 py-1.5 border border-emerald-500/20 rounded-md transition flex items-center gap-1 cursor-pointer w-full justify-center"
                        title="Hubungi Siswa via WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Kirim WhatsApp</span>
                      </a>
                      <a 
                        href={mailUrl}
                        className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white font-extrabold text-[10px] px-2.5 py-1.5 border border-blue-500/20 rounded-md transition flex items-center gap-1 cursor-pointer w-full justify-center"
                        title="Hubungi Siswa via Email"
                      >
                        <Mail className="w-3 h-3" />
                        <span>Kirim Email</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Target KPI & Progress Bar Visual System */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden" id="dashboard-kpi-panel">
        <div className="absolute top-0 right-0 w-96 h-32 bg-indigo-500/[0.02] blur-[80px] pointer-events-none rounded-full" />
        
        {/* Header and KPI Inputs */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="space-y-1">
            <h3 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-400" />
              Sistem Sasaran & Pengukuran KPI Logbook Siswa
            </h3>
            <p className="text-white/50 text-[11px] leading-relaxed">
              Atur target keaktifan pengisian logbook untuk mengukur tingkat dedikasi, kedisiplinan, dan konsistensi siswa DKV di industri secara real-time.
            </p>
          </div>

          {/* Interactive KPI Inputs */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-3 flex flex-col justify-center min-w-[150px] flex-1 sm:flex-initial">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-indigo-400" />
                Target per Minggu
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={weeklyTarget}
                  onChange={(e) => handleWeeklyTargetChange(parseInt(e.target.value, 10))}
                  className="w-20 accent-indigo-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
                <span className="text-sm font-black text-white">{weeklyTarget} <span className="text-[10px] text-white/40 font-normal">hari</span></span>
              </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-xl p-3 flex flex-col justify-center min-w-[150px] flex-1 sm:flex-initial">
              <label className="text-[10px] font-bold text-white/50 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-400" />
                Durasi PKL (Minggu)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={totalWeeksTarget}
                  onChange={(e) => handleTotalWeeksTargetChange(parseInt(e.target.value, 10))}
                  className="w-20 accent-indigo-500 cursor-pointer h-1 bg-white/10 rounded-lg appearance-none"
                />
                <span className="text-sm font-black text-white">{totalWeeksTarget} <span className="text-[10px] text-white/40 font-normal">mggu</span></span>
              </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3 flex flex-col justify-center min-w-[124px] text-center flex-1 sm:flex-initial">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">Target Akumulatif</span>
              <span className="text-base font-black text-white mt-1">
                {weeklyTarget * totalWeeksTarget} <span className="text-[10px] text-white/50 font-medium">Logbook</span>
              </span>
            </div>
          </div>
        </div>

        {/* Search, Filter & List Section */}
        <div className="pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/45 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari siswa untuk melihat pencapaian KPI..."
                value={kpiSearchTerm}
                onChange={(e) => setKpiSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none text-xs text-white rounded-xl py-2.5 pl-9 pr-4 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 font-sans">
              <button
                type="button"
                onClick={() => setKpiStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  kpiStatusFilter === "ALL"
                    ? "bg-slate-900 border-indigo-500 text-white"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                }`}
              >
                Semua Siswa
              </button>
              <button
                type="button"
                onClick={() => setKpiStatusFilter("Ongoing")}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  kpiStatusFilter === "Ongoing"
                    ? "bg-slate-900 border-indigo-500 text-white"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                }`}
              >
                Sedang PKL
              </button>
              <button
                type="button"
                onClick={() => setKpiStatusFilter("Completed")}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  kpiStatusFilter === "Completed"
                    ? "bg-slate-900 border-indigo-500 text-white"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                }`}
              >
                Selesai PKL
              </button>
              <button
                type="button"
                onClick={() => setKpiStatusFilter("Unassigned")}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  kpiStatusFilter === "Unassigned"
                    ? "bg-slate-900 border-indigo-500 text-white"
                    : "bg-white/5 border-white/5 text-white/60 hover:text-white"
                }`}
              >
                Belum Mulai
              </button>
            </div>
          </div>

          {/* Student KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              // Filter and map students
              const filteredStudents = students.filter(student => {
                const matchesSearch = student.name.toLowerCase().includes(kpiSearchTerm.toLowerCase()) || 
                                     student.nis.includes(kpiSearchTerm) ||
                                     student.className.toLowerCase().includes(kpiSearchTerm.toLowerCase());
                const matchesStatus = kpiStatusFilter === "ALL" || student.status === kpiStatusFilter;
                return matchesSearch && matchesStatus;
              });

              if (filteredStudents.length === 0) {
                return (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3 font-sans">
                    <Target className="w-10 h-10 text-slate-600 animate-pulse" />
                    <div className="space-y-1">
                      <p className="font-bold text-slate-350 text-xs">Siswa Tidak Ditemukan</p>
                      <p className="text-[11px] text-white/40 leading-relaxed">
                        Tidak ada siswa yang cocok dengan filter pencarian dan saringan status saat ini.
                      </p>
                    </div>
                  </div>
                );
              }

              return filteredStudents.map(student => {
                const {
                  actualLogsCount,
                  weeksElapsed,
                  cumulativeTarget,
                  overallFinalTarget,
                  averageWeeklyLogs,
                  cumulativeProgress,
                  totalProgress
                } = getStudentKpiData(student);

                // Determine company name
                const company = companies.find(c => c.id === student.companyId);
                const compName = company ? company.name : (student.status === 'Ongoing' || student.status === 'Completed' ? "Industri Mandiri" : "Belum Penempatan");

                // Determine KPI performance status and visual colors
                let progressColorClass = "from-rose-500/80 to-orange-500/80";
                let progressBgClass = "bg-rose-500/10";
                let badgeColorClass = "bg-rose-500/15 text-rose-300 border-rose-500/25";
                let performanceStatus = "Perlu Perhatian";

                if (student.status === 'Unassigned') {
                  progressColorClass = "from-slate-600 to-slate-500";
                  progressBgClass = "bg-slate-800";
                  badgeColorClass = "bg-slate-500/10 text-slate-400 border-slate-500/15";
                  performanceStatus = "Belum Ada Target";
                } else {
                  if (cumulativeProgress >= 85) {
                    progressColorClass = "from-emerald-500/80 to-teal-500/80";
                    progressBgClass = "bg-emerald-500/10";
                    badgeColorClass = "bg-emerald-500/15 text-emerald-300 border-emerald-500/25";
                    performanceStatus = "Sangat Disiplin";
                  } else if (cumulativeProgress >= 50) {
                    progressColorClass = "from-amber-500/80 to-orange-400/80";
                    progressBgClass = "bg-amber-500/10";
                    badgeColorClass = "bg-amber-500/15 text-amber-300 border-amber-500/25";
                    performanceStatus = "Cukup Aktif";
                  }
                }

                return (
                  <div 
                    key={student.id}
                    className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 p-4 rounded-2xl flex flex-col justify-between transition-all group relative overflow-hidden font-sans"
                  >
                    {/* Background decor text representing achievement tier */}
                    {student.status !== 'Unassigned' && (
                      <div className="absolute -right-3 -bottom-4 text-[42px] font-black font-mono text-white/[0.015] select-none pointer-events-none uppercase">
                        {cumulativeProgress >= 85 ? "EXCELLENT" : cumulativeProgress >= 50 ? "PASS" : "WARN"}
                      </div>
                    )}

                    {/* Student Identity block */}
                    <div className="flex items-start gap-3">
                      {/* Avatar initials with responsive visual status glow */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 relative ${
                        student.status === 'Unassigned' 
                          ? "bg-slate-800 border border-slate-600/30"
                          : student.status === 'Completed'
                          ? "bg-emerald-600/20 border border-emerald-500/30 text-emerald-300"
                          : cumulativeProgress >= 85
                          ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.2)] animate-pulse"
                          : "bg-amber-600/20 border border-amber-500/30 text-amber-300"
                      }`}>
                        {student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                        
                        {/* Interactive school-year-appropriate small class dot */}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 flex items-center justify-center text-[7.5px] font-bold text-white ${
                          student.status === 'Completed' ? "bg-emerald-500" : student.status === 'Ongoing' ? "bg-blue-500" : "bg-slate-600"
                        }`} title={`Status: ${student.status}`} />
                      </div>

                      {/* Name, Class & Company */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-xs text-white truncate group-hover:text-indigo-300 transition-colors">
                            {student.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-white/50 truncate mt-0.5">
                          Kelas: <strong className="text-white/70">{student.className}</strong> • {compName}
                        </p>
                        {student.pklStartDate && (
                          <p className="text-[9px] text-white/40 font-mono mt-0.5">
                            Mulai: {new Date(student.pklStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • Pekan ke-{weeksElapsed}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* KPI statistics section */}
                    <div className="space-y-3 mt-4">
                      {/* Top labels with actual counts */}
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[9.5px] font-bold text-white/40 uppercase tracking-wider block">Realisasi Pengisian Logbook</span>
                          <span className="text-xs text-white font-black">
                            {actualLogsCount} <span className="text-white/40 font-normal">terisi /</span> {student.status === 'Unassigned' ? 0 : cumulativeTarget} <span className="text-white/40 font-normal">target kini</span>
                          </span>
                        </div>

                        {student.status !== 'Unassigned' && (
                          <span className="font-mono text-xs font-black text-white">
                            {cumulativeProgress}%
                          </span>
                        )}
                      </div>

                      {/* Cumulative Progress Bar */}
                      <div className={`w-full ${progressBgClass} h-2 rounded-full overflow-hidden border border-white/[0.02]`}>
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${progressColorClass} transition-all duration-500`}
                          style={{ width: `${student.status === 'Unassigned' ? 0 : cumulativeProgress}%` }}
                        />
                      </div>

                      {/* Overall Target Bar (Lower priority but helpful) */}
                      {student.status !== 'Unassigned' && (
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-[9px] text-white/40">
                            <span>Sisa target akhir PKL ({overallFinalTarget} log):</span>
                            <span>{actualLogsCount} / {overallFinalTarget} ({totalProgress}%)</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-indigo-500/40"
                              style={{ width: `${totalProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Bottom row KPIs stats indicators */}
                      <div className="flex items-center justify-between border-t border-white/[0.05] pt-2 mt-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {student.status !== 'Unassigned' && (
                            <div className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                              <span className="text-[9px] text-white/50 font-mono whitespace-nowrap">
                                Rerata: <strong>{averageWeeklyLogs}</strong> log/minggu
                              </span>
                            </div>
                          )}
                        </div>

                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${badgeColorClass}`}>
                          {performanceStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Manual Instalasi (The Image content rendered interactively) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-blue-400" />
              <h3 className="font-display font-bold text-lg text-white">
                Langkah Instalasi Google Sheets & Script PKL
              </h3>
            </div>
            <span className="bg-white/10 text-white/70 font-mono text-[10px] px-2 py-1 rounded border border-white/10">
              PANDUAN PRAKTIS
            </span>
          </div>

          <div className="text-white/70 leading-relaxed text-sm">
            Berikut adalah langkah-langkah pengaturan Google Sheets dan Google Apps Script untuk sistem otomatisasi surat dengan Autocrat, persis seperti skrip panduan instalasi tim TU & Hubin:
          </div>

          <div className="space-y-4">
            {/* Step 1 */}
            <div className={`p-4 rounded-xl border transition-all flex gap-4 ${completedSteps[1] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/6'}`}>
              <div className="mt-0.5">
                <button 
                  onClick={() => toggleStep(1)}
                  className="rounded-full h-6 w-6 flex items-center justify-center border hover:scale-105 transition-transform bg-black/40 border-white/20 text-emerald-400 cursor-pointer"
                >
                  {completedSteps[1] ? <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20" /> : <div className="h-2 w-2 rounded-full bg-slate-500"></div>}
                </button>
               </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  LANGKAH 1 - SIAPKAN SHEET
                  {completedSteps[1] && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/20 border border-emerald-500/25 px-1.5 py-0.2 rounded">Selesai</span>}
                </h4>
                <ol className="list-decimal pl-4 text-xs text-white/70 space-y-1 pt-1">
                  <li>Upload berkas <code className="font-mono bg-black/30 text-blue-300 border border-white/5 px-1 rounded">Template_Sheet_PKL_DKV_Autocrat.xlsx</code> ke Google Drive sekolah (<span className="text-white/40 italic">hubin.smkn1@gmail.com</span>).</li>
                  <li>Buka berkas di Google Sheets.</li>
                  <li>Ubah nama dokumen menjadi <strong className="text-white">'Database PKL DKV 2026'</strong>.</li>
                </ol>
              </div>
            </div>

            {/* Step 2 */}
            <div className={`p-4 rounded-xl border transition-all flex gap-4 ${completedSteps[2] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/6'}`}>
              <div className="mt-0.5">
                <button 
                  onClick={() => toggleStep(2)}
                  className="rounded-full h-6 w-6 flex items-center justify-center border hover:scale-105 transition-transform bg-black/40 border-white/20 text-emerald-400 cursor-pointer"
                >
                  {completedSteps[2] ? <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20" /> : <div className="h-2 w-2 rounded-full bg-slate-500"></div>}
                </button>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  LANGKAH 2 - PASANG KODE SCRIPT
                  {completedSteps[2] && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/20 border border-emerald-500/25 px-1.5 py-0.2 rounded">Selesai</span>}
                </h4>
                <ol className="list-decimal pl-4 text-xs text-white/70 space-y-1 pt-1">
                  <li>Pilih menu <strong>Extensions &gt; Apps Script</strong> dari menu Spreadsheet.</li>
                  <li>Hapus semua kode default di dalam editor script.</li>
                  <li>Buka tab <span className="font-semibold text-blue-400 hover:underline cursor-pointer" onClick={() => onTabChange("script")}>Script Generator</span> di portal ini, klik "Copy Code" pada berkas <code className="font-mono bg-black/30 text-blue-300 border border-white/5 px-1 rounded">Code.gs</code> lalu paste ke editor.</li>
                  <li>Buat file HTML baru di Apps Script dengan nama <strong className="text-white">dashboard.html</strong>, lalu salin isinya dari Script Generator kami.</li>
                  <li>Klik tombol ikon Disket untuk menyimpan berkas.</li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className={`p-4 rounded-xl border transition-all flex gap-4 ${completedSteps[3] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/6'}`}>
              <div className="mt-0.5">
                <button 
                  onClick={() => toggleStep(3)}
                  className="rounded-full h-6 w-6 flex items-center justify-center border hover:scale-105 transition-transform bg-black/40 border-white/20 text-emerald-400 cursor-pointer"
                >
                  {completedSteps[3] ? <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20" /> : <div className="h-2 w-2 rounded-full bg-slate-500"></div>}
                </button>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  LANGKAH 3 - SETTING FOLDER DRIVE
                  {completedSteps[3] && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/20 border border-emerald-500/25 px-1.5 py-0.2 rounded">Selesai</span>}
                </h4>
                <ol className="list-decimal pl-4 text-xs text-white/70 space-y-1 pt-1">
                  <li>Buat folder baru bernama <strong className="text-white">'PKL_Templates'</strong> di Google Drive Anda. Upload 3 Docs template ke dalamnya:
                    <ul className="list-disc pl-4 mt-0.5 space-y-0.5 font-semibold text-[11px] text-purple-300">
                      <li>Template_Pengantar</li>
                      <li>Template_Biodata</li>
                      <li>Template_BYOD</li>
                    </ul>
                  </li>
                  <li>Buat pula folder bernama <strong className="text-white">'PKL_Output'</strong> sebagai wadah berkas dokumen siswa yang siap cetak.</li>
                  <li>Klik kanan pada masing-masing folder &gt; Pilih Dapatkan Link &gt; copy ID foldernya dari URL link.</li>
                  <li>Masukkan ID folder tersebut ke baris 2-3 di bagian konfigurasi file <code className="font-mono bg-black/30 text-blue-300 border border-white/5 px-1 rounded">Code.gs</code> Anda.</li>
                </ol>
              </div>
            </div>

            {/* Step 4 */}
            <div className={`p-4 rounded-xl border transition-all flex gap-4 ${completedSteps[4] ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/6'}`}>
              <div className="mt-0.5">
                <button 
                  onClick={() => toggleStep(4)}
                  className="rounded-full h-6 w-6 flex items-center justify-center border hover:scale-105 transition-transform bg-black/40 border-white/20 text-emerald-400 cursor-pointer"
                >
                  {completedSteps[4] ? <CheckSquare className="w-4 h-4 text-emerald-400 fill-emerald-500/20" /> : <div className="h-2 w-2 rounded-full bg-slate-500"></div>}
                </button>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  LANGKAH 4 - DEPLOY WEB APP
                  {completedSteps[4] && <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/20 border border-emerald-500/25 px-1.5 py-0.2 rounded">Selesai</span>}
                </h4>
                <ol className="list-decimal pl-4 text-xs text-white/70 space-y-1 pt-1">
                  <li>Klik tombol biru <strong>Deploy &gt; New deployment</strong> di pojok kanan atas Google Apps Script.</li>
                  <li>Ubah jenis Deployment (Select type) ke <strong>Web app</strong>.</li>
                  <li>Setelan "Execute as" pilih <strong>Me (hubin.smkn1@gmail.com)</strong>.</li>
                  <li>Setelan "Who has access" pilih <strong>Anyone in domain</strong> atau <strong>Anyone</strong> agar mudah dipasang.</li>
                  <li>Klik Deploy, konfirmasi izin akun Google sekolah, lalu copy alamat URL web app tersebut.</li>
                  <li>Bagikan alamat URL tersebut ke petugas TU Hubin via WhatsApp untuk visualisasi mobile dashboard!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - DKV Skill & Quick Info widget */}
        <div className="space-y-6">
          {/* Quick Tip / DKV stats */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-405" />
              Sebaran Keahlian Siswa DKV
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Analisis preferensi fokus kompetensi siswa DKV SMKN 14 KAB TANGERANG yang sedang diajukan PKL tahun ini.
            </p>
            <div className="space-y-3 pt-2">
              {Object.entries(skillCount).slice(0, 5).map(([skill, count]) => {
                const pct = Math.round((count / totalStudents) * 100);
                return (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-white/80">{skill}</span>
                      <span className="text-blue-400 font-mono font-bold text-[11px]">{count} Siswa ({pct}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-550 to-purple-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="glass-panel rounded-2xl p-6 space-y-3">
            <h3 className="font-display font-medium text-sm text-white">
              Alat Pintasan Operasional
            </h3>
            
            <div className="space-y-2 pt-1 text-xs">
              <button 
                onClick={() => onTabChange("siswa")}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="font-medium text-white/80 group-hover:text-white">Lakukan Import Massal Siswa</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-all" />
              </button>

              <button 
                onClick={() => onTabChange("surat")}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="font-medium text-white/80 group-hover:text-white">Preview Kop Surat & Print Dokumen</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-all" />
              </button>

              <button 
                onClick={() => onTabChange("email")}
                className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer"
              >
                <span className="font-medium text-white/80 group-hover:text-white">Kirim Email Lamaran ke HRD</span>
                <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-blue-400 transition-all" />
              </button>
            </div>
          </div>

          {/* School Info Block */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Info className="w-4 h-4" />
              <h4 className="font-semibold text-xs uppercase tracking-wider text-purple-300">Identias Hubin SMKN 14</h4>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Tim Hubinmas (Hubungan Industri & Masyarakat) menyalurkan siswa ke industri percetakan, penyiaran televisi, desain web/UI/UX, agensi branding di Jabodetabek.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
