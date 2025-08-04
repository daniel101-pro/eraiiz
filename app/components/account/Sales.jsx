'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Eye,
  MousePointer,
  Target,
  Star,
  Leaf,
  RefreshCw,
  MessageSquare,
  CreditCard,
  Gift,
  BarChart3,
  Award,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingBag,
  Heart,
  ThumbsUp,
  TrendingDown,
  Zap,
  Globe,
  Filter,
  Download,
  Settings,
  Truck,
  PackageCheck,
  AlertTriangle
} from 'lucide-react';

export default function Sales({ onTokenError }) {
  const [salesData, setSalesData] = useState({
    totalSales: 2847.50,
    totalOrders: 23,
    totalCustomers: 18,
    monthlyRevenue: 847.30,
    orderStatus: {
      pending: 5,
      processing: 8,
      shipped: 6,
      delivered: 4
    },
    productPerformance: {
      views: 1247,
      clicks: 892,
      conversions: 156
    },
    inventory: {
      inStock: 45,
      lowStock: 12,
      outOfStock: 3
    },
    reviews: {
      averageRating: 4.6,
      totalReviews: 89,
      recentReviews: []
    },
    sustainabilityMetrics: {
      carbonFootprintReduced: 234.5,
      sustainableProductsSold: 67,
      ecoFriendlyPackaging: 89
    },
    returns: {
      pending: 2,
      processed: 1,
      total: 3
    },
    topProducts: [],
    inquiries: {
      new: 8,
      responded: 12,
      total: 20
    },
    platformFees: {
      owed: 142.50,
      paid: 89.30,
      total: 231.80
    },
    promotions: {
      active: 3,
      totalDiscount: 156.80,
      conversions: 23
    },
    trafficSources: {
      organic: 45,
      referrals: 28,
      ads: 27
    },
    performanceScore: {
      overall: 8.7,
      delivery: 9.2,
      satisfaction: 8.5,
      sustainability: 9.1
    },
    certifications: {
      upcoming: 2,
      active: 5,
      expired: 0
    },
    categoryAnalytics: [],
    revenueGrowth: null, // Added for dynamic growth display
    orderGrowth: null, // Added for dynamic growth display
    customerGrowth: null // Added for dynamic growth display
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);
  const [shipmentsError, setShipmentsError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSalesData();
  }, [selectedPeriod]);

  // Fetch shipments when tab is active
  useEffect(() => {
    const fetchShipments = async () => {
      if (activeTab !== 'shipments') return;
      try {
        setShipmentsLoading(true);
        let token = localStorage.getItem('accessToken');
        if (!token) {
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/seller/shipments?period=${selectedPeriod}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch shipments');
        }

        const data = await response.json();
        setShipments(data.shipments || []);
        setShipmentsError(null);
      } catch (err) {
        console.error('Shipments fetch error:', err);
        setShipmentsError(err.message);
      } finally {
        setShipmentsLoading(false);
      }
    };

    fetchShipments();
  }, [activeTab, selectedPeriod]);

  const fetchSalesData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        onTokenError();
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sales/seller?period=${selectedPeriod}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          onTokenError();
          return;
        }
        // If the API endpoint doesn't exist yet, use mock data
        if (response.status === 404) {
          console.log('Sales API not deployed yet, using mock data');
          throw new Error('API_NOT_DEPLOYED');
        }
        throw new Error('Failed to fetch sales data');
      }

      const data = await response.json();
      setSalesData(data);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      
      // If API is not deployed yet, use mock data without showing error
      if (err.message === 'API_NOT_DEPLOYED') {
        console.log('Using mock data for sales dashboard');
      } else {
        setError(err.message);
      }
      
      // Mock data for demo
      setSalesData({
        totalSales: 2847.50,
        totalOrders: 23,
        totalCustomers: 18,
        monthlyRevenue: 847.30,
        orderStatus: {
          pending: 5,
          processing: 8,
          shipped: 6,
          delivered: 4
        },
        productPerformance: {
          views: 1247,
          clicks: 892,
          conversions: 156
        },
        inventory: {
          inStock: 45,
          lowStock: 12,
          outOfStock: 3
        },
        reviews: {
          averageRating: 4.6,
          totalReviews: 89,
          recentReviews: [
            { id: 1, customer: 'Sarah J.', rating: 5, comment: 'Amazing eco-friendly product!', date: '2024-01-15' },
            { id: 2, customer: 'Mike C.', rating: 4, comment: 'Great quality, fast delivery', date: '2024-01-14' },
            { id: 3, customer: 'Emma D.', rating: 5, comment: 'Love the sustainable packaging!', date: '2024-01-13' }
          ]
        },
        sustainabilityMetrics: {
          carbonFootprintReduced: 234.5,
          sustainableProductsSold: 67,
          ecoFriendlyPackaging: 89
        },
        returns: {
          pending: 2,
          processed: 1,
          total: 3
        },
        topProducts: [
          { name: 'Recycled Glass Vase', sales: 12, revenue: 1079.88, views: 156, rating: 4.8 },
          { name: 'Bamboo Coffee Cup', sales: 8, revenue: 199.92, views: 98, rating: 4.6 },
          { name: 'Organic Cotton Tote', sales: 6, revenue: 209.94, views: 134, rating: 4.7 }
        ],
        inquiries: {
          new: 8,
          responded: 12,
          total: 20
        },
        platformFees: {
          owed: 142.50,
          paid: 89.30,
          total: 231.80
        },
        promotions: {
          active: 3,
          totalDiscount: 156.80,
          conversions: 23
        },
        trafficSources: {
          organic: 45,
          referrals: 28,
          ads: 27
        },
        performanceScore: {
          overall: 8.7,
          delivery: 9.2,
          satisfaction: 8.5,
          sustainability: 9.1
        },
        certifications: {
          upcoming: 2,
          active: 5,
          expired: 0
        },
        categoryAnalytics: [
          { category: 'Glass Products', sales: 45, revenue: 1247.50, growth: 12.5 },
          { category: 'Bamboo Items', sales: 32, revenue: 892.30, growth: 8.7 },
          { category: 'Organic Textiles', sales: 28, revenue: 567.80, growth: 15.3 }
        ],
        revenueGrowth: 12.5, // Mock data for revenue growth
        orderGrowth: 8.2, // Mock data for order growth
        customerGrowth: 15.3 // Mock data for customer growth
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'pending':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading sales data: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">Sales Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base truncate">Track your sustainable business performance</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-2 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-xs sm:text-sm flex-1 sm:flex-none"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button className="px-2 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg overflow-x-auto scrollbar-hide">
        {['overview', 'analytics', 'inventory', 'sustainability', 'shipments'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-2 sm:px-3 md:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Revenue</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(salesData.totalSales)}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-green-600" />
                </div>
              </div>
              {salesData.revenueGrowth !== null && (
                <div className="flex items-center mt-2 sm:mt-3 lg:mt-4">
                  {salesData.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm ml-1 ${salesData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{salesData.revenueGrowth >= 0 ? '+' : ''}{Math.abs(salesData.revenueGrowth).toFixed(1)}%</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 truncate">vs last {selectedPeriod}</span>
                </div>
              )}
            </div>

            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Orders</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">{salesData.totalOrders}</p>
                </div>
                <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-blue-600" />
                </div>
              </div>
              {salesData.orderGrowth !== null && (
                <div className="flex items-center mt-2 sm:mt-3 lg:mt-4">
                  {salesData.orderGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm ml-1 ${salesData.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{salesData.orderGrowth >= 0 ? '+' : ''}{Math.abs(salesData.orderGrowth).toFixed(1)}%</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 truncate">vs last {selectedPeriod}</span>
                </div>
              )}
            </div>

            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Customers</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">{salesData.totalCustomers}</p>
                </div>
                <div className="p-2 sm:p-3 bg-purple-100 rounded-full flex-shrink-0">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-purple-600" />
                </div>
              </div>
              {salesData.customerGrowth !== null && (
                <div className="flex items-center mt-2 sm:mt-3 lg:mt-4">
                  {salesData.customerGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                  )}
                  <span className={`text-xs sm:text-sm ml-1 ${salesData.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>{salesData.customerGrowth >= 0 ? '+' : ''}{Math.abs(salesData.customerGrowth).toFixed(1)}%</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2 truncate">vs last {selectedPeriod}</span>
                </div>
              )}
            </div>

            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 min-w-0">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Performance Score</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 truncate">{salesData.performanceScore.overall}/10</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-full flex-shrink-0">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 lg:h-6 lg:w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex items-center mt-2 sm:mt-3 lg:mt-4">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${salesData.performanceScore.overall * 10}%` }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-500 ml-2 flex-shrink-0">{salesData.performanceScore.overall}/10</span>
              </div>
            </div>
          </div>

          {/* Order Status & Product Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Order Status */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order Status</h3>
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-500 rounded-full mr-2 sm:mr-3"></div>
                    <span className="text-xs sm:text-sm font-medium">Pending</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-orange-600">{salesData.orderStatus.pending}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-500 rounded-full mr-2 sm:mr-3"></div>
                    <span className="text-xs sm:text-sm font-medium">Processing</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-yellow-600">{salesData.orderStatus.processing}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
                    <span className="text-xs sm:text-sm font-medium">Shipped</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-blue-600">{salesData.orderStatus.shipped}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-2 sm:mr-3"></div>
                    <span className="text-xs sm:text-sm font-medium">Delivered</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-green-600">{salesData.orderStatus.delivered}</span>
                </div>
              </div>
            </div>

            {/* Product Performance */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Product Performance</h3>
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2" />
                    <span className="text-xs sm:text-sm">Views</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold">{formatNumber(salesData.productPerformance.views)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MousePointer className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 mr-2" />
                    <span className="text-xs sm:text-sm">Clicks</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold">{formatNumber(salesData.productPerformance.clicks)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-2" />
                    <span className="text-xs sm:text-sm">Conversions</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold">{formatNumber(salesData.productPerformance.conversions)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm sm:text-base font-bold text-green-600">
                      {((salesData.productPerformance.conversions / salesData.productPerformance.clicks) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sustainability & Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Sustainability Metrics */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Sustainability Impact</h3>
                <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-2" />
                    <span className="text-xs sm:text-sm">Carbon Footprint Reduced</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-green-600">{salesData.sustainabilityMetrics.carbonFootprintReduced} kg</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2" />
                    <span className="text-xs sm:text-sm">Sustainable Products Sold</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-blue-600">{salesData.sustainabilityMetrics.sustainableProductsSold}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Gift className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 mr-2" />
                    <span className="text-xs sm:text-sm">Eco-Friendly Packaging</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-purple-600">{salesData.sustainabilityMetrics.ecoFriendlyPackaging}%</span>
                </div>
              </div>
            </div>

            {/* Reviews & Ratings */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Customer Reviews</h3>
                <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              </div>
              <div className="text-center mb-4">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{salesData.reviews.averageRating}</div>
                <div className="flex justify-center mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3 w-3 sm:h-4 sm:w-4 ${
                        star <= Math.floor(salesData.reviews.averageRating)
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{salesData.reviews.totalReviews} reviews</p>
              </div>
              <div className="space-y-2">
                {salesData.reviews.recentReviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="p-2 sm:p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-xs sm:text-sm">{review.customer}</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-2 w-2 sm:h-3 sm:w-3 ${
                              star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Quick Actions */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center p-2 sm:p-3 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                  <Package className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 mr-2" />
                  <span className="text-xs sm:text-sm font-medium text-green-600">Upload Product</span>
                </button>
                <button className="w-full flex items-center justify-center p-2 sm:p-3 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2" />
                  <span className="text-xs sm:text-sm font-medium text-blue-600">View Analytics</span>
                </button>
                <button className="w-full flex items-center justify-center p-2 sm:p-3 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 mr-2" />
                  <span className="text-xs sm:text-sm font-medium text-purple-600">Respond to Inquiries</span>
                </button>
              </div>
            </div>

            {/* Alerts */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
              <div className="space-y-3">
                <div className="flex items-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-orange-800">Low Stock Alert</p>
                    <p className="text-xs text-orange-600">{salesData.inventory.lowStock} products</p>
                  </div>
                </div>
                <div className="flex items-center p-2 sm:p-3 bg-red-50 rounded-lg">
                  <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-red-800">Out of Stock</p>
                    <p className="text-xs text-red-600">{salesData.inventory.outOfStock} products</p>
                  </div>
                </div>
                <div className="flex items-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                  <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 mr-2" />
                  <div className="flex-1">
                    <p className="text-xs sm:text-sm font-medium text-blue-800">New Inquiries</p>
                    <p className="text-xs text-blue-600">{salesData.inquiries?.new ?? 0} messages</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Fees */}
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Platform Fees</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm">Owed</span>
                  <span className="font-bold text-red-600">{formatCurrency(salesData.platformFees?.owed ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm">Paid</span>
                  <span className="font-bold text-green-600">{formatCurrency(salesData.platformFees?.paid ?? 0)}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium">Total</span>
                    <span className="font-bold">{formatCurrency(salesData.platformFees?.total ?? 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Traffic Sources */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-green-600">{salesData.trafficSources?.organic ?? 0}%</p>
                <p className="text-xs sm:text-sm text-gray-600">Organic</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{salesData.trafficSources?.referrals ?? 0}%</p>
                <p className="text-xs sm:text-sm text-gray-600">Referrals</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{salesData.trafficSources?.ads ?? 0}%</p>
                <p className="text-xs sm:text-sm text-gray-600">Ads</p>
              </div>
            </div>
          </div>

          {/* Performance Score */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Performance Score</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-gray-900">{salesData.performanceScore.overall}/10</div>
                <p className="text-xs sm:text-sm text-gray-600">Overall</p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-600">{salesData.performanceScore.delivery}/10</div>
                <p className="text-xs sm:text-sm text-gray-600">Delivery</p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-600">{salesData.performanceScore.satisfaction}/10</div>
                <p className="text-xs sm:text-sm text-gray-600">Satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-600">{salesData.performanceScore.sustainability}/10</div>
                <p className="text-xs sm:text-sm text-gray-600">Sustainability</p>
              </div>
            </div>
          </div>

          {/* Category Analytics */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="space-y-3 sm:space-y-4">
              {(salesData.categoryAnalytics ?? []).map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm sm:text-base font-medium text-gray-900">{category.category}</p>
                    <p className="text-xs sm:text-sm text-gray-600">{category.sales} sales</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-bold text-gray-900">{formatCurrency(category.revenue)}</p>
                    <div className="flex items-center text-xs sm:text-sm">
                      <ArrowUpRight className="h-2 w-2 sm:h-3 sm:w-3 text-green-600 mr-1" />
                      <span className="text-green-600">+{category.growth}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Inventory Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">In Stock</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{salesData.inventory.inStock}</p>
                </div>
                <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Low Stock</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-orange-600">{salesData.inventory.lowStock}</p>
                </div>
                <div className="p-2 sm:p-3 bg-orange-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Out of Stock</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600">{salesData.inventory.outOfStock}</p>
                </div>
                <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                  <XCircle className="h-4 w-4 sm:h-6 sm:w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="space-y-4">
              {salesData.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-green-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <div className="flex items-center text-sm text-gray-600">
                        <Eye className="h-3 w-3 mr-1" />
                        {product.views} views
                        <Star className="h-3 w-3 ml-2 mr-1" />
                        {product.rating}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-gray-600">{product.sales} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sustainability' && (
        <div className="space-y-6">
          {/* Sustainability Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <Leaf className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-green-600">{salesData.sustainabilityMetrics.carbonFootprintReduced} kg</p>
                <p className="text-sm text-gray-600">Carbon Footprint Reduced</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-blue-600">{salesData.sustainabilityMetrics.sustainableProductsSold}</p>
                <p className="text-sm text-gray-600">Sustainable Products Sold</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <Gift className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-purple-600">{salesData.sustainabilityMetrics.ecoFriendlyPackaging}%</p>
                <p className="text-sm text-gray-600">Eco-Friendly Packaging</p>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sustainability Certifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{salesData.certifications?.active ?? 0}</p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{salesData.certifications?.upcoming ?? 0}</p>
                <p className="text-sm text-gray-600">Upcoming</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{salesData.certifications?.expired ?? 0}</p>
                <p className="text-sm text-gray-600">Expired</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shipments' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2"><Truck className="h-5 w-5" /> Shipments</h3>
              <p className="text-sm text-gray-600">Upcoming pickups & packaging guidelines</p>
            </div>

            {shipmentsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : shipmentsError ? (
              <p className="text-red-600">{shipmentsError}</p>
            ) : shipments.length === 0 ? (
              <p className="text-gray-600">No upcoming shipments found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Order</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Products</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Qty</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Pickup Date</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {shipments.map((ship) => (
                      <tr key={ship.orderId}>
                        <td className="px-4 py-2 text-gray-900">#{ship.orderId.slice(-6)}</td>
                        <td className="px-4 py-2 text-gray-600 whitespace-pre-line">
                          {ship.products.map(p => `${p.name} x${p.quantity}`).join('\n')}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{ship.totalQuantity}</td>
                        <td className="px-4 py-2 text-gray-600">{new Date(ship.pickupDate).toLocaleDateString()}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ship.status === 'shipped' ? 'bg-blue-100 text-blue-600' : ship.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>{ship.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Packaging Guidelines */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4"><PackageCheck className="h-5 w-5" /> Packaging Standards</h4>
            <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm">
              <li>Use <span className="font-medium">100% recycled</span> or biodegradable materials.</li>
              <li>Avoid excessive plastic fillers; opt for paper or cornstarch peanuts.</li>
              <li>Ensure products are cushioned but <span className="font-medium">minimize empty space</span> inside the box.</li>
              <li>Seal packages with <span className="font-medium">paper tape</span> instead of plastic tape whenever possible.</li>
              <li>Include a tiny thank-you note printed on recycled paper (optional).</li>
              <li>Print shipping labels at <span className="font-medium">100% scale</span> for clear barcode scanning.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
