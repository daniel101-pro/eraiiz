import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionManager from "./components/SessionManager";
import NotificationManager from "./components/NotificationManager";
import { MobileMenuProvider } from "./components/MobileMenuContext";
import { SearchProvider } from "./components/SearchContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Panel - Eraiiz",
  description: "Administrative control panel for the Eraiiz platform",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MobileMenuProvider>
          <SearchProvider>
            <SessionManager>
              {children}
            </SessionManager>
            <NotificationManager />
          </SearchProvider>
        </MobileMenuProvider>
      </body>
    </html>
  );
}
