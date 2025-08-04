'use client';

import { useEffect, useRef } from 'react';

interface RealTimeUpdaterProps {
  onUpdate: () => void;
  interval?: number; // in milliseconds
  enabled?: boolean;
}

export default function RealTimeUpdater({ 
  onUpdate, 
  interval = 30000, // 30 seconds default
  enabled = true 
}: RealTimeUpdaterProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Set up interval for updates
    intervalRef.current = setInterval(() => {
      onUpdate();
    }, interval);

    // Set up visibility change listener for when user comes back to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        onUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onUpdate, interval, enabled]);

  // This component doesn't render anything
  return null;
}