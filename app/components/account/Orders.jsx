import { useState, useEffect, useRef } from 'react';
import { refreshAccessToken, decodeToken } from '../../utils/auth';
import { Package, Clock, Truck, CheckCircle, XCircle, Plus, Filter, Wifi, WifiOff } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);

  const connectWebSocket = () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      // Get user ID from token
      const userId = decodeToken(token);
      if (!userId) {
        console.error('Could not decode user ID from token');
        return;
      }
      
      const wsUrl = process.env.NEXT_PUBLIC_API_URL?.replace('https://', 'wss://').replace('http://', 'ws://') + `?userId=${userId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
          
          if (data.type === 'order_update') {
            // Handle order status updates
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order._id === data.orderId 
                  ? { ...order, status: data.status }
                  : order
              )
            );
            setLastUpdate(new Date());
          } else if (data.type === 'new_order') {
            // Handle new order creation
            setOrders(prevOrders => [data.order, ...prevOrders]);
            setLastUpdate(new Date());
          } else if (data.type === 'order_cancelled') {
            // Handle order cancellation
            setOrders(prevOrders => 
              prevOrders.map(order => 
                order._id === data.orderId 
                  ? { ...order, status: 'Cancelled' }
                  : order
              )
            );
            setLastUpdate(new Date());
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (connectionStatus !== 'connected') {
            connectWebSocket();
          }
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
        setConnectionStatus('error');
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setIsConnected(false);
      setConnectionStatus('error');
    }
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      console.log('Fetching orders with token:', token.substring(0, 20) + '...');
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('Orders response status:', res.status);
      console.log('Orders response headers:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Orders error response:', errorText);
        
        if (res.status === 401) {
          try {
            const newToken = await refreshAccessToken();
            const retryRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/orders', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
              },
              credentials: 'include',
            });
            if (!retryRes.ok) {
              const retryErrorText = await retryRes.text();
              console.error('Retry orders error response:', retryErrorText);
              throw new Error('Failed to fetch orders after token refresh');
            }
            const data = await retryRes.json();
            setOrders(data);
          } catch (refreshErr) {
            console.error('Token refresh error:', refreshErr);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return;
          }
        } else {
          throw new Error(`Failed to fetch orders: ${res.status} ${errorText}`);
        }
      }

      const data = await res.json();
      console.log('Orders data received:', data);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Orders fetch error:', err);
      setError(err.message);
      setOrders([]); // Set empty array on error instead of showing fake data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);



  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Shipped':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-3 h-3 md:w-4 md:h-4" />;
      case 'Shipped':
        return <Truck className="w-3 h-3 md:w-4 md:h-4" />;
      case 'Delivered':
        return <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />;
      case 'Cancelled':
        return <XCircle className="w-3 h-3 md:w-4 md:h-4" />;
      default:
        return null;
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'disconnected':
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Live updates enabled';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Connection lost';
      case 'error':
        return 'Connection error';
      default:
        return 'Offline';
    }
  };

  const filteredOrders = selectedFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === selectedFilter);

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button 
            onClick={fetchOrders}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold text-gray-900">Orders</h1>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                Manage your order history and track shipments
                {filteredOrders.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {filteredOrders.length} orders
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Real-time Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
              {getConnectionStatusIcon()}
              <span className="text-xs text-gray-600">{getConnectionStatusText()}</span>
              {lastUpdate && (
                <span className="text-xs text-green-600">
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
            
            <button
              onClick={() => window.location.href = 'https://www.eraiiz.com/for-you'}
              className="inline-flex items-center px-3 py-2 md:px-4 md:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Shop Now
            </button>
          </div>
        </div>
      </div>



      {/* Controls */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: orders.length },
              { key: 'Pending', label: 'Pending', count: orders.filter(o => o.status === 'Pending').length },
              { key: 'Shipped', label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length },
              { key: 'Delivered', label: 'Delivered', count: orders.filter(o => o.status === 'Delivered').length },
              { key: 'Cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'Cancelled').length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedFilter(tab.key)}
                className={`px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedFilter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 md:p-8">
          <div className="text-center">
            <Package className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
            <p className="text-sm md:text-base text-gray-500 mb-6">
              {selectedFilter === 'all' 
                ? "You haven't placed any orders yet." 
                : `No ${selectedFilter.toLowerCase()} orders found.`
              }
            </p>
            <button
              onClick={() => window.location.href = 'https://www.eraiiz.com/for-you'}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Start Shopping
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 md:space-y-4">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">{order.product}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-500">
                    <span>Order ID: {order._id}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg md:text-xl font-bold text-gray-900">
                    ₦{order.price.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{order.status}</span>
                  </span>
                  {isConnected && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Wifi className="w-3 h-3 mr-1" />
                      Live
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-xs md:text-sm text-gray-500">
                    Status: <span className="font-medium text-gray-700">{order.status}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Summary */}
      {filteredOrders.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total Orders</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Total Value</p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">
                ₦{filteredOrders.reduce((sum, order) => sum + order.price, 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Pending</p>
              <p className="text-lg md:text-2xl font-bold text-yellow-600">
                {filteredOrders.filter(order => order.status === 'Pending').length}
              </p>
            </div>
            <div>
              <p className="text-xs md:text-sm text-gray-500">Delivered</p>
              <p className="text-lg md:text-2xl font-bold text-green-600">
                {filteredOrders.filter(order => order.status === 'Delivered').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}