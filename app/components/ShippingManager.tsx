'use client';

import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Filter,
  Search,
  Calendar,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { api } from '../../lib/api';

interface Shipment {
  _id: string;
  easyshipId: string;
  trackingNumber: string;
  orderId: {
    _id: string;
    orderNumber: string;
    totalAmount: number;
    currency: string;
  };
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  buyerId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  courierName: string;
  courierServiceName: string;
  shippingCost: number;
  totalCost: number;
  currency: string;
  estimatedDeliveryDate?: string;
  actualDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShippingStats {
  totalShipments: number;
  pendingShipments: number;
  inTransitShipments: number;
  deliveredShipments: number;
  totalShippingCost: number;
  averageShippingCost: number;
}

const ShippingManager = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stats, setStats] = useState<ShippingStats>({
    totalShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
    totalShippingCost: 0,
    averageShippingCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalShipments: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchShipments();
    fetchShippingStats();
  }, [pagination?.page, statusFilter, dateFilter, searchTerm]);

  const fetchShipments = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/shipping/shipments?${params}`);
      
      setShipments(response.data.shipments);
      setPagination(response.data.pagination);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Failed to fetch shipments:', error);
      setError(error.message || 'Failed to load shipments');
    } finally {
      if (!isRefresh) setLoading(false);
    }
  };

  const fetchShippingStats = async () => {
    try {
      const response = await api.get('/shipping/stats');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to fetch shipping stats:', error);
    }
  };

  const updateShipmentStatus = async (shipmentId: string, status: string, description = '') => {
    try {
      const response = await api.patch(`/shipping/shipments/${shipmentId}/status`, {
        status,
        description
      });

      setShipments(prev => 
        prev.map(shipment => 
          shipment._id === shipmentId 
            ? { ...shipment, ...response.data.shipment }
            : shipment
        )
      );

      fetchShippingStats(); // Refresh stats
    } catch (error: any) {
      console.error('Failed to update shipment status:', error);
      alert(error.message || 'Failed to update shipment status');
    }
  };

  const generateLabel = async (shipmentId: string) => {
    try {
      const response = await api.get(`/shipping/shipments/${shipmentId}/label`);
      
      if (response.data.documents && response.data.documents.length > 0) {
        const labelDoc = response.data.documents.find((doc: any) => doc.category === 'label');
        if (labelDoc?.url) {
          window.open(labelDoc.url, '_blank');
        }
      }
    } catch (error: any) {
      console.error('Failed to generate label:', error);
      alert(error.message || 'Failed to generate shipping label');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      picked_up: 'bg-purple-100 text-purple-800',
      in_transit: 'bg-blue-100 text-blue-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      failed_delivery: 'bg-red-100 text-red-800',
      returned: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      exception: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4" />;
      case 'exception':
      case 'failed_delivery':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number, currency = 'NGN') => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredShipments = (shipments || []).filter(shipment => {
    const matchesSearch = 
      shipment.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.orderId.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.sellerId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.buyerId.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading shipments...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Shipping Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage all shipments and track deliveries</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button
              onClick={() => fetchShipments(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shipments</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.totalShipments || 0).toLocaleString()}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.inTransitShipments || 0).toLocaleString()}</p>
            </div>
            <div className="bg-orange-100 p-2 rounded-lg">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{(stats?.deliveredShipments || 0).toLocaleString()}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalShippingCost || 0)}</p>
            </div>
            <div className="bg-purple-100 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search shipments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="picked_up">Picked Up</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed_delivery">Failed Delivery</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-6 md:p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading shipments...</p>
          </div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-6 md:p-12 text-center">
            <Truck className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No shipments found</h3>
            <p className="text-sm text-gray-500">No shipments match your current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedShipments((filteredShipments || []).map(s => s._id));
                        } else {
                          setSelectedShipments([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tracking
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courier
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {(filteredShipments || []).map((shipment) => (
                  <tr key={shipment._id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedShipments.includes(shipment._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedShipments(prev => [...prev, shipment._id]);
                          } else {
                            setSelectedShipments(prev => prev.filter(id => id !== shipment._id));
                          }
                        }}
                      />
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.trackingNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.easyshipId}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{shipment.orderId.orderNumber}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatCurrency(shipment.orderId.totalAmount, shipment.orderId.currency)}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.buyerId.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.buyerId.email}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                        {getStatusIcon(shipment.status)}
                        <span className="capitalize">{shipment.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {shipment.courierName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {shipment.courierServiceName}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(shipment.totalCost, shipment.currency)}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(shipment.createdAt)}
                      </div>
                      {shipment.estimatedDeliveryDate && (
                        <div className="text-sm text-gray-500">
                          Est: {formatDate(shipment.estimatedDeliveryDate)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-1">
                        <button
                          onClick={() => window.open(`/shipping/track/${shipment.trackingNumber}`, '_blank')}
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => generateLabel(shipment._id)}
                          className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium transition-colors"
                          title="Download Label"
                        >
                          <Download className="w-3 h-3" />
                          <span>Label</span>
                        </button>
                        {shipment.status === 'pending' && (
                          <button
                            onClick={() => updateShipmentStatus(shipment._id, 'confirmed')}
                            className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium transition-colors"
                            title="Confirm Shipment"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span>Confirm</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination?.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: (prev?.page || 1) - 1 }))}
                disabled={!(pagination?.hasPrevPage || false)}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: (prev?.page || 1) + 1 }))}
                disabled={!(pagination?.hasNextPage || false)}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination?.page || 1}</span> of{' '}
                  <span className="font-medium">{pagination?.totalPages || 1}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: Math.min(pagination?.totalPages || 1, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          (pagination?.page || 1) === pageNum
                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
            <button
              onClick={() => fetchShipments()}
              className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingManager;