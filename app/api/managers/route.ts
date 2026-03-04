import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import type { Manager } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const managers = db
      .prepare('SELECT id, full_name FROM managers ORDER BY full_name')
      .all() as Manager[];

    return NextResponse.json({ managers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch managers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
