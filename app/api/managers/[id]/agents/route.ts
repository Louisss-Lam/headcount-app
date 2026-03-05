import { NextRequest, NextResponse } from 'next/server';
import { queryAgents } from '@/lib/dynamodb';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agents = await queryAgents(params.id);
    return NextResponse.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch agents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
