import { Student, Company, AppSettings, LogbookEntry, ActivityLog } from "./types";

export const DEFAULT_COMPANIES: Company[] = [
  {
    id: "comp-1",
    name: "Arise Creative Agency",
    address: "Jl. Boulevard Gading Serpong No. 12, Tangerang",
    contactPerson: "Ibu Amanda Sitorus (HR Manager)",
    hrdEmail: "hrd@arisecreative.com",
    industry: "Agensi Branding & Desain Grafis",
    slots: 3
  },
  {
    id: "comp-2",
    name: "Teluknaga Digital Print Hub",
    address: "Jl. Raya Teluknaga No. 45, Tangerang (Dekat Polsek)",
    contactPerson: "Bapak Wendy Kurniawan (Kasi Produksi)",
    hrdEmail: "produksi@teluknagaprinting.co.id",
    industry: "Percetakan Digital, Percetakan Offset & Packaging",
    slots: 5
  },
  {
    id: "comp-3",
    name: "Nusantara Animation Studio",
    address: "Kawasan Industri Millennium Blok A2/10, Cikupa",
    contactPerson: "Bapak Hermawan (HRD Division)",
    hrdEmail: "career@nusantara-animation.com",
    industry: "Animasi 2D/3D & Produksi Media",
    slots: 2
  },
  {
    id: "comp-4",
    name: "Tangerang Raya TV (Broadcaster)",
    address: "Komp. Perkantoran Pemda Tigaraksa Blok F, Tangerang",
    contactPerson: "Mbak Vika Rahmawati (Produser kreatif)",
    hrdEmail: "talent.hrd@tangerangrayatv.net",
    industry: "Stasiun TV & Video Production House",
    slots: 4
  },
  {
    id: "comp-5",
    name: "Pixel Craft Design",
    address: "Ruko CBD Bandara Soekarno Hatta Blok C9, Benda",
    contactPerson: "Bapak Doni Alamsyah (Creative Director)",
    hrdEmail: "info@pixelcraft.co.id",
    industry: "UI/UX, Website Design, & Media Sosial",
    slots: 3
  },
  {
    id: "comp-6",
    name: "Mencari Mandiri / Belum Terdistribusi",
    address: "-",
    contactPerson: "-",
    hrdEmail: "",
    industry: "-",
    slots: 99
  }
];

export const DEFAULT_STUDENTS: Student[] = [
  {
    id: "stud-1",
    name: "Aditya Saputra",
    nis: "242510001",
    className: "XII DKV 1",
    companyId: "comp-1",
    skills: ["Adobe Photoshop", "Adobe Illustrator", "Branding & Logo", "Layout Buku"],
    portfolioUrl: "behance.net/aditsaputra-dkv",
    portfolioHighlight: "Branding logo UMKM Kuliner Kampung Melayu & Desain Brosur PMB",
    phone: "081234567801",
    email: "aditya.saputra@siswa.smkn1teluknaga.sch.id",
    status: "Ongoing",
    parentName: "Suryadi Saputra",
    parentOccupation: "Karyawan Swasta",
    studentAddress: "Perumahan Taman Teluknaga Blok C2/15, Tangerang",
    birthPlaceDate: "Tangerang, 14 Februari 2008",
    pklStartDate: "2026-04-01",
    pklEndDate: "2026-06-15"
  },
  {
    id: "stud-2",
    name: "Amalia Putri",
    nis: "242510002",
    className: "XII DKV 1",
    companyId: "comp-3",
    skills: ["Toon Boom Harmony", "Clip Studio Paint", "Ilutrasi 2D", "Drawing Karakter"],
    portfolioUrl: "artstation.com/amalia_putri_art",
    portfolioHighlight: "Karakter Sheet Animasi Siswa & Ilustrasi Background Komik Lokal",
    phone: "081234567802",
    email: "amalia.putri@siswa.smkn1teluknaga.sch.id",
    status: "Ongoing",
    parentName: "Syarif Mukhtar",
    parentOccupation: "PNS",
    studentAddress: "Jl. Kampung Melayu Barat No. 8, Teluknaga, Tangerang",
    birthPlaceDate: "Jakarta, 29 Mei 2008",
    pklStartDate: "2026-04-01",
    pklEndDate: "2026-06-17"
  },
  {
    id: "stud-3",
    name: "Bagas Wijaya",
    nis: "242510003",
    className: "XII DKV 1",
    companyId: "comp-2",
    skills: ["CorelDraw", "Adobe Photoshop", "Desain Banner", "Setting Printing Offset"],
    portfolioUrl: "dribbble.com/bagas_printdesign",
    portfolioHighlight: "Desain spanduk festival sekolah & mockup kaos angkatan",
    phone: "081234567803",
    email: "bagas.wijaya@siswa.smkn1teluknaga.sch.id",
    status: "Ongoing",
    parentName: "Hendra Wijaya",
    parentOccupation: "Wiraswasta",
    studentAddress: "Desa Tanjung Burung RT 04/RW 02, Teluknaga, Tangerang",
    birthPlaceDate: "Tangerang, 10 Oktober 2007",
    pklStartDate: "2026-04-01",
    pklEndDate: "2026-09-30"
  },
  {
    id: "stud-4",
    name: "Dewi Lestari",
    nis: "242510004",
    className: "XII DKV 2",
    companyId: "comp-5",
    skills: ["Figma", "Canva", "Desain Konten Instagram", "UI/UX Jurnal Desain"],
    portfolioUrl: "figma.com/@dewi_lestari_dkv",
    portfolioHighlight: "Mockup aplikasi kebersihan desa & Template Feed Instagram Hubin",
    phone: "081234567804",
    email: "dewi.lestari@siswa.smkn1teluknaga.sch.id",
    status: "Pending",
    parentName: "Kurniawan Lestari",
    parentOccupation: "Pedagang",
    studentAddress: "Jl. Raya Tanjung Pasir, Kp. Baru, Teluknaga, Tangerang",
    birthPlaceDate: "Tangerang, 21 Desember 2008"
  },
  {
    id: "stud-5",
    name: "Rian Ginanjar",
    nis: "242510005",
    className: "XII DKV 2",
    companyId: "comp-4",
    skills: ["Adobe Premiere Pro", "Adobe After Effects", "Sinematografi", "Color Grading"],
    portfolioUrl: "youtube.com/c/rianginanjarfilms",
    portfolioHighlight: "Video Dokumenter Sejarah Teluknaga & Video Profil Sekolah 2026",
    phone: "081234567805",
    email: "rian.ginanjar@siswa.smkn1teluknaga.sch.id",
    status: "Pending",
    parentName: "Agus Ginanjar",
    parentOccupation: "Buruh Swasta",
    studentAddress: "Kp. Besar RT 12/RW 06, Lemo, Teluknaga, Tangerang",
    birthPlaceDate: "Tangerang, 3 September 2008"
  },
  {
    id: "stud-6",
    name: "Siti Nurhaliza",
    nis: "242510006",
    className: "XII DKV 2",
    companyId: "comp-1",
    skills: ["Adobe Illustrator", "Copywriting", "Branding Logo", "Packaging Design"],
    portfolioUrl: "behance.net/siti_haliza_design",
    portfolioHighlight: "Redesain kemasan produk kripik pisang lokal unggulan",
    phone: "081234567806",
    email: "siti.haliza@siswa.smkn1teluknaga.sch.id",
    status: "Unassigned",
    unassignedStartDate: "2026-05-20",
    parentName: "Muhammad Zen",
    parentOccupation: "Nelayan",
    studentAddress: "Kp. Muara RT 02/RW 01, Tanjung Pasir, Tangerang",
    birthPlaceDate: "Tangerang, 8 Juni 2008"
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  letterNoFormat: "421.5/###-SMKN14-KAB-TNG/DKV/2026",
  headOfDepartment: "Surti wijaya, S.Kom., Gr.",
  headOfDepartmentNIP: "19841203 200903 2 004",
  schoolYear: "2025/2026",
  issueDate: "10 Juni 2026",
  schoolEmail: "kajur.smkn14@gmail.com",
  driveTemplateFolderId: "1A7B9C3D8F_Templates_DKV",
  driveOutputFolderId: "2X8Y6Z5W4V_Output_PKL2026",
  headOfHubin: "H. FERY UPDY, M.Kom.",
  headOfHubinNIP: "19780515 200501 1 002",
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
  schoolLogoBase64: "", // starts empty, fellback to standard logo design
  schoolHeaderGov: "PEMERINTAH PROVINSI BANTEN\nDINAS PENDIDIKAN DAN KEBUDAYAAN",
  schoolHeaderName: "SMK NEGERI 14 KABUPATEN TANGERANG",
  schoolHeaderAddress: "Jl. Raya Laban, Kec. Solear, Kabupaten Tangerang, Banten 15730",
  schoolHeaderContact: "Email: info@smkn14kabtangerang.sch.id &nbsp;&nbsp; Web: smkn14kabtangerang.sch.id",
  schoolFooterText: "Dokumen ini diterbitkan secara resmi dari Sistem Informasi SI-KAJUR SMK Negeri 14 Kabupaten Tangerang.",
  googleSheetsApiKey: "",
  googleDriveApiKey: "",
  draftTemplates: [
    {
      id: "tmpl-standar",
      name: "Permohonan PKL Standar",
      subject: "Permohonan Praktek Kerja Lapangan (PKL) DKV - {{STUDENT_NAME}} - {{COMPANY_NAME}}",
      body: `Kepada Yth.
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

Kami sangat berharap Bapak/Ibu HRD berkenan menerima anak didik kami untuk menimba ilmu industri kreatif di {{COMPANY_NAME}}. Surat resmi pengantar, CV, beserta pakta integritas siap kami lampirkan.

Atas perhatian dan kerjasama Bapak/Ibu HRD, kami ucapkan terima kasih.

Hormat kami,
Kepala Program Studi DKV
{{HEAD_OF_DEPARTMENT}}`
    },
    {
      id: "tmpl-unggulan",
      name: "Rekomendasi Siswa Unggulan / Berprestasi",
      subject: "Rekomendasi Khusus Siswa DKV Unggulan - {{STUDENT_NAME}} di {{COMPANY_NAME}}",
      body: `Kepada Yth.
Bapak/Ibu Pimpinan / HRD {{COMPANY_NAME}}
Di Tempat

Dengan hormat,

Melalui surat ini, kami dari Program Studi Desain Komunikasi Visual (DKV) SMK Negeri 14 Kabupaten Tangerang ingin memberikan rekomendasi khusus untuk salah satu siswa berprestasi terbaik kami untuk magang:

Nama: {{STUDENT_NAME}}
Kelas: {{STUDENT_CLASS}}
Sekolah: SMK Negeri 14 Kabupaten Tangerang

Siswa bersangkutan memiliki rekam jejak akademis yang solid serta keahlian mendalam di bidang:
{{STUDENT_SKILLS}}

Sebagai lembar pertimbangan, berikut adalah lampiran karya portofolio digital terpilih siswa:
{{STUDENT_PORTFOLIO}}
Deskripsi Kompetensi Unggulan: {{PORTFOLIO_HIGHLIGHT}}

{{CUSTOM_NOTES}}

Kami sangat yakin dedikasi, kedisiplinan, dan gairah kreatif siswa bersangkutan akan memberikan kontribusi nyata yang bernilai tambah bagi operasional tim kreatif {{COMPANY_NAME}}.

Atas bimbingan profesional dan kerjasama luar biasa Bapak/Ibu HRD, kami sampaikan terima kasih.

Hormat kami,
Kepala Program Studi DKV
{{HEAD_OF_DEPARTMENT}}`
    },
    {
      id: "tmpl-kemitraan",
      name: "Penawaran Kemitraan DUDI Baru",
      subject: "Undangan Kerjasama Kemitraan Praktik Kerja Lapangan (PKL) DKV - {{COMPANY_NAME}}",
      body: `Kepada Yth.
Bapak/Ibu Pimpinan / HRD {{COMPANY_NAME}}
Di Tempat

Dengan hormat,

Hubungan sinergis antara instansi pendidikan vokasi nasional dengan dunia usaha dan dunia industri (DUDI) merupakan pilar utama dalam mencetak talenta muda kreatif yang kompeten dan siap bersaing.

Oleh karena itu, kami dari SMK Negeri 14 Kabupaten Tangerang bermaksud menjajaki peluang kerjasama kemitraan PKL dengan {{COMPANY_NAME}}. Sebagai langkah awal, kami mengajukan usulan penempatan siswa terbaik kami:

Nama: {{STUDENT_NAME}} (Kelas {{STUDENT_CLASS}})
Sektor Keahlian:
{{STUDENT_SKILLS}}
Portofolio Digital: {{STUDENT_PORTFOLIO}}

{{CUSTOM_NOTES}}

Kami percaya bahwa kemitraan strategis ini akan memberikan kontribusi positif bagi kedua belah pihak. Diskusi lanjutan terkait MoU dan rencana detail penempatan dapat kami laksanakan sesuai waktu luang Bapak/Ibu.

Atas waktu, kesediaan, dan atensi luar biasa dari Bapak/Ibu Pimpinan, kami ucapkan banyak terima kasih.

Hormat kami,
Kepala Program Studi DKV
{{HEAD_OF_DEPARTMENT}}`
    },
    {
      id: "tmpl-followup",
      name: "Follow-Up Pengajuan Proposal",
      subject: "Konfirmasi Kelanjutan Berkas Permohonan PKL Siswa DKV - {{STUDENT_NAME}} - {{COMPANY_NAME}}",
      body: `Kepada Yth.
Bapak/Ibu Tim HRD {{COMPANY_NAME}}
Di Tempat

Dengan hormat,

Menindaklanjuti berkas lamaran dan surat pengantar pengajuan Praktik Kerja Lapangan (PKL) siswa DKV dari SMK Negeri 14 Kabupaten Tangerang yang telah kami kirimkan sebelumnya, kami bermaksud mengonfirmasi kemajuan permohonan tersebut atas nama:

Siswa: {{STUDENT_NAME}}
Kelas: {{STUDENT_CLASS}}
Tujuan: {{COMPANY_NAME}}

Portofolio Karya Siswa:
{{STUDENT_PORTFOLIO}}

{{CUSTOM_NOTES}}

Kira-kira apakah ada informasi tambahan, kebutuhan wawancara daring/luring, atau tes teknis tersendiri yang perlu dipersiapkan oleh siswa kami untuk melengkapi prasyarat penerimaan magang?

Terima kasih banyak atas keramahan, bimbingan, dan kesempatan kemitraan yang diberikan kepada civitas akademika kami.

Hormat kami,
Kepala Program Studi DKV
{{HEAD_OF_DEPARTMENT}}`
    }
  ],
  activeDraftTemplateId: "tmpl-standar",
  themeColor: "#3b82f6"
};

export const DEFAULT_LOGBOOKS: LogbookEntry[] = [
  {
    id: "log-1",
    studentId: "stud-1",
    date: "2026-07-01",
    day: "Rabu",
    activity: "Menerima pengarahan (creative briefing) untuk proyek rebranding kemasan UMKM Keripik Pisang. Membuat moodboard visual.",
    toolsUsed: ["Adobe Illustrator", "Canva"],
    projectLink: "https://behance.net/gallery/moodboard-pisang-teluknaga",
    obstacle: "Menemukan warna kontras yang pas agar tetap terlihat organik.",
    solution: "Mengeksplorasi palet warna earth-tone dengan aksen kuning pisang cerah.",
    approvedByDudi: true,
    approvedByTeacher: true
  },
  {
    id: "log-2",
    studentId: "stud-1",
    date: "2026-07-02",
    day: "Kamis",
    activity: "Mulai menggambar 3 sketsa kasar alternatif maskot pembungkus dan wordmark logo DKV.",
    toolsUsed: ["Adobe Illustrator"],
    projectLink: "",
    obstacle: "Kesulitan proporsi karakter maskot kartun.",
    solution: "Menggunakan grid sirkular sederhana untuk proporsi tubuh maskot.",
    approvedByDudi: true,
    approvedByTeacher: true
  },
  {
    id: "log-3",
    studentId: "stud-1",
    date: "2026-07-03",
    day: "Jumat",
    activity: "Pengerjaan vektorisasi (digital tracing) sketsa logo terpilih. Mengatur tipografi utama.",
    toolsUsed: ["Adobe Illustrator"],
    projectLink: "https://behance.net/portfolio-all/pisang-rebrand-logo",
    obstacle: "Beberapa titik jangkar vektor kurang halus (zipper edge).",
    solution: "Menggunakan Smooth Tool dan mengatur anchor point minimalis.",
    approvedByDudi: true,
    approvedByTeacher: false
  },
  {
    id: "log-4",
    studentId: "stud-1",
    date: "2026-07-06",
    day: "Senin",
    activity: "Membuat standar lembar Graphic Standard Manual (GSM) untuk pedoman warna utama dan sekunder korporat.",
    toolsUsed: ["Adobe Illustrator"],
    projectLink: "https://drive.google.com/drive/u/0/folders/mock-gsm",
    obstacle: "Penentuan kode warna CMYK vs RGB untuk standar industri.",
    solution: "Mengonversi seluruh warna melalui color generator swatches di Illustrator.",
    approvedByDudi: false,
    approvedByTeacher: false
  },
  {
    id: "log-5",
    studentId: "stud-2",
    date: "2026-07-01",
    day: "Rabu",
    activity: "Briefing alur pipeline produksi animasi pendek 'Legenda Tanjung Pasir'. Pembagian aset latar belakang (background design).",
    toolsUsed: ["Clip Studio Paint"],
    projectLink: "https://artstation.com/amalia_putri_art/lemo-bg",
    obstacle: "Mencocokkan gaya arsitektur rumah pesisir tradisional Banten.",
    solution: "Melakukan studi foto referensi dari internet mengenai perkampungan nelayan Tangerang.",
    approvedByDudi: true,
    approvedByTeacher: true
  },
  {
    id: "log-6",
    studentId: "stud-2",
    date: "2026-07-02",
    day: "Kamis",
    activity: "Pembuatan sketsa rancangan background keyframe 1-3 dengan teknik perspektif 2 titik hilang.",
    toolsUsed: ["Clip Studio Paint"],
    projectLink: "",
    obstacle: "Garis perspektif distorsi di sudut lebar kertas digital.",
    solution: "Mengaktifkan fitur Perspective Ruler Tool di Clip Studio Paint.",
    approvedByDudi: true,
    approvedByTeacher: true
  },
  {
    id: "log-7",
    studentId: "stud-2",
    date: "2026-07-03",
    day: "Jumat",
    activity: "Pewarnaan dasar (flat color paint) aset lanskap background laut dan pepohonan.",
    toolsUsed: ["Clip Studio Paint", "Adobe Photoshop"],
    projectLink: "https://drive.google.com/file/d/bg-animation",
    obstacle: "Kontras pencahayaan sunset kurang menonjol.",
    solution: "Menambahkan layer blending bermode Color Dodge dengan opacity 45%.",
    approvedByDudi: true,
    approvedByTeacher: true
  },
  {
    id: "log-8",
    studentId: "stud-3",
    date: "2026-06-25",
    day: "Kamis",
    activity: "Pengenalan mesin cetak digital offset Konica Minolta dan plotter outdoor. Belajar mengoperasikan mesin potong kertas hidrolik.",
    toolsUsed: ["CorelDraw"],
    projectLink: "",
    obstacle: "Suara mesin bising dan cara setting kertas cukup detail.",
    solution: "Selalu mendampingi supervisor sambil mencatat urutan menekan tombol pengaturan media.",
    approvedByDudi: true,
    approvedByTeacher: true
  },
  {
    id: "log-9",
    studentId: "stud-3",
    date: "2026-06-26",
    day: "Jumat",
    activity: "Mendesain spanduk MMT pesanan Pemda Teluknaga untuk kampanye kebersihan lingkungan pesisir.",
    toolsUsed: ["CorelDraw", "Adobe Photoshop"],
    projectLink: "https://dribbble.com/bagas_printdesign/spanduk-pesisir",
    obstacle: "File foto kiriman warga resolusinya terlalu pecah (low res).",
    solution: "Melakukan upscaling AI foto tersebut dan menambahkan efek noise filter agar menyamarkan pikselasi.",
    approvedByDudi: true,
    approvedByTeacher: true
  }
];

export const DEFAULT_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: "log-act-1",
    timestamp: "10 Juni 2026, 08:30 WIB",
    user: "surtiwijaya26@guru.smk.belajar.id",
    action: "Inisialisasi Database",
    details: "Basis data awal siswa XII DKV sebanyak 10 siswa dan 5 DUDI mitra berhasil diimpor.",
    category: "sistem"
  },
  {
    id: "log-act-2",
    timestamp: "11 Juni 2026, 09:12 WIB",
    user: "surtiwijaya26@guru.smk.belajar.id",
    action: "Ubah Kuota Perusahaan",
    details: "Mengubah kuota target PT. Arise Creative Agency dari 2 menjadi 3 slot.",
    category: "perusahaan"
  },
  {
    id: "log-act-3",
    timestamp: "11 Juni 2026, 14:45 WIB",
    user: "surtiwijaya26@guru.smk.belajar.id",
    action: "Ubah Status Siswa",
    details: "Mengubah status Bagas Wijaya (NIS: 232410112) menjadi 'Pending' setelah pengiriman berkas lamaran.",
    category: "siswa"
  }
];


