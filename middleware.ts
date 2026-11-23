import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { countryFromHeaders, currencyFromCountry } from '@/lib/geoLocation';

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

  const country = countryFromHeaders(request.headers);
  const response = NextResponse.next();
  if (country) {
    response.cookies.set('eraiiz_geo', `${country}:${currencyFromCountry(country)}`, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });
  }
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
