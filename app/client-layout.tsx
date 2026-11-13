'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import './globals.css';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GOOGLE_CLIENT_ID } from '@/lib/googleClient';

const AIAssistant = dynamic(() => import('./components/AIAssistant/AIAssistant'), { ssr: false });

export default function ClientLayout({
  children,
  initialCountry = '',
  initialCurrency = 'USD',
}: {
  children: ReactNode;
  initialCountry?: string;
  initialCurrency?: string;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CurrencyProvider initialCountry={initialCountry} initialCurrency={initialCurrency}>
        <CartProvider>
            <FavoritesProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#1F2937',
                  color: '#FFFFFF',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  minWidth: '300px',
                  maxWidth: '500px',
                },
              }}
              containerStyle={{
                top: 20,
              }}
            />
            {isAdmin ? null : <AIAssistant />}
            </FavoritesProvider>
        </CartProvider>
      </CurrencyProvider>
    </GoogleOAuthProvider>
  );
}
