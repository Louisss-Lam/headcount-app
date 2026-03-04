import * as XLSX from 'xlsx';

interface ExportRow {
  'Agent Name': string;
  Category: string;
  'Manager Name': string;
  Date: string;
  Time: string;
}

export function generateExportBuffer(rows: ExportRow[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Agent Name
    { wch: 15 }, // Category
    { wch: 25 }, // Manager Name
    { wch: 12 }, // Date
    { wch: 10 }, // Time
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Headcount');
  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}
