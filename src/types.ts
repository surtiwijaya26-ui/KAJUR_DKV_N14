export type StudentStatus = 'Unassigned' | 'Pending' | 'Ongoing' | 'Completed';

export interface Student {
  id: string;
  name: string;
  nis: string;
  className: string;
  companyId: string; // references Company.id
  skills: string[];
  portfolioUrl: string;
  portfolioHighlight: string;
  phone: string;
  email: string;
  status: StudentStatus;
  parentName: string;
  parentOccupation: string;
  studentAddress: string;
  birthPlaceDate: string; // e.g. "Tangerang, 12 April 2008"
  driveKaryaUrl?: string;
  pklStartDate?: string;
  pklEndDate?: string;
  unassignedStartDate?: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  hrdEmail: string;
  industry: string;
  slots: number;
}

export interface AppSettings {
  letterNoFormat: string; // e.g., "421.5/###-SMKN1-TNG/DKV/2026"
  headOfDepartment: string;
  headOfDepartmentNIP: string;
  schoolYear: string;
  issueDate: string;
  schoolEmail: string;
  driveTemplateFolderId: string;
  driveOutputFolderId: string;
  headOfHubin: string;
  headOfHubinNIP: string;
  emailSubjectTemplate?: string;
  emailBodyTemplate?: string;
  schoolLogoBase64?: string;
  schoolHeaderGov?: string;
  schoolHeaderName?: string;
  schoolHeaderAddress?: string;
  schoolHeaderContact?: string;
  schoolFooterText?: string;
  googleSheetsApiKey?: string;
  googleDriveApiKey?: string;
  draftTemplates?: {
    id: string;
    name: string;
    subject: string;
    body: string;
  }[];
  activeDraftTemplateId?: string;
  themeColor?: string;
}

export interface EmailHistory {
  id: string;
  studentId: string;
  studentName: string;
  companyName: string;
  hrdEmail: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export interface LogbookEntry {
  id: string;
  studentId: string;
  date: string; // e.g. "2026-07-01"
  day: string;  // e.g. "Senin"
  activity: string; // Deskripsi kegiatan/proyek
  toolsUsed: string[]; // e.g. ["Photoshop", "Illustrator", "Figma"]
  projectLink?: string; // Link hasil kerja
  obstacle?: string; // Kendala
  solution?: string; // Solusi
  approvedByDudi: boolean; // Paraf DUDI
  approvedByTeacher: boolean; // Paraf Guru DKV
}

export interface ActivityLog {
  id: string;
  timestamp: string; // e.g., "13 Juni 2026, 10:35 WIB" or formatted ISO
  user: string; // e.g., default administrator or active user email
  action: string; // e.g., "Hapus Siswa", "Ubah Kuota", "Tambah Siswa"
  details: string; // Detail deskripsi tindakan
  category: "siswa" | "perusahaan" | "sistem";
}

