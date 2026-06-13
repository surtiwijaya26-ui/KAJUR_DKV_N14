/**
 * Google Sheets API v4 integration helper functions
 * Powered by access tokens retrieved from Firebase Google Auth
 */

export interface SpreadsheetInfo {
  id: string;
  url: string;
  title: string;
}

/**
 * Creates a brand new Google Spreadsheet in the user's Google Drive.
 */
export async function createSpreadsheet(
  accessToken: string,
  title: string,
  sheets?: string[]
): Promise<SpreadsheetInfo> {
  const url = "https://sheets.googleapis.com/v4/spreadsheets";
  
  const body: any = {
    properties: {
      title: title,
    }
  };

  if (sheets && sheets.length > 0) {
    body.sheets = sheets.map(s => ({
      properties: {
        title: s
      }
    }));
  }
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Create spreadsheet failed:", errText);
    throw new Error(`Gagal membuat Google Sheets: ${res.statusText}. ${errText}`);
  }

  const data = await res.json();
  return {
    id: data.spreadsheetId,
    url: data.spreadsheetUrl,
    title: data.properties.title,
  };
}

/**
 * Writes or overwrites a rectangular grid of values into a Google Spreadsheet range.
 */
export async function writeSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: any[][]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range,
      majorDimension: "ROWS",
      values,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Write spreadsheet values failed:", errText);
    throw new Error(`Gagal menulis data ke spreadsheet: ${res.statusText}`);
  }
}

/**
 * Reads all values from a specific sheet / range of an existing Google Spreadsheet.
 */
export async function getSpreadsheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Get spreadsheet values failed:", errText);
    throw new Error(`Gagal mengunduh isi spreadsheet: ${res.statusText}. Pastikan formulir URL valid dan memiliki akses penulisan/pembacaan.`);
  }

  const data = await res.json();
  return data.values || [];
}

/**
 * Extract Spreadsheet ID from standard Google Sheets sharing URLs
 */
export function extractSpreadsheetId(url: string): string | null {
  if (!url) return null;
  // Matches .../spreadsheets/d/SpreadsheetId/...
  const matches = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : url.trim();
}
