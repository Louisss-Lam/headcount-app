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

    return NextResponse.json({
      managers,
      agentCount,
      message: `Successfully imported ${agentCount} agents across ${managers.length} manager(s).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
