import { NextRequest, NextResponse } from 'next/server';
import { CSRFProtection, SecurityAuditLogger } from '@/lib/rateLimit';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Apply CSRF protection to API routes
  if (pathname.startsWith('/api/')) {
    const csrfResponse = CSRFProtection.middleware(request);
    if (csrfResponse) {
      SecurityAuditLogger.logCSRFViolation(request);
      return csrfResponse;
    }
  }

  // Security headers for all responses
  const response = NextResponse.next();
  
  // Add security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

  // Add CSRF token to response if it doesn't exist
  if (!request.cookies.get('csrf-token')) {
    const token = CSRFProtection.generateToken();
    response.cookies.set('csrf-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};