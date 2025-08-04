'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle as OnlineIcon,
  Error as OfflineIcon,
  HourglassEmpty as WakingIcon
} from '@mui/icons-material';

export default function ServerStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'waking' | 'offline'>('checking');
  const [message, setMessage] = useState('Checking server status...');

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      setStatus('checking');
      setMessage('Checking server status...');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch('https://eraiiz-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
        signal: controller.signal
      });
      
      console.log('Server status check response:', response.status, response.statusText);

      clearTimeout(timeoutId);

      if (response.status === 503) {
        setStatus('waking');
        setMessage('🌱 Server is waking up from hibernation (Render free tier). Please wait 30-60 seconds...');
        
        // Try again after a delay
        setTimeout(() => {
          checkServerStatus();
        }, 6000);
      } else if (response.status >= 200 && response.status < 500) {
        // Any response from 200-499 means server is online and responding
        // Even 400/401 errors mean the server is working, just rejecting credentials
        setStatus('online');
        setMessage('Server is online and ready for login! ✅');
      } else {
        setStatus('offline');
        setMessage(`Server returned status ${response.status}. Please try again.`);
      }
    } catch (error: any) {
      console.log('Server status check error:', error.name, error.message);
      
      if (error.name === 'AbortError') {
        setStatus('waking');
        setMessage('🕒 Server is taking longer than usual to respond. Keep waiting...');
        setTimeout(() => {
          checkServerStatus();
        }, 8000);
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setStatus('waking');
        setMessage('🔄 Attempting to wake up hibernated server. This can take up to 60 seconds...');
        setTimeout(() => {
          checkServerStatus();
        }, 8000);
      } else {
        setStatus('waking');
        setMessage('🌐 Connecting to server... (First connection may take time)');
        setTimeout(() => {
          checkServerStatus();
        }, 6000);
      }
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'online':
        return <OnlineIcon className="w-5 h-5 text-success" />;
      case 'waking':
        return <WakingIcon className="w-5 h-5 text-warning animate-pulse" />;
      case 'offline':
        return <OfflineIcon className="w-5 h-5 text-destructive" />;
      default:
        return <WakingIcon className="w-5 h-5 text-muted-foreground animate-spin" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-success/10 border-success/20 text-success';
      case 'waking':
        return 'bg-primary/10 border-primary/20 text-primary';
      case 'offline':
        return 'bg-destructive/10 border-destructive/20 text-destructive';
      default:
        return 'bg-muted/10 border-border text-muted-foreground';
    }
  };

  return (
    <div className={`border rounded-xl p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="text-sm font-semibold">Server Status</p>
          <p className="text-xs opacity-90 mt-1">{message}</p>
        </div>
        {(status === 'waking' || status === 'offline') && (
          <button
            onClick={checkServerStatus}
            className="text-xs px-3 py-2 bg-current/10 rounded-lg border border-current/20 hover:bg-current/20 transition-colors flex items-center space-x-1 font-medium"
          >
            <span>🔄</span>
            <span>Retry</span>
          </button>
        )}
      </div>
    </div>
  );
}