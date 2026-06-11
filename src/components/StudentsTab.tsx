import React, { useState, useEffect } from "react";
import { z } from "zod";
import { Student, Company, StudentStatus } from "../types";

const studentFormSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap wajib diisi minimal 2 karakter."),
  nis: z.string().trim()
    .min(5, "NIS minimal memiliki 5 digit.")
    .regex(/^\d+$/, "NIS hanya boleh berisi angka murni."),
  className: z.string().min(1, "Kelas wajib dipilih."),
  phone: z.string().trim().regex(/^(08|\+62)\d{8,12}$/, "Nomor HP harus diawali 08 (atau +62), berisi angka, 10-14 digit."),
  email: z.string().trim().email("Format email belajar siswa tidak valid (misal: siswa@smkn1teluknaga.sch.id)."),
  skills: z.string().trim().min(2, "Sebutkan minimal satu keahlian unggulan (pisahkan dengan koma)."),
  portfolioUrl: z.string().trim().min(3, "Masukkan tautan portofolio murni (contoh: behance.net/username)."),
  portfolioHighlight: z.string().trim().min(2, "Highlight karya wajib diisi."),
  parentName: z.string().trim().min(2, "Nama orang tua/wali minimal memiliki 2 karakter."),
  parentOccupation: z.string().trim().min(2, "Pekerjaan orang tua/wali minimal memiliki 2 karakter."),
  birthPlaceDate: z.string().trim().min(4, "Masukkan tempat tanggal lahir (contoh: Tangerang, 10 Juni 2008)."),
  studentAddress: z.string().trim().min(5, "Alamat lengkap murni minimal memiliki 5 karakter."),
  companyId: z.string().trim().optional()
});
import { 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Maximize2,
  AlertCircle,
  Copy,
  FolderPlus,
  BookOpen,
  Eye,
  Briefcase,
  Download,
  Users,
  Clock,
  UserX,
  GraduationCap,
  Calendar,
  Award,
  Zap,
  CheckCircle,
  HelpCircle,
  Send
} from "lucide-react";

interface StudentsTabProps {
  students: Student[];
  companies: Company[];
  onAddStudent: (student: Omit<Student, "id">) => void;
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onBulkImport: (rawText: string) => number;
}

export default function StudentsTab({
  students,
  companies,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkImport
}: StudentsTabProps) {
  // Lists UI Control
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Added PKL Helper states (Roles, Tabs, and Core Lists) - Anti-Gagal Local Persistence
  const [userRole, setUserRole] = useState<'Guru' | 'Siswa'>(() => {
    const local = localStorage.getItem("pkl_simulated_role");
    return (local as 'Guru' | 'Siswa') || 'Guru';
  });

  const [drawerTab, setDrawerTab] = useState<'profil' | 'jurnal' | 'monitoring' | 'penilaian'>('profil');

  // Synchronized Student PKL Journals State
  const [journals, setJournals] = useState<{
    id: string;
    studentId: string;
    date: string;
    activity: string;
    status: 'Approved' | 'Pending' | 'NeedsRevision';
    feedback: string;
  }[]>(() => {
    const local = localStorage.getItem("pkl_student_journals");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse journals", e);
      }
    }
    return [
      {
        id: "jr-1",
        studentId: "stud-1",
        date: "2026-06-08",
        activity: "Mendesain ulang materi promosi (banner) brosur penawaran dan menyusun moodboard warna klien Arise Creative.",
        status: "Approved",
        feedback: "Desain warna sangat baik, pastikan kontras teks terbaca sesuai pedoman WCAG."
      },
      {
        id: "jr-2",
        studentId: "stud-1",
        date: "2026-06-09",
        activity: "Merapikan vector aset maskot agensi dan melakukan perbaikan layer pada Adobe Illustrator.",
        status: "Approved",
        feedback: "Bagus. Pertahankan kerapian layer agar mudah di-animasi oleh divisi motion."
      },
      {
        id: "jr-3",
        studentId: "stud-1",
        date: "2026-06-10",
        activity: "Membantu brainstorming konsep promosi sosial media untuk produk minuman boba mitra lokal.",
        status: "Pending",
        feedback: ""
      },
      {
        id: "jr-4",
        studentId: "stud-2",
        date: "2026-06-09",
        activity: "Membuat cleanup line art pada karakter animasi proyek serial fabel nusantara babak 2.",
        status: "Approved",
        feedback: "Line art cukup presisi dan bersih. Lanjutkan ke tahap pewarnaan dasar (flat color)."
      }
    ];
  });

  // Synchronized Teacher Monitoring Visits State
  const [monitorVisits, setMonitorVisits] = useState<{
    id: string;
    studentId: string;
    date: string;
    notes: string;
    industryFeedback: string;
    attendance: number;
    instructor: string;
  }[]>(() => {
    const local = localStorage.getItem("pkl_student_monitoring");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse monitoring", e);
      }
    }
    return [
      {
        id: "mn-1",
        studentId: "stud-1",
        date: "2026-06-05",
        notes: "Siswa terpantau sangat aktif dan adaptif di lingkungan kerja. Sudah dipercaya menangani mockup klien UMKM.",
        industryFeedback: "Siswa disiplin dan menguasai software dasar dengan sangat baik.",
        attendance: 100,
        instructor: "Siti Aminah, S.Sn., Gr."
      },
      {
        id: "mn-2",
        studentId: "stud-2",
        date: "2026-06-06",
        notes: "Membahas progres projek animasi kelompok bersama supervisor. Siswa disarankan berlatih gestur dinamis.",
        industryFeedback: "Amalia memiliki imajinasi kuat. Sangat potensial di bidang visual storytelling.",
        attendance: 95,
        instructor: "Siti Aminah, S.Sn., Gr."
      }
    ];
  });

  // Synchronized Assessment State
  const [assessments, setAssessments] = useState<Record<string, {
    attitudeScore: number;
    technicalScore: number;
    reportScore: number;
    notes: string;
  }>>(() => {
    const local = localStorage.getItem("pkl_student_assessments");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error("Failed to parse assessments", e);
      }
    }
    return {
      "stud-1": {
        attitudeScore: 92,
        technicalScore: 89,
        reportScore: 88,
        notes: "Kinerja luar biasa. Kompetensi portofolio visual sangat menunjang karir industri kreatif."
      },
      "stud-2": {
        attitudeScore: 95,
        technicalScore: 94,
        reportScore: 90,
        notes: "Pencapaian luar biasa dalam adaptasi tim animasi nasional. Terus kembangkan skill digital painting."
      }
    };
  });

  // Draft fields for inputting/updating data safely
  const [journalDateDraft, setJournalDateDraft] = useState(new Date().toISOString().split('T')[0]);
  const [journalActivityDraft, setJournalActivityDraft] = useState("");
  
  const [monitorDateDraft, setMonitorDateDraft] = useState(new Date().toISOString().split('T')[0]);
  const [monitorNotesDraft, setMonitorNotesDraft] = useState("");
  const [monitorFeedbackDraft, setMonitorFeedbackDraft] = useState("");
  const [monitorAttendanceDraft, setMonitorAttendanceDraft] = useState(100);
  const [monitorInstructorDraft, setMonitorInstructorDraft] = useState("Siti Aminah, S.Sn., Gr.");

  const [attitudeScoreDraft, setAttitudeScoreDraft] = useState(85);
  const [technicalScoreDraft, setTechnicalScoreDraft] = useState(85);
  const [reportScoreDraft, setReportScoreDraft] = useState(85);
  const [assessmentNotesDraft, setAssessmentNotesDraft] = useState("");

  // Auto-reset drawer tab and pre-fill scores when selected Student changes to ensure 100% data integrity
  useEffect(() => {
    if (selectedStudent) {
      setDrawerTab('profil');
      const studentAss = assessments[selectedStudent.id];
      if (studentAss) {
        setAttitudeScoreDraft(studentAss.attitudeScore);
        setTechnicalScoreDraft(studentAss.technicalScore);
        setReportScoreDraft(studentAss.reportScore);
        setAssessmentNotesDraft(studentAss.notes || "");
      } else {
        setAttitudeScoreDraft(85);
        setTechnicalScoreDraft(85);
        setReportScoreDraft(85);
        setAssessmentNotesDraft("");
      }
      // Reset journal draft activity
      setJournalActivityDraft("");
      // Reset monitoring visit drafts
      setMonitorNotesDraft("");
      setMonitorFeedbackDraft("");
      setMonitorAttendanceDraft(100);
    }
  }, [selectedStudent]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("pkl_simulated_role", userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem("pkl_student_journals", JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    localStorage.setItem("pkl_student_monitoring", JSON.stringify(monitorVisits));
  }, [monitorVisits]);

  useEffect(() => {
    localStorage.setItem("pkl_student_assessments", JSON.stringify(assessments));
  }, [assessments]);

  // Handler functions for logs
  const handleAddJournal = (studentId: string) => {
    if (!journalActivityDraft.trim()) return;
    const newEntry = {
      id: "jr-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      studentId,
      date: journalDateDraft,
      activity: journalActivityDraft.trim(),
      status: 'Pending' as const,
      feedback: ""
    };
    setJournals(prev => [newEntry, ...prev]);
    setJournalActivityDraft("");
  };

  const handleUpdateJournalFeedback = (journalId: string, status: 'Approved' | 'NeedsRevision', feedback: string) => {
    setJournals(prev => prev.map(jr => jr.id === journalId ? { ...jr, status, feedback } : jr));
  };

  const handleDeleteJournal = (journalId: string) => {
    setJournals(prev => prev.filter(jr => jr.id !== journalId));
  };

  const handleAddMonitoring = (studentId: string) => {
    if (!monitorNotesDraft.trim()) return;
    const newVisit = {
      id: "mn-" + Date.now() + "-" + Math.floor(Math.random() * 100),
      studentId,
      date: monitorDateDraft,
      notes: monitorNotesDraft.trim(),
      industryFeedback: monitorFeedbackDraft.trim() || "Siswa berkinerja dengan baik.",
      attendance: Number(monitorAttendanceDraft) || 100,
      instructor: monitorInstructorDraft
    };
    setMonitorVisits(prev => [newVisit, ...prev]);
    setMonitorNotesDraft("");
    setMonitorFeedbackDraft("");
  };

  const handleDeleteMonitoring = (visitId: string) => {
    setMonitorVisits(prev => prev.filter(v => v.id !== visitId));
  };

  const handleSaveAssessment = (studentId: string) => {
    setAssessments(prev => ({
      ...prev,
      [studentId]: {
        attitudeScore: Number(attitudeScoreDraft) || 0,
        technicalScore: Number(technicalScoreDraft) || 0,
        reportScore: Number(reportScoreDraft) || 0,
        notes: assessmentNotesDraft.trim()
      }
    }));
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(filteredStudents.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleSelectStudent = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds(prev => [...prev, id]);
    } else {
      setSelectedStudentIds(prev => prev.filter(x => x !== id));
    }
  };

  const handleBulkStatusUpdate = (status: StudentStatus) => {
    selectedStudentIds.forEach(id => {
      onUpdateStudent(id, { status });
    });
    // Sync active drawers/modals if affected
    if (selectedStudent && selectedStudentIds.includes(selectedStudent.id)) {
      setSelectedStudent(prev => prev ? { ...prev, status } : null);
    }
    if (viewingStudent && selectedStudentIds.includes(viewingStudent.id)) {
      setViewingStudent(prev => prev ? { ...prev, status } : null);
    }
    // Clear selection on success
    setSelectedStudentIds([]);
  };

  // Modal / Form standard control states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [formError, setFormError] = useState("");
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);

  // Form Field States
  const [newStudent, setNewStudent] = useState({
    name: "",
    nis: "",
    className: "XII DKV 1",
    companyId: companies[0]?.id || "",
    skills: "Desain Grafis, After Effects",
    portfolioUrl: "behance.net/username",
    portfolioHighlight: "Project Desain Logo UMKM",
    phone: "081234567800",
    email: "siswa@smkn1teluknaga.sch.id",
    status: "Unassigned" as StudentStatus,
    parentName: "",
    parentOccupation: "",
    studentAddress: "",
    birthPlaceDate: "Tangerang, 10 Juni 2008"
  });

  const COMMON_DKV_SKILLS = [
    "UI/UX Design",
    "Motion Graphics",
    "Illustration & Drawing",
    "Video Editing",
    "Graphic Design",
    "Branding & Logo",
    "Photography",
    "Typography",
    "3D Modeling",
    "Web Design"
  ];

  const toggleSkillInForm = (skill: string) => {
    const currentSkillsList = newStudent.skills
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    
    const exists = currentSkillsList.some(s => s.toLowerCase() === skill.toLowerCase());
    let nextSkills;
    if (exists) {
      nextSkills = currentSkillsList.filter(s => s.toLowerCase() !== skill.toLowerCase());
    } else {
      nextSkills = [...currentSkillsList, skill];
    }
    setNewStudent({
      ...newStudent,
      skills: nextSkills.join(", ")
    });
  };

  // Filtered Students query
  const filteredStudents = students.filter(student => {
    const matchSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        student.nis.includes(searchTerm) || 
                        student.skills.join(" ").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || student.status === statusFilter;
    const matchClass = classFilter === "ALL" || student.className === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  // Get distinct classes
  const classes = Array.from(new Set(students.map(s => s.className)));

  const resetFormState = () => {
    setNewStudent({
      name: "",
      nis: "",
      className: "XII DKV 1",
      companyId: companies[0]?.id || "",
      skills: "Desain Grafis, After Effects",
      portfolioUrl: "behance.net/username",
      portfolioHighlight: "Project Desain Logo UMKM",
      phone: "081234567800",
      email: "siswa@smkn1teluknaga.sch.id",
      status: "Unassigned" as StudentStatus,
      parentName: "",
      parentOccupation: "",
      studentAddress: "",
      birthPlaceDate: "Tangerang, 10 Juni 2008"
    });
    setEditingStudentId(null);
    setFormErrors({});
    setFormError("");
  };

  const handleEditStudentClick = (student: Student) => {
    setNewStudent({
      name: student.name,
      nis: student.nis,
      className: student.className,
      companyId: student.companyId,
      skills: student.skills.join(", "),
      portfolioUrl: student.portfolioUrl,
      portfolioHighlight: student.portfolioHighlight || "",
      phone: student.phone,
      email: student.email,
      status: student.status,
      parentName: student.parentName || "",
      parentOccupation: student.parentOccupation || "",
      studentAddress: student.studentAddress || "",
      birthPlaceDate: student.birthPlaceDate || "Tangerang, 10 Juni 2008"
    });
    setEditingStudentId(student.id);
    setFormErrors({});
    setFormError("");
    setIsAddOpen(true);
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setFormError("");

    // Validate with Zod
    const validationResult = studentFormSchema.safeParse(newStudent);
    if (!validationResult.success) {
      const errors: Record<string, string> = {};
      validationResult.error.issues.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(errors);
      setFormError("Registrasi gagal. Harap perbaiki kolom yang tidak valid.");
      return;
    }

    // NIS uniqueness check
    const isNisDuplicate = editingStudentId
      ? students.some(s => s.nis === newStudent.nis && s.id !== editingStudentId)
      : students.some(s => s.nis === newStudent.nis);

    if (isNisDuplicate) {
      setFormErrors(prev => ({ ...prev, nis: "NIS ini sudah terdaftar oleh siswa lain." }));
      setFormError("Nomor Induk Siswa (NIS) harus unik. NIS ini sudah digunakan.");
      return;
    }

    if (editingStudentId) {
      // Update Mode
      onUpdateStudent(editingStudentId, {
        name: newStudent.name,
        nis: newStudent.nis,
        className: newStudent.className,
        companyId: newStudent.companyId,
        skills: newStudent.skills.split(",").map(s => s.trim()).filter(Boolean),
        portfolioUrl: newStudent.portfolioUrl,
        portfolioHighlight: newStudent.portfolioHighlight,
        phone: newStudent.phone,
        email: newStudent.email,
        status: newStudent.status,
        parentName: newStudent.parentName || "Nama Wali",
        parentOccupation: newStudent.parentOccupation || "Wiraswasta",
        studentAddress: newStudent.studentAddress || "Teluknaga",
        birthPlaceDate: newStudent.birthPlaceDate
      });
      
      // Update selectedStudent in state so it updates active drawers etc.
      if (selectedStudent?.id === editingStudentId) {
        setSelectedStudent(prev => prev ? {
          ...prev,
          name: newStudent.name,
          nis: newStudent.nis,
          className: newStudent.className,
          companyId: newStudent.companyId,
          skills: newStudent.skills.split(",").map(s => s.trim()).filter(Boolean),
          portfolioUrl: newStudent.portfolioUrl,
          portfolioHighlight: newStudent.portfolioHighlight,
          phone: newStudent.phone,
          email: newStudent.email,
          status: newStudent.status,
          parentName: newStudent.parentName || "Nama Wali",
          parentOccupation: newStudent.parentOccupation || "Wiraswasta",
          studentAddress: newStudent.studentAddress || "Teluknaga",
          birthPlaceDate: newStudent.birthPlaceDate
        } : null);
      }
    } else {
      // Create Mode
      onAddStudent({
        name: newStudent.name,
        nis: newStudent.nis,
        className: newStudent.className,
        companyId: newStudent.companyId,
        skills: newStudent.skills.split(",").map(s => s.trim()).filter(Boolean),
        portfolioUrl: newStudent.portfolioUrl,
        portfolioHighlight: newStudent.portfolioHighlight,
        phone: newStudent.phone,
        email: newStudent.email,
        status: newStudent.status,
        parentName: newStudent.parentName || "Nama Wali",
        parentOccupation: newStudent.parentOccupation || "Wiraswasta",
        studentAddress: newStudent.studentAddress || "Teluknaga",
        birthPlaceDate: newStudent.birthPlaceDate
      });
    }

    resetFormState();
    setIsAddOpen(false);
  };

  const triggerSampleBulkLoad = () => {
    const header = "Nama\tNIS\tKelas\tKeahlian\tPortofolio\tParent\tPekerjaan\tAlamat";
    const row1 = "Gerry Gunawan\t242510011\tXII DKV 1\tEditing Video, Premiere Pro, After Effects\tyoutube.com/gerrydkv\tUdin Gunawan\tSopir\tKp. Melayu Timur No. 12, Teluknaga, Tangerang";
    const row2 = "Safira Maharani\t242510012\tXII DKV 2\tIlustrator Digital, Vector Art, Clip Paint Studio\tbehance.net/safirart\tAgus Muksin\tPedagang Sembako\tKp. Tanjung Pasir Baru RT 02/03, Tangerang";
    const row3 = "Farhan Syahputra\t242510013\tXII DKV 1\tLayouting Majalah, InDesign, Photoshop, Canva\tdribbble.com/farhan\tHendra Syah\tKaryawan Pabrik\tDesa Lemo RT 11/04, Teluknaga, Tangerang";
    setBulkText(`${header}\n${row1}\n${row2}\n${row3}`);
  };

  const handleExecuteBulk = () => {
    if (!bulkText.trim()) return;
    const addedCount = onBulkImport(bulkText);
    setImportSuccessCount(addedCount);
    setBulkText("");
    setTimeout(() => {
      setImportSuccessCount(null);
      setIsBulkOpen(false);
    }, 2500);
  };

  const handleDownloadCSV = () => {
    const headers = [
      "ID Siswa",
      "Nama Lengkap",
      "NIS",
      "Kelas",
      "Status PKL",
      "Keahlian Unggulan",
      "Portofolio URL",
      "Highlight Karya",
      "No. HP",
      "Email Siswa",
      "Orang Tua / Wali",
      "Pekerjaan Orang Tua",
      "Alamat Rumah",
      "Tempat Tanggal Lahir",
      "Perusahaan Penempatan"
    ];

    const rows = students.map(student => {
      const comp = companies.find(c => c.id === student.companyId);
      const statusText = student.status === "Unassigned" 
        ? "Belum PKL" 
        : student.status === "Pending" 
        ? "Menunggu HRD" 
        : student.status === "Ongoing" 
        ? "Sedang PKL" 
        : "Selesai PKL";

      return [
        student.id,
        student.name,
        student.nis,
        student.className,
        statusText,
        student.skills.join(", "),
        student.portfolioUrl,
        student.portfolioHighlight,
        student.phone,
        student.email,
        student.parentName,
        student.parentOccupation,
        student.studentAddress,
        student.birthPlaceDate,
        comp ? comp.name : "Belum Ditugaskan"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => 
        row.map(val => {
          const str = val ? String(val) : "";
          if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Backup_Siswa_DKV_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: StudentStatus) => {
    switch (status) {
      case "Unassigned":
        return <span className="bg-rose-100 text-rose-700 font-medium text-[10px] px-2.5 py-1 rounded-full border border-rose-200">Belum PKL</span>;
      case "Pending":
        return <span className="bg-amber-100 text-amber-700 font-medium text-[10px] px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">Menunggu HRD</span>;
      case "Ongoing":
        return <span className="bg-cyan-100 text-cyan-700 font-medium text-[10px] px-2.5 py-1 rounded-full border border-cyan-200">Sedang PKL</span>;
      case "Completed":
        return <span className="bg-emerald-100 text-emerald-700 font-medium text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">Selesai PKL</span>;
    }
  };

  return (
    <div className="space-y-6" id="siswa-tab">
      {/* Simulation Role Switcher Bar */}
      <div className="glass-panel p-4 rounded-xl border border-blue-500/20 bg-blue-950/20 flex flex-col md:flex-row justify-between items-center gap-4 no-print" id="simulation-role-bar">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs">Simulasi Peran PKL & Monitoring</h4>
            <p className="text-[10px] text-white/50 mt-0.5">Sistem memisahkan fitur siswa (mengisi jurnal harian) dan guru pembimbing (penilaian & monitoring).</p>
          </div>
        </div>
        <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 gap-1 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => setUserRole('Guru')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md font-semibold text-xs cursor-pointer transition-all ${
              userRole === 'Guru'
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/15"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            👨‍🏫 Guru Pembimbing
          </button>
          <button
            type="button"
            onClick={() => setUserRole('Siswa')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-md font-semibold text-xs cursor-pointer transition-all ${
              userRole === 'Siswa'
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/15"
                : "text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            🎓 Siswa/i DKV
          </button>
        </div>
      </div>

      {/* Top action layout */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center glass-panel p-5 rounded-2xl shadow-xl border border-white/10">
        <div>
          <h3 className="font-display font-bold text-lg text-white">Database Siswa DKV</h3>
          <p className="text-xs text-white/60">Total data terdaftar: <strong className="text-blue-300">{students.length} Siswa</strong></p>
        </div>
        
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          <button 
            onClick={handleDownloadCSV}
            className="flex-1 sm:flex-none bg-white/5 text-white border border-white/10 hover:bg-white/10 font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            id="download-csv-btn"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Download CSV
          </button>

          <button 
            onClick={() => setIsBulkOpen(true)}
            className="flex-1 sm:flex-none bg-white/5 text-white border border-white/10 hover:bg-white/10 font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            Import Massal (Excel)
          </button>
          
          <button 
            onClick={() => { resetFormState(); setIsAddOpen(true); }}
            className="flex-1 sm:flex-none bg-blue-600 text-white hover:bg-blue-500 font-semibold text-xs px-3.5 py-2.5 rounded-lg shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Stats Cards Display Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print" id="student-stats-row">
        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center gap-3" id="stat-card-total">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Total Siswa</span>
            <span className="font-display font-extrabold text-lg text-white" id="stat-val-total">{students.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center gap-3" id="stat-card-assigned">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Sudah PKL</span>
            <span className="font-display font-extrabold text-lg text-emerald-400" id="stat-val-assigned">
              {students.filter(s => s.status === 'Ongoing' || s.status === 'Completed').length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center gap-3" id="stat-card-pending">
          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Menunggu HRD</span>
            <span className="font-display font-extrabold text-lg text-amber-300 shadow-sm" id="stat-val-pending">
              {students.filter(s => s.status === 'Pending').length}
            </span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl border border-white/10 flex items-center gap-3" id="stat-card-unassigned">
          <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider block">Belum PKL</span>
            <span className="font-display font-extrabold text-lg text-rose-400" id="stat-val-unassigned">
              {students.filter(s => s.status === 'Unassigned').length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: main table on left, expanding drawer on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Table container column */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Filters card */}
          <div className="glass-panel p-4 rounded-xl flex flex-col md:flex-row gap-3" id="student-filters-container">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-white/45 absolute left-3 top-3" />
              <input 
                type="text" 
                id="student-search-input"
                placeholder="Cari Nama, NIS, Keahlian..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full glass-input rounded-lg pl-9 pr-4 py-2 text-xs outline-none text-white"
              />
            </div>
            
            {/* Class Filter */}
            <div className="w-full md:w-42">
              <select
                id="student-class-filter"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs outline-none cursor-pointer bg-[#10101d] text-white"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map(c => <option key={c} value={c} className="bg-[#10101d]">{c}</option>)}
              </select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-42">
              <select
                id="student-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full glass-input rounded-lg px-3 py-2 text-xs outline-none cursor-pointer bg-[#10101d] text-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="Unassigned">Belum PKL</option>
                <option value="Pending">Menunggu HRD</option>
                <option value="Ongoing">Sedang PKL</option>
                <option value="Completed">Selesai PKL</option>
              </select>
            </div>

            {/* Reset Button */}
            {(searchTerm !== "" || classFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                type="button"
                id="reset-filters-btn"
                onClick={() => {
                  setSearchTerm("");
                  setClassFilter("ALL");
                  setStatusFilter("ALL");
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white hover:text-red-400 font-semibold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                title="Reset Semua Pencarian & Filter"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {/* Bulk Action Toolbar */}
          {selectedStudentIds.length > 0 && (
            <div className="glass-panel p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 flex flex-col md:flex-row justify-between items-center gap-3 animate-fade-in" id="bulk-action-bar">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping"></span>
                <span className="text-xs font-semibold text-white">
                  Terpilih <span className="text-blue-300 font-bold">{selectedStudentIds.length}</span> siswa PKV untuk aksi massal:
                </span>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button
                  type="button"
                  onClick={() => handleBulkStatusUpdate("Unassigned")}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-rose-300 font-semibold text-[10px] px-2.5 py-1.5 rounded cursor-pointer transition-all"
                  id="bulk-set-unassigned"
                >
                  Belum PKL
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusUpdate("Pending")}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-amber-300 font-semibold text-[10px] px-2.5 py-1.5 rounded cursor-pointer transition-all"
                  id="bulk-set-pending"
                >
                  Menunggu HRD
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusUpdate("Ongoing")}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-cyan-300 font-semibold text-[10px] px-2.5 py-1.5 rounded cursor-pointer transition-all"
                  id="bulk-set-ongoing"
                >
                  Sedang PKL
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusUpdate("Completed")}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[10px] px-2.5 py-1.5 rounded shadow-lg shadow-blue-500/20 cursor-pointer transition-all"
                  id="bulk-set-completed"
                >
                  Selesai PKL
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white font-semibold text-[10px] px-2.5 py-1.5 rounded cursor-pointer transition-all"
                  id="bulk-cancel-btn"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* List/Table */}
          <div className="glass-panel rounded-xl shadow-xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider font-semibold">
                    <th className="py-3.5 px-4 font-bold w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="h-4 w-4 rounded cursor-pointer accent-blue-600 bg-white/5 border-white/10"
                        title="Pilih Semua Siswa"
                        id="select-all-checkbox"
                      />
                    </th>
                    <th className="py-3.5 px-4 font-bold">Nama / NIS</th>
                    <th className="py-3.5 px-4 font-bold hidden sm:table-cell">Kelas</th>
                    <th className="py-3.5 px-4 font-bold">Penempatan</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs text-white/85">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => {
                      const comp = companies.find(c => c.id === student.companyId);
                      return (
                        <tr 
                          key={student.id} 
                          onClick={() => {
                            setSelectedStudent(student);
                            setViewingStudent(student);
                          }}
                          className={`hover:bg-white/5 transition-all duration-150 cursor-pointer ${selectedStudent?.id === student.id ? 'bg-white/10 font-medium' : ''}`}
                        >
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.id)}
                              onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                              className="h-4 w-4 rounded cursor-pointer accent-blue-600 bg-white/5 border-white/10"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{student.name}</div>
                            <div className="text-[10px] text-white/40 font-mono mt-0.5">{student.nis}</div>
                          </td>
                          <td className="py-3 px-4 text-white/70 hidden sm:table-cell">{student.className}</td>
                          <td className="py-3 px-4">
                            <div className="text-white flex items-center gap-1 font-medium">
                              <Briefcase className="w-3.5 h-3.5 text-white/30" />
                              {comp ? comp.name : "Mandiri / Belum Ada"}
                            </div>
                            <div className="text-[10px] text-blue-400 mt-0.5 truncate max-w-44">{student.portfolioUrl}</div>
                          </td>
                          <td className="py-3 px-4">{getStatusBadge(student.status)}</td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setViewingStudent(student);
                                }}
                                className="p-1.5 rounded text-blue-400 hover:bg-white/10 transition-colors cursor-pointer"
                                title="Lihat Profil Lengkap"
                              >
                                <Maximize2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleEditStudentClick(student)}
                                className="p-1.5 rounded text-amber-400 hover:bg-white/10 transition-colors cursor-pointer"
                                title="Edit Profil Siswa"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => onDeleteStudent(student.id)}
                                className="p-1.5 rounded text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-white/40">
                        <AlertCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                        <p className="text-sm font-medium">Siswa tidak ditemukan</p>
                        <p className="text-xs text-white/40 mt-0.5">Ubah kata kunci pencarian atau filter Anda.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Student profile drawer (right side) */}
        <div>
          {selectedStudent ? (
            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/12 shadow-2xl p-6 space-y-5 sticky top-6">
              <div className="flex items-start justify-between border-b border-white/10 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{selectedStudent.className}</span>
                  <h3 className="font-display font-extrabold text-base text-white mt-0.5">{selectedStudent.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleEditStudentClick(selectedStudent)}
                    className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-white/10 cursor-pointer transition-colors"
                    title="Edit Profil Siswa"
                  >
                    <Edit3 className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>

              {/* Status control */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider block font-sans">Status PKL Siswa</label>
                <div className="flex flex-wrap gap-1">
                  {(['Unassigned', 'Pending', 'Ongoing', 'Completed'] as StudentStatus[]).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        onUpdateStudent(selectedStudent.id, { status: st });
                        setSelectedStudent(prev => prev ? { ...prev, status: st } : null);
                      }}
                      className={`text-[9px] font-semibold px-2 py-1 rounded cursor-pointer transition-all ${
                        selectedStudent.status === st 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10 border border-blue-400/30' 
                          : 'bg-[#10101d] border border-white/5 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      {st === 'Unassigned' ? 'Belum PKL' : st === 'Pending' ? 'Melamar' : st === 'Ongoing' ? 'PKL Aktif' : 'Selesai'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabs selector */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#10101d] rounded-xl border border-white/5 text-[10px] font-sans no-print">
                <button
                  type="button"
                  onClick={() => setDrawerTab('profil')}
                  className={`py-1.5 rounded-lg text-center font-bold tracking-tight transition-all cursor-pointer ${
                    drawerTab === 'profil' ? "bg-blue-600 text-white shadow-inner" : "text-white/50 hover:text-white"
                  }`}
                >
                  Profil
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('jurnal')}
                  className={`py-1.5 rounded-lg text-center font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    drawerTab === 'jurnal' ? "bg-blue-600 text-white shadow-inner" : "text-white/50 hover:text-white"
                  }`}
                >
                  Jurnal
                  <span className="bg-white/10 px-1 py-0.25 rounded text-[8px] font-semibold">
                    {journals.filter(j => j.studentId === selectedStudent.id).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('monitoring')}
                  className={`py-1.5 rounded-lg text-center font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    drawerTab === 'monitoring' ? "bg-blue-600 text-white shadow-inner" : "text-white/50 hover:text-white"
                  }`}
                  title="Monitoring Guru Pembimbing"
                >
                  Monitor
                  <span className="bg-white/10 px-1 py-0.25 rounded text-[8px] font-semibold">
                    {monitorVisits.filter(v => v.studentId === selectedStudent.id).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('penilaian')}
                  className={`py-1.5 rounded-lg text-center font-bold tracking-tight transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    drawerTab === 'penilaian' ? "bg-blue-600 text-white shadow-inner" : "text-white/50 hover:text-white"
                  }`}
                >
                  Nilai
                  {assessments[selectedStudent.id] && (
                    <span className="bg-emerald-500/20 text-emerald-400 px-1 py-0.25 rounded text-[8px] font-bold">
                      {Math.round(
                        (assessments[selectedStudent.id].attitudeScore * 0.3) +
                        (assessments[selectedStudent.id].technicalScore * 0.5) +
                        (assessments[selectedStudent.id].reportScore * 0.2)
                      )}
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Contents: Profil */}
              {drawerTab === 'profil' && (
                <div className="space-y-4 text-xs animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-white/40 text-[9px] uppercase font-semibold">NIS Siswa</span>
                      <p className="font-mono text-white font-bold mt-0.5">{selectedStudent.nis}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[9px] uppercase font-semibold">HP Siswa</span>
                      <p className="text-white font-bold mt-0.5">{selectedStudent.phone}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-white/40 text-[9px] uppercase font-semibold block font-sans">Tempat Tanggal Lahir</span>
                    <p className="text-white/80 font-medium mt-0.5">{selectedStudent.birthPlaceDate || 'Tangerang, 10 Juni 2008'}</p>
                  </div>

                  <div>
                    <span className="text-white/40 text-[9px] uppercase font-semibold block font-sans">Situs Portofolio / Tautan</span>
                    <a 
                      href={`https://${selectedStudent.portfolioUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-400 font-semibold hover:underline flex items-center gap-1 mt-0.5 text-xs"
                    >
                      {selectedStudent.portfolioUrl}
                      <MaxClassIcon />
                    </a>
                  </div>

                  <div>
                    <span className="text-white/40 text-[9px] uppercase font-semibold block">Highlight Karya</span>
                    <p className="text-white/85 bg-[#10101d] p-2.5 rounded-lg border border-white/8 mt-1 leading-relaxed italic">
                      "{selectedStudent.portfolioHighlight || 'Belum ada deskripsi karya.'}"
                    </p>
                  </div>

                  <div>
                    <span className="text-white/40 text-[9px] uppercase font-semibold block">Keahlian Unggulan DKV</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {selectedStudent.skills.map((sk, idx) => (
                        <span key={idx} className="bg-white/5 text-white/80 font-medium text-[10px] px-2 py-0.5 rounded border border-white/10">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-white/40 text-[9px] uppercase font-semibold block font-sans">Orang Tua / Wali</span>
                        <p className="text-white font-medium mt-0.5">{selectedStudent.parentName || '-'}</p>
                      </div>
                      <div>
                        <span className="text-white/40 text-[9px] uppercase font-semibold block font-sans">Pekerjaan</span>
                        <p className="text-white font-medium mt-0.5">{selectedStudent.parentOccupation || '-'}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-white/40 text-[9px] uppercase font-semibold block">Alamat Rumah</span>
                      <p className="text-white/70 text-[11px] leading-relaxed mt-0.5">{selectedStudent.studentAddress || '-'}</p>
                    </div>
                  </div>

                  {/* Linked Company details */}
                  <div className="pt-3.5 border-t border-white/10 space-y-1 bg-white/5 p-3 rounded-lg border border-white/10">
                    <span className="text-white/40 text-[9px] uppercase font-bold tracking-wider block font-sans">Perusahaan Penempatan</span>
                    {selectedStudent.companyId && companies.find(c => c.id === selectedStudent.companyId) ? (
                      (() => {
                        const linkedC = companies.find(c => c.id === selectedStudent.companyId)!;
                        return (
                          <div className="text-xs">
                            <h4 className="font-bold text-white">{linkedC.name}</h4>
                            <p className="text-white/55 text-[10px] mt-0.5 leading-relaxed">{linkedC.address}</p>
                            <div className="flex items-center justify-between text-[11px] text-white/70 font-semibold mt-2">
                              <span>HRD: <strong className="text-white font-semibold">{linkedC.contactPerson}</strong></span>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <p className="text-white/40 italic text-[11px]">Belum ditugaskan ke perusahaan manapun.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Contents: Jurnal */}
              {drawerTab === 'jurnal' && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                        <BookOpen className="w-4 h-4 text-blue-400" />
                        Jurnal Aktivitas Harian DKV
                      </h4>
                      <p className="text-[10px] text-white/55 mt-0.5">Siswa wajib mengisi log kegiatan ini setiap hari kerja.</p>
                    </div>
                  </div>

                  {/* Student Mode - Log Writer Form */}
                  {userRole === 'Siswa' ? (
                    <div className="bg-white/5 border border-white/8 p-3.5 rounded-xl space-y-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block font-sans">
                        + Tambah Entri Jurnal Baru (Peran Siswa)
                      </span>
                      <div className="grid grid-cols-1 gap-2.5">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Tanggal Kegiatan</label>
                          <input 
                            type="date"
                            value={journalDateDraft}
                            onChange={(e) => setJournalDateDraft(e.target.value)}
                            className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-white/40 block mb-1 font-sans">Deskripsi Pekerjaan / Proyek DKV</label>
                          <textarea
                            rows={3}
                            placeholder="Contoh: Menyusun storyboard untuk video profil klien SMKN, lalu mengedit bumper opening di After Effects..."
                            value={journalActivityDraft}
                            onChange={(e) => setJournalActivityDraft(e.target.value)}
                            className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2.5 text-xs outline-none placeholder-white/35 leading-relaxed focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddJournal(selectedStudent.id)}
                        disabled={!journalActivityDraft.trim()}
                        className="w-full bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-55 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-indigo-500/15"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Simpan Entri Jurnal
                      </button>
                    </div>
                  ) : (
                    <div className="bg-blue-950/20 border border-blue-500/20 text-[11px] text-blue-300 p-3 rounded-lg leading-relaxed font-sans">
                      👨‍🏫 <strong>Peran Guru Pembimbing:</strong> Anda dapat memeriksa seluruh log jurnal di bawah ini. Berikan penilaian per entri, tawarkan catatan umpan balik, atau setujui langsung.
                    </div>
                  )}

                  {/* List of journal entries */}
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {journals.filter(j => j.studentId === selectedStudent.id).length === 0 ? (
                      <div className="bg-[#10101d] rounded-xl p-6 text-center text-white/35 border border-white/5">
                        <Clock className="w-8 h-8 text-white/10 mx-auto mb-1.5" />
                        <p className="font-semibold text-xs text-white/70">Jurnal Masih Kosong</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Siswa belum memasukkan entri log harian.</p>
                      </div>
                    ) : (
                      journals
                        .filter(j => j.studentId === selectedStudent.id)
                        .map((jr) => {
                          return (
                            <div key={jr.id} className="bg-white/5 border border-white/10 p-3 rounded-xl space-y-2 text-xs relative">
                              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                <span className="font-bold flex items-center gap-1 text-blue-300 text-[10px] font-mono">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {jr.date}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {jr.status === 'Approved' ? (
                                    <span className="bg-emerald-500/15 text-emerald-400 font-bold text-[9px] px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-0.5">
                                      ✓ Disetujui
                                    </span>
                                  ) : jr.status === 'NeedsRevision' ? (
                                    <span className="bg-rose-500/15 text-rose-400 font-bold text-[9px] px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-0.4">
                                      ⚠ Revisi
                                    </span>
                                  ) : (
                                    <span className="bg-amber-500/15 text-amber-400 font-bold text-[9px] px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-0.4">
                                      Pending
                                    </span>
                                  )}
                                  
                                  {/* Allow deletion */}
                                  <button
                                    type="button"
                                    onClick={() => { if(confirm("Hapus jurnal ini?")) handleDeleteJournal(jr.id) }}
                                    className="text-white/20 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                                    title="Hapus entri ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <p className="text-white/85 text-[11px] leading-relaxed break-words font-medium">
                                "{jr.activity}"
                              </p>

                              {/* Teacher feedback view / editor */}
                              {userRole === 'Guru' ? (
                                <div className="bg-[#0b0b13] border border-white/5 p-2 px-2.5 rounded-lg space-y-2 text-[11px] mt-1.5">
                                  <span className="font-bold text-[9px] uppercase tracking-wider text-white/50 block font-sans">
                                    Format Koreksi Catatan Pembimbing:
                                  </span>
                                  <input 
                                    type="text"
                                    placeholder="Tulis kritik/saran pembimbing..."
                                    defaultValue={jr.feedback}
                                    onBlur={(e) => handleUpdateJournalFeedback(jr.id, jr.status, e.target.value)}
                                    className="w-[#100%] bg-[#10101d] text-white border border-white/10 rounded p-1.5 text-[10px] outline-none"
                                  />
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateJournalFeedback(jr.id, 'NeedsRevision', jr.feedback)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                        jr.status === 'NeedsRevision' ? "bg-rose-600 text-white" : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                                      }`}
                                    >
                                      Minta Revisi
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateJournalFeedback(jr.id, 'Approved', jr.feedback)}
                                      className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                        jr.status === 'Approved' ? "bg-[#10b981] text-white" : "bg-white/5 border border-white/10 text-white/50 hover:bg-white/10"
                                      }`}
                                    >
                                      ✓ Setujui Jurnal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                jr.feedback && (
                                  <div className="bg-indigo-950/30 border border-indigo-500/15 p-2 px-2.5 rounded-lg text-[10px] mt-1 text-indigo-400">
                                    <strong className="text-indigo-200 font-bold">Catatan Pembimbing:</strong> {jr.feedback}
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>
              )}

              {/* Tab Contents: Monitoring */}
              {drawerTab === 'monitoring' && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div>
                    <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      Laporan Monitoring & Kunjungan Guru
                    </h4>
                    <p className="text-[10px] text-white/55 mt-0.5">Catatan audit fisik guru pembimbing ke lokasi industri PKL.</p>
                  </div>

                  {userRole === 'Guru' ? (
                    <div className="bg-white/5 border border-white/8 p-3.5 rounded-xl space-y-3 font-sans">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                        + Catat Kunjungan Monitoring Baru
                      </span>
                      <div className="grid grid-cols-2 gap-2.5 text-xs">
                        <div>
                          <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Tanggal Kunjungan</label>
                          <input 
                            type="date"
                            value={monitorDateDraft}
                            onChange={(e) => setMonitorDateDraft(e.target.value)}
                            className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Guru Kunjungan</label>
                          <input 
                            type="text"
                            value={monitorInstructorDraft}
                            onChange={(e) => setMonitorInstructorDraft(e.target.value)}
                            className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none font-semibold"
                          />
                        </div>
                      </div>

                      <div className="text-xs">
                        <label className="text-[9px] uppercase font-bold text-white/40 block mb-1 font-sans">Perkembangan Kerja & Kedisiplinan Siswa</label>
                        <textarea
                          rows={2}
                          placeholder="Tulis catatan monitoring (misal: Siswa hadir tepat waktu & sopan, menguasai project...)"
                          value={monitorNotesDraft}
                          onChange={(e) => setMonitorNotesDraft(e.target.value)}
                          className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none leading-relaxed focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 text-xs items-center">
                        <div className="col-span-2">
                          <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Feedback Penyelia Industri</label>
                          <input 
                            type="text"
                            placeholder="Contoh: 'Disiplin dan bertanggung jawab'"
                            value={monitorFeedbackDraft}
                            onChange={(e) => setMonitorFeedbackDraft(e.target.value)}
                            className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Kehadiran (%)</label>
                          <input 
                            type="number"
                            min="0"
                            max="100"
                            value={monitorAttendanceDraft}
                            onChange={(e) => setMonitorAttendanceDraft(Number(e.target.value) || 100)}
                            className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none font-mono font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddMonitoring(selectedStudent.id)}
                        disabled={!monitorNotesDraft.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-55 text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-blue-500/10"
                      >
                        ✓ Rekam Kunjungan
                      </button>
                    </div>
                  ) : (
                    <div className="bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-300 p-3 rounded-lg leading-relaxed font-sans">
                      🎓 Siswa dapat memantau catatan pembimbingan kunjungan guru ke perusahaan untuk perbaikan disiplin kerja.
                    </div>
                  )}

                  {/* Previous visits */}
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {monitorVisits.filter(v => v.studentId === selectedStudent.id).length === 0 ? (
                      <div className="bg-[#10101d] rounded-xl p-6 text-center text-white/35 border border-white/5">
                        <Calendar className="w-8 h-8 text-white/10 mx-auto mb-1.5" />
                        <p className="font-semibold text-xs text-white/70">Monitoring Belum Ada</p>
                        <p className="text-[10px] text-white/40 mt-0.5">Belum ada catatan kunjungan guru pembimbing.</p>
                      </div>
                    ) : (
                      monitorVisits
                        .filter(v => v.studentId === selectedStudent.id)
                        .map((vt) => (
                          <div key={vt.id} className="bg-white/5 border border-white/8 p-3 rounded-xl space-y-2 text-xs">
                            <div className="flex items-center justify-between border-b border-white/5 pb-1">
                              <span className="font-bold text-blue-300 text-[10px] font-mono flex items-center gap-1">
                                📅 {vt.date}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-500/15 text-indigo-300 font-bold text-[9px] px-2 py-0.5 rounded border border-indigo-500/20">
                                  Hadir: {vt.attendance}%
                                </span>
                                {userRole === 'Guru' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMonitoring(vt.id)}
                                    className="text-white/20 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-white/85 text-[11px] leading-relaxed font-medium">
                              <strong>Catatan Guru:</strong> {vt.notes}
                            </p>
                            {vt.industryFeedback && (
                              <p className="bg-black/25 text-white/70 p-2 rounded-lg text-[10px] italic border border-white/5 leading-relaxed">
                                "Saran Mentor: {vt.industryFeedback}"
                              </p>
                            )}
                            <div className="pt-1.5 flex justify-between text-[9px] text-white/40 font-semibold font-sans">
                              <span>Pembimbing: {vt.instructor}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab Contents: Penilaian */}
              {drawerTab === 'penilaian' && (
                <div className="space-y-4 animate-fade-in font-sans">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5 font-sans">
                        <Award className="w-4 h-4 text-emerald-400" />
                        Lembar Penilaian Hasil PKL DKV
                      </h4>
                      <p className="text-[10px] text-white/55 mt-0.5">Penilaian kompetensi siswa berdasarkan aspek industri dwi-pihak.</p>
                    </div>
                  </div>

                  {/* Calculations Block */}
                  {(() => {
                    const finalScore = Math.round((attitudeScoreDraft * 0.3) + (technicalScoreDraft * 0.5) + (reportScoreDraft * 0.2));
                    const isPassing = finalScore >= 75;
                    const letterGrade = finalScore >= 90 ? "A (Sangat Baik)" : finalScore >= 80 ? "B (Baik)" : finalScore >= 75 ? "C (Cukup)" : "D (Butuh Bimbingan)";
                    
                    return (
                      <div className="space-y-4 font-sans">
                        {/* Interactive fields for Guru Role */}
                        {userRole === 'Guru' ? (
                          <div className="bg-white/5 border border-white/8 p-3.5 rounded-xl space-y-3.5 text-xs">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block font-sans">
                              📝 Input Skor Nilai PKL (Peran Pembimbing)
                            </span>
                            
                            <div className="space-y-3 text-xs">
                              <div>
                                <div className="flex justify-between font-semibold mb-1">
                                  <span className="text-white/70">1. Aspek Sikap & Disiplin Industri (30%)</span>
                                  <span className="text-emerald-400 font-bold">{attitudeScoreDraft}</span>
                                </div>
                                <input 
                                  type="range"
                                  min="50"
                                  max="100"
                                  value={attitudeScoreDraft}
                                  onChange={(e) => setAttitudeScoreDraft(Number(e.target.value))}
                                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between font-semibold mb-1">
                                  <span className="text-white/70">2. Kompetensi Teknis Grafis/DKV (50%)</span>
                                  <span className="text-emerald-400 font-bold">{technicalScoreDraft}</span>
                                </div>
                                <input 
                                  type="range"
                                  min="50"
                                  max="100"
                                  value={technicalScoreDraft}
                                  onChange={(e) => setTechnicalScoreDraft(Number(e.target.value))}
                                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between font-semibold mb-1">
                                  <span className="text-white/70">3. Laporan Buku & Presentasi Akhir (20%)</span>
                                  <span className="text-emerald-400 font-bold">{reportScoreDraft}</span>
                                </div>
                                <input 
                                  type="range"
                                  min="50"
                                  max="100"
                                  value={reportScoreDraft}
                                  onChange={(e) => setReportScoreDraft(Number(e.target.value))}
                                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                />
                              </div>
                            </div>

                            <div className="text-xs">
                              <label className="text-[9px] uppercase font-bold text-white/40 block mb-1">Rekomendasi / Kelebihan Utama</label>
                              <textarea
                                rows={2}
                                value={assessmentNotesDraft}
                                onChange={(e) => setAssessmentNotesDraft(e.target.value)}
                                placeholder="Tuliskan apresiasi kinerja, misal: Sangat berbakat di ilustrasi/branding, komunikasi baik..."
                                className="w-full bg-[#10101d] text-white border border-white/10 rounded-lg p-2 text-xs outline-none font-sans leading-relaxed"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                handleSaveAssessment(selectedStudent.id);
                              }}
                              className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md shadow-emerald-500/15"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Simpan & Sahkan Nilai
                            </button>
                          </div>
                        ) : (
                          <div className="bg-[#0b0b13] border border-indigo-500/10 text-[11px] text-indigo-300 p-3 rounded-lg leading-relaxed font-sans">
                            🎓 <strong>Laporan Prestasi Siswa:</strong> Nilai ini diisi oleh guru pembimbing gabungan dengan instruktur industri penempatan.
                          </div>
                        )}

                        {/* Grade card slip (highly visual/printable look) */}
                        <div className="bg-gradient-to-br from-[#12122b] to-[#101021] border border-white/10 p-5 rounded-2xl space-y-4 shadow-xl">
                          <div className="flex justify-between items-start border-b border-white/5 pb-2.5">
                            <div>
                              <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest font-sans">Daftar Nilai PKL</span>
                              <h4 className="text-xs font-bold text-white mt-0.5">Sertifikasi Praktik DKV</h4>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isPassing 
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" 
                                : "bg-rose-500/15 text-rose-400 border-rose-500/20"
                            }`}>
                              {isPassing ? "✓ LULUS PKL" : "EVALUASI"}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2.5 text-center">
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                              <span className="text-[8px] text-white/40 uppercase block">Disiplin</span>
                              <p className="text-white font-bold text-sm mt-0.5">{attitudeScoreDraft}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                              <span className="text-[8px] text-white/40 uppercase block">Grafis/Teknis</span>
                              <p className="text-white font-bold text-sm mt-0.5">{technicalScoreDraft}</p>
                            </div>
                            <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                              <span className="text-[8px] text-white/40 uppercase block">Laporan</span>
                              <p className="text-white font-bold text-sm mt-0.5">{reportScoreDraft}</p>
                            </div>
                          </div>

                          <div className="bg-white/3 p-3.5 rounded-xl border border-white/8 space-y-1 text-center">
                            <span className="text-[9px] text-white/40 block font-sans">Skor Total Gabungan</span>
                            <p className="text-xl font-extrabold text-emerald-400 font-mono tracking-tight">{finalScore}/100</p>
                            <span className="text-[9px] text-white/60 block font-semibold">Predikat: <strong className="text-white font-bold">{letterGrade}</strong></span>
                          </div>

                          {assessmentNotesDraft && (
                            <div className="p-2.5 bg-[#0c0c16] rounded-xl border border-white/5">
                              <span className="text-[8px] font-bold text-white/40 uppercase block tracking-wider mb-1">Evaluasi Guru Pembimbing:</span>
                              <p className="text-[10px] text-white/85 leading-relaxed italic">
                                "{assessmentNotesDraft}"
                              </p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-white/5 text-[9px] text-white/35 flex justify-between">
                            <span>Sistem Nilai Terakreditasi</span>
                            <span>SMKN 1 Teluknaga</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel border-2 border-dashed border-white/15 rounded-xl p-8 text-center text-white/40 sticky top-6">
              <Eye className="w-10 h-10 text-white/20 mx-auto mb-2" />
              <h4 className="font-bold text-white text-sm">Pratinjau Siswa</h4>
              <p className="text-xs text-white/40 mt-1 leading-relaxed">
                Pilih atau klik baris salah satu siswa pada tabel untuk melihat profil, jurnal harian, catatan kunjungan monitoring, dan lembar nilai hasil kerja terintegrasi secara cepat.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Tambah/Edit Siswa */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <h3 className="font-display font-bold text-lg text-slate-900">
                {editingStudentId ? "Edit Informasi Siswa DKV" : "Registrasi Siswa Baru DKV"}
              </h3>
              <button 
                onClick={() => { resetFormState(); setIsAddOpen(false); }}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Lengkap Siswa *</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Muhammad Rafli"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.name && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">NIS (Nomor Induk Siswa) *</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 242510009"
                    required
                    value={newStudent.nis}
                    onChange={(e) => setNewStudent({...newStudent, nis: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.nis && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.nis}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Kelas DKV</label>
                  <select 
                    value={newStudent.className}
                    onChange={(e) => setNewStudent({...newStudent, className: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  >
                    <option value="XII DKV 1">XII DKV 1</option>
                    <option value="XII DKV 2">XII DKV 2</option>
                    <option value="XII DKV 3">XII DKV 3</option>
                  </select>
                  {formErrors.className && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.className}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">No. HP Siswa</label>
                  <input 
                    type="text" 
                    placeholder="0812XXXXXXXX"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.phone && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Email Belajar Siswa</label>
                  <input 
                    type="email" 
                    placeholder="name@siswa.smkn1teluknaga.sch.id"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.email && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 block">Keahlian Unggulan DKV (Pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  placeholder="Editing Video, Adobe Illustrator, Fotografi, Layout Buku"
                  value={newStudent.skills}
                  onChange={(e) => setNewStudent({...newStudent, skills: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
                {formErrors.skills && (
                  <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.skills}
                  </p>
                )}
                <div className="mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200" id="common-skills-quick-select">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block mb-1.5 font-sans">
                    Pilih Keahlian Umum DKV (Multi-seleksi):
                  </span>
                  <div className="flex flex-wrap gap-1.5 font-semibold">
                    {COMMON_DKV_SKILLS.map((sk) => {
                      const isSelected = newStudent.skills
                        .split(",")
                        .map(s => s.trim().toLowerCase())
                        .includes(sk.toLowerCase());
                      return (
                        <button
                          key={sk}
                          type="button"
                          onClick={() => toggleSkillInForm(sk)}
                          className={`text-[10px] px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-500 shadow-sm shadow-indigo-500/15"
                              : "bg-white hover:bg-slate-100 text-slate-750 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "} {sk}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tautan Portofolio (Behance / Web)</label>
                  <input 
                    type="text" 
                    placeholder="behance.net/username"
                    value={newStudent.portfolioUrl}
                    onChange={(e) => setNewStudent({...newStudent, portfolioUrl: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.portfolioUrl && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.portfolioUrl}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sebutkan 1 Karya Desain Terbaik</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Desain Brosur PMB & Logo Koperasi"
                    value={newStudent.portfolioHighlight}
                    onChange={(e) => setNewStudent({...newStudent, portfolioHighlight: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.portfolioHighlight && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.portfolioHighlight}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Nama Orang Tua / Wali</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Achmad"
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.parentName && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.parentName}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Pekerjaan Orang Tua / Wali</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Wiraswasta / Buruh"
                    value={newStudent.parentOccupation}
                    onChange={(e) => setNewStudent({...newStudent, parentOccupation: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.parentOccupation && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.parentOccupation}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Tempat Tanggal Lahir</label>
                  <input 
                    type="text" 
                    placeholder="Tangerang, 10 Juni 2008"
                    value={newStudent.birthPlaceDate}
                    onChange={(e) => setNewStudent({...newStudent, birthPlaceDate: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  {formErrors.birthPlaceDate && (
                    <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.birthPlaceDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Alamat Lengkap Rumah</label>
                <textarea 
                  rows={2}
                  placeholder="Kp. Melayu Timur RT 01/RW 03, Kec. Teluknaga, Tangerang"
                  value={newStudent.studentAddress}
                  onChange={(e) => setNewStudent({...newStudent, studentAddress: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 outline-none focus:ring-1 focus:ring-indigo-500 resize-none font-medium"
                />
                {formErrors.studentAddress && (
                  <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.studentAddress}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Penempatan Perusahaan Awal</label>
                <select 
                  value={newStudent.companyId}
                  onChange={(e) => setNewStudent({...newStudent, companyId: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-250 text-slate-800 rounded-lg p-2.5 cursor-pointer outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>)}
                </select>
                {formErrors.companyId && (
                  <p className="text-rose-600 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" /> {formErrors.companyId}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-150">
                <button 
                  type="button"
                  onClick={() => { resetFormState(); setIsAddOpen(false); }}
                  className="px-4 py-2 border border-slate-250 rounded-lg text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer font-bold animate-pulse-once"
                >
                  {editingStudentId ? "Simpan Perubahan" : "Daftarkan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Import Massal (Excel / Tabular Text) */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-display font-bold text-lg text-slate-900">Import Massal Siswa PKL DKV</h3>
              </div>
              <button 
                onClick={() => setIsBulkOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importSuccessCount !== null ? (
              <div className="bg-emerald-50 border border-emerald-250 p-6 rounded-lg text-center space-y-2 animate-pulse">
                <Check className="w-8 h-8 text-emerald-500 mx-auto bg-emerald-100 p-1.5 rounded-full" />
                <h4 className="font-bold text-emerald-800 text-sm">Import Sukses!</h4>
                <p className="text-xs text-emerald-650 font-medium">Berhasil mengimpor {importSuccessCount} siswa baru ke sistem.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="bg-indigo-50 border border-indigo-150 text-indigo-850 p-3.5 rounded-lg space-y-1.5">
                  <h4 className="font-bold flex items-center gap-1.5 text-xs text-indigo-900">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Panduan Mempercepat Administrasi
                  </h4>
                  <p className="text-[11px] leading-relaxed text-indigo-800">
                    Anda dapat menyalin (copy) rangkaian baris sel tabel murni dari <strong>Microsoft Excel, Google Sheets, atau Word</strong> lalu menempelkannya (paste) ke kotak di bawah ini. Harap gunakan format kolom di bawah ini:
                  </p>
                  <div className="bg-slate-950 text-slate-300 p-2 rounded text-[10px] font-mono select-all font-semibold overflow-x-auto">
                    Nama [Tab] NIS [Tab] Kelas [Tab] Keahlian [Tab] Portofolio [Tab] OrangTua [Tab] Pekerjaan [Tab] Alamat
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button 
                    type="button"
                    onClick={triggerSampleBulkLoad}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    Load Data Percobaan
                  </button>
                  <span className="text-[10px] text-slate-400">Total karakter: {bulkText.length}</span>
                </div>

                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder="Korsor di sini, lalu tempel data tabel (Ctrl+V)..."
                  className="w-full bg-slate-50 border border-slate-250 font-mono text-[11px] p-3 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                />

                <div className="flex gap-2 justify-end pt-4 border-t border-slate-150">
                  <button 
                    type="button"
                    onClick={() => setIsBulkOpen(false)}
                    className="px-4 py-2 border border-slate-250 rounded-lg text-slate-650 hover:bg-slate-50 transition-colors cursor-pointer font-semibold"
                  >
                    Batal
                  </button>
                  <button 
                    type="button"
                    onClick={handleExecuteBulk}
                    disabled={!bulkText.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer font-bold"
                  >
                    Impor Sekarang
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Detail Siswa Pintasan/Read-Only */}
      {viewingStudent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in no-print" id="student-view-modal">
          <div className="bg-[#121223] text-white rounded-2xl shadow-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 relative">
            
            {/* Header: Name and Close button */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{viewingStudent.className}</span>
                <h3 className="font-display font-extrabold text-lg text-white mt-1 flex items-center gap-2">
                  {viewingStudent.name}
                  <span className="text-xs font-mono text-white/40">({viewingStudent.nis})</span>
                </h3>
              </div>
              <button 
                onClick={() => setViewingStudent(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
                id="close-view-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Grid */}
            <div className="space-y-4 text-xs">
              
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block">Status Penempatan</span>
                  <div className="mt-1">{getStatusBadge(viewingStudent.status)}</div>
                </div>
                {viewingStudent.companyId && companies.find(c => c.id === viewingStudent.companyId) ? (
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block font-sans">Perusahaan Penempatan</span>
                    <span className="font-bold text-blue-400 mt-1 block">
                      {companies.find(c => c.id === viewingStudent.companyId)?.name}
                    </span>
                  </div>
                ) : (
                  <div className="text-right">
                    <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block font-sans">Perusahaan Penempatan</span>
                    <span className="italic text-white/40 mt-1 block font-medium">Mandiri / Belum Ditugaskan</span>
                  </div>
                )}
              </div>

              {/* Sections Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Academic & Contact Card */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                  <h4 className="font-bold text-white/80 uppercase tracking-wider text-[10px] border-b border-white/5 pb-1">Kontak & Detail Siswa</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-white/40 text-[10px] uppercase block">No. HP</span>
                      <p className="font-semibold text-white/90 mt-0.5">{viewingStudent.phone || '-'}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase block font-sans">Lahir</span>
                      <p className="font-semibold text-white/90 mt-0.5">{viewingStudent.birthPlaceDate || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] uppercase block">Email Siswa</span>
                    <p className="font-mono text-blue-300 mt-0.5 break-all">{viewingStudent.email || '-'}</p>
                  </div>
                </div>

                {/* Parent / Guardian Card */}
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                  <h4 className="font-bold text-white/80 uppercase tracking-wider text-[10px] border-b border-white/5 pb-1 font-sans">Orang Tua / Wali</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-white/40 text-[10px] uppercase block">Nama Orang Tua</span>
                      <p className="font-semibold text-white/90 mt-0.5">{viewingStudent.parentName || '-'}</p>
                    </div>
                    <div>
                      <span className="text-white/40 text-[10px] uppercase block">Pekerjaan</span>
                      <p className="font-semibold text-white/90 mt-0.5">{viewingStudent.parentOccupation || '-'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-white/40 text-[10px] uppercase block">Alamat Rumah</span>
                    <p className="text-white/70 leading-relaxed mt-0.5 break-words">{viewingStudent.studentAddress || '-'}</p>
                  </div>
                </div>

              </div>

              {/* Skills and Portfolio */}
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-3">
                <h4 className="font-bold text-white/80 uppercase tracking-wider text-[10px] border-b border-white/5 pb-1 font-sans">Portofolio & Kompetensi DKV</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <span className="text-white/40 text-[10px] uppercase block">Situs Portofolio Utama</span>
                    {viewingStudent.portfolioUrl ? (
                      <a 
                        href={viewingStudent.portfolioUrl.startsWith('http') ? viewingStudent.portfolioUrl : `https://${viewingStudent.portfolioUrl}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 text-blue-400 font-bold hover:underline bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg text-xs"
                      >
                        <span className="truncate max-w-[200px]">{viewingStudent.portfolioUrl}</span>
                        <MaxClassIcon />
                      </a>
                    ) : (
                      <span className="text-white/40 italic text-[11px]">Tidak ada tautan</span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-white/40 text-[10px] uppercase block font-sans">Highlight Karya Terbaik</span>
                    <p className="bg-black/25 text-white/90 p-2 rounded-lg font-medium italic border border-white/5 leading-relaxed">
                      "{viewingStudent.portfolioHighlight || 'Belum ada deskripsi karya.'}"
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-white/40 text-[10px] uppercase block mb-1.5 font-sans">Keahlian Unggulan DKV</span>
                  <div className="flex flex-wrap gap-1.5">
                    {viewingStudent.skills && viewingStudent.skills.length > 0 ? (
                      viewingStudent.skills.map((sk, idx) => (
                        <span 
                          key={idx} 
                          className="bg-white/5 text-white/90 font-medium text-[10px] px-2.5 py-1 rounded-md border border-white/10"
                        >
                          {sk}
                        </span>
                      ))
                    ) : (
                      <span className="text-white/40 italic text-[10px]">Belum ada keahlian khusus terdaftar</span>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="flex justify-end pt-2 border-t border-white/10">
              <button 
                onClick={() => setViewingStudent(null)}
                className="bg-blue-600 text-white font-bold text-xs px-4 py-2 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer font-sans"
              >
                Tutup Detail
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function MaxClassIcon() {
  return (
    <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
