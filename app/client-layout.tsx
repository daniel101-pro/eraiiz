'use client';

import "./globals.css";
import { CartProvider } from './context/CartContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AIAssistant from './components/AIAssistant/AIAssistant';

// Get the Google Client ID from environment variables
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '429710625418-18g91vccienk7nhsvchdeehctl9dsl.apps.googleusercontent.com';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link
          href="https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-onest antialiased">
        <GoogleOAuthProvider clientId={googleClientId}>
          <CartProvider>
            <CurrencyProvider>
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
            </CurrencyProvider>
          </CartProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
