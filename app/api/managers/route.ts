import { NextResponse } from 'next/server';
import { queryManagers } from '@/lib/dynamodb';

export async function GET() {
  try {
    const managers = await queryManagers();
    return NextResponse.json({ managers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch managers';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
