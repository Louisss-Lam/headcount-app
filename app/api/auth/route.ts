import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const appPassword = process.env.APP_PASSWORD;

    if (!appPassword) {
      return NextResponse.json(
        { error: 'APP_PASSWORD not configured' },
        { status: 500 }
      );
    }

    if (password !== appPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('headcount_auth', 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: `Auth failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('headcount_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });

  return response;
}
