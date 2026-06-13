import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, googleSignOut } from "../lib/firebaseAuth";
import { 
  createSpreadsheet, 
  writeSpreadsheetValues, 
  getSpreadsheetValues, 
  extractSpreadsheetId 
} from "../lib/googleSheetsService";
import { Student, Company, StudentStatus, LogbookEntry } from "../types";
import { 
  FileSpreadsheet, 
  Check, 
  Loader2, 
  ExternalLink, 
  LogOut, 
  Download, 
  Upload, 
  Link as LinkIcon, 
  AlertCircle, 
  Sparkles 
} from "lucide-react";

interface GoogleSheetsSyncProps {
  students: Student[];
  companies: Company[];
  logbooks: LogbookEntry[];
  onImportMaster: (parsedData: Array<{ student: Omit<Student, "id">; company?: Company }>) => void;
  onSyncLogbooks: (entries: LogbookEntry[]) => void;
  showToast?: (message: string, type?: "info" | "success") => void;
}

export default function GoogleSheetsSync({
  students,
  companies,
  logbooks,
  onImportMaster,
  onSyncLogbooks,
  showToast
}: GoogleSheetsSyncProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sync operations
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Sheet URLs
  const [sheetUrlInput, setSheetUrlInput] = useState("");
  const [exportedSheet, setExportedSheet] = useState<{ id: string; url: string; title: string } | null>(null);
  const [importedSummary, setImportedSummary] = useState<{
    rowCount: number;
    previewRows: string[][];
  } | null>(null);

  // Initialize auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setIsInitializing(false);
      },
      () => {
        setCurrentUser(null);
        setAccessToken(null);
        setIsInitializing(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
        if (showToast) showToast("Berhasil terhubung ke Google Sheets & Drive!", "success");
      }
    } catch (err: any) {
      console.error("Sheets Login failed:", err);
      setErrorMessage("Gagal menghubungkan akun Google. Silakan coba lagi.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setAccessToken(null);
      setExportedSheet(null);
      setImportedSummary(null);
      if (showToast) showToast("Koneksi Google diputus.", "info");
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Export local state to a fresh Google Spreadsheet layout
  const handleExportToSheets = async () => {
    if (!accessToken) return;
    setIsExporting(true);
    setErrorMessage(null);
    setExportedSheet(null);

    try {
      const currentDate = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      const sheetTitle = `SI-KAJUR DKV: Rekap PKL & Logbook (${currentDate})`;
      
      // 1. Create a Spreadsheet with two distinct tabs
      const sheetInfo = await createSpreadsheet(accessToken, sheetTitle, ["Siswa & DUDI", "Logbook Siswa"]);

      // 2. Format student grid rows
      const headers = [
        "Nama Lengkap Siswa",
        "NIS/NISN",
        "Kelas",
        "Status PKL (Unassigned/Pending/Ongoing/Completed)",
        "Spesialisasi DKV",
        "Link Portofolio Utama",
        "Highlight Portofolio",
        "Link Google Drive Karya",
        "No HP Siswa",
        "Email Siswa",
        "Inisial Tempat Lahir, Tgl Lahir",
        "Nama Perusahaan/DUDI Penerima",
        "Bidang Industri DUDI",
        "Alamat Perusahaan DUDI",
        "Nama Supervisor/Kontak HRD",
        "Email Kontak HRD",
        "Tanggal Mulai PKL",
        "Tanggal Selesai PKL",
        "Nama Orang Tua",
        "Pekerjaan Orang Tua",
        "Alamat Tempat Tinggal"
      ];

      const rows = [headers];

      students.forEach(s => {
        const c = companies.find(comp => comp.id === s.companyId);
        rows.push([
          s.name,
          s.nis,
          s.className,
          s.status,
          s.skills.join(", "),
          s.portfolioUrl || "",
          s.portfolioHighlight || "Desainer Komunikasi Visual",
          s.driveKaryaUrl || "",
          s.phone || "",
          s.email || "",
          s.birthPlaceDate || "Tangerang, 10 Juni 2008",
          c ? c.name : "",
          c ? c.industry : "",
          c ? c.address : "",
          c ? c.contactPerson : "",
          c ? c.hrdEmail : "",
          s.pklStartDate || "2026-07-01",
          s.pklEndDate || "2026-09-30",
          s.parentName || "",
          s.parentOccupation || "",
          s.studentAddress || ""
        ]);
      });

      // 3. Populate student rows to the "Siswa & DUDI" tab
      await writeSpreadsheetValues(accessToken, sheetInfo.id, "Siswa & DUDI!A1", rows);

      // 4. Format logbook grid rows
      const logbookHeaders = [
        "ID Logbook",
        "Nama Siswa",
        "NIS Siswa",
        "Tanggal (YYYY-MM-DD)",
        "Hari",
        "Kegiatan / Aktivitas",
        "Alat yang Digunakan",
        "Link Hasil Kerja",
        "Kendala",
        "Solusi",
        "Disetujui DUDI (YA / TIDAK)",
        "Disetujui Guru (YA / TIDAK)"
      ];

      const logbookRows = [logbookHeaders];

      logbooks.forEach(lb => {
        const s = students.find(st => st.id === lb.studentId);
        logbookRows.push([
          lb.id,
          s ? s.name : "Siswa Tidak Dikenal",
          s ? s.nis : "",
          lb.date,
          lb.day,
          lb.activity,
          lb.toolsUsed.join(", "),
          lb.projectLink || "",
          lb.obstacle || "",
          lb.solution || "",
          lb.approvedByDudi ? "YA" : "TIDAK",
          lb.approvedByTeacher ? "YA" : "TIDAK"
        ]);
      });

      // 5. Populate logbook rows to the "Logbook Siswa" tab
      await writeSpreadsheetValues(accessToken, sheetInfo.id, "Logbook Siswa!A1", logbookRows);

      setExportedSheet(sheetInfo);
      if (showToast) showToast("Berhasil mengekspor data PKL & Logbook ke Google Sheets!", "success");
    } catch (err: any) {
      console.error("Export to Sheets failed:", err);
      setErrorMessage(err.message || "Gagal melakukan ekspor data ke Google Sheets.");
    } finally {
      setIsExporting(false);
    }
  };

  // Retrieve values from user's pasted Google Spreadsheet URL & Import
  const handleLoadFromSharedSheet = async () => {
    if (!accessToken) return;
    if (!sheetUrlInput.trim()) {
      setErrorMessage("Silakan lengkapi URL Google Sheets Anda.");
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId) {
      setErrorMessage("Format URL Google Sheets tidak valid. Silakan salin URL bertipe: spreadsheets/d/...");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setImportedSummary(null);

    try {
      // 1. Fetch values from range "Siswa & DUDI!A1:U500" or fallback to "Sheet1!A1:U500"
      let values: any[][] = [];
      try {
        values = await getSpreadsheetValues(accessToken, spreadsheetId, "Siswa & DUDI!A1:U500");
      } catch (e) {
        console.log("Siswa & DUDI tab not found, falling back to Sheet1", e);
        values = await getSpreadsheetValues(accessToken, spreadsheetId, "Sheet1!A1:U500");
      }

      if (values.length <= 1) {
        throw new Error("Spreadsheet kosong atau hanya berisi baris header.");
      }

      // Check if header exists and contains keywords (if first cell is 'Nama Lengkap Siswa' or similar)
      const firstRow = values[0];
      const hasHeader = firstRow.some((cell: any) => 
        typeof cell === "string" && 
        (cell.toLowerCase().includes("nama") || cell.toLowerCase().includes("nis") || cell.toLowerCase().includes("kelas"))
      );

      const startIndex = hasHeader ? 1 : 0;
      const parsedEntries: Array<{ student: Omit<Student, "id">; company?: Company }> = [];

      for (let i = startIndex; i < values.length; i++) {
        const row = values[i];
        if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

        const sName = String(row[0] || "").trim();
        const sNis = String(row[1] || "").trim();
        const sClass = String(row[2] || "XII DKV 1").trim();
        const sStatus = (String(row[3] || "Unassigned").trim() as StudentStatus);
        
        // Deserialize skills
        const skillsRaw = String(row[4] || "").trim();
        const sSkills = skillsRaw ? skillsRaw.split(/[,;\-+]/).map(sk => sk.trim()).filter(Boolean) : ["Seni Digital"];
        
        const sPortfolioUrl = String(row[5] || "").trim();
        const sPortfolioHighlight = String(row[6] || "").trim();
        const sDriveKaryaUrl = String(row[7] || "").trim();
        const sPhone = String(row[8] || "").trim();
        const sEmail = String(row[9] || "").trim();
        const sBirthPlaceDate = String(row[10] || "Tangerang, 10 Juni 2008").trim();

        const cName = String(row[11] || "").trim();
        const cIndustry = String(row[12] || "Seni Kreatif").trim();
        const cAddress = String(row[13] || "").trim();
        const cHRD = String(row[14] || "").trim();
        const cEmail = String(row[15] || "").trim();

        const pStartDate = String(row[16] || "2026-07-01").trim();
        const pEndDate = String(row[17] || "2026-09-30").trim();

        const sParentName = String(row[18] || "").trim();
        const sParentOccupation = String(row[19] || "").trim();
        const sStudentAddress = String(row[20] || "").trim();

        // Instantiate mapped company if present
        let companyObj: Company | undefined = undefined;
        let finalCompanyId = "";

        if (cName) {
          const compId = "comp-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
          companyObj = {
            id: compId,
            name: cName,
            address: cAddress || "Alamat Industri DUDI",
            contactPerson: cHRD || "Supervisor / HRD DUDI",
            hrdEmail: cEmail || "hrd@perusahaan.com",
            industry: cIndustry,
            slots: 5
          };
          finalCompanyId = compId;
        }

        parsedEntries.push({
          student: {
            name: sName,
            nis: sNis || "00" + Math.floor(Math.random() * 10000000),
            className: sClass,
            status: sStatus,
            skills: sSkills,
            portfolioUrl: sPortfolioUrl,
            portfolioHighlight: sPortfolioHighlight || "Desainer Komunikasi Visual",
            driveKaryaUrl: sDriveKaryaUrl,
            phone: sPhone,
            email: sEmail,
            birthPlaceDate: sBirthPlaceDate,
            parentName: sParentName,
            parentOccupation: sParentOccupation,
            studentAddress: sStudentAddress,
            companyId: finalCompanyId,
            pklStartDate: pStartDate,
            pklEndDate: pEndDate
          },
          company: companyObj
        });
      }

      if (parsedEntries.length === 0) {
        throw new Error("Tidak ada data baris siswa yang berhasil dibaca.");
      }

      // Complete student import to state
      onImportMaster(parsedEntries);

      // 2. Fetch and merge values from Logbook tab if available
      let logbookValues: any[][] = [];
      let parsedLogbooksCount = 0;
      try {
        logbookValues = await getSpreadsheetValues(accessToken, spreadsheetId, "Logbook Siswa!A1:L1000");
      } catch (e) {
        console.log("No Logbook Siswa tab found or accessible", e);
      }

      if (logbookValues && logbookValues.length > 1) {
        const lbFirstRow = logbookValues[0];
        const lbHasHeader = lbFirstRow.some((cell: any) => 
          typeof cell === "string" && 
          (cell.toLowerCase().includes("kegiatan") || cell.toLowerCase().includes("aktivitas") || cell.toLowerCase().includes("logbook"))
        );
        const lbStartIndex = lbHasHeader ? 1 : 0;
        const parsedLogbooks: LogbookEntry[] = [];

        for (let i = lbStartIndex; i < logbookValues.length; i++) {
          const row = logbookValues[i];
          if (!row || row.length === 0) continue;

          const lbId = String(row[0] || "").trim();
          const lbStudName = String(row[1] || "").trim();
          const lbStudNis = String(row[2] || "").trim();
          const lbDate = String(row[3] || "").trim();
          if (!lbDate) continue;

          const lbDay = String(row[4] || "Senin").trim();
          const lbActivity = String(row[5] || "").trim();
          const lbToolsRaw = String(row[6] || "").trim();
          const lbTools = lbToolsRaw ? lbToolsRaw.split(/[,;\-+]/).map(sk => sk.trim()).filter(Boolean) : [];

          const lbProjectLink = String(row[7] || "").trim();
          const lbObstacle = String(row[8] || "").trim();
          const lbSolution = String(row[9] || "").trim();

          const lbDudiApprovedStr = String(row[10] || "").trim().toUpperCase();
          const lbTeacherApprovedStr = String(row[11] || "").trim().toUpperCase();

          const approvedByDudi = lbDudiApprovedStr === "YA" || lbDudiApprovedStr === "YES" || lbDudiApprovedStr === "TRUE";
          const approvedByTeacher = lbTeacherApprovedStr === "YA" || lbTeacherApprovedStr === "YES" || lbTeacherApprovedStr === "TRUE";

          // Cross-match Nis or Name back to system list
          // Attempt to find student in freshly formatted/imported list OR already in current lists
          let studentMatch = students.find(s => s.nis === lbStudNis);
          if (!studentMatch && lbStudName) {
            studentMatch = students.find(s => s.name.toLowerCase() === lbStudName.toLowerCase());
          }

          if (studentMatch) {
            parsedLogbooks.push({
              id: lbId || "log-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
              studentId: studentMatch.id,
              date: lbDate,
              day: lbDay,
              activity: lbActivity,
              toolsUsed: lbTools,
              projectLink: lbProjectLink || undefined,
              obstacle: lbObstacle || undefined,
              solution: lbSolution || undefined,
              approvedByDudi,
              approvedByTeacher
            });
          }
        }

        if (parsedLogbooks.length > 0) {
          onSyncLogbooks(parsedLogbooks);
          parsedLogbooksCount = parsedLogbooks.length;
        }
      }
      
      setImportedSummary({
        rowCount: parsedEntries.length,
        previewRows: values.slice(0, 5)
      });

      if (showToast) {
        if (parsedLogbooksCount > 0) {
          showToast(`Sinkronisasi Dua Arah berhasil! Diimpor ${parsedEntries.length} Siswa dan ${parsedLogbooksCount} catatan Logbook.`, "success");
        } else {
          showToast(`Sinkronisasi berhasil! Diimpor ${parsedEntries.length} baris Siswa. (Logbook tidak ditemukan/kosong)`, "info");
        }
      }
      setSheetUrlInput("");
    } catch (err: any) {
      console.error("Sheets Import failed:", err);
      setErrorMessage(err.message || "Gagal mengimpor dari Google Sheets. Pastikan format tabel sesuai.");
    } finally {
      setIsImporting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="p-4 bg-slate-900/35 rounded-2xl border border-white/5 flex items-center justify-center font-sans">
        <Loader2 className="w-4 h-4 text-indigo-400 animate-spin mr-2" />
        <span className="text-white/60 text-xs">Memeriksa Google Sheets Auth...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 bg-slate-900/40 font-sans space-y-4">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#10b981]" />
          <h4 className="font-display font-extrabold text-sm text-[#a7f3d0]">
            Sincronisasi Google Sheets (Awan Online)
          </h4>
        </div>
        
        {currentUser && (
          <button 
            type="button"
            onClick={handleLogout}
            title="Keluar Google Account"
            className="text-[10px] text-white/50 hover:text-rose-400 flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-lg cursor-pointer transition"
          >
            <LogOut className="w-3 h-3" />
            <span>Keluar</span>
          </button>
        )}
      </div>

      {!currentUser ? (
        <div className="space-y-3">
          <p className="text-white/60 text-xs leading-relaxed">
            Butuh integrasi awan? Sambungkan database master ini dengan Google Drive & Google Sheets Anda. Anda dapat langsung mengekspor baris PKL ke spreadsheet baru, atau menarik daftar plotting siswa langsung dari Link Google Sheets bersama.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full md:w-auto flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-slate-200 cursor-pointer shadow-md shadow-white/5 transition-all disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 text-slate-800 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.136C18.257 1.916 15.497 1 12.24 1s-9 4.03-9 9 4.03 9 9 9c4.71 0 7.852-3.313 7.852-8 0-.543-.057-.957-.13-1.371h-7.722z"/>
              </svg>
            )}
            <span>Sambungkan Ke Google Sheets</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* User Display Badge */}
          <div className="flex items-center gap-2.5 bg-white/5 p-2 rounded-xl border border-white/5 text-[11px] float-none md:float-right">
            {currentUser.photoURL && (
              <img 
                src={currentUser.photoURL} 
                alt="Avatar" 
                className="w-5 h-5 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            )}
            <span className="text-white/80 font-bold truncate max-w-[150px]">{currentUser.displayName || currentUser.email}</span>
            <span className="text-[9px] bg-[#10b981]/15 text-[#10b981] px-1.5 py-0.5 rounded border border-[#10b981]/25 font-bold">TERKONEKSI</span>
          </div>
          <div className="clear-both" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
            
            {/* Left: Export to Google Sheets */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 text-left">
              <h5 className="text-[11px] font-black text-[#10b981] uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Ekspor Data ke Sheets Baru
              </h5>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Tulis ulang data local database saat ini ({students.length} siswa, {companies.length} perusahaan, {logbooks.length} logbook) ke tabel spreadsheet awan baru secara rapi dengan tab terpisah untuk Siswa dan Logbook.
              </p>
              
              <button
                type="button"
                onClick={handleExportToSheets}
                disabled={isExporting}
                className="w-full bg-[#10b981] hover:bg-emerald-500 text-slate-900 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98] disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1 text-slate-900" />
                    <span>Mengekspor...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Buat Spreadsheet Rekap Baru</span>
                  </>
                )}
              </button>

              {exportedSheet && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/35 rounded-lg space-y-1 text-[11px] flex flex-col mt-2">
                  <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Export Berhasil!
                  </span>
                  <p className="text-white/60 text-[10px] truncate">Sheet: {exportedSheet.title}</p>
                  <a 
                    href={exportedSheet.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 mt-1 hover:underline font-bold"
                  >
                    Buka Hasil Spreadsheet <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Right: Import from Google Sheets */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-3 text-left">
              <h5 className="text-[11px] font-black text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Tarik Data dari Sheets Eksis
              </h5>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Punya link Google Sheets rekap, plotting siswa, atau catatan logbook harian siswa? Tempelkan link file tersebut di bawah ini untuk menarik data ganda ke local database dengan aman.
              </p>

              <div className="space-y-1.5">
                <div className="relative">
                  <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                  <input 
                    type="text"
                    value={sheetUrlInput}
                    onChange={(e) => setSheetUrlInput(e.target.value)}
                    placeholder="Tempel tautan Google Sheets..."
                    className="w-full pl-8 pr-2 py-1.5 bg-[#0a0a14] border border-white/10 hover:border-white/15 focus:border-indigo-500 outline-none text-slate-100 rounded-lg text-[10px] placeholder-slate-500 transition"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={handleLoadFromSharedSheet}
                  disabled={isImporting || !sheetUrlInput.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-[0.98] disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Mengunduh...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Singkronkan & Impor</span>
                    </>
                  )}
                </button>
              </div>

              {importedSummary && (
                <div className="p-2.5 bg-blue-500/10 border border-blue-500/35 rounded-lg space-y-1 text-[11px] mt-2">
                  <span className="text-blue-300 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Berhasil Menyimpan!
                  </span>
                  <p className="text-white/70 text-[10px]">Telah selaras: <strong>{importedSummary.rowCount} baris data siswa</strong></p>
                </div>
              )}
            </div>

          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/35 text-rose-300 text-[11px] rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
