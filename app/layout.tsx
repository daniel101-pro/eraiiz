import type { ReactNode } from 'react';
import { Onest } from 'next/font/google';
import { headers } from 'next/headers';
import { metadata } from './metadata';
import ClientLayout from './client-layout';
import { countryFromHeaders, currencyFromCountry } from '@/lib/geoLocation';

export { metadata };

const onest = Onest({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headerList = await headers();
  const country = countryFromHeaders(headerList);
  const currency = currencyFromCountry(country || 'US');

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      </head>
      <body className={`${onest.className} antialiased`}>
        <ClientLayout initialCountry={country} initialCurrency={currency}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
