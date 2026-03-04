import * as XLSX from 'xlsx';

interface ParsedRow {
  agentName: string;
  managerName: string;
}

export function parseExcelBuffer(buffer: Buffer): ParsedRow[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (rows.length === 0) {
    throw new Error('Excel file is empty');
  }

  const headers = Object.keys(rows[0]);
  const agentCol = headers.find((h) =>
    h.toLowerCase().includes('agent')
  );
  const managerCol = headers.find((h) =>
    h.toLowerCase().includes('manager')
  );

  if (!agentCol) {
    throw new Error(
      'Could not find an "Agent" column. Please ensure one column header contains the word "Agent".'
    );
  }
  if (!managerCol) {
    throw new Error(
      'Could not find a "Manager" column. Please ensure one column header contains the word "Manager".'
    );
  }

  const parsed: ParsedRow[] = [];
  for (const row of rows) {
    const agentName = String(row[agentCol] ?? '').trim();
    const managerName = String(row[managerCol] ?? '').trim();
    if (agentName && managerName) {
      parsed.push({ agentName, managerName });
    }
  }

  if (parsed.length === 0) {
    throw new Error('No valid rows found in the Excel file.');
  }

  return parsed;
}
