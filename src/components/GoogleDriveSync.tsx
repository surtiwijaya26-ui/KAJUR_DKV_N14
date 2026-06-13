import React, { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, googleSignOut } from "../lib/firebaseAuth";
import { getOrCreateFolder, uploadAsGoogleDoc, listExportedFiles, DriveFile } from "../lib/googleDriveService";
import { generateDocumentHTML } from "../lib/documentTemplates";
import { Student, Company, AppSettings, LogbookEntry } from "../types";
import { 
  Cloud, 
  Check, 
  Loader2, 
  ExternalLink, 
  LogOut, 
  Folder, 
  FileText, 
  AlertCircle 
} from "lucide-react";

interface GoogleDriveSyncProps {
  activeStudent: Student;
  companies: Company[];
  settings: AppSettings;
  activeLetterType: "PENGANTAR" | "BIODATA" | "BYOD" | "CERTIFICATE";
  logbooks?: LogbookEntry[];
}

export default function GoogleDriveSync({
  activeStudent,
  companies,
  settings,
  activeLetterType,
  logbooks = []
}: GoogleDriveSyncProps) {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sync / Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<DriveFile | null>(null);

  // Folders and Export history
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [subfolderId, setSubfolderId] = useState<string | null>(null);
  const [recentExports, setRecentExports] = useState<DriveFile[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Retrieve active student's linked company
  const activeCompany = companies.find(c => c.id === activeStudent.companyId);

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

  // Fetch Drive structures and history when logged in
  useEffect(() => {
    if (currentUser && accessToken) {
      loadDriveStructureAndHistory();
    } else {
      setRootFolderId(null);
      setSubfolderId(null);
      setRecentExports([]);
    }
  }, [currentUser, accessToken, activeStudent.id, activeLetterType]);

  const loadDriveStructureAndHistory = async () => {
    if (!accessToken) return;
    setIsLoadingHistory(true);
    setUploadError(null);
    try {
      // 1. Get or create root folder
      const rootId = await getOrCreateFolder(accessToken, "SI-KAJUR PKL DKV SMKN 14");
      setRootFolderId(rootId);

      // 2. Get or create category subfolder
      let subfolderName = "Sertifikat PKL";
      if (activeLetterType === "PENGANTAR") subfolderName = "Surat Pengantar PKL";
      if (activeLetterType === "BIODATA") subfolderName = "Biodata Siswa PKL";
      if (activeLetterType === "BYOD") subfolderName = "Surat Pernyataan BYOD";

      const subId = await getOrCreateFolder(accessToken, subfolderName, rootId);
      setSubfolderId(subId);

      // 3. List recent files exported in this folder
      const files = await listExportedFiles(accessToken, subId);
      setRecentExports(files);
    } catch (err: any) {
      console.error("Failed to load Google Drive structure:", err);
      setUploadError("Gagal menyinkronkan struktur folder Drive Anda.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setUploadError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setCurrentUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setUploadError("Gagal masuk dengan Google. Silakan coba lagi.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await googleSignOut();
      setCurrentUser(null);
      setAccessToken(null);
      setRecentExports([]);
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  const nameForDocument = () => {
    const studentNameClean = activeStudent.name.replace(/\s+/g, "_");
    if (activeLetterType === "PENGANTAR") return `Surat_Pengantar_PKL_${studentNameClean}`;
    if (activeLetterType === "BIODATA") return `Biodata_Siswa_PKL_${studentNameClean}`;
    if (activeLetterType === "BYOD") return `Pernyataan_BYOD_${studentNameClean}`;
    return `Sertifikat_PKL_${studentNameClean}`;
  };

  const handleExport = async () => {
    if (!accessToken || !currentUser) {
      setUploadError("Silakan masuk dengan Google terlebih dahulu.");
      return;
    }

    // Explicit confirmation request for Workspace updates / creations
    const confirmName = nameForDocument().replace(/_/g, " ");
    const confirmMessage = `Apakah Anda yakin ingin mengunggah draf "${confirmName}" ke Google Drive? Dokumen akan dikonversi menjadi draf Google Doc yang dapat diedit langsung.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setLastUploadedFile(null);

    try {
      // 1. Generate clean styled HTML template
      const documentHTML = generateDocumentHTML(
        activeLetterType,
        activeStudent,
        activeCompany,
        settings,
        logbooks
      );

      // 2. Ensure we have corresponding subfolder target
      let targetFolderId = subfolderId;
      if (!targetFolderId) {
        const rootId = rootFolderId || await getOrCreateFolder(accessToken, "SI-KAJUR PKL DKV SMKN 14");
        
        let subfolderName = "Sertifikat PKL";
        if (activeLetterType === "PENGANTAR") subfolderName = "Surat Pengantar PKL";
        if (activeLetterType === "BIODATA") subfolderName = "Biodata Siswa PKL";
        if (activeLetterType === "BYOD") subfolderName = "Surat Pernyataan BYOD";

        targetFolderId = await getOrCreateFolder(accessToken, subfolderName, rootId);
        setSubfolderId(targetFolderId);
      }

      // 3. Upload as native Google Docs
      const documentName = nameForDocument().replace(/_/g, " ");
      const uploadedFile = await uploadAsGoogleDoc(accessToken, documentName, documentHTML, targetFolderId);

      setLastUploadedFile(uploadedFile);
      
      // Update local history
      setRecentExports(prev => [uploadedFile, ...prev]);
    } catch (err: any) {
      console.error("Export to Drive failed:", err);
      setUploadError(err.message || "Gagal mengunggah berkas.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="p-4 bg-slate-900/30 rounded-xl border border-white/5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-indigo-400 animate-spin mr-2" />
        <span className="text-white/60 text-xs">Memeriksa Google Drive Auth...</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900/40 rounded-xl border border-white/10 space-y-3 font-sans select-none">
      
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5">
          <Cloud className="w-4 h-4 text-blue-400" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-blue-300">Ekspor Google Drive</h4>
        </div>
        
        {currentUser && (
          <button 
            onClick={handleLogout}
            title="Keluar Akun Google"
            className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auth Panel */}
      {!currentUser ? (
        <div className="space-y-2.5 pt-1">
          <p className="text-[10px] text-white/50 leading-relaxed">
            Simpan atau cadangkan draf surat dan sertifikat langsung ke Google Drive sebagai draf file <strong>Google Docs (gdoc)</strong> yang rapi dan siap diedit secara online.
          </p>

          {/* Standard Compliant Google Button styled nicely */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-lg border border-slate-200 cursor-pointer shadow-md shadow-white/5 transition-all disabled:opacity-50"
          >
            {isLoggingIn ? (
              <Loader2 className="w-4 h-4 text-slate-800 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.564-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.258-3.136C18.257 1.916 15.497 1 12.24 1s-9 4.03-9 9 4.03 9 9 9c4.71 0 7.852-3.313 7.852-8 0-.543-.057-.957-.13-1.371h-7.722z"/>
              </svg>
            )}
            <span>Hubungkan Google Drive</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3 pt-0.5">
          {/* User badge */}
          <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5 text-[11px]">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName || "Google User"} 
                className="w-6 h-6 rounded-full border border-white/10"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500/25 text-blue-300 flex items-center justify-center font-bold">
                {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "G"}
              </div>
            )}
            <div className="truncate flex-1 text-left">
              <p className="font-bold text-white/90 truncate leading-none mb-0.5">{currentUser.displayName || "Pengguna Google"}</p>
              <p className="text-[9.5px] text-white/50 truncate leading-none">{currentUser.email}</p>
            </div>
            <div className="text-[9px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-1 py-0.5 rounded font-black font-mono">
              ACTIVE
            </div>
          </div>

          {/* Export Action */}
          <button
            onClick={handleExport}
            disabled={isUploading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Mengunggah ke Drive...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5" />
                <span>Simpan Draf di Google Drive</span>
              </>
            )}
          </button>

          {/* Last Upload Info */}
          {lastUploadedFile && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg space-y-1 text-[10.5px] flex flex-col">
              <span className="flex items-center gap-1.5 text-emerald-300 font-extrabold leading-tight">
                <Check className="w-3.5 h-3.5" /> Berhasil Diunggah!
              </span>
              <p className="text-white/70 text-[9.5px] truncate max-w-[240px] mt-0.5 font-medium">Draft: {lastUploadedFile.name}</p>
              <a 
                href={lastUploadedFile.webViewLink} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 mt-1 hover:underline font-bold text-[10px]"
              >
                Buka Dokumen <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Recent Exports History */}
          <div className="space-y-1.5 pt-1 select-none">
            <span className="text-[9px] font-black text-white/40 tracking-wider uppercase block">Draf Tersimpan Kategori ini</span>
            
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-4 text-white/40 text-[10px]">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Memuat riwayat ekspor...
              </div>
            ) : recentExports.length === 0 ? (
              <div className="text-left text-white/40 italic p-2 text-[10.5px]">
                Belum ada draf terunggah di folder kategori ini.
              </div>
            ) : (
              <div className="max-h-24 overflow-y-auto space-y-1 scrollbar-thin select-none pr-1">
                {recentExports.slice(0, 4).map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-1.5 rounded bg-white/5 border border-white/5 text-[10px]">
                    <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                      <FileText className="w-3 h-3 text-white/50 shrink-0" />
                      <span className="truncate text-white/70" title={file.name}>{file.name}</span>
                    </div>
                    <a 
                      href={file.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      title="Buka Berkas"
                      className="p-1 rounded text-blue-400 hover:text-blue-300 hover:bg-white/5 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* General error message banner */}
      {uploadError && (
        <div className="flex items-start gap-1.5 p-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span className="leading-normal">{uploadError}</span>
        </div>
      )}

    </div>
  );
}
