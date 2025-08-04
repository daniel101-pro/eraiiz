import { Metadata } from 'next';
import { metadata } from './metadata';
import ClientLayout from './client-layout';

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
