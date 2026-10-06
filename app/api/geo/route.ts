import { NextRequest, NextResponse } from 'next/server';
import {
  countryFromHeaders,
  countryName,
  currencyFromCountry,
  payoutProviderForCountry,
} from '@/lib/geoLocation';

export async function GET(request: NextRequest) {
  const country = countryFromHeaders(request.headers);
  const currency = currencyFromCountry(country || 'US');
  return NextResponse.json({
    country: country || '',
    countryName: countryName(country),
    currency,
    payoutProvider: country ? payoutProviderForCountry(country) : null,
  });
}
