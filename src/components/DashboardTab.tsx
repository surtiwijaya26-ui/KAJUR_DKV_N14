import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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
  Award,
  FileSignature,
  Printer,
  FileText,
  Sparkles,
  RefreshCw,
  Brain,
  Briefcase,
  ThumbsUp,
  MapPin,
  Calendar,
  Send,
  Trash2
} from "lucide-react";
import { classifyActivity } from "./LogbookTab";

interface DashboardTabProps {
  students: Student[];
  companies: Company[];
  logbooks: LogbookEntry[];
  onTabChange: (tab: string) => void;
  onUpdateStudent?: (id: string, updated: Partial<Student>) => void;
}

export default function DashboardTab({ students, companies, logbooks, onTabChange, onUpdateStudent }: DashboardTabProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });

  // Chatbot state variables
  const [chatMessages, setChatMessages] = useState<{ id: string; role: "user" | "model"; text: string; mode?: string; timestamp: Date }[]>([
    {
      id: "initial",
      role: "model",
      text: "Halo! Saya adalah **SimPKL Chatbot**, asisten cerdas khusus PKL DKV di **SMK Negeri 14 Kabupaten Tangerang**.\n\nSilakan tanyakan kepada saya mengenai:\n* **Alur & Tahap PKL** (pendaftaran, persiapan, berkas administrasi)\n* **Kebijakan & Tata Tertib** (kehadiran, seragam, kedisiplinan, sanksi)\n* **Pengisian Jurnal Logbook harian** (tips deskripsi aktivitas, tools, approval)\n\nBagaimana saya bisa membantu pelaksanaan PKL Anda hari ini?",
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const chatEndRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInput.trim();
    if (!textToSend || isChatLoading) return;

    if (!presetText) {
      setChatInput("");
    }

    const userMsgId = Date.now().toString();
    const newUserMessage = {
      id: userMsgId,
      role: "user" as const,
      text: textToSend,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newUserMessage]);
    setIsChatLoading(true);
    setChatError(null);

    try {
      // Build history for Gemini format
      const historyPayload = chatMessages
        .filter(m => m.id !== "initial")
        .map(m => ({
          role: m.role,
          text: m.text
        }));

      // Pick student name for greeting context if available
      const firstStudent = students.length > 0 ? students[0] : null;

      const res = await fetch("/api/gemini/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
          studentName: firstStudent?.name || "Siswa DKV",
          className: firstStudent?.className || "XII DKV"
        })
      });

      if (!res.ok) {
        throw new Error("Gagal memperoleh respons dari server.");
      }

      const data = await res.json();
      const botMsgId = (Date.now() + 1).toString();

      setChatMessages(prev => [
        ...prev,
        {
          id: botMsgId,
          role: "model",
          text: data.text,
          mode: data.mode,
          timestamp: new Date()
        }
      ]);
    } catch (err: any) {
      console.error("Chatbot submission error:", err);
      setChatError(err.message || "Terdapat kendala jaringan.");
      setChatMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: "Maaf, koneksi saya ke server sedang terputus. Tetapi Anda dapat melihat panduan instalasi atau daftar peraturan PKL di dokumen utama sekolah.",
          mode: "Koneksi Offline Terputus",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatChatMessageText = (inputText: string) => {
    const lines = inputText.split("\n");
    return lines.map((line, lineIdx) => {
      let lineContent = line;
      let isListItem = false;
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ") || line.trim().startsWith("• ")) {
        isListItem = true;
        lineContent = line.replace(/^[\s]*[\*\-•]\s*/, "");
      }

      const parts = [];
      const regexBold = /\*\*([^*]+)\*\*/g;
      let match;
      let lastIndex = 0;

      while ((match = regexBold.exec(lineContent)) !== null) {
        const textBefore = lineContent.substring(lastIndex, match.index);
        if (textBefore) parts.push(textBefore);
        parts.push(<strong key={match.index} className="font-extrabold text-[#93c5fd]">{match[1]}</strong>);
        lastIndex = regexBold.lastIndex;
      }

      const textAfter = lineContent.substring(lastIndex);
      if (textAfter) parts.push(textAfter);

      const renderedLine = parts.length > 0 ? parts : lineContent;

      if (isListItem) {
        return (
          <li key={lineIdx} className="ml-4 list-disc pl-1 text-[11px] text-white/85 leading-relaxed">
            {renderedLine}
          </li>
        );
      } else {
        return (
          <p key={lineIdx} className="text-[11.5px] text-white/85 leading-relaxed mb-1.5 min-h-[0.5em]">
            {renderedLine}
          </p>
        );
      }
    });
  };

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // AI analysis states with localStorage persistence & loading states
  const [aiAnalysis, setAiAnalysis] = useState<{
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    mode?: string;
  } | null>(() => {
    const saved = localStorage.getItem("pkl_ai_analysis_cache");
    return saved ? JSON.parse(saved) : null;
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const runAiAnalysis = async (force: boolean = false) => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/gemini/analyze-productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, logbooks }),
      });
      if (!res.ok) {
        throw new Error("Gagal mengambil data dari server (status " + res.status + ")");
      }
      const data = await res.json();
      setAiAnalysis(data);
      localStorage.setItem("pkl_ai_analysis_cache", JSON.stringify(data));
    } catch (err: any) {
      console.error("Analysis loading error:", err);
      setAiError(err.message || "Terdapat kendala koneksi.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!aiAnalysis) {
      runAiAnalysis(false);
    }
  }, []);

  // Placement Prediction States
  const unassignedStudents = students.filter(s => s.status === 'Unassigned');
  const [predictions, setPredictions] = useState<any[]>(() => {
    const saved = localStorage.getItem("pkl_placement_predictions_cache");
    return saved ? JSON.parse(saved) : [];
  });
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictError, setPredictError] = useState<string | null>(null);
  const [activePredictStudentId, setActivePredictStudentId] = useState<string>("");
  const [predictionMode, setPredictionMode] = useState<string>(() => {
    return localStorage.getItem("pkl_placement_predictions_mode") || "Undetermined";
  });

  const runPlacementPrediction = async () => {
    setIsPredicting(true);
    setPredictError(null);
    try {
      const resp = await fetch("/api/gemini/predict-placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students, companies }),
      });
      if (!resp.ok) throw new Error(`Koneksi server bermasalah (Status: ${resp.status})`);
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      setPredictions(data.predictions || []);
      setPredictionMode(data.mode || "Gemini AI Predictive Match");
      localStorage.setItem("pkl_placement_predictions_cache", JSON.stringify(data.predictions || []));
      localStorage.setItem("pkl_placement_predictions_mode", data.mode || "Gemini AI Predictive Match");
      
      if (data.predictions?.length > 0) {
        setActivePredictStudentId(data.predictions[0].studentId);
      }
    } catch (err: any) {
      console.error("Gagal menjalankan prediksi penempatan AI:", err);
      setPredictError(err.message || "Gagal menghubungi layanan kecerdasan buatan.");
    } finally {
      setIsPredicting(false);
    }
  };

  useEffect(() => {
    if (unassignedStudents.length > 0 && (!predictions || predictions.length === 0)) {
      runPlacementPrediction();
    } else if (predictions && predictions.length > 0) {
      const firstValid = predictions.find(p => unassignedStudents.some(s => s.id === p.studentId));
      if (firstValid) {
        setActivePredictStudentId(firstValid.studentId);
      } else if (unassignedStudents.length > 0) {
        setActivePredictStudentId(unassignedStudents[0].id);
      }
    }
  }, [students]);

  const handleAssignCompany = (studentId: string, companyId: string, companyName: string) => {
    if (!onUpdateStudent) return;
    const confirmAssign = window.confirm(`Apakah Anda yakin ingin melakukan proses penempatan siswa ke ${companyName}?`);
    if (confirmAssign) {
      onUpdateStudent(studentId, {
        companyId: companyId,
        status: "Ongoing",
        pklStartDate: new Date().toISOString().split('T')[0]
      });
      alert(`Siswa berhasil ditempatkan di ${companyName}!`);
      
      const updatedPreds = predictions.filter(p => p.studentId !== studentId);
      setPredictions(updatedPreds);
      localStorage.setItem("pkl_placement_predictions_cache", JSON.stringify(updatedPreds));
      if (updatedPreds.length > 0) {
        setActivePredictStudentId(updatedPreds[0].studentId);
      } else {
        setActivePredictStudentId("");
      }
    }
  };

  // KPI Target states with localStorage persistence
  const [weeklyTarget, setWeeklyTarget] = useState<number>(() => {
    const saved = localStorage.getItem("pkl_kpi_weekly_target");
    return saved ? parseInt(saved, 10) : 5;
  });

  const [totalWeeksTarget, setTotalWeeksTarget] = useState<number>(() => {
    const saved = localStorage.getItem("pkl_kpi_total_weeks");
    return saved ? parseInt(saved, 10) : 12;
  });

  const [customWeeklyTargets, setCustomWeeklyTargets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("pkl_student_custom_weekly_targets");
    return saved ? JSON.parse(saved) : {};
  });

  // State untuk Jadwal PKL & Kalender Timeline
  const [scheduleViewMode, setScheduleViewMode] = useState<"calendar" | "timeline" | "list">("calendar");
  const [scheduleMonth, setScheduleMonth] = useState<number>(5); // 0 = Jan, 5 = Juni (Juni 2026 default)
  const [scheduleYear, setScheduleYear] = useState<number>(2026);
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState("");
  const [scheduleClassFilter, setScheduleClassFilter] = useState<string>("ALL");
  const [editingScheduleStudentId, setEditingScheduleStudentId] = useState<string | null>(null);
  const [editingStartDate, setEditingStartDate] = useState("");
  const [editingEndDate, setEditingEndDate] = useState("");

  const [inactivityThreshold, setInactivityThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("pkl_kpi_inactivity_threshold");
    return saved ? parseInt(saved, 10) : 3;
  });

  const [endPklThreshold, setEndPklThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("pkl_end_warning_threshold");
    return saved ? parseInt(saved, 10) : 7;
  });

  const handleEndPklThresholdChange = (val: number) => {
    const clampedVal = Math.max(1, Math.min(30, val));
    setEndPklThreshold(clampedVal);
    localStorage.setItem("pkl_end_warning_threshold", clampedVal.toString());
  };

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

  const handleStudentTargetChange = (studentId: string, val: number) => {
    const clampedVal = Math.max(1, Math.min(7, val));
    const nextTargets = { ...customWeeklyTargets, [studentId]: clampedVal };
    setCustomWeeklyTargets(nextTargets);
    localStorage.setItem("pkl_student_custom_weekly_targets", JSON.stringify(nextTargets));
  };

  const handleInactivityThresholdChange = (val: number) => {
    const clampedVal = Math.max(1, Math.min(14, val));
    setInactivityThreshold(clampedVal);
    localStorage.setItem("pkl_kpi_inactivity_threshold", clampedVal.toString());
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
    const studentWeeklyTarget = customWeeklyTargets[student.id] || weeklyTarget;
    const cumulativeTarget = effectiveWeeks * studentWeeklyTarget;
    const overallFinalTarget = totalWeeksTarget * studentWeeklyTarget;

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

  // Average progress percentage of logbooks computation for active (ongoing) students
  const activeOngoingStudentsList = students.filter(s => s.status === 'Ongoing');
  let avgLogbookProgress = 0;
  if (activeOngoingStudentsList.length > 0) {
    const totalProgressSum = activeOngoingStudentsList.reduce((acc, student) => {
      const { cumulativeProgress } = getStudentKpiData(student);
      return acc + cumulativeProgress;
    }, 0);
    avgLogbookProgress = Math.round(totalProgressSum / activeOngoingStudentsList.length);
  }

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

  // Helper to calculate working days (Mon-Fri) between two Dates
  const getWorkingDaysDiff = (startDate: Date, endDate: Date): number => {
    if (startDate > endDate) return 0;
    
    let count = 0;
    const curDate = new Date(startDate.getTime());
    curDate.setHours(12, 0, 0, 0);
    
    const targetDate = new Date(endDate.getTime());
    targetDate.setHours(12, 0, 0, 0);
    
    while (curDate < targetDate) {
      curDate.setDate(curDate.getDate() + 1);
      const day = curDate.getDay();
      if (day !== 0 && day !== 6) { // Skip Sunday (0) and Saturday (6)
        count++;
      }
    }
    return count;
  };

  // Find active students (Ongoing) whose logbooks have no updates for > inactivityThreshold working days
  const inactiveOngoingStudents = students
    .filter(s => s.status === 'Ongoing')
    .map(student => {
      const studentLogs = logbooks.filter(l => l.studentId === student.id);
      const company = companies.find(c => c.id === student.companyId);
      
      if (studentLogs.length === 0) {
        let workingDaysSinceStart = inactivityThreshold + 1; // default warning of > inactivityThreshold working days if never log
        let calendarDaysSinceStart = 6;
        if (student.pklStartDate) {
          const startDate = new Date(student.pklStartDate);
          if (!isNaN(startDate.getTime())) {
            workingDaysSinceStart = getWorkingDaysDiff(startDate, referenceDate);
            const diffMs = referenceDate.getTime() - startDate.getTime();
            calendarDaysSinceStart = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
          }
        }
        return {
          student,
          companyName: company ? company.name : "Industri Mandiri",
          latestLog: null,
          daysSinceUpdate: workingDaysSinceStart,
          calendarDays: calendarDaysSinceStart,
          lastDateStr: "Belum Pernah"
        };
      }
      
      const sortedLogs = [...studentLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestLog = sortedLogs[0];
      const lastLogDate = new Date(latestLog.date);
      
      const workingDaysSinceUpdate = getWorkingDaysDiff(lastLogDate, referenceDate);
      const diffMs = referenceDate.getTime() - lastLogDate.getTime();
      const calendarDaysSinceUpdate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      
      return {
        student,
        companyName: company ? company.name : "Industri Mandiri",
        latestLog,
        daysSinceUpdate: workingDaysSinceUpdate,
        calendarDays: calendarDaysSinceUpdate,
        lastDateStr: latestLog.date
      };
    })
    .filter(item => item.daysSinceUpdate > inactivityThreshold)
    .sort((a, b) => b.daysSinceUpdate - a.daysSinceUpdate);

  // Find students whose PKL end date is close to referenceDate
  const endingSoonStudents = students
    .filter(s => s.status === 'Ongoing' && s.pklEndDate)
    .map(student => {
      const company = companies.find(c => c.id === student.companyId);
      const endDate = new Date(student.pklEndDate!);
      
      // Calculate calendar days left until end date relative to referenceDate
      const diffTime = endDate.getTime() - referenceDate.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        student,
        companyName: company ? company.name : "Industri Mandiri",
        remainingDays,
        endDateStr: student.pklEndDate!
      };
    })
    .filter(item => item.remainingDays <= endPklThreshold)
    .sort((a, b) => a.remainingDays - b.remainingDays);

  // Find students whose status is 'Unassigned' for more than 14 days
  const unassignedOver14Days = students
    .filter(s => s.status === 'Unassigned')
    .map(student => {
      let startDateStr = student.unassignedStartDate;
      if (!startDateStr && student.id === 'stud-6') {
        startDateStr = "2026-05-20"; // Fallback default for existing unassigned student
      }
      
      const startDate = startDateStr ? new Date(startDateStr) : referenceDate;
      const diffTime = referenceDate.getTime() - startDate.getTime();
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      
      return {
        student,
        unassignedDays: diffDays,
        unassignedSince: startDateStr || "Belum terekam"
      };
    })
    .filter(item => item.unassignedDays > 14)
    .sort((a, b) => b.unassignedDays - a.unassignedDays);

  // -------------------------------------------------------------
  // DKV Department Class-by-Class Breakdown Calculations
  // -------------------------------------------------------------
  const classesList = Array.from(new Set(students.map(s => s.className)));
  const classBreakdown = classesList.map(className => {
    const classStudents = students.filter(s => s.className === className);
    const total = classStudents.length;
    const unassignedCount = classStudents.filter(s => s.status === 'Unassigned').length;
    const pendingCount = classStudents.filter(s => s.status === 'Pending').length;
    const ongoingCount = classStudents.filter(s => s.status === 'Ongoing').length;
    const completedCount = classStudents.filter(s => s.status === 'Completed').length;
    
    const placedCount = ongoingCount + completedCount;
    const placementRate = total > 0 ? Math.round((placedCount / total) * 100) : 0;
    
    // Average progress percentage of logbooks computation for active (ongoing) students
    const ongoingStudentsInClass = classStudents.filter(s => s.status === 'Ongoing');
    let classAvgProgress = 0;
    if (ongoingStudentsInClass.length > 0) {
      const sum = ongoingStudentsInClass.reduce((acc, student) => {
        const { cumulativeProgress } = getStudentKpiData(student);
        return acc + cumulativeProgress;
      }, 0);
      classAvgProgress = Math.round(sum / ongoingStudentsInClass.length);
    } else if (completedCount > 0) {
      classAvgProgress = 100;
    }
    
    return {
      className,
      total,
      unassigned: unassignedCount,
      pending: pendingCount,
      ongoing: ongoingCount,
      completed: completedCount,
      placementRate,
      avgProgress: classAvgProgress
    };
  }).sort((a, b) => a.className.localeCompare(b.className));

  // -------------------------------------------------------------
  // Department Total Logbook Category trend counts
  // -------------------------------------------------------------
  const getDepartmentCategoryStats = () => {
    const categoriesList = [
      { name: "UI/UX & Web Design", color: "#6366f1" },
      { name: "Video & Motion Editing", color: "#a855f7" },
      { name: "Graphic Design & Branding", color: "#3b82f6" },
      { name: "Photography & Cameraman", color: "#14b8a6" },
      { name: "Illustration & Digital Art", color: "#f59e0b" }
    ];

    const counts: Record<string, number> = {
      "UI/UX & Web Design": 0,
      "Video & Motion Editing": 0,
      "Graphic Design & Branding": 0,
      "Photography & Cameraman": 0,
      "Illustration & Digital Art": 0
    };

    let totalCount = 0;
    logbooks.forEach(log => {
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

  const deptCategoryStats = getDepartmentCategoryStats();

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
              onClick={() => setIsPrintModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              Cetak Laporan Rekapitulasi
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

      {/* Pengingat Otomatis Siswa Unassigned > 14 Hari */}
      {unassignedOver14Days.length > 0 && (
        <div className="glass-panel p-5.5 rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] relative overflow-hidden animate-fade-in" id="dashboard-unassigned-warning-panel">
          <div className="absolute top-0 right-0 w-80 h-24 bg-rose-500/[0.03] blur-[65px] pointer-events-none rounded-full" />
          
          <div className="flex items-start gap-4">
            <div className="bg-rose-500/15 text-rose-400 p-2.5 rounded-xl border border-rose-500/30 shrink-0 shadow-lg shadow-rose-500/10">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            
            <div className="space-y-3.5 flex-1 min-w-0">
              <div>
                <h4 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  Peringatan Khusus Hubinmas: Penundaan Penempatan PKL DKV
                  <span className="bg-rose-500/25 text-rose-300 font-mono text-[9px] font-black px-2 py-0.5 rounded border border-rose-500/35 animate-bounce">
                    {unassignedOver14Days.length} Siswa Terlambat
                  </span>
                </h4>
                <p className="text-white/50 text-[11px] leading-relaxed mt-0.5 font-sans">
                  Daftar siswa tingkat akhir DKV aktif yang belum mendapatkan mitra dunia usaha/dunia industri (DUDI) untuk PKL dalam waktu lebih dari 14 hari sejak rilis awal pendataan. Segera ambil tindakan penempatan preventif.
                </p>
              </div>

              {/* Grid or List of unassigned students */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {unassignedOver14Days.map(({ student, unassignedDays }) => (
                  <div 
                    key={student.id} 
                    className="p-3 bg-slate-950/50 border border-rose-500/10 rounded-xl flex flex-col justify-between gap-2 hover:border-rose-500/25 transition-all font-sans"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-bold text-xs text-white truncate">{student.name}</span>
                        <span className="bg-rose-500/15 text-rose-400 font-mono text-[8.5px] font-bold px-1.5 py-0.5 rounded border border-rose-500/20 shrink-0 select-none">
                          {unassignedDays} hari
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        Kelas {student.className} • NIS {student.nis}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between gap-2">
                      <span className="text-[9px] text-slate-500 italic">PKL unassigned idle</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActivePredictStudentId(student.id);
                          setTimeout(() => {
                            document.getElementById("dashboard-ai-predict-placement")?.scrollIntoView({ behavior: "smooth" });
                          }, 100);
                        }}
                        className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 hover:border-indigo-500/30 text-[9px] font-black px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-2.5 h-2.5" />
                        Plot Mitra AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time KPI Overview Section (Indikator Kinerja Utama Program Studi DKV) */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 bg-slate-950/40 shadow-2xl space-y-6" id="departmental-kpi-overview">
        <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm tracking-wide text-white uppercase flex items-center gap-2">
                Ikhtisar KPI Departemen <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded border border-indigo-500/20 normal-case font-normal">Real-time</span>
              </h3>
              <p className="text-white/50 text-[11px]">
                Statistik real-time kinerja & kedisiplinan pembelajaran industri (PKL) Program Studi Desain Komunikasi Visual (DKV).
              </p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest shrink-0 py-1 px-2.5 bg-white/5 rounded-lg border border-white/5">
            Aktif Sekarang
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* KPI 1: Active Ongoing Students */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
              <Users className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animate-duration-1000" />
                  <span className="text-[10px] text-white/60 font-mono uppercase tracking-wider">Siswa Aktif PKL</span>
                </div>
                <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">Ongoing</span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-5xl font-black text-white tracking-tight" id="kpi-val-active">{ongoing}</span>
                <span className="text-xs text-white/40">Siswa (Ongoing)</span>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>Tingkat Penempatan Kerja:</span>
                  <span>{totalStudents > 0 ? Math.round((ongoing / totalStudents) * 100) : 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-550 to-indigo-500 transition-all duration-500" 
                    style={{ width: `${totalStudents > 0 ? Math.round((ongoing / totalStudents) * 100) : 0}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/40 italic leading-relaxed pt-1">
                Total siswa yang saat ini aktif belajar & melapor di industri terafiliasi.
              </p>
            </div>
          </div>

          {/* KPI 2: Average Logbook Progress Percentage */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-32 h-32 text-indigo-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] text-white/60 font-mono uppercase tracking-wider">Disiplin Logbook</span>
                </div>
                <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Progress</span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-5xl font-black text-indigo-300 tracking-tight animate-pulse" id="kpi-val-progress">{avgLogbookProgress}%</span>
                <span className="text-xs text-white/40">Rerata Penyelesaian</span>
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] text-white/50 font-mono">
                  <span>Indikator Konsistensi Kelas:</span>
                  <span className="text-indigo-350">{avgLogbookProgress >= 85 ? "SANGAT DISIPLIN" : avgLogbookProgress >= 50 ? "CUKUP AKTIF" : "PERLU PERHATIAN"}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" 
                    style={{ width: `${avgLogbookProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-[10px] text-white/40 italic leading-relaxed pt-1">
                Rata-rata kedisiplinan pengisian logbook harian terhadap target kumulatif siswa aktif.
              </p>
            </div>
          </div>

          {/* KPI 3: Pending Document Generation Counts */}
          <div className="bg-slate-900/50 p-5 rounded-2xl border border-white/5 hover:border-indigo-500/20 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform">
              <FileSignature className="w-32 h-32 text-amber-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-[10px] text-white/60 font-mono uppercase tracking-wider">Dokumen Tertunda</span>
                </div>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Pending Action</span>
              </div>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-5xl font-black text-amber-300 tracking-tight" id="kpi-val-pending-docs">{unassigned + pending}</span>
                <span className="text-xs text-white/40">Siswa Tertunda</span>
              </div>
              <div className="space-y-1 pt-1 text-[10px] text-white/60">
                <div className="flex justify-between border-b border-white/5 pb-1 select-none">
                  <span>Menunggu Persetujuan HRD:</span>
                  <span className="font-mono font-bold text-amber-405">{pending} siswa</span>
                </div>
                <div className="flex justify-between pt-1 select-none">
                  <span>Belum Diplot Perusahaan:</span>
                  <span className="font-mono font-bold text-slate-300">{unassigned} siswa</span>
                </div>
              </div>
              <p className="text-[10px] text-white/40 italic leading-relaxed pt-0.5">
                Jumlah berkas (Surat Pengantar, Biodata, BYOD) yang tertunda/perlu digenerate atau disetujui.
              </p>
            </div>
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

      {/* Dual Real-Time Alert & Notification Console */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6" id="dashboard-notif-system">
        
        {/* Subtle Logbook Alert Notification System */}
        <div 
          className={`rounded-2xl p-5 border transition-all ${
            inactiveOngoingStudents.length > 0 
              ? "bg-rose-500/5 hover:bg-rose-500/10 border-rose-500/15" 
              : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/15"
          }`}
          id="logbook-alert-panel"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3.5 border-b border-white/5">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className={`p-2 rounded-lg mt-0.5 sm:mt-0 ${
                inactiveOngoingStudents.length > 0 
                  ? "bg-rose-500/10 text-rose-400" 
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                <Bell className={`w-4 h-4 ${inactiveOngoingStudents.length > 0 ? "animate-bounce" : ""}`} />
              </div>
              <div>
                <h3 className="font-display font-medium text-sm text-white flex flex-wrap items-center gap-2">
                  Sistem Notifikasi Pengawasan Hari Kerja PKL
                  {inactiveOngoingStudents.length > 0 && (
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {inactiveOngoingStudents.length} Terlambat ({'>'} {inactivityThreshold} Hari Kerja)
                    </span>
                  )}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                  Memberikan peringatan otomatis bagi siswa aktif yang tidak mengisi laporan harian lebih dari <strong className="text-rose-400">{inactivityThreshold} Hari Kerja</strong> (Akurasi tinggi, tidak menghitung hari Sabtu & Minggu).
                </p>
              </div>
            </div>

            {/* Threshold adjustment controls */}
            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 border border-white/10 rounded-xl" id="inactivity-threshold-config">
              <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold ml-1 font-sans">Batas Toleransi:</span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => handleInactivityThresholdChange(inactivityThreshold - 1)}
                  className="w-5.5 h-5.5 bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 rounded-lg flex items-center justify-center font-black text-xs transition cursor-pointer select-none"
                  title="Kurangi batas toleransi hari kerja"
                >
                  -
                </button>
                <input
                  type="number"
                  value={inactivityThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      handleInactivityThresholdChange(val);
                    }
                  }}
                  min="1"
                  max="14"
                  className="w-10 bg-black/40 border border-white/10 text-center text-xs font-black text-white rounded-lg py-0.5 outline-none focus:border-indigo-500 transition-colors"
                  title="Batas tidak mengisi (hari kerja)"
                />
                <button
                  type="button"
                  onClick={() => handleInactivityThresholdChange(inactivityThreshold + 1)}
                  className="w-5.5 h-5.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 rounded-lg flex items-center justify-center font-black text-xs transition cursor-pointer select-none"
                  title="Tambah batas toleransi hari kerja"
                >
                  +
                </button>
                <span className="text-[10px] text-white/40 font-sans ml-1 select-none pr-1">hari kerja</span>
              </div>
            </div>
          </div>

          {inactiveOngoingStudents.length === 0 ? (
            <div className="flex items-center gap-3 pt-3.5 text-xs text-emerald-300 font-sans">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold">Semua Siswa Aktif PKL Disiplin Laporan</p>
                <p className="text-white/40 text-[11px] leading-relaxed">
                  Tidak ada siswa yang terlambat mengisi logbook lebih dari {inactivityThreshold} hari kerja terakhir. Kinerja disiplin DKV terpantau 100% sempurna!
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pt-4 max-h-[360px] overflow-y-auto pr-1">
              {inactiveOngoingStudents.map(({ student, companyName, daysSinceUpdate, calendarDays, lastDateStr }) => {
                const waPhone = student.phone.startsWith("0") ? "62" + student.phone.slice(1) : student.phone;
                const waText = `Halo ${student.name}, saya Ibu Surti Wijaya selaku Kajur DKV ingin mengingatkan bahwa logbook laporan PKL harian kamu sudah ${daysSinceUpdate} hari kerja belum diisi. Mohon segera dilengkapi ya. Terima kasih!`;
                const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
                 
                const mailSubject = `SMK Negeri 14 Tangerang - Peringatan Pengisian Logbook PKL`;
                const mailBody = `Yth. ${student.name},\n\nBerdasarkan hasil pantauan sistem DKV SMKN 14 Kabupaten Tangerang, Anda tercatat belum memperbaharui logbook aktivitas harian PKL selama ${daysSinceUpdate} hari kerja terakhir (total ${calendarDays} hari kalender).\n\nTerakhir update pada: ${lastDateStr}\n\nMohon untuk segera melengkapi draf logbook harian Anda pada sistem agar pembimbing industri & Kajur dapat melakukan validasi secara real-time.\n\nSalam hangat,\nSurti wijaya, S.Kom., Gr.\nKepala Program Studi DKV`;
                const mailUrl = `mailto:${student.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

                const isVeryLate = daysSinceUpdate >= 5;

                return (
                  <div 
                    key={student.id} 
                    className="bg-white/5 border border-white/10 hover:border-white/15 p-4 rounded-xl flex items-start gap-3 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute right-2 -bottom-2 text-[48px] font-extrabold font-mono text-white/[0.02] select-none pointer-events-none">
                      ALERT
                    </div>

                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      isVeryLate 
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-400" 
                        : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                    }`}>
                      {student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>

                    <div className="space-y-2 flex-grow min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-white truncate">{student.name}</h4>
                          <span className={`text-[10px] font-extrabold font-sans flex-shrink-0 px-2 py-0.5 rounded-full ${
                            isVeryLate 
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/25" 
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                          }`}>
                            {daysSinceUpdate} hari kerja terlambat
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 truncate">Kelas: {student.className} • {companyName}</p>
                        <p className="text-[9.5px] text-white/40 font-mono mt-0.5">
                          Terakhir Update: <strong className="text-white/60">{lastDateStr}</strong> 
                          <span className="text-white/30"> ({calendarDays} hari kalender yang lalu)</span>
                        </p>
                      </div>

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

        {/* Dynamic PKL End Date Warning Alert Panel */}
        <div 
          className={`rounded-2xl p-5 border transition-all ${
            endingSoonStudents.length > 0 
              ? "bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/15" 
              : "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/15"
          }`}
          id="pkl-end-date-warning-panel"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3.5 border-b border-white/5">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className={`p-2 rounded-lg mt-0.5 sm:mt-0 ${
                endingSoonStudents.length > 0 
                  ? "bg-amber-500/10 text-amber-400" 
                  : "bg-emerald-500/10 text-emerald-400"
              }`}>
                <Clock className={`w-4 h-4 ${endingSoonStudents.length > 0 ? "animate-pulse text-amber-400" : ""}`} />
              </div>
              <div>
                <h3 className="font-display font-medium text-sm text-white flex flex-wrap items-center gap-2">
                  Sistem Notifikasi Batas Akhir PKL
                  {endingSoonStudents.length > 0 && (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                      {endingSoonStudents.length} Siswa Mendekati Akhir
                    </span>
                  )}
                </h3>
                <p className="text-xs text-white/50 leading-relaxed max-w-xl">
                  Memantau sisa kalender siswa PKL sebelum penarikan resmi dan penerbitan lembar sertifikat industri.
                </p>
              </div>
            </div>

            {/* Threshold configuration controls */}
            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 border border-white/10 rounded-xl" id="end-warning-threshold-config">
              <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold ml-1 font-sans">Batas Warning:</span>
              <div className="flex items-center gap-1 font-mono">
                <button
                  type="button"
                  onClick={() => handleEndPklThresholdChange(endPklThreshold - 1)}
                  className="w-5.5 h-5.5 bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 border border-white/10 rounded-lg flex items-center justify-center font-black text-xs transition cursor-pointer select-none"
                  title="Kurangi batas waktu peringatan"
                >
                  -
                </button>
                <input
                  type="number"
                  value={endPklThreshold}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) {
                      handleEndPklThresholdChange(val);
                    }
                  }}
                  min="1"
                  max="30"
                  className="w-10 bg-black/40 border border-white/10 text-center text-xs font-black text-white rounded-lg py-0.5 outline-none focus:border-indigo-500 transition-colors"
                  title="Batas peringatan (hari kalender)"
                />
                <button
                  type="button"
                  onClick={() => handleEndPklThresholdChange(endPklThreshold + 1)}
                  className="w-5.5 h-5.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-300 border border-white/10 rounded-lg flex items-center justify-center font-black text-xs transition cursor-pointer select-none"
                  title="Tambah batas waktu peringatan"
                >
                  +
                </button>
                <span className="text-[10px] text-white/40 font-sans ml-1 select-none pr-1">hari</span>
              </div>
            </div>
          </div>

          {endingSoonStudents.length === 0 ? (
            <div className="flex items-center gap-3 pt-3.5 text-xs text-emerald-300 font-sans">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="font-bold">Masa PKL Terjadwal Berjalan Lancar</p>
                <p className="text-white/40 text-[11px] leading-relaxed">
                  Tidak ada siswa aktif (Ongoing) yang mendekati batas waktu penarikan PKL kurang dari {endPklThreshold} hari ke depan.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 pt-4 max-h-[360px] overflow-y-auto pr-1">
              {endingSoonStudents.map(({ student, companyName, remainingDays, endDateStr }) => {
                const waPhone = student.phone.startsWith("0") ? "62" + student.phone.slice(1) : student.phone;
                const waText = `Halo ${student.name}, saya Ibu Surti Wijaya selaku Kajur DKV ingin mengingatkan bahwa masa PKL kamu di ${companyName} mendekati akhir dan akan selesai pada tanggal ${endDateStr}. Mohon persiapkan pelaporan akhir dan berkas sertifikasi PKL Anda. Terima kasih!`;
                const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;
                 
                const mailSubject = `SMK Negeri 14 Tangerang - Peringatan Batas Akhir PKL DKV`;
                const mailBody = `Yth. ${student.name},\n\nBerdasarkan pantauan periodis sistem draf kependidikan SMK Negeri 14 Tangerang, Anda tercatat akan segera menyelesaikan program PKL di industri ${companyName} pada tanggal: \n\nTanggal Berakhir: ${endDateStr} (${remainingDays <= 0 ? 'Hari Ini / Selesai' : `${remainingDays} Hari Lagi`})\n\nMohon pastikan Anda mengisi penuh seluruh lembaran logbook harian Anda pada sistem dan mulai mengoordinasikan laporan pertanggungjawaban karya dengan mentor perusahaan.\n\nSalam hangat,\nSurti wijaya, S.Kom., Gr.\nKepala Program Studi DKV`;
                const mailUrl = `mailto:${student.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;

                const isOverdue = remainingDays < 0;
                const isToday = remainingDays === 0;

                return (
                  <div 
                    key={student.id} 
                    className="bg-white/5 border border-white/10 hover:border-white/15 p-4 rounded-xl flex items-start gap-3 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute right-2 -bottom-2 text-[48px] font-extrabold font-mono text-white/[0.015] select-none pointer-events-none">
                      END_PKL
                    </div>

                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                      isOverdue 
                        ? "bg-rose-500/20 border border-rose-500/30 text-rose-450" 
                        : isToday 
                          ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 animate-pulse"
                          : "bg-amber-500/20 border border-amber-500/30 text-amber-400"
                    }`}>
                      {student.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>

                    <div className="space-y-2 flex-grow min-w-0">
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-xs text-white truncate">{student.name}</h4>
                          <span className={`text-[10px] font-extrabold font-sans flex-shrink-0 px-2 py-0.5 rounded-full ${
                            isOverdue 
                              ? "bg-rose-500/15 text-rose-300 border border-rose-500/25" 
                              : isToday 
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/25"
                          }`}>
                            {isOverdue 
                              ? `Lewat ${Math.abs(remainingDays)} hari` 
                              : isToday 
                                ? "Berakhir Hari Ini" 
                                : `Sisa ${remainingDays} Hari`
                            }
                          </span>
                        </div>
                        <p className="text-[10px] text-white/50 truncate">Kelas: {student.className} • {companyName}</p>
                        <p className="text-[9.5px] text-white/40 font-mono mt-0.5">
                          Tanggal Selesai: <strong className="text-white/60">{endDateStr}</strong> 
                        </p>
                      </div>

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
                          title="Hubungi via Email"
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

      </div>

      {/* AI Placement Prediction Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/15 bg-slate-900/45 relative overflow-hidden animate-fade-in mb-6" id="dashboard-ai-predict-placement">
        <div className="absolute top-0 right-0 w-96 h-32 bg-indigo-500/10 blur-[80px] pointer-events-none rounded-full" />
        
        {/* Header with Title and Action Button */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-display font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                Rekomendasi Prediksi Penempatan Mitra AI Gemini
                <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/25 lowercase font-mono">
                  {predictionMode}
                </span>
              </h4>
              <p className="text-white/50 text-[11px] leading-relaxed">
                Menganalisis kemiripan minat keahlian DKV, highlights portofolio karya, sisa kuota, dan kepatuhan logbook historis.
              </p>
            </div>
          </div>
          
          {unassignedStudents.length > 0 && (
            <button
              type="button"
              disabled={isPredicting}
              onClick={() => runPlacementPrediction()}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-550 hover:to-indigo-450 disabled:from-indigo-950 disabled:to-indigo-900 border border-indigo-500/20 text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl transition shadow-lg shadow-indigo-500/15 flex items-center gap-1.5 cursor-pointer"
            >
              {isPredicting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Mengerjakan Kalkulator Hubin...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  Simulasikan Peta Penempatan Baru
                </>
              )}
            </button>
          )}
        </div>

        {/* Display predicted results */}
        {unassignedStudents.length === 0 ? (
          <div className="p-5.5 bg-slate-950/40 rounded-2xl border border-emerald-500/15 text-xs font-sans flex flex-col sm:flex-row items-center gap-4.5">
            <div className="p-3.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <ThumbsUp className="w-6 h-6 shrink-0" />
            </div>
            <div className="space-y-1.5 text-center sm:text-left">
              <p className="font-black text-slate-100 text-sm">Semua Siswa Terbimbing Telah Ditempatkan! 🎉</p>
              <p className="text-white/55 text-[11px] leading-relaxed max-w-2xl">
                Tidak ditemukan siswa aktif yang berstatus Belum Penempatan (<strong className="text-emerald-400">Unassigned</strong>) saat ini. 
                Unit Hubinmas dan Kaprog DKV SMKN 14 Kabupaten Tangerang mencatatkan pencapaian luar biasa dengan penyerapan magang 100%!
              </p>
            </div>
          </div>
        ) : predictError ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-xs">
            <p className="text-rose-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Gagal Memuat Prediksi Penempatan AI
            </p>
            <p className="text-white/60 text-[11.5px] leading-relaxed">{predictError}</p>
            <button 
              onClick={() => runPlacementPrediction()} 
              className="px-4 py-1.5 bg-rose-500/25 hover:bg-rose-500/35 border border-rose-500/20 text-white font-bold text-[10px] rounded-lg transition mt-1 cursor-pointer"
            >
              Ulangi Prediksi
            </button>
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl space-y-3 max-w-lg mx-auto bg-slate-950/20">
            <Brain className="w-9 h-9 text-indigo-400/40 mx-auto animate-pulse" />
            <div className="space-y-1">
              <p className="text-slate-305 font-bold text-xs">Analisis Prediksi Siap Dijalankan</p>
              <p className="text-white/40 text-[10.5px] max-w-sm mx-auto leading-relaxed px-4">
                Sistem mendeteksi ada {unassignedStudents.length} siswa yang belum mendapatkan plot industri. AI Gemini siap mengkalkulasi kecocokan mitra optimal.
              </p>
            </div>
            <button
              type="button"
              disabled={isPredicting}
              onClick={() => runPlacementPrediction()}
              className="bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 text-[10.5px] font-black px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Mulai Analisis Prediksi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
            
            {/* Left side: List of unassigned students */}
            <div className="lg:col-span-4 space-y-2.5">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black flex items-center justify-between">
                <span>Daftar Siswa ({unassignedStudents.length})</span>
                <span className="text-indigo-400 select-none">Klik untuk melihat</span>
              </div>
              
              <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 select-none">
                {unassignedStudents.map(student => {
                  const isActive = student.id === activePredictStudentId;
                  const hasPred = predictions.some(p => p.studentId === student.id);
                  return (
                    <button
                      type="button"
                      key={student.id}
                      onClick={() => setActivePredictStudentId(student.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-indigo-500/15 border-indigo-500/40 text-white shadow-md shadow-indigo-550/5"
                          : "bg-white/[0.02] border-white/5 hover:border-white/10 text-white/70"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate">{student.name}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">NIS: {student.nis} • {student.className}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {student.skills.slice(0, 2).map(sk => (
                            <span key={sk} className="text-[8px] bg-slate-900 border border-white/5 text-slate-350 px-1.5 py-0.2 rounded font-sans">
                              {sk.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-1.5 col-span-1">
                        <ArrowRight className={`w-3.5 h-3.5 transition-all ${isActive ? 'translate-x-0.5 text-indigo-400' : 'text-slate-600'}`} />
                        {!hasPred && (
                          <span className="text-[7.5px] font-black px-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase animate-pulse">Pending</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Placements recommendations for active student */}
            <div className="lg:col-span-8">
              {(() => {
                const currentStudent = unassignedStudents.find(s => s.id === activePredictStudentId);
                const currentPred = predictions.find(p => p.studentId === activePredictStudentId);

                if (!currentStudent) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-950/20 border border-dashed border-white/5 rounded-2xl">
                      <Users className="w-8 h-8 text-slate-500 animate-pulse" />
                      <p className="text-white/40 text-[11px] mt-2">Silakan pilih salah satu siswa dari daftar di samping untuk meneliti prediksi penemuannya.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    
                    {/* Active Student Portfolio Info Highlight */}
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-white/5 space-y-2">
                      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                        <div>
                          <h5 className="font-extrabold text-sm text-white">{currentStudent.name}</h5>
                          <p className="text-[10px] text-white/50">Siswa Vokasi {currentStudent.className} • Bidang Keahlian Desain DKV</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {currentStudent.skills.map(sk => (
                            <span key={sk} className="text-[9px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-white/[0.04]">
                        <span className="text-[8.5px] font-black text-amber-500 uppercase tracking-wider block mb-1">Draf Unggulan Portofolio Siswa</span>
                        <p className="text-white/80 text-[11.5px] italic leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                          "{currentStudent.portfolioHighlight || "Belum mengunggah draf karya unggulan khusus"}"
                        </p>
                      </div>
                    </div>

                    {/* Predictions Mitra block */}
                    <div className="space-y-3">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black select-none">
                        Top Rekomendasi Mitra Industri COCOK (Urut Berdasarkan Skor AI)
                      </p>

                      {!currentPred ? (
                        <div className="p-6 text-center border border-dashed border-white/10 rounded-xl bg-slate-950/20 space-y-2">
                          <p className="text-white/50 text-[11px]">Siswa ini baru didaftarkan atau belum terekam dalam cache analisis.</p>
                          <button
                            type="button"
                            onClick={() => runPlacementPrediction()}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition text-indigo-400 cursor-pointer"
                          >
                            Dapatkan Rekomendasi AI Sekarang
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {currentPred.recommendations.map((rec: any, idx: number) => {
                            // Find matching company details to display details like address
                            const exactCompany = companies.find(c => c.id === rec.companyId);

                            let scoreColor = "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 shadow-lg shadow-emerald-500/5";
                            let cardColor = "border-emerald-500/10 bg-gradient-to-tr from-slate-900/40 to-slate-950/20 hover:border-emerald-500/25";
                            if (rec.score < 85 && rec.score >= 70) {
                              scoreColor = "text-teal-400 bg-teal-500/10 border border-teal-500/20";
                              cardColor = "border-white/5 bg-slate-900/25 hover:border-indigo-500/15";
                            } else if (rec.score < 70) {
                              scoreColor = "text-amber-400 bg-amber-500/10 border border-amber-500/20";
                              cardColor = "border-white/5 bg-slate-900/25 hover:border-amber-500/15";
                            }

                            return (
                              <div
                                key={rec.companyId}
                                className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${cardColor}`}
                              >
                                <div className="space-y-2.5">
                                  {/* Upper layout: Name & Score */}
                                  <div className="flex items-start justify-between gap-2.5">
                                    <div className="min-w-0 flex-1">
                                      <span className="text-[8.5px] font-mono text-indigo-400 font-bold tracking-wider uppercase block leading-none mb-1">
                                        Rekomendasi #{idx + 1}
                                      </span>
                                      <h6 className="font-extrabold text-xs text-white truncate leading-tight">
                                        {rec.companyName}
                                      </h6>
                                      <p className="text-[9.5px] text-white/40 truncate leading-none mt-1 flex items-center gap-1">
                                        <Briefcase className="w-2.5 h-2.5 text-slate-500" />
                                        {exactCompany?.industry || "Instansi Rekanan Kreatif"}
                                      </p>
                                    </div>
                                    <span className={`text-[10.5px] font-black font-mono shrink-0 px-2.5 py-1 rounded-lg ${scoreColor}`}>
                                      {rec.score}% Match
                                    </span>
                                  </div>

                                  {/* Recommended Role */}
                                  <div className="bg-slate-950/40 p-2 rounded-lg border border-white/5 space-y-0.5">
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block font-sans">USULAN POSISI MAGANG</span>
                                    <p className="text-[10px] font-black text-indigo-300 font-mono truncate">{rec.suggestedRole}</p>
                                  </div>

                                  {/* Match Reason */}
                                  <p className="text-white/75 text-[10.5px] leading-relaxed line-clamp-4">
                                    {rec.matchReason}
                                  </p>

                                  {exactCompany && (
                                    <p className="text-[9.5px] text-white/35 italic select-none leading-normal border-t border-white/[0.04] pt-2 flex items-start gap-1">
                                      <MapPin className="w-2.5 h-2.5 text-slate-500 shrink-0 mt-0.5" />
                                      <span className="truncate">{exactCompany.address}</span>
                                    </p>
                                  )}
                                </div>

                                {/* Plot Button */}
                                {onUpdateStudent && (
                                  <div className="pt-3 border-t border-white/[0.04] mt-3 flex">
                                    <button
                                      type="button"
                                      onClick={() => handleAssignCompany(currentStudent.id, rec.companyId, rec.companyName)}
                                      className="w-full bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.01] text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 bg-gradient-to-r from-indigo-600 to-indigo-550 shadow-md shadow-indigo-600/10 animate-fade-in"
                                    >
                                      Pilih Mitra & Plot Siswa Penempatan
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })()}
            </div>

          </div>
        )}
      </div>

      {/* Panel Jadwal & Timeline PKL */}
      <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-900/30 relative overflow-hidden animate-fade-in mb-6" id="dashboard-schedule-panel">
        <div className="absolute top-0 right-0 w-96 h-32 bg-purple-500/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-tr from-purple-500 to-indigo-500 p-2 rounded-xl text-white shadow-lg shadow-purple-500/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 font-sans">
              <h4 className="font-display font-black text-xs text-white uppercase tracking-wider">
                Monitoring Jadwal & Timeline Durasi PKL Siswa DKV
              </h4>
              <p className="text-white/50 text-[11px]">
                Sinkronisasi data real-time status penempatan siswa dengan tampilan kalender agenda kerja dan visualisasi timeline Gantt Chart di industri kementrian atau swasta.
              </p>
            </div>
          </div>

          {/* View Modes Toggle */}
          <div className="flex bg-slate-950/60 p-1 border border-white/5 rounded-xl self-stretch md:self-auto justify-center select-none">
            <button
              onClick={() => setScheduleViewMode("calendar")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all ${
                scheduleViewMode === "calendar"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Kalender Agenda
            </button>
            <button
              onClick={() => setScheduleViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all ${
                scheduleViewMode === "timeline"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Timeline Gantt
            </button>
            <button
              onClick={() => setScheduleViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black transition-all ${
                scheduleViewMode === "list"
                  ? "bg-indigo-600 text-white shadow"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Daftar Jadwal
            </button>
          </div>
        </div>

        {/* Toolbar Filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/40 p-3 rounded-2xl border border-white/5 mb-4 select-none">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={scheduleSearchQuery}
              onChange={(e) => setScheduleSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 hover:border-white/10 focus:border-indigo-500/40 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-[11.5px] text-white transition placeholder:text-slate-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-extrabold whitespace-nowrap">KELAS:</span>
            <select
              value={scheduleClassFilter}
              onChange={(e) => setScheduleClassFilter(e.target.value)}
              className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 text-[11px] text-slate-300 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {Array.from(new Set(students.map(s => s.className))).sort().map(cl => (
                <option key={cl} value={cl}>{cl}</option>
              ))}
            </select>
          </div>

          {/* Month selector (only relevant for Calendar View) */}
          {scheduleViewMode === "calendar" && (
            <div className="flex items-center gap-1.5 border-l border-white/5 pl-2">
              <button
                type="button"
                onClick={() => {
                  if (scheduleMonth === 0) {
                    setScheduleMonth(11);
                    setScheduleYear(y => y - 1);
                  } else {
                    setScheduleMonth(m => m - 1);
                  }
                }}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/75 transition cursor-pointer"
              >
                &lsaquo;
              </button>
              <span className="text-[11px] font-black text-indigo-350 bg-indigo-500/10 border border-indigo-500/15 px-3 py-1.5 rounded-lg min-w-[110px] text-center font-mono">
                {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][scheduleMonth]} {scheduleYear}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (scheduleMonth === 11) {
                    setScheduleMonth(0);
                    setScheduleYear(y => y + 1);
                  } else {
                    setScheduleMonth(m => m + 1);
                  }
                }}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/75 transition cursor-pointer"
              >
                &rsaquo;
              </button>
            </div>
          )}
        </div>

        {/* Edit Jadwal Inline Form Modal */}
        {editingScheduleStudentId && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl mb-4 space-y-3.5 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                SUNTING JADWAL PKL: {students.find(s => s.id === editingScheduleStudentId)?.name}
              </span>
              <button
                type="button"
                onClick={() => setEditingScheduleStudentId(null)}
                className="text-[10px] text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2 py-0.5 rounded cursor-pointer transition font-mono"
              >
                Batalkan
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 block">Tanggal Mulai PKL</label>
                <input
                  type="date"
                  value={editingStartDate}
                  onChange={(e) => setEditingStartDate(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-white/50 block">Tanggal Selesai PKL</label>
                <input
                  type="date"
                  value={editingEndDate}
                  onChange={(e) => setEditingEndDate(e.target.value)}
                  className="w-full bg-slate-900 text-slate-200 border border-white/10 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!onUpdateStudent || !editingScheduleStudentId) return;
                    onUpdateStudent(editingScheduleStudentId, {
                      pklStartDate: editingStartDate || undefined,
                      pklEndDate: editingEndDate || undefined
                    });
                    alert("Jadwal durasi PKL siswa berhasil diperbarui dan disinkronkan ke database!");
                    setEditingScheduleStudentId(null);
                  }}
                  className="w-full bg-indigo-605 hover:bg-indigo-500 text-white font-extrabold text-[10.5px] py-2 px-4 rounded-lg cursor-pointer transition flex items-center justify-center gap-1 shadow-md shadow-indigo-600/10"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  Simpan Jadwal Baru
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content based on View Mode */}
        {scheduleViewMode === "calendar" && (
          <div className="space-y-4">
            {/* Calendar Calendar Rendering */}
            {(() => {
              const year = scheduleYear;
              const month = scheduleMonth;
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1...
              
              const calendarCells = [];
              // Fill prefix empty spaces
              for (let i = 0; i < firstDayIndex; i++) {
                calendarCells.push(null);
              }
              // Fill total days
              for (let d = 1; d <= daysInMonth; d++) {
                calendarCells.push(d);
              }

              const DAYS_OF_WEEK = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
              
              // Filtered students for current filter matching keyword & class
              const activeFilteredStudents = students.filter(s => {
                const keywordMatch = scheduleSearchQuery === "" || 
                  s.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) || 
                  s.nis.includes(scheduleSearchQuery);
                const classMatch = scheduleClassFilter === "ALL" || s.className === scheduleClassFilter;
                return keywordMatch && classMatch;
              });

              return (
                <div className="space-y-4">
                  {/* Calendar Grid Header */}
                  <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[10px] font-black text-slate-500 uppercase tracking-wider pb-1.5 border-b border-white/5">
                    {DAYS_OF_WEEK.map(d => (
                      <span key={d}>{d.slice(0, 3)}</span>
                    ))}
                  </div>

                  {/* Calendar Cell Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarCells.map((day, idx) => {
                      if (day === null) {
                        return <div key={`empty-${idx}`} className="aspect-square bg-white/[0.01] rounded-xl border border-transparent" />;
                      }

                      // Formatted string date picker cell: YYYY-MM-DD
                      const currentFormattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      
                      // Check important date events
                      const startPklStudents = activeFilteredStudents.filter(s => s.pklStartDate === currentFormattedDate);
                      const endPklStudents = activeFilteredStudents.filter(s => s.pklEndDate === currentFormattedDate);
                      
                      const ongoingInThisDay = activeFilteredStudents.filter(s => {
                        if (!s.pklStartDate || !s.pklEndDate || s.status !== "Ongoing") return false;
                        const start = new Date(s.pklStartDate);
                        const end = new Date(s.pklEndDate);
                        const current = new Date(year, month, day);
                        return current >= start && current <= end;
                      });

                      const totalOnDay = ongoingInThisDay.length;
                      let cellClass = "bg-white/[0.02] border-white/5 hover:border-indigo-500/30 text-slate-400";
                      
                      // Highlight current day equivalent inside development date (2026-06-13 is metadata current date)
                      const isToday = year === 2026 && month === 5 && day === 13;
                      if (isToday) {
                        cellClass = "bg-indigo-600/20 border-indigo-500/50 text-indigo-300 ring-2 ring-indigo-500/20 font-black";
                      } else if (startPklStudents.length > 0) {
                        cellClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-extrabold";
                      } else if (endPklStudents.length > 0) {
                        cellClass = "bg-rose-500/10 border-rose-500/20 text-rose-400 font-extrabold";
                      } else if (totalOnDay > 0) {
                        cellClass = "bg-indigo-500/[0.04] border-indigo-500/10 text-slate-200";
                      }

                      return (
                        <div
                          key={`day-${day}`}
                          className={`aspect-square p-2.5 rounded-xl border transition-all flex flex-col justify-between overflow-hidden relative group ${cellClass}`}
                        >
                          <div className="flex items-start justify-between">
                            <span className={`text-[10px] leading-none ${isToday ? 'text-indigo-300 font-black' : 'text-slate-400'}`}>{day}</span>
                            
                            {/* Micro Indicator Dots */}
                            <div className="flex items-center gap-1 leading-none">
                              {startPklStudents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Mulai PKL" />}
                              {endPklStudents.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-400" title="Selesai PKL" />}
                              {totalOnDay > 0 && startPklStudents.length === 0 && endPklStudents.length === 0 && (
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/50" />
                              )}
                            </div>
                          </div>

                          {/* Events Display */}
                          <div className="flex-1 mt-1 font-sans flex flex-col justify-end space-y-0.5 max-h-[40px] overflow-hidden">
                            {startPklStudents.length > 0 && (
                              <span className="text-[7.5px] bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded truncate leading-none">
                                🟢 {startPklStudents.length} Mulai
                              </span>
                            )}
                            {endPklStudents.length > 0 && (
                              <span className="text-[7.5px] bg-rose-500/15 text-rose-400 px-1 py-0.2 rounded truncate leading-none">
                                🔴 {endPklStudents.length} Selesai
                              </span>
                            )}
                            {totalOnDay > 0 && startPklStudents.length === 0 && endPklStudents.length === 0 && (
                              <span className="text-[7px] text-slate-500 font-mono block select-none">
                                {totalOnDay} Aktif Magang
                              </span>
                            )}
                          </div>
                          
                          {/* Tooltip Hover agenda on that cell */}
                          <div className="absolute inset-0 bg-slate-950/95 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-center text-[8px] space-y-1 pointer-events-none rounded-xl z-20">
                            <span className="font-bold text-slate-400 border-b border-white/5 pb-0.5 text-[8.5px]">Agenda {day} {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month]}</span>
                            {startPklStudents.length > 0 && (
                              <div className="text-emerald-400 truncate font-semibold">Mulai: {startPklStudents.map(s => s.name.split(" ")[0]).join(", ")}</div>
                            )}
                            {endPklStudents.length > 0 && (
                              <div className="text-rose-400 truncate font-semibold">Selesai: {endPklStudents.map(s => s.name.split(" ")[0]).join(", ")}</div>
                            )}
                            {totalOnDay > 0 ? (
                              <div className="text-indigo-300 font-mono font-medium">{totalOnDay} siswa magang aktif</div>
                            ) : (
                              <div className="text-slate-600 font-mono">Tidak ada jadwal aktif</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calendar Information / Selected Day Focus Detail */}
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <h5 className="text-[10.5px] font-black text-white uppercase tracking-wider flex items-center gap-1.5 select-none">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        Detail Rangkuman Aliran Agenda ({["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"][month]} {year})
                      </h5>
                      <span className="text-[9.5px] text-slate-500 font-mono">Data terverifikasi Hubinmas</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Hari Pengumuman Mulai PKL */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-emerald-400 tracking-wider uppercase block select-none">🟢 Agenda Mulai Magang Bulan Ini:</span>
                        {activeFilteredStudents.filter(s => s.pklStartDate && new Date(s.pklStartDate).getMonth() === month && new Date(s.pklStartDate).getFullYear() === year).length === 0 ? (
                          <p className="text-slate-500 text-[10.5px] italic">Tidak ada agenda pendaftaran mulai magang terekam bulan ini.</p>
                        ) : (
                          <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                            {activeFilteredStudents
                              .filter(s => s.pklStartDate && new Date(s.pklStartDate).getMonth() === month && new Date(s.pklStartDate).getFullYear() === year)
                              .map(s => {
                                const compName = companies.find(c => c.id === s.companyId)?.name || "Mencari Mandiri";
                                return (
                                  <div key={s.id} className="flex items-center justify-between text-[10.5px] p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                                    <div className="min-w-0 flex-1">
                                      <span className="font-bold text-slate-200 block truncate">{s.name}</span>
                                      <span className="text-[9.5px] text-slate-400 block truncate">Mitra: {compName} • {s.className}</span>
                                    </div>
                                    <span className="text-[9.5px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md font-mono shrink-0">
                                      {s.pklStartDate ? new Date(s.pklStartDate).toLocaleString('id-ID', {day: 'numeric', month: 'short'}) : ""}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* Hari Pengumuman Selesai PKL */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-rose-400 tracking-wider uppercase block select-none">🔴 Agenda Selesai Magang Bulan Ini:</span>
                        {activeFilteredStudents.filter(s => s.pklEndDate && new Date(s.pklEndDate).getMonth() === month && new Date(s.pklEndDate).getFullYear() === year).length === 0 ? (
                          <p className="text-slate-500 text-[10.5px] italic">Tidak ada agenda pendaftaran selesai magang terekam bulan ini.</p>
                        ) : (
                          <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1">
                            {activeFilteredStudents
                              .filter(s => s.pklEndDate && new Date(s.pklEndDate).getMonth() === month && new Date(s.pklEndDate).getFullYear() === year)
                              .map(s => {
                                const compName = companies.find(c => c.id === s.companyId)?.name || "Mencari Mandiri";
                                return (
                                  <div key={s.id} className="flex items-center justify-between text-[10.5px] p-2 bg-white/[0.01] border border-white/5 rounded-lg">
                                    <div className="min-w-0 flex-1">
                                      <span className="font-bold text-slate-200 block truncate">{s.name}</span>
                                      <span className="text-[9.5px] text-slate-400 block truncate">Mitra: {compName} • {s.className}</span>
                                    </div>
                                    <span className="text-[9.5px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-md font-mono shrink-0">
                                      {s.pklEndDate ? new Date(s.pklEndDate).toLocaleString('id-ID', {day: 'numeric', month: 'short'}) : ""}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* View mode: Gantt Timeline rendering */}
        {scheduleViewMode === "timeline" && (
          <div className="space-y-3.5">
            <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 text-[10.5px] text-slate-400 flex flex-wrap items-center justify-between gap-2 select-none">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Grafik Batang Visual Timeline memetakan durasi relatif siswa PKL dalam rentang waktu April s.d September 2026.
              </span>
              <div className="flex gap-4 text-[9.5px]">
                <span className="flex items-center gap-1 text-emerald-400">🟢 Ongoing</span>
                <span className="flex items-center gap-1 text-purple-400">🟣 Pending</span>
                <span className="flex items-center gap-1 text-slate-400">⚪ Unassigned</span>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {(() => {
                const activeFilteredStudents = students.filter(s => {
                  const keywordMatch = scheduleSearchQuery === "" || 
                    s.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) || 
                    s.nis.includes(scheduleSearchQuery);
                  const classMatch = scheduleClassFilter === "ALL" || s.className === scheduleClassFilter;
                  return keywordMatch && classMatch;
                });

                // General PKL absolute timeline limits (6 months)
                const timelineStart = new Date("2026-04-01").getTime();
                const timelineEnd = new Date("2026-09-30").getTime();
                const totalSpan = timelineEnd - timelineStart;

                return activeFilteredStudents.map(student => {
                  // Duration and offset calculations
                  let start = student.pklStartDate ? new Date(student.pklStartDate).getTime() : 0;
                  let end = student.pklEndDate ? new Date(student.pklEndDate).getTime() : 0;

                  let showBar = true;
                  let leftPercent = 0;
                  let widthPercent = 100;
                  let durationDays = 0;

                  if (!start || !end) {
                    showBar = false;
                  } else {
                    const clampedStart = Math.max(timelineStart, start);
                    const clampedEnd = Math.min(timelineEnd, end);
                    durationDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                    
                    leftPercent = ((clampedStart - timelineStart) / totalSpan) * 100;
                    widthPercent = ((clampedEnd - clampedStart) / totalSpan) * 100;
                    
                    // Cap percentage safely
                    leftPercent = Math.max(0, Math.min(95, leftPercent));
                    widthPercent = Math.max(5, Math.min(100 - leftPercent, widthPercent));
                  }

                  const compSelectedName = companies.find(c => c.id === student.companyId)?.name || "Mencari Mandiri (DRAFT)";

                  return (
                    <div key={student.id} className="p-3.5 bg-slate-950/40 border border-white/5 rounded-xl hover:border-white/10 transition-all font-sans relative">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-2.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-white truncate">{student.name}</span>
                            <span className="text-[10px] text-slate-500">• {student.className}</span>
                          </div>
                          <p className="text-[9.5px] text-white/40 truncate mt-0.5">
                            Mitra DUDI: <strong className="text-indigo-400">{compSelectedName}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                          {student.status === "Ongoing" && (
                            <span className="text-[8.5px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded uppercase">Ongoing</span>
                          )}
                          {student.status === "Completed" && (
                            <span className="text-[8.5px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded uppercase">Selesai</span>
                          )}
                          {student.status === "Pending" && (
                            <span className="text-[8.5px] font-black bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded uppercase">Pending</span>
                          )}
                          {student.status === "Unassigned" && (
                            <span className="text-[8.5px] font-black bg-slate-500/15 text-slate-400 border border-white/5 px-2 py-0.5 rounded uppercase">Unassigned</span>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => {
                              setEditingScheduleStudentId(student.id);
                              setEditingStartDate(student.pklStartDate || "2026-04-01");
                              setEditingEndDate(student.pklEndDate || "2026-06-30");
                              document.getElementById("dashboard-schedule-panel")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="text-[9px] font-black bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 px-2.5 py-1 rounded transition select-none cursor-pointer"
                          >
                            Atur Jadwal
                          </button>
                        </div>
                      </div>

                      {/* Bar Timeline Visual Track Grid */}
                      <div className="h-6.5 bg-slate-900 rounded-lg p-0.5 border border-white/[0.04] relative select-none">
                        
                        {/* Month guidelines inside track */}
                        <div className="absolute inset-0 flex text-[7.5px] text-white/15 pointer-events-none font-mono tracking-tighter justify-between px-2 items-center">
                          <span>Apr '26</span>
                          <span>Mei</span>
                          <span>Jun</span>
                          <span>Jul</span>
                          <span>Ags</span>
                          <span>Sep '26</span>
                        </div>

                        {showBar ? (
                          <div
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            className={`absolute h-5 rounded-md top-0.5 shadow-lg flex items-center justify-between px-2 min-w-[50px] ${
                              student.status === "Completed"
                                ? "bg-gradient-to-r from-blue-605 to-blue-500/80 shadow-blue-500/5 text-white"
                                : student.status === "Pending"
                                ? "bg-gradient-to-r from-purple-605 to-purple-500/80 shadow-purple-500/5 text-white"
                                : "bg-gradient-to-r from-indigo-605 to-indigo-500/80 shadow-indigo-500/10 text-white animate-pulse"
                            }`}
                          >
                            <span className="text-[8px] font-black truncate">{student.pklStartDate} s/d {student.pklEndDate}</span>
                            <span className="text-[8.5px] font-mono font-black">{durationDays} Hari</span>
                          </div>
                        ) : (
                          <div className="absolute inset-x-0.5 top-0.5 h-5 bg-white/[0.02] rounded-md border border-dashed border-white/10 flex items-center justify-center">
                            <span className="text-[8.5px] text-slate-500 italic flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              Jadwal tanggal mulai & selesai belum dikonfigurasi secara formal.
                            </span>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* View mode: Simple Listing Schedule */}
        {scheduleViewMode === "list" && (
          <div className="font-sans space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-white">
                <thead>
                  <tr className="border-b border-white/10 text-[9.5px] uppercase text-slate-500 font-mono font-bold">
                    <th className="py-2.5 px-3">Siswa / NIS</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Mitra Industri</th>
                    <th className="py-2.5 px-3 text-center">Mulai PKL</th>
                    <th className="py-2.5 px-3 text-center">Selesai PKL</th>
                    <th className="py-2.5 px-3 text-center">Durasi Kerja</th>
                    <th className="py-2.5 px-3 text-center">Aksi Kerja</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(() => {
                    const activeFilteredStudents = students.filter(s => {
                      const keywordMatch = scheduleSearchQuery === "" || 
                        s.name.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) || 
                        s.nis.includes(scheduleSearchQuery);
                      const classMatch = scheduleClassFilter === "ALL" || s.className === scheduleClassFilter;
                      return keywordMatch && classMatch;
                    });

                    if (activeFilteredStudents.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                            Tidak ada data siswa memenuhi kriteria filter pencarian.
                          </td>
                        </tr>
                      );
                    }

                    return activeFilteredStudents.map(s => {
                      const duration = s.pklStartDate && s.pklEndDate 
                        ? Math.round((new Date(s.pklEndDate).getTime() - new Date(s.pklStartDate).getTime()) / (1000 * 60 * 60 * 24))
                        : "—";

                      const companyName = companies.find(c => c.id === s.companyId)?.name || "Mencari Mandiri/Unassigned";

                      return (
                        <tr key={s.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-slate-100 block">{s.name}</span>
                            <span className="text-[9.5px] text-slate-400 font-mono">NIS: {s.nis}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-350">{s.className}</td>
                          <td className="py-3 px-3">
                            <span className="text-xs text-indigo-300 font-semibold">{companyName}</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-400">{s.pklStartDate || "—"}</td>
                          <td className="py-3 px-3 text-center font-mono text-rose-400">{s.pklEndDate || "—"}</td>
                          <td className="py-3 px-3 text-center font-black font-mono text-slate-200">
                            {duration !== "—" ? `${duration} hari` : "—"}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingScheduleStudentId(s.id);
                                setEditingStartDate(s.pklStartDate || "2026-04-01");
                                setEditingEndDate(s.pklEndDate || "2026-06-30");
                                document.getElementById("dashboard-schedule-panel")?.scrollIntoView({ behavior: "smooth" });
                              }}
                              className="text-[9.5px] font-black text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-1 rounded transition select-none cursor-pointer"
                            >
                              Edit Tanggal
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
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

                const studentWeeklyTarget = customWeeklyTargets[student.id] || weeklyTarget;
                const radius = 18;
                const circumference = 2 * Math.PI * radius;
                const ringProgress = student.status === 'Unassigned' ? 0 : cumulativeProgress;
                const strokeDashoffset = circumference - (Math.min(100, ringProgress) / 100) * circumference;

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

                    {/* Student Identity block with Visual Percentage Gauge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
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

                      {/* Circular Gauge visual component showing percentage */}
                      {student.status !== 'Unassigned' && (
                        <div className="relative flex items-center justify-center shrink-0 w-12 h-12" title="Persentase Pencapaian Target PKL">
                          <svg className="w-12 h-12 transform -rotate-90">
                            <circle cx="24" cy="24" r="18" className="stroke-white/5" strokeWidth="2.5" fill="transparent" />
                            <circle 
                              cx="24" 
                              cy="24" 
                              r="18" 
                              className="transition-all duration-500"
                              stroke={`url(#grad-${student.id})`}
                              strokeWidth="3.5" 
                              fill="transparent"
                              strokeDasharray={circumference}
                              strokeDashoffset={strokeDashoffset}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id={`grad-${student.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={cumulativeProgress >= 85 ? "#10b981" : cumulativeProgress >= 50 ? "#f59e0b" : "#f43f5e"} />
                                <stop offset="100%" stopColor={cumulativeProgress >= 85 ? "#14b8a6" : cumulativeProgress >= 50 ? "#d97706" : "#e11d48"} />
                              </linearGradient>
                            </defs>
                          </svg>
                          <span className="absolute text-[9px] font-black text-indigo-300 font-mono">{cumulativeProgress}%</span>
                        </div>
                      )}
                    </div>

                    {/* Input Target Mingguan per Siswa */}
                    <div className="bg-slate-900 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between mt-3 text-xs" id={`student-target-box-${student.id}`}>
                      <label htmlFor={`student-target-input-${student.id}`} className="text-white/50 text-[10px] uppercase font-bold tracking-wide flex items-center gap-1 leading-none select-none">
                        <Target className="w-3 h-3 text-indigo-400" />
                        Target Mingguan
                      </label>
                      <div className="flex items-center gap-1.5 font-mono">
                        <button
                          type="button"
                          onClick={() => handleStudentTargetChange(student.id, studentWeeklyTarget - 1)}
                          className="w-5.5 h-5.5 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 text-white hover:text-rose-300 border border-white/10 rounded-lg flex items-center justify-center text-xs font-black transition-colors cursor-pointer select-none"
                          title="Kurangi target"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          id={`student-target-input-${student.id}`}
                          value={studentWeeklyTarget}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) {
                              handleStudentTargetChange(student.id, val);
                            }
                          }}
                          min="1"
                          max="7"
                          className="w-10 bg-black/40 border border-white/10 text-center text-xs font-bold text-white rounded-lg py-0.5 outline-none focus:border-indigo-500 transition-colors"
                          title="Ubah angka target kustom (1 sampai 7)"
                        />
                        <button
                          type="button"
                          onClick={() => handleStudentTargetChange(student.id, studentWeeklyTarget + 1)}
                          className="w-5.5 h-5.5 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-white hover:text-emerald-300 border border-white/10 rounded-lg flex items-center justify-center text-xs font-black transition-colors cursor-pointer select-none"
                          title="Tambah target"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-white/40 font-sans ml-0.5">hari</span>
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
        <div className="space-y-6 flex flex-col">
          {/* Chatbot AI Asisten PKL */}
          <div className="glass-panel rounded-2xl border border-white/10 relative overflow-hidden flex flex-col h-[520px] shrink-0" id="simpkl-chatbot-widget">
            {/* Ambient visual gradient */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -ml-8 -mt-8" />
            
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/2 relative z-10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-xs text-white leading-tight flex items-center gap-1.5">
                    Asisten AI SimPKL DKV
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  </h4>
                  <p className="text-[9px] text-white/50">Tanya alur, aturan & logbook PKL</p>
                </div>
              </div>
              <button
                onClick={() => setChatMessages([
                  {
                    id: "initial",
                    role: "model",
                    text: "Halo! Saya adalah **SimPKL Chatbot**, asisten cerdas khusus PKL DKV di **SMK Negeri 14 Kabupaten Tangerang**.\n\nSilakan tanyakan kepada saya mengenai:\n* **Alur & Tahap PKL** (pendaftaran, persiapan, berkas administrasi)\n* **Kebijakan & Tata Tertib** (kehadiran, seragam, kedisiplinan, sanksi)\n* **Pengisian Jurnal Logbook harian** (tips deskripsi aktivitas, tools, approval)\n\nBagaimana saya bisa membantu pelaksanaan PKL Anda hari ini?",
                    timestamp: new Date()
                  }
                ])}
                className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all cursor-pointer"
                title="Bersihkan Percakapan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10 scrollbar-thin scrollbar-thumb-white/15">
              {chatMessages.map((msg) => {
                const isBot = msg.role === "model";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isBot ? "items-start" : "items-end"}`}
                  >
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 max-w-[88%] text-[11px] ${
                        isBot
                          ? "bg-white/5 border border-white/8 text-white rounded-tl-none"
                          : "bg-indigo-600/35 border border-indigo-500/25 text-white rounded-tr-none shadow-md shadow-indigo-950/20"
                      }`}
                    >
                      {formatChatMessageText(msg.text)}
                    </div>
                    {isBot && msg.mode && (
                      <span className="text-[7.5px] text-white/30 font-mono mt-1 px-1 tracking-wider lowercase">
                        mode: {msg.mode}
                      </span>
                    )}
                  </div>
                );
              })}
              {isChatLoading && (
                <div className="flex flex-col items-start">
                  <div className="bg-white/5 border border-white/8 text-white rounded-2xl rounded-tl-none px-3 py-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1 h-1 bg-indigo-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              )}
              {chatError && (
                <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-[10.5px] text-red-400">
                  {chatError}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Presets */}
            <div className="px-3 py-2 bg-black/20 border-t border-white/5 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none relative z-10 shrink-0">
              <button
                onClick={() => handleSendChatMessage("Bagaimana alur dan pendaftaran PKL?")}
                className="text-[9.5px] bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-white/80 rounded-full px-2.5 py-1 transition-all cursor-pointer inline-block shrink-0"
              >
                📌 Alur PKL
              </button>
              <button
                onClick={() => handleSendChatMessage("Apa saja aturan seragam dan penampilan selama magang?")}
                className="text-[9.5px] bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-white/80 rounded-full px-2.5 py-1 transition-all cursor-pointer inline-block shrink-0"
              >
                👔 Aturan Seragam
              </button>
              <button
                onClick={() => handleSendChatMessage("Bagaimana panduan menulis logbook harian yang dinilai baik?")}
                className="text-[9.5px] bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-white/85 rounded-full px-2.5 py-1 transition-all cursor-pointer inline-block shrink-0"
              >
                📝 Tips Logbook
              </button>
              <button
                onClick={() => handleSendChatMessage("Apa sanksi jika melanggar kehadiran atau mencemarkan nama baik sekolah?")}
                className="text-[9.5px] bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-white/85 rounded-full px-2.5 py-1 transition-all cursor-pointer inline-block shrink-0"
              >
                ⚠️ Sanksi Bolos
              </button>
              <button
                onClick={() => handleSendChatMessage("Apakah siswa PKL mendapatkan kompensasi gaji atau uang saku?")}
                className="text-[9.5px] bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 hover:border-white/20 text-white/85 rounded-full px-2.5 py-1 transition-all cursor-pointer inline-block shrink-0"
              >
                💰 Uang Saku / Gaji
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendChatMessage();
              }}
              className="p-2.5 bg-white/2 border-t border-white/10 flex gap-2 relative z-10 shrink-0"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanyakan hal magang..."
                disabled={isChatLoading}
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-all focus:ring-1 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center justify-center shrink-0 w-8 h-8 shadow-md shadow-indigo-600/15"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Panel Analisis AI */}
          <div className="glass-panel rounded-2xl p-6 space-y-4 border border-indigo-500/15 relative overflow-hidden">
            {/* Background decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-8 -mt-8" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="font-display font-bold text-base text-white">
                  Analisis & Insight AI
                </h3>
              </div>
              <button 
                onClick={() => runAiAnalysis(true)} 
                disabled={aiLoading}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-indigo-400 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center"
                title="Perbarui Rekomendasi/Analisis AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {aiLoading ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="text-xs font-semibold text-white/80">Menelaah Data PKL...</p>
                  <p className="text-[10px] text-white/40 mt-1">Gemini sedang menyusun pola & rekomendasi</p>
                </div>
              </div>
            ) : aiError ? (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                <p className="text-red-400 font-semibold text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  Gagal Memuat Analisis
                </p>
                <p className="text-[11px] text-white/60 leading-relaxed">{aiError}</p>
                <button 
                  onClick={() => runAiAnalysis(true)} 
                  className="w-full mt-2 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-white font-bold text-[10px] rounded transition cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-4 text-xs">
                {/* AI Mode Badge */}
                {aiAnalysis.mode && (
                  <div className="flex justify-end">
                    <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {aiAnalysis.mode}
                    </span>
                  </div>
                )}

                {/* Summary / Ringkasan */}
                <div className="space-y-1">
                  <span className="font-semibold text-[10px] uppercase tracking-widest text-indigo-300 block">Kondisi Saat Ini</span>
                  <p className="text-white/70 leading-relaxed text-[11px] bg-white/3 border border-white/5 p-3 rounded-xl italic">
                    "{aiAnalysis.summary}"
                  </p>
                </div>

                {/* Strengths / Kekuatan */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-[10px] uppercase tracking-widest text-emerald-400 block">Kekuatan & Kepatuhan</span>
                  <ul className="space-y-1.5 list-none pl-0">
                    {aiAnalysis.strengths?.slice(0, 3).map((strength, i) => (
                      <li key={i} className="flex gap-2 items-start text-white/70 leading-relaxed text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses / Kelemahan */}
                <div className="space-y-1.5">
                  <span className="font-semibold text-[10px] uppercase tracking-widest text-rose-400 block">Ancaman & Kerentanan</span>
                  <ul className="space-y-1.5 list-none pl-0">
                    {aiAnalysis.weaknesses?.slice(0, 3).map((weakness, i) => (
                      <li key={i} className="flex gap-2 items-start text-white/70 leading-relaxed text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{weakness}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="space-y-1.5 border-t border-white/5 pt-3">
                  <span className="font-semibold text-[10px] uppercase tracking-widest text-indigo-400 block">Rekomendasi Kaprog</span>
                  <ul className="space-y-1.5 list-none pl-0">
                    {aiAnalysis.recommendations?.slice(0, 3).map((rec, i) => (
                      <li key={i} className="flex gap-2 items-start text-white/80 leading-relaxed text-[11px] bg-indigo-500/5 p-2 rounded-lg border border-indigo-500/10">
                        <span className="font-bold text-indigo-400 h-4 w-4 rounded bg-indigo-500/10 flex items-center justify-center shrink-0 text-[10px]">
                          {i+1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <p className="text-white/50 text-[11px] text-center">Menghubungkan rekapitulasi data logbook dan administrasi untuk menghasilkan insight khusus.</p>
                <button
                  onClick={() => runAiAnalysis(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/25"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mulai Analisis AI
                </button>
              </div>
            )}
          </div>

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

      {/* Cetak Laporan Rekapitulasi Interactive Preview Overlay */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-6 no-print">
          <div className="max-w-4xl w-full bg-slate-900 border border-white/10 rounded-2xl p-6 my-4 space-y-6 shadow-2xl relative block animate-fade-in text-white font-sans mr-0 ml-0">
            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <h3 className="font-display font-black text-sm text-white tracking-wide uppercase flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-400" />
                  Pratinjau Cetak Laporan Rekapitulasi DKV
                </h3>
                <p className="text-white/50 text-[11px] leading-relaxed">
                  Laporan rekapitulasi resmi siap cetak ke format PDF atau kertas fisik A4. Tekan tombol cetak di bawah.
                </p>
              </div>
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                >
                  <Printer className="w-4 h-4 text-white" />
                  Cetak (PDF)
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 font-semibold text-xs py-2 px-3 rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            {/* Layout Paper preview sheet */}
            <div className="bg-slate-950 p-4 sm:p-8 rounded-xl overflow-x-auto flex justify-center border border-white/5">
              <div 
                className="printable-document bg-white text-slate-950 font-serif p-8 w-full max-w-[210mm] min-h-[297mm] mx-auto rounded shadow-2xl border border-slate-350 text-left relative overflow-hidden"
                style={{ boxSizing: 'border-box' }}
              >
                {/* Embedded printer stylesheet for seamless A4 positioning */}
                <style>
                  {`
                    @media print {
                      @page {
                        size: portrait;
                        margin: 0;
                      }
                      body {
                        margin: 0;
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .printable-document {
                        padding-top: 15mm !important;
                        padding-bottom: 15mm !important;
                        padding-left: 15mm !important;
                        padding-right: 15mm !important;
                        font-size: 9.5pt !important;
                        width: 210mm !important;
                        height: auto !important;
                        min-height: 297mm !important;
                        box-shadow: none !important;
                        border: none !important;
                        color: black !important;
                        background: white !important;
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        font-family: Georgia, Cambria, 'Times New Roman', Times, serif !important;
                      }
                    }
                  `}
                </style>

                {/* Header Kop Laporan */}
                <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-3 mb-5 select-none">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-display font-black text-slate-900 text-sm border-2 border-slate-900 shrink-0">
                    DKV
                  </div>
                  <div className="flex-grow">
                    <h2 className="text-xs font-bold tracking-widest text-slate-900 uppercase">PEMERINTAH PROVINSI BANTEN</h2>
                    <h1 className="text-sm font-black text-slate-900 uppercase leading-snug">SMK NEGERI 14 KABUPATEN TANGERANG</h1>
                    <p className="text-[9.5px] text-slate-600 font-sans tracking-wide">BIDANG HUBUNGAN INDUSTRI (HUBINMAS) & DEPARTEMEN DESAIN KOMUNIKASI VISUAL</p>
                    <p className="text-[8.5px] text-slate-400 font-sans leading-none mt-0.5">Jl. Raya SMKN 14, Kab. Tangerang, Banten • Email: dkv@smkn14kabtangerang.sch.id</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center font-sans space-y-1 mb-5">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">LAPORAN REKAPITULASI KINERJA & KEPATUHAN PKL</h2>
                  <p className="text-[10px] text-slate-600 font-bold">PROGRAM STUDI DESAIN KOMUNIKASI VISUAL (DKV) • PERIODIK REKAP REAL-TIME</p>
                  <div className="flex justify-center items-center gap-2 mt-2 font-mono text-[8px] text-slate-400 uppercase tracking-wider">
                    <span>Tanggal Laporan: {referenceDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>Penyusun: Surti Wijaya, S.Kom., Gr.</span>
                  </div>
                </div>

                {/* KPI Overview Grid */}
                <div className="grid grid-cols-4 gap-3 mb-5 font-sans select-none">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-bold leading-none">TINGKAT PENEMPATAN</span>
                    <span className="text-base font-black text-slate-800 leading-tight mt-1 ml-0 block">
                      {totalStudents > 0 ? Math.round(((ongoing + completed) / totalStudents) * 100) : 0}%
                    </span>
                    <span className="text-[8px] text-slate-500 leading-none mt-0.5 block">{ongoing + completed} dari {totalStudents} Siswa Terplot</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-bold leading-none">KONSISTENSI LOGBOOK</span>
                    <span className="text-base font-black text-slate-800 leading-tight mt-1 ml-0 block">
                      {avgLogbookProgress}%
                    </span>
                    <span className="text-[8px] text-slate-500 leading-none mt-0.5 block">{avgLogbookProgress >= 85 ? "Sangat Tertib" : "Cukup Aktif"}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-bold leading-none">TOTAL LOG ELEKTRONIK</span>
                    <span className="text-base font-black text-slate-800 leading-tight mt-1 ml-0 block">
                      {logbooks.length} Laporan
                    </span>
                    <span className="text-[8px] text-slate-500 leading-none mt-0.5 block">Terkumpul di Database</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-bold leading-none">PERUSAHAAN REKANAN</span>
                    <span className="text-base font-black text-slate-800 leading-tight mt-1 ml-0 block">
                      {companies.length} Mitra DUDI
                    </span>
                    <span className="text-[8px] text-slate-500 leading-none mt-0.5 block">Tercatat Aktif / Valid</span>
                  </div>
                </div>

                {/* Class Breakdown Table */}
                <div className="space-y-1.5 mb-5 font-sans">
                  <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">I. Sebaran Penempatan & Kepatuhan Kelas</h3>
                  <table className="w-full text-[9px] text-left border-collapse border border-slate-200 rounded">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200 text-[8px]">
                        <th className="p-1.5 border-r border-slate-200">Kelas DKV</th>
                        <th className="p-1.5 border-r border-slate-200 text-center">Total Siswa</th>
                        <th className="p-1.5 border-r border-slate-200 text-center">Belum PKL</th>
                        <th className="p-1.5 border-r border-slate-200 text-center">Menunggu HRD</th>
                        <th className="p-1.5 border-r border-slate-200 text-center">Sedang PKL</th>
                        <th className="p-1.5 border-r border-slate-200 text-center">Selesai PKL</th>
                        <th className="p-1.5 border-r border-slate-200 text-center">Penempatan (%)</th>
                        <th className="p-1.5 text-center">Kepatuhan Logbook (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classBreakdown.map(cls => (
                        <tr key={cls.className} className="border-b border-slate-200 hover:bg-slate-50/50">
                          <td className="p-1.5 font-bold border-r border-slate-200 text-slate-800">{cls.className}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center">{cls.total}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">{cls.unassigned}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center text-slate-500">{cls.pending}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center text-slate-800 font-semibold">{cls.ongoing}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center text-slate-800">{cls.completed}</td>
                          <td className="p-1.5 border-r border-slate-200 text-center font-bold text-slate-800">{cls.placementRate}%</td>
                          <td className="p-1.5 text-center font-bold text-indigo-700">{cls.avgProgress}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visual Category trends and Student statuses ratio */}
                <div className="grid grid-cols-2 gap-4 mb-6 font-sans">
                  {/* Left block - Sebaran Kategori Kompetensi */}
                  <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded">
                    <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">II. Sebaran Kompetensi Kerja Logbook</h3>
                    <div className="space-y-1.5">
                      {deptCategoryStats.data.map(cat => (
                        <div key={cat.name} className="space-y-0.5">
                          <div className="flex justify-between items-center text-[8.5px]">
                            <span className="font-semibold text-slate-700">{cat.name}</span>
                            <span className="font-mono font-bold text-slate-700">{cat.count} Log ({Math.round(cat.percentage)}%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ backgroundColor: cat.color, width: `${cat.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right block - Distribusi Status Siswa */}
                  <div className="space-y-2 px-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded flex flex-col justify-between" id="dashboard-student-distribution-status">
                    <div>
                      <h3 className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider">III. Proporsi Status Administrasi</h3>
                      <p className="text-[8.5px] text-slate-500 leading-relaxed">Representasi visual status penempatan seluruh siswa terdaftar (Target: 100% ditempatkan).</p>
                    </div>

                    <div className="h-28 w-full flex items-center justify-center relative my-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Sudah Penempatan", value: ongoing + completed },
                              { name: "Proses Seleksi", value: pending },
                              { name: "Belum Penempatan", value: unassigned }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={45}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#10b981" /> {/* Sudah Penempatan */}
                            <Cell fill="#f59e0b" /> {/* Proses Seleksi */}
                            <Cell fill="#f43f5e" /> {/* Belum Penempatan */}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: 'none', 
                              borderRadius: '6px',
                              color: '#ffffff',
                              fontFamily: 'sans-serif',
                              fontSize: '10px',
                              padding: '5px 8px'
                            }} 
                            itemStyle={{ color: '#ffffff' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span className="text-sm font-black text-slate-800 leading-none">{totalStudents}</span>
                        <span className="text-[6.5px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Siswa</span>
                      </div>
                    </div>

                    {/* Custom Highly Legible Legend */}
                    <div className="grid grid-cols-3 gap-x-2 text-[8px] font-medium pt-1 border-t border-slate-200/60 font-sans">
                      <div className="flex items-center gap-1 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-slate-600">Sudah: <strong>{ongoing + completed}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-slate-600">Proses: <strong>{pending}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-slate-600">Belum: <strong>{unassigned}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signature Board */}
                <div className="flex justify-between items-start font-sans pt-5 border-t border-slate-200 select-none">
                  <div className="text-[8.5px] text-slate-500 max-w-[110mm] flex-1">
                    <p className="font-bold uppercase text-slate-800">Catatan/Rekomendasi Departemen:</p>
                    <div className="w-[110mm] border-b border-dashed border-slate-350 h-4.5 mt-0.5" />
                    <div className="w-[110mm] border-b border-dashed border-slate-350 h-4.5" />
                    <div className="w-[110mm] border-b border-dashed border-slate-350 h-4.5" />
                  </div>
                  <div className="text-right text-[8.5px] text-slate-700 w-44 font-sans select-none flex-shrink-0">
                    <p>Tangerang, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p className="font-bold text-slate-850 leading-tight mt-0.5">Kepala Program Studi DKV,<br/>SMK Negeri 14 Kabupaten Tangerang</p>
                    <div className="h-10 mt-0.5 flex justify-end items-center pr-4">
                      <div className="w-20 h-8 border border-slate-200/50 rounded flex items-center justify-center font-serif italic text-slate-300 text-[7px] transform -rotate-3 select-none leading-none">
                        Surti Wijaya, S.Kom.
                      </div>
                    </div>
                    <p className="font-bold text-slate-900 border-b border-slate-900 pb-0.2 inline-block text-[9px]">Surti Wijaya, S.Kom., Gr.</p>
                    <p className="text-[7.5px] text-slate-500 leading-none mt-0.5">NIP. 19851012 201103 2 001</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
