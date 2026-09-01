'use client';

import type { ReactNode } from 'react';
import './globals.css';
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { CheckoutProvider } from './context/CheckoutContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AIAssistant from './components/AIAssistant/AIAssistant';

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '429710625418-18g91vccienk7nhsvchdeehctl9dsl.apps.googleusercontent.com';

export default function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <CurrencyProvider>
        <CartProvider>
          <CheckoutProvider>
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
            <AIAssistant />
            </FavoritesProvider>
          </CheckoutProvider>
        </CartProvider>
      </CurrencyProvider>
    </GoogleOAuthProvider>
  );
}
