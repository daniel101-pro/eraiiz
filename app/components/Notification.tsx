'use client';

import { useEffect, useState } from 'react';
import { 
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}

export default function Notification({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(id), 300); // Wait for fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ErrorIcon className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <WarningIcon className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
      default:
        return <InfoIcon className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 transition-all duration-300 transform";
    
    switch (type) {
      case 'success':
        return `${baseStyles} border-green-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
      case 'error':
        return `${baseStyles} border-red-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
      case 'warning':
        return `${baseStyles} border-yellow-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
      case 'info':
        return `${baseStyles} border-blue-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
      default:
        return `${baseStyles} border-blue-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`;
    }
  };

  return (
    <div className={getStyles()}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 