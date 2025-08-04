'use client';

import { useState, useEffect } from 'react';
import { 
  Refresh as RefreshIcon,
  CheckCircle as SuccessIcon,
  Schedule as WaitIcon
} from '@mui/icons-material';

export default function ServerWakeUp() {
  const [isWaking, setIsWaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const wakeUpServer = async () => {
    setIsWaking(true);
    setAttempts(0);

    const maxAttempts = 6;
    let currentAttempt = 0;

    const attemptWakeUp = async (): Promise<boolean> => {
      currentAttempt++;
      setAttempts(currentAttempt);
      setLastCheck(new Date());

      try {
        const response = await fetch('https://eraiiz-backend.onrender.com/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'wakeup', password: 'test' })
        });

        // Server is awake if we get any response (even 400/401)
        if (response.status !== 503) {
          setIsWaking(false);
          return true;
        }

        // Still hibernating, try again
        if (currentAttempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          return attemptWakeUp();
        } else {
          setIsWaking(false);
          return false;
        }
      } catch (error) {
        // Network errors during wake-up are normal
        if (currentAttempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return attemptWakeUp();
        } else {
          setIsWaking(false);
          return false;
        }
      }
    };

    return attemptWakeUp();
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 theme-transition">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-card-foreground">Server Wake-Up Tool</h3>
        {isWaking && (
          <div className="flex items-center space-x-2 text-primary">
            <WaitIcon className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Attempt {attempts}/6</span>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        If the server is hibernating, use this tool to wake it up manually.
        {lastCheck && (
          <span className="block mt-1 text-xs">
            Last check: {lastCheck.toLocaleTimeString()}
          </span>
        )}
      </p>

      <button
        onClick={wakeUpServer}
        disabled={isWaking}
        className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isWaking ? (
          <>
            <RefreshIcon className="w-4 h-4 animate-spin" />
            <span>Waking up server...</span>
          </>
        ) : (
          <>
            <SuccessIcon className="w-4 h-4" />
            <span>Wake Up Server</span>
          </>
        )}
      </button>

      {isWaking && (
        <div className="mt-3 text-xs text-muted-foreground">
          <div className="bg-secondary rounded-full h-2 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-1000"
              style={{ width: `${(attempts / 6) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-center">
            This process can take up to 60 seconds for Render's free tier
          </p>
        </div>
      )}
    </div>
  );
}