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
  Settings
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

  const activeStudent = students.find(s => s.id === selectedStudentId);
  const targetCompany = activeStudent ? companies.find(c => c.id === activeStudent.companyId) : null;

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

    const subjectTmpl = settings.emailSubjectTemplate || "Permohonan Praktek Kerja Lapangan (PKL) DKV - {{STUDENT_NAME}} - {{COMPANY_NAME}}";
    const bodyTmpl = settings.emailBodyTemplate || `Kepada Yth. Bapak/Ibu HRD {{COMPANY_NAME}}\n\nDengan hormat,\nSaya {{STUDENT_NAME}} bermaksud mengajukan permohonan PKL...`;

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
    setGenerationSource("Template Kustom (Saved)");
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
                <div className="space-y-3.5 pt-3 animate-fade-in text-xs">
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

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSendSimulate}
                      disabled={isSending || !emailSubject || !emailBody}
                      className="w-full bg-emerald-600 hover:bg-emerald-550 text-white font-extrabold text-xs py-3.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 border border-emerald-500/20 transition disabled:opacity-50"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Menghidupkan SMTP & Mengirimkan PDF Lampiran...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Kirim ke Email HRD ({targetCompany.hrdEmail})
                        </>
                      )}
                    </button>
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

    </div>
  );
}
