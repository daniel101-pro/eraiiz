import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { countryFromHeaders, currencyFromCountry } from '@/lib/geoLocation';

export function middleware(request: NextRequest) {
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
