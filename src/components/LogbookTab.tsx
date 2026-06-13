import React, { useState } from "react";
import { Student, Company, LogbookEntry } from "../types";
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  Clock, 
  X, 
  Check, 
  Save, 
  Filter, 
  Calendar,
  ArrowRight, 
  Sparkles, 
  ExternalLink, 
  FileSpreadsheet, 
  Clipboard, 
  Download,
  AlertCircle,
  FileCode,
  TrendingUp,
  Cpu,
  Layers,
  Brain
} from "lucide-react";

// Helper function to classify logbook activities into creative DKV categories
export const classifyActivity = (activity: string, tools: string[]): string => {
  const text = (activity + " " + (tools || []).join(" ")).toLowerCase();
  
  if (
    text.includes("figma") || 
    text.includes("ui") || 
    text.includes("ux") || 
    text.includes("slicing") || 
    text.includes("web") || 
    text.includes("prototipe") || 
    text.includes("prototype") || 
    text.includes("wireframe") || 
    text.includes("landing") || 
    text.includes("mobile")
  ) {
    return "UI/UX & Web Design";
  }
  
  if (
    text.includes("premiere") || 
    text.includes("after effects") || 
    text.includes("video") || 
    text.includes("render") || 
    text.includes("capcut") || 
    text.includes("editing video") || 
    text.includes("pasca produksi") ||
    text.includes("film") || 
    text.includes("motion") || 
    text.includes("vlog") || 
    text.includes("audio") || 
    text.includes("suara") || 
    text.includes("sound") || 
    text.includes("rekaman") ||
    text.includes("shooting") ||
    text.includes("cut")
  ) {
    return "Video & Motion Editing";
  }

  if (
    text.includes("sketsa") || 
    text.includes("ilustrasi") || 
    text.includes("kartun") || 
    text.includes("drawing") || 
    text.includes("clip studio") || 
    text.includes("paint") || 
    text.includes("blender") ||
    text.includes("3d") ||
    text.includes("2d game") ||
    text.includes("karakter") ||
    text.includes("artwork")
  ) {
    return "Illustration & Digital Art";
  }
  
  if (
    text.includes("foto") || 
    text.includes("kamera") || 
    text.includes("dslr") || 
    text.includes("photography") || 
    text.includes("fotografi") || 
    text.includes("potret") ||
    text.includes("portrait") ||
    text.includes("landscape") ||
    text.includes("lensa")
  ) {
    return "Photography & Cameraman";
  }
  
  // Default general graphic design category
  return "Graphic Design & Branding";
};

interface LogbookTabProps {
  students: Student[];
  companies: Company[];
  logbooks: LogbookEntry[];
  onAddLogbook: (entry: Omit<LogbookEntry, "id">) => void;
  onUpdateLogbook: (id: string, updated: Partial<LogbookEntry>) => void;
  onDeleteLogbook: (id: string) => void;
  onBulkImportLogbooks: (entries: LogbookEntry[]) => void;
}

export default function LogbookTab({
  students,
  companies,
  logbooks,
  onAddLogbook,
  onUpdateLogbook,
  onDeleteLogbook,
  onBulkImportLogbooks
}: LogbookTabProps) {
  // Selection filtering
  const [selectedStudentId, setSelectedStudentId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>(""); // specific date e.g. "2026-07-01"
  const [approvalFilter, setApprovalFilter] = useState<string>("ALL"); // ALL, APPROVED_BOTH, PENDING_DUDI, PENDING_TEACHER
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL"); // ALL, or category name
  const [chartMode, setChartMode] = useState<"donut" | "bar">("donut");

  // Advanced filters states
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState<boolean>(false);

  // AI Logbook Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    qualityScore: string;
    summary: string;
    feedbackBullets: string[];
    technicalRecommendations: string[];
    mode?: string;
  } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyzeLogbooks = async (studentIdParam?: string) => {
    const targetId = studentIdParam || selectedStudentId;
    const activeStudent = students.find(s => s.id === targetId);
    if (!activeStudent) {
      setAnalysisError("Silakan pilih siswa tertentu di menu atas untuk memulai analisis AI harian.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiFeedback(null);

    // Filter logbooks belonging to this student
    const studentLogs = logbooks.filter(l => l.studentId === activeStudent.id);

    try {
      const resp = await fetch("/api/gemini/analyze-logbook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentName: activeStudent.name,
          studentClass: activeStudent.className || "XII DKV",
          logbooks: studentLogs
        })
      });

      if (!resp.ok) {
        throw new Error(`Koneksi server bermasalah (Status: ${resp.status})`);
      }

      const data = await resp.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAiFeedback({
        qualityScore: data.qualityScore || "Cukup",
        summary: data.summary || "",
        feedbackBullets: data.feedbackBullets || [],
        technicalRecommendations: data.technicalRecommendations || [],
        mode: data.mode
      });
    } catch (err: any) {
      console.error("Gagal melakukan analisis AI:", err);
      setAnalysisError(err.message || "Gagal menghubungi layanan kecerdasan buatan.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Automatically reset AI feedback when current student changes, to avoid showing stale advice
  React.useEffect(() => {
    setAiFeedback(null);
    setAnalysisError(null);
  }, [selectedStudentId]);

  // Presets helper for auditing
  const setAuditRangePreset = (preset: "this-week" | "last-week" | "this-month" | "clear") => {
    const today = new Date();
    if (preset === "clear") {
      setStartDateFilter("");
      setEndDateFilter("");
      return;
    }
    
    const formatDateString = (d: Date): string => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "this-week") {
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const monday = new Date(today);
      monday.setDate(today.getDate() + distanceToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      
      setStartDateFilter(formatDateString(monday));
      setEndDateFilter(formatDateString(sunday));
    } else if (preset === "last-week") {
      const currentDay = today.getDay();
      const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;
      const mondayThisWeek = new Date(today);
      mondayThisWeek.setDate(today.getDate() + distanceToMonday);
      
      const mondayLastWeek = new Date(mondayThisWeek);
      mondayLastWeek.setDate(mondayThisWeek.getDate() - 7);
      
      const sundayLastWeek = new Date(mondayLastWeek);
      sundayLastWeek.setDate(mondayLastWeek.getDate() + 6);
      
      setStartDateFilter(formatDateString(mondayLastWeek));
      setEndDateFilter(formatDateString(sundayLastWeek));
    } else if (preset === "this-month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      setStartDateFilter(formatDateString(firstDay));
      setEndDateFilter(formatDateString(lastDay));
    }
  };

  // Manual Row Adding & Editing
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // Form Field States
  const [formStudentId, setFormStudentId] = useState("");
  const [formDate, setFormDate] = useState("2026-07-01");
  const [formDay, setFormDay] = useState("Rabu");
  const [formActivity, setFormActivity] = useState("");
  const [formToolsRaw, setFormToolsRaw] = useState(""); // input comma separated or selected tags
  const [formProjectLink, setFormProjectLink] = useState("");
  const [formObstacle, setFormObstacle] = useState("");
  const [formSolution, setFormSolution] = useState("");
  const [formApprovedByDudi, setFormApprovedByDudi] = useState(false);
  const [formApprovedByTeacher, setFormApprovedByTeacher] = useState(false);

  // Autosave Draft State
  const [draftExists, setDraftExists] = useState(false);

  // Check for saved draft on opening the ADD modal
  React.useEffect(() => {
    if (isFormOpen && !editingLogId) {
      const saved = sessionStorage.getItem("pkl_logbook_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Only show draft alert if there is actual content worth restoring
          if (parsed.activity?.trim() || parsed.obstacle?.trim() || parsed.projectLink?.trim() || parsed.solution?.trim()) {
            setDraftExists(true);
          }
        } catch (e) {
          setDraftExists(false);
        }
      } else {
        setDraftExists(false);
      }
    } else {
      setDraftExists(false);
    }
  }, [isFormOpen, editingLogId]);

  // Save changes to sessionStorage automatically as the student types / changes fields
  React.useEffect(() => {
    if (isFormOpen && !editingLogId) {
      const draft = {
        studentId: formStudentId,
        date: formDate,
        day: formDay,
        activity: formActivity,
        toolsRaw: formToolsRaw,
        projectLink: formProjectLink,
        obstacle: formObstacle,
        solution: formSolution,
        approvedByDudi: formApprovedByDudi,
        approvedByTeacher: formApprovedByTeacher
      };
      // Keep in sessionStorage if there's any non-empty input
      if (formStudentId || formActivity || formToolsRaw || formProjectLink || formObstacle || formSolution) {
        sessionStorage.setItem("pkl_logbook_draft", JSON.stringify(draft));
      }
    }
  }, [
    isFormOpen,
    editingLogId,
    formStudentId,
    formDate,
    formDay,
    formActivity,
    formToolsRaw,
    formProjectLink,
    formObstacle,
    formSolution,
    formApprovedByDudi,
    formApprovedByTeacher
  ]);

  // Restore draft callback
  const handleRestoreDraft = () => {
    const saved = sessionStorage.getItem("pkl_logbook_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.studentId) setFormStudentId(parsed.studentId);
        if (parsed.date) setFormDate(parsed.date);
        if (parsed.day) setFormDay(parsed.day);
        if (parsed.activity) setFormActivity(parsed.activity);
        if (parsed.toolsRaw !== undefined) setFormToolsRaw(parsed.toolsRaw);
        if (parsed.projectLink !== undefined) setFormProjectLink(parsed.projectLink);
        if (parsed.obstacle !== undefined) setFormObstacle(parsed.obstacle);
        if (parsed.solution !== undefined) setFormSolution(parsed.solution);
        if (parsed.approvedByDudi !== undefined) setFormApprovedByDudi(parsed.approvedByDudi);
        if (parsed.approvedByTeacher !== undefined) setFormApprovedByTeacher(parsed.approvedByTeacher);
        
        setDraftExists(false);
      } catch (e) {
        console.error("Gagal memulihkan draf", e);
      }
    }
  };

  // Clear draft callback
  const handleClearDraft = () => {
    sessionStorage.removeItem("pkl_logbook_draft");
    setDraftExists(false);
  };

  // Bulk paste states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Suggested tags to click
  const dkvToolsPreset = [
    "Figma", 
    "Adobe Photoshop", 
    "Adobe Illustrator", 
    "Adobe Premiere Pro", 
    "Adobe After Effects", 
    "CorelDraw", 
    "Clip Studio Paint", 
    "Toon Boom Harmony", 
    "Blender 3D", 
    "Canva", 
    "Adobe InDesign"
  ];

  // Automated Day conversion
  const handleDateChange = (val: string) => {
    setFormDate(val);
    if (!val) return;
    const dateObj = new Date(val);
    const daysIndo = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const calculatedDay = daysIndo[dateObj.getDay()];
    setFormDay(calculatedDay);
  };

  // Demo paste preset helper
  const handleLoadDemoSheet = () => {
    setBulkRawText(
      `Tanggal | Hari | Kegiatan/Proyek | Tools Digunakan (Ps/Ai/Figma/dll) | Link Hasil Kerja | Kendala | Solusi | Paraf Pembimbing DUDI | Paraf Guru
2026-07-06 | Senin | Membuat aset media poster media sosial kampanye hemat plastik dan digital sketching layout kemasan ramah lingkungan | Adobe Illustrator, Canva | https://behance.net/work-poster | Ukuran file terlalu besar saat diekspor | Mengompres gambar dengan plugin webp | YA | YA
2026-07-07 | Selasa | Melakukan slicing layout Figma menjadi komponen UI web dan merancang interaksi prototipe aplikasi mobile pariwisata | Figma | https://figma.com/design-pariwisata | Beberapa ukuran font tidak konsisten | Membuat varian komponen text styles terpusat | YA | TIDAK
2026-07-08 | Rabu | Rekaman materi video profil usaha DUDI menggunakan kamera DSLR, pencahayaan 3 titik, serta wawancara HRD | Premiere Pro | | Angin kencang mengganggu audio mikrofon | Menggunakan filter noise reduction audio di Adobe Audition | YA | TIDAK
2026-07-09 | Kamis | Editing pasca produksi video iklan pendek (durasi 30 detik), sinkronisasi musik latar, penambahan lower third | Premiere Pro, After Effects | https://youtube.com/v-iklan | Rendering video memakan waktu cukup lama | Mengaktifkan GPU Acceleration Mercury Engine | TIDAK | TIDAK
2026-07-10 | Jumat | Menyelesaikan ilustrasi visual sketsa kartun latar belakang 2D game petualangan Nusantara bertransisi sunset | Clip Studio Paint | https://drive.google.com/art-sunset | Penyesuaian saturasi sunset yang terlalu menyala | Memakai blending layer Soft Light | YA | YA`
    );
  };

  // Parse bulk raw text
  const handleProcessBulkImport = () => {
    if (!bulkRawText.trim()) {
      setBulkError("Kotak teks masukan kosong.");
      return;
    }

    try {
      const lines = bulkRawText.split("\n");
      const parsedEntries: LogbookEntry[] = [];
      let successCount = 0;

      // Identify active target student
      let targetStudentId = selectedStudentId;
      if (selectedStudentId === "ALL") {
        // Fallback to first student if none selected
        const firstActive = students.find(s => s.status === "Ongoing" || s.status === "Pending");
        targetStudentId = firstActive ? firstActive.id : (students[0]?.id || "stud-1");
      }

      // Check header presence is line 1 or 2
      const firstLineText = lines[0].toLowerCase();
      const hasHeader = firstLineText.includes("tanggal") || firstLineText.includes("hari") || firstLineText.includes("kegiatan") || firstLineText.includes("paraf");
      const startLineIndex = hasHeader ? 1 : 0;

      for (let i = startLineIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        let cols: string[] = [];
        if (line.includes("|")) {
          cols = line.split("|").map(c => c.trim());
        } else if (line.includes("\t")) {
          cols = line.split("\t").map(c => c.trim());
        } else {
          cols = line.split(",").map(c => c.trim());
        }

        if (cols.length < 3) continue;

        const dateVal = cols[0] || "2026-07-01";
        const dayVal = cols[1] || "Rabu";
        const activityVal = cols[2] || "";
        const toolsVal = cols[3] || "";
        const linkVal = cols[4] || "";
        const obstacleVal = cols[5] || "";
        const solutionVal = cols[6] || "";
        const isDudiOk = (cols[7] || "").toUpperCase() === "YA" || (cols[7] || "").toUpperCase() === "TRUE";
        const isTeacherOk = (cols[8] || "").toUpperCase() === "YA" || (cols[8] || "").toUpperCase() === "TRUE";

        if (!activityVal) continue;

        // Process tools list
        const processedTools = toolsVal
          ? toolsVal.split(",").map(t => t.trim()).filter(Boolean)
          : ["Adobe Illustrator"];

        parsedEntries.push({
          id: "log-bulk-" + Date.now() + "-" + Math.floor(Math.random() * 10000) + "-" + successCount,
          studentId: targetStudentId,
          date: dateVal,
          day: dayVal,
          activity: activityVal,
          toolsUsed: processedTools,
          projectLink: linkVal,
          obstacle: obstacleVal,
          solution: solutionVal,
          approvedByDudi: isDudiOk,
          approvedByTeacher: isTeacherOk
        });
        successCount++;
      }

      if (parsedEntries.length > 0) {
        onBulkImportLogbooks(parsedEntries);
        setBulkSuccessMsg(`Berhasil memproses dan mengimpor ${successCount} baris logbook baru untuk siswa terpilih!`);
        setBulkRawText("");
        setBulkError(null);
        setIsBulkOpen(false);
        setTimeout(() => setBulkSuccessMsg(null), 6000);
      } else {
        setBulkError("Tidak ditemukan data baris logbook valid dalam salinan Anda.");
      }
    } catch (err: any) {
      setBulkError("Gagal merujuk struktur baris: " + err.message);
    }
  };

  // Trigger Edit Form
  const handleOpenEdit = (entry: LogbookEntry) => {
    setEditingLogId(entry.id);
    setFormStudentId(entry.studentId);
    setFormDate(entry.date);
    setFormDay(entry.day);
    setFormActivity(entry.activity);
    setFormToolsRaw(entry.toolsUsed.join(", "));
    setFormProjectLink(entry.projectLink || "");
    setFormObstacle(entry.obstacle || "");
    setFormSolution(entry.solution || "");
    setFormApprovedByDudi(entry.approvedByDudi);
    setFormApprovedByTeacher(entry.approvedByTeacher);
    setIsFormOpen(true);
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingLogId(null);
    setFormStudentId(selectedStudentId === "ALL" ? (students[0]?.id || "") : selectedStudentId);
    setFormDate(new Date().toISOString().split("T")[0]);
    handleDateChange(new Date().toISOString().split("T")[0]);
    setFormActivity("");
    setFormToolsRaw("Adobe Illustrator, Figma");
    setFormProjectLink("");
    setFormObstacle("");
    setFormSolution("");
    setFormApprovedByDudi(false);
    setFormApprovedByTeacher(false);
    setIsFormOpen(true);
  };

  // Quick preset tag click handler
  const handleAppendToolTag = (toolName: string) => {
    const current = formToolsRaw.split(",").map(v => v.trim()).filter(Boolean);
    if (current.includes(toolName)) {
      // Remove
      setFormToolsRaw(current.filter(t => t !== toolName).join(", "));
    } else {
      // Add
      setFormToolsRaw([...current, toolName].join(", "));
    }
  };

  // Save manual entry
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId) {
      alert("Harap pilih siswa terlebih dahulu.");
      return;
    }
    if (!formActivity.trim()) {
      alert("Deskripsi kegiatan proyek harian wajib diisi.");
      return;
    }

    const toolList = formToolsRaw
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);

    const dataPayload = {
      studentId: formStudentId,
      date: formDate,
      day: formDay,
      activity: formActivity,
      toolsUsed: toolList.length > 0 ? toolList : ["Adobe Photoshop"],
      projectLink: formProjectLink || undefined,
      obstacle: formObstacle || undefined,
      solution: formSolution || undefined,
      approvedByDudi: formApprovedByDudi,
      approvedByTeacher: formApprovedByTeacher
    };

    if (editingLogId) {
      onUpdateLogbook(editingLogId, dataPayload);
    } else {
      onAddLogbook(dataPayload);
    }

    setIsFormOpen(false);
    setEditingLogId(null);
    sessionStorage.removeItem("pkl_logbook_draft");
    setDraftExists(false);
  };

  // Toggle quick checkbox approvals
  const handleToggleDudiApproval = (id: string, current: boolean) => {
    onUpdateLogbook(id, { approvedByDudi: !current });
  };

  const handleToggleTeacherApproval = (id: string, current: boolean) => {
    onUpdateLogbook(id, { approvedByTeacher: !current });
  };

  // Copy Tab-delimited for Excel
  const handleExportToClipboard = () => {
    let output = "Tanggal\tHari\tKegiatan/Proyek\tTools Digunakan\tLink Karya\tKendala\tSolusi\tParaf DUDI\tParaf Guru\n";
    
    // Grid list
    filteredLogs.forEach(log => {
      output += `${log.date}\t${log.day}\t${log.activity}\t${log.toolsUsed.join(", ")}\t${log.projectLink || "-"}\t${log.obstacle || "-"}\t${log.solution || "-"}\t${log.approvedByDudi ? 'Disetujui' : 'Belum'}\t${log.approvedByTeacher ? 'Disahkan' : 'Belum'}\n`;
    });

    navigator.clipboard.writeText(output);
    alert("Data logbook yang disaring berhasil disalin ke clipboard! Silakan tempelkan langsung ke Google Sheets/Excel.");
  };

  // Get active student details for headers
  const getStudentDisplay = (sId: string) => {
    const s = students.find(stud => stud.id === sId);
    if (!s) return null;
    const comp = companies.find(c => c.id === s.companyId);
    return {
      name: s.name,
      nis: s.nis,
      class: s.className,
      companyName: comp ? comp.name : "Belum Magang / Mandiri"
    };
  };

  const studentHeader = selectedStudentId !== "ALL" ? getStudentDisplay(selectedStudentId) : null;

  // Process logs filtering
  const filteredLogs = logbooks.filter(log => {
    const s = students.find(stud => stud.id === log.studentId);
    const matchesStudent = selectedStudentId === "ALL" || log.studentId === selectedStudentId;
    const matchesSearch = 
      log.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s && s.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.toolsUsed.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.obstacle && log.obstacle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.solution && log.solution.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchesApproval = true;
    if (approvalFilter === "APPROVED_BOTH") {
      matchesApproval = log.approvedByDudi && log.approvedByTeacher;
    } else if (approvalFilter === "PENDING_DUDI") {
      matchesApproval = !log.approvedByDudi;
    } else if (approvalFilter === "PENDING_TEACHER") {
      matchesApproval = !log.approvedByTeacher;
    }

    const matchesSingleDate = !dateFilter || log.date === dateFilter;
    
    let matchesDateRange = true;
    if (startDateFilter && log.date < startDateFilter) {
      matchesDateRange = false;
    }
    if (endDateFilter && log.date > endDateFilter) {
      matchesDateRange = false;
    }

    const matchesDate = matchesSingleDate && matchesDateRange;
    const matchesCategory = categoryFilter === "ALL" || classifyActivity(log.activity, log.toolsUsed) === categoryFilter;

    return matchesStudent && matchesSearch && matchesApproval && matchesDate && matchesCategory;
  });

  // Calculate software statistics from logbooks
  const getSoftwareStats = () => {
    const stats: Record<string, number> = {};
    const relevantLogs = selectedStudentId === "ALL" ? logbooks : logbooks.filter(l => l.studentId === selectedStudentId);
    relevantLogs.forEach(entry => {
      entry.toolsUsed.forEach(tool => {
        stats[tool] = (stats[tool] || 0) + 1;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  };

  const softwareRank = getSoftwareStats();

  // Calculate distribution of activity categories for the chart
  const getCategoryStats = () => {
    const categoriesList = [
      { name: "UI/UX & Web Design", color: "#6366f1", bg: "bg-indigo-500/10", border: "border-indigo-500/35", text: "text-indigo-400" },
      { name: "Video & Motion Editing", color: "#a855f7", bg: "bg-purple-500/10", border: "border-purple-500/35", text: "text-purple-400" },
      { name: "Graphic Design & Branding", color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/35", text: "text-blue-400" },
      { name: "Photography & Cameraman", color: "#14b8a6", bg: "bg-teal-500/10", border: "border-teal-500/35", text: "text-teal-400" },
      { name: "Illustration & Digital Art", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/35", text: "text-amber-400" }
    ];

    const counts: Record<string, number> = {
      "UI/UX & Web Design": 0,
      "Video & Motion Editing": 0,
      "Graphic Design & Branding": 0,
      "Photography & Cameraman": 0,
      "Illustration & Digital Art": 0
    };

    // Calculate dynamic counts based on the chosen student filter
    const relevantLogs = selectedStudentId === "ALL" 
      ? logbooks 
      : logbooks.filter(l => l.studentId === selectedStudentId);

    let totalCount = 0;
    relevantLogs.forEach(log => {
      const cat = classifyActivity(log.activity, log.toolsUsed);
      if (counts[cat] !== undefined) {
        counts[cat]++;
        totalCount++;
      } else {
        counts["Graphic Design & Branding"]++;
        totalCount++;
      }
    });

    return {
      total: totalCount,
      data: categoriesList.map(cat => {
        const count = counts[cat.name] || 0;
        const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
        return {
          ...cat,
          count,
          percentage
        };
      })
    };
  };

  const categoryStats = getCategoryStats();

  // Metrics calculating
  const totalRelevantLogs = filteredLogs.length;
  const dudiApprovedCount = filteredLogs.filter(l => l.approvedByDudi).length;
  const teacherApprovedCount = filteredLogs.filter(l => l.approvedByTeacher).length;
  const bothApprovedCount = filteredLogs.filter(l => l.approvedByDudi && l.approvedByTeacher).length;

  return (
    <div className="space-y-6" id="logbook-tab-view">
      
      {/* Alert Ribbon for parser */}
      {bulkSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 p-4 rounded-xl flex items-center gap-3 animate-fade-in text-emerald-400 font-sans text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="font-bold">{bulkSuccessMsg}</span>
        </div>
      )}

      {/* Primary Selector Ribbon & Profile Context */}
      <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-slate-900/40 relative overflow-hidden" id="logbook-profile-context">
        <div className="absolute top-0 right-0 w-80 h-32 bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          
          <div className="space-y-2 max-w-xl">
            <h3 className="font-display font-black text-white text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Logbook Proyek Kerja Siswa DKV
            </h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Pantau laporan perkembangan karya harian siswa DKV yang sedang menempuh Praktik Kerja Lapangan. Menampilkan deskripsi proyek harian, software kreatif, kendala teknis desain, serta verifikasi ganda dari pembimbing DUDI dan guru pembimbing.
            </p>

            {/* Context profile detail if single student is selected */}
            {studentHeader && (
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-xl flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-sans">
                <span className="text-white font-bold">👤 {studentHeader.name} ({studentHeader.class})</span>
                <span className="text-white/40">|</span>
                <span className="text-indigo-300 font-medium font-mono">NISN: {studentHeader.nis}</span>
                <span className="text-white/40">|</span>
                <span className="text-slate-300 font-semibold">🏢 Mitra: {studentHeader.companyName}</span>
              </div>
            )}
          </div>

          {/* Quick Context Dropdown Selector */}
          <div className="w-full lg:w-72 space-y-1">
            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              Pilih Siswa DKV Aktif
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full p-3 bg-slate-950/80 border border-white/10 hover:border-indigo-500/50 focus:border-indigo-500 rounded-xl text-xs text-white font-bold outline-none cursor-pointer transition"
            >
              <option value="ALL">🌟 Tampilkan Semua Log Siswa ({logbooks.length} entri)</option>
              {students
                .filter(s => s.status === "Ongoing" || s.status === "Completed")
                .map(s => {
                  const comp = companies.find(c => c.id === s.companyId);
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} - {s.className} ({comp ? comp.name.slice(0, 16) : "Mandiri"}...)
                    </option>
                  );
                })}
            </select>
          </div>

        </div>
      </div>

      {/* KPI Stats Analytics Logbook Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="logbook-metric-counters">
        
        {/* Metric 1 */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-slate-900/30 flex flex-col justify-between space-y-1">
          <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest block font-sans">Harian Log Tersaji</span>
          <span className="text-2xl font-display font-black text-white">{totalRelevantLogs} <span className="text-xs text-slate-500 font-normal">Entri</span></span>
          <span className="text-[10px] text-indigo-300/60 block">Saringan Filter Aktif</span>
        </div>

        {/* Metric 2 */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 border-l-emerald-500/30 bg-slate-900/30 flex flex-col justify-between space-y-1">
          <span className="text-emerald-400/90 text-[10px] uppercase font-bold tracking-widest block font-sans">Disetujui DUDI</span>
          <span className="text-2xl font-display font-black text-emerald-400">{dudiApprovedCount} <span className="text-xs text-slate-500 font-normal">Selesai</span></span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-mono">{(totalRelevantLogs > 0 ? (dudiApprovedCount / totalRelevantLogs) * 100 : 0).toFixed(0)}% Disahkan Mitra</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 border-l-amber-500/30 bg-slate-900/30 flex flex-col justify-between space-y-1">
          <span className="text-amber-400/90 text-[10px] uppercase font-bold tracking-widest block font-sans">Asistensi Guru</span>
          <span className="text-2xl font-display font-black text-amber-400">{teacherApprovedCount} <span className="text-xs text-slate-500 font-normal">Paraf</span></span>
          <span className="text-[10px] text-slate-500 font-mono">{(totalRelevantLogs > 0 ? (teacherApprovedCount / totalRelevantLogs) * 100 : 0).toFixed(0)}% Terpantau Sekolah</span>
        </div>

        {/* Metric 4 (Tools highlight) */}
        <div className="glass-panel p-4.5 rounded-2xl border border-white/5 bg-slate-900/30 flex flex-col justify-between space-y-1">
          <span className="text-[#a5b4fc] text-[10px] uppercase font-bold tracking-widest block font-sans">Software Utama</span>
          <div className="space-y-1">
            {softwareRank.length > 0 ? (
              <div className="flex items-center gap-1 flex-wrap">
                {softwareRank.slice(0, 2).map(([tool, count]) => (
                  <span key={tool} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded px-1.5 py-0.5 text-[9px] font-bold">
                    {tool} ({count}x)
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 italic">No tools logged yet</p>
            )}
          </div>
          <span className="text-[9.5px] text-slate-500 block">Sering digunakan siswa</span>
        </div>

      </div>

      {/* Visual Activity Trend Chart Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden animate-fade-in" id="logbook-activity-chart-panel">
        <div className="absolute top-0 left-0 w-96 h-32 bg-indigo-500/[0.02] blur-[80px] pointer-events-none rounded-full" />
        
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-5">
          <div className="space-y-1">
            <h3 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Monitoring Tren & Distribusi Penugasan DKV
              {categoryFilter !== "ALL" && (
                <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
                  Saringan Aktif: {categoryFilter}
                </span>
              )}
            </h3>
            <p className="text-white/50 text-[11px] leading-relaxed">
              Analisis grafik cerdas berbasis kecerdasan kata kunci laporan harian seluruh siswa. Klik kategori/ring untuk menyaring data logbook.
            </p>
          </div>

          {/* Toggle View Options & Reset */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <div className="bg-slate-900 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setChartMode("donut")}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === "donut"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Grafik Donat
              </button>
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  chartMode === "bar"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Grafik Batang
              </button>
            </div>

            {categoryFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setCategoryFilter("ALL")}
                className="bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-300 font-bold text-[10px] px-2.5 py-1.5 rounded-xl transition cursor-pointer"
              >
                Setel Ulang
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Calculation Warn if total counts is 0 */}
        {categoryStats.total === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-3 font-sans">
            <Layers className="w-10 h-10 text-slate-600 animate-pulse" />
            <div className="space-y-1">
              <p className="font-bold text-slate-350 text-xs">Belum Ada Catatan Logbook Terdaftar</p>
              <p className="text-[11px] text-white/40 leading-relaxed">
                Tidak ada entri laporan harian untuk siswa ini. Silahkan tambahkan logbook baru terlebih dahulu di bawah untuk menelaah tren visual.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Visual Chart - Left side */}
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-slate-900/10 p-5 border border-white/[0.03] rounded-2xl relative">
              
              {chartMode === "donut" ? (
                /* Dynamic SVG Donut Chart */
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                    {/* Background track */}
                    <circle
                      cx="64"
                      cy="64"
                      r="42"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.03)"
                      strokeWidth="11"
                    />
                    
                    {/* Dynamic segment slices */}
                    {(() => {
                      let accumulatedPercentage = 0;
                      const r = 42;
                      const circumference = 2 * Math.PI * r; // 263.893
                      
                      return categoryStats.data.map((cat) => {
                        if (cat.count === 0) return null;
                        
                        const strokeLength = (cat.percentage / 100) * circumference;
                        const strokeOffset = -(accumulatedPercentage / 100) * circumference;
                        accumulatedPercentage += cat.percentage;
                        
                        const isHoveredOrActive = categoryFilter === cat.name;
                        
                        return (
                          <circle
                            key={cat.name}
                            cx="64"
                            cy="64"
                            r={r}
                            fill="transparent"
                            stroke={cat.color}
                            strokeWidth={isHoveredOrActive ? "14" : "11"}
                            strokeDasharray={`${strokeLength} ${circumference}`}
                            strokeDashoffset={strokeOffset}
                            className="transition-all duration-305 cursor-pointer hover:stroke-[14px]"
                            onClick={() => setCategoryFilter(categoryFilter === cat.name ? "ALL" : cat.name)}
                            style={{
                              transformOrigin: 'originCenter',
                              filter: isHoveredOrActive ? `drop-shadow(0 0 6px ${cat.color}40)` : 'none'
                            }}
                            title={`${cat.name}: ${cat.percentage.toFixed(0)}%`}
                          />
                        );
                      });
                    })()}
                  </svg>
                  
                  {/* Center Text Panel */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-sans text-center pointer-events-none">
                    <span className="text-[20px] font-black text-white leading-none">
                      {categoryStats.total}
                    </span>
                    <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold mt-1">
                      Total Log
                    </span>
                  </div>
                </div>
              ) : (
                /* Dynamic SVG Vertical/Horizontal Bar Chart */
                <div className="w-full space-y-3 font-sans">
                  <div className="flex flex-col gap-2.5">
                    {categoryStats.data.map((cat) => {
                      const isSelected = categoryFilter === cat.name;
                      return (
                        <div 
                          key={cat.name} 
                          className={`space-y-1 cursor-pointer transition p-2 rounded-xl border ${
                            isSelected 
                              ? "bg-white/5 border-white/20" 
                              : "border-transparent hover:bg-white/[0.02]"
                          }`}
                          onClick={() => setCategoryFilter(categoryFilter === cat.name ? "ALL" : cat.name)}
                        >
                          <div className="flex items-center justify-between text-[11px] font-medium text-white">
                            <span className="truncate max-w-[170px]">{cat.name}</span>
                            <span className="font-bold whitespace-nowrap">{cat.percentage.toFixed(0)}%</span>
                          </div>
                          
                          {/* Colored bar rail */}
                          <div className="h-5.5 w-full bg-slate-900 rounded-lg overflow-hidden border border-white/5 flex items-center">
                            <div 
                              className="h-full rounded-lg transition-all duration-500 ease-out flex items-center justify-end pr-2 text-[9px] font-extrabold text-white"
                              style={{ 
                                width: `${Math.max(12, cat.percentage)}%`, 
                                backgroundColor: cat.color,
                                boxShadow: isSelected ? `0 0 12px ${cat.color}50` : 'none'
                              }}
                            >
                              {cat.count > 0 ? `${cat.count}x` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Legend Status Display */}
              <div className="text-[10px] text-white/40 text-center select-none font-sans mt-3">
                {selectedStudentId === "ALL" 
                  ? "Analisis Terintegrasi Seluruh Siswa" 
                  : `Menelaah Riwayat ${students.find(s => s.id === selectedStudentId)?.name || "Siswa"}`}
              </div>
            </div>

            {/* Breakdowns List Detailed - Right side */}
            <div className="md:col-span-7 space-y-3 font-sans">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                Saringan Kategori Aktivitas PKL DKV
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categoryStats.data.map((cat) => {
                  const isActiveFilter = categoryFilter === cat.name;
                  
                  return (
                    <div
                      key={cat.name}
                      onClick={() => setCategoryFilter(categoryFilter === cat.name ? "ALL" : cat.name)}
                      className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group relative ${
                        isActiveFilter
                          ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 text-white"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 text-slate-300"
                      }`}
                    >
                      {/* Active Filter Glow Overlay */}
                      {isActiveFilter && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="font-bold text-[11px] tracking-wide truncate max-w-[150px]">
                            {cat.name}
                          </span>
                        </div>
                        
                        {/* Summary of matching entries */}
                        <div className="flex items-baseline gap-1.5 pt-0.5">
                          <span className="text-[16px] font-black text-white tracking-tight">
                            {cat.count}
                          </span>
                          <span className="text-[9.5px] text-white/40 block">entri ({cat.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>

                      {/* Micro Progress Bar track */}
                      <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden mt-2.5 border border-white/5">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${cat.percentage}%`, 
                            backgroundColor: cat.color 
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mt-2 pt-2 border-t border-white/[0.02]">
                        <span className="group-hover:text-white/60 transition">
                          {isActiveFilter ? "✓ Saringan Aktif" : "Saring log"}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* AI Logbook Analysis & Feedback Widget */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/30 relative overflow-hidden animate-fade-in mb-6" id="logbook-ai-feedback-widget">
        <div className="absolute top-0 right-0 w-96 h-32 bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5 font-sans">
              <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">
                Analisis Kinerja & Asistensi Umpan Balik AI Gemini
              </h4>
              <p className="text-white/50 text-[11px]">
                Menganalisis kualitas deskripsi tugas harian, software, kendala, dan memberikan feedback penulisan jurnal otomatis.
              </p>
            </div>
          </div>
          
          {selectedStudentId !== "ALL" && (
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={() => handleAnalyzeLogbooks()}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 disabled:from-indigo-900 disabled:to-indigo-950 text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/15 flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengerjakan Analisis Klasifikasi...
                </>
              ) : (
                <>
                  <Cpu className="w-3.5 h-3.5" />
                  Analisis Logbook Sekarang
                </>
              )}
            </button>
          )}
        </div>

        {/* Display Content based on State */}
        {selectedStudentId === "ALL" ? (
          <div className="p-4.5 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-4 text-xs font-sans">
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            </div>
            <div className="space-y-2 flex-grow">
              <p className="font-bold text-slate-200">Ingin Menelaah Logbook dengan Asistensi AI?</p>
              <p className="text-white/50 text-[11px] leading-relaxed max-w-2xl">
                Silakan pilih satu siswa aktif melalui menu dropdown pilihan siswa di atas untuk melihat ringkasan, analisis detail, dan draf umpan balik otomatis yang siap Anda sampaikan demi meningkatkan kualitas laporannya.
              </p>
              
              {/* Shortcut buttons to quick-select students who have logs */}
              {students.filter(s => s.status === "Ongoing").slice(0, 4).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-medium">Beralih cepat:</span>
                  {students
                    .filter(s => s.status === "Ongoing")
                    .slice(0, 4)
                    .map(s => (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => setSelectedStudentId(s.id)}
                        className="bg-white/5 hover:bg-white/10 text-white/70 px-2.5 py-1 rounded-lg text-[10px] font-semibold border border-white/5 transition cursor-pointer"
                      >
                        {s.name.split(" ")[0]} ({s.className})
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 font-sans">
            
            {/* Connection error */}
            {analysisError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-rose-400" />
                <div className="space-y-0.5">
                  <p className="font-bold">Gagal Menganalisis Logbook</p>
                  <p className="text-white/60 text-[11px]">{analysisError}</p>
                </div>
              </div>
            )}

            {/* Default state when not analyzed yet */}
            {!isAnalyzing && !aiFeedback && (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-xl space-y-2.5 max-w-lg mx-auto bg-slate-950/20">
                <Brain className="w-8 h-8 text-indigo-400/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-slate-350 font-bold text-xs">Analisis Siap Dimulai</p>
                  <p className="text-white/40 text-[10.5px] max-w-sm mx-auto leading-relaxed px-4">
                    AI Gemini akan mencermati {logbooks.filter(l => l.studentId === selectedStudentId).length} entri jurnalan harian milik {students.find(s => s.id === selectedStudentId)?.name || "siswa tersebut"} dan merumuskan umpan balik penyempurnaan kualitas laporan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyzeLogbooks()}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 text-white text-[10.5px] font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  Mulai Analisis Sekarang
                </button>
              </div>
            )}

            {/* Loading Anim */}
            {isAnalyzing && (
              <div className="p-6 bg-slate-950/40 rounded-xl border border-white/5 space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-indigo-300">Menjalankan mesin penelaah Gemini-3.5-flash...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4.5 bg-white/5 rounded-lg w-3/4" />
                  <div className="h-3.5 bg-white/5 rounded-lg w-full" />
                  <div className="h-3.5 bg-white/5 rounded-lg w-5/6" />
                </div>
              </div>
            )}

            {/* AI Feedback Results Card */}
            {aiFeedback && (
              <div className="space-y-4 animate-fade-in">
                
                {/* Upper row: score and general assessment */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  
                  {/* Score badge box */}
                  <div className="lg:col-span-4 p-4.5 bg-slate-950/60 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black font-sans">Kualitas Lapor Jurnal</span>
                    
                    <div className="my-2.5">
                      {aiFeedback.qualityScore === "Sangat Baik" && (
                        <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-black text-xs px-4 py-2 rounded-full shadow-lg shadow-emerald-500/5">
                          ✨ Sangat Baik
                        </span>
                      )}
                      {aiFeedback.qualityScore === "Baik" && (
                        <span className="bg-teal-500/15 text-teal-400 border border-teal-500/30 font-black text-xs px-4 py-2 rounded-full">
                          ⭐ Baik
                        </span>
                      )}
                      {aiFeedback.qualityScore === "Cukup" && (
                        <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 font-black text-xs px-4 py-2 rounded-full">
                          ⚠️ Cukup
                        </span>
                      )}
                      {aiFeedback.qualityScore === "Kurang Detail" && (
                        <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black text-xs px-4 py-2 rounded-full shadow-lg shadow-rose-500/10 animate-pulse">
                          🚨 Kurang Detail
                        </span>
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal font-sans pt-1">
                      Dinilai dari kelengkapan deskripsi proyek, tools kreatif, kendala teknis, dan solusi taktis.
                    </p>
                  </div>

                  {/* Summary evaluation description */}
                  <div className="lg:col-span-8 p-4.5 bg-slate-950/40 rounded-xl border border-white/5 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-extrabold font-sans">Penilaian Evaluatif Komprehensif</span>
                      <p className="text-white/80 text-[11px] leading-relaxed">
                        {aiFeedback.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-2 border-t border-white/[0.04]">
                      <span>Asistensi Monitoring Kurikulum DKV</span>
                      <span className="font-mono text-indigo-300 text-[10px] font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/15 uppercase">
                        {aiFeedback.mode || "Gemini Core Mode"}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Sub row: Bullets & Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Student recommendations bullets */}
                  <div className="p-4.5 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl space-y-3">
                    <h5 className="text-[10.5px] font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      3 Rekomendasi Umpan Balik Siswa (Untuk Penulisan)
                    </h5>
                    
                    <ul className="space-y-2 text-[11px] text-slate-300 leading-normal pl-1 list-none">
                      {aiFeedback.feedbackBullets.map((bullet, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-indigo-400 font-bold font-mono">#{idx + 1}</span>
                          <span className="text-white/80">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Technical suggestions */}
                  <div className="p-4.5 bg-purple-500/[0.02] border border-purple-500/10 rounded-xl space-y-3">
                    <h5 className="text-[10.5px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                      Rekomendasi Teknik & Eksplorasi DKV Siswa
                    </h5>
                    
                    <ul className="space-y-2 text-[11px] text-slate-300 leading-normal pl-1 list-none">
                      {aiFeedback.technicalRecommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-purple-400 font-bold font-mono">✎</span>
                          <span className="text-white/80 italic">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Quick utility block to copy notes */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const text = `Siswa: ${students.find(s => s.id === selectedStudentId)?.name || ""}\nEvaluasi Logbook: ${aiFeedback.summary}\n\nSaran Perbaikan:\n` + aiFeedback.feedbackBullets.map((b, i) => `${i+1}. ${b}`).join("\n");
                      navigator.clipboard.writeText(text);
                      alert("Draf catatan umpan balik AI berhasil disalin! Silakan tempelkan langsung ke kolom komentar laporan.");
                    }}
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-[10px] font-black px-3.5 py-2 rounded-xl cursor-pointer transition flex items-center gap-1.5"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Salin Analisis & Umpan Balik
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Toolbar Options Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 font-sans bg-slate-900/25 p-4 rounded-2xl border border-white/5" id="logbook-toolbar">
        
        {/* Search & Date Controls Block */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:max-w-xl">
          {/* Main text search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama siswa, aktivitas, tools, kendala..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 hover:border-white/15 focus:border-indigo-500/60 outline-none text-slate-100 rounded-xl text-xs placeholder-slate-500 font-medium transition"
            />
          </div>

          {/* Specific custom date picker */}
          <div className="relative sm:w-48 flex items-center gap-2 flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1 text-slate-300">
            <span className="text-[10px] font-bold text-slate-400 select-none uppercase tracking-wider">Tanggal:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none p-0 focus:ring-0 outline-none text-white text-xs w-full cursor-pointer"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter("")}
                className="text-slate-400 hover:text-white p-0.5"
                title="Hapus saringan tanggal"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Clear Filter if any is active */}
          {(searchTerm || dateFilter || approvalFilter !== "ALL" || categoryFilter !== "ALL" || startDateFilter || endDateFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setDateFilter("");
                setStartDateFilter("");
                setEndDateFilter("");
                setApprovalFilter("ALL");
                setCategoryFilter("ALL");
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center justify-center gap-1 flex-shrink-0 whitespace-nowrap cursor-pointer hover:underline py-1.5 px-2 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-lg transition"
            >
              Reset Saringan
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          
          <button
            type="button"
            id="btn-advanced-filter-toggle"
            onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
            className={`p-2.5 rounded-xl text-[11px] font-bold border transition duration-200 cursor-pointer flex items-center gap-1.5 ${
              isAdvancedFilterOpen || categoryFilter !== "ALL" || startDateFilter || endDateFilter
                ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-400"
                : "bg-[#0f0f1c]/80 border-white/10 text-slate-300 hover:bg-[#0f0f1c]"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter Lanjutan
            {(categoryFilter !== "ALL" || startDateFilter || endDateFilter) && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            )}
          </button>

          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="p-2.5 bg-[#0f0f1c] border border-white/10 rounded-xl text-[11px] font-bold text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">Saringan Paraf: Semua</option>
            <option value="APPROVED_BOTH">Telah Ditandatangani Keduanya (DUDI & Guru)</option>
            <option value="PENDING_DUDI">Belum Diparaf Industri (DUDI)</option>
            <option value="PENDING_TEACHER">Belum Disahkan Monitioring Guru</option>
          </select>

          <button
            type="button"
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className="bg-[#102a1e] border border-emerald-500/30 hover:bg-emerald-900/30 text-emerald-300 text-xs px-3 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Impor Sheet Logbook
          </button>

          <button
            type="button"
            onClick={handleExportToClipboard}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs px-3 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Salin logbook yang dipilih dalam format Excel Tab-delimited"
          >
            <Clipboard className="w-4 h-4 text-blue-400" />
            Salin Excel
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2.5 rounded-xl font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Harian Log
          </button>

        </div>
      </div>

      {/* Advanced Filter Panel */}
      {isAdvancedFilterOpen && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 bg-[#0c0d1b]/85 font-sans space-y-4 animate-fade-in" id="logbook-advanced-filters">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="font-display font-bold text-xs text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Saringan Audit & Rentang Tanggal Mingguan
            </h4>
            <button 
              type="button"
              onClick={() => setIsAdvancedFilterOpen(false)}
              className="text-white/40 hover:text-white transition"
              title="Sembunyikan panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Column 1: Categories */}
            <div className="md:col-span-5 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Kategori Bidang Karya DKV
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-white/10 focus:border-indigo-500 rounded-xl text-xs text-white outline-none cursor-pointer font-sans"
              >
                <option value="ALL">🌟 Semua Kategori Bidang Karya DKV</option>
                <option value="UI/UX & Web Design">🎨 UI/UX & Web Design (Figma, Slicing)</option>
                <option value="Video & Motion Editing">🎬 Video & Motion Editing (Premiere, AE)</option>
                <option value="Graphic Design & Branding">✏️ Graphic Design & Branding (Branding, Corel)</option>
                <option value="Photography & Cameraman">📷 Photography & Cameraman (DSLR, Lensa)</option>
                <option value="Illustration & Digital Art">🖌️ Illustration & Digital Art (Drawing, Sketch)</option>
              </select>
              <p className="text-[10px] text-white/40 leading-relaxed">
                Klasifikasi cerdas otomatis disesuaikan berdasarkan isi deksripsi aktivitas harian siswa.
              </p>
            </div>

            {/* Column 2: Date Selector Range */}
            <div className="md:col-span-7 space-y-4">
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
                Rentang Tanggal Audit Khusus (Mulai s.d Selesai)
              </label>
              
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full flex items-center bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-300">
                  <span className="text-[10px] font-bold text-indigo-400 select-none uppercase tracking-wider mr-2 whitespace-nowrap">Mulai:</span>
                  <input
                    type="date"
                    value={startDateFilter}
                    onChange={(e) => setStartDateFilter(e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 outline-none text-white text-xs w-full cursor-pointer font-sans"
                  />
                  {startDateFilter && (
                    <button
                      type="button"
                      onClick={() => setStartDateFilter("")}
                      className="text-slate-400 hover:text-white ml-1.5"
                      title="Reset tanggal mulai"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="text-white/40 text-xs hidden sm:block">sampai</div>

                <div className="relative w-full flex items-center bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-slate-300">
                  <span className="text-[10px] font-bold text-indigo-400 select-none uppercase tracking-wider mr-2 whitespace-nowrap">Akhir:</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 outline-none text-white text-xs w-full cursor-pointer font-sans"
                  />
                  {endDateFilter && (
                    <button
                      type="button"
                      onClick={() => setEndDateFilter("")}
                      className="text-slate-400 hover:text-white ml-1.5"
                      title="Reset tanggal akhir"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Presets row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] text-white/40 block mr-1 font-sans font-bold">Pintas Pengawasan:</span>
                <button
                  type="button"
                  onClick={() => setAuditRangePreset("this-week")}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                >
                  Minggu Ini
                </button>
                <button
                  type="button"
                  onClick={() => setAuditRangePreset("last-week")}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                >
                  Minggu Lalu
                </button>
                <button
                  type="button"
                  onClick={() => setAuditRangePreset("this-month")}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                >
                  Bulan Ini
                </button>
                {(startDateFilter || endDateFilter) && (
                  <button
                    type="button"
                    onClick={() => setAuditRangePreset("clear")}
                    className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 border border-rose-500/25 rounded-lg px-2.5 py-1 text-[10px] font-bold transition cursor-pointer"
                  >
                    Setel Ulang Laporan
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Active Status Check of Audit filters */}
          <div className="flex items-center gap-2 border-t border-white/5 pt-3.5 mt-1 text-[10.5px]">
            <span className="text-white/40">Status Saringan Audit:</span>
            {categoryFilter !== "ALL" || startDateFilter || endDateFilter ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {categoryFilter !== "ALL" && (
                  <span className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded font-bold">
                    Bidang: {categoryFilter}
                  </span>
                )}
                {(startDateFilter || endDateFilter) && (
                  <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded font-mono font-bold">
                    Tanggal: {startDateFilter || "*"} s.d {endDateFilter || "*"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter("ALL");
                    setStartDateFilter("");
                    setEndDateFilter("");
                  }}
                  className="text-rose-450 hover:text-rose-400 font-extrabold hover:underline ml-1 cursor-pointer font-sans"
                >
                  Reset Semua
                </button>
              </div>
            ) : (
              <span className="text-slate-500 font-medium font-sans">Belum ada saringan audit khusus terpilih.</span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Sheet Parser Form for copy pasting */}
      {isBulkOpen && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-slate-900/50 font-sans space-y-4 animate-fade-in" id="logbook-bulk-paste-box">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="font-display font-extrabold text-xs text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              Impor Massal Sheet Logbook {selectedStudentId !== "ALL" ? `Siswa: ${students.find(st => st.id === selectedStudentId)?.name}` : "(Belum Memilih Siswa Khusus)"}
            </h4>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleLoadDemoSheet}
                className="bg-[#0f231a] hover:bg-[#123123] border border-emerald-500/20 text-emerald-200 text-[10px] font-bold px-2 py-1.5 rounded-lg cursor-pointer"
              >
                Gunakan Template Guru DKV
              </button>
              <button 
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-white/60 text-[11px] leading-relaxed">
            Salin data tabel logbook dari Excel Anda (kolom: <strong>Tanggal | Hari | Kegiatan | Tools | Link Kerja | Kendala | Solusi | Paraf DUDI (YA/TIDAK) | Paraf Guru (YA/TIDAK)</strong>) lalu tempel di kotak teks di bawah ini. Pastikan Anda memilih nama siswa yang dituju di pemilih pojok kanan atas sebelum menekan tombol sinkronisasi.
          </p>

          <textarea
            rows={8}
            value={bulkRawText}
            onChange={(e) => setBulkRawText(e.target.value)}
            placeholder="Contoh format tempel:&#13;2026-07-06 | Senin | Membuat poster re-branding | Adobe Illustrator | http://behance.net | - | - | YA | YA"
            className="w-full p-3 font-mono text-[11px] leading-relaxed bg-slate-950 border border-white/10 focus:border-emerald-500/60 rounded-xl text-slate-200 outline-none block"
          />

          {bulkError && (
            <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-lg text-rose-400 text-[11px] flex items-center gap-1.5 font-sans font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Gagal memproses baris: {bulkError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3.5 pt-1">
            <button
              type="button"
              onClick={() => {
                setBulkRawText("");
                setBulkError(null);
              }}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Bersihkan
            </button>
            <button
              type="button"
              onClick={handleProcessBulkImport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-xl font-extrabold text-xs transition shadow-md shadow-emerald-500/10 cursor-pointer"
            >
              Proses & Masukkan Logbook
            </button>
          </div>
        </div>
      )}

      {/* Grid Table Workspace */}
      <div className="glass-panel rounded-2xl border border-white/5 shadow-2xl overflow-hidden font-sans" id="logbook-table-container">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#121221] border-b border-white/10 text-white/50 uppercase tracking-widest font-mono text-[9px]">
                <th className="py-4 px-4.5 font-bold">Waktu & Siswa</th>
                <th className="py-4 px-4 font-bold">Detail Proyek / Kegiatan Harian DKV</th>
                <th className="py-4 px-4 font-bold">Perangkat / Tools</th>
                <th className="py-4 px-4 font-bold">Karya Utama / Tautan</th>
                <th className="py-4 px-4 font-bold">Kendala & Solusi</th>
                <th className="py-4 px-4.5 font-bold text-center">Paraf DUDI</th>
                <th className="py-4 px-4.5 font-bold text-center">Paraf Guru</th>
                <th className="py-4 px-4 font-bold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-black text-sm text-slate-400">Belum Ada Catatan Logbook</p>
                      <p className="text-[11px] leading-relaxed">
                        Siswa terpilih atau saringan filter di atas belum memiliki entri logbook proyek. Tambahkan entri baru secara manual atau gunakan fitur parser Sheet Excel di atas.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const correlatedStudent = students.find(s => s.id === log.studentId) || { name: "Siswa", className: "DKV" };
                  
                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Date & Day */}
                      <td className="py-4 px-4.5 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-xs block">{log.date}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-1.5 py-0.5 rounded font-mono inline-block">
                            {log.day}
                          </span>
                          {selectedStudentId === "ALL" && (
                            <span className="text-[10px] text-indigo-300 font-medium block max-w-[120px] truncate">
                              👤 {correlatedStudent.name}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Project Activity */}
                      <td className="py-4 px-4 max-w-xs md:max-w-md">
                        <p className="text-white/90 text-[11.5px] leading-relaxed font-semibold">
                          {log.activity}
                        </p>
                      </td>

                      {/* Design Tools Used */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[150px]">
                          {log.toolsUsed.map(tool => {
                            // High contrast colors for tools
                            let colorCls = "bg-blue-500/10 text-blue-300 border border-blue-500/20";
                            if (tool.toLowerCase().includes("photoshop") || tool.toLowerCase().includes("ps")) {
                              colorCls = "bg-sky-500/10 text-sky-300 border border-sky-500/20";
                            } else if (tool.toLowerCase().includes("illustrator") || tool.toLowerCase().includes("ai")) {
                              colorCls = "bg-amber-500/10 text-amber-300 border border-amber-500/20";
                            } else if (tool.toLowerCase().includes("figma")) {
                              colorCls = "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20";
                            } else if (tool.toLowerCase().includes("premiere") || tool.toLowerCase().includes("pr")) {
                              colorCls = "bg-violet-500/10 text-violet-300 border border-violet-500/20";
                            } else if (tool.toLowerCase().includes("blender")) {
                              colorCls = "bg-orange-500/10 text-orange-300 border border-orange-500/20";
                            } else if (tool.toLowerCase().includes("clip studio") || tool.toLowerCase().includes("csp")) {
                              colorCls = "bg-purple-500/10 text-purple-300 border border-purple-500/20";
                            } else if (tool.toLowerCase().includes("canva")) {
                              colorCls = "bg-teal-500/10 text-teal-305 border border-teal-500/20";
                            }
                            return (
                              <span key={tool} className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded transition ${colorCls}`}>
                                {tool}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Work links */}
                      <td className="py-4 px-4">
                        {log.projectLink ? (
                          <a 
                            href={log.projectLink.startsWith("http") ? log.projectLink : `https://${log.projectLink}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="bg-[#0e213b] hover:bg-[#12315b] border border-blue-500/30 text-blue-300 px-2.5 py-1 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition active:scale-95 whitespace-nowrap"
                            referrerPolicy="no-referrer"
                          >
                            Buka Link <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-600 italic text-[10px]">-</span>
                        )}
                      </td>

                      {/* Obstacles & Solutions */}
                      <td className="py-4 px-4 max-w-xs">
                        {log.obstacle ? (
                          <div className="space-y-1 text-[11px] font-sans">
                            <p className="text-rose-400 font-medium">⚠️ {log.obstacle}</p>
                            {log.solution && (
                              <p className="text-emerald-400 font-medium">💡 Solusi: {log.solution}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[10px]">Lancar Tanpa Kendala</span>
                        )}
                      </td>

                      {/* Paraf DUDI Quick Toggle Signature */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleDudiApproval(log.id, log.approvedByDudi)}
                          className={`text-[10px] px-3 py-1.5 rounded-full font-bold border transition ${
                            log.approvedByDudi 
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/35"
                              : "bg-slate-900 border-white/10 text-white/40 hover:border-emerald-500/30 hover:text-emerald-300"
                          }`}
                          title={log.approvedByDudi ? "Klik untuk membatalkan pengesahan DUDI" : "Klik untuk menandatangani (Paraf) DUDI"}
                        >
                          {log.approvedByDudi ? "✍️ Diparaf (YA)" : "Tandatangani"}
                        </button>
                      </td>

                      {/* Paraf Guru Coordinator Quick Toggle */}
                      <td className="py-4 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleTeacherApproval(log.id, log.approvedByTeacher)}
                          className={`text-[10px] px-3 py-1.5 rounded-full font-bold border transition ${
                            log.approvedByTeacher 
                              ? "bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/35"
                              : "bg-slate-900 border-white/10 text-white/40 hover:border-blue-500/30 hover:text-blue-300"
                          }`}
                          title={log.approvedByTeacher ? "Klik untuk membatalkan pengesahan Guru" : "Klik untuk mensahkan Monitoring Guru"}
                        >
                          {log.approvedByTeacher ? "⚖️ Disahkan (YA)" : "Tandatangani"}
                        </button>
                      </td>

                      {/* Edit Operations */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(log)}
                            className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-indigo-400 p-1.5 rounded-lg border border-white/10 cursor-pointer transition active:scale-95"
                            title="Edit Catatan Hari Ini"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm("Apakah Anda yakin ingin menghapus entri logbook harian ini?")) {
                                onDeleteLogbook(log.id);
                              }
                            }}
                            className="bg-white/5 hover:bg-rose-950/40 text-white/30 hover:text-rose-400 p-1.5 rounded-lg border border-white/10 cursor-pointer transition active:scale-95"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Insert & Edit Dialog Panel */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md font-sans">
          <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/45 px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#93c5fd]" />
                <h3 className="font-display font-bold text-sm text-white">
                  {editingLogId ? "Edit Rincian Catatan Logbook DKV" : "Tambah Catatan Laporan Harian DKV"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {/* Draft Recover Banner */}
              {draftExists && !editingLogId && (
                <div className="bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-300 font-sans animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-amber-400 animate-pulse flex-shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Draf Laporan Otomatis Ditemukan</p>
                      <p className="text-[10px] text-amber-400/80 leading-relaxed">Terdapat draf pengisian laporan harian belum selesai dari sesi sebelumnya.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={handleRestoreDraft}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition active:scale-95"
                    >
                      Pulihkan
                    </button>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-white/40 hover:text-white text-[10px] font-bold px-2 py-1"
                    >
                      Abaikan
                    </button>
                  </div>
                </div>
              )}

              {/* Active draft save status indicator */}
              {!editingLogId && (formStudentId || formActivity.trim() || formObstacle.trim() || formProjectLink.trim() || formSolution.trim() || formToolsRaw) ? (
                <div className="flex items-center justify-end">
                  <div className="flex items-center gap-1.5 text-[9.5px] text-emerald-400 font-mono bg-emerald-500/5 px-2.5 py-1 border border-emerald-500/15 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Autosave: Draf harian tersimpan aman di browser Anda</span>
                  </div>
                </div>
              ) : null}
              
              {/* Stud list context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Identitas Siswa DKV *</label>
                  <select
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    required
                    disabled={editingLogId !== null}
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-bold bg-[#131322]"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.className})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-white/70 block">Tanggal Laporan *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      required
                      className="w-full glass-input rounded-xl p-2.5 outline-none"
                    />
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-white/70 block">Hari Kegiatan</label>
                    <input
                      type="text"
                      value={formDay}
                      readOnly
                      placeholder="e.g. Kamis"
                      className="w-full glass-input rounded-xl p-2.5 outline-none bg-slate-900/50 text-indigo-300 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Description */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Deskripsi Proyek & Kegiatan Kerja Harian *</label>
                <textarea
                  rows={3}
                  value={formActivity}
                  onChange={(e) => setFormActivity(e.target.value)}
                  required
                  placeholder="Contoh: Merender video profil promosi instansi berdurasi 30 detik untuk di-posting ke Instagram. Merevisi tatanan audio lagu latar agar lebih sinematik..."
                  className="w-full glass-input rounded-xl p-3 outline-none"
                />
              </div>

              {/* Design Software / Tools Used */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white/70 block">Software / Perangkat Desain (Pemisah Koma)</label>
                  <span className="text-[10px] text-slate-500">Klik tag preset di bawah untuk pasang/lepas otomatis</span>
                </div>
                
                <input
                  type="text"
                  value={formToolsRaw}
                  onChange={(e) => setFormToolsRaw(e.target.value)}
                  placeholder="Contoh: Figma, Adobe Photoshop, Premiere Pro"
                  className="w-full glass-input rounded-xl p-2.5 outline-none font-bold text-indigo-300"
                />

                {/* Hot Presets buttons for effortless input */}
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {dkvToolsPreset.map(tool => {
                    const isActive = formToolsRaw.split(",").map(id => id.trim()).includes(tool);
                    return (
                      <button
                        type="button"
                        key={tool}
                        onClick={() => handleAppendToolTag(tool)}
                        className={`text-[9.5px] font-bold px-2 py-1 rounded transition cursor-pointer ${
                          isActive 
                            ? "bg-indigo-650 border border-indigo-500 text-white"
                            : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {isActive ? `✓ ${tool}` : `+ ${tool}`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Links Deliverable */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Tautan Link Hasil Kerja (Google Drive / Behance / Dribbble)</label>
                <input
                  type="text"
                  value={formProjectLink}
                  onChange={(e) => setFormProjectLink(e.target.value)}
                  placeholder="Contoh: behance.net/gallery/desain-saya"
                  className="w-full glass-input rounded-xl p-2.5 outline-none font-mono text-blue-300"
                />
              </div>

              {/* Obstacles & Solutions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Kendala Desain Teknologis (Jika Ada)</label>
                  <input
                    type="text"
                    value={formObstacle}
                    onChange={(e) => setFormObstacle(e.target.value)}
                    placeholder="Contoh: Macet saat proses color grading video"
                    className="w-full glass-input rounded-xl p-2.5 outline-none text-rose-300"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Solusi Penanganan Masalah</label>
                  <input
                    type="text"
                    value={formSolution}
                    onChange={(e) => setFormSolution(e.target.value)}
                    placeholder="Contoh: Mengaktifkan proxy file audio lebih ringan"
                    className="w-full glass-input rounded-xl p-2.5 outline-none text-emerald-300"
                  />
                </div>
              </div>

              {/* Validations approvals */}
              <div className="bg-slate-900/50 p-4.5 rounded-xl border border-white/5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="chk-dudi"
                    checked={formApprovedByDudi}
                    onChange={(e) => setFormApprovedByDudi(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded bg-[#101020] border-white/10 focus:ring-emerald-500"
                  />
                  <label htmlFor="chk-dudi" className="font-bold text-white/80 cursor-pointer select-none">
                    Bubuhkan Paraf Pembimbing DUDI
                  </label>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="chk-teacher"
                    checked={formApprovedByTeacher}
                    onChange={(e) => setFormApprovedByTeacher(e.target.checked)}
                    className="w-4 h-4 text-blue-500 rounded bg-[#101020] border-white/10 focus:ring-blue-500"
                  />
                  <label htmlFor="chk-teacher" className="font-bold text-white/80 cursor-pointer select-none">
                    Bubuhkan Paraf Guru Monitoring
                  </label>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer shadow-lg shadow-indigo-500/20 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Simpan Catatan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
