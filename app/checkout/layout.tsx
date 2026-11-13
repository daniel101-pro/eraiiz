'use client';

import type { ReactNode } from 'react';
import { CheckoutProvider } from '../context/CheckoutContext';

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <CheckoutProvider>{children}</CheckoutProvider>;
}
