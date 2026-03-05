import { NextResponse } from 'next/server';
import { queryManagers } from '@/lib/dynamodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const managers = await queryManagers();
    // Strip access_token — never expose magic link tokens to the frontend
    const safe = managers.map((m) => ({
      id: m.id,
      full_name: m.full_name,
      email: m.email,
      created_at: m.created_at,
    }));
    return NextResponse.json({ managers: safe });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch managers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
