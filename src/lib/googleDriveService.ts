/**
 * Google Drive API v3 integrations
 * Allows listing, creating folders, and uploading documents
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

// Function to find or create a folder in Google Drive
export async function getOrCreateFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  // Query to find existing folder
  let query = `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  if (parentFolderId) {
    query += ` and '${parentFolderId}' in parents`;
  }

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id, name)`;
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    console.error("Search folder failed:", errText);
    throw new Error(`Gagal mencari folder: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createMetadata: Record<string, any> = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  if (parentFolderId) {
    createMetadata.parents = [parentFolderId];
  }

  const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createMetadata),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error("Create folder failed:", errText);
    throw new Error(`Gagal membuat folder: ${createRes.statusText}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

// Upload document as a native Google Doc via multipart upload
export async function uploadAsGoogleDoc(
  accessToken: string,
  fileName: string,
  htmlContent: string,
  parentFolderId?: string
): Promise<DriveFile> {
  const metadata: Record<string, any> = {
    name: fileName,
    // Setting targeted mimeType to conversion target: Google Docs
    mimeType: "application/vnd.google-apps.document",
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Create document body in HTML format so it compiles to rich document styles nicely
  const body = 
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: text/html; charset=UTF-8\r\n\r\n" +
    `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="font-family: Arial, sans-serif;">${htmlContent}</body></html>` +
    closeDelimiter;

  const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink";
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Upload failed:", errText);
    throw new Error(`Gagal mengunggah berkas ke Google Drive: ${errText || res.statusText}`);
  }

  const data = await res.json();
  return data;
}

// Upload raw JSON database backup file
export async function uploadJsonBackup(
  accessToken: string,
  fileName: string,
  jsonData: any,
  parentFolderId?: string
): Promise<DriveFile> {
  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: "application/json",
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = "314159265358979323846";
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const body = 
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(jsonData, null, 2) +
    closeDelimiter;

  const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink";
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Backup upload failed:", errText);
    throw new Error(`Gagal mengunggah cadangan ke Google Drive: ${errText || res.statusText}`);
  }

  const data = await res.json();
  return data;
}

// Fetch files from our subfolder to show history of exports
export async function listExportedFiles(
  accessToken: string,
  subfolderId: string
): Promise<DriveFile[]> {
  const query = `'${subfolderId}' in parents and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=createdTime desc&fields=files(id, name, mimeType, webViewLink)`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    console.error("List files failed:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.files || [];
}
