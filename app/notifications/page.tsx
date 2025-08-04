'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import RealTimeUpdater from '../components/RealTimeUpdater';
import {
  Search as SearchIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  NotificationsActive as NotificationIcon,
  Email as EmailIcon,
  MobileFriendly as PushIcon,
  CheckCircle as SentIcon,
  Cancel as FailedIcon,
  Pending as PendingIcon,
  Refresh as RefreshIcon,
  People as PeopleIcon,
  ShoppingCart as BuyerIcon,
  Store as SellerIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface Notification {
  _id: string;
  userId?: string;
  type: string;
  message: string;
  channel: 'in-app' | 'email' | 'push';
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  read: boolean;
  recipient?: {
    name: string;
    email: string;
  };
  targetAudience?: 'all' | 'buyers' | 'sellers';
}

interface NotificationStats {
  totalNotifications: number;
  pendingNotifications: number;
  sentNotifications: number;
  failedNotifications: number;
  successRate: number;
  totalUsers: number;
  totalBuyers: number;
  totalSellers: number;
}

interface CreateNotificationData {
  title: string;
  message: string;
  channel: 'in-app' | 'email' | 'push';
  targetAudience: 'all' | 'buyers' | 'sellers';
  type: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationStats, setNotificationStats] = useState<NotificationStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createNotificationData, setCreateNotificationData] = useState<CreateNotificationData>({
    title: '',
    message: '',
    channel: 'in-app',
    targetAudience: 'all',
    type: 'announcement'
  });
  const [sendingNotification, setSendingNotification] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch notifications from API
  const fetchNotifications = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: '20',
        search: searchTerm,
        channel: selectedChannel,
        status: selectedStatus,
        type: selectedType
      });

      const response = await api.get(`/admin/notifications?${params}`);
      const { notifications: fetchedNotifications, pagination: paginationData } = response.data;
      
      setNotifications(fetchedNotifications);
      setPagination(paginationData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notification statistics
  const fetchNotificationStats = async () => {
    try {
      const response = await api.get('/admin/notifications/stats/overview');
      setNotificationStats(response.data);
    } catch (error) {
      console.error('Error fetching notification stats:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchNotifications();
    fetchNotificationStats();
  }, []);

  // Real-time updates
  useEffect(() => {
    fetchNotifications(true);
  }, [pagination.currentPage]);

  // Filter notifications when search/filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchNotifications();
  }, [searchTerm, selectedChannel, selectedStatus, selectedType]);

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (notification.recipient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (notification.recipient?.email.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesChannel = selectedChannel === 'all' || notification.channel === selectedChannel;
    const matchesStatus = selectedStatus === 'all' || notification.status === selectedStatus;
    const matchesType = selectedType === 'all' || notification.type === selectedType;
    
    return matchesSearch && matchesChannel && matchesStatus && matchesType;
  });

  const handleNotificationAction = async (action: string, notificationId: string) => {
    try {
      switch (action) {
        case 'resend':
          await api.post(`/admin/notifications/${notificationId}/send`);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this notification?')) {
            await api.delete(`/admin/notifications/${notificationId}`);
          }
          break;
        default:
          console.log(`${action} notification:`, notificationId);
      }
      
      // Refresh data after action
      fetchNotifications(true);
      fetchNotificationStats();
    } catch (error) {
      console.error(`Error ${action} notification:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      if (selectedNotifications.length === 0) return;
      
      switch (action) {
        case 'send':
          await api.post('/admin/notifications/bulk', { 
            action: 'send', 
            notificationIds: selectedNotifications 
          });
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedNotifications.length} notifications?`)) {
            await api.post('/admin/notifications/bulk', { 
              action: 'delete', 
              notificationIds: selectedNotifications 
            });
          }
          break;
      }
      
      setSelectedNotifications([]);
      fetchNotifications(true);
      fetchNotificationStats();
    } catch (error) {
      console.error(`Error bulk ${action}:`, error);
    }
  };

  const handleCreateNotification = async () => {
    try {
      setSendingNotification(true);
      
      await api.post('/admin/notifications', {
        title: createNotificationData.title,
        message: createNotificationData.message,
        channel: createNotificationData.channel,
        targetAudience: createNotificationData.targetAudience,
        type: createNotificationData.type
      });
      
      setShowCreateModal(false);
      setCreateNotificationData({
        title: '',
        message: '',
        channel: 'in-app',
        targetAudience: 'all',
        type: 'announcement'
      });
      
      fetchNotifications(true);
      fetchNotificationStats();
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setSendingNotification(false);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllNotifications = () => {
    setSelectedNotifications(
      selectedNotifications.length === filteredNotifications.length 
        ? [] 
        : filteredNotifications.map(notification => notification._id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <EmailIcon className="w-4 h-4" />;
      case 'push': return <PushIcon className="w-4 h-4" />;
      case 'in-app': return <NotificationIcon className="w-4 h-4" />;
      default: return <NotificationIcon className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <PendingIcon className="w-4 h-4" />;
      case 'sent': return <SentIcon className="w-4 h-4" />;
      case 'failed': return <FailedIcon className="w-4 h-4" />;
      default: return <PendingIcon className="w-4 h-4" />;
    }
  };

  const getTargetAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all': return <PeopleIcon className="w-4 h-4" />;
      case 'buyers': return <BuyerIcon className="w-4 h-4" />;
      case 'sellers': return <SellerIcon className="w-4 h-4" />;
      default: return <PeopleIcon className="w-4 h-4" />;
    }
  };

  const notificationTypes = [
    'announcement', 'product_upload', 'product_approved', 'product_rejected',
    'order_placed', 'order_shipped', 'order_delivered',
    'review_reminder', 'system_maintenance', 'promotion'
  ];

  return (
    <AdminLayout>
      <RealTimeUpdater 
        onUpdate={() => {
          fetchNotifications(true);
          fetchNotificationStats();
        }} 
        interval={30000} 
        enabled={!loading} 
      />
      
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <NotificationIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Notification Center</h1>
                <p className="text-sm text-gray-500 mt-1">Send real-time notifications to all users, buyers, or sellers</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live</span>
              </div>
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <AddIcon className="w-4 h-4" />
                <span>Send Notification</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Statistics */}
        {notificationStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Sent</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.sentNotifications.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <SentIcon className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.pendingNotifications.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <PendingIcon className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.successRate}%</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <NotificationIcon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{notificationStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <PeopleIcon className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Channels</option>
                <option value="email">Email</option>
                <option value="in-app">In-App</option>
                <option value="push">Push</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>

              <button
                onClick={() => {
                  fetchNotifications(true);
                  fetchNotificationStats();
                }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedNotifications.length > 0 && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  {selectedNotifications.length} notification(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('send')}
                  className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <SendIcon className="w-4 h-4" />
                  <span>Send</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <DeleteIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Notifications Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading notifications...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
                        onChange={selectAllNotifications}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notification
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target Audience
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Channel
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => (
                    <tr key={notification._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification._id)}
                          onChange={() => toggleNotificationSelection(notification._id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {notification.type.replace('_', ' ').toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {notification.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                          {getTargetAudienceIcon(notification.targetAudience || 'all')}
                          <span className="ml-1">{notification.targetAudience || 'all'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {getChannelIcon(notification.channel)}
                          <span className="ml-1">{notification.channel}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(notification.status)}`}>
                          {getStatusIcon(notification.status)}
                          <span className="ml-1">{notification.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>Created: {new Date(notification.createdAt).toLocaleDateString()}</div>
                        {notification.sentAt && (
                          <div>Sent: {new Date(notification.sentAt).toLocaleDateString()}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleNotificationAction('view', notification._id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View Notification"
                          >
                            <ViewIcon className="w-4 h-4" />
                          </button>
                          {notification.status === 'failed' && (
                            <button
                              onClick={() => handleNotificationAction('resend', notification._id)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Resend Notification"
                            >
                              <SendIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleNotificationAction('delete', notification._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Notification"
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modern Pagination */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-4 border border-gray-100 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalNotifications)} of {pagination.totalNotifications} results
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
              {pagination.currentPage}
            </span>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Send Notification</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => setCreateNotificationData(prev => ({ ...prev, targetAudience: 'all' }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      createNotificationData.targetAudience === 'all'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <PeopleIcon className="w-6 h-6 text-gray-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">All Users</div>
                        <div className="text-sm text-gray-500">Send to everyone</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateNotificationData(prev => ({ ...prev, targetAudience: 'buyers' }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      createNotificationData.targetAudience === 'buyers'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <BuyerIcon className="w-6 h-6 text-gray-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Buyers Only</div>
                        <div className="text-sm text-gray-500">Customers only</div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateNotificationData(prev => ({ ...prev, targetAudience: 'sellers' }))}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      createNotificationData.targetAudience === 'sellers'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <SellerIcon className="w-6 h-6 text-gray-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Sellers Only</div>
                        <div className="text-sm text-gray-500">Vendors only</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Type
                </label>
                <select
                  value={createNotificationData.type}
                  onChange={(e) => setCreateNotificationData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                >
                  {notificationTypes.map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Channel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { value: 'in-app', label: 'In-App', icon: NotificationIcon, desc: 'App notifications' },
                    { value: 'email', label: 'Email', icon: EmailIcon, desc: 'Email messages' },
                    { value: 'push', label: 'Push', icon: PushIcon, desc: 'Push notifications' }
                  ].map((channel) => (
                    <button
                      key={channel.value}
                      type="button"
                      onClick={() => setCreateNotificationData(prev => ({ ...prev, channel: channel.value as any }))}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        createNotificationData.channel === channel.value
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <channel.icon className="w-6 h-6 text-gray-600" />
                        <div className="text-left">
                          <div className="font-medium text-gray-900">{channel.label}</div>
                          <div className="text-sm text-gray-500">{channel.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title
                </label>
                <input
                  type="text"
                  value={createNotificationData.title}
                  onChange={(e) => setCreateNotificationData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter notification title..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={createNotificationData.message}
                  onChange={(e) => setCreateNotificationData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your notification message..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                />
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <WarningIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This notification will be sent to {createNotificationData.targetAudience === 'all' ? 'all users' : 
                      createNotificationData.targetAudience === 'buyers' ? 'buyers only' : 'sellers only'} via {createNotificationData.channel}.
                      Please ensure your message is appropriate and necessary.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNotification}
                  disabled={!createNotificationData.title || !createNotificationData.message || sendingNotification}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {sendingNotification ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-5 h-5" />
                      <span>Send Notification</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}