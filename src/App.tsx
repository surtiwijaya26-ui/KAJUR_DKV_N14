import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import DashboardTab from "./components/DashboardTab";
import StudentsTab from "./components/StudentsTab";
import MasterPklTab from "./components/MasterPklTab";
import LogbookTab from "./components/LogbookTab";
import LettersTab from "./components/LettersTab";
import EmailTab from "./components/EmailTab";
import ScriptGenTab from "./components/ScriptGenTab";
import SettingsTab from "./components/SettingsTab";
import ActivityLogsTab from "./components/ActivityLogsTab";
import { motion, AnimatePresence } from "motion/react";

import { Student, Company, AppSettings, EmailHistory, LogbookEntry, ActivityLog } from "./types";
import { DEFAULT_STUDENTS, DEFAULT_COMPANIES, DEFAULT_SETTINGS, DEFAULT_LOGBOOKS, DEFAULT_ACTIVITY_LOGS } from "./data";

import { 
  Home, 
  Users, 
  Table,
  BookOpen,
  FileText, 
  Mail, 
  FileCode, 
  Sparkles,
  Award,
  ChevronRight,
  Monitor,
  Settings,
  Keyboard,
  Info,
  X,
  CheckCircle,
  History
} from "lucide-react";

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function mixColor(hex: string, mixWith: {r: number, g: number, b: number}, weight: number) {
  const color = hexToRgb(hex);
  if (!color) return hex;
  const r = Math.round(color.r * (1 - weight) + mixWith.r * weight);
  const g = Math.round(color.g * (1 - weight) + mixWith.g * weight);
  const b = Math.round(color.b * (1 - weight) + mixWith.b * weight);
  return rgbToHex(Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)));
}

function getShades(primaryHex: string) {
  const white = { r: 255, g: 255, b: 255 };
  const black = { r: 12, g: 12, b: 20 };

  return {
    50: mixColor(primaryHex, white, 0.95),
    100: mixColor(primaryHex, white, 0.85),
    200: mixColor(primaryHex, white, 0.65),
    300: mixColor(primaryHex, white, 0.45),
    400: mixColor(primaryHex, white, 0.22),
    500: primaryHex,
    600: mixColor(primaryHex, black, 0.15),
    700: mixColor(primaryHex, black, 0.35),
    800: mixColor(primaryHex, black, 0.55),
    900: mixColor(primaryHex, black, 0.75),
    950: mixColor(primaryHex, black, 0.88),
  };
}

export function applyThemeColor(color: string) {
  if (!color) return;
  const root = document.documentElement;
  root.style.setProperty('--theme-color', color);

  const shades = getShades(color);

  // Set meta theme-color tag
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', color);
  }

  // Inject into root CSS variables for dynamic Tailwind usage
  Object.entries(shades).forEach(([shade, value]) => {
    root.style.setProperty(`--blue-${shade}`, value);
    root.style.setProperty(`--indigo-${shade}`, value);
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isShortcutModalOpen, setIsShortcutModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: "info" | "success" } | null>(null);

  const showToast = (message: string, type: "info" | "success" = "info") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Core Applet States
  const [students, setStudents] = useState<Student[]>(() => {
    const local = localStorage.getItem("pkl_students");
    return local ? JSON.parse(local) : DEFAULT_STUDENTS;
  });

  const [companies, setCompanies] = useState<Company[]>(() => {
    const local = localStorage.getItem("pkl_companies");
    return local ? JSON.parse(local) : DEFAULT_COMPANIES;
  });

  useEffect(() => {
    localStorage.setItem("pkl_companies", JSON.stringify(companies));
  }, [companies]);

  const handleAddCompany = (company: Company) => {
    setCompanies(prev => {
      if (prev.some(c => c.id === company.id || c.name.toLowerCase() === company.name.toLowerCase())) {
        return prev;
      }
      addActivityLog("Tambah Perusahaan", `Menambahkan mitra perusahaan baru: ${company.name} dengan kuota target ${company.slots} slot.`, "perusahaan");
      return [...prev, company];
    });
  };

  const handleUpdateCompany = (id: string, updatedFields: Partial<Company>) => {
    const existing = companies.find(c => c.id === id);
    if (existing) {
      if (updatedFields.slots !== undefined && updatedFields.slots !== existing.slots) {
        addActivityLog(
          "Ubah Kuota Perusahaan",
          `Mengubah kuota target ${existing.name} dari ${existing.slots} menjadi ${updatedFields.slots} slot penempatan.`,
          "perusahaan"
        );
      } else {
        addActivityLog(
          "Ubah Perusahaan",
          `Memperbarui detail profil kemitraan industri: ${existing.name}.`,
          "perusahaan"
        );
      }
    }
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
  };

  const handleBulkImportMaster = (parsedData: Array<{ student: Omit<Student, "id">; company?: Company }>) => {
    // 1. Identify any custom companies that need to be added
    const newCompanies: Company[] = [];
    parsedData.forEach(item => {
      if (item.company) {
        newCompanies.push(item.company);
      }
    });

    if (newCompanies.length > 0) {
      setCompanies(prev => {
        const updated = [...prev];
        newCompanies.forEach(nc => {
          if (!updated.some(c => c.id === nc.id || c.name.toLowerCase() === nc.name.toLowerCase())) {
            updated.push(nc);
            addActivityLog("Tambah Perusahaan", `Menambahkan mitra industri baru ${nc.name} via import spreadsheet master.`, "perusahaan");
          }
        });
        return updated;
      });
    }

    addActivityLog(
      "Impor Master Siswa & Mitra",
      `Berhasil mengimpor/menggabungkan data ${parsedData.length} siswa dan mitra industry terkait dari spreadsheet master PKL.`,
      "sistem"
    );

    // 2. Map & insert students, updating existing ones if NIS/NISN matches!
    setStudents(prev => {
      const updatedStudents = [...prev];
      parsedData.forEach(item => {
        const parsedS = item.student;
        // Check if student with same NIS already exists
        const matchedIndex = updatedStudents.findIndex(s => s.nis === parsedS.nis || s.name.toLowerCase() === parsedS.name.toLowerCase());
        
        // Generate active ID
        const id = "stud-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
        const finalStudent: Student = {
          ...parsedS,
          id: matchedIndex >= 0 ? updatedStudents[matchedIndex].id : id
        };

        if (matchedIndex >= 0) {
          updatedStudents[matchedIndex] = {
            ...updatedStudents[matchedIndex],
            ...finalStudent
          };
        } else {
          updatedStudents.unshift(finalStudent);
        }
      });
      return updatedStudents;
    });
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const local = localStorage.getItem("pkl_settings");
    return local ? JSON.parse(local) : DEFAULT_SETTINGS;
  });

  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>(() => {
    const local = localStorage.getItem("pkl_email_history");
    const parsed = local ? JSON.parse(local) : [];
    // Initialize with a default success log if empty
    if (parsed.length === 0) {
      return [
        {
          id: "hist-default",
          studentId: "stud-3",
          studentName: "Bagas Wijaya",
          companyName: "Teluknaga Digital Print Hub",
          hrdEmail: "produksi@teluknagaprinting.co.id",
          subject: "Lamaran Praktek Kerja Lapangan (PKL) DKV - Bagas Wijaya - SMKN 1 Teluknaga",
          body: "Yth. Bapak Wendy Kurniawan,\n\nDengan hormat,\nSaya Bagas Wijaya siswa DKV SMKN 1 Teluknaga bermaksud melamar magang...",
          sentAt: "10 Juni 2026, 09:12 WIB",
          status: "sent"
        }
      ];
    }
    return parsed;
  });

  const [logbooks, setLogbooks] = useState<LogbookEntry[]>(() => {
    const local = localStorage.getItem("pkl_logbooks");
    return local ? JSON.parse(local) : DEFAULT_LOGBOOKS;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const local = localStorage.getItem("pkl_activity_logs");
    return local ? JSON.parse(local) : DEFAULT_ACTIVITY_LOGS;
  });

  const getIndonesianTimestamp = () => {
    const now = new Date();
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} WIB`;
  };

  const addActivityLog = (action: string, details: string, category: "siswa" | "perusahaan" | "sistem") => {
    const newLog: ActivityLog = {
      id: "log-act-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: getIndonesianTimestamp(),
      user: "surtiwijaya26@guru.smk.belajar.id", // Active administrator
      action,
      details,
      category
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  // Keep Sync with modern persistence
  useEffect(() => {
    localStorage.setItem("pkl_students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("pkl_settings", JSON.stringify(settings));
  }, [settings]);

  // Synchronize CSS variable theme dynamically when settings.themeColor changes
  useEffect(() => {
    const col = settings.themeColor || "#3b82f6";
    applyThemeColor(col);
    (window as any).applyThemeColor = applyThemeColor;
  }, [settings.themeColor]);

  useEffect(() => {
    localStorage.setItem("pkl_email_history", JSON.stringify(emailHistory));
  }, [emailHistory]);

  useEffect(() => {
    localStorage.setItem("pkl_logbooks", JSON.stringify(logbooks));
  }, [logbooks]);

  useEffect(() => {
    localStorage.setItem("pkl_activity_logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        (activeEl as HTMLElement).isContentEditable
      );

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // 1. Ctrl + S -> Save forms instantly
      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        
        if (activeTab === "settings") {
          const saveBtn = document.getElementById("settings-save-btn");
          if (saveBtn) {
            saveBtn.click();
            showToast("Perubahan Setelan Sistem berhasil Disimpan!", "success");
          } else {
            showToast("Data operasional tersinkronisasi murni!", "success");
          }
        } else if (activeTab === "siswa") {
          const submitBtn = document.getElementById("student-submit-btn") || document.getElementById("bulk-import-submit-btn");
          if (submitBtn) {
            submitBtn.click();
            showToast("Formulir Siswa DKV Tersimpan!", "success");
          } else {
            showToast("Basis data siswa DKV tersinkronisasi lokal!", "success");
          }
        } else {
          showToast("Protokol sinkronisasi lokal berhasil dijalankan!", "success");
        }
        return;
      }

      // 2. Ctrl + K -> Focus Student Search
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveTab("siswa");
        setTimeout(() => {
          const searchInput = document.getElementById("student-search-input");
          if (searchInput) {
            searchInput.focus();
            (searchInput as HTMLInputElement).select();
            showToast("Bilah pencarian siswa terfokus!", "info");
          }
        }, 80);
        return;
      }

      // 3. Shift + ? -> Toggle Help Modal (when not typing)
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setIsShortcutModalOpen(prev => !prev);
        return;
      }

      // Esc -> Close modal
      if (e.key === "Escape") {
        setIsShortcutModalOpen(false);
        return;
      }

      // 4. Alt + [1-8] or Alt + [U/S/M/L/C/E/G/P] (when not typing)
      if (e.altKey && !isCmdOrCtrl) {
        let matched = true;
        const key = e.key.toLowerCase();

        if (key === "1" || key === "u") {
          setActiveTab("dashboard");
          showToast("Membuka Beranda Utama");
        } else if (key === "2" || key === "s") {
          setActiveTab("siswa");
          showToast("Membuka Database Siswa");
        } else if (key === "3" || key === "m") {
          setActiveTab("master_pkl");
          showToast("Membuka Master PKL DKV");
        } else if (key === "4" || key === "l") {
          setActiveTab("logbook");
          showToast("Membuka Logbook Proyek Siswa");
        } else if (key === "5" || key === "c") {
          setActiveTab("surat");
          showToast("Membuka Cetak Surat PKL");
        } else if (key === "6" || key === "e") {
          setActiveTab("email");
          showToast("Membuka Kirim Email HRD");
        } else if (key === "7" || key === "g") {
          setActiveTab("script");
          showToast("Membuka Google Apps Script");
        } else if (key === "8" || key === "p") {
          setActiveTab("settings");
          showToast("Membuka Pengaturan Sistem");
        } else {
          matched = false;
        }

        if (matched) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab]);

  const handleAddLogbook = (entry: Omit<LogbookEntry, "id">) => {
    const id = "log-" + Date.now() + "-" + Math.floor(Math.random() * 100);
    const newEntry: LogbookEntry = {
      ...entry,
      id
    };
    setLogbooks(prev => [newEntry, ...prev]);
    showToast("Catatan laporan harian logbook berhasil ditambahkan!", "success");
  };

  const handleUpdateLogbook = (id: string, updated: Partial<LogbookEntry>) => {
    setLogbooks(prev => prev.map(log => log.id === id ? { ...log, ...updated } : log));
    showToast("Berhasil memperbarui pengesahan/detail catatan logbook!", "success");
  };

  const handleDeleteLogbook = (id: string) => {
    setLogbooks(prev => prev.filter(log => log.id !== id));
    showToast("Entri harian logbook berhasil dihapus.", "info");
  };

  const handleBulkImportLogbooks = (entries: LogbookEntry[]) => {
    setLogbooks(prev => [...entries, ...prev]);
  };

  const handleSyncLogbooks = (entries: LogbookEntry[]) => {
    setLogbooks(prev => {
      const merged = [...prev];
      entries.forEach(incoming => {
        const matchIndex = merged.findIndex(existing => 
          existing.id === incoming.id || 
          (existing.studentId === incoming.studentId && existing.date === incoming.date)
        );
        if (matchIndex >= 0) {
          merged[matchIndex] = {
            ...merged[matchIndex],
            ...incoming
          };
        } else {
          merged.push(incoming);
        }
      });
      return merged;
    });
  };

  const handleUpdateSettings = (updated: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...updated }));
  };

  const handleAddStudent = (student: Omit<Student, "id">) => {
    const id = "stud-" + Date.now() + "-" + Math.floor(Math.random() * 100);
    const newStudentItem: Student = {
      ...student,
      id,
      unassignedStartDate: student.status === "Unassigned" ? new Date().toISOString().split('T')[0] : undefined
    };
    addActivityLog("Tambah Siswa", `Menambahkan siswa baru: ${student.name} (NIS: ${student.nis}) di kelas ${student.className}.`, "siswa");
    setStudents(prev => [newStudentItem, ...prev]);
  };

  const handleUpdateStudent = (id: string, updated: Partial<Student>) => {
    const existing = students.find(s => s.id === id);
    let finalUpdate = { ...updated };
    if (existing) {
      if (updated.status !== undefined && updated.status !== existing.status) {
        addActivityLog("Ubah Status Siswa", `Mengubah status penempatan ${existing.name} dari "${existing.status}" menjadi "${updated.status}".`, "siswa");
        if (updated.status === "Unassigned") {
          finalUpdate.unassignedStartDate = new Date().toISOString().split('T')[0];
        } else {
          finalUpdate.unassignedStartDate = undefined;
        }
      } else if (updated.companyId !== undefined && updated.companyId !== existing.companyId) {
        const oldCo = companies.find(c => c.id === existing.companyId)?.name || "Mencari Mandiri / Belum Terdistribusi";
        const newCo = companies.find(c => c.id === updated.companyId)?.name || "Mencari Mandiri / Belum Terdistribusi";
        addActivityLog("Penempatan Siswa", `Memindahkan penempatan ${existing.name} dari "${oldCo}" menjadi "${newCo}".`, "siswa");
      } else {
        addActivityLog("Ubah Profil Siswa", `Memperbarui detail informasi profil siswa ${existing.name} (NIS: ${existing.nis}).`, "siswa");
      }
    }
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...finalUpdate } : s));
  };

  const handleDeleteStudent = (id: string) => {
    const existing = students.find(s => s.id === id);
    if (!existing) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus data siswa ${existing.name}? Tindakan ini tidak dapat dibatalkan.`)) {
      addActivityLog("Hapus Siswa", `Menghapus data siswa: ${existing.name} (NIS: ${existing.nis}) dari basis data tingkat sekolah.`, "siswa");
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  // Parsing Spreadsheet data row by row intelligently (Separated by tabs or commas)
  const handleBulkImport = (rawText: string): number => {
    if (!rawText.trim()) return 0;
    
    const lines = rawText.trim().split("\n");
    if (lines.length === 0) return 0;

    let parsedCount = 0;
    const newStudentsList: Student[] = [];

    // Check if first line contains header titles
    const firstLine = lines[0].toLowerCase();
    const hasHeader = firstLine.includes("nama") || firstLine.includes("nis") || firstLine.includes("kelas");
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Excel/Sheets defaults to Tab delimeters upon copying
      const columns = line.includes("\t") ? line.split("\t") : line.split(",");
      if (columns.length < 2) continue;

      const name = columns[0]?.trim() || `Siswa DKV ${parsedCount + 1}`;
      const nis = columns[1]?.trim() || (242510000 + Math.floor(Math.random() * 9000)).toString();
      const className = columns[2]?.trim() || "XII DKV 1";
      const skillsRaw = columns[3]?.trim() || "Desain Grafis, Branding, Layout";
      const portfolioUrl = columns[4]?.trim() || "behance.net/portfolio-all";
      const parentName = columns[5]?.trim() || "Wali Murid";
      const parentOccupation = columns[6]?.trim() || "Wiraswasta";
      const studentAddress = columns[7]?.trim() || "Kec. Teluknaga, Tangerang";

      const skills = skillsRaw.split(",").map(sk => sk.trim()).filter(Boolean);

      const parsedStudent: Student = {
        id: "stud-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name,
        nis,
        className,
        companyId: companies[0]?.id || "comp-6", // Fallback to mencari,
        skills,
        portfolioUrl,
        portfolioHighlight: "Portofolio visual terdaftar via spreadsheet.",
        phone: "0813" + Math.floor(10000000 + Math.random() * 90000000).toString(),
        email: name.toLowerCase().replace(/\s+/g, ".") + "@siswa.smkn1teluknaga.sch.id",
        status: "Unassigned",
        parentName,
        parentOccupation,
        studentAddress,
        birthPlaceDate: "Tangerang, 12 April 2008"
      };

      newStudentsList.push(parsedStudent);
      parsedCount++;
    }

    if (newStudentsList.length > 0) {
      addActivityLog("Impor Siswa", `Berhasil mengimpor ${newStudentsList.length} siswa baru via penyalinan format spreadsheet excel/table.`, "siswa");
      setStudents(prev => [...prev, ...newStudentsList]);
    }

    return parsedCount;
  };

  const handleSendEmailSimulate = (historyItem: Omit<EmailHistory, "id" | "sentAt">) => {
    // Generate sent timestamp
    const now = new Date();
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const formattedDate = `${days[now.getDay()]}, ${now.getDate()} Juni 2026, ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")} WIB`;
    
    const id = "hist-" + Date.now();
    const newHistory: EmailHistory = {
      ...historyItem,
      id,
      sentAt: formattedDate
    };

    setEmailHistory(prev => [newHistory, ...prev]);

    // Automatically advance student status to Pending after email request is triggered!
    handleUpdateStudent(historyItem.studentId, { status: "Pending" });
  };

  const handleRestoreDatabase = (restoredStudents: Student[], restoredEmailHistory: EmailHistory[], restoredSettings?: AppSettings) => {
    setStudents(restoredStudents);
    setEmailHistory(restoredEmailHistory);
    if (restoredSettings) {
      setSettings(restoredSettings);
    }
    setLogbooks(DEFAULT_LOGBOOKS);
  };

  return (
    <div className="min-h-screen bg-[#0c0c14] font-sans flex flex-col text-slate-100 relative" id="app-root-container">
      {/* Background Mesh Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Sleek branded header block */}
      <Header />

      {/* Main navigation menu (no-print during prints) */}
      <nav className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40 no-print" id="main-navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-13 overflow-x-auto">
            <div className="flex space-x-1 sm:space-x-4 py-1.5 items-center">
              
              {/* Dashboard Menu */}
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "dashboard" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Home className="w-4 h-4 text-blue-400" />
                Utama
              </button>

              {/* Students Menu */}
              <button
                onClick={() => setActiveTab("siswa")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "siswa" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Users className="w-4 h-4 text-blue-400" />
                Siswa DKV
              </button>

              {/* Master PKL DKV Tab */}
              <button
                onClick={() => setActiveTab("master_pkl")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "master_pkl" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Table className="w-4 h-4 text-blue-400" />
                Master PKL
                <span className="bg-indigo-500/25 text-indigo-305 font-sans text-[8.5px] px-1 rounded font-bold border border-indigo-500/30 ml-0.5">Baru</span>
              </button>

              {/* Logbook Proyek DKV Tab */}
              <button
                onClick={() => setActiveTab("logbook")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "logbook" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Logbook Proyek
                <span className="bg-emerald-500/25 text-emerald-300 font-sans text-[8.5px] px-1 rounded font-bold border border-emerald-500/30 ml-0.5">Lengkap</span>
              </button>

              {/* Generate Letters Menu */}
              <button
                onClick={() => setActiveTab("surat")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "surat" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400" />
                Cetak Surat PKL
              </button>

              {/* Email HRD Menu */}
              <button
                onClick={() => setActiveTab("email")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "email" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Mail className="w-4 h-4 text-blue-400" />
                Kirim Email HRD
                <span className="bg-blue-500/25 text-blue-300 font-sans text-[9px] px-1 rounded font-bold border border-blue-500/30 ml-0.5">AI</span>
              </button>

              {/* Script Builder Menu */}
              <button
                onClick={() => setActiveTab("script")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "script" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <FileCode className="w-4 h-4 text-blue-400" />
                Script Generator
              </button>

              {/* Activity Logs Menu */}
              <button
                id="nav-logs-tab"
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "logs" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <History className="w-4 h-4 text-indigo-400" />
                Log Aktivitas
                <span className="bg-emerald-500/25 text-emerald-300 font-sans text-[8.5px] px-1 rounded font-bold border border-emerald-500/30 ml-0.5">Audit</span>
              </button>

              {/* Settings Menu */}
              <button
                id="nav-settings-tab"
                onClick={() => setActiveTab("settings")}
                className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "settings" 
                    ? "bg-blue-605/85 border border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Settings className="w-4 h-4 text-blue-400" />
                Pengaturan
              </button>

            </div>

            <div className="hidden md:flex items-center space-x-3 text-[11px] font-mono">
              <button
                onClick={() => setIsShortcutModalOpen(true)}
                title="Lihat Daftar Pintasan Keyboard (?)"
                className="bg-white/5 border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/10 text-white/70 hover:text-blue-400 px-2.5 py-1.5 rounded-md text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5" />
                Pintasan [ ? ]
              </button>
              <div className="text-white/20">|</div>
              <div className="flex items-center gap-1">
                <span className="text-white/40">Status:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1 font-sans">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Online
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main active route container panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
        
        {activeTab === "dashboard" && (
          <DashboardTab 
            students={students} 
            companies={companies} 
            logbooks={logbooks}
            onTabChange={setActiveTab} 
            onUpdateStudent={handleUpdateStudent}
          />
        )}

        {activeTab === "siswa" && (
          <StudentsTab
            students={students}
            companies={companies}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onBulkImport={handleBulkImport}
          />
        )}

        {activeTab === "master_pkl" && (
          <MasterPklTab
            students={students}
            companies={companies}
            logbooks={logbooks}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onAddCompany={handleAddCompany}
            onUpdateCompany={handleUpdateCompany}
            onBulkImportMaster={handleBulkImportMaster}
            onSyncLogbooks={handleSyncLogbooks}
            showToast={showToast}
          />
        )}

        {activeTab === "logbook" && (
          <LogbookTab
            students={students}
            companies={companies}
            logbooks={logbooks}
            onAddLogbook={handleAddLogbook}
            onUpdateLogbook={handleUpdateLogbook}
            onDeleteLogbook={handleDeleteLogbook}
            onBulkImportLogbooks={handleBulkImportLogbooks}
          />
        )}

        {activeTab === "surat" && (
          <LettersTab
            students={students}
            companies={companies}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            logbooks={logbooks}
          />
        )}

        {activeTab === "email" && (
          <EmailTab
            students={students.filter(s => s.status === "Unassigned" || s.status === "Pending")}
            companies={companies}
            emailHistory={emailHistory}
            onSendEmailSimulate={handleSendEmailSimulate}
            settings={settings}
          />
        )}

        {activeTab === "script" && (
          <ScriptGenTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === "settings" && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            students={students}
            emailHistory={emailHistory}
            onRestoreDatabase={handleRestoreDatabase}
          />
        )}

        {activeTab === "logs" && (
          <ActivityLogsTab
            logs={activityLogs}
            onClearLogs={() => setActivityLogs([])}
            showToast={showToast}
          />
        )}

      </main>

      {/* Sleek bottom footer bar */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-5 border-t border-slate-800 text-center no-print" id="app-footer-bar">
        <p>&copy; 2026 Tim Hubungan Industri DKV - SMK Negeri 1 Teluknaga, Tangerang.</p>
        <p className="text-[10px] text-slate-500 mt-1 font-mono">Powered by Google AI Studio - Gemini 3.5 Turbo Core.</p>
      </footer>

      {/* Dynamic Popups & Overlays */}
      <AnimatePresence>
        {/* Floating Toast Notification */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            id="global-shortcut-toast"
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 border backdrop-blur-xl ${
              toast.type === "success" 
                ? "bg-[#0b0c14]/95 text-emerald-400 border-emerald-500/30" 
                : "bg-[#0b0c14]/95 text-blue-400 border-blue-500/30"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
            )}
            <span className="text-xs font-semibold font-sans text-slate-100">{toast.message}</span>
          </motion.div>
        )}

        {/* Global Keyboard Shortcuts Cheat-Sheet Modal */}
        {isShortcutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" id="shortcut-modal-overlay">
            {/* Backdrop lock */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShortcutModalOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" 
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0e0e1a]/95 border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden z-10 relative"
              id="shortcut-modal-box"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950/45 px-6 py-5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20 text-blue-400">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">Pintasan Keyboard Akses Cepat</h3>
                    <p className="text-[11px] text-white/50 font-sans">Navigasi cerdas & entri dokumen secepat kilat</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShortcutModalOpen(false)}
                  className="text-white/40 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-all cursor-pointer"
                  id="close-shortcut-modal-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Shortcuts content */}
              <div className="p-6 space-y-4">
                <p className="text-white/70 text-xs leading-relaxed font-sans">
                  Gunakan kombinasi tombol khusus di bawah ini dari layar mana saja untuk mempercepat alur kerja administrasi PKL DKV secara profesional:
                </p>

                <div className="space-y-3 font-sans">
                  
                  {/* Category: Global Actions */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold block">Aksi Global</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/60">Cari Siswa DKV</span>
                        <div className="flex gap-1">
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">Ctrl</kbd>
                          <span className="text-white/40 font-mono">+</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">K</kbd>
                        </div>
                      </div>

                      <div className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/60">Simpan Form Aktif</span>
                        <div className="flex gap-1">
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">Ctrl</kbd>
                          <span className="text-white/40 font-mono">+</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">S</kbd>
                        </div>
                      </div>

                      <div className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/60">Buka Menu Bantuan Ini</span>
                        <div className="flex gap-1">
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">Shift</kbd>
                          <span className="text-white/40 font-mono">+</span>
                          <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">?</kbd>
                        </div>
                      </div>

                      <div className="bg-white/5 p-2 px-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                        <span className="text-white/60">Tutup Jendela Dialog</span>
                        <kbd className="px-1.5 py-0.5 bg-slate-900 border border-white/20 rounded text-[9px] text-white font-mono font-bold shadow-md">Esc</kbd>
                      </div>
                    </div>
                  </div>

                  {/* Category: Navigation tabs */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-semibold block">Navigasi Tab Cepat (Alt + No atau Alt + Karakter)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs font-mono">
                      
                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">1. Utama (Dashboard)</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+1 / Alt+U</span>
                      </div>

                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">2. Database Siswa</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+2 / Alt+S</span>
                      </div>

                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">3. Master Database PKL</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+3 / Alt+M</span>
                      </div>

                      <div className="bg-[#121222] p-2 rounded-lg flex items-center justify-between border border-[#ffffff0c]">
                        <span className="text-[#bfccfc] text-[11px]">4. Logbook Proyek DKV</span>
                        <span className="text-blue-300 text-[10px] font-bold">Alt+4 / Alt+L</span>
                      </div>

                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">5. Cetak Surat PKL</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+5 / Alt+C</span>
                      </div>

                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">6. Kirim Email HRD</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+6 / Alt+E</span>
                      </div>

                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">7. Script Generator</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+7 / Alt+G</span>
                      </div>

                      <div className="bg-white/3 p-2 rounded-lg flex items-center justify-between border border-white/5">
                        <span className="text-white/70 text-[11px]">8. Setelan Instansi</span>
                        <span className="text-slate-400 text-[10px] font-bold">Alt+8 / Alt+P</span>
                      </div>

                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-950 px-6 py-4 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>Tekan tombol apa saja untuk mulai menjelajah.</span>
                <span>SI-HUBIN PKL v1.0</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
