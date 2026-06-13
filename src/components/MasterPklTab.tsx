import React, { useState } from "react";
import { Student, Company, StudentStatus, LogbookEntry } from "../types";
import GoogleSheetsSync from "./GoogleSheetsSync";
import { 
  Table, 
  Search, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  Clipboard, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  HelpCircle, 
  X, 
  Check, 
  Save,
  Filter,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Users,
  Briefcase,
  Zap
} from "lucide-react";

interface MasterPklTabProps {
  students: Student[];
  companies: Company[];
  logbooks: LogbookEntry[];
  onAddStudent: (student: Omit<Student, "id">) => void;
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onAddCompany: (company: Company) => void;
  onUpdateCompany?: (id: string, updated: Partial<Company>) => void;
  onBulkImportMaster: (parsedData: Array<{ student: Omit<Student, "id">; company?: Company }>) => void;
  onSyncLogbooks: (entries: LogbookEntry[]) => void;
  showToast?: (message: string, type?: "info" | "success") => void;
}

export default function MasterPklTab({
  students,
  companies,
  logbooks,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onAddCompany,
  onUpdateCompany,
  onBulkImportMaster,
  onSyncLogbooks,
  showToast
}: MasterPklTabProps) {
  // Navigation & Search Filters
  const [activeSubTab, setActiveSubTab] = useState<"siswa" | "kuota">("siswa");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [specializationFilter, setSpecializationFilter] = useState<string>("ALL");

  // State management for manual Adding and Editing Rows
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Form Fields State
  const [studentName, setStudentName] = useState("");
  const [studentNis, setStudentNis] = useState("");
  const [studentClass, setStudentClass] = useState("XII DKV 1");
  const [studentSkills, setStudentSkills] = useState("");
  const [studentPortfolio, setStudentPortfolio] = useState("");
  const [studentDriveKarya, setStudentDriveKarya] = useState("");
  const [studentStatus, setStudentStatus] = useState<StudentStatus>("Unassigned");
  const [studentPhone, setStudentPhone] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentBirthInfo, setStudentBirthInfo] = useState("Tangerang, 10 Juni 2008");
  const [parentName, setParentName] = useState("");
  const [parentOccupation, setParentOccupation] = useState("");
  const [studentAddress, setStudentAddress] = useState("");

  // Linked Company Form State
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("comp-6"); // Default mencari
  const [customCompanyName, setCustomCompanyName] = useState("");
  const [customCompanyAddress, setCustomCompanyAddress] = useState("");
  const [customCompanyHrd, setCustomCompanyHrd] = useState("");
  const [customCompanyEmail, setCustomCompanyEmail] = useState("");
  const [customCompanyPhone, setCustomCompanyPhone] = useState("");
  const [customStartDate, setCustomStartDate] = useState("2026-07-01");
  const [customEndDate, setCustomEndDate] = useState("2026-09-30");

  // Bulk raw paste field state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Floating / Quick Add Company States
  const [isQuickCompanyOpen, setIsQuickCompanyOpen] = useState(false);
  const [quickCompanyName, setQuickCompanyName] = useState("");
  const [quickCompanySlots, setQuickCompanySlots] = useState(3);
  const [quickCompanyAddress, setQuickCompanyAddress] = useState("Tangerang");
  const [quickCompanyIndustry, setQuickCompanyIndustry] = useState("Industri Kreatif DKV");
  const [quickCompanyHrd, setQuickCompanyHrd] = useState("HRD Team");
  const [quickCompanyEmail, setQuickCompanyEmail] = useState("");

  const handleQuickAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCompanyName.trim()) {
      alert("Nama perusahaan mitra wajib diisi!");
      return;
    }

    const normalizedNew = quickCompanyName.trim().toLowerCase();
    const isDuplicate = companies.some(c => c.name.toLowerCase() === normalizedNew);
    if (isDuplicate) {
      alert(`Perusahaan "${quickCompanyName}" sudah terdaftar sebagai mitra industri.`);
      return;
    }

    const newCompanyId = "comp-instant-" + Date.now();
    const newCompany: Company = {
      id: newCompanyId,
      name: quickCompanyName.trim(),
      slots: Math.max(1, quickCompanySlots),
      address: quickCompanyAddress.trim() || "Tangerang",
      industry: quickCompanyIndustry.trim() || "Industri Kreatif DKV",
      contactPerson: quickCompanyHrd.trim() || "HRD Team",
      hrdEmail: quickCompanyEmail.trim() || `${quickCompanyName.trim().toLowerCase().replace(/\s+/g, "")}@industrial.id`
    };

    onAddCompany(newCompany);
    if (showToast) {
      showToast(`Mitra "${newCompany.name}" berhasil ditambahkan secara instan!`, "success");
    } else {
      alert(`Mitra "${newCompany.name}" berhasil ditambahkan!`);
    }

    // Reset fields
    setQuickCompanyName("");
    setQuickCompanySlots(3);
    setQuickCompanyAddress("Tangerang");
    setQuickCompanyIndustry("Industri Kreatif DKV");
    setQuickCompanyHrd("HRD Team");
    setQuickCompanyEmail("");
    setIsQuickCompanyOpen(false);
  };

  // Helper template paste trigger
  const handleLoadDemoBulk = () => {
    setBulkRawText(
      `Nama Lengkap Siswa | NISN | Kelas | Jurusan | Spesialisasi DKV | Link Portofolio Utama | Link Google Drive Karya | Nama Perusahaan/DUDI | Alamat DUDI | Nama Kontak HRD | Email HRD | No HP HRD | Tanggal Mulai | Tanggal Selesai
Andi Pratama | 0051234567 | XII DKV 1 | Desain Komunikasi Visual | Branding | https://behance.net/andi | | PT Kreasi Visual | Jakarta | Ibu Sari | hrd@kreasi.id | 021-1234 | 2026-07-01 | 2026-09-30
Siti Nurhaliza | 0051234568 | XII DKV 1 | Desain Komunikasi Visual | UI/UX | https://behance.net/siti | | Mighty Studio Design | Tangerang | Kak Dimas | dimas@mighty.studio | 0812-3456 | 2026-07-01 | 2026-09-30
Budi Santoso | 0051234569 | XII DKV 1 | Desain Komunikasi Visual | Ilustrasi | https://dribbble.com/budi | | CV Digital Kreatif | BSD | Pak Joko | joko@digital.id | 0813-7890 | 2026-07-01 | 2026-09-30
Dewi Lestari | 0051234570 | XII DKV 1 | Desain Komunikasi Visual | Motion Graphic | https://behance.net/dewi | | Motion Labs | Jakarta Selatan | Mba Rina | rina@motionlabs.id | 0814-5678 | 2026-07-01 | 2026-09-30
Rian Firmansyah | 0051234571 | XII DKV 1 | Desain Komunikasi Visual | Fotografi | https://instagram.com/rian.portfolio | | StartUp Creative | Tangerang | Mas Adi | adi@startup.id | 0815-9012 | 2026-07-01 | 2026-09-30`
    );
  };

  // Processing parsed rows
  const handleProcessBulkImport = () => {
    if (!bulkRawText.trim()) {
      setBulkError("Kotak teks salinan masih kosong.");
      return;
    }

    try {
      const lines = bulkRawText.split("\n");
      const parsedEntries: Array<{ student: Omit<Student, "id">; company?: Company }> = [];
      let successCount = 0;

      // Detect header row and clean it up
      const firstLineText = lines[0].toLowerCase();
      const hasHeader = firstLineText.includes("nama") || firstLineText.includes("nisn") || firstLineText.includes("perusahaan") || firstLineText.includes("dudi");
      const startLineIndex = hasHeader ? 1 : 0;

      for (let i = startLineIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Split intelligently by: Pipe bars |, Tabs \t, or Commas ,
        let cols: string[] = [];
        if (line.includes("|")) {
          cols = line.split("|").map(c => c.trim());
        } else if (line.includes("\t")) {
          cols = line.split("\t").map(c => c.trim());
        } else {
          cols = line.split(",").map(c => c.trim());
        }

        if (cols.length < 2) continue;

        // Map cells to fields
        const sName = cols[0] || "";
        const sNisn = cols[1] || "";
        const sClass = cols[2] || "XII DKV 1";
        // Department index is cols[3] -> Desain Komunikasi Visual
        const sSpecialization = cols[4] || "Branding & Desain Grafis";
        const sPortfolio = cols[5] || "";
        const sDriveKarya = cols[6] || "";
        const cName = cols[7] || "";
        const cAddress = cols[8] || "-";
        const cHrdName = cols[9] || "HRD Team";
        const cHrdEmail = cols[10] || "";
        const cHrdPhone = cols[11] || "";
        const startDateVal = cols[12] || "2026-07-01";
        const endDateVal = cols[13] || "2026-09-30";

        // Create skills array from specialization and standard default DKV tags
        const skillsArray = sSpecialization.split("&").map(s => s.trim()).filter(Boolean);
        if (skillsArray.length === 0) {
          skillsArray.push("Desain Komunikasi Visual");
        }

        let finalCompanyId = "comp-6"; // Belum terdistribusi

        let newlyCreatedCompany: Company | undefined = undefined;

        if (cName && cName !== "-" && cName.toLowerCase() !== "mencari mandiri" && cName.toLowerCase() !== "belum terdistribusi") {
          // Check if company exists already
          const matchedCompany = companies.find(c => c.name.toLowerCase().includes(cName.toLowerCase()));
          if (matchedCompany) {
            finalCompanyId = matchedCompany.id;
          } else {
            // Generate a temporary new virtual company
            const newCompId = "comp-gen-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
            newlyCreatedCompany = {
              id: newCompId,
              name: cName,
              address: cAddress,
              contactPerson: cHrdName,
              hrdEmail: cHrdEmail || `${cName.toLowerCase().replace(/\s+/g, "")}@industrial.id`,
              industry: "Industri Kreatif DKV",
              slots: 3
            };
            finalCompanyId = newCompId;
          }
        }

        const emailAddress = sName.toLowerCase().replace(/\s+/g, ".") + "@siswa.smkn1teluknaga.sch.id";

        const tempStudentObj: Omit<Student, "id"> = {
          name: sName,
          nis: sNisn || (242510000 + Math.floor(Math.random() * 9000)).toString(),
          className: sClass,
          companyId: finalCompanyId,
          skills: skillsArray,
          portfolioUrl: sPortfolio || "behance.net/portfolio-all",
          portfolioHighlight: `Spesialisasi: ${sSpecialization}`,
          phone: "0813" + Math.floor(1000000 + Math.random() * 9000000),
          email: emailAddress,
          status: cName ? "Ongoing" : "Unassigned",
          parentName: "Wali Murid",
          parentOccupation: "Wiraswasta",
          studentAddress: "Tangerang, Banten",
          birthPlaceDate: "Tangerang, 10 Juni 2008",
          driveKaryaUrl: sDriveKarya,
          pklStartDate: startDateVal,
          pklEndDate: endDateVal
        };

        parsedEntries.push({
          student: tempStudentObj,
          company: newlyCreatedCompany
        });
        successCount++;
      }

      if (parsedEntries.length > 0) {
        onBulkImportMaster(parsedEntries);
        setBulkSuccessMsg(`Berhasil memproses dan menyelaraskan ${successCount} baris Master PKL DKV ke database lokal!`);
        setBulkRawText("");
        setBulkError(null);
        setTimeout(() => setBulkSuccessMsg(null), 6000);
      } else {
        setBulkError("Tidak ditemukan susunan baris siswa yang valid untuk diproses.");
      }

    } catch (err: any) {
      setBulkError("Format penguraian salah: " + err.message);
    }
  };

  // Clipboard export copy
  const handleCopyClipboard = () => {
    let output = "Nama Lengkap Siswa\tNISN\tKelas\tSpesialisasi DKV\tLink Portofolio Utama\tLink Google Drive Karya\tNama Perusahaan/DUDI\tAlamat DUDI\tNama Kontak HRD\tEmail HRD\tNo HP HRD\tTanggal Mulai\tTanggal Selesai\tStatus PKL\n";
    
    students.forEach(s => {
      const comp = companies.find(c => c.id === s.companyId) || { name: "-", address: "-", contactPerson: "-", hrdEmail: "-", id: "" };
      const spec = s.skills.join(", ");
      const specText = s.portfolioHighlight.includes("Spesialisasi:") 
        ? s.portfolioHighlight.replace("Spesialisasi:", "").trim() 
        : spec;

      output += `${s.name}\t${s.nis}\t${s.className}\t${specText}\t${s.portfolioUrl}\t${s.driveKaryaUrl || ""}\t${comp.name}\t${comp.address}\t${comp.contactPerson}\t${comp.hrdEmail}\t${s.phone || ""}\t${s.pklStartDate || "2026-07-01"}\t${s.pklEndDate || "2026-09-30"}\t${s.status}\n`;
    });

    navigator.clipboard.writeText(output);
    alert("Daftar Master PKL DKV berhasil disalin ke Papan Klip (Clipboard) dalam format Tab-Delimited! Silakan tempel (Ctrl+V) langsung ke Microsoft Excel atau Google Sheets.");
  };

  // CSV file download
  const handleDownloadCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Nama Lengkap Siswa,NISN,Kelas,Spesialisasi DKV,Portofolio,Drive Karya,Perusahaan DUDI,Alamat DUDI,Kontak HRD,Email HRD,StartDate,EndDate,Status\n";

    students.forEach(s => {
      const comp = companies.find(c => c.id === s.companyId) || { name: "-", address: "-", contactPerson: "-", hrdEmail: "" };
      const escape = (text: string) => `"${text.replace(/"/g, '""')}"`;
      
      const specText = s.portfolioHighlight.includes("Spesialisasi:") 
        ? s.portfolioHighlight.replace("Spesialisasi:", "").trim() 
        : s.skills.join("; ");

      const row = [
        escape(s.name),
        escape(s.nis),
        escape(s.className),
        escape(specText),
        escape(s.portfolioUrl),
        escape(s.driveKaryaUrl || ""),
        escape(comp.name),
        escape(comp.address),
        escape(comp.contactPerson),
        escape(comp.hrdEmail),
        escape(s.pklStartDate || "2026-07-01"),
        escape(s.pklEndDate || "2026-09-30"),
        escape(s.status)
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Program_PKL_DKV_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open Form for Adding Row
  const handleOpenAddForm = () => {
    setEditingStudentId(null);
    setStudentName("");
    setStudentNis("");
    setStudentClass("XII DKV 1");
    setStudentSkills("Branding, Desain Grafis, Layout");
    setStudentPortfolio("");
    setStudentDriveKarya("");
    setStudentStatus("Unassigned");
    setStudentPhone("");
    setStudentEmail("");
    setSelectedCompanyId("comp-6");
    setCustomCompanyName("");
    setCustomCompanyAddress("");
    setCustomCompanyHrd("");
    setCustomCompanyEmail("");
    setCustomCompanyPhone("");
    setCustomStartDate("2026-07-01");
    setCustomEndDate("2026-09-30");
    setParentName("Wali Murid");
    setParentOccupation("Wiraswasta");
    setStudentAddress("Tangerang");
    setIsFormOpen(true);
  };

  // Open Form for Editing Row
  const handleOpenEditForm = (student: Student) => {
    setEditingStudentId(student.id);
    setStudentName(student.name);
    setStudentNis(student.nis);
    setStudentClass(student.className);
    setStudentSkills(student.skills.join(", "));
    setStudentPortfolio(student.portfolioUrl);
    setStudentDriveKarya(student.driveKaryaUrl || "");
    setStudentStatus(student.status);
    setStudentPhone(student.phone);
    setStudentEmail(student.email);
    setSelectedCompanyId(student.companyId);
    
    const comp = companies.find(c => c.id === student.companyId);
    if (comp && comp.id !== "comp-6") {
      setCustomCompanyName(comp.name);
      setCustomCompanyAddress(comp.address);
      setCustomCompanyHrd(comp.contactPerson);
      setCustomCompanyEmail(comp.hrdEmail);
      setCustomCompanyPhone("");
    } else {
      setCustomCompanyName("");
      setCustomCompanyAddress("");
      setCustomCompanyHrd("");
      setCustomCompanyEmail("");
      setCustomCompanyPhone("");
    }

    setCustomStartDate(student.pklStartDate || "2026-07-01");
    setCustomEndDate(student.pklEndDate || "2026-09-30");
    setParentName(student.parentName || "Wali Murid");
    setParentOccupation(student.parentOccupation || "Wiraswasta");
    setStudentAddress(student.studentAddress || "Tangerang");
    setIsFormOpen(true);
  };

  // Save manual added or edited entry
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentNis) {
      alert("Nama lengkap dan NISN wajib ditentukan!");
      return;
    }

    // Process Skills list
    const skillsList = studentSkills.split(",").map(sk => sk.trim()).filter(Boolean);

    let compId = selectedCompanyId;
    // If user created a custom company on the fly in the form
    if (selectedCompanyId === "new" && customCompanyName) {
      const generatedCompId = "comp-gen-" + Date.now();
      const newDudi: Company = {
        id: generatedCompId,
        name: customCompanyName,
        address: customCompanyAddress || "Alamat Industri DKV",
        contactPerson: customCompanyHrd || "HRD Manager",
        hrdEmail: customCompanyEmail || "hrd@industrial-creative.id",
        industry: "Agensi Industri Kreatif",
        slots: 3
      };
      onAddCompany(newDudi);
      compId = generatedCompId;
    }

    const studentPatchFields: Partial<Student> = {
      name: studentName,
      nis: studentNis,
      className: studentClass,
      skills: skillsList,
      portfolioUrl: studentPortfolio || "behance.net/portfolio-all",
      portfolioHighlight: `Spesialisasi: ${skillsList[0] || 'DKV Generalist'}`,
      phone: studentPhone || "0813000000",
      email: studentEmail || `${studentName.toLowerCase().replace(/\s+/g, ".")}@siswa.smkn1teluknaga.sch.id`,
      status: studentStatus,
      companyId: compId,
      driveKaryaUrl: studentDriveKarya,
      pklStartDate: customStartDate,
      pklEndDate: customEndDate,
      parentName,
      parentOccupation,
      studentAddress
    };

    if (editingStudentId) {
      onUpdateStudent(editingStudentId, studentPatchFields);
      alert(`Data operasional ${studentName} berhasil diperbarui!`);
    } else {
      onAddStudent(studentPatchFields as Student);
      alert(`Entri PKL siswa ${studentName} berhasil ditambahkan!`);
    }

    setIsFormOpen(false);
    setEditingStudentId(null);
  };

  // Inline Quick Switch Status Option
  const handleQuickStatusSwitch = (sId: string, newStatus: StudentStatus) => {
    onUpdateStudent(sId, { status: newStatus });
  };

  // Filters calculation
  const uniqueClasses = Array.from(new Set(students.map(s => s.className)));
  const uniqueSpecializations = Array.from(new Set(students.flatMap(s => s.skills)));

  const filteredStudents = students.filter(s => {
    const comp = companies.find(c => c.id === s.companyId) || { name: "" };
    const specText = s.portfolioHighlight.includes("Spesialisasi:")
      ? s.portfolioHighlight.replace("Spesialisasi:", "").trim()
      : s.skills.join("; ");

    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nis.includes(searchTerm) ||
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchesClass = classFilter === "ALL" || s.className === classFilter;
    const matchesSpec = specializationFilter === "ALL" || s.skills.includes(specializationFilter);

    return matchesSearch && matchesStatus && matchesClass && matchesSpec;
  });

  // KPI Analytics values
  const totalSiswa = students.length;
  const ongoingSiswa = students.filter(s => s.status === "Ongoing").length;
  const completedSiswa = students.filter(s => s.status === "Completed").length;
  const pendingSiswa = students.filter(s => s.status === "Pending").length;
  const unassignedSiswa = students.filter(s => s.status === "Unassigned").length;

  return (
    <div className="space-y-6" id="master-pkl-tab-view">
      
      {/* Dynamic Alert message if any bulk successes */}
      {bulkSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 p-4 rounded-xl flex items-center gap-3 animate-fade-in text-emerald-400 font-sans text-xs">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span className="font-bold">{bulkSuccessMsg}</span>
        </div>
      )}

      {/* KPI Stats Panel Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5" id="master-analytics-ribbon">
        <div className="glass-panel p-4 rounded-2xl border border-white/5 flex flex-col justify-between space-y-1 bg-slate-900/30">
          <span className="text-white/40 text-[10.5px] uppercase font-bold tracking-widest font-sans">Total Siswa DKV</span>
          <span className="text-2xl font-display font-black text-white">{totalSiswa}</span>
          <span className="text-[10px] text-white/50">Program PKL Terdaftar</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 border-l-emerald-500/35 flex flex-col justify-between space-y-1 bg-slate-00/30">
          <span className="text-emerald-400/90 text-[10.5px] uppercase font-bold tracking-widest font-sans">Sedang Magang</span>
          <span className="text-2xl font-display font-black text-emerald-400">{ongoingSiswa}</span>
          <span className="text-[10px] text-emerald-300/60">Aktif di Perusahaan</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 border-l-blue-500/35 flex flex-col justify-between space-y-1 bg-slate-900/30">
          <span className="text-blue-400/90 text-[10.5px] uppercase font-bold tracking-widest font-sans">Lulus PKL</span>
          <span className="text-2xl font-display font-black text-blue-400">{completedSiswa}</span>
          <span className="text-[10px] text-blue-300/60">Nilai & Sertifikasi Oke</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 border-l-amber-500/35 flex flex-col justify-between space-y-1 bg-slate-900/30">
          <span className="text-amber-400/90 text-[10.5px] uppercase font-bold tracking-widest font-sans">Menunggu HRD</span>
          <span className="text-2xl font-display font-black text-amber-400">{pendingSiswa}</span>
          <span className="text-[10px] text-amber-300/60">Surat Terkirim (Pending)</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-white/5 border-l-rose-500/35 flex flex-col justify-between space-y-1 bg-slate-900/30 col-span-2 md:col-span-1">
          <span className="text-rose-400/90 text-[10.5px] uppercase font-bold tracking-widest font-sans">Belum Ditugaskan</span>
          <span className="text-2xl font-display font-black text-rose-400">{unassignedSiswa}</span>
          <span className="text-[10px] text-rose-300/60">Belum Memiliki DUDI</span>
        </div>
      </div>

      {/* Sub-tabs Toggle for Allocations & Co-op Capacities */}
      <div className="flex border-b border-white/10 shrink-0 gap-1 pb-1" id="master-subtabs-nav">
        <button
          type="button"
          onClick={() => setActiveSubTab("siswa")}
          className={`px-4.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === "siswa"
              ? "bg-blue-600 text-white shadow"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" />
          Siswa & Penempatan Magang
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("kuota")}
          id="tab-toggle-kuota"
          className={`px-4.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
            activeSubTab === "kuota"
              ? "bg-blue-600 text-white shadow"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Kuota Target Perusahaan
          <span className="bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">Real-time</span>
        </button>
      </div>

      {activeSubTab === "siswa" ? (
        <>
          {/* Primary Toolbar section & Actions Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-sans bg-slate-900/25 p-4 rounded-2xl border border-white/5" id="master-toolbar">
            
            {/* Left Search + Quick Count Filter tags */}
            <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            id="master-pkt-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama siswa, NISN, DUDI, atau spesialisasi..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 hover:border-white/15 focus:border-blue-500/60 outline-none text-slate-100 rounded-xl text-xs placeholder-slate-500 font-medium transition"
          />
        </div>

        {/* Action Button Panel (Bulk Import, Exports, Add Manual Entry) */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full sm:w-auto">
          
          <button
            type="button"
            id="btn-trigger-bulk-modal"
            onClick={() => setIsBulkOpen(!isBulkOpen)}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/90 text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Salin Excel/Spreadsheet
          </button>

          <button
            type="button"
            id="btn-master-copy-clipboard"
            onClick={handleCopyClipboard}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/95 text-xs px-3 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            title="Salin semua baris dengan pemisah Tab untuk Microsoft Excel"
          >
            <Clipboard className="w-4 h-4 text-blue-400" />
            Salin Grid
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/95 text-xs px-3 py-2.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 text-amber-400" />
            Ekspor CSV
          </button>

          <button
            type="button"
            id="btn-trigger-add-row"
            onClick={handleOpenAddForm}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2.5 rounded-xl font-extrabold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            Tambah Siswa PKL
          </button>

        </div>
      </div>

      {/* Dynamic Spreadsheet Bulk Paste Area inside workspace */}
      {isBulkOpen && (
        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/40 font-sans space-y-4 animate-fade-in" id="bulk-paste-section">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h4 className="font-display font-extrabold text-sm text-[#93c5fd] flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
              Impor Massal Spreadsheet Master PKL DKV
            </h4>
            <div className="flex items-center gap-2">
              <button 
                type="button"
                onClick={handleLoadDemoBulk}
                className="bg-white/5 border border-white/10 hover:bg-indigo-900/40 text-blue-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer"
              >
                Gunakan Contoh Format User
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

          <p className="text-white/60 text-xs leading-relaxed">
            Salin baris-baris data dari program Microsoft Excel atau Google Sheets Anda (termasuk judul kolom pada baris pertama jika ada) dan tempelkan kolomnya di bawah ini secara utuh. Sistem kami akan mengenali NISN, nama, kelas, spesialisasi, portofolio utama, link karya, perusahaan DUDI target, rincian kontak HRD, serta kesepakatan tanggal durasi PKL secara otomatis.
          </p>

          <div className="space-y-2">
            <textarea
              rows={8}
              value={bulkRawText}
              onChange={(e) => setBulkRawText(e.target.value)}
              placeholder="Contoh format:&#13;Andi Pratama | 0051234567 | XII DKV 1 | Desain Komunikasi Visual | Branding | http://behance.net | | PT Kreasi Visual | Jakarta | Ibu Sari | hrd@kreasi.id | 021-1234 | 2026-07-01 | 2026-09-30"
              className="w-full p-3 font-mono text-[11px] leading-relaxed bg-[#0a0a14] border border-white/10 focus:border-indigo-500/60 rounded-xl text-slate-200 outline-none placeholder-slate-600 block focus:ring-1 focus:ring-indigo-500"
            />
            
            {bulkError && (
              <div className="text-rose-400 font-bold text-xs flex items-center gap-1.5 pt-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Format Error: {bulkError}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setBulkRawText("");
                setBulkError(null);
              }}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer text-center"
            >
              Bersihkan
            </button>
            <button
              type="button"
              onClick={handleProcessBulkImport}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-4 rounded-xl font-extrabold text-xs transition shadow-md shadow-emerald-500/10 cursor-pointer text-center"
            >
              Mulai Sinkronisasi Baris
            </button>
          </div>
        </div>
      )}

      {/* Multi-Filter Bar Card */}
      <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-3.5 font-sans" id="master-multi-filters">
        
        {/* Filter 1: Status */}
        <div className="space-y-1 text-xs">
          <label className="font-bold text-white/50 block tracking-wide uppercase text-[9px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-blue-400" />
            Saring Status PKL
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full glass-input p-2 rounded-xl outline-none text-xs cursor-pointer bg-[#0f0f1b]"
          >
            <option value="ALL" className="bg-[#0f0f1b]">Tampilkan Semua Status ({totalSiswa} Siswa)</option>
            <option value="Unassigned" className="bg-[#0f0f1b]">Belum Ditugaskan / Mencari DUDI ({unassignedSiswa})</option>
            <option value="Pending" className="bg-[#0f0f1b]">Menunggu Konfirmasi HRD ({pendingSiswa})</option>
            <option value="Ongoing" className="bg-[#0f0f1b]">Sedang Magang Aktif ({ongoingSiswa})</option>
            <option value="Completed" className="bg-[#0f0f1b]">Telah Lulus Program PKL ({completedSiswa})</option>
          </select>
        </div>

        {/* Filter 2: Class */}
        <div className="space-y-1 text-xs">
          <label className="font-bold text-white/50 block tracking-wide uppercase text-[9px] flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            Saring Kelas DKV
          </label>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full glass-input p-2 rounded-xl outline-none text-xs cursor-pointer bg-[#0f0f1b]"
          >
            <option value="ALL" className="bg-[#0f0f1b]">Semua Rombel Kelas</option>
            {uniqueClasses.map(cls => (
              <option key={cls} value={cls} className="bg-[#0f0f1b]">{cls}</option>
            ))}
          </select>
        </div>

        {/* Filter 3: Specialization */}
        <div className="space-y-1 text-xs">
          <label className="font-bold text-white/50 block tracking-wide uppercase text-[9px] flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Saring Fokus Kompetensi
          </label>
          <select
            value={specializationFilter}
            onChange={(e) => setSpecializationFilter(e.target.value)}
            className="w-full glass-input p-2 rounded-xl outline-none text-xs cursor-pointer bg-[#0f0f1b]"
          >
            <option value="ALL" className="bg-[#0f0f1b]">Semua Bidang Portofolio</option>
            {uniqueSpecializations.map(sk => (
              <option key={sk} value={sk} className="bg-[#0f0f1b]">{sk}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Google Sheets Sync Integration Panel */}
      <GoogleSheetsSync
        students={students}
        companies={companies}
        logbooks={logbooks}
        onImportMaster={onBulkImportMaster}
        onSyncLogbooks={onSyncLogbooks}
        showToast={showToast}
      />

      {/* Grid Table Workspace */}
      <div className="glass-panel rounded-2xl border border-white/5 shadow-2xl overflow-hidden font-sans" id="master-table-workspace">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-[#121221] border-b border-white/10 text-white/50 uppercase tracking-widest font-mono text-[9px]">
                <th className="py-4 px-4.5 font-bold">Mahasiswa / NISN</th>
                <th className="py-4 px-4 font-bold">Rombel</th>
                <th className="py-4 px-4 font-bold">Fokus Karya / Link Portofolio</th>
                <th className="py-4 px-4.5 font-bold">Mitra DUDI & Kontak HRD</th>
                <th className="py-4 px-4 font-bold text-center">Durasi Kesepakatan</th>
                <th className="py-4 px-4 font-bold text-center">Rambu Status</th>
                <th className="py-4 px-4 font-bold text-right">Opsi Baris</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <div className="max-w-xs mx-auto space-y-2">
                      <p className="font-black text-sm text-slate-400">Tidak ada data Master yang Cocok</p>
                      <p className="text-[11px] leading-relaxed">
                        Coba bersihkan parameter pencarian atau saringan filter di atas untuk menampilkan seluruh database.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const correlatedDudi = companies.find(c => c.id === student.companyId) || {
                    name: "Mencari Mandiri / Belum Ditugaskan",
                    address: "-",
                    contactPerson: "-",
                    hrdEmail: "",
                    id: "comp-6"
                  };

                  const isUnassigned = student.companyId === "comp-6";

                  // Extract specialization text
                  const specString = student.portfolioHighlight && student.portfolioHighlight.includes("Spesialisasi:")
                    ? student.portfolioHighlight.replace("Spesialisasi:", "").trim()
                    : student.skills.slice(0, 2).join(", ");

                  return (
                    <tr 
                      key={student.id} 
                      className="hover:bg-white/[0.02] transition-colors focus-within:bg-white/[0.02]"
                    >
                      {/* Name & NISN */}
                      <td className="py-4 px-4.5">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white text-sm block">{student.name}</span>
                          <span className="text-[10px] font-mono text-[#a5b4fc] block">NISN: {student.nis}</span>
                        </div>
                      </td>

                      {/* Class */}
                      <td className="py-4 px-4 text-slate-300">
                        <span className="bg-slate-800 text-slate-200 font-bold px-2 py-1 rounded text-[10px]">
                          {student.className}
                        </span>
                      </td>

                      {/* Portfolio & Karya Drive */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="space-y-1">
                          <span className="text-white/80 font-semibold block truncate text-[11px]" title={student.skills.join(", ")}>
                            🎨 {specString}
                          </span>
                          <div className="flex items-center gap-2">
                            <a 
                              href={student.portfolioUrl.startsWith("http") ? student.portfolioUrl : `https://${student.portfolioUrl}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition text-[10.5px] font-medium flex items-center gap-0.5 underline cursor-pointer"
                              referrerPolicy="no-referrer"
                            >
                              Portofolio <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                            {student.driveKaryaUrl && (
                              <a 
                                href={student.driveKaryaUrl.startsWith("http") ? student.driveKaryaUrl : `https://${student.driveKaryaUrl}`}
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-emerald-400 hover:text-emerald-300 transition text-[10.5px] font-medium flex items-center gap-0.5 underline cursor-pointer"
                                referrerPolicy="no-referrer"
                              >
                                Drive Karya <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Target DUDI & HRD Info */}
                      <td className="py-4 px-4.5 max-w-sm">
                        <div className="space-y-0.5 text-xs">
                          <span className={`font-bold block ${isUnassigned ? 'text-rose-400 italic' : 'text-slate-100'}`}>
                            🏢 {correlatedDudi.name}
                          </span>
                          {!isUnassigned && (
                            <div className="text-[10px] text-slate-400 space-y-0.2">
                              <p className="font-semibold text-slate-300">HRD: {correlatedDudi.contactPerson}</p>
                              {correlatedDudi.hrdEmail && <p className="font-mono text-[9px] text-[#93c5fd] truncate select-all">{correlatedDudi.hrdEmail}</p>}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Dates duration */}
                      <td className="py-4 px-4 text-center">
                        <div className="space-y-0.5 inline-block font-mono text-[10px] bg-white/5 border border-white/5 p-1 px-2 rounded-lg text-slate-305">
                          <p className="text-slate-400">S/D:</p>
                          <p className="font-bold text-white/90">{student.pklStartDate || "2026-07-01"} s/d</p>
                          <p className="font-bold text-white/90">{student.pklEndDate || "2026-09-30"}</p>
                        </div>
                      </td>

                      {/* Status Badges with Quick dropdown */}
                      <td className="py-4 px-4 text-center">
                        <select
                          value={student.status}
                          onChange={(e) => handleQuickStatusSwitch(student.id, e.target.value as StudentStatus)}
                          className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-full border outline-none cursor-pointer transition ${
                            student.status === "Completed" 
                              ? "bg-blue-500/10 border-blue-500/40 text-blue-300"
                              : student.status === "Ongoing"
                              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                              : student.status === "Pending"
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                              : "bg-rose-500/10 border-rose-500/40 text-rose-300"
                          }`}
                        >
                          <option value="Unassigned" className="bg-[#0f0f1b] text-light">Belum Ditugaskan</option>
                          <option value="Pending" className="bg-[#0f0f1b] text-light">Menunggu (Pending)</option>
                          <option value="Ongoing" className="bg-[#0f0f1b] text-light">Sedang Magang (Ongoing)</option>
                          <option value="Completed" className="bg-[#0f0f1b] text-light">Lulus Program (Completed)</option>
                        </select>
                      </td>

                      {/* Operations */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditForm(student)}
                            className="bg-white/5 hover:bg-white/10 text-white/80 hover:text-blue-400 p-1.5 rounded-lg border border-white/10 cursor-pointer transition-all active:scale-95"
                            title="Edit Data PKL Siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteStudent(student.id)}
                            className="bg-white/5 hover:bg-rose-950/40 text-white/60 hover:text-rose-400 p-1.5 rounded-lg border border-white/10 cursor-pointer transition-all active:scale-95"
                            title="Hapus Data Siswa"
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
        </>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-white/5 bg-slate-950/40 shadow-2xl space-y-4" id="company-quota-workspace">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="font-display font-black text-sm text-white uppercase tracking-wide flex items-center gap-2">
                🏢 Target Quota & Sisa Penempatan Perusahaan <span className="text-[10px] bg-emerald-500/20 text-emerald-355 font-mono px-2 py-0.5 rounded border border-emerald-500/20 normal-case font-normal select-none">Real-time</span>
              </h3>
              <p className="text-white/50 text-xs">Sesuaikan ketersediaan kuota slot PKL per mitra DUDI dan monitor sisa kapasitas penempatan secara real-time.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Search inside company list */}
              <div className="relative w-full sm:w-64 font-sans text-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari perusahaan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-[#121221] border border-white/10 hover:border-white/15 focus:border-blue-500/60 outline-none text-slate-100 rounded-lg placeholder-slate-500 transition"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsQuickCompanyOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/20 text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md shadow-indigo-500/10"
                title="Tambahkan data mitra industri baru secara instan"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
                Quick Add Mitra
              </button>

              <div className="bg-[#121221] p-1.5 rounded-xl border border-white/5 flex items-center gap-1 font-sans">
                <span className="text-[10px] text-white/40 font-mono font-bold px-1 select-none">Total Mitra:</span>
                <span className="bg-indigo-500/20 text-[#a5b4fc] text-[11px] font-mono font-black border border-indigo-500/20 px-2 py-0.5 rounded">
                  {companies.filter(c => c.id !== "comp-6").length} DUDI
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto font-sans">
            <table className="w-full border-collapse text-left text-xs font-sans">
              <thead>
                <tr className="bg-[#121221] border-b border-white/10 text-white/50 uppercase tracking-widest font-mono text-[9px] select-none">
                  <th className="py-4 px-4 font-bold">Mitra Industri DKV</th>
                  <th className="py-4 px-4 font-bold">Alamat & Kontak HRD</th>
                  <th className="py-4 px-4 font-bold text-center">Target Quota Siswa</th>
                  <th className="py-4 px-4 font-bold text-center">Siswa Ditempatkan</th>
                  <th className="py-4 px-4 font-bold text-center">Keterisian Kuota</th>
                  <th className="py-4 px-4 font-bold text-center">Sisa Kapasitas (Kekosongan)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {(() => {
                  const filteredCompanies = companies
                    .filter(c => c.id !== "comp-6")
                    .filter(c => {
                      if (!searchTerm) return true;
                      return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.industry.toLowerCase().includes(searchTerm.toLowerCase());
                    });

                  if (filteredCompanies.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-500">
                          Tidak ada perusahaan yang cocok dengan pencarian Anda.
                        </td>
                      </tr>
                    );
                  }

                  return filteredCompanies.map(company => {
                    // Count students assigned to this company (not unassigned)
                    const assignedCount = students.filter(s => s.companyId === company.id && s.status !== "Unassigned").length;
                    const remaining = company.slots - assignedCount;

                    // Progress occupancy calculation
                    const fillPercent = company.slots > 0 
                      ? Math.min(100, Math.round((assignedCount / company.slots) * 100))
                      : 0;

                    // Color code selection
                    let barColorClass = "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]";
                    let textColorClass = "text-indigo-400";

                    if (fillPercent >= 100) {
                      barColorClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                      textColorClass = "text-emerald-400 font-black";
                    } else if (fillPercent >= 70) {
                      barColorClass = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]";
                      textColorClass = "text-amber-450 font-black";
                    } else if (fillPercent > 0) {
                      barColorClass = "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.2)]";
                      textColorClass = "text-sky-400 font-bold";
                    } else {
                      barColorClass = "bg-white/10";
                      textColorClass = "text-slate-500";
                    }

                    return (
                      <tr key={company.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4">
                          <div className="space-y-1 max-w-xs">
                            <span className="font-bold text-white text-sm block">🏢 {company.name}</span>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/25 inline-block font-semibold">
                              {company.industry}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1 text-slate-300 max-w-sm">
                            <p className="truncate text-white/70 text-[11px]" title={company.address}>📍 {company.address}</p>
                            <p className="text-[10px] text-slate-400 font-semibold select-all">HRD: {company.contactPerson} • {company.hrdEmail}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-3 select-none">
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateCompany) {
                                  onUpdateCompany(company.id, { slots: Math.max(1, company.slots - 1) });
                                }
                              }}
                              className="w-7 h-7 bg-white/5 hover:bg-rose-500/20 active:scale-95 border border-white/10 hover:text-rose-350 hover:border-rose-500/20 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer transition select-none"
                              title="Kurangi kuota siswa target"
                            >
                              -
                            </button>
                            <span className="text-sm font-black font-mono text-white w-5 select-none">{company.slots}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateCompany) {
                                  onUpdateCompany(company.id, { slots: company.slots + 1 });
                                }
                              }}
                              className="w-7 h-7 bg-white/5 hover:bg-emerald-500/20 active:scale-95 border border-white/10 hover:text-emerald-350 hover:border-emerald-500/20 rounded-lg flex items-center justify-center font-bold text-sm cursor-pointer transition select-none"
                              title="Tambah kuota siswa target"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono font-bold px-2.5 py-1 rounded text-xs select-none">
                            {assignedCount} Siswa
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="space-y-1.5 max-w-[130px] mx-auto select-none">
                            <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                              <span className={textColorClass}>{fillPercent}%</span>
                              <span className="text-white/40">{assignedCount}/{company.slots}</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden p-[1px] border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColorClass}`}
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {remaining > 0 ? (
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2.5 py-1 rounded text-xs select-none font-sans">
                              {remaining} Slot Tersisa
                            </span>
                          ) : remaining === 0 ? (
                            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2.5 py-1 rounded text-xs select-none font-sans">
                              Kuota Penuh
                            </span>
                          ) : (
                            <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold px-2.5 py-1 rounded text-xs select-none font-sans">
                              Kelebihan {Math.abs(remaining)} Siswa
                            </span>
                          )}
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

      {/* Manual ADD / EDIT Dialog Panel Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-950/85 backdrop-blur-md font-sans animate-fade-in">
          <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden my-8">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/45 px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#93c5fd]" />
                <h3 className="font-display font-bold text-sm text-white">
                  {editingStudentId ? "Edit Rincian Program PKL Siswa" : "Tambahkan Program PKL Siswa DKV"}
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
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
              
              {/* Row 1: Student Core Identity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Nama Lengkap Siswa *</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    required
                    placeholder="Contoh: Andi Pratama"
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">NISN / Identitas Siswa *</label>
                  <input
                    type="text"
                    value={studentNis}
                    onChange={(e) => setStudentNis(e.target.value)}
                    required
                    placeholder="Contoh: 0051234567"
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-mono font-bold"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Kelas Rombel *</label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-medium bg-[#131322]"
                  >
                    <option value="XII DKV 1">XII DKV 1</option>
                    <option value="XII DKV 2">XII DKV 2</option>
                    <option value="XII DKV 3">XII DKV 3</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Portfolio Links & Spec */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Spesialisasi Seni (Format Koma)</label>
                  <input
                    type="text"
                    value={studentSkills}
                    onChange={(e) => setStudentSkills(e.target.value)}
                    placeholder="Contoh: Branding, UI/UX, Ilustrasi"
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-medium"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Link Portofolio Utama</label>
                  <input
                    type="text"
                    value={studentPortfolio}
                    onChange={(e) => setStudentPortfolio(e.target.value)}
                    placeholder="Contoh: behance.net/username"
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-medium text-blue-300"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Link Google Drive Karya</label>
                  <input
                    type="text"
                    value={studentDriveKarya}
                    onChange={(e) => setStudentDriveKarya(e.target.value)}
                    placeholder="Penyimpanan materi mentah/video..."
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-medium text-emerald-300"
                  />
                </div>
              </div>

              {/* Row 3: Industrial Company Placement Choice */}
              <div className="bg-slate-900/40 p-4.5 rounded-xl border border-white/5 space-y-4">
                <h5 className="font-bold text-[11px] uppercase tracking-widest text-indigo-400">Pilihan Penempatan Industri DUDI</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-white/60 block">Gunakan Rekomendasi Instansi SMKN 1</label>
                    <select
                      value={selectedCompanyId}
                      onChange={(e) => setSelectedCompanyId(e.target.value)}
                      className="w-full glass-input rounded-xl p-2.5 outline-none bg-[#131322] font-semibold"
                    >
                      <option value="comp-6">Mencari Mandiri / Belum Terdistribusi</option>
                      {companies.filter(c => c.id !== "comp-6").map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
                      ))}
                      <option value="new">+ Tambah/Ketik Nama Industri Baru</option>
                    </select>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-white/60 block">Rambu Status Alur PKL</label>
                    <select
                      value={studentStatus}
                      onChange={(e) => setStudentStatus(e.target.value as StudentStatus)}
                      className="w-full glass-input rounded-xl p-2.5 outline-none bg-[#131322] font-semibold"
                    >
                      <option value="Unassigned">Belum Terdistribusi (Unassigned)</option>
                      <option value="Pending">Menunggu Keputusan HRD (Pending)</option>
                      <option value="Ongoing">Sedang Menempuh Magang (Ongoing)</option>
                      <option value="Completed">Nilai Selesai / Lulus (Completed)</option>
                    </select>
                  </div>
                </div>

                {/* If custom company is chosen */}
                {selectedCompanyId === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2.5 border-t border-white/5 animate-fade-in">
                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-white/70 block">Nama Perusahaan/Industri Baru *</label>
                      <input
                        type="text"
                        value={customCompanyName}
                        onChange={(e) => setCustomCompanyName(e.target.value)}
                        placeholder="Contoh: PT Kreasi Digital Jaya"
                        className="w-full glass-input rounded-xl p-2.5 outline-none"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-white/70 block">Alamat Perusahaan Baru *</label>
                      <input
                        type="text"
                        value={customCompanyAddress}
                        onChange={(e) => setCustomCompanyAddress(e.target.value)}
                        placeholder="Contoh: Karawaci, Tangerang"
                        className="w-full glass-input rounded-xl p-2.5 outline-none"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-white/70 block">Nama Kontak HRD Perusahaan</label>
                      <input
                        type="text"
                        value={customCompanyHrd}
                        onChange={(e) => setCustomCompanyHrd(e.target.value)}
                        placeholder="Contoh: Ibu Amanda S."
                        className="w-full glass-input rounded-xl p-2.5 outline-none"
                      />
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="font-semibold text-white/70 block">Email HRD Perusahaan</label>
                      <input
                        type="email"
                        value={customCompanyEmail}
                        onChange={(e) => setCustomCompanyEmail(e.target.value)}
                        placeholder="Contoh: hrd@indokom.com"
                        className="w-full glass-input rounded-xl p-2.5 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Row 4: Timeline Durasi PKL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Tanggal Mulai PKL</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Tanggal Selesai PKL</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Row 5: Guard Personal Contacts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Username / Email Pribadi</label>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="siswa@smkn1teluknaga.sch.id"
                    className="w-full glass-input rounded-xl p-2.5 outline-none"
                  />
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">No HP WhatsApp Siswa</label>
                  <input
                    type="text"
                    value={studentPhone}
                    onChange={(e) => setStudentPhone(e.target.value)}
                    placeholder="0813-XXXX-XXXX"
                    className="w-full glass-input rounded-xl p-2.5 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Footer Save Action Panel */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer transition active:scale-95 duration-150"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs cursor-pointer transition shadow-lg shadow-blue-500/10 active:scale-95 duration-150"
                >
                  <Save className="w-4 h-4 inline-block mr-1" />
                  Simpan Perubahan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button for Quick Add Mitra */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => setIsQuickCompanyOpen(!isQuickCompanyOpen)}
          className="p-3.5 bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full shadow-2xl flex items-center justify-center border border-indigo-400/30 hover:border-indigo-400/50 hover:scale-110 active:scale-95 cursor-pointer transition-all duration-300 select-none group relative"
          title="Tambah Mitra Industri Instan"
          id="fab-quick-add-company"
        >
          <Zap className="w-5 h-5 text-amber-300 fill-amber-300 group-hover:animate-bounce" />
          <span className="absolute right-14 bg-slate-900 border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap shadow-xl">
            ⚡ Quick Add Mitra
          </span>
        </button>
      </div>

      {/* Floating Drawer/Card Form for Quick Add Mitra */}
      {isQuickCompanyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="bg-[#0e0e1a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden animate-slide-up">
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950/45 px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider">
                  Quick Add Mitra Industri
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickCompanyOpen(false)}
                className="bg-white/5 hover:bg-white/10 text-white/50 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Form */}
            <form onSubmit={handleQuickAddCompany} className="p-5 space-y-4">
              <p className="text-white/60 text-[11px] leading-relaxed">
                Tambahkan instansi atau mitra industri (DUDI) baru dengan cepat ke dalam database sekolah secara instan tanpa dialog kompleks.
              </p>

              {/* Company Name */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Nama Mitra Industri / Instansi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: PT Arise Creative Agency"
                  value={quickCompanyName}
                  onChange={(e) => setQuickCompanyName(e.target.value)}
                  className="w-full bg-[#121223] border border-white/10 rounded-xl p-2.5 outline-none font-semibold text-white focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Number of Slots & Sektor */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Kuota Slots *</label>
                  <div className="flex items-center bg-[#131322] border border-white/10 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuickCompanySlots(prev => Math.max(1, prev - 1))}
                      className="px-3 py-2 text-white hover:bg-white/5 font-extrabold text-sm transition cursor-pointer"
                    >
                      -
                    </button>
                    <span className="flex-grow text-center font-bold text-white font-mono text-xs">{quickCompanySlots}</span>
                    <button
                      type="button"
                      onClick={() => setQuickCompanySlots(prev => prev + 1)}
                      className="px-3 py-2 text-white hover:bg-white/5 font-extrabold text-sm transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-white/70 block">Sektor Bisnis DUDI</label>
                  <select
                    value={quickCompanyIndustry}
                    onChange={(e) => setQuickCompanyIndustry(e.target.value)}
                    className="w-full bg-[#121223] border border-white/10 rounded-xl p-2.5 outline-none bg-[#131322] font-semibold text-white cursor-pointer focus:border-indigo-500"
                  >
                    <option value="Industri Kreatif DKV">Kreatif DKV</option>
                    <option value="Agensi Periklanan & Desain">Agensi Desain</option>
                    <option value="Percetakan & Grafis">Percetakan</option>
                    <option value="Studio Animasi & Game">Animasi / Game</option>
                    <option value="Event Organizer & Photo">Fotografi / EO</option>
                  </select>
                </div>
              </div>

              {/* Simplified Address */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Alamat Kantor Singkat</label>
                <input
                  type="text"
                  placeholder="Contoh: BSD, Tangerang atau Jakarta"
                  value={quickCompanyAddress}
                  onChange={(e) => setQuickCompanyAddress(e.target.value)}
                  className="w-full bg-[#121223] border border-white/10 rounded-xl p-2.5 outline-none text-white focus:border-indigo-500"
                />
              </div>

              {/* Suggestions for Fast Clicking */}
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 font-bold block">REKOMENDASI SEKTOR CEPAT:</span>
                <div className="flex flex-wrap gap-1">
                  {["Digital Agency", "Rumah Produksi", "Studio Foto"].map(sug => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setQuickCompanyIndustry(sug)}
                      className="text-[9px] bg-white/5 hover:bg-white/10 text-indigo-350 font-semibold px-2 py-0.5 rounded border border-white/5 transition cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsQuickCompanyOpen(false)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white px-3.5 py-2 rounded-xl font-bold text-xs cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-extrabold text-xs cursor-pointer transition shadow-lg shadow-indigo-600/25 flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  Tambah Instan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
