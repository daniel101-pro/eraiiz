'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../lib/auth';

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const router = useRouter();
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef<number>(Date.now());

  // Check if token is expired or about to expire
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      // Consider token expired if it expires in the next 5 minutes
      return payload.exp < (currentTime + 300);
    } catch {
      return true;
    }
  };

  // Handle user activity
  const handleUserActivity = () => {
    lastActivity.current = Date.now();
  };

  // Check session validity
  const checkSession = async () => {
    const token = authService.getToken();
    
    if (!token) {
      // No token, redirect to login
      router.push('/login');
      return;
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      try {
        // Try to refresh the token
        const refreshed = await authService.refreshToken();
        if (!refreshed) {
          // Refresh failed, logout and redirect
          await authService.logout();
          router.push('/login');
        }
      } catch (error) {
        // Refresh failed, logout and redirect
        await authService.logout();
        router.push('/login');
      }
    }

    // Check for inactivity (30 minutes)
    const inactiveTime = Date.now() - lastActivity.current;
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
    
    if (inactiveTime > maxInactiveTime) {
      await authService.logout();
      router.push('/login');
    }
  };

  useEffect(() => {
    // Set up activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Start session checking
    sessionCheckInterval.current = setInterval(checkSession, 60000); // Check every minute

    // Initial session check
    checkSession();

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });

      // Clean up interval
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [router]);

  return <>{children}</>;
} 