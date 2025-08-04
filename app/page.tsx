'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from './components/AdminLayout';
import StatsCard from './components/StatsCard';
import {
  People as UsersIcon,
  ShoppingCart as ProductsIcon,
  Receipt as OrdersIcon,
  TrendingUp as SalesIcon,
  AttachMoney as RevenueIcon,
  Star as ReviewsIcon,
  NotificationsActive as NotificationsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../lib/api';
import RealTimeUpdater from './components/RealTimeUpdater';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  pendingOrders: number;
  totalRevenue: number;
  averageRating: number;
  monthlyStats?: {
    newUsers: number;
    monthlyRevenue: number;
  };
}

interface SalesData {
  month: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  rating: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');

      const [stats, sales, categories, products, activity] = await Promise.all([
        analyticsAPI.getDashboardStats(),
        analyticsAPI.getSalesData(),
        analyticsAPI.getCategoryAnalytics(),
        analyticsAPI.getTopProducts(),
        analyticsAPI.getRecentActivity()
      ]);

      setDashboardStats(stats);
      setSalesData(sales);
      setCategoryData(categories);
      setTopProducts(products);
      setRecentActivity(activity);
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      if (!isRefresh) setError('Failed to load dashboard data');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick Action Handlers
  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'users':
        router.push('/users');
        break;
      case 'products':
        router.push('/products');
        break;
      case 'orders':
        router.push('/orders');
        break;
      case 'analytics':
        router.push('/analytics');
        break;
      case 'notifications':
        router.push('/notifications');
        break;
      case 'settings':
        router.push('/settings');
        break;
      case 'add-product':
        router.push('/products?action=add');
        break;
      case 'send-notification':
        router.push('/notifications?action=create');
        break;
      case 'view-reports':
        router.push('/analytics');
        break;
      case 'manage-reviews':
        router.push('/reviews');
        break;
      default:
        console.log('Quick action:', action);
    }
  };

  if (loading) {
  return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!dashboardStats) {
    return (
      <AdminLayout>
        <div className="text-center p-8">
          <p className="text-gray-600">No data available</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <RealTimeUpdater 
        onUpdate={() => fetchDashboardData(true)} 
        interval={30000} 
        enabled={!loading && !error} 
      />
      <div className="space-y-8">
        {/* Simplified Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your platform.</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live</span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <StatsCard
            title="Total Users"
            value={dashboardStats.totalUsers.toLocaleString()}
            change={dashboardStats.monthlyStats ? `+${dashboardStats.monthlyStats.newUsers} this month` : 'Growing steadily'}
            changeType="positive"
            icon={<UsersIcon className="w-8 h-8" />}
          />
          <StatsCard
            title="Products"
            value={dashboardStats.totalProducts}
            change="Active products"
            changeType="positive"
            icon={<ProductsIcon className="w-8 h-8" />}
          />
          <StatsCard
            title="Pending Orders"
            value={dashboardStats.pendingOrders}
            change={dashboardStats.pendingOrders > 10 ? "Needs attention" : "Normal"}
            changeType={dashboardStats.pendingOrders > 10 ? "negative" : "positive"}
            icon={<OrdersIcon className="w-8 h-8" />}
          />
          <StatsCard
            title="Total Revenue"
            value={`$${dashboardStats.totalRevenue.toLocaleString()}`}
            change={dashboardStats.monthlyStats ? `$${dashboardStats.monthlyStats.monthlyRevenue.toLocaleString()} this month` : 'Growing'}
            changeType="positive"
            icon={<RevenueIcon className="w-8 h-8" />}
          />
          <StatsCard
            title="Avg. Rating"
            value={dashboardStats.averageRating}
            change={parseFloat(dashboardStats.averageRating.toString()) >= 4.5 ? "Excellent" : "Good"}
            changeType="positive"
            icon={<ReviewsIcon className="w-8 h-8" />}
          />
          <StatsCard
            title="Platform Health"
            value="99.9%"
            change="All systems operational"
            changeType="positive"
            icon={<SalesIcon className="w-8 h-8" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`$${value}`, name === 'revenue' ? 'Revenue' : 'Orders']} />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ fill: '#2563eb' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Categories</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
                    const percentage = ((percent || 0) * 100).toFixed(0);
                    const threshold = 5;
                    if (parseFloat(percentage) < threshold) {
                      return null;
                    }
                    
                    const displayName = name.length > 8 ? name.substring(0, 8) + '...' : name;
                    
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="white" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        fontSize="12px"
                        fontWeight="bold"
                        style={{
                          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                          pointerEvents: 'none'
                        }}
                      >
                        {`${displayName} ${percentage}%`}
                      </text>
                    );
                  }}
                  outerRadius="80%"
                  innerRadius="40%"
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#fff"
                  strokeWidth={2}
                  paddingAngle={2}
                >
                  {categoryData.map((entry, index) => {
                    // Define a unique color palette to prevent color repetition
                    const colors = [
                      '#3B82F6', // Blue
                      '#10B981', // Green
                      '#F59E0B', // Yellow
                      '#EF4444', // Red
                      '#8B5CF6', // Purple
                      '#06B6D4', // Cyan
                      '#F97316', // Orange
                      '#EC4899', // Pink
                      '#84CC16', // Lime
                      '#6366F1', // Indigo
                    ];
                    return (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    fontSize: '14px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: any, name: any) => {
                    const percentage = ((value / categoryData.reduce((sum, cat) => sum + cat.value, 0)) * 100).toFixed(1);
                    const item = categoryData.find(cat => cat.name === name);
                    return [
                      <div key="tooltip-content">
                        <div className="font-semibold">{name}</div>
                        <div className="text-sm">{percentage}% of total</div>
                        <div className="text-xs text-gray-500">{item?.count || 0} products</div>
                      </div>,
                      'Category'
                    ];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity & Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <div className="text-sm text-gray-500">Live updates</div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                      activity.type === 'order' ? 'bg-green-500' :
                      activity.type === 'user' ? 'bg-blue-500' :
                      activity.type === 'product' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
                {recentActivity.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-sm">No recent activity</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <div className="text-sm text-gray-500">Common tasks</div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {/* User Management */}
                <button 
                  onClick={() => handleQuickAction('users')}
                  className="group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition-colors"
                >
                  <div className="bg-blue-600 p-3 rounded-lg w-fit mx-auto mb-3">
                    <UsersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Manage Users</div>
                  <div className="text-xs text-gray-600">View and manage all users</div>
                </button>

                {/* Product Management */}
                <button 
                  onClick={() => handleQuickAction('products')}
                  className="group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition-colors"
                >
                  <div className="bg-green-600 p-3 rounded-lg w-fit mx-auto mb-3">
                    <ProductsIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Review Products</div>
                  <div className="text-xs text-gray-600">Approve and manage products</div>
                </button>

                {/* Order Management */}
                <button 
                  onClick={() => handleQuickAction('orders')}
                  className="group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition-colors"
                >
                  <div className="bg-purple-600 p-3 rounded-lg w-fit mx-auto mb-3">
                    <OrdersIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Process Orders</div>
                  <div className="text-xs text-gray-600">Manage and track orders</div>
                </button>

                {/* Analytics */}
                <button 
                  onClick={() => handleQuickAction('analytics')}
                  className="group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition-colors"
                >
                  <div className="bg-indigo-600 p-3 rounded-lg w-fit mx-auto mb-3">
                    <AnalyticsIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">View Analytics</div>
                  <div className="text-xs text-gray-600">Detailed platform insights</div>
                </button>

                {/* Notifications */}
                <button 
                  onClick={() => handleQuickAction('notifications')}
                  className="group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition-colors"
                >
                  <div className="bg-orange-600 p-3 rounded-lg w-fit mx-auto mb-3">
                    <NotificationsIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Send Notifications</div>
                  <div className="text-xs text-gray-600">Notify users and sellers</div>
                </button>

                {/* Settings */}
                <button 
                  onClick={() => handleQuickAction('settings')}
                  className="group p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-center transition-colors"
                >
                  <div className="bg-gray-600 p-3 rounded-lg w-fit mx-auto mb-3">
                    <SettingsIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">Platform Settings</div>
                  <div className="text-xs text-gray-600">Configure system settings</div>
                </button>
              </div>

              {/* Additional Quick Actions Row */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Additional Actions</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <button 
                    onClick={() => handleQuickAction('add-product')}
                    className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <AddIcon className="w-4 h-4 text-green-600" />
                    <span>Add Product</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('send-notification')}
                    className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <SendIcon className="w-4 h-4 text-blue-600" />
                    <span>Send Alert</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('view-reports')}
                    className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <ViewIcon className="w-4 h-4 text-purple-600" />
                    <span>View Reports</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('manage-reviews')}
                    className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                  >
                    <ReviewsIcon className="w-4 h-4 text-orange-600" />
                    <span>Moderate Reviews</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
    </AdminLayout>
  );
}
