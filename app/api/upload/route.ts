import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { parseExcelBuffer } from '@/lib/services/excel-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseExcelBuffer(buffer);

    const db = getDb();

    // Fresh start — clear old roster data
    db.exec('DELETE FROM agents');
    db.exec('DELETE FROM managers');

    const upsertManager = db.prepare(
      'INSERT INTO managers (full_name) VALUES (?) ON CONFLICT(full_name) DO UPDATE SET full_name = full_name RETURNING id'
    );
    const upsertAgent = db.prepare(
      'INSERT INTO agents (full_name, manager_id, avatar_seed) VALUES (?, ?, ?) ON CONFLICT(full_name, manager_id) DO UPDATE SET full_name = full_name RETURNING id'
    );

    const managersMap = new Map<string, number>();
    let agentCount = 0;

    const insertAll = db.transaction(() => {
      for (const row of rows) {
        let managerId = managersMap.get(row.managerName);
        if (managerId === undefined) {
          const result = upsertManager.get(row.managerName) as { id: number };
          managerId = result.id;
          managersMap.set(row.managerName, managerId);
        }
        const seed = `${row.agentName}-${row.managerName}`;
        upsertAgent.get(row.agentName, managerId, seed);
        agentCount++;
      }
    });

    insertAll();

    // Return the managers that were found
    const managers = Array.from(managersMap.entries()).map(([name, id]) => ({
      id,
      full_name: name,
    }));

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
