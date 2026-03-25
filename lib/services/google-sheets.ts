import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!email || !key) {
    throw new Error('Google Sheets credentials not configured (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)');
  }

  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });
}

const HEADERS = ['Date', 'Time', 'Manager Name', 'Agent Name', 'Category'];

async function ensureHeaders(spreadsheetId: string) {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Read the first row to check if headers exist
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A1:E1',
  });

  const firstRow = res.data.values?.[0];
  if (!firstRow || firstRow.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1:E1',
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
  }
}

interface SubmissionRow {
  date: string;
  time: string;
  managerName: string;
  agentName: string;
  category: string;
}

export async function appendToSheet(
  spreadsheetId: string,
  rows: SubmissionRow[]
): Promise<void> {
  await ensureHeaders(spreadsheetId);

  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const values = rows.map((r) => [r.date, r.time, r.managerName, r.agentName, r.category]);

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'Sheet1!A:E',
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}
