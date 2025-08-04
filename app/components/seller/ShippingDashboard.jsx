'use client';

import { useState, useEffect } from 'react';
import { useShipping } from '../../context/ShippingContext';
import { 
  Package, 
  Truck, 
  Calendar, 
  Clock, 
  Download, 
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter
} from 'lucide-react';

const ShippingDashboard = ({ sellerId }) => {
  const {
    shipments,
    shippingStats,
    isLoading,
    error,
    fetchShipments,
    fetchShippingStats,
    generateLabel,
    schedulePickup,
    getPickupSlots,
    getStatusColor,
    getStatusText,
    formatAddress,
    refreshShipments
  } = useShipping();

  const [selectedShipments, setSelectedShipments] = useState([]);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickupData, setPickupData] = useState({
    date: '',
    timeSlot: '',
    address: {},
    contactPerson: '',
    contactPhone: '',
    instructions: ''
  });
  const [pickupSlots, setPickupSlots] = useState([]);
  const [loadingPickupSlots, setLoadingPickupSlots] = useState(false);

  useEffect(() => {
    // Fetch seller's shipments
    fetchShipments(1, { sellerId });
    fetchShippingStats({ sellerId });
  }, [sellerId]);

  const handleGenerateLabel = async (shipmentId) => {
    try {
      await generateLabel(shipmentId);
    } catch (error) {
      console.error('Failed to generate label:', error);
    }
  };

  const handleSchedulePickup = async () => {
    try {
      await schedulePickup({
        ...pickupData,
        shipmentIds: selectedShipments
      });
      
      setShowPickupModal(false);
      setSelectedShipments([]);
      refreshShipments();
    } catch (error) {
      console.error('Failed to schedule pickup:', error);
    }
  };

  const handleGetPickupSlots = async () => {
    if (!pickupData.date || !pickupData.address.city) return;

    try {
      setLoadingPickupSlots(true);
      const slots = await getPickupSlots({
        address: pickupData.address,
        date: pickupData.date,
        courierId: 'dhl' // Default courier - should be dynamic
      });
      setPickupSlots(slots.pickup_slots || []);
    } catch (error) {
      console.error('Failed to get pickup slots:', error);
    } finally {
      setLoadingPickupSlots(false);
    }
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    if (currency === 'NGN') {
      return `₦${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getShipmentsByStatus = (status) => {
    return shipments.filter(shipment => shipment.status === status);
  };

  const pendingShipments = getShipmentsByStatus('confirmed');
  const inTransitShipments = getShipmentsByStatus('in_transit');
  const deliveredShipments = getShipmentsByStatus('delivered');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading shipping data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Dashboard</h1>
          <p className="text-gray-600">Manage your orders and schedule pickups</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshShipments}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {selectedShipments.length > 0 && (
            <button
              onClick={() => setShowPickupModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Calendar className="w-5 h-5" />
              <span>Schedule Pickup ({selectedShipments.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Shipments</p>
              <p className="text-3xl font-bold text-gray-900">{shippingStats.totalShipments}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Pickup</p>
              <p className="text-3xl font-bold text-gray-900">{pendingShipments.length}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Transit</p>
              <p className="text-3xl font-bold text-gray-900">{inTransitShipments.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-3xl font-bold text-gray-900">{deliveredShipments.length}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Your Shipments</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedShipments(pendingShipments.map(s => s._id));
                      } else {
                        setSelectedShipments([]);
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.map((shipment) => (
                <tr key={shipment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shipment.status === 'confirmed' && (
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={selectedShipments.includes(shipment._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedShipments(prev => [...prev, shipment._id]);
                          } else {
                            setSelectedShipments(prev => prev.filter(id => id !== shipment._id));
                          }
                        }}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      #{shipment.orderId.orderNumber}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shipment.trackingNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.buyerId.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shipment.buyerId.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}>
                      {getStatusText(shipment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {shipment.courierName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {shipment.courierServiceName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(shipment.totalCost, shipment.currency)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleGenerateLabel(shipment._id)}
                      className="text-green-600 hover:text-green-900"
                      title="Download Label"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/track/${shipment.trackingNumber}`, '_blank')}
                      className="text-blue-600 hover:text-blue-900"
                      title="Track Package"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {shipments.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Shipments Yet
            </h3>
            <p className="text-gray-600">
              Your shipments will appear here once orders are placed.
            </p>
          </div>
        )}
      </div>

      {/* Pickup Modal */}
      {showPickupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Pickup</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Date
                </label>
                <input
                  type="date"
                  value={pickupData.date}
                  onChange={(e) => {
                    setPickupData(prev => ({ ...prev, date: e.target.value }));
                    if (e.target.value && pickupData.address.city) {
                      handleGetPickupSlots();
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Slot
                </label>
                <select
                  value={pickupData.timeSlot}
                  onChange={(e) => setPickupData(prev => ({ ...prev, timeSlot: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={loadingPickupSlots || pickupSlots.length === 0}
                >
                  <option value="">Select time slot</option>
                  {pickupSlots.map((slot, index) => (
                    <option key={index} value={slot.time_slot}>
                      {slot.time_slot}
                    </option>
                  ))}
                </select>
                {loadingPickupSlots && (
                  <p className="text-sm text-gray-500 mt-1">Loading available slots...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={pickupData.contactPerson}
                  onChange={(e) => setPickupData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={pickupData.contactPhone}
                  onChange={(e) => setPickupData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={pickupData.instructions}
                  onChange={(e) => setPickupData(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any special pickup instructions..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPickupModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedulePickup}
                disabled={!pickupData.date || !pickupData.timeSlot || !pickupData.contactPerson || !pickupData.contactPhone}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShippingDashboard;