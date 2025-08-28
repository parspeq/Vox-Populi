
import { type NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const protectedRoutes = ['/topics', '/chat', '/statistics', '/polls'];
const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
const twoFactorRoutes = ['/setup-2fa', '/verify-2fa'];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((prefix) => path.startsWith(prefix));
  const isPublicRoute = publicRoutes.includes(path);
  const isTwoFactorRoute = twoFactorRoutes.includes(path);

  const sessionCookie = req.cookies.get('session')?.value;
  const session = await decrypt(sessionCookie);
  
  const response = NextResponse.next();
  
  // Set a client identifier cookie if it doesn't exist
  if (!req.cookies.has('client-id')) {
    const clientId = crypto.randomUUID();
    response.cookies.set('client-id', clientId, {
        httpOnly: true,
        secure: true,
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
        path: '/',
    });
  }

  if (isProtectedRoute && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  // If user is logged in, redirect public/2fa routes to statistics
  if (session?.user && (isPublicRoute || isTwoFactorRoute)) {
     return NextResponse.redirect(new URL('/statistics', req.nextUrl));
  }

  if (path === '/' && !session?.user) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }
  
  if (path === '/' && session?.user) {
    return NextResponse.redirect(new URL('/statistics', req.nextUrl));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
