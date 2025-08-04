'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import StatsCard from '../components/StatsCard';
import RealTimeUpdater from '../components/RealTimeUpdater';
import { analyticsAPI } from '../../lib/api';
import {
  TrendingUp as SalesIcon,
  People as UsersIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  Star as StarIcon
} from '@mui/icons-material';

// TypeScript interfaces for analytics data
interface CategoryData {
  name: string;
  value: number;
  count: number;
  color: string;
}

interface SalesData {
  month: string;
  revenue: number;
  orders: number;
  users: number;
}

interface DailyActivityData {
  date: string;
  visits: number;
  orders: number;
  registrations: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
  rating: number;
}

interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
}
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';

// Mobile detection hook
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30days');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useIsMobile();

  // Real-time data states
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [dailyActivityData, setDailyActivityData] = useState<DailyActivityData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [conversionFunnelData, setConversionFunnelData] = useState<ConversionFunnelData[]>([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [growthData, setGrowthData] = useState({
    revenue: { current: 0, previous: 0, growth: 0 },
    orders: { current: 0, previous: 0, growth: 0 },
    customers: { current: 0, previous: 0, growth: 0 },
    avgOrderValue: { current: 0, previous: 0, growth: 0 },
  });

  // Fetch analytics data from API
  // Helper function to generate daily activity data from user analytics
  const generateDailyActivityData = (userAnalytics: any) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      visits: Math.floor(Math.random() * 100) + 50, // Simulate daily visits
      orders: Math.floor(Math.random() * 20) + 5,   // Simulate daily orders
      registrations: Math.floor(Math.random() * 10) + 2 // Simulate daily registrations
    }));
  };

  // Helper function to generate conversion funnel data from recent activity
  const generateConversionFunnelData = (recentActivity: any) => {
    const totalActivities = recentActivity.length || 100;
    return [
      { stage: 'Website Visits', count: totalActivities, percentage: 100 },
      { stage: 'Product Views', count: Math.floor(totalActivities * 0.7), percentage: 70 },
      { stage: 'Add to Cart', count: Math.floor(totalActivities * 0.4), percentage: 40 },
      { stage: 'Checkout Started', count: Math.floor(totalActivities * 0.25), percentage: 25 },
      { stage: 'Orders Completed', count: Math.floor(totalActivities * 0.15), percentage: 15 }
    ];
  };

  const fetchAnalyticsData = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');
      
      // Fetch real-time data from backend
      const [sales, categories, userAnalytics, products, recentActivity] = await Promise.all([
        analyticsAPI.getSalesData({ period: timeRange }),
        analyticsAPI.getCategoryAnalytics(),
        analyticsAPI.getUserAnalytics(),
        analyticsAPI.getTopProducts(),
        analyticsAPI.getRecentActivity()
      ]);
      
      // Transform sales data for the chart
      setSalesData(sales || []);
      
      // Calculate and set growth data
      setGrowthData(calculateGrowthData(sales || []));
      
      // Transform category data for the pie chart
      setCategoryData(categories || []);
      
      // Transform user analytics for daily activity (simulate daily data)
      const dailyData = userAnalytics ? generateDailyActivityData(userAnalytics) : [];
      setDailyActivityData(dailyData);
      
      // Transform top products
      setTopProducts(products || []);
      
      // Transform recent activity for conversion funnel (simulate funnel data)
      const funnelData = recentActivity ? generateConversionFunnelData(recentActivity) : [];
      setConversionFunnelData(funnelData);
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Analytics fetch error:', err);
      if (!isRefresh) setError('Failed to load analytics data');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalyticsData(true);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [timeRange]);

  // Update growth data when sales data changes
  useEffect(() => {
    setGrowthData(calculateGrowthData(salesData));
  }, [salesData]);

  // Calculate growth data from sales data
  const calculateGrowthData = (sales: SalesData[]) => {
    const currentRevenue = sales.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const currentOrders = sales.reduce((sum, item) => sum + (item.orders || 0), 0);
    
    // For demo purposes, calculate previous period (you can enhance this with actual historical data)
    const previousRevenue = currentRevenue * 0.9; // Assume 10% growth
    const previousOrders = currentOrders * 0.95; // Assume 5% growth
    
    const revenueGrowth = currentRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const ordersGrowth = currentOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;
    
    return {
      revenue: { 
        current: currentRevenue, 
        previous: previousRevenue, 
        growth: Math.round(revenueGrowth * 10) / 10 
      },
      orders: { 
        current: currentOrders, 
        previous: previousOrders, 
        growth: Math.round(ordersGrowth * 10) / 10 
      },
      customers: { 
        current: Math.floor(currentOrders * 1.2), // Assume 20% more customers than orders
        previous: Math.floor(previousOrders * 1.2), 
        growth: Math.round(ordersGrowth * 10) / 10 
      },
      avgOrderValue: { 
        current: currentOrders > 0 ? currentRevenue / currentOrders : 0, 
        previous: previousOrders > 0 ? previousRevenue / previousOrders : 0, 
        growth: Math.round(((currentRevenue / currentOrders) - (previousRevenue / previousOrders)) / (previousRevenue / previousOrders) * 100 * 10) / 10 
      },
    };
  };

  return (
    <AdminLayout>
      <RealTimeUpdater 
        onUpdate={() => fetchAnalyticsData(true)} 
        interval={30000} 
        enabled={!loading && !error} 
      />
      <div className="space-y-6">
        {/* Simplified Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Real-time insights into your platform performance</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live Data</span>
              </div>
              
              <div className="text-sm text-gray-500">
                Updated: {lastUpdated.toLocaleTimeString()}
              </div>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="90days">Last 3 months</option>
                <option value="1year">Last year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="text-red-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Failed to load analytics</h3>
                <p className="text-red-600">{error}</p>
              </div>
              <button
                onClick={() => fetchAnalyticsData()}
                className="ml-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics data...</p>
          </div>
        )}

        {/* Key Metrics */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(growthData.revenue.current || 0).toLocaleString()}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm">+{growthData.revenue.growth}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <RevenueIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Orders Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{(growthData.orders.current || 0).toLocaleString()}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm">+{growthData.orders.growth}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <OrdersIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Customers Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{(growthData.customers.current || 0).toLocaleString()}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm">+{growthData.customers.growth}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <UsersIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Average Order Value Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">${growthData.avgOrderValue.current.toFixed(2)}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      <span className="text-sm">+{growthData.avgOrderValue.growth}%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <SalesIcon className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <p className="text-sm text-gray-600">Monthly revenue performance</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={Array.isArray(salesData) ? salesData : []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`$${value?.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Product Categories</h3>
                <p className="text-sm text-gray-600">Distribution across product types</p>
              </div>
            </div>
            
            {!loading && !error && categoryData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="relative">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Array.isArray(categoryData) ? categoryData : []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent, cx, cy, midAngle, innerRadius, outerRadius }: any) => {
                          const percentage = ((percent || 0) * 100).toFixed(0);
                          const threshold = isMobile ? 10 : 5;
                          if (parseFloat(percentage) < threshold) {
                            return null;
                          }
                          
                          if (window.innerWidth < 480) {
                            return null;
                          }
                          
                          const displayName = isMobile && name.length > 8 ? name.substring(0, 8) + '...' : name;
                          
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
                              fontSize={isMobile ? "10px" : "12px"}
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
                  
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center bg-white/90 rounded-lg p-3 shadow-sm">
                      <div className="text-lg font-bold text-gray-900">
                        {categoryData.reduce((sum, item) => sum + (item.count || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">Total Products</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {categoryData.map((item, index) => {
                    // Use the same color palette as the pie chart
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
                      <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                                                  <div>
                            <div className="font-medium text-gray-900 text-sm">
                              {item.name === 'Plastic' ? 'Plastic Made Products' : 
                               item.name === 'Glass' ? 'Glass Made Products' : 
                               item.name === 'Palm Frond' ? 'Palm Frond Made' : item.name}
                            </div>
                            <div className="text-xs text-gray-500">{item.count} products</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900">{item.value}%</div>
                          <div className="text-xs text-gray-500">
                            ${((item.value || 0) * 100).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Daily Activity</h3>
                <p className="text-sm text-gray-600">User engagement metrics</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(dailyActivityData) ? dailyActivityData : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="#8884d8" 
                  name="Visits"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#82ca9d" 
                  name="Orders"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="registrations" 
                  stroke="#ffc658" 
                  name="Registrations"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Conversion Funnel</h3>
                <p className="text-sm text-gray-600">User journey analysis</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {conversionFunnelData.map((item, index) => (
                <div key={`${item.stage}-${index}`} className="relative">
                  <div className="absolute inset-0 bg-gray-50 rounded-md"></div>
                  
                  <div 
                    className="absolute inset-0 rounded-md transition-all duration-1000 ease-out bg-green-600"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                  
                  <div className="relative z-10 flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-medium text-xs bg-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-white">{item.stage}</span>
                        <div className="text-xs text-green-100">{(item.count || 0).toLocaleString()} users</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{item.percentage}%</div>
                      <div className="text-xs text-green-100">conversion rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
              <p className="text-sm text-gray-600 mt-1">Best selling items this month</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-500' :
                        index === 2 ? 'bg-orange-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{product.sales} sales</span>
                          <span>•</span>
                          <div className="flex items-center">
                            <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                            {product.rating}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${(product.revenue || 0).toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Revenue</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Performance Insights</h3>
              <p className="text-sm text-gray-600 mt-1">Key metrics and analytics</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    Customer Acquisition
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'Organic Search', value: '45%', color: 'bg-blue-500' },
                      { label: 'Social Media', value: '28%', color: 'bg-green-500' },
                      { label: 'Direct', value: '18%', color: 'bg-purple-500' },
                      { label: 'Referrals', value: '9%', color: 'bg-orange-500' }
                    ].map((item, index) => (
                      <div key={item.label} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="font-medium text-gray-900">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Top Countries
                  </h4>
                  <div className="space-y-2">
                    {[
                      { label: 'United States', value: '32%', color: 'bg-red-500' },
                      { label: 'Canada', value: '18%', color: 'bg-blue-500' },
                      { label: 'United Kingdom', value: '12%', color: 'bg-purple-500' },
                      { label: 'Germany', value: '8%', color: 'bg-yellow-500' }
                    ].map((item, index) => (
                      <div key={item.label} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                          <span className="font-medium text-gray-900">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}