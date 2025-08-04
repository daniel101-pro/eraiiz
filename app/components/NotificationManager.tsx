'use client';

import { useEffect, useState } from 'react';
import Notification, { NotificationProps } from './Notification';

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export default function NotificationManager() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  useEffect(() => {
    const handleShowNotification = (event: CustomEvent) => {
      const { type, title, message, duration = 5000 } = event.detail;
      
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        type,
        title,
        message,
        duration
      };
      
      setNotifications(prev => [...prev, newNotification]);
    };

    // Listen for custom notification events
    window.addEventListener('showNotification', handleShowNotification as EventListener);

    return () => {
      window.removeEventListener('showNotification', handleShowNotification as EventListener);
    };
  }, []);

  const handleCloseNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          duration={notification.duration}
          onClose={handleCloseNotification}
        />
      ))}
    </>
  );
} 