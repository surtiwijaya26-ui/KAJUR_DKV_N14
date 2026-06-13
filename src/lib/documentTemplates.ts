import { Student, Company, AppSettings, LogbookEntry } from "../types";

export function generateDocumentHTML(
  letterType: "PENGANTAR" | "BIODATA" | "BYOD" | "CERTIFICATE",
  student: Student,
  company: Company | undefined,
  settings: AppSettings,
  logbooks: LogbookEntry[] = []
): string {
  const formattedLetterNo = settings.letterNoFormat.replace("###", "042");
  
  // Calculate final score of certificate if needed
  const studentLogs = (logbooks || []).filter(l => l.studentId === student.id);
  const actualLogsCount = studentLogs.length;
  let finalScore = 75 + (student.skills.length * 3) + Math.min(10, actualLogsCount);
  if (finalScore > 100) finalScore = 100;
  
  let gradeTitle = "MEMUASKAN (SATISFACTORY)";
  if (finalScore >= 92) {
    gradeTitle = "ISTIMEWA (EXCELLENT)";
  } else if (finalScore >= 83) {
    gradeTitle = "SANGAT BAIK (VERY GOOD)";
  } else if (finalScore >= 75) {
    gradeTitle = "BAIK (GOOD)";
  }

  // Common Header/Kop Surat
  const schoolGovText = settings.schoolHeaderGov || "PEMERINTAH PROVINSI BANTEN\nDINAS PENDIDIKAN DAN KEBUDAYAAN";
  const formattedGovText = schoolGovText.replace(/\n/g, "<br>");
  const schoolNameText = settings.schoolHeaderName || "SMK NEGERI 14 KABUPATEN TANGERANG";
  const schoolAddressText = settings.schoolHeaderAddress || "Jl. Raya Laban, Kec. Solear, Kabupaten Tangerang, Banten 15730";
  const schoolContactText = settings.schoolHeaderContact || "Email: info@smkn14kabtangerang.sch.id &nbsp;&nbsp; Web: smkn14kabtangerang.sch.id";

  const kopSuratHTML = `
    <table style="width: 100%; border-bottom: 3px double #000; padding-bottom: 12px; margin-bottom: 20px; border-collapse: collapse; font-family: 'Times New Roman', Times, serif;">
      <tr>
        <td style="width: 15%; text-align: center; vertical-align: middle; padding-right: 15px;">
          ${settings.schoolLogoBase64 ? `
            <img src="${settings.schoolLogoBase64}" style="width: 75px; height: 75px; object-fit: contain; display: block; margin: 0 auto;" />
          ` : `
            <svg style="width: 65px; height: 65px; display: block; margin: 0 auto;" viewBox="0 0 100 100">
              <polygon points="50,15 80,30 80,70 50,85 20,70 20,30" fill="none" stroke="#1e3a8a" stroke-width="3" />
              <path d="M 50,22 L 72,33 L 72,67 L 50,78 L 28,67 L 28,33 Z" fill="#1e3a8a" opacity="0.15" />
              <circle cx="50" cy="50" r="10" fill="#f59e0b" />
              <text x="50" y="53" font-family="sans-serif" font-size="8" font-weight="bold" fill="#fff" text-anchor="middle">SMK</text>
            </svg>
          `}
        </td>
        <td style="width: 85%; text-align: center; vertical-align: middle;">
          <h3 style="margin: 0; font-size: 11pt; font-weight: bold; text-transform: uppercase; line-height: 1.3; color: #000;">
            ${formattedGovText}
          </h3>
          <h2 style="margin: 2px 0 0 0; font-size: 14pt; font-weight: bold; text-transform: uppercase; line-height: 1.3; color: #000;">
            ${schoolNameText}
          </h2>
          <p style="margin: 4px 0 0 0; font-size: 9pt; font-family: Arial, sans-serif; font-style: italic; color: #333; line-height: 1.2;">
            ${schoolAddressText}
          </p>
          <p style="margin: 1px 0 0 0; font-size: 8.5pt; font-family: Arial, sans-serif; color: #444; line-height: 1.2;">
            ${schoolContactText}
          </p>
        </td>
      </tr>
    </table>
  `;

  const footerSuratHTML = settings.schoolFooterText ? `
    <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 8px; font-family: Arial, sans-serif; font-size: 8pt; color: #666; text-align: center; font-style: italic;">
      ${settings.schoolFooterText}
    </div>
  ` : "";

  switch (letterType) {
    case "PENGANTAR":
      return `
        ${kopSuratHTML}
        <table style="width: 100%; font-size: 11pt; font-family: Arial, sans-serif; margin-bottom: 20px;">
          <tr>
            <td style="width: 12%;">Nomor</td>
            <td style="width: 2%;">:</td>
            <td style="width: 46%;">${formattedLetterNo}</td>
            <td style="width: 40%; text-align: right;">Tangerang, ${settings.issueDate}</td>
          </tr>
          <tr>
            <td>Lampiran</td>
            <td>:</td>
            <td>1 Berkas (Biodata Siswa DKV)</td>
            <td></td>
          </tr>
          <tr>
            <td>Hal</td>
            <td>:</td>
            <td><strong>Permohonan Praktek Kerja Lapangan (PKL)</strong></td>
            <td></td>
          </tr>
        </table>

        <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; margin-bottom: 20px;">
          <p>Kepada Yth.<br>
          <strong>${company ? company.contactPerson : "Pimpinan Industri / HR Manager"}</strong><br>
          <strong>${company ? company.name : "Nama Perusahaan"}</strong><br>
          <span style="font-size: 10pt; color: #555;">${company ? company.address : "Alamat Perusahaan"}</span></p>
          
          <p style="margin-top: 25px;">Dengan hormat,</p>
          <p style="text-indent: 40px; text-align: justify;">
            Sehubungan dengan program kurikulum Sekolah Menengah Kejuruan (SMK) berbasis industri, kami di <strong>SMK Negeri 14 Kabupaten Tangerang</strong> membekali siswa dengan kompetensi keahlian unggul yang siap kerja. Salah satu kegiatan wajib yang harus ditempuh siswa kelas XII Semester Ganjil adalah <strong>Praktek Kerja Lapangan (PKL)</strong> selama kurun waktu yang disepakati.
          </p>
          <p style="text-indent: 40px; text-align: justify;">
            Untuk itu, kami memohon kesediaan instansi/perusahaan yang Bapak/Ibu pimpin kiranya dapat menerima siswa terbaik kami dari program keahlian <strong>Desain Komunikasi Visual (DKV)</strong> untuk melaksanakan magang/PKL. Adapun rincian data siswa bersangkutan adalah sebagai berikut:
          </p>

          <table style="width: 90%; margin: 20px auto; border-collapse: collapse; border: 1px solid #ddd; font-size: 10.5pt;">
            <tr style="background-color: #f5f5f5;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nama Siswa</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Nomor Induk Siswa (NIS)</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Kelas</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Fokus Keahlian Utama</th>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;"><strong>${student.name}</strong></td>
              <td style="border: 1px solid #ddd; padding: 8px;">${student.nis}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${student.className}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${student.skills.slice(0, 3).join(", ") || "Desain Kreatif DKV"}</td>
            </tr>
          </table>

          <p style="text-indent: 40px; text-align: justify;">
            Siswa tersebut telah dibekali dengan kompetensi teoritis dan praktis di bidang Desain Grafis, Video/Audio Editing, Ilustrasi, serta UI/UX Wireframing Dasar. Kami percaya bimbingan langsung dari tim profesional industri akan menyempurnakan kemampuan teknis maupun etika kerja nyata mereka.
          </p>
          <p style="text-indent: 40px; text-align: justify;">
            Demikian permohonan ini kami sampaikan. Atas bantuan, kerja sama lintas institusi, dan kesediaan Bapak/Ibu untuk ikut andil memajukan kualitas lulusan pendidikan kejuruan nasional, kami ucapkan terima kasih yang sebesar-besarnya.
          </p>
        </div>

        <table style="width: 100%; font-family: Arial, sans-serif; font-size: 11pt; margin-top: 40px;">
          <tr>
            <td style="width: 50%;"></td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">Hormat kami,</p>
              <p style="margin: 0; font-weight: bold;">Kepala Dept. DKV SMKN 14</p>
              <br><br><br><br>
              <p style="margin: 0; font-weight: bold; text-decoration: underline;">${settings.headOfDepartment}</p>
              <p style="margin: 0; font-size: 9.5pt; color: #444;">NIP: ${settings.headOfDepartmentNIP}</p>
            </td>
          </tr>
        </table>
        ${footerSuratHTML}
      `;

    case "BIODATA":
      return `
        ${kopSuratHTML}
        <h3 style="text-align: center; font-family: Arial, sans-serif; margin-bottom: 25px; text-transform: uppercase;">
          BIODATA CALON PESERTA PRAKTEK KERJA LAPANGAN (PKL)<br>
          <span style="font-size: 10.5pt; font-weight: normal; text-transform: none; color: #555;">PROGRAM STUDI DESAIN KOMUNIKASI VISUAL (DKV)</span>
        </h3>

        <table style="width: 100%; font-family: Arial, sans-serif; font-size: 11pt; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="width: 25%; padding: 8px 0; font-weight: bold;">Nama Lengkap</td>
            <td style="width: 3%; padding: 8px 0;">:</td>
            <td style="width: 72%; padding: 8px 0; font-size: 12pt; font-weight: bold;">${student.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Nomor Induk Siswa</td>
            <td style="padding: 8px 0;">:</td>
            <td style="padding: 8px 0;">${student.nis}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Kelas / Semester</td>
            <td style="padding: 8px 0;">:</td>
            <td style="padding: 8px 0;">${student.className} / Ganjil</td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Kompetensi Keahlian</td>
            <td style="padding: 8px 0;">:</td>
            <td style="padding: 8px 0;">Desain Komunikasi Visual (DKV)</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top;">Fokus Keterampilan</td>
            <td style="padding: 8px 0; vertical-align: top;">:</td>
            <td style="padding: 8px 0;">
              <ul style="margin: 0; padding-left: 20px;">
                ${student.skills.map(s => `<li>${s}</li>`).join("")}
              </ul>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">Mitra ID Perusahaan</td>
            <td style="padding: 8px 0;">:</td>
            <td style="padding: 8px 0; font-weight: bold; color: #1e3a8a;">${company ? company.name : "Perusahaan Belum Terplot"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top;">Alamat Penempatan</td>
            <td style="padding: 8px 0; vertical-align: top;">:</td>
            <td style="padding: 8px 0; color: #555;">${company ? company.address : "-"}</td>
          </tr>
        </table>

        <div style="font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.5; background-color: #f9f9f9; padding: 15px; border-left: 4px solid #4f46e5; margin-bottom: 30px;">
          <strong>Pernyataan Kesiapan Siswa:</strong> Letak magang ini didasarkan pada plotting nilai, minat portofolio, dan evaluasi kepribadian. Selama dalam bimbingan industri mitra, siswa berkewajiban mematuhi peraturan jam kerja industri DUDI, bersikap proaktif, santun, menjaga nama baik almamater, serta mendokumentasikan logbook harian secara disiplin melalui sistem digital.
        </div>

        <table style="width: 100%; font-family: Arial, sans-serif; font-size: 11pt;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">Orang Tua / Wali Siswa,</p>
              <br><br><br><br>
              <p style="margin: 0; font-weight: bold; border-bottom: 1px solid #000; display: inline-block;">( ___________________ )</p>
            </td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">Siswa Bersangkutan,</p>
              <br><br><br><br>
              <p style="margin: 0; font-weight: bold; border-bottom: 1px solid #000; display: inline-block;">( ${student.name} )</p>
              <p style="margin: 0; font-size: 9.5pt; color: #444;">NIS: ${student.nis}</p>
            </td>
          </tr>
        </table>
        ${footerSuratHTML}
      `;

    case "BYOD":
      return `
        ${kopSuratHTML}
        <h3 style="text-align: center; font-family: Arial, sans-serif; margin-bottom: 20px; text-transform: uppercase;">
          SURAT PERNYATAAN KESIAPAN ALAT MANDIRI (BYOD)<br>
          <span style="font-size: 10.5pt; font-weight: normal; text-transform: none; color: #555;">BRING YOUR OWN DEVICE - JURUSAN DESAIN KOMUNIKASI VISUAL (DKV)</span>
        </h3>

        <p style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
          Yang bertanda tangan di bawah ini selaku Orang Tua/Wali dari peserta didik SMK Negeri 14 Kabupaten Tangerang di bawah ini:
        </p>

        <table style="width: 100%; font-family: Arial, sans-serif; font-size: 11pt; border-collapse: collapse; margin-left: 20px; margin-bottom: 25px;">
          <tr>
            <td style="width: 25%; padding: 6px 0;">Nama Siswa</td>
            <td style="width: 3%; padding: 6px 0;">:</td>
            <td style="width: 72%; padding: 6px 0; font-weight: bold;">${student.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Nomor Induk Siswa</td>
            <td style="padding: 6px 0;">:</td>
            <td style="padding: 6px 0;">${student.nis}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Kelas / Jurusan</td>
            <td style="padding: 6px 0;">:</td>
            <td style="padding: 6px 0;">${student.className} / Desain Komunikasi Visual (DKV)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0;">Tempat Penempatan</td>
            <td style="padding: 6px 0;">:</td>
            <td style="padding: 6px 0; font-weight: bold; color: #1e3a8a;">${company ? company.name : "Perusahaan Belum Terplot"}</td>
          </tr>
        </table>

        <div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.6; text-align: justify; margin-bottom: 20px;">
          <p>Dengan ini menyatakan setuju dan bertanggung jawab untuk:</p>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;">Menyediakan perangkat kerja utama laptop pribadi (BYOD) berspesifikasi standar industri kreatif DKV guna menunjang produktivitas anak kami selama melaksanakan Praktek Kerja Lapangan (PKL).</li>
            <li style="margin-bottom: 10px;">Menjamin perangkat laptop tersebut dilengkapi perangkat lunak (software) penunjang desain berlisensi/akademis yang dibutuhkan sesuai porsi tugas industri anak kami.</li>
            <li style="margin-bottom: 10px;">Memberikan pengawasan dan bertanggung jawab penuh atas keamanan fisik perangkat keras BYOD tersebut di luar kewajiban penjaminan dari pihak sekolah atau industri mitra.</li>
          </ol>
          <p style="margin-top: 20px;">
            Demikian surat pernyataan kesiapan alat mandiri (BYOD) ini kami buat dengan sadar, penuh rasa tanggung jawab, dan tanpa ada paksaan dari pihak mana pun untuk mendukung kelancaran program keahlian magang putra/putri kami.
          </p>
        </div>

        <table style="width: 100%; font-family: Arial, sans-serif; font-size: 11pt; margin-top: 40px;">
          <tr>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">Mengetahui/Menyetujui,</p>
              <p style="margin: 0; font-weight: bold;">Orang Tua / Wali Siswa</p>
              <br><br><br><br>
              <p style="margin: 0; font-weight: bold; border-bottom: 1px solid #000; display: inline-block;">( ___________________ )</p>
            </td>
            <td style="width: 50%; text-align: center;">
              <p style="margin: 0;">Tangerang, ${settings.issueDate}</p>
              <p style="margin: 0; font-weight: bold;">Siswa Bersangkutan</p>
              <br><br><br><br>
              <p style="margin: 0; font-weight: bold; border-bottom: 1px solid #000; display: inline-block;">( ${student.name} )</p>
              <p style="margin: 0; font-size: 9.5pt; color: #444;">NIS: ${student.nis}</p>
            </td>
          </tr>
        </table>
        ${footerSuratHTML}
      `;

    case "CERTIFICATE":
      return `
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 25px; border: 8px double #4a3e1b; background-color: #fff9eb; max-width: 900px; margin: 0 auto; box-sizing: border-box;">
          
          <div style="font-size: 9.5pt; text-transform: uppercase; letter-spacing: 1.5px; color: #555; font-weight: bold; margin-bottom: 5px;">
            ${(settings.schoolHeaderGov || "DINAS PENDIDIKAN PROVINSI BANTEN").replace(/\n/g, " • ")} • ${settings.schoolHeaderName || "SMK NEGERI 14 KABUPATEN TANGERANG"}
          </div>
          
          <h1 style="font-family: Georgia, serif; font-size: 22pt; color: #1e1b4b; text-transform: uppercase; margin: 15px 0 5x 0; font-weight: bold;">
            Sertifikat Praktek Kerja Lapangan
          </h1>
          
          <div style="font-size: 10pt; font-family: monospace; font-weight: bold; color: #b45309; letter-spacing: 1px; margin-bottom: 25px;">
            NOMOR REKAS: SERT/DKV/${settings.schoolYear.replace("/", "-")}/${student.nis.slice(-5) || "001"}
          </div>

          <p style="font-style: italic; font-size: 11pt; color: #555; margin-bottom: 10px;">
            Dengan bangga menganugerahkan sertifikat bergengsi ini kepada:
          </p>

          <h2 style="font-family: Georgia, serif; font-size: 20pt; color: #854d0e; text-decoration: underline; margin: 10px 0; text-transform: uppercase; font-weight: bold;">
            ${student.name}
          </h2>
          
          <p style="font-family: monospace; font-size: 11pt; font-weight: bold; color: #334155; margin-bottom: 25px;">
            NIS: ${student.nis} &nbsp;•&nbsp; Kelas: ${student.className} / ${settings.schoolYear}
          </p>

          <p style="font-size: 11pt; color: #334155; line-height: 1.6; max-w: 650px; margin: 0 auto 25px auto; text-align: center;">
            Telah menyelesaikan program kegiatan magang profesi <strong>Praktek Kerja Lapangan (PKL)</strong> secara produktif, berintegritas, dan mematuhi etika industri kreatif selama kurun waktu PKL terdaftar pada institusi kerja mitra:
            <br>
            <span style="font-size: 12pt; color: #1e1b4b; font-weight: bold; text-transform: uppercase; display: inline-block; margin-top: 5px;">
              ${company ? company.name : "Unassigned / Perusahaan Mandiri DKV"}
            </span>
            <br>
            <span style="font-size: 9.5pt; color: #64748b; font-style: italic;">
              ${company ? company.address : "Alamat Mitra Kerja Industri DKV"}
            </span>
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 25px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; font-size: 10pt; text-align: left;">
            <tr style="background-color: #e2e8f0;">
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 40%;">Predikat Pencapaian Umum</th>
              <th style="padding: 10px; border: 1px solid #cbd5e1; width: 60%;">Fokus Penilaian Portofolio Kompetensi Kejuruan</th>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #cbd5e1; vertical-align: top; text-align: center;">
                <span style="font-size: 11pt; font-weight: bold; color: #15803d; text-transform: uppercase; display: block; margin-bottom: 5px;">
                  ${gradeTitle}
                </span>
                <span style="font-family: monospace; font-size: 9.5pt; color: #475569;">
                  Skor Kumulatif: <strong>${finalScore} / 100</strong>
                </span>
              </td>
              <td style="padding: 12px; border: 1px solid #cbd5e1; vertical-align: top;">
                <ul style="margin: 0; padding-left: 15px; color: #334155; font-size: 9.5pt; line-height: 1.5;">
                  <li>Desain Grafis / Brand Identity Design (Unggul)</li>
                  <li>Pemotongan Halaman Digital & Slicing/Mockup Web</li>
                  <li>Video Editing, Audio Mixing & Animasi Kreatif</li>
                  <li>Desain Ilustrasi Komersil & Storyboarding</li>
                </ul>
              </td>
            </tr>
          </table>

          <table style="width: 100%; font-size: 10.5pt; margin-top: 30px;">
            <tr>
              <td style="width: 50%; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 9.5pt;">Mengesahkan,</p>
                <p style="margin: 0; font-weight: bold; color: #334155;">Pimpinan Industri Mitra PKL</p>
                <br><br><br><br>
                <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #1e1b4b;">
                  ${company ? company.contactPerson : "DUDI Supervisor / HRD"}
                </p>
                <p style="margin: 0; color: #64748b; font-size: 9pt;">Penilai Kinerja Lapangan</p>
              </td>
              <td style="width: 50%; text-align: center;">
                <p style="margin: 0; color: #64748b; font-size: 9.5pt;">Tangerang, ${settings.issueDate}</p>
                <p style="margin: 0; font-weight: bold; color: #334155;">Kepala Dept. DKV SMKN 14</p>
                <br><br><br><br>
                <p style="margin: 0; font-weight: bold; text-decoration: underline; color: #1e1b4b;">
                  ${settings.headOfDepartment}
                </p>
                <p style="margin: 0; color: #64748b; font-size: 9pt;">NIP: ${settings.headOfDepartmentNIP}</p>
              </td>
            </tr>
          </table>

        </div>
      `;

    default:
      return "Document template not found";
  }
}
