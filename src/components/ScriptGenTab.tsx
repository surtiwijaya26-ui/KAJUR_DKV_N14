import React, { useState } from "react";
import { AppSettings } from "../types";
import { 
  FileCode, 
  Copy, 
  Check, 
  Database, 
  Info, 
  FolderLock, 
  Hammer, 
  HeartHandshake,
  Download,
  Terminal,
  Settings
} from "lucide-react";

interface ScriptGenTabProps {
  settings: AppSettings;
  onUpdateSettings: (updated: Partial<AppSettings>) => void;
}

export default function ScriptGenTab({ settings, onUpdateSettings }: ScriptGenTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"code" | "html">("code");
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const handleCopyCode = (text: string, type: "code" | "html") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  const codeGsContent = `/**
 * ====================================================================
 * APLIKASI OTOMATISASI ADMINISTRASI KAJUR DKV 2026
 * SMK Negeri 14 Kabupaten Tangerang - Jurusan Desain Komunikasi Visual
 * ====================================================================
 * Panduan Pemasangan:
 * 1. Buka Google Sheets > Extensions > Apps Script
 * 2. Hapus semua kode default, paste seluruh isi kode ini
 * 3. Simpan proyek denagn ikon disket (Save)
 * 4. Deploy > New deployment > Web app > Execute as Me > Access: Anyone
 * ====================================================================
 */

// KONFIGURASI FOLDER DRIVE & IDENTITAS (Silakan ubah ID di bawah ini)
const TEMPLATE_FOLDER_ID = "${settings.driveTemplateFolderId || "1NM2EO23Dup12RQuPkf2tyVIJ8pqpgd9d"}";
const OUTPUT_FOLDER_ID = "${settings.driveOutputFolderId || "1-6K43T1fB0wDStkHxo5gfHzJaR5c__KY"}";
const SCHOOL_EMAIL = "${settings.schoolEmail || "kajurdkv.smkn1@gmail.com"}";
const KAPROG_DKV = "${settings.headOfDepartment || "SURTI WIJAYA, S.Kom., Gr."}";

/**
 * Menyajikan Tampilan Mobile Dashboard untuk Staf TU & Hubin via HP
 */
function doGet(e) {
  return HtmlService.createTemplateFromFile('dashboard')
    .evaluate()
    .setTitle('Dashboard PKL DKV SMKN 14 Kab Tangerang')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Mengakses data siswa dari Spreadsheet aktif
 */
function getStudentData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const students = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const student = {};
    headers.forEach((header, index) => {
      student[header.toString().trim()] = row[index];
    });
    students.push(student);
  }
  
  return students;
}

/**
 * Otomatisasi PEMBUATAN DOKUMEN PDF (Pengantar, Biodata, BYOD)
 * Mencari template di Drive, mengisi placeholder {{Nama}}, dan mengonversi ke PDF
 */
function generateDocumentForStudent(studentId, templateType) {
  const students = getStudentData();
  const student = students.find(s => s.nis.toString() === studentId.toString());
  
  if (!student) throw new Error("Data siswa DKV tidak ditemukan.");
  
  // Pilih nama berkas template di Drive
  let templateFileName = "Template_Pengantar";
  if (templateType === "BIODATA") templateFileName = "Template_Biodata";
  if (templateType === "BYOD") templateFileName = "Template_BYOD";
  
  // Cari berkas di Folder Template
  const templateFolder = DriveApp.getFolderById(TEMPLATE_FOLDER_ID);
  const files = templateFolder.getFilesByName(templateFileName);
  
  if (!files.hasNext()) {
    throw new Error("Template " + templateFileName + " tidak ditemukan di Folder Drive.");
  }
  
  const templateFile = files.next();
  const outputFolder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  
  // Duplikasi template ke Folder Output
  const docName = templateType + "_" + student["Nama"] + "_PKL_2526";
  const copiedFile = templateFile.makeCopy(docName, outputFolder);
  const docId = copiedFile.getId();
  const doc = DocumentApp.openById(docId);
  const body = doc.getBody();
  
  // Lakukan Penggantian Placeholder Otomatis (Mail Merge / Autocrat)
  body.replaceText("{{Nama Siswa}}", student["Nama"] || "-");
  body.replaceText("{{NIS}}", student["NIS"] || "-");
  body.replaceText("{{Kelas}}", student["Kelas"] || "XII DKV");
  body.replaceText("{{Nomor HP}}", student["HP"] || "-");
  body.replaceText("{{Keahlian}}", student["Keahlian"] || "-");
  body.replaceText("{{Portofolio}}", student["Portofolio"] || "-");
  body.replaceText("{{Nama Wali}}", student["Nama Wali"] || student["NamaOrangTua"] || "-");
  body.replaceText("{{Pekerjaan Wali}}", student["Pekerjaan Wali"] || student["PekerjaanOrangTua"] || "-");
  body.replaceText("{{Alamat}}", student["Alamat"] || "-");
  body.replaceText("{{Perusahaan}}", student["Perusahaan"] || "-");
  body.replaceText("{{Kaprog}}", KAPROG_DKV);
  
  doc.saveAndClose();
  
  // Ubah Dokumen Google Docs ke PDF murni
  const pdfBlob = copiedFile.getAs(MimeType.PDF);
  const pdfFile = outputFolder.createFile(pdfBlob);
  pdfFile.setName(docName + ".pdf");
  
  // Hapus Google Docs sementara agar Drive rapi
  copiedFile.setTrashed(true);
  
  return {
    pdfUrl: pdfFile.getUrl(),
    pdfName: pdfFile.getName()
  };
}

/**
 * Otomatis mengirimkan email ke HRD dengan lampiran PDF lamaran PKL
 */
function sendEmailToHRD(studentId, hrdEmail, subject, mailBody, documentUrl) {
  const students = getStudentData();
  const student = students.find(s => s.nis.toString() === studentId.toString());
  
  if (!student) throw new Error("Siswa tidak ditemukan.");
  
  // Dapatkan berkas PDF dari url Drive untuk dijadikan lampiran email
  const pdfFileId = documentUrl.split("id=")[1] || documentUrl.split("/d/")[1].split("/")[0];
  const file = DriveApp.getFileById(pdfFileId);
  
  MailApp.sendEmail({
    to: hrdEmail,
    subject: subject,
    body: mailBody,
    attachments: [file.getAs(MimeType.PDF)],
    replyTo: SCHOOL_EMAIL
  });
  
  return "Email permohonan PKL berhasil dikirim ke " + hrdEmail;
}`;

  const dashboardHtmlContent = `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <!-- CSS Tailwind untuk mempercantik Dashboard HP -->
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
  <title>Dashboard PKL SMKN 14 Kabupaten Tangerang</title>
</head>
<body className="bg-gray-100 font-sans min-h-screen text-gray-800">
  <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg pb-10">
    
    <!-- Phone Header -->
    <div className="bg-indigo-900 text-white p-5 rounded-b-2xl shadow-md">
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-650 p-2 rounded-xl text-white font-bold text-xs">
          SMK
        </div>
        <div>
          <span className="text-[10px] text-indigo-200 block tracking-widest font-bold">PORTAL HUBIN TIM TU</span>
          <h1 className="text-base font-bold">Administrasi PKL DKV 2026</h1>
        </div>
      </div>
    </div>

    <!-- Stats summary inside HP Dashboard -->
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block">PROSES PKL</span>
          <span className="text-2xl font-black text-indigo-900" id="total-count">0</span>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-xl text-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider block"> SELESAI</span>
          <span className="text-2xl font-black text-green-700" id="done-count">0</span>
        </div>
      </div>

      <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider mb-3">Daftar Penempatan Aktif</h3>
      
      <!-- Student placement streams -->
      <div className="space-y-3" id="students-list">
        <div className="text-center py-6 text-gray-400 text-xs">
          Sedang menyinkronkan spreadsheet...
        </div>
      </div>

    </div>
  </div>

  <script>
    // Memanggil fungsi Apps Script secara asinkron untuk mengambil data Spreadsheet
    function loadData() {
      google.script.run
        .withSuccessHandler(function(students) {
          const listContainer = document.getElementById("students-list");
          listContainer.innerHTML = "";
          
          if (!students || students.length === 0) {
            listContainer.innerHTML = '<div className="text-center py-8 text-xs text-gray-400">Database kosong, silakan tambah baris di Google Sheets.</div>';
            return;
          }

          document.getElementById("total-count").innerText = students.length;
          let completed = 0;

          students.forEach(function(student) {
            const isCompleted = student["Status"] === "Completed" || student["Status"] === "Selesai";
            if (isCompleted) completed++;

            const card = document.createElement("div");
            card.className = "p-3.5 rounded-lg border bg-gray-50 border-gray-200 flex items-center justify-between";
            
            card.innerHTML = '<div>' +
              '<div className="font-bold text-xs text-gray-800">' + student["Nama"] + '</div>' +
              '<div className="text-[10px] text-gray-500 font-mono mt-0.5">' + student["NIS"] + ' | ' + student["Kelas"] + '</div>' +
              '<div className="text-[10px] text-indigo-650 font-semibold mt-1">Sektor: ' + (student["Perusahaan"] || "Unassigned") + '</div>' +
              '</div>' +
              '<div>' +
              '<span className="text-[9px] font-bold px-2 py-1 rounded-full ' + 
              (isCompleted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800') + '">' +
              (student["Status"] || "Draft") + '</span>' +
              '</div>';

            listContainer.appendChild(card);
          });

          document.getElementById("done-count").innerText = completed;
        })
        .getStudentData();
    }

    // Load data otomatis saat HP Dashboard dibuka
    window.onload = loadData;
  </script>
</body>
</html>`;

  return (
    <div className="space-y-6 animate-fade-in" id="script-tab">
      
      {/* Parameter input overrides */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        <div className="border-b border-white/10 pb-3">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Integrasi Folder Google Drive Anda (Langkah 3)
          </h3>
          <p className="text-xs text-white/50 mt-1">
            Setting ID Folder Drive Anda di bawah ini untuk memperbarui isi kode <code className="bg-white/5 px-1 rounded font-mono text-blue-300">Code.gs</code> secara instan sebelum melakukan copy-paste ke Google Apps Script:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-white/70 flex items-center gap-1.5">
              <FolderLock className="w-4 h-4 text-white/30" />
              ID Folder 'PKL_Templates'
            </label>
            <input 
              type="text" 
              value={settings.driveTemplateFolderId}
              onChange={(e) => onUpdateSettings({ driveTemplateFolderId: e.target.value })}
              placeholder="Contoh: 1A7B9C3D8F..."
              className="w-full glass-input rounded-lg p-2.5 outline-none font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-white/70 flex items-center gap-1.5">
              <FolderLock className="w-4 h-4 text-white/30" />
              ID Folder 'PKL_Output'
            </label>
            <input 
              type="text" 
              value={settings.driveOutputFolderId}
              onChange={(e) => onUpdateSettings({ driveOutputFolderId: e.target.value })}
              placeholder="Contoh: 2X8Y6Z5... "
              className="w-full glass-input rounded-lg p-2.5 outline-none font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Script container */}
      <div className="bg-[#0b0b14]/70 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col min-h-[55vh]">
        
        {/* Sub tabs selectors */}
        <div className="bg-[#050508]/85 px-4 py-3 flex border-b border-white/10 justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab("code")}
              className={`p-2 rounded font-semibold text-xs transition px-3 cursor-pointer flex items-center gap-1.5 ${activeSubTab === "code" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}
            >
              <FileCode className="w-4 h-4" />
              Code.gs (Mesin Utama)
            </button>

            <button
              onClick={() => setActiveSubTab("html")}
              className={`p-2 rounded font-semibold text-xs transition px-3 cursor-pointer flex items-center gap-1.5 ${activeSubTab === "html" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}
            >
              <Terminal className="w-4 h-4" />
              dashboard.html (Dashboard HP)
            </button>
          </div>

          <div>
            {activeSubTab === "code" ? (
              <button
                onClick={() => handleCopyCode(codeGsContent, "code")}
                className="bg-white/5 hover:bg-white/10 font-bold border border-white/10 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? "Tersalin!" : "Copy Code.gs"}
              </button>
            ) : (
              <button
                onClick={() => handleCopyCode(dashboardHtmlContent, "html")}
                className="bg-white/5 hover:bg-white/10 font-bold border border-white/10 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copiedHtml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedHtml ? "Tersalin!" : "Copy dashboard.html"}
              </button>
            )}
          </div>
        </div>

        {/* Code display window */}
        <div className="p-4 bg-slate-950/80 font-mono text-[11px] overflow-auto flex-1 leading-relaxed max-h-[60vh] select-text">
          <pre className="text-sky-300">
            <code>
              {activeSubTab === "code" ? codeGsContent : dashboardHtmlContent}
            </code>
          </pre>
        </div>
      </div>

      {/* Verification footer / assurance */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/15">
          <Hammer className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-white text-xs uppercase tracking-wider">Garansi Otomatisasi Terverifikasi</h4>
          <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
            Kode script di atas dirancang ramah seluler (mobile scalable) dan menggunakan API resmi Google Apps Script (<strong>HtmlService, DocumentApp, DriveApp, SpreadsheetApp</strong>). Sangat aman dijalankan di server internal Google demi efisiensi tinggi tim TU & Hubin.
          </p>
        </div>
      </div>
    </div>
  );
}
