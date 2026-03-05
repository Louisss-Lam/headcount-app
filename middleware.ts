import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth', '/api/auth/token'];
const PUBLIC_PREFIXES = ['/_next/', '/favicon.ico'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Allow public paths
  if (
    PUBLIC_PATHS.includes(pathname) ||
    PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Allow headcount pages with token query param (token validated client-side then cookie set)
  const headcountMatch = pathname.match(/^\/headcount\/([^/]+)$/);
  if (headcountMatch && searchParams.has('token')) {
    return NextResponse.next();
  }

  // Check auth cookie
  const auth = request.cookies.get('headcount_auth')?.value;
  if (!auth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin — full access
  if (auth === 'admin') {
    return NextResponse.next();
  }

  // Manager — restricted access
  if (auth.startsWith('manager:')) {
    const managerId = auth.slice('manager:'.length);

    // Allow: /headcount/{their id}
    if (headcountMatch && headcountMatch[1] === managerId) {
      return NextResponse.next();
    }

    // Allow: /api/managers/{their id}/agents
    if (pathname === `/api/managers/${managerId}/agents`) {
      return NextResponse.next();
    }

    // Allow: /api/submissions (POST handled by the endpoint itself)
    if (pathname === '/api/submissions') {
      return NextResponse.next();
    }

    // Block everything else — redirect to their headcount page
    return NextResponse.redirect(new URL(`/headcount/${managerId}`, request.url));
  }

  // Legacy cookie value (e.g. "authenticated") — treat as admin for backwards compat
  if (auth === 'authenticated') {
    return NextResponse.next();
  }

  // Unknown cookie value — redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
