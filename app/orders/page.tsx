'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  Search as SearchIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Pending as PendingIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Print as PrintIcon
} from '@mui/icons-material';

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
    size?: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  orderDate: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  notes?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockOrders: Order[] = [
      {
        _id: '1',
        user: {
          _id: 'user1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        items: [
          {
            product: {
              _id: 'product1',
              name: 'Eco-Friendly Water Bottle',
              price: 29.99
            },
            quantity: 2,
            price: 29.99,
            size: 'L'
          },
          {
            product: {
              _id: 'product2',
              name: 'Organic Cotton T-Shirt',
              price: 45.00
            },
            quantity: 1,
            price: 45.00,
            size: 'M'
          }
        ],
        totalAmount: 104.98,
        status: 'processing',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'Credit Card',
        paymentStatus: 'completed',
        orderDate: '2024-01-25T10:30:00.000Z',
        estimatedDelivery: '2024-01-30T00:00:00.000Z',
        trackingNumber: 'TRK123456789',
        notes: 'Handle with care'
      },
      {
        _id: '2',
        user: {
          _id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        items: [
          {
            product: {
              _id: 'product3',
              name: 'Bamboo Phone Case',
              price: 19.99
            },
            quantity: 1,
            price: 19.99
          }
        ],
        totalAmount: 19.99,
        status: 'pending',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        paymentMethod: 'PayPal',
        paymentStatus: 'pending',
        orderDate: '2024-01-26T14:15:00.000Z'
      }
    ];
    
    setTimeout(() => {
      setOrders(mockOrders);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order._id.includes(searchTerm) ||
                         order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const handleOrderAction = (action: string, orderId: string) => {
    console.log(`${action} order:`, orderId);
    
    if (action === 'ship') {
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, status: 'shipped' as const, trackingNumber: 'TRK' + Date.now() }
          : order
      ));
    } else if (action === 'deliver') {
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, status: 'delivered' as const }
          : order
      ));
    } else if (action === 'cancel') {
      setOrders(prev => prev.map(order => 
        order._id === orderId 
          ? { ...order, status: 'cancelled' as const }
          : order
      ));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`${action} selected orders:`, selectedOrders);
    // Implement bulk actions here
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const selectAllOrders = () => {
    setSelectedOrders(
      selectedOrders.length === filteredOrders.length 
        ? [] 
        : filteredOrders.map(order => order._id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <PendingIcon className="w-4 h-4" />;
      case 'processing': return <PendingIcon className="w-4 h-4" />;
      case 'shipped': return <ShippingIcon className="w-4 h-4" />;
      case 'delivered': return <CompletedIcon className="w-4 h-4" />;
      case 'cancelled': return <CancelledIcon className="w-4 h-4" />;
      default: return <PendingIcon className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShippingIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Order Management</h1>
                <p className="text-sm text-gray-500 mt-1">Track and manage customer orders</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{orders.filter(o => o.status === 'pending').length} Pending</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>{orders.filter(o => o.status === 'processing').length} Processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{orders.filter(o => o.status === 'shipped').length} Shipped</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={selectedPaymentStatus}
                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Payment Status</option>
                <option value="pending">Payment Pending</option>
                <option value="completed">Payment Completed</option>
                <option value="failed">Payment Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.length > 0 && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  {selectedOrders.length} order(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('process')}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <PendingIcon className="w-4 h-4" />
                  <span>Process</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('ship')}
                  className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <ShippingIcon className="w-4 h-4" />
                  <span>Ship</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('cancel')}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <CancelledIcon className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 md:p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-6 md:p-12 text-center">
              <ShippingIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-sm text-gray-500">No orders match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 md:px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                        onChange={selectAllOrders}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-4 md:px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(order._id)}
                          onChange={() => toggleOrderSelection(order._id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">#{order._id}</div>
                          {order.trackingNumber && (
                            <div className="text-xs text-gray-500">TRK: {order.trackingNumber}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">{order.user.name}</div>
                          <div className="text-xs text-gray-500">{order.user.email}</div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500 space-y-0.5">
                            {order.items.slice(0, 2).map((item, index) => (
                              <div key={index} className="truncate">
                                {item.quantity}x {item.product.name}
                                {item.size && ` (${item.size})`}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-gray-400">
                                +{order.items.length - 2} more
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                            {order.paymentStatus}
                          </span>
                          <div className="text-xs text-gray-500">
                            {order.paymentMethod}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">{new Date(order.orderDate).toLocaleDateString()}</div>
                          {order.estimatedDelivery && (
                            <div className="text-xs text-gray-500">
                              Est: {new Date(order.estimatedDelivery).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOrderAction('view', order._id)}
                            className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                            title="View Order"
                          >
                            <ViewIcon className="w-3 h-3" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleOrderAction('print', order._id)}
                            className="flex items-center gap-1 px-2 py-1 text-gray-600 hover:bg-gray-50 rounded text-xs font-medium transition-colors"
                            title="Print Order"
                          >
                            <PrintIcon className="w-3 h-3" />
                            <span>Print</span>
                          </button>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleOrderAction('process', order._id)}
                              className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                              title="Process Order"
                            >
                              <PendingIcon className="w-3 h-3" />
                              <span>Process</span>
                            </button>
                          )}
                          {order.status === 'processing' && (
                            <button
                              onClick={() => handleOrderAction('ship', order._id)}
                              className="flex items-center gap-1 px-2 py-1 text-purple-600 hover:bg-purple-50 rounded text-xs font-medium transition-colors"
                              title="Ship Order"
                            >
                              <ShippingIcon className="w-3 h-3" />
                              <span>Ship</span>
                            </button>
                          )}
                          {order.status === 'shipped' && (
                            <button
                              onClick={() => handleOrderAction('deliver', order._id)}
                              className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium transition-colors"
                              title="Mark as Delivered"
                            >
                              <CompletedIcon className="w-3 h-3" />
                              <span>Deliver</span>
                            </button>
                          )}
                          {['pending', 'processing'].includes(order.status) && (
                            <button
                              onClick={() => handleOrderAction('cancel', order._id)}
                              className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                              title="Cancel Order"
                            >
                              <CancelledIcon className="w-3 h-3" />
                              <span>Cancel</span>
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
        </div>

        {/* Pagination */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing 1 to {filteredOrders.length} of {orders.length} results
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Previous
              </button>
              <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
                1
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}