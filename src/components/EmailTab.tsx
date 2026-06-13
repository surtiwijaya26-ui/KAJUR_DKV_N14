import React, { useState } from "react";
import { Student, Company, EmailHistory, AppSettings } from "../types";
import { 
  Send, 
  Sparkles, 
  History, 
  UserCheck, 
  Building, 
  Loader2, 
  CheckCircle2, 
  Mail, 
  FileCheck,
  AlertOctagon,
  CornerDownRight,
  Settings,
  Paperclip,
  Eye,
  FileText,
  Maximize2,
  Check,
  X
} from "lucide-react";

interface EmailTabProps {
  students: Student[];
  companies: Company[];
  emailHistory: EmailHistory[];
  onSendEmailSimulate: (historyItem: Omit<EmailHistory, "id" | "sentAt">) => void;
  settings: AppSettings;
}

export default function EmailTab({
  students,
  companies,
  emailHistory,
  onSendEmailSimulate,
  settings
}: EmailTabProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || "");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [generationSource, setGenerationSource] = useState("");

  const templatesList = settings.draftTemplates || [];
  const [activeTemplateId, setActiveTemplateId] = useState<string>(() => {
    return settings.activeDraftTemplateId || (templatesList[0]?.id) || "tmpl-standar";
  });

  const activeStudent = students.find(s => s.id === selectedStudentId);
  const targetCompany = activeStudent ? companies.find(c => c.id === activeStudent.companyId) : null;

  const [activeAttachmentTab, setActiveAttachmentTab] = useState<"pengantar" | "biodata" | "byod">("pengantar");
  const [isAttachmentApproved, setIsAttachmentApproved] = useState(true);
  const [isPdfZoomed, setIsPdfZoomed] = useState(false);

  // Let Gemini create the tailored email
  const generateEmailDraftWithAI = async () => {
    if (!activeStudent || !targetCompany) return;
    setIsGenerating(true);
    setSendSuccess(false);

    try {
      const response = await fetch("/api/gemini/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: activeStudent.name,
          studentSkills: activeStudent.skills.join(", "),
          studentPortfolio: `${activeStudent.portfolioUrl} (${activeStudent.portfolioHighlight})`,
          companyName: targetCompany.name,
          companyIndustry: targetCompany.industry,
          customMessage: customNotes
        }),
      });

      const data = await response.json();
      if (data.subject && data.body) {
        setEmailSubject(data.subject);
        setEmailBody(data.body);
        setGenerationSource(data.mode || "Gemini AI");
      }
    } catch (err) {
      console.error("AI formulation failed", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate draft based on custom settings text templates
  const generateEmailWithCustomTemplate = () => {
    if (!activeStudent || !targetCompany) return;
    setSendSuccess(false);

    // Find the chosen template from the settings list
    const chosenTemplate = (settings.draftTemplates || []).find(t => t.id === activeTemplateId);

    const subjectTmpl = chosenTemplate?.subject || settings.emailSubjectTemplate || "Permohonan Praktek Kerja Lapangan (PKL) DKV - {{STUDENT_NAME}} - {{COMPANY_NAME}}";
    const bodyTmpl = chosenTemplate?.body || settings.emailBodyTemplate || `Kepada Yth. Bapak/Ibu HRD {{COMPANY_NAME}}\n\nDengan hormat,\nSaya {{STUDENT_NAME}} bermaksud mengajukan permohonan PKL...`;

    const skillsStr = activeStudent.skills && activeStudent.skills.length > 0
      ? activeStudent.skills.map(s => `• ${s}`).join("\n") 
      : "- Desain Grafis & Layouting\n- Editing Video & Storyboarding\n- Ilustrasi Digital";

    const portfolioStr = activeStudent.portfolioUrl 
      ? `${activeStudent.portfolioUrl}`
      : "Kumpulan karya desain digital, mockup produk, dan portofolio kreatif.";

    const replacePlaceholders = (text: string) => {
      let result = text;
      // Regex replace for global variables
      result = result.replace(/\{\{STUDENT_NAME\}\}/g, activeStudent.name || "");
      result = result.replace(/\{\{STUDENT_NIS\}\}/g, activeStudent.nis || "");
      result = result.replace(/\{\{STUDENT_CLASS\}\}/g, activeStudent.className || "");
      result = result.replace(/\{\{COMPANY_NAME\}\}/g, targetCompany.name || "");
      result = result.replace(/\{\{COMPANY_INDUSTRY\}\}/g, targetCompany.industry || "");
      result = result.replace(/\{\{STUDENT_SKILLS\}\}/g, skillsStr || "");
      result = result.replace(/\{\{STUDENT_PORTFOLIO\}\}/g, portfolioStr || "");
      result = result.replace(/\{\{PORTFOLIO_HIGHLIGHT\}\}/g, activeStudent.portfolioHighlight || "");
      result = result.replace(/\{\{CUSTOM_NOTES\}\}/g, customNotes ? `Catatan Khusus Guru:\n"${customNotes}"` : "");
      result = result.replace(/\{\{HEAD_OF_DEPARTMENT\}\}/g, settings.headOfDepartment || "");
      result = result.replace(/\{\{SCHOOL_EMAIL\}\}/g, settings.schoolEmail || "");
      return result;
    };

    const parsedSubject = replacePlaceholders(subjectTmpl);
    const parsedBody = replacePlaceholders(bodyTmpl);

    setEmailSubject(parsedSubject);
    setEmailBody(parsedBody);
    setGenerationSource(chosenTemplate ? `Skenario: ${chosenTemplate.name}` : "Template Kustom (Saved)");
  };

  const handleSendSimulate = () => {
    if (!activeStudent || !targetCompany || !emailSubject || !emailBody) return;
    setIsSending(true);

    setTimeout(() => {
      onSendEmailSimulate({
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        companyName: targetCompany.name,
        hrdEmail: targetCompany.hrdEmail || "hrd@creativecompany.com",
        subject: emailSubject,
        body: emailBody,
        status: "sent"
      });

      setIsSending(false);
      setSendSuccess(true);
      
      // Clear fields
      setEmailSubject("");
      setEmailBody("");
      setCustomNotes("");
    }, 2000);
  };

  return (
    <div className="space-y-6" id="email-tab">
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Email Form Section */}
        <div className="lg:col-span-3 glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-400" />
              Kirim Surat Permohonan ke HRD
            </h3>
            <span className="bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 font-mono text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
              AUTO-SMTP ACTIVE
            </span>
          </div>

          {/* Student Selector */}
          <div className="space-y-1 text-xs">
            <label className="font-semibold text-white/70">Pilih Siswa Lamaran</label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                setSendSuccess(false);
                setEmailSubject("");
                setEmailBody("");
              }}
              className="w-full glass-input rounded-lg p-3 cursor-pointer outline-none font-semibold bg-[#10101d]"
            >
              {students.map(s => (
                <option key={s.id} value={s.id} className="bg-[#10101d]">
                  [{s.status === 'Unassigned' ? 'Belum PKL' : 'Aktif'}] {s.name} - {s.className}
                </option>
              ))}
            </select>
          </div>

          {activeStudent && targetCompany && (
            <div className="space-y-4 pt-1">
              {/* Linked indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-3.5 rounded-lg border border-white/10 text-xs text-white">
                <div className="space-y-0.5">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Tujuan Perusahaan</span>
                  <p className="font-bold text-white flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-white/30" />
                    {targetCompany.name}
                  </p>
                  <p className="text-white/50 text-[10px]">{targetCompany.industry}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">Kontak HRD Email</span>
                  <p className="font-semibold text-blue-400 font-mono">{targetCompany.hrdEmail || "hrd@creative.id"}</p>
                  <p className="text-white/50 text-[10px]">UP: {targetCompany.contactPerson}</p>
                </div>
              </div>

              {/* Custom message note modifier for Gemini */}
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-white/70 block">Pesan khusus dari guru pendamping (misal: "Siswa ini juara LKS / sangat rajin")</label>
                <input 
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Catatan tambahan opsional untuk meracik pembuka dari AI"
                  className="w-full glass-input rounded-lg p-2.5 outline-none"
                />
              </div>

              {/* Skenario Template Selector */}
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-white/70 block">Skenario Penempatan (Draf Template)</label>
                <select
                  value={activeTemplateId}
                  onChange={(e) => {
                    setActiveTemplateId(e.target.value);
                    setSendSuccess(false);
                  }}
                  className="w-full bg-[#10101d] border border-white/10 text-white rounded-lg p-2.5 cursor-pointer outline-none font-semibold focus:border-indigo-500"
                >
                  {templatesList.length === 0 ? (
                    <option value="tmpl-standar" className="bg-[#10101d]">Permohonan PKL Standar</option>
                  ) : (
                    templatesList.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#10101d]">
                        {t.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Draft tools */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="drafting-triggers">
                <button
                  type="button"
                  id="generate-gemini-draft-btn"
                  onClick={generateEmailDraftWithAI}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition text-center shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Meramu Email dengan AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
                      Ramu Draft dengan Gemini AI
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="generate-custom-tmpl-btn"
                  onClick={generateEmailWithCustomTemplate}
                  disabled={isGenerating}
                  className="bg-white/5 border border-white/10 hover:border-amber-500/35 hover:bg-amber-550/15 text-white/90 hover:text-amber-300 font-bold text-xs py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  Gunakan Template Kustom
                </button>
              </div>

              {/* Generated Draft Outputs */}
              {(emailSubject || emailBody) && (
                <div className="space-y-4 pt-3 animate-fade-in text-xs">
                  <div className="flex justify-between items-center bg-white/5 px-3 py-1.5 rounded border border-white/10">
                    <span className="text-white/80 font-bold text-[10.5px]">Draft Siap Kirim</span>
                    <span className="text-[9.5px] bg-blue-600/30 text-blue-300 border border-blue-500/20 font-mono px-2 py-0.2 rounded font-bold uppercase">{generationSource}</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-white/70">Subjek Email</label>
                    <input 
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full glass-input text-white font-sans font-bold p-2.5 rounded-lg outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-white/70">Isi Email (Body)</label>
                    <textarea 
                      rows={11}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="w-full glass-input text-white font-sans leading-relaxed p-3.5 rounded-lg outline-none"
                    />
                  </div>

                  {/* Visual Attachment Preview Panel */}
                  <div className="bg-[#0b0b14] border border-white/10 rounded-xl p-4.5 space-y-3" id="pdf-attachment-checker">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-emerald-400 rotate-45" />
                        <div>
                          <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                            Kompilasi Digital Attachment PDF
                            <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-mono px-1.5 py-0.2 rounded font-black border border-emerald-500/20">
                              3 BERKAS GENERATED
                            </span>
                          </h4>
                          <p className="text-[10px] text-white/40">Dihasilkan otomatis berdasarkan profil {activeStudent.name}.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-emerald-300 font-mono font-bold bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 rounded tracking-wide">
                          📄 PDF/A DIGITAL STAMP OK
                        </span>
                      </div>
                    </div>

                    {/* Preview selector tabs */}
                    <div className="flex flex-wrap gap-1 text-[10.5px]">
                      <button
                        type="button"
                        onClick={() => setActiveAttachmentTab("pengantar")}
                        className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1 cursor-pointer transition ${
                          activeAttachmentTab === "pengantar"
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" /> 1. Surat Pengantar Kepala
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setActiveAttachmentTab("biodata")}
                        className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1 cursor-pointer transition ${
                          activeAttachmentTab === "biodata"
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-white/5 border-white/5 text-white/50 hover:bg-white/10"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" /> 2. CV & Portofolio Siswa
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveAttachmentTab("byod")}
                        className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1 cursor-pointer transition ${
                          activeAttachmentTab === "byod"
                            ? "bg-blue-600/20 border-blue-500 text-white"
                            : "bg-white/5 border-white/5 text-white/55 hover:bg-white/10"
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5 text-yellow-500" /> 3. Lembar BYOD & Integritas
                      </button>
                    </div>

                    {/* Mock PDF Viewer Canvas */}
                    <div className="relative border border-white/5 rounded-xl overflow-hidden shadow-inner">
                      {/* Document Toolbar inside Preview */}
                      <div className="bg-[#121221] px-4 py-2 border-b border-white/5 flex items-center justify-between text-[10px] text-white/50 font-mono">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>PDF Reader: PRATINJAU_LAMPIRAN.pdf</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span>Skala: Fit to Sheet (95%)</span>
                          <button
                            type="button"
                            onClick={() => setIsPdfZoomed(true)}
                            className="hover:text-white flex items-center gap-1 text-slate-400 bg-white/5 px-2 py-0.5 rounded transition cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3 text-white" /> Zoom
                          </button>
                        </div>
                      </div>

                      {/* PDF Sheet Backdrop */}
                      <div className="bg-slate-950/40 p-3 flex justify-center overflow-x-auto">
                        <div className="bg-white text-slate-900 border border-slate-350 p-6 sm:p-7 shadow-2xl rounded-sm w-full max-w-[530px] min-h-[460px] max-h-[460px] overflow-y-auto text-left relative font-serif select-text scrollbar-thin">
                          {activeAttachmentTab === "pengantar" && (
                            <div className="space-y-4 text-[10.5px]">
                              {/* Letterhead */}
                              <div className="border-b-2 border-slate-950 pb-2 mb-3 text-center text-slate-900 select-none">
                                <h5 className="text-[10px] font-bold uppercase tracking-wider leading-none">Pemerintah Provinsi Banten</h5>
                                <h5 className="text-[10.5px] font-extrabold uppercase leading-none mt-0.5">Dinas Pendidikan dan Kebudayaan</h5>
                                <h4 className="text-[12px] font-black uppercase text-slate-950 mt-1 leading-none">SMK NEGERI 14 KABUPATEN TANGERANG</h4>
                                <p className="text-[9px] font-bold tracking-wide uppercase text-slate-700 leading-none mt-1">KOMPETENSI KEAHLIAN: DESAIN KOMUNIKASI VISUAL (DKV)</p>
                                <p className="text-[7.5px] text-slate-500 italic font-sans mt-0.5">Jl. Raya Kp Mindi, Budi Mulya, Cikupa, Tangerang, Banten | Web: smkn14kabtangerang.sch.id</p>
                              </div>

                              {/* Document numbers and destinations */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] font-sans">
                                <div className="space-y-0.5">
                                  <p><strong>Nomor:</strong> 421.3 / 214-SMKN14 / DKV / 2026</p>
                                  <p><strong>Lampiran:</strong> 1 (Satu) Berkas Lengkap</p>
                                  <p><strong>Perihal:</strong> Permohonan Praktik Kerja Lapangan (PKL)</p>
                                </div>
                                <div className="text-right space-y-0.5">
                                  <p>Tangerang, 13 Juni 2026</p>
                                  <p><strong>Kepada Yth.</strong></p>
                                  <p className="font-bold underline">{targetCompany?.contactPerson || 'Kepala HRD'}</p>
                                  <p className="font-extrabold">{targetCompany?.name}</p>
                                  <p className="text-slate-500 text-[9px]">{targetCompany?.address || 'Tangerang'}</p>
                                </div>
                              </div>

                              {/* Content */}
                              <div className="space-y-2.5 leading-relaxed text-[10px]">
                                <p>Dengan hormat,</p>
                                <p className="text-justify font-sans">
                                  Pendidikan Sistem Ganda atau Praktik Kerja Lapangan (PKL) merupakan program kurikulum wajib nasional Sekolah Menengah Kejuruan guna melatih mental, keterampilan teknis, serta menanamkan etos kerja profesional sesuai kualifikasi dunia usaha/industri (DUDI).
                                </p>
                                <p className="text-justify font-sans">
                                  Sehubungan dengan hal tersebut di atas, kami dari Kompetensi Keahlian <strong>Desain Komunikasi Visual (DKV) SMK Negeri 14 Kabupaten Tangerang</strong> dengan hormat mengajukan permohonan PKL siswa kami untuk dapat ditempatkan di {targetCompany?.name} dengan rincian identitas sebagai berikut:
                                </p>

                                {/* Mini table details */}
                                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-sans space-y-1 my-2">
                                  <div className="grid grid-cols-3">
                                    <span className="text-slate-500">Nama Siswa:</span>
                                    <span className="col-span-2 font-bold text-slate-800">{activeStudent.name}</span>
                                  </div>
                                  <div className="grid grid-cols-3">
                                    <span className="text-slate-500">NIK / NIS:</span>
                                    <span className="col-span-2 font-mono font-medium">{activeStudent.nis || "32104928A"}</span>
                                  </div>
                                  <div className="grid grid-cols-3">
                                    <span className="text-slate-500">Kelas / Kompetensi:</span>
                                    <span className="col-span-2">{activeStudent.className || "XII DKV 1"}</span>
                                  </div>
                                  <div className="grid grid-cols-3">
                                    <span className="text-slate-500">Keahlian Utama:</span>
                                    <span className="col-span-2 text-[9px] text-indigo-900 bg-indigo-50 px-1.5 py-0.5 rounded font-bold w-fit">
                                      {activeStudent.skills.slice(0, 3).join(", ") || "DKV Suite, Illustrator, Video Editing"}
                                    </span>
                                  </div>
                                </div>

                                <p className="text-justify font-sans">
                                  Pelaksanaan magang ini dijadwalkan berlangsung selama program PKL sekolah dengan ketentuan kepatuhan penuh terhadap tata tertib perusahaan. Terkait rekam unjuk portofolio siswa dapat diakses secara digital. Kami sangat berterima kasih atas dukungan serta kesediaan kerja sama Bapak/Ibu Pimpinan HRD DUDI.
                                </p>
                              </div>

                              {/* Footer Sign */}
                              <div className="pt-4 flex justify-end font-sans">
                                <div className="text-center space-y-1 text-[10px]">
                                  <p>Pilar Vokasi Sekolah,</p>
                                  <p className="font-bold">Kepala Program Studi Kedinasan DKV</p>
                                  {/* Signature simulation */}
                                  <div className="py-2 flex justify-center relative">
                                    <div className="absolute top-1 select-none pointer-events-none opacity-45 border border-emerald-600 rounded-full text-emerald-600 font-bold p-1 text-[8px] rotate-12 scale-90 border-dashed font-sans whitespace-nowrap">
                                      VERIFIED SMKN 14 DKV
                                    </div>
                                    <div className="w-14 h-6 bg-slate-100/10 rounded-lg flex items-center justify-center border border-slate-200">
                                      <span className="font-serif italic text-blue-900 text-xs text-opacity-70">Surti W.</span>
                                    </div>
                                  </div>
                                  <p className="font-bold underline text-slate-900">{settings.headOfDepartment || "SURTI WIJAYA, S.Sn, M.Pd"}</p>
                                  <p className="text-slate-500 text-[8.5px]">NIP. 19820412 201012 2 003</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeAttachmentTab === "biodata" && (
                            <div className="space-y-4 text-[10.5px]">
                              {/* Biodata Resume layout */}
                              <div className="border-b border-indigo-200 pb-2 flex justify-between items-center select-none font-sans">
                                <span className="text-[11px] font-black tracking-wider text-indigo-900 uppercase">LAMPIRAN I: RECON PORTOFOLIO DKV SISWA</span>
                                <span className="text-[8.5px] text-white bg-indigo-650 px-2 py-0.5 rounded font-bold uppercase">PORTFOLIO CV SMART-ATTACH</span>
                              </div>

                              {/* Student Photo and core details */}
                              <div className="grid grid-cols-4 gap-4 pt-2">
                                <div className="col-span-1 flex flex-col items-center justify-start space-y-1">
                                  <div className="w-18 h-22 bg-slate-100 rounded border border-slate-300 flex items-center justify-center p-0.5">
                                    <div className="w-full h-full bg-slate-200 rounded-sm flex items-center justify-center text-slate-400">
                                      <UserCheck className="w-8 h-8 text-neutral-400" />
                                    </div>
                                  </div>
                                  <span className="text-[7.5px] font-mono text-center text-neutral-400 font-bold select-none">[PAS FOTO 3X4]</span>
                                </div>

                                <div className="col-span-3 space-y-1 font-sans text-[10px]">
                                  <h4 className="text-[12px] font-extrabold text-[#111827] leading-tight pr-1">{activeStudent.name}</h4>
                                  <p className="text-slate-500 font-bold">NIS / NISN: <span className="text-slate-800 font-mono font-normal">{activeStudent.nis || '32104928A'}</span></p>
                                  <p className="text-slate-500 font-bold">Tingkat Kelas: <span className="text-slate-800 font-normal">{activeStudent.className || 'XII DKV 1'}</span></p>
                                  <p className="text-slate-500 font-bold">Pilar Keahlian Pokok DKV:</p>
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {activeStudent.skills.map((s, idx) => (
                                      <span key={idx} className="text-[8px] bg-slate-100 text-slate-800 px-1.5 py-0.3 rounded font-semibold border border-slate-200 uppercase font-sans">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Highlights & Behance links */}
                              <div className="space-y-3 pt-3 border-t border-slate-100 font-sans">
                                <div className="space-y-1">
                                  <span className="text-[9.5px] font-black text-indigo-900 uppercase tracking-wide block">Tautan Portofolio Karya Digital</span>
                                  <p className="text-[10px] bg-slate-50 p-2 font-mono text-indigo-650 rounded border border-indigo-100 break-all select-all font-semibold flex items-center gap-1">
                                    <span>🔗</span> {activeStudent.portfolioUrl || 'https://behance.net/portfolio-smkn14'}
                                  </p>
                                </div>

                                <div className="space-y-1 text-slate-800">
                                  <span className="text-[9.5px] font-black text-indigo-900 uppercase tracking-wide block">Fokus Karya Desain Unggulan (Karya Terpilih)</span>
                                  <p className="text-justify font-sans p-2.5 bg-indigo-50/40 rounded border border-indigo-100/50 leading-relaxed text-[10px] italic">
                                    "{activeStudent.portfolioHighlight || 'Komposisi Mockup Publikasi Media Digital, Desain Ilustrasi Vektor, dan Pengerjaan Animasi Video Motion 2D.'}"
                                  </p>
                                </div>

                                <div className="space-y-1 text-slate-800 pt-1">
                                  <span className="text-[9.5px] font-black text-slate-900 uppercase tracking-wide block">Catatan Pendampingan Guru SMK</span>
                                  <p className="text-justify font-serif p-2.5 bg-stone-50 rounded border border-slate-200 leading-relaxed text-[10px]">
                                    {customNotes ? `"${customNotes}"` : "Siswa direkomendasikan secara formal oleh program studi kejuruan karena memiliki kapabilitas teknis yang handal dan disiplin tinggi dalam memproduksi visual desain grafis interaktif."}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeAttachmentTab === "byod" && (
                            <div className="space-y-4 text-[10.5px]">
                              {/* Pakta Integritas / BYOD Consent Sheet */}
                              <div className="border-b border-rose-200 pb-2 flex justify-between items-center select-none font-sans">
                                <span className="text-[11px] font-black tracking-wider text-rose-900 uppercase">LAMPIRAN II: PERNYATAAN KELENGKAPAN BYOD</span>
                                <span className="text-[8.5px] text-white bg-rose-600 px-2 py-0.5 rounded font-bold uppercase">BYOD COMPLIANT & DISCIPLINE AGREEMENT</span>
                              </div>

                              <div className="space-y-3 font-sans text-stone-800 text-justify text-[9.5px] leading-relaxed">
                                <p className="font-bold text-slate-900 uppercase text-[10px] italic">
                                  "KOMITMEN BELAJAR MANDIRI DENGAN MEMBAWA PERANGKAT LAPTOP PRIBADI (BYOD)"
                                </p>
                                <p>
                                  Dalam mematuhi operasional efisien magang pada lingkungan instansi/perusahaan {targetCompany?.name}, saya yang bertandatangan di bawah ini siswa PKL program DKV SMKN 14 Kabupaten Tangerang menyatakan:
                                </p>
                                <ol className="list-decimal pl-4.5 space-y-1.5">
                                  <li>
                                    <strong>Persetujuan BYOD:</strong> Sanggup membawa perangkat kerja laptop pribadi (Bring Your Own Device) ke kantor industri dengan spesifikasi lengkap untuk menjalankan aplikasi desain penunjang (Adobe Suite, CorelDraw, Figma, Blender, CapCut).
                                  </li>
                                  <li>
                                    <strong>Perlindungan Hak Intelektual (NDA):</strong> Sanggup menjaga segala kerahasiaan berkas digital, draf visual, informasi, dan proses kreatif mitra industri {targetCompany?.name} dan tidak akan mempublikasikannya tanpa seizin HRD.
                                  </li>
                                  <li>
                                    <strong>Kedisiplinan Logbook:</strong> Sanggup mengisi logbook harian / mingguan di aplikasi portal dan melakukan sinkronisasi dengan guru pendamping secara berkala.
                                  </li>
                                </ol>

                                <p className="pt-2 font-medium">
                                  Pernyataan komitmen ini dibuat dengan kesadaran penuh dari siswa, orang tua/wali siswa, serta disetujui secara tertulis oleh penanggungjawab Hubungan Industri SMK Negeri 14 Tangerang.
                                </p>
                              </div>

                              {/* Dual signatures */}
                              <div className="grid grid-cols-2 gap-4 pt-5 text-center font-sans text-[9px]">
                                <div className="space-y-5">
                                  <p>Menyetujui Orang Tua/Wali,</p>
                                  <div className="h-7 border-b border-dashed border-slate-400 w-2/3 mx-auto"></div>
                                  <p className="text-slate-500 font-bold">(..........................................)</p>
                                </div>
                                <div className="space-y-5">
                                  <p>Siswa Bersangkutan,</p>
                                  <div className="h-7 border-b border-dashed border-slate-400 w-2/3 mx-auto flex items-center justify-center">
                                    <span className="font-serif italic text-blue-800 text-[10px] select-none text-opacity-50">{activeStudent.name}</span>
                                  </div>
                                  <p className="font-bold text-slate-800">{activeStudent.name}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PDF bottom status bar */}
                      <div className="bg-[#121221] px-4 py-1.5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                        <span>Halaman {activeAttachmentTab === "pengantar" ? "1" : activeAttachmentTab === "biodata" ? "2" : "3"} dari 3</span>
                        <span>Dibuat: 100% digital PDF compliance</span>
                      </div>
                    </div>

                    {/* Safety compliance confirmation toggle before sending */}
                    <div className="flex items-start gap-2.5 text-xs bg-white/5 p-3.5 rounded-xl border border-indigo-505/20" id="pdf-safe-toggle">
                      <input
                        id="safeCheckAttachment"
                        type="checkbox"
                        checked={isAttachmentApproved}
                        onChange={(e) => setIsAttachmentApproved(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 outline-none w-4 h-4 bg-slate-950 border-white/10 cursor-pointer"
                      />
                      <label htmlFor="safeCheckAttachment" className="text-white/70 leading-normal select-none cursor-pointer font-sans">
                        Saya mengonfirmasi data siswa <strong className="text-white">{activeStudent.name}</strong> dan berkas lampiran PDF di atas telah diperiksa keakuratannya sebelum dikirimkan ke <strong className="text-white">{targetCompany?.name}</strong>.
                      </label>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSendSimulate}
                      disabled={isSending || !emailSubject || !emailBody || !isAttachmentApproved}
                      className={`w-full font-extrabold text-xs py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg border transition duration-200 ${
                        isAttachmentApproved 
                          ? "bg-emerald-600 hover:bg-emerald-550 text-white border-emerald-500/20 shadow-emerald-500/10" 
                          : "bg-emerald-950/20 hover:bg-emerald-950/30 text-emerald-400/50 border-emerald-500/10 cursor-not-allowed opacity-60"
                      }`}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Menghidupkan SMTP & Mengirimkan PDF Lampiran...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {isAttachmentApproved 
                            ? `Kirim ke Email HRD (${targetCompany.hrdEmail})` 
                            : "Harap Tinjau & Klik Konfirmasi Lampiran!"}
                        </>
                      )}
                    </button>
                    {!isAttachmentApproved && (
                      <p className="text-[10.5px] text-yellow-500/80 font-medium font-sans text-center mt-2 animate-pulse">
                        ⚠️ Checklist konfirmasi berkas lampiran di atas diperlukan sebelum mengirim surat ke HRD!
                      </p>
                    )}
                  </div>
                </div>
              )}

              {sendSuccess && (
                <div className="bg-emerald-950/20 border border-emerald-500/35 p-5 rounded-xl text-xs space-y-2 animate-fade-in text-white">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950/40" />
                    Surat Lamaran Sukses Dikirimkan!
                  </div>
                  <p className="text-white/70 leading-relaxed font-medium">
                    Sistem berhasil mensimulasikan SMTP Protokol SMKN 1 Teluknaga. Berkas kelengkapan Surat Pengantar, Biodata, dan BYOD Consent Statement telah dikirim langsung ke <strong>{targetCompany.hrdEmail}</strong> dalam format PDF terlampir. 
                  </p>
                  <p className="text-[11px] text-blue-300 italic font-mono flex items-center gap-1 pt-1 font-semibold">
                    <CornerDownRight className="w-3 h-3" /> Status Siswa otomatis diubah menjadi "Menunggu HRD (Pending)"
                  </p>
                </div>
              )}

            </div>
          )}

          {!activeStudent && (
            <p className="text-white/40 text-center py-10 italic">Daftarkan siswa terlebih dahulu.</p>
          )}

        </div>

        {/* Sent History Column */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 shadow-xl space-y-4 flex flex-col">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Log & Riwayat Pengiriman Email
            </h3>
            <p className="text-[11px] text-white/50">Mencatat surat lamaran terkirim dari sistem secara realtime.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[75vh]">
            {emailHistory.length > 0 ? (
              emailHistory.map(item => (
                <div key={item.id} className="p-4 rounded-xl border border-white/5 hover:border-white/15 transition-colors space-y-2.5 text-xs bg-white/5 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-white">{item.studentName}</h4>
                      <p className="text-[10px] text-white/55 font-mono mt-0.5">Dikirim ke: {item.companyName} ({item.hrdEmail})</p>
                    </div>
                    <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[9px] px-2 py-0.5 rounded">
                      SENT SUCCESS
                    </span>
                  </div>

                  <div className="border-t border-white/10 pt-2">
                    <p className="font-bold text-white/90 text-[11px] leading-tight flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                      {item.subject}
                    </p>
                    <p className="text-white/60 truncate text-[10.5px] mt-1 italic">
                      "{item.body.substring(0, 150)}..."
                    </p>
                  </div>

                  <div className="text-[9px] text-white/40 font-mono text-right font-medium">
                    {item.sentAt}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-white/40 py-12">
                <Mail className="w-10 h-10 text-white/10 mb-1" />
                <p className="text-xs font-bold text-white/80">Belum ada email yang terkirim</p>
                <p className="text-[10px] text-white/40 max-w-sm text-center mt-1 leading-relaxed">
                  Pilih siswa dan ramu draft dengan kecerdasan buatan, lalu tekan "Kirim" untuk mensimulasikan SMTP log.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Immersive PDF Zoomed Preview Modal */}
      {isPdfZoomed && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 text-slate-900 animate-fade-in font-sans">
          <div className="bg-[#121221] border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#16162a] px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-black text-sm sm:text-base">Pratinjau Keterbacaan Berkas Lampiran (HQ PDF)</h3>
                  <p className="text-xs text-white/50">{activeStudent?.name} — {activeStudent?.className || 'DKV'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPdfZoomed(false)}
                className="bg-white/5 border border-white/5 hover:bg-white/10 text-white/80 p-2 rounded-xl transition cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Sub-Header Tabs */}
            <div className="bg-[#10101d] px-6 py-2.5 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                {[
                  { id: "pengantar", name: "1. Surat Pengantar Kepala" },
                  { id: "biodata", name: "2. CV & Portofolio Siswa" },
                  { id: "byod", name: "3. Lembar BYOD & Integritas" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveAttachmentTab(t.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      activeAttachmentTab === t.id
                        ? "bg-blue-600/20 border-blue-500 text-white"
                        : "bg-white/5 border-transparent text-white/40 hover:text-white"
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded">
                🟢 HIGH-FIDELITY PREVIEW
              </span>
            </div>

            {/* Modal Content Scroll Area */}
            <div className="flex-1 bg-slate-900/40 p-6 overflow-y-auto flex justify-center">
              <div className="bg-white text-slate-900 border border-slate-300 p-8 sm:p-12 shadow-2xl rounded-sm w-full max-w-[720px] min-h-[920px] md:min-h-[1010px] text-left font-serif leading-relaxed select-text shadow-black/80">
                {activeAttachmentTab === "pengantar" && (
                  <div className="space-y-6 text-[12px]">
                    {/* Kop Surat */}
                    <div className="border-b-4 border-double border-slate-950 pb-3 mb-5 text-center text-slate-900 select-none">
                      <h4 className="text-[13px] font-bold uppercase tracking-wider leading-none">Pemerintah Provinsi Banten</h4>
                      <h4 className="text-[13.5px] font-extrabold uppercase leading-none mt-1">Dinas Pendidikan dan Kebudayaan</h4>
                      <h3 className="text-[16px] font-black uppercase text-slate-950 mt-1.5 leading-none">SMK NEGERI 14 KABUPATEN TANGERANG</h3>
                      <p className="text-[11.5px] font-bold tracking-wide uppercase text-slate-800 leading-none mt-1.5">KOMPETENSI KEAHLIAN: DESAIN KOMUNIKASI VISUAL (DKV)</p>
                      <p className="text-[9.5px] text-slate-500 italic font-sans mt-1">Jl. Raya Kp Mindi, Budi Mulya, Cikupa, Tangerang, Banten | Web: smkn14kabtangerang.sch.id</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[11px] font-sans">
                      <div className="space-y-1">
                        <p><strong>Nomor:</strong> 421.3 / 214-SMKN14 / DKV / 2026</p>
                        <p><strong>Lampiran:</strong> 1 (Satu) Berkas Lengkap</p>
                        <p><strong>Perihal:</strong> Permohonan Praktik Kerja Lapangan (PKL)</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p>Tangerang, 13 Juni 2026</p>
                        <p><strong>Kepada Yth.</strong></p>
                        <p className="font-bold underline text-[12px]">{targetCompany?.contactPerson || 'Kepala HRD'}</p>
                        <p className="font-extrabold text-[12px]">{targetCompany?.name}</p>
                        <p className="text-slate-500 text-[10px]">{targetCompany?.address || 'Tangerang'}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 leading-relaxed text-[11.5px] text-justify font-sans">
                      <p>Dengan hormat,</p>
                      <p>
                        Pendidikan Sistem Ganda atau Praktik Kerja Lapangan (PKL) merupakan program kurikulum wajib nasional Sekolah Menengah Kejuruan guna melatih mental, keterampilan teknis, serta menanamkan etos kerja profesional sesuai kualifikasi dunia usaha/industri (DUDI) yang dinamis.
                      </p>
                      <p>
                        Sehubungan dengan hal tersebut di atas, kami dari Kompetensi Keahlian <strong>Desain Komunikasi Visual (DKV) SMK Negeri 14 Kabupaten Tangerang</strong> dengan hormat mengajukan permohonan PKL siswa kami untuk dapat ditempatkan di {targetCompany?.name} dengan rincian identitas sebagai berikut:
                      </p>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-sans space-y-2 my-4 text-xs">
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500">Nama Lengkap Siswa:</span>
                          <span className="col-span-2 font-bold text-slate-800 text-sm">{activeStudent?.name}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500">Nomor Induk Siswa (NIS):</span>
                          <span className="col-span-2 font-mono font-bold text-slate-700">{activeStudent?.nis || "32104928A"}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500">Tingkat Kelas:</span>
                          <span className="col-span-2 text-slate-800">{activeStudent?.className || "XII DKV 1"}</span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500">Keahlian Unggulan DKV:</span>
                          <span className="col-span-2 font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                            {activeStudent?.skills.join(", ") || "DKV Suite, Illustrator, Video Editing"}
                          </span>
                        </div>
                        <div className="grid grid-cols-3">
                          <span className="text-slate-500">Portofolio Digital:</span>
                          <span className="col-span-2 font-mono text-blue-600 truncate">{activeStudent?.portfolioUrl}</span>
                        </div>
                      </div>

                      <p>
                        Pelaksanaan magang ini dijadwalkan berlangsung sesuai dengan kalender akademik magang vokasi. Selama pengerjaan tugas industri, siswa kami akan dipantau secara langsung oleh Pembimbing Sekolah dari program studi terkait dan secara mandiri diwajibkan menuliskan logbook harian.
                      </p>
                      <p>
                        Kami sangat berharap Bapak/Ibu Pimpinan menerima usulan kemitraan strategis ini. Atas pertimbangan, kesediaan serta kerja sama yang produktif dan erat yang terjalin selama ini, kami sampaikan terima kasih sebesar-besarnya.
                      </p>
                    </div>

                    <div className="pt-8 flex justify-end font-sans">
                      <div className="text-center space-y-1.5 text-[11px] w-64">
                        <p>Pilar Vokasi Sekolah,</p>
                        <p className="font-bold">Kepala Program Studi Kedinasan DKV</p>
                        <div className="py-4 flex justify-center relative">
                          <div className="absolute top-1 select-none pointer-events-none opacity-45 border border-emerald-600 rounded-full text-emerald-600 font-bold p-1 text-[10px] rotate-12 scale-100 border-dashed font-sans whitespace-nowrap">
                            VERIFIED SMKN 14 DKV
                          </div>
                          <div className="w-20 h-10 bg-slate-100/10 rounded-lg flex items-center justify-center border border-slate-200">
                            <span className="font-serif italic text-blue-900 text-sm text-opacity-80 font-bold">Surti W.</span>
                          </div>
                        </div>
                        <p className="font-bold underline text-slate-900">{settings.headOfDepartment || "SURTI WIJAYA, S.Sn, M.Pd"}</p>
                        <p className="text-slate-500 text-[9px]">NIP. 19820412 201012 2 003</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeAttachmentTab === "biodata" && (
                  <div className="space-y-6 text-[12px] font-sans">
                    <div className="border-b-2 border-indigo-200 pb-3 flex justify-between items-center select-none font-sans">
                      <span className="text-[12px] font-black tracking-wider text-indigo-900 uppercase">LAMPIRAN I: REZUME PORTOFOLIO DKV SISWA</span>
                      <span className="text-[9.5px] text-white bg-indigo-600 px-3 py-1 rounded font-bold uppercase font-sans">PORTFOLIO CV SMART-ATTACH</span>
                    </div>

                    <div className="grid grid-cols-4 gap-6 pt-3">
                      <div className="col-span-1 flex flex-col items-center justify-start space-y-2">
                        <div className="w-24 h-32 bg-slate-100 rounded-lg border border-slate-300 flex items-center justify-center p-1 shadow-md">
                          <div className="w-full h-full bg-slate-200 rounded-md flex items-center justify-center text-slate-400">
                            <UserCheck className="w-12 h-12 text-slate-400" />
                          </div>
                        </div>
                        <span className="text-[8.5px] font-mono text-center text-neutral-400 font-bold">[PAS FOTO 3X4]</span>
                      </div>

                      <div className="col-span-3 space-y-2 font-sans text-[11px]">
                        <h4 className="text-[16px] font-black text-slate-950 leading-tight">{activeStudent?.name}</h4>
                        <div className="grid grid-cols-3 gap-y-1 text-slate-600">
                          <span className="font-bold">NIS / NISN:</span>
                          <span className="col-span-2 text-slate-900 font-mono font-bold text-sm">{activeStudent?.nis || '32104928A'}</span>
                          
                          <span className="font-bold">Tingkat Kelas:</span>
                          <span className="col-span-2 text-slate-900">{activeStudent?.className || 'XII DKV 1'}</span>
                          
                          <span className="font-bold">Sekolah Induk:</span>
                          <span className="col-span-2 text-slate-900">SMK Negeri 14 Kabupaten Tangerang</span>
                        </div>

                        <div className="pt-2">
                          <span className="font-bold text-slate-700 block mb-1">Pilar Keahlian Pokok Kejuruan (DKV):</span>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {activeStudent?.skills.map((s, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-bold border border-slate-200 uppercase">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wide block">Tautan Portofolio Karya Digital</span>
                        <p className="text-[11px] bg-indigo-50/40 p-3 font-mono text-indigo-650 rounded-xl border border-indigo-100 break-all select-all font-semibold flex items-center gap-1.5">
                          <span>🔗</span> {activeStudent?.portfolioUrl || 'https://behance.net/portfolio-smkn14'}
                        </p>
                      </div>

                      <div className="space-y-1.5 text-slate-800">
                        <span className="text-[10px] font-black text-indigo-900 uppercase tracking-wide block font-sans">Karya Seni Visual & Fokus Karya Unggulan (Creative Assets)</span>
                        <p className="text-justify font-sans p-3 bg-indigo-50/20 rounded-xl border border-indigo-100/50 leading-relaxed text-[11px] italic">
                          "{activeStudent?.portfolioHighlight || 'Komposisi Mockup Publikasi Media Digital, Desain Ilustrasi Vektor, dan Pengerjaan Animasi Video Motion 2D.'}"
                        </p>
                      </div>

                      <div className="space-y-1.5 text-slate-800 pt-2">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-wide block">Catatan Tambahan & Rekomendasi Guru Pendamping</span>
                        <p className="text-justify font-serif p-3 bg-stone-50 rounded-xl border border-slate-200 leading-relaxed text-[11px]">
                          {customNotes ? `"${customNotes}"` : "Siswa direkomendasikan secara formal oleh program studi kejuruan karena memiliki kapabilitas teknis yang handal dan disiplin tinggi dalam memproduksi visual desain grafis interaktif."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeAttachmentTab === "byod" && (
                  <div className="space-y-6 text-[12px] font-sans">
                    <div className="border-b-2 border-rose-200 pb-3 flex justify-between items-center select-none">
                      <span className="text-[12px] font-black tracking-wider text-rose-900 uppercase font-sans">LAMPIRAN II: PAKTA INTEGRITAS & PERNYATAAN BYOD</span>
                      <span className="text-[9.5px] text-white bg-rose-600 px-3 py-1 rounded font-bold uppercase font-sans">BYOD COMPLIANT & DISCIPLINE AGREEMENT</span>
                    </div>

                    <div className="space-y-4 text-stone-850 text-justify text-[11px] leading-relaxed">
                      <p className="font-extrabold text-slate-950 uppercase text-[12px] italic">
                        "KOMITMEN BELAJAR MANDIRI DENGAN MEMBAWA PERANGKAT LAPTOP PRIBADI (BYOD)"
                      </p>
                      <p>
                        Dalam mematuhi operasional efisien magang pada lingkungan instansi/perusahaan {targetCompany?.name}, saya yang bertandatangan di bawah ini siswa PKL program DKV SMKN 14 Kabupaten Tangerang menyatakan berkomitmen penuh terhadap poin-poin berikut:
                      </p>
                      <ol className="list-decimal pl-6 space-y-3">
                        <li>
                          <strong>Penyediaan Laptop Mandiri (BYOD):</strong> Sanggup menyediakan dan membawa laptop sendiri ke lokasi praktik kerja lapangan dengan spesifikasi hardware mumpuni (RAM min 8GB, Graphics processor internal/eksternal) untuk menjalankan workspace Adobe Illustrator, Photoshop, Figma, Premiere Pro, Blender atau software produksi visual sejenis.
                        </li>
                        <li>
                          <strong>Perlindungan Kerahasiaan Data Industri (NDA):</strong> Berkomitmen penuh melindungi kerahasiaan berkas mentah (raw files), aset desain, draf branding, dan strategi promosi internal {targetCompany?.name} serta dilarang menduplikasi atau mengekspor tanpa persetujuan mentor industri.
                        </li>
                        <li>
                          <strong>Kepatuhan Laporan Logbook:</strong> Menyatakan bersedia mengisi logbook aktivitas harian pada portal SI-KAJUR dan disinkronisasikan ke google cloud storage secara jujur, tertib, dan berkala.
                        </li>
                      </ol>

                      <p className="pt-3 font-medium text-slate-800 font-sans">
                        Demikian surat komitmen komparatif BYOD ini dirancang secara sadar, tanpa paksaan, serta diketahui penuh oleh orang tua/wali siswa sebagai sarana pengembangan kompetensi industri berkelanjutan.
                      </p>
                    </div>

                    {/* Dual signatures */}
                    <div className="grid grid-cols-2 gap-6 pt-10 text-center text-[10px] sm:text-xs">
                      <div className="space-y-8 animate-fade-in">
                        <p>Menyetujui Orang Tua/Wali,</p>
                        <div className="h-10 border-b border-dashed border-slate-400 w-2/3 mx-auto"></div>
                        <p className="text-slate-500 font-bold">(..........................................)</p>
                      </div>
                      <div className="space-y-8 animate-fade-in">
                        <p>Siswa Bersangkutan,</p>
                        <div className="h-10 border-b border-dashed border-slate-400 w-2/3 mx-auto flex items-center justify-center">
                          <span className="font-serif italic text-blue-800 text-sm select-none text-opacity-50">{activeStudent?.name}</span>
                        </div>
                        <p className="font-bold text-slate-900">{activeStudent?.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="bg-[#16162a] px-6 py-4.5 border-t border-white/10 flex items-center justify-between">
              <span className="text-white/40 text-xs font-mono">Ditinjau oleh pembimbing Hubin & DUDI SMKN 14</span>
              <button
                type="button"
                onClick={() => setIsPdfZoomed(false)}
                className="bg-indigo-605 bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/20 text-white text-xs font-black px-6 py-2.5 rounded-xl transition cursor-pointer active:scale-95"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
