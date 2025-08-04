import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cart | Eraiiz',
  description: 'View and manage your shopping cart on Eraiiz.',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 