import React, { useState } from "react";
import { Student, Company, AppSettings, LogbookEntry } from "../types";
import GoogleDriveSync from "./GoogleDriveSync";
import { 
  Printer, 
  Settings, 
  FileText, 
  User, 
  Monitor, 
  Layers, 
  FileSignature, 
  RefreshCw,
  Clock,
  ArrowRight,
  Eye,
  X,
  Sliders,
  SlidersHorizontal,
  Info,
  Type,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Award
} from "lucide-react";

interface LettersTabProps {
  students: Student[];
  companies: Company[];
  settings: AppSettings;
  onUpdateSettings: (updated: Partial<AppSettings>) => void;
  logbooks?: LogbookEntry[];
}

type LetterType = "PENGANTAR" | "BIODATA" | "BYOD" | "CERTIFICATE";

export default function LettersTab({
  students,
  companies,
  settings,
  onUpdateSettings,
  logbooks = []
}: LettersTabProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");
  const [activeLetterType, setActiveLetterType] = useState<LetterType>("PENGANTAR");
  const [isSignHubin, setIsSignHubin] = useState(false); // Toggle between Head of DKV or Head of Hubin signing
  
  // Custom overriding numbers
  const [customLetterNum, setCustomLetterNum] = useState("042");

  // Print customization states
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [marginTop, setMarginTop] = useState(20);       // default A4 margin top in mm
  const [marginBottom, setMarginBottom] = useState(20);    // default A4 margin bottom in mm
  const [marginLeft, setMarginLeft] = useState(15);      // default A4 margin left in mm
  const [marginRight, setMarginRight] = useState(15);     // default A4 margin right in mm
  const [fontSizePt, setFontSizePt] = useState(11);       // default typography scale (10, 11, 12, 13, 14, 15 pt)
  const [showMarginGuides, setShowMarginGuides] = useState(true);
  const [zoomPercent, setZoomPercent] = useState(65);     // layout visual scale of the preview sheet (50% - 130%)

  const activeStudent = students.find(s => s.id === selectedStudentId) || students[0];
  const linkedCompany = activeStudent ? companies.find(c => c.id === activeStudent.companyId) : null;

  const formattedLetterNo = settings.letterNoFormat.replace("###", customLetterNum.padStart(3, "0"));
  const isLandscape = activeLetterType === "CERTIFICATE";

  const applyPreset = (preset: "NORMAL" | "NARROW" | "WIDE") => {
    if (preset === "NORMAL") {
      setMarginTop(20);
      setMarginBottom(20);
      setMarginLeft(15);
      setMarginRight(15);
    } else if (preset === "NARROW") {
      setMarginTop(12);
      setMarginBottom(12);
      setMarginLeft(10);
      setMarginRight(10);
    } else if (preset === "WIDE") {
      setMarginTop(28);
      setMarginBottom(28);
      setMarginLeft(22);
      setMarginRight(22);
    }
  };

  // Render Letterheads / Kop Surat
  const renderKopSurat = () => (
    <div className="border-b-4 border-double border-slate-950 pb-3 mb-5 text-center font-serif text-black relative">
      <div className="absolute left-2 top-1 w-16 h-16 opacity-90 hidden sm:block">
        {/* Simple school emblem styled in layout */}
        <div className="w-14 h-14 bg-indigo-900 text-white rounded-full flex items-center justify-center font-bold font-sans text-xs border-4 border-double border-indigo-400">
          SMKN1
        </div>
      </div>
      <div>
        <h4 className="text-[13px] font-bold uppercase tracking-wider text-slate-800 leading-tight">Pemerintah Provinsi Banten</h4>
        <h3 className="text-sm font-extrabold uppercase text-slate-900 leading-tight">Dinas Pendidikan dan Kebudayaan</h3>
        <h2 className="text-lg font-black uppercase text-indigo-950 leading-tight">SMK NEGERI 14 KAB TANGERANG</h2>
        <p className="text-[14px] font-extrabold tracking-wide uppercase text-slate-900 leading-none mt-0.5">KOMPETENSI KEAHLIAN: DESAIN KOMUNIKASI VISUAL (DKV)</p>
        <p className="text-[9px] text-slate-500 italic font-sans font-medium mt-1">
          Jl. Raya Kp mindi Desa Budi Mulya Km. 4, Kec. Cikupa, Tangerang - Banten | Telp: (021) 593730 | Web: www.smkn14kabteng.sch.id
        </p>
      </div>
    </div>
  );

  const triggerPrint = () => {
    window.print();
  };

  // Centralized Print Document Component
  const renderPrintableDocument = (isForModal = false) => {
    if (!activeStudent) {
      return (
        <div className="bg-white p-12 text-center text-slate-400 self-center min-w-[320px] rounded-lg shadow border border-slate-200">
          Pilih siswa terlebih dahulu untuk digenerate suratnya.
        </div>
      );
    }

    // Dynamic PKL Performance Assessment Grade
    const studentLogs = (logbooks || []).filter(l => l.studentId === activeStudent.id);
    const actualLogsCount = studentLogs.length;
    
    // Base scores from their skills and volume of logs
    let finalScore = 75 + (activeStudent.skills.length * 3) + Math.min(10, actualLogsCount);
    if (finalScore > 100) finalScore = 100;
    
    let gradeTitle = "MEMUASKAN (SATISFACTORY)";
    if (finalScore >= 92) {
      gradeTitle = "ISTIMEWA (EXCELLENT)";
    } else if (finalScore >= 83) {
      gradeTitle = "SANGAT BAIK (VERY GOOD)";
    } else if (finalScore >= 75) {
      gradeTitle = "BAIK (GOOD)";
    }

    return (
      <div 
        className={`printable-document bg-white tracking-wide text-slate-950 font-serif leading-relaxed rounded shadow-2xl border border-slate-300 ${isLandscape ? 'w-[297mm] min-h-[210mm] h-[210mm]' : 'w-[210mm] min-h-[297mm]'} flex-shrink-0 relative overflow-hidden`}
        style={isLandscape ? {
          paddingTop: "12mm",
          paddingBottom: "12mm",
          paddingLeft: "16mm",
          paddingRight: "16mm",
          fontSize: "10pt",
          boxSizing: 'border-box'
        } : { 
          paddingTop: `${marginTop}mm`, 
          paddingBottom: `${marginBottom}mm`, 
          paddingLeft: `${marginLeft}mm`, 
          paddingRight: `${marginRight}mm`,
          fontSize: `${fontSizePt}pt`,
          boxSizing: 'border-box'
        }}
      >
        {/* Dynamic @media print CSS override tag */}
        <style>
          {`
            @media print {
              @page {
                size: ${isLandscape ? "landscape" : "portrait"};
                margin: 0;
              }
              body {
                margin: 0;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .printable-document {
                padding-top: ${isLandscape ? "12mm" : `${marginTop}mm`} !important;
                padding-bottom: ${isLandscape ? "12mm" : `${marginBottom}mm`} !important;
                padding-left: ${isLandscape ? "16mm" : `${marginLeft}mm`} !important;
                padding-right: ${isLandscape ? "16mm" : `${marginRight}mm`} !important;
                font-size: ${isLandscape ? "10pt" : `${fontSizePt}pt`} !important;
                width: ${isLandscape ? "297mm" : "210mm"} !important;
                height: ${isLandscape ? "210mm" : "297mm"} !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}
        </style>

        {/* Live Margin Guidelines Overlay */}
        {showMarginGuides && !isLandscape && (
          <div className="absolute inset-0 pointer-events-none no-print border-rose-500/10" style={{ 
            marginTop: `${marginTop}mm`, 
            marginBottom: `${marginBottom}mm`, 
            marginLeft: `${marginLeft}mm`, 
            marginRight: `${marginRight}mm`,
            border: "1px dashed rgba(59, 130, 246, 0.3)"
          }}>
            <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[8px] font-mono font-extrabold bg-blue-600/90 text-white rounded px-1 py-0.2 ml-[-10px] select-none tracking-tight">Atas: {marginTop}mm</span>
            <span className="absolute -bottom-[18px] left-1/2 -translate-x-1/2 text-[8px] font-mono font-extrabold bg-blue-600/90 text-white rounded px-1 py-0.2 ml-[-10px] select-none tracking-tight">Bawah: {marginBottom}mm</span>
            <span className="absolute -left-[14px] top-1/2 -translate-y-1/2 text-[8px] font-mono font-extrabold bg-blue-600/90 text-white rounded px-1 py-0.5 select-none tracking-tight origin-center rotate-90 whitespace-nowrap">Kiri: {marginLeft}mm</span>
            <span className="absolute -right-[14px] top-1/2 -translate-y-1/2 text-[8px] font-mono font-extrabold bg-blue-600/90 text-white rounded px-1 py-0.5 select-none tracking-tight origin-center -rotate-90 whitespace-nowrap">Kanan: {marginRight}mm</span>
          </div>
        )}

        {/* Kop Surat */}
        {activeLetterType !== "CERTIFICATE" && renderKopSurat()}

        {/* LETTER 1: SURAT PENGANTAR PKL */}
        {activeLetterType === "PENGANTAR" && (
          <div className="space-y-4">
            {/* Metadata & Date */}
            <div className="flex justify-between items-start text-[12px] font-sans">
              <div>
                <table>
                  <tbody>
                    <tr>
                      <td className="pr-4 py-0.5 font-bold">Nomor</td>
                      <td className="pr-2 py-0.5">:</td>
                      <td className="py-0.5 font-mono">{formattedLetterNo}</td>
                    </tr>
                    <tr>
                      <td className="pr-4 py-0.5 font-bold">Lampiran</td>
                      <td className="pr-2 py-0.5">:</td>
                      <td className="py-0.5">1 Rekas (Biodata Siswa DKV)</td>
                    </tr>
                    <tr>
                      <td className="pr-4 py-0.5 font-bold">Hal</td>
                      <td className="pr-2 py-0.5">:</td>
                      <td className="py-0.5 font-bold underline">Permohonan Praktek Kerja Lapangan (PKL)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <p>Tangerang, {settings.issueDate}</p>
              </div>
            </div>

            {/* Addressed Company */}
            <div className="pt-4 font-sans space-y-1">
              <p>Kepada Yth.</p>
              <p className="font-extrabold text-slate-900">{linkedCompany ? linkedCompany.contactPerson : "HR Manager / Pimpinan Industri"}</p>
              <p className="font-bold text-slate-800">{linkedCompany ? linkedCompany.name : "Unassigned / Perusahaan Mandiri DKV"}</p>
              <p className="text-slate-600 italic text-[11px] max-w-sm">{linkedCompany ? linkedCompany.address : "Alamat Perusahaan"}</p>
            </div>

            {/* Salutation & Body */}
            <div className="space-y-3 font-sans text-slate-850 text-justify text-[12px] leading-relaxed pt-2">
              <p>Dengan hormat,</p>
              <p>
                Sehubungan dengan program kurikulum Sekolah Menengah Kejuruan (SMK) berbasis industri, kami di <strong>SMK Negeri 1 Teluknaga</strong> membekali siswa dengan kompetensi keahlian unggul yang siap kerja. Salah satu kegiatan wajib yang harus ditempuh siswa kelas XII Semester Ganjil adalah <strong>Praktek Kerja Lapangan (PKL)</strong> selama kurun waktu yang disepakati.
              </p>
              <p>
                Untuk itu, kami memohon kesediaan instansi/perusahaan yang Bapak/Ibu pimpin kiranya dapat menerima siswa terbaik kami dari program keahlian <strong>Desain Komunikasi Visual (DKV)</strong> untuk melaksanakan magang/PKL. Adapun rincian data siswa bersangkutan adalah sebagai berikut:
              </p>

              {/* Table student */}
              <div className="py-2">
                <table className="w-full border-collapse border border-slate-300 font-sans text-xs">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border border-slate-300 px-3 py-1.5 font-bold text-left">Nama Siswa</th>
                      <th className="border border-slate-300 px-3 py-1.5 font-bold text-left">NIS</th>
                      <th className="border border-slate-300 px-3 py-1.5 font-bold text-left">Kelas/Jurusan</th>
                      <th className="border border-slate-300 px-3 py-1.5 font-bold text-left">Fokus Keahlian DKV</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900">{activeStudent.name}</td>
                      <td className="border border-slate-300 px-3 py-2 font-mono text-slate-700">{activeStudent.nis}</td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-800">{activeStudent.className} / DKV</td>
                      <td className="border border-slate-300 px-3 py-2 text-slate-700">{activeStudent.skills.slice(0, 3).join(", ")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Pelaksanaan PKL ini diniatkan agar siswa kami mampu mengaplikasikan ilmu desain digital secara riil, menyerap mental kerja profesional, dan membantu operasional kreatif divisi yang Bapak/Ibu pimpin. Segala tindak evaluasi, lembar logbook kegiatan bulanan, dan asuransi kedisiplinan sepenuhnya dikoordinasikan di bawah pengawasan guru pendamping DKV KCD Kabupaten Tangerang.
              </p>
              <p>
                Besar harapan kami agar permohonan ini dikabulkan. Atas perhatian, kerjasamanya yang harmonis antara pihak sekolah dan industri kreatif, kami haturkan terima kasih.
              </p>
            </div>

            {/* Signatures */}
            <div className="pt-8 flex justify-end font-sans">
              <div className="text-center w-56 space-y-12">
                <div>
                  <p className="text-[11px] text-slate-500">Hormat kami,</p>
                  <p className="font-bold text-[12px]">An. Kepala Sekolah</p>
                  <p className="font-bold text-[11px] text-slate-700 uppercase tracking-wide">
                    {isSignHubin ? "Koordinator Hubinmas" : "Kepala Dept. DKV"}
                  </p>
                </div>
                <div className="pt-2">
                  <p className="font-bold text-[12px] underline text-slate-900">
                    {isSignHubin ? settings.headOfHubin : settings.headOfDepartment}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    NIP. {isSignHubin ? settings.headOfHubinNIP : settings.headOfDepartmentNIP}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LETTER 2: BIODATA SISWA */}
        {activeLetterType === "BIODATA" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-sans font-extrabold text-base uppercase text-slate-900 underline tracking-wide">Biodata Peserta Praktek Kerja Lapangan (PKL)</h3>
              <p className="font-sans text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Kompetensi Keahlian Desain Komunikasi Visual (DKV)</p>
            </div>

            <div className="pt-6 font-sans space-y-4 text-slate-800">
              <h4 className="font-bold border-b border-indigo-200 pb-1 text-slate-900 text-xs uppercase tracking-wider">A. Identitas Pribadi Siswa</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 w-44 font-semibold text-slate-600">1. Nama Lengkap</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 font-bold text-slate-900 text-sm uppercase">{activeStudent.name}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">2. Nomor Induk Siswa (NIS)</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 font-mono text-slate-850">{activeStudent.nis}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">3. Kompetensi Keahlian</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 text-slate-700">Desain Komunikasi Visual (DKV) - {activeStudent.className}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">4. Tempat, Tanggal Lahir</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 text-slate-700">{activeStudent.birthPlaceDate || 'Tangerang, 10 Juni 2008'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">5. Alamat Tinggal Rumah</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 text-slate-700 leading-relaxed">{activeStudent.studentAddress || 'Kecamatan Teluknaga, Tangerang'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">6. Nomor HP WhatsApp</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{activeStudent.phone}</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold border-b border-indigo-200 pb-1 text-slate-900 text-xs uppercase tracking-wider pt-3">B. Profil Keahlian & Portofolio Karya</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 w-44 font-semibold text-slate-600">1. Link Portofolio Digital</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 font-semibold text-indigo-700 underline break-all">{activeStudent.portfolioUrl}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">2. Karya Unggulan/Projek</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 text-slate-700 italic">"{activeStudent.portfolioHighlight}"</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">3. Penguasaan Software & Tools</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3">
                      <span className="text-slate-800 font-semibold">{activeStudent.skills.join(", ")}</span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold border-b border-indigo-200 pb-1 text-slate-900 text-xs uppercase tracking-wider pt-3">C. Identitas Orang Tua / Wali</h4>
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 w-44 font-semibold text-slate-600">1. Nama Orang Tua/Wali</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 font-bold text-slate-850">{activeStudent.parentName || 'Hendra Saputra'}</td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-2 px-3 font-semibold text-slate-600">2. Pekerjaan Orang Tua</td>
                    <td className="py-2 px-2">:</td>
                    <td className="py-2 px-3 text-slate-700">{activeStudent.parentOccupation || 'Karyawan'}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-10 grid grid-cols-2 gap-4 font-sans text-xs">
              <div className="text-center space-y-12">
                <div>
                  <p className="text-[11px] text-slate-500">Siswa PKL Peserta,</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold underline text-slate-900">{activeStudent.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIS. {activeStudent.nis}</p>
                </div>
              </div>

              <div className="text-center space-y-12">
                <div>
                  <p className="text-[11px] text-slate-500">Kepala Dept. DKV SMKN 1 Teluknaga,</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold underline text-slate-900">{settings.headOfDepartment}</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIP. {settings.headOfDepartmentNIP}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LETTER 3: SURAT PERNYATAAN BYOD (BRING YOUR OWN DEVICE) */}
        {activeLetterType === "BYOD" && (
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h3 className="font-sans font-extrabold text-base uppercase text-slate-900 underline tracking-wide">Surat Pernyataan Persetujuan BYOD (Membawa Laptop Mandiri)</h3>
              <p className="font-sans text-[11px] text-slate-500 uppercase tracking-widest font-semibold">Tahun Pelajaran {settings.schoolYear}</p>
            </div>

            <div className="space-y-3 font-sans text-[12px] text-slate-800 leading-relaxed pt-5 text-justify">
              <p>Saya yang bertanda tangan di bawah ini:</p>
              
              {/* Parent table details */}
              <div className="pl-6">
                <table className="text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1 w-44 font-semibold text-slate-605">Nama Orang Tua / Wali</td>
                      <td className="py-1 px-2">:</td>
                      <td className="py-1 font-bold text-slate-900 uppercase">{activeStudent.parentName || 'Hendra Saputra'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-650">Pekerjaan Utama</td>
                      <td className="py-1 px-2">:</td>
                      <td className="py-1 text-slate-700">{activeStudent.parentOccupation || 'Karyawan'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-650">Alamat Lengkap Rumah</td>
                      <td className="py-1 px-2">:</td>
                      <td className="py-1 text-slate-700">{activeStudent.studentAddress || 'Teluknaga, Tangerang'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>Adalah benar sebagai Orang Tua / Wali sah dari peserta didik kami:</p>

              {/* Student table details */}
              <div className="pl-6">
                <table className="text-xs">
                  <tbody>
                    <tr>
                      <td className="py-1 w-44 font-semibold text-slate-605">Nama Lengkap Siswa</td>
                      <td className="py-1 px-2">:</td>
                      <td className="py-1 font-bold text-slate-900 uppercase">{activeStudent.name}</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-semibold text-slate-650">NIS / Kelas</td>
                      <td className="py-1 px-2">:</td>
                      <td className="py-1 font-mono text-slate-800">{activeStudent.nis} / {activeStudent.className} (DKV)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Mengingat spesialisasi kompetensi <strong>Desain Komunikasi Visual (DKV)</strong> membutuhkan efisiensi alat penunjang desain grafis (laptop/tablet grafis) yang dinamis guna menunjang produktivitas pengerjaan tugas kreatif yang ditugaskan oleh industri penempatan, dengan ini saya menyatakan <strong>SANGAT MENYETUJUI</strong> anak kami untuk mengamalkan prosedur <strong>Bring Your Own Device (BYOD)</strong> dengan membawa laptop pribadi milik yang bersangkutan selama berada di tempat PKL: <strong className="text-slate-900">{linkedCompany ? linkedCompany.name : "Perusahaan Penempatan Kreatif"}</strong>.
              </p>

              <p>
                Siswa bersangkutan bertanggung jawab penuh atas pemeliharaan lisensi perangkat lunak penunjang serta keamanan fisik perangkat selama jam kerja berlangsung. Pihak sekolah membimbing tata tertib etika kejuruan untuk menghindari kebocoran hak cipta intelektual milik industri.
              </p>

              <p> Demikian surat pernyataan persetujuan ini dibuat dengan penuh kesadaran dan tanpa paksaan dari pihak manapun untuk dipergunakan sebagaimana mestinya.</p>
            </div>

            {/* Signatures */}
            <div className="pt-12 grid grid-cols-2 gap-4 font-sans text-xs">
              <div className="text-center space-y-12">
                <div>
                  <p className="text-[11px] text-slate-500">Meyetujui,</p>
                  <p className="font-bold">Orang Tua / Wali Murid</p>
                </div>
                <div className="pt-2">
                  {/* Materai placeholder */}
                  <div className="inline-block border border-dashed border-slate-350 px-3 py-1 font-mono text-[9px] text-slate-400 rotate-3 tracking-widest uppercase mb-1">
                    Materai 10000
                  </div>
                  <p className="font-bold underline text-slate-900 uppercase">{activeStudent.parentName || 'Hendra Saputra'}</p>
                </div>
              </div>

              <div className="text-center space-y-12">
                <div>
                  <p className="text-[11px] text-slate-500">Mengetahui,</p>
                  <p className="font-bold">Kepala Dept. DKV</p>
                </div>
                <div className="pt-2">
                  <p className="font-bold underline text-slate-900">{settings.headOfDepartment}</p>
                  <p className="text-[10px] text-slate-500 font-mono">NIP. {settings.headOfDepartmentNIP}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LETTER 4: AUTOMATED PKL CERTIFICATE PREVIEW */}
        {activeLetterType === "CERTIFICATE" && (
          <div className="absolute inset-4 border-8 border-double border-indigo-950/20 rounded relative h-[calc(100%-8px)] flex flex-col justify-between p-6">
            {/* Elegant Inner Filigree Border */}
            <div className="absolute inset-1 border border-amber-500/25 pointer-events-none" />
            
            {/* Decorative Gold Corners */}
            <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-amber-500/60 pointer-events-none" />
            <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-amber-500/60 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-amber-500/60 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-amber-500/60 pointer-events-none" />

            {/* Certificate Header */}
            <div className="text-center space-y-1 font-sans">
              <div className="flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
                <span>Dinas Pendidikan Provinsi Banten</span>
                <span className="text-slate-300">•</span>
                <span>SMK Negeri 14 Kabupaten Tangerang</span>
              </div>
              
              <h2 className="font-serif font-black text-[22px] text-indigo-950 tracking-wide mt-2 leading-none uppercase">
                Sertifikat Praktek Kerja Lapangan
              </h2>
              <p className="text-[10px] font-mono font-bold text-amber-700 tracking-widest uppercase mt-0.5 leading-none">
                NOMOR REKAS: SERT/DKV/{settings.schoolYear.replace("/", "-")}/{activeStudent.nis.slice(-5) || "001"}
              </p>
            </div>

            {/* Recipient details */}
            <div className="text-center space-y-2 pt-2">
              <p className="text-slate-500 italic text-[11px] font-sans leading-none">Dengan bangga menganugerahkan sertifikat ini kepada:</p>
              
              <div className="py-2.5">
                <h3 className="font-serif font-extrabold text-[24px] text-amber-800 leading-none underline tracking-wide uppercase px-8 inline-block">
                  {activeStudent.name}
                </h3>
                <p className="text-[10.5px] font-mono font-bold text-slate-700 mt-2 leading-none">
                  NIS: <span className="font-sans font-medium text-slate-650">{activeStudent.nis}</span> • Kelas: <span className="font-sans font-medium text-slate-650">{activeStudent.className} / {settings.schoolYear}</span>
                </p>
              </div>

              <div className="max-w-xl mx-auto text-[11px] font-sans text-slate-700 leading-relaxed text-center px-4">
                Telah dengan luar biasa menyelesaikan Praktek Kerja Lapangan (PKL) secara produktif, berintegritas, dan mematuhi etika industri kreatif selama kurun waktu PKL terdaftar pada institusi kerja mitra:
                <p className="font-bold text-indigo-950 text-xs mt-1.5 uppercase leading-none">
                  {linkedCompany ? linkedCompany.name : "Unassigned / Perusahaan Mandiri DKV"}
                </p>
                <p className="text-[10px] text-slate-500 max-w-md mx-auto italic leading-tight mt-0.5 truncate">
                  {linkedCompany ? linkedCompany.address : "Alamat Industri Mitra Kreatif DKV"}
                </p>
              </div>
            </div>

            {/* Competency assessment panel & Grade */}
            <div className="grid grid-cols-12 gap-4 items-center bg-slate-50 border border-slate-205/60 p-3 rounded-lg mx-3 font-sans mt-2">
              
              {/* Left Score Card */}
              <div className="col-span-4 border-r border-slate-202 text-center pr-2 space-y-1">
                <span className="text-[9px] font-black text-slate-404 tracking-wider uppercase block">Predikat Capaian PKL</span>
                <span className={`text-[12px] uppercase select-none tracking-wide text-center leading-none ${finalScore >= 83 ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-bold'}`}>
                  {gradeTitle}
                </span>
                <div className="text-[10.5px] text-slate-505 mt-1 font-mono">
                  Skor Kumulatif: <strong className="text-slate-800">{finalScore} / 100</strong>
                </div>
              </div>

              {/* Right Achievements Area */}
              <div className="col-span-8 pl-1">
                <span className="text-[9px] font-black text-slate-404 tracking-wider uppercase block mb-1.5">Fokus Kompetensi Kejuruan Terakreditasi DKV</span>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-705 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-505 shrink-0" />
                    <span className="truncate text-left" title={activeStudent.skills.slice(0, 2).join(", ")}>Desain Grafis / Brand Identity</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-505 shrink-0" />
                    <span className="truncate text-left">Slicing & UI/UX Wireframing</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-505 shrink-0" />
                    <span className="truncate text-left">Editing Video, Audio & Motion</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-505 shrink-0" />
                    <span className="truncate text-left">Ilustrasi & Storyboard Kreatif</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Stamp decoration */}
            <div className="absolute bottom-[20mm] left-[45%] -translate-x-1/2 -rotate-3 w-22 h-22 rounded-full border-4 border-double border-indigo-600/30 bg-indigo-500/5 flex flex-col items-center justify-center text-center font-sans tracking-tight z-10 p-1 pointer-events-none select-none">
              <div className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none font-bold">SMK NEGERI 14</div>
              <div className="text-[8px] font-black text-indigo-601 my-0.5 uppercase leading-none font-extrabold tracking-wide">KOMPETEN</div>
              <div className="text-[6.5px] font-bold text-indigo-501/80 uppercase leading-none">DKV JURUSAN</div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 font-sans mt-3 px-6 text-xs">
              <div className="text-center space-y-12">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-500">Mengesahkan,</p>
                  <p className="font-bold text-[11px] text-slate-800">Pimpinan Industri Mitra PKL</p>
                  <p className="text-[9.5px] text-slate-500 tracking-wide font-mono uppercase truncate max-w-[200px]">{linkedCompany ? linkedCompany.name : "Pembimbing Kerja Industri"}</p>
                </div>
                <div>
                  <p className="font-bold text-[11.5px] underline text-indigo-950 uppercase">{linkedCompany ? linkedCompany.contactPerson : "DUDI Supervisor / HRD"}</p>
                  <p className="text-[9.5px] text-slate-400 font-mono tracking-tight leading-none mt-0.5">Penilai Kinerja Lapangan</p>
                </div>
              </div>

              <div className="text-center space-y-12">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-slate-500">Tangerang, {settings.issueDate}</p>
                  <p className="font-bold text-[11px] text-slate-800 font-sans">Kepala Dept. DKV SMKN 14</p>
                  <p className="text-[9.5px] text-slate-500 tracking-wide font-mono uppercase truncate max-w-[200px]">SMK Negeri 14 Kab. Tangerang</p>
                </div>
                <div>
                  <p className="font-bold text-[11.5px] underline text-indigo-950 uppercase">{settings.headOfDepartment}</p>
                  <p className="text-[9.5px] text-slate-400 font-mono tracking-tight leading-none mt-0.5">NIP. {settings.headOfDepartmentNIP}</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6" id="letters-tab">
      
      {/* Configuration controls block (no-webprint) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
        
        {/* Left Control Column */}
        <div className="glass-panel rounded-2xl shadow-xl p-5 space-y-4 lg:col-span-1 border border-white/10">
          <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400" />
            Setelan Cetak Surat
          </h3>

          {/* Student Selector */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-white/70">Pilih Siswa DKV</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full glass-input rounded-lg p-2.5 cursor-pointer outline-none font-medium bg-[#10101d]"
            >
              {students.map(s => (
                <option key={s.id} value={s.id} className="bg-[#10101d]">
                  {s.className} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Letter Template Categories */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-white/70 block">Pilih Kategori Dokumen</label>
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => setActiveLetterType("PENGANTAR")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  activeLetterType === "PENGANTAR" 
                    ? "bg-blue-600 border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-white/5 hover:bg-white/10 text-white/75 border-white/10"
                }`}
              >
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                Surat Pengantar PKL
              </button>

              <button
                onClick={() => setActiveLetterType("BIODATA")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  activeLetterType === "BIODATA" 
                    ? "bg-blue-600 border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-white/5 hover:bg-white/10 text-white/75 border-white/10"
                }`}
              >
                <User className="w-4 h-4 text-blue-400 flex-shrink-0" />
                Biodata Lengkap Siswa
              </button>

              <button
                onClick={() => setActiveLetterType("BYOD")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  activeLetterType === "BYOD" 
                    ? "bg-blue-600 border-blue-500/30 text-white shadow-lg shadow-blue-500/20" 
                    : "bg-white/5 hover:bg-white/10 text-white/75 border-white/10"
                }`}
              >
                <Monitor className="w-4 h-4 text-blue-400 flex-shrink-0" />
                Surat Pernyataan BYOD
              </button>

              <button
                onClick={() => setActiveLetterType("CERTIFICATE")}
                className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                  activeLetterType === "CERTIFICATE" 
                    ? "bg-purple-600 border-purple-500/30 text-white shadow-lg shadow-purple-500/20" 
                    : "bg-white/5 hover:bg-white/10 text-white/75 border-white/10"
                }`}
              >
                <Award className="w-4 h-4 text-purple-400 flex-shrink-0" />
                Pratinjau Sertifikat PKL
              </button>
            </div>
          </div>

          {/* Quick margin, lines and actions */}
          <div className="pt-3 border-t border-white/10 space-y-3.5 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-white/70">Nomor Berkas Surat (Urutan)</label>
              <input 
                type="text" 
                maxLength={3}
                value={customLetterNum}
                onChange={(e) => setCustomLetterNum(e.target.value.replace(/\D/g, ""))}
                placeholder="021"
                className="w-full glass-input rounded-lg p-2 outline-none font-mono text-center font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-white/70">Tanggal Surat</label>
              <input 
                type="text"
                value={settings.issueDate}
                onChange={(e) => onUpdateSettings({ issueDate: e.target.value })}
                className="w-full glass-input rounded-lg p-2 outline-none"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">
              <span className="font-semibold text-[10.5px]">Koordinator Hubinmas</span>
              <input 
                type="checkbox" 
                checked={isSignHubin}
                onChange={(e) => setIsSignHubin(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer accent-blue-600"
              />
            </div>

            <div className="flex items-center justify-between p-2.5 rounded bg-white/5 border border-white/10 text-xs text-white/80">
              <span className="font-semibold text-[10.5px]">Garis Panduan Margin</span>
              <input 
                type="checkbox" 
                checked={showMarginGuides}
                onChange={(e) => setShowMarginGuides(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer accent-blue-600"
              />
            </div>

            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/10 border border-blue-500/20 cursor-pointer transition-all hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <Eye className="w-4 h-4" />
                Buka Pratinjau Cetak
              </button>

              <button
                onClick={triggerPrint}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/5 border border-emerald-500/10 cursor-pointer transition-all hover:-translate-y-0.2"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Langsung (PDF)
              </button>
            </div>

            {/* Google Drive Integration Panel */}
            <div className="pt-2">
              <GoogleDriveSync
                activeStudent={activeStudent}
                companies={companies}
                settings={settings}
                activeLetterType={activeLetterType}
                logbooks={logbooks}
              />
            </div>
          </div>
        </div>

        {/* Right Printable Document Mockup Area */}
        <div className="lg:col-span-3 bg-[#0a0a0f]/40 backdrop-blur-md p-2 sm:p-6 rounded-2xl border border-white/10 relative flex justify-center overflow-x-auto min-h-[90vh]">
          {renderPrintableDocument(false)}
        </div>

      </div>

      {/* ==================== PRINT PREVIEW MODAL ==================== */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 md:p-4 text-white font-sans animate-fade-in no-print">
          <div className="bg-[#0c0c14] border border-white/10 rounded-2xl w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900/90 to-indigo-950/50 px-6 py-4.5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-sm tracking-wide text-white flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-400" />
                  Pratinjau Cetak & Kustomisasi Margin
                </h3>
                <p className="text-white/60 text-[10.5px] mt-0.5 font-medium">
                  Sesuaikan margin halaman, ukuran font, dan visualisasi tata ruang kertas A4 sebelum cetak.
                </p>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="bg-white/5 border border-white/10 hover:bg-white/15 p-2 rounded-full text-white/70 hover:text-white transition duration-150 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content Structure */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              {/* Left Control Panel inside Modal */}
              <div className="w-full md:w-80 p-5 space-y-5 overflow-y-auto bg-slate-950/40 select-none scrollbar-thin">
                
                {/* Visual Preset Choices */}
                <div className="space-y-2">
                  <label className="text-[10.5px] uppercase font-bold tracking-widest text-[#93c5fd] font-sans block">
                    Preset Margin Cepat
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button 
                      onClick={() => applyPreset("NORMAL")}
                      className={`py-2 px-1.5 rounded-lg border text-[10.5px] font-bold text-center cursor-pointer transition ${
                        marginTop === 20 && marginLeft === 15 
                          ? "bg-blue-600 border-blue-500 text-white" 
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Standar
                      <span className="block text-[8px] opacity-60 font-mono font-normal">20/20/15/15</span>
                    </button>
                    <button 
                      onClick={() => applyPreset("NARROW")}
                      className={`py-2 px-1.5 rounded-lg border text-[10.5px] font-bold text-center cursor-pointer transition ${
                        marginTop === 12 && marginLeft === 10 
                          ? "bg-blue-600 border-blue-500 text-white" 
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Sempit
                      <span className="block text-[8px] opacity-60 font-mono font-normal">12/12/10/10</span>
                    </button>
                    <button 
                      onClick={() => applyPreset("WIDE")}
                      className={`py-2 px-1.5 rounded-lg border text-[10.5px] font-bold text-center cursor-pointer transition ${
                        marginTop === 28 && marginLeft === 22 
                          ? "bg-blue-600 border-blue-500 text-white" 
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}
                    >
                      Lebar
                      <span className="block text-[8px] opacity-60 font-mono font-normal">28/28/22/22</span>
                    </button>
                  </div>
                </div>

                {/* Range Sliders Controls */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#93c5fd] font-sans block">
                    Penyesuaian Detail Margin (mm)
                  </span>

                  {/* Margin Top */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/80 font-medium">
                      <span>Margin Atas (Top)</span>
                      <span className="font-mono text-blue-400 font-bold">{marginTop} mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setMarginTop(prev => Math.max(5, prev - 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        -
                      </button>
                      <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        value={marginTop}
                        onChange={(e) => setMarginTop(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1 rounded bg-slate-800"
                      />
                      <button 
                        onClick={() => setMarginTop(prev => Math.min(50, prev + 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Margin Bottom */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/80 font-medium">
                      <span>Margin Bawah (Bottom)</span>
                      <span className="font-mono text-blue-400 font-bold">{marginBottom} mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setMarginBottom(prev => Math.max(5, prev - 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        -
                      </button>
                      <input 
                        type="range" 
                        min="5" 
                        max="50" 
                        value={marginBottom}
                        onChange={(e) => setMarginBottom(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1 rounded bg-slate-800"
                      />
                      <button 
                        onClick={() => setMarginBottom(prev => Math.min(50, prev + 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Margin Left */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/80 font-medium">
                      <span>Margin Kiri (Left)</span>
                      <span className="font-mono text-blue-400 font-bold">{marginLeft} mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setMarginLeft(prev => Math.max(5, prev - 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        -
                      </button>
                      <input 
                        type="range" 
                        min="5" 
                        max="40" 
                        value={marginLeft}
                        onChange={(e) => setMarginLeft(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1 rounded bg-slate-800"
                      />
                      <button 
                        onClick={() => setMarginLeft(prev => Math.min(40, prev + 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Margin Right */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-white/80 font-medium">
                      <span>Margin Kanan (Right)</span>
                      <span className="font-mono text-blue-400 font-bold">{marginRight} mm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setMarginRight(prev => Math.max(5, prev - 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        -
                      </button>
                      <input 
                        type="range" 
                        min="5" 
                        max="40" 
                        value={marginRight}
                        onChange={(e) => setMarginRight(Number(e.target.value))}
                        className="flex-1 accent-blue-500 h-1 rounded bg-slate-800"
                      />
                      <button 
                        onClick={() => setMarginRight(prev => Math.min(40, prev + 1))}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 w-7 h-7 text-xs font-extrabold rounded flex items-center justify-center transition active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Font typography overrides */}
                <div className="space-y-2.5 pt-3 border-t border-white/5">
                  <span className="text-[10.5px] uppercase font-bold tracking-widest text-[#93c5fd] tracking-widest font-sans flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-blue-400" />
                    Skala Huruf Dokumen (Font)
                  </span>
                  <div className="flex items-center gap-1 bg-[#121221] border border-white/10 p-1 rounded-lg">
                    {[10, 11, 12, 13, 14].map(size => (
                      <button
                        key={size}
                        onClick={() => setFontSizePt(size)}
                        className={`flex-1 font-bold text-xs py-1.5 rounded transition ${
                          fontSizePt === size 
                            ? "bg-blue-600 text-white" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {size}pt
                      </button>
                    ))}
                  </div>
                </div>

                {/* Guidelines checkboxes */}
                <div className="pt-3 border-t border-white/5 space-y-3 font-sans">
                  <div className="flex items-center justify-between p-2 rounded bg-[#10101d] border border-white/5 text-xs text-white/85">
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      <span>Batas Margin Virtual</span>
                    </div>
                    <input 
                      type="checkbox" 
                      className="h-4 w-4 rounded accent-blue-600 cursor-pointer"
                      checked={showMarginGuides}
                      onChange={(e) => setShowMarginGuides(e.target.checked)}
                    />
                  </div>
                </div>

                {/* Quick info panel */}
                <div className="bg-slate-900/50 p-3.5 rounded-xl border border-white/5 space-y-2 leading-relaxed">
                  <span className="text-[9px] uppercase font-bold text-[#fbcfe8] tracking-widest flex items-center gap-1">
                    <Info className="w-3 h-3 text-pink-300" />
                    Format Keluaran Resmi:
                  </span>
                  <ul className="text-[10.5px] text-white/50 space-y-1 font-sans">
                    <li>• Ukuran Kertas: <strong className="text-white/70">A4 (Portrait)</strong></li>
                    <li>• Lebar Fisik: <strong className="text-white/70">210 x 297 mm</strong></li>
                    <li>• Tata letak disesuaikan dengan standar Dinas Pendidikan Provinsi Banten.</li>
                  </ul>
                </div>

                {/* Print confirmation */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      triggerPrint();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 border border-emerald-500/30 cursor-pointer transition active:scale-95 duration-100"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Lembar Surat
                  </button>
                </div>

              </div>

              {/* Right Paper Canvas area with visual Scale fitting */}
              <div className="flex-1 bg-slate-950/70 p-4 md:p-6 flex flex-col items-center justify-start overflow-auto h-full scrollbar-thin relative select-text">
                
                {/* Scale buttons widget floating */}
                <div className="sticky top-2 z-[60] bg-[#12121f]/95 border border-white/10 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-md mb-6 font-sans select-none">
                  <button 
                    onClick={() => setZoomPercent(prev => Math.max(40, prev - 10))}
                    className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-full transition cursor-pointer"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-white/80 font-mono text-xs font-bold min-w-[36px] text-center">{zoomPercent}%</span>
                  <button 
                    onClick={() => setZoomPercent(prev => Math.min(130, prev + 10))}
                    className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-full transition cursor-pointer"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="h-4 w-px bg-white/10"></div>
                  <button 
                    onClick={() => setZoomPercent(60)}
                    className={`text-[9.5px] uppercase font-bold tracking-wider px-2 py-1 rounded transition cursor-pointer ${zoomPercent === 60 ? 'bg-blue-600 text-white font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                  >
                    Kecil
                  </button>
                  <button 
                    onClick={() => setZoomPercent(75)}
                    className={`text-[9.5px] uppercase font-bold tracking-wider px-2 py-1 rounded transition cursor-pointer ${zoomPercent === 75 ? 'bg-blue-600 text-white font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                  >
                    Sedang
                  </button>
                  <button 
                    onClick={() => setZoomPercent(100)}
                    className={`text-[9.5px] uppercase font-bold tracking-wider px-2 py-1 rounded transition cursor-pointer ${zoomPercent === 100 ? 'bg-blue-600 text-white font-black' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                  >
                    100%
                  </button>
                </div>

                {/* Sized container mapping back to correct scroll bounding boxes */}
                <div 
                  className="flex-shrink-0 transition-all duration-150 origin-top flex justify-center mb-16 shadow-2xl rounded"
                  style={{ 
                    width: `${(isLandscape ? 297 : 210) * (zoomPercent / 100)}mm`, 
                    height: `${(isLandscape ? 210 : 297) * (zoomPercent / 100)}mm`,
                    overflow: "hidden" 
                  }}
                >
                  <div 
                    style={{ 
                      transform: `scale(${zoomPercent / 100})`, 
                      transformOrigin: "top left",
                      width: isLandscape ? "297mm" : "210mm",
                      height: isLandscape ? "210mm" : "297mm"
                    }}
                    className="flex-shrink-0"
                  >
                    {renderPrintableDocument(true)}
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
