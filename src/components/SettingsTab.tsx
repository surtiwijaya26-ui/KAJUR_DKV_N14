import React, { useState } from "react";
import { motion } from "motion/react";
import { AppSettings, Student, EmailHistory } from "../types";
import { 
  Settings, 
  Save, 
  Download, 
  Check, 
  AlertCircle, 
  Calendar, 
  Mail, 
  FolderOpen, 
  FileCheck,
  User,
  Hash,
  Database,
  Upload
} from "lucide-react";

interface SettingsTabProps {
  settings: AppSettings;
  onUpdateSettings: (updated: Partial<AppSettings>) => void;
  students: Student[];
  emailHistory: EmailHistory[];
  onRestoreDatabase: (restoredStudents: Student[], restoredEmailHistory: EmailHistory[], restoredSettings?: AppSettings) => void;
}

export default function SettingsTab({ 
  settings, 
  onUpdateSettings, 
  students, 
  emailHistory,
  onRestoreDatabase
}: SettingsTabProps) {
  const [formSettings, setFormSettings] = useState<AppSettings>(() => {
    return {
      emailSubjectTemplate: "Permohonan Praktek Kerja Lapangan (PKL) DKV - {{STUDENT_NAME}} - {{COMPANY_NAME}}",
      emailBodyTemplate: `Kepada Yth.
Bapak/Ibu HRD {{COMPANY_NAME}}
Di Tempat

Dengan hormat,

Sehubungan dengan program Praktik Kerja Lapangan (PKL) siswa Kompetensi Keahlian Desain Komunikasi Visual (DKV), kami bermaksud mengajukan permohonan PKL untuk siswa kami:

Nama: {{STUDENT_NAME}}
NIS: {{STUDENT_NIS}}
Kelas: {{STUDENT_CLASS}}
Sekolah: SMK Negeri 14 Kabupaten Tangerang

Siswa tersebut di atas memiliki keahlian utama di bidang:
{{STUDENT_SKILLS}}

Berikut adalah portofolio karya digital siswa sebagai bahan pertimbangan Bapak/Ibu:
{{STUDENT_PORTFOLIO}}
Highlight Portofolio: {{PORTFOLIO_HIGHLIGHT}}

{{CUSTOM_NOTES}}

Kami sangat berharap Bapak/Ibu berkenan menerima anak didik kami untuk menimba ilmu industri kreatif di {{COMPANY_NAME}}. Surat resmi pengantar, CV, beserta pakta integritas siap kami lampirkan.

Atas perhatian dan kerjasama Bapak/Ibu HRD, kami ucapkan terima kasih.

Hormat kami,
Kepala Program Studi DKV
{{HEAD_OF_DEPARTMENT}}`,
      ...settings
    };
  });
  const [isSaved, setIsSaved] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text);

        if (!data || typeof data !== "object") {
          throw new Error("Format berkas JSON cadangan tidak valid.");
        }

        if (!Array.isArray(data.students)) {
          throw new Error("Berkas cadangan wajib menyertakan daftar siswa ('students') dalam format array.");
        }

        const restoredStudents = data.students as Student[];
        const restoredEmailHistory = Array.isArray(data.emailHistory) ? (data.emailHistory as EmailHistory[]) : [];
        const restoredSettings = data.settings ? (data.settings as AppSettings) : undefined;

        const confirmation = window.confirm(
          `Apakah Anda yakin ingin mengganti data saat ini dengan data dari cadangan?\n\n` +
          `Detail data yang terkandung:\n` +
          `• Siswa: ${restoredStudents.length} orang\n` +
          `• Log Riwayat Email: ${restoredEmailHistory.length} rincian\n` +
          `• Setelan Sistem: ${restoredSettings ? "Tersedia" : "Tidak ada (menggunakan setelan saat ini)"}\n\n` +
          `PERINGATAN: Tindakan ini akan menimpa seluruh data utama Anda!`
        );

        if (confirmation) {
          onRestoreDatabase(restoredStudents, restoredEmailHistory, restoredSettings);
          if (restoredSettings) {
            setFormSettings({ ...restoredSettings });
          }
          setImportSuccess(
            `Database berhasil diperbarui! Memulihkan ${restoredStudents.length} siswa & ${restoredEmailHistory.length} log email.`
          );
        }
      } catch (err: any) {
        setImportError(err?.message || "Terjadi kesalahan internal ketika memproses file cadangan.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // enables re-triggering file choose if needed
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleBackup = () => {
    // Generate JSON containing entire state of the system
    const backupData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      students,
      emailHistory,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `Backup_Sistem_PKL_DKV_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-tab">
      {/* Tab Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-6 rounded-2xl border border-white/10 shadow-xl flex items-center justify-between">
        <div>
          <span className="bg-indigo-500/15 text-indigo-300 font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-indigo-500/25">
            PENGATURAN ADMINISTRATOR
          </span>
          <h2 className="text-2xl font-bold font-display mt-2 text-white">
            Konfigurasi & Cadangan Sistem
          </h2>
          <p className="text-white/60 text-xs mt-1">
            Sesuaikan parameter instansi, pejabat penandatangan, format surat, serta kelola cadangan data offline.
          </p>
        </div>
        <div className="bg-indigo-500/10 p-3.5 rounded-2xl border border-indigo-500/20 text-indigo-400 hidden sm:block">
          <Settings className="w-6 h-6 animate-spin-slow" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Settings Inputs Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6" id="settings-form">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-5">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <FileCheck className="w-4 h-4 text-blue-400" />
              Format Surat & Penandatanganan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Format Nomor Surat</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    id="settings-letter-no-format"
                    value={formSettings.letterNoFormat}
                    onChange={(e) => setFormSettings({ ...formSettings, letterNoFormat: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none font-mono text-xs text-white"
                    placeholder="Contoh: 421.5/###-SMKN1-TNG/DKV/2026"
                    required
                  />
                </div>
                <p className="text-[10px] text-white/40 italic">### akan otomatis digantikan nomor urut dokumen.</p>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Tahun Pelajaran</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    id="settings-school-year"
                    value={formSettings.schoolYear}
                    onChange={(e) => setFormSettings({ ...formSettings, schoolYear: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none text-white font-medium"
                    placeholder="Contoh: 2025/2026"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Nama Kaprog DKV (Penandatangan Surat)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    id="settings-head-of-department"
                    value={formSettings.headOfDepartment}
                    onChange={(e) => setFormSettings({ ...formSettings, headOfDepartment: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none text-white font-medium"
                    placeholder="Contoh: Siti Aminah, S.Sn., Gr."
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">NIP Kaprog DKV</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    id="settings-head-of-department-nip"
                    value={formSettings.headOfDepartmentNIP}
                    onChange={(e) => setFormSettings({ ...formSettings, headOfDepartmentNIP: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none text-white font-mono"
                    placeholder="NIP Kaprog"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Koordinator Hubinmas</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    id="settings-head-of-hubin"
                    value={formSettings.headOfHubin}
                    onChange={(e) => setFormSettings({ ...formSettings, headOfHubin: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none text-white font-medium"
                    placeholder="Nama Koordinator Hubinmas"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">NIP Koordinator Hubinmas</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    id="settings-head-of-hubin-nip"
                    value={formSettings.headOfHubinNIP}
                    onChange={(e) => setFormSettings({ ...formSettings, headOfHubinNIP: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none text-white font-mono"
                    placeholder="NIP Koordinator"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-5">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
              <FolderOpen className="w-4 h-4 text-purple-400" />
              Integrasi Cloud & Sekolah
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-xs md:col-span-2">
                <label className="font-bold text-white/70 block">Email Sekolah Hubin</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="email"
                    id="settings-school-email"
                    value={formSettings.schoolEmail}
                    onChange={(e) => setFormSettings({ ...formSettings, schoolEmail: e.target.value })}
                    className="w-full glass-input rounded-lg pl-9 p-2.5 outline-none text-white"
                    placeholder="Contoh: hubin.smkn1@gmail.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">ID Folder Google Drive 'PKL_Templates'</label>
                <input
                  type="text"
                  id="settings-drive-template-id"
                  value={formSettings.driveTemplateFolderId}
                  onChange={(e) => setFormSettings({ ...formSettings, driveTemplateFolderId: e.target.value })}
                  className="w-full glass-input rounded-lg p-2.5 outline-none font-mono text-xs text-white"
                  placeholder="ID folder template docs"
                  required
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">ID Folder Google Drive 'PKL_Output'</label>
                <input
                  type="text"
                  id="settings-drive-output-id"
                  value={formSettings.driveOutputFolderId}
                  onChange={(e) => setFormSettings({ ...formSettings, driveOutputFolderId: e.target.value })}
                  className="w-full glass-input rounded-lg p-2.5 outline-none font-mono text-xs text-white"
                  placeholder="ID folder wadah dokumen PDF"
                  required
                />
              </div>
            </div>
          </div>

          {/* Email Template Editor Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-5" id="settings-email-editor">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 font-sans">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                Email Template Editor (Surat Lamaran HRD)
              </h3>
              <button
                type="button"
                id="reset-email-tmpl-btn"
                onClick={() => {
                  const confirmReset = window.confirm("Apakah Anda yakin ingin menyetel ulang template email ke bawaan default?");
                  if (confirmReset) {
                    setFormSettings({
                      ...formSettings,
                      emailSubjectTemplate: "Permohonan Praktek Kerja Lapangan (PKL) DKV - {{STUDENT_NAME}} - {{COMPANY_NAME}}",
                      emailBodyTemplate: `Kepada Yth.
Bapak/Ibu HRD {{COMPANY_NAME}}
Di Tempat

Dengan hormat,

Sehubungan dengan program Praktik Kerja Lapangan (PKL) siswa Kompetensi Keahlian Desain Komunikasi Visual (DKV), kami bermaksud mengajukan permohonan PKL untuk siswa kami:

Nama: {{STUDENT_NAME}}
NIS: {{STUDENT_NIS}}
Kelas: {{STUDENT_CLASS}}
Sekolah: SMK Negeri 14 Kabupaten Tangerang

Siswa tersebut di atas memiliki keahlian utama di bidang:
{{STUDENT_SKILLS}}

Berikut adalah portofolio karya digital siswa sebagai bahan pertimbangan Bapak/Ibu:
{{STUDENT_PORTFOLIO}}
Highlight Portofolio: {{PORTFOLIO_HIGHLIGHT}}

{{CUSTOM_NOTES}}

Kami sangat berharap Bapak/Ibu berkenan menerima anak didik kami untuk menimba ilmu industri kreatif di {{COMPANY_NAME}}. Surat resmi pengantar, CV, beserta pakta integritas siap kami lampirkan.

Atas perhatian dan kerjasama Bapak/Ibu HRD, kami ucapkan terima kasih.

Hormat kami,
Kepala Program Studi DKV
{{HEAD_OF_DEPARTMENT}}`
                    });
                  }
                }}
                className="bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-amber-400 font-bold text-[10px] px-2.5 py-1.5 rounded-lg cursor-pointer transition-all active:scale-95 duration-100"
              >
                Reset ke Default
              </button>
            </div>

            <p className="text-white/75 text-xs leading-relaxed font-sans">
              Kustomisasi template surat pengantar lamaran siswa PKL ke HRD perusahaan. Anda dapat menyusun kalimat penawaran formal dan menyelipkan penanda format variabel di bawah ini:
            </p>

            {/* Field Guide */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 space-y-2 font-sans">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#93c5fd] font-mono block">Daftar Placeholder Variabel Resmi:</span>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[10.5px] leading-relaxed">
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{STUDENT_NAME}}"}</code> <span className="text-white/50">Nama Siswa</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{STUDENT_NIS}}"}</code> <span className="text-white/50">NIS Siswa</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{STUDENT_CLASS}}"}</code> <span className="text-white/50">Kelas Siswa</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{COMPANY_NAME}}"}</code> <span className="text-white/50">Nama Perusahaan</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{COMPANY_INDUSTRY}}"}</code> <span className="text-white/50">Bidang Usaha</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{STUDENT_SKILLS}}"}</code> <span className="text-white/50">Keahlian DKV</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{STUDENT_PORTFOLIO}}"}</code> <span className="text-white/50">Link Portofolio</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{PORTFOLIO_HIGHLIGHT}}"}</code> <span className="text-white/50">Deskripsi Karya</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{CUSTOM_NOTES}}"}</code> <span className="text-white/50">Catatan Pengantar</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{HEAD_OF_DEPARTMENT}}"}</code> <span className="text-white/50">Kajur DKV</span></div>
                <div><code className="text-emerald-400 font-bold font-mono text-[10px] select-all bg-white/5 px-1 py-0.5 rounded">{"{{SCHOOL_EMAIL}}"}</code> <span className="text-white/50">Email Hubin</span></div>
              </div>
            </div>

            <div className="space-y-4 font-sans">
              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Subjek Email Template</label>
                <input
                  type="text"
                  id="settings-email-subject-template"
                  value={formSettings.emailSubjectTemplate}
                  onChange={(e) => setFormSettings({ ...formSettings, emailSubjectTemplate: e.target.value })}
                  className="w-full glass-input rounded-lg p-2.5 outline-none font-sans font-bold text-xs text-white"
                  placeholder="Ketik subjek lamaran..."
                  required
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-bold text-white/70 block">Isi Email Template (Body)</label>
                <textarea
                  rows={12}
                  id="settings-email-body-template"
                  value={formSettings.emailBodyTemplate}
                  onChange={(e) => setFormSettings({ ...formSettings, emailBodyTemplate: e.target.value })}
                  className="w-full glass-input rounded-lg p-3 outline-none font-sans leading-relaxed text-xs text-white"
                  placeholder="Susun kerangka surat..."
                  required
                />
              </div>
            </div>
          </div>

          {/* Save Action Banner */}
          <div className="flex items-center justify-end gap-3.5">
            {isSaved && (
              <motion.span 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-emerald-400 text-xs font-semibold flex items-center gap-1"
                id="settings-save-success-msg"
              >
                <Check className="w-4 h-4" /> Pengaturan berhasil disimpan ke sistem!
              </motion.span>
            )}
            <button
              type="submit"
              id="settings-save-btn"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-505/20 border border-indigo-400/20 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              Simpan Pengaturan
            </button>
          </div>
        </form>

        {/* Backups Panel Column */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Cadangkan Data Lokal
              </h3>
            </div>
            
            <p className="text-white/75 text-xs leading-relaxed">
              Kuras data lokal Anda secara aman. Tombol backup di bawah ini akan mengekspor seluruh status sistem saat ini, termasuk daftar siswa lengkap, riwayat kirim email lamaran HRD, dan setelan operasional ke dalam satu file JSON rapi murni.
            </p>

            {/* Quick Metrics display inside backup area */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-2 font-mono text-[11px] text-white/50">
              <div className="flex justify-between">
                <span>Database Siswa:</span>
                <span className="text-sky-305 font-bold text-slate-350">{students.length} record</span>
              </div>
              <div className="flex justify-between">
                <span>Log Riwayat Email:</span>
                <span className="text-sky-305 font-bold text-slate-350">{emailHistory.length} entri</span>
              </div>
              <div className="flex justify-between">
                <span>Versi Schema:</span>
                <span className="text-sky-305 font-bold text-emerald-400">v1.0 (Aktif)</span>
              </div>
            </div>

            <button
              onClick={handleBackup}
              id="settings-backup-btn"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15 border border-blue-450/20 cursor-pointer transition-all active:scale-95 duration-150"
              title="Download backup file"
            >
              <Download className="w-4 h-4 animate-bounce" />
              Ekspor & Cadangkan Data
            </button>

            <div className="bg-blue-500/5 text-[11px] text-blue-300 p-3 rounded-lg border border-blue-500/10 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 text-blue-450 mt-0.5 flex-shrink-0" />
              <span>Simpan file cadangan secara berkala untuk berjaga-jaga apabila Anda menghapus cache browser Anda.</span>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="border-b border-white/10 pb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-bold text-sm text-white">
                Pulihkan Data Cadangan
              </h3>
            </div>
            
            <p className="text-white/75 text-xs leading-relaxed">
              Pilih file JSON cadangan Anda untuk mengembalikan seluruh database siswa, status, rincian log, serta setelan operasional sistem secara utuh.
            </p>

            {importSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3 rounded-lg text-xs flex items-start gap-2 leading-relaxed">
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{importSuccess}</span>
              </div>
            )}

            {importError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-lg text-xs flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{importError}</span>
              </div>
            )}

            <div className="relative">
              <input
                type="file"
                id="settings-import-file-input"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
              <label
                htmlFor="settings-import-file-input"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15 border border-emerald-450/20 cursor-pointer transition-all active:scale-95 duration-150 text-center"
              >
                <Upload className="w-4 h-4" />
                Pilih Berkas & Impor (.json)
              </label>
            </div>

            <div className="bg-emerald-500/5 text-[11px] text-emerald-300 p-3 rounded-lg border border-emerald-500/10 flex items-start gap-2 leading-relaxed">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-450 mt-0.5 flex-shrink-0" />
              <span>Peringatan: Mengimpor cadangan akan menimpa data siswa dan email history aktif saat ini.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
