import { useState, useEffect } from 'react';
import { refreshAccessToken } from '../../utils/auth';
import { decodeJwt } from '../../utils/jwtDecode';
import { Bell, BellRing, Check, Trash2, AlertCircle, Package, ShoppingCart, User, Settings, Calendar, Clock, Wifi, WifiOff, X, ExternalLink, Eye } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      const url = process.env.NEXT_PUBLIC_API_URL + '/api/notifications';
      console.log('Fetching from URL:', url);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('API Response Status:', res.status);
      if (!res.ok) {
        const errorText = await res.text();
        console.log('API Error Response:', errorText);
        if (res.status === 401) {
          try {
            const newToken = await refreshAccessToken();
            console.log('Refreshed token:', newToken);
            const retryRes = await fetch(url, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
              },
              credentials: 'include',
            });
            if (!retryRes.ok) {
              console.log('Retry Response Status:', retryRes.status);
              throw new Error('Failed to fetch notifications');
            }
            const data = await retryRes.json();
            setNotifications(data);
          } catch (refreshErr) {
            console.error('Refresh token error:', refreshErr.message);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userId');
            window.location.href = '/login';
            return;
          }
        } else {
          throw new Error(`Failed to fetch notifications: ${res.status} - ${errorText}`);
        }
      }

      const data = await res.json();
      console.log('Fetched notifications:', data);
      setNotifications(data);
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ read: true }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(notifications.map(notif => notif._id === notificationId ? { ...notif, read: true } : notif));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleNotificationClick = async (notification) => {
    setSelectedNotification(notification);
    
    // Mark as read when opened if not already read
    if (!notification.read) {
      await handleMarkAsRead(notification._id);
    }
  };

  const getNotificationTypeInfo = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return {
          title: 'Order Notification',
          description: 'Updates about your orders and purchases',
          color: 'blue'
        };
      case 'product':
        return {
          title: 'Product Notification',
          description: 'Information about products and listings',
          color: 'green'
        };
      case 'account':
        return {
          title: 'Account Notification',
          description: 'Updates about your account and profile',
          color: 'purple'
        };
      case 'system':
        return {
          title: 'System Notification',
          description: 'Important system updates and announcements',
          color: 'gray'
        };
      default:
        return {
          title: 'Notification',
          description: 'General notification',
          color: 'blue'
        };
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
      
      for (const id of unreadIds) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({ read: true }),
        });
      }

      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClearAll = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error('Failed to clear notifications');
      }

      setNotifications([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case 'product':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'account':
        return <User className="w-5 h-5 text-purple-600" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'order':
        return 'bg-blue-100 border-blue-200';
      case 'product':
        return 'bg-green-100 border-green-200';
      case 'account':
        return 'bg-purple-100 border-purple-200';
      case 'system':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-blue-100 border-blue-200';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread':
        return !notif.read;
      case 'read':
        return notif.read;
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      // Fallback: Extract userId from accessToken
      const token = localStorage.getItem('accessToken');
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
          localStorage.setItem('userId', userId);
        }
      }
    }

    if (!userId) {
      window.location.href = '/login';
      return;
    }

    fetchNotifications();

    // Only attempt WebSocket connection if the API URL supports it
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl && apiUrl.startsWith('http')) {
      try {
        const wsUrl = apiUrl.replace('http', 'ws') + `/?userId=${userId}`;
        console.log('Attempting WebSocket connection:', wsUrl);
        const websocket = new WebSocket(wsUrl);
        setWs(websocket);

        websocket.onopen = () => {
          console.log('WebSocket connected successfully');
          setIsConnected(true);
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setNotifications(prev => [data, ...prev].filter(n => n.userId === userId));
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError);
          }
        };

        websocket.onerror = (error) => {
          console.warn('WebSocket connection failed - notifications will still work via polling');
          setIsConnected(false);
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
          // Don't auto-reconnect to avoid spam
        };
      } catch (wsError) {
        console.warn('WebSocket not supported - using polling only:', wsError);
        setIsConnected(false);
      }
    } else {
      console.log('No WebSocket support - using polling only');
      setIsConnected(false);
    }

    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      if (ws) {
        ws.close();
      }
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 md:p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-sm md:text-base text-gray-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 md:p-8">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 md:w-12 md:h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Error Loading Notifications</h3>
          <p className="text-sm md:text-base text-red-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BellRing className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              {/* Notifications heading - reduce by half */}
              <h1 className="text-sm md:text-base font-semibold text-gray-900">Notifications</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Stay updated with your account activity
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-2 text-green-600 text-xs md:text-sm">
                <Wifi className="w-3 h-3 md:w-4 md:h-4" />
                <span>Live</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400 text-xs md:text-sm">
                <WifiOff className="w-3 h-3 md:w-4 md:h-4" />
                <span>Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 px-2 md:px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs md:text-sm font-medium"
              >
                <Check className="w-3 h-3 md:w-4 md:h-4" />
                Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-2 px-2 md:px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs md:text-sm font-medium"
              >
                <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        {filteredNotifications.length === 0 ? (
          <div className="p-6 md:p-12 text-center">
            <Bell className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
              {filter === 'unread' ? 'No unread notifications' : 
               filter === 'read' ? 'No read notifications' : 
               'No notifications yet'}
            </h3>
            <p className="text-sm md:text-base text-gray-500">
              {filter === 'all' ? 
                "You'll see notifications here when there's activity on your account." :
                `Switch to "${filter === 'unread' ? 'All' : 'All'}" to see ${filter === 'unread' ? 'all' : 'other'} notifications.`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
                         {filteredNotifications.map((notif, index) => (
               <div
                 key={notif._id}
                 onClick={() => handleNotificationClick(notif)}
                 className={`p-4 md:p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                   !notif.read ? 'bg-blue-50/50' : ''
                 }`}
               >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Icon */}
                  <div className={`p-1.5 md:p-2 rounded-lg ${getNotificationColor(notif.type)}`}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xs md:text-sm font-medium text-gray-900 capitalize">
                            {notif.type || 'Notification'}
                          </h3>
                          {!notif.read && (
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-gray-700 text-xs md:text-sm mb-2">
                          {notif.message}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(notif.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>

                                             {/* Action Buttons */}
                       <div className="flex items-center gap-2">
                         <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleNotificationClick(notif);
                           }}
                           className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                         >
                           <Eye className="w-3 h-3" />
                           View
                         </button>
                         {!notif.read && (
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleMarkAsRead(notif._id);
                             }}
                             className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium transition-colors"
                           >
                             <Check className="w-3 h-3" />
                             Mark Read
                           </button>
                         )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
                     </div>
         )}
       </div>

       {/* Notification Detail Modal */}
       {selectedNotification && (
         <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             {/* Modal Header */}
             <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-xl">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${getNotificationColor(selectedNotification.type)}`}>
                     {getNotificationIcon(selectedNotification.type)}
                   </div>
                   <div>
                     <h2 className="text-xl font-semibold text-gray-900">
                       {getNotificationTypeInfo(selectedNotification.type).title}
                     </h2>
                     <p className="text-sm text-gray-500">
                       {getNotificationTypeInfo(selectedNotification.type).description}
                     </p>
                   </div>
                 </div>
                 <button
                   onClick={() => setSelectedNotification(null)}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                 >
                   <X className="w-5 h-5 text-gray-500" />
                 </button>
               </div>
             </div>

             {/* Modal Content */}
             <div className="p-6 space-y-6">
               {/* Status Badge */}
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   {!selectedNotification.read ? (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                       <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                       Unread
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                       <Check className="w-3 h-3" />
                       Read
                     </span>
                   )}
                   <span className="text-xs text-gray-500 capitalize">
                     {selectedNotification.type || 'General'}
                   </span>
                 </div>
                 
                 {/* Timestamp */}
                 <div className="flex items-center gap-4 text-sm text-gray-500">
                   <div className="flex items-center gap-1">
                     <Calendar className="w-4 h-4" />
                     {new Date(selectedNotification.createdAt).toLocaleDateString('en-US', {
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     })}
                   </div>
                   <div className="flex items-center gap-1">
                     <Clock className="w-4 h-4" />
                     {new Date(selectedNotification.createdAt).toLocaleTimeString([], { 
                       hour: '2-digit', 
                       minute: '2-digit' 
                     })}
                   </div>
                 </div>
               </div>

               {/* Message Content */}
               <div className="bg-gray-50 rounded-lg p-6">
                 <h3 className="text-sm font-medium text-gray-700 mb-3">Message</h3>
                 <div className="prose prose-sm max-w-none">
                   <p className="text-gray-900 leading-relaxed text-base">
                     {selectedNotification.message}
                   </p>
                 </div>
               </div>

               {/* Additional Details */}
               {selectedNotification.data && (
                 <div className="bg-blue-50 rounded-lg p-6">
                   <h3 className="text-sm font-medium text-blue-900 mb-3 flex items-center gap-2">
                     <AlertCircle className="w-4 h-4" />
                     Additional Information
                   </h3>
                   <div className="text-sm text-blue-800">
                     <pre className="whitespace-pre-wrap font-sans">
                       {typeof selectedNotification.data === 'object' 
                         ? JSON.stringify(selectedNotification.data, null, 2)
                         : selectedNotification.data
                       }
                     </pre>
                   </div>
                 </div>
               )}

               {/* Quick Actions */}
               <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                 <div className="flex items-center gap-3">
                   {!selectedNotification.read && (
                     <button
                       onClick={() => {
                         handleMarkAsRead(selectedNotification._id);
                         setSelectedNotification({...selectedNotification, read: true});
                       }}
                       className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                     >
                       <Check className="w-4 h-4" />
                       Mark as Read
                     </button>
                   )}
                   
                   {/* Action based on notification type */}
                   {selectedNotification.type === 'order' && (
                     <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                       <ExternalLink className="w-4 h-4" />
                       View Order
                     </button>
                   )}
                   
                   {selectedNotification.type === 'product' && (
                     <button className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                       <ExternalLink className="w-4 h-4" />
                       View Product
                     </button>
                   )}
                 </div>

                 <button
                   onClick={() => setSelectedNotification(null)}
                   className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
                 >
                   Close
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }