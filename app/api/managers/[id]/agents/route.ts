import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Agent } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const managerId = parseInt(params.id, 10);
    if (isNaN(managerId)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    const db = getDb();
    const agents = db
      .prepare('SELECT * FROM agents WHERE manager_id = ? ORDER BY full_name')
      .all(managerId) as Agent[];

    return NextResponse.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
