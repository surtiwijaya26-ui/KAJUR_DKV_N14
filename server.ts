import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent header for telemetry
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// POST endpoint to generate tailored PKL HRD Application Email using Gemini-3.5-flash
app.post("/api/gemini/generate-email", async (req, res) => {
  const { studentName, studentSkills, studentPortfolio, companyName, companyIndustry, customMessage } = req.body;

  if (!studentName || !companyName) {
    return res.status(400).json({ error: "Nama siswa dan Nama perusahaan wajib diisi." });
  }

  // Robust fallback content if Gemini API key is missing
  if (!ai) {
    const fallbackSubject = `Permohonan Praktek Kerja Lapangan (PKL) DKV - ${studentName} - SMKN 1 Teluknaga`;
    const fallbackBody = `Kepada Yth.
Bapak/Ibu HRD ${companyName}
di tempat

Dengan hormat,

Saya yang bertanda tangan di bawah ini:
Nama: ${studentName}
Sekolah: SMK Negeri 14 Kab. Tangerang
Jurusan: Desain Komunikasi Visual (DKV)

Berdasarkan kurikulum pendidikan SMK, saya bermaksud mengajukan permohonan untuk melaksanakan Praktek Kerja Lapangan (PKL) di perusahaan yang Bapak/Ibu pimpin (${companyName}) pada bidang ${companyIndustry || 'Desain / Industri Kreatif'}.

Sebagai siswa DKV, saya memiliki keahlian dan minat mendalam di bidang:
${studentSkills || '- Desain Grafis & Layouting\n- Editing Video & Storyboarding\n- Ilustrasi Digital\n- Fotografi & Branding'}

Portofolio & Karya Saya:
${studentPortfolio || 'Kumpulan karya desain digital, mockup produk, dan portofolio kreatif.'}

${customMessage ? `Catatan Tambahan:\n${customMessage}\n` : ''}
Saya sangat berharap dapat diberikan kesempatan untuk belajar langsung di bawah bimbingan para profesional di perusahaan Bapak/Ibu. Atas perhatian dan kesempatan yang diberikan, saya ucapkan terima kasih yang sebesar-besarnya.

Hormat saya,
${studentName}
Jurusan DKV - SMK Negeri 14 Kab. Tangerang`;

    return res.json({
      subject: fallbackSubject,
      body: fallbackBody,
      mode: "Template Fallback (API Key tidak terdeteksi)"
    });
  }

  try {
    const prompt = `
Anda adalah konsultan karier profesional dan penasihat PKL untuk SMK Negeri 1 Teluknaga jurusan Desain Komunikasi Visual (DKV).
Tugas Anda adalah membuat email lamaran PKL (Praktek Kerja Lapangan) yang sangat sopan, profesional, memikat, dan terstruktur dalam Bahasa Indonesia yang ditujukan kepada HRD sebuah perusahaan.

Berikut adalah detail siswa yang melamar:
- Nama Siswa: ${studentName}
- Keahlian DKV: ${studentSkills || "Desain Grafis, Adobe Illustrator, Canva, Fotografi, Editing Video"}
- Portofolio/Karya Unggulan: ${studentPortfolio || "Portofolio branding logo UMKM, edit video pendek promosi, ilustrasi digital"}
- Perusahaan Tujuan: ${companyName}
- Bidang/Industri Perusahaan: ${companyIndustry || "Agensi Kreatif / IT / Media"}
- Pesan Kustom / Keinginan Siswa: ${customMessage || "Sangat antusias belajar hal baru dan berkomitmen tinggi"}

Buatkan Judul Subjek Email yang menarik dan Isi Email (Body) yang rapi, humanis, dan persuasif. Tekankan bahwa siswa DKV ini siap memberikan kontribusi nyata dalam membantu tugas kreatif di perusahaan, serta memiliki mentalitas belajar tinggi dan disiplin (sesuai standar SMKN 1 Teluknaga).

Response harus dalam format JSON dengan struktur persis seperti berikut:
{
  "subject": "Judul Subjek Email",
  "body": "Isi lengkap surat/email lamaran PKL"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["subject", "body"],
        }
      }
    });

    const resultText = response.text;
    if (resultText) {
      const parsed = JSON.parse(resultText.trim());
      return res.json({
        subject: parsed.subject,
        body: parsed.body,
        mode: "Gemini AI Generated"
      });
    } else {
      throw new Error("No response output from Gemini model.");
    }
  } catch (error: any) {
    console.error("Gemini Email generation error:", error);
    // On error, return template rendering
    const fallbackSubject = `Permohonan PKL DKV - ${studentName} - SMKN 1 Teluknaga`;
    const fallbackBody = `Kepada Yth. HRD ${companyName}\n\nDengan hormat,\nSaya ${studentName} dari program keahlian Desain Komunikasi Visual SMK Negeri 1 Teluknaga bermaksud mengajukan permohonan PKL.\n\nKeahlian:\n${studentSkills}\n\nTerima kasih.`;
    return res.json({
      subject: fallbackSubject,
      body: fallbackBody,
      mode: "Template Fallback (Gemini API Error: " + error.message + ")"
    });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server PKL DKV berjalan di http://localhost:${PORT}`);
  });
}

startServer();
