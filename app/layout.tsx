import type { ReactNode } from 'react';
import { Onest } from 'next/font/google';
import { metadata } from './metadata';
import ClientLayout from './client-layout';

export { metadata };

const onest = Onest({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://eraiiz-backend.onrender.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://eraiiz-backend.onrender.com" />
      </head>
      <body className={`${onest.className} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
