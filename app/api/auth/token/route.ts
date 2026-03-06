import { NextRequest, NextResponse } from 'next/server';
import { validateManagerToken } from '@/lib/dynamodb';

export async function POST(request: NextRequest) {
  try {
    const { managerId, token } = await request.json();

    if (!managerId || !token) {
      return NextResponse.json({ error: 'Missing managerId or token' }, { status: 400 });
    }

    const valid = await validateManagerToken(managerId, token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('headcount_auth', `manager:${managerId}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: `Token auth failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
