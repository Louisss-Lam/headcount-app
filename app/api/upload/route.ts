import { NextRequest, NextResponse } from 'next/server';
import { parseExcelBuffer } from '@/lib/services/excel-parser';
import { replaceAllData } from '@/lib/dynamodb';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseExcelBuffer(buffer);

    const { managers, agentCount } = await replaceAllData(rows);

    // Count agents per manager for preview
    const agentCounts = new Map<string, number>();
    for (const row of rows) {
      const count = agentCounts.get(row.managerName) ?? 0;
      agentCounts.set(row.managerName, count + 1);
    }

    const managersWithCounts = managers.map((m) => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      agentCount: agentCounts.get(m.full_name) ?? 0,
    }));

    return NextResponse.json({
      managers: managersWithCounts,
      agentCount,
      message: `Successfully imported ${agentCount} agents across ${managers.length} manager(s). Review below and click "Send All Links" when ready.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
