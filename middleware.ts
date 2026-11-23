import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { countryFromHeaders, currencyFromCountry } from '@/lib/geoLocation';
import { ADMIN_GATE_COOKIE, adminGateToken, hasValidAdminGateCookie } from '@/lib/adminGate';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() || '';
  // Common misspelling of eraiiz.com — only helps once DNS for eraliz.com points here
  if (host === 'eraliz.com' || host === 'www.eraliz.com') {
    const url = request.nextUrl.clone();
    url.host = 'www.eraiiz.com';
    url.protocol = 'https:';
    url.port = '';
    return NextResponse.redirect(url, 308);
  }

  const pathname = request.nextUrl.pathname;
  const gateConfigured = Boolean(adminGateToken());
  const isAdminSurface = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');

  if (isAdminSurface && gateConfigured) {
    const gateCookie = request.cookies.get(ADMIN_GATE_COOKIE)?.value;
    if (!hasValidAdminGateCookie(gateCookie)) {
      // Hide admin entirely unless the secret gate link was opened first
      return new NextResponse('Not Found', {
        status: 404,
        headers: {
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }
  }

  const country = countryFromHeaders(request.headers);
  const response = NextResponse.next();
  if (country) {
    response.cookies.set('eraiiz_geo', `${country}:${currencyFromCountry(country)}`, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
  }

  if (isAdminSurface) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    response.headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "connect-src 'self' https:",
      ].join('; ')
    );
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
