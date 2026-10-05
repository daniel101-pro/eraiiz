'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import shippingService from '../services/shippingService';
import { showSuccess, showError } from '../utils/toast';

const ShippingContext = createContext();

function collapseItems(items) {
  const grouped = new Map();
  for (const item of items || []) {
    const name = String(item.name || 'Product').trim();
    const size = String(item.selectedSize || '').trim();
    const key = `${name.toLowerCase()}|${size.toLowerCase()}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.quantity += Number(item.quantity || 1);
    } else {
      grouped.set(key, {
        ...item,
        name,
        selectedSize: size,
        quantity: Number(item.quantity || 1),
      });
    }
  }
  return [...grouped.values()];
}

function toShipment(order) {
  const items = collapseItems(Array.isArray(order.items) ? order.items : []);
  const address = order.shippingAddress || {};
  const quantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  return {
    _id: order._id,
    orderId: {
      orderNumber: String(order.reference || order._id || '').slice(-8).toUpperCase(),
    },
    trackingNumber: order.trackingNumber || '',
    buyerId: {
      name: order.buyer?.name || address.fullName || 'Customer',
      email: order.buyer?.email || '',
      phone: order.buyer?.phone || address.phone || '',
    },
    status: order.status === 'pending' ? 'pending' : order.status,
    courierName: order.courierName || '',
    createdAt: order.createdAt,
    items,
    quantity,
    productSummary: items
      .map((item) => `${item.quantity > 1 ? `${item.quantity} × ` : ''}${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''}`)
      .join(', ') || 'Order',
    destination: {
      ...address,
      phone: address.phone || order.buyer?.phone || '',
    },
    reference: order.reference,
    amountNgn: Number(order.amountNgn || 0),
  };
}

async function fetchLocalSellerOrders() {
  const token = localStorage.getItem('accessToken');
  if (!token) return [];
  const response = await fetch('/api/seller-orders', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data.orders) ? data.orders.map(toShipment) : [];
}

export const useShipping = () => {
  const context = useContext(ShippingContext);
  if (!context) {
    throw new Error('useShipping must be used within a ShippingProvider');
  }
  return context;
};

export const ShippingProvider = ({ children }) => {
  // State
  const [shipments, setShipments] = useState([]);
  const [currentShipment, setCurrentShipment] = useState(null);
  const [couriers, setCouriers] = useState([]);
  const [shippingRates, setShippingRates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculatingRates, setIsCalculatingRates] = useState(false);
  const [error, setError] = useState(null);

  // Statistics
  const [shippingStats, setShippingStats] = useState({
    totalShipments: 0,
    pendingShipments: 0,
    inTransitShipments: 0,
    deliveredShipments: 0,
    totalShippingCost: 0,
    averageShippingCost: 0
  });

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalShipments: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    sellerId: '',
    buyerId: '',
    dateFrom: '',
    dateTo: ''
  });

  // ===== FETCH METHODS =====

  const fetchShipments = async (page = 1, customFilters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page,
        limit: pagination.limit,
        ...filters,
        ...customFilters
      };

      let nextShipments = [];
      try {
        const response = await shippingService.getShipments(params);
        nextShipments = response.shipments || [];
      } catch (error) {
        console.error('Failed to fetch shipments from shipping API:', error);
      }

      if (!nextShipments.length) {
        nextShipments = await fetchLocalSellerOrders();
      }

      setShipments(nextShipments);
      setPagination(responsePagination(nextShipments, page));
      setShippingStats({
        totalShipments: nextShipments.length,
        pendingShipments: nextShipments.filter((item) => item.status === 'pending' || item.status === 'confirmed').length,
        inTransitShipments: nextShipments.filter((item) => item.status === 'in_transit' || item.status === 'shipped').length,
        deliveredShipments: nextShipments.filter((item) => item.status === 'delivered').length,
        totalShippingCost: 0,
        averageShippingCost: 0,
      });
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const responsePagination = (list, page) => ({
    page,
    limit: pagination.limit,
    totalPages: 1,
    totalShipments: list.length,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const fetchShipment = async (shipmentId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.getShipment(shipmentId);
      setCurrentShipment(response.shipment);
      
      return response;
    } catch (error) {
      console.error('Failed to fetch shipment:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCouriers = async () => {
    try {
      const response = await shippingService.getCouriers();
      setCouriers(response.couriers || []);
      return response;
    } catch (error) {
      console.error('Failed to fetch couriers:', error);
      showError('Failed to load couriers');
      throw error;
    }
  };

  const fetchShippingStats = async (customFilters = {}) => {
    try {
      const response = await shippingService.getShippingStats(customFilters);
      if (response && (response.totalShipments || response.pendingShipments)) {
        setShippingStats(response);
        return response;
      }
    } catch (error) {
      console.error('Failed to fetch shipping stats:', error);
    }
    return null;
  };

  // ===== SHIPPING RATES =====

  const calculateShippingRates = async (shippingData) => {
    try {
      setIsCalculatingRates(true);
      setError(null);

      const response = await shippingService.calculateRates(shippingData);
      setShippingRates(response.rates || []);
      
      return response;
    } catch (error) {
      console.error('Failed to calculate shipping rates:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsCalculatingRates(false);
    }
  };

  // ===== SHIPMENT OPERATIONS =====

  const createShipment = async (shipmentData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.createShipment(shipmentData);
      
      // Add to shipments list if successful
      if (response.shipment) {
        setShipments(prev => [response.shipment, ...prev]);
        showSuccess('Shipment created successfully');
      }

      return response;
    } catch (error) {
      console.error('Failed to create shipment:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateShipmentStatus = async (shipmentId, statusData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.updateShipmentStatus(shipmentId, statusData);
      
      // Update shipment in list
      setShipments(prev => 
        prev.map(shipment => 
          shipment._id === shipmentId 
            ? { ...shipment, ...response.shipment }
            : shipment
        )
      );

      // Update current shipment if it's the same one
      if (currentShipment?._id === shipmentId) {
        setCurrentShipment(prev => ({ ...prev, ...response.shipment }));
      }

      showSuccess('Shipment status updated successfully');
      return response;
    } catch (error) {
      console.error('Failed to update shipment status:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelShipment = async (shipmentId, reason = '') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.cancelShipment(shipmentId, reason);
      
      // Update shipment in list
      setShipments(prev => 
        prev.map(shipment => 
          shipment._id === shipmentId 
            ? { ...shipment, status: 'cancelled' }
            : shipment
        )
      );

      // Update current shipment if it's the same one
      if (currentShipment?._id === shipmentId) {
        setCurrentShipment(prev => ({ ...prev, status: 'cancelled' }));
      }

      showSuccess('Shipment cancelled successfully');
      return response;
    } catch (error) {
      console.error('Failed to cancel shipment:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== TRACKING =====

  const trackShipment = async (trackingNumber) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.trackShipment(trackingNumber);
      return response;
    } catch (error) {
      console.error('Failed to track shipment:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== PICKUPS =====

  const getPickupSlots = async (pickupData) => {
    try {
      const response = await shippingService.getPickupSlots(pickupData);
      return response;
    } catch (error) {
      console.error('Failed to get pickup slots:', error);
      showError('Failed to load pickup slots');
      throw error;
    }
  };

  const schedulePickup = async (pickupData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.schedulePickup(pickupData);
      
      showSuccess('Pickup scheduled successfully');
      return response;
    } catch (error) {
      console.error('Failed to schedule pickup:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== LABELS =====

  const markOrderStatus = async (shipmentId, status, extra = {}) => {
    const token = localStorage.getItem('accessToken');
    if (!token) throw new Error('Please sign in again');

    const response = await fetch('/api/seller-orders', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        _id: shipmentId,
        status,
        trackingNumber: extra.trackingNumber,
        courierName: extra.courierName,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Could not update this order');
    }

    setShipments((prev) => {
      const next = prev.map((item) =>
        item._id === shipmentId
          ? {
              ...item,
              status,
              trackingNumber: extra.trackingNumber || item.trackingNumber,
              courierName: extra.courierName || item.courierName,
            }
          : item
      );
      setShippingStats({
        totalShipments: next.length,
        pendingShipments: next.filter((item) => item.status === 'pending' || item.status === 'confirmed').length,
        inTransitShipments: next.filter((item) => item.status === 'in_transit' || item.status === 'shipped').length,
        deliveredShipments: next.filter((item) => item.status === 'delivered').length,
        totalShippingCost: 0,
        averageShippingCost: 0,
      });
      return next;
    });

    return response.json();
  };

  const generateLabel = async (shipmentId) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await shippingService.generateLabel(shipmentId);
      
      showSuccess('Shipping label generated successfully');
      return response;
    } catch (error) {
      console.error('Failed to generate label:', error);
      setError(error.message);
      showError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FILTER MANAGEMENT =====

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      sellerId: '',
      buyerId: '',
      dateFrom: '',
      dateTo: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // ===== PAGINATION =====

  const goToPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
    fetchShipments(page);
  };

  const nextPage = () => {
    if (pagination.hasNextPage) {
      goToPage(pagination.page + 1);
    }
  };

  const prevPage = () => {
    if (pagination.hasPrevPage) {
      goToPage(pagination.page - 1);
    }
  };

  // ===== UTILITY METHODS =====

  const refreshShipments = () => {
    fetchShipments(pagination.page, filters);
  };

  const refreshCurrentShipment = () => {
    if (currentShipment?._id) {
      fetchShipment(currentShipment._id);
    }
  };

  // Auto-refresh shipments every 30 seconds for active shipments
  useEffect(() => {
    const hasActiveShipments = shipments.some(shipment => 
      ['confirmed', 'picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status)
    );

    if (hasActiveShipments) {
      const interval = setInterval(refreshShipments, 30000);
      return () => clearInterval(interval);
    }
  }, [shipments]);

  // Fetch initial data
  useEffect(() => {
    fetchShippingStats();
  }, []);

  // Re-fetch shipments when filters change
  useEffect(() => {
    fetchShipments(1, filters);
  }, [filters]);

  const value = {
    // State
    shipments,
    currentShipment,
    couriers,
    shippingRates,
    isLoading,
    isCalculatingRates,
    error,
    shippingStats,
    pagination,
    filters,

    // Methods
    fetchShipments,
    fetchShipment,
    fetchCouriers,
    fetchShippingStats,
    calculateShippingRates,
    createShipment,
    updateShipmentStatus,
    cancelShipment,
    trackShipment,
    getPickupSlots,
    schedulePickup,
    generateLabel,
    markOrderStatus,

    // Filter & Pagination
    updateFilters,
    clearFilters,
    goToPage,
    nextPage,
    prevPage,

    // Utility
    refreshShipments,
    refreshCurrentShipment,
    setCurrentShipment,
    setError,

    // Helper methods from service
    formatAddress: shippingService.formatAddress,
    formatParcel: shippingService.formatParcel,
    formatItems: shippingService.formatItems,
    getStatusColor: shippingService.getStatusColor,
    getStatusText: shippingService.getStatusText,
    validateAddress: shippingService.validateAddress,
    calculatePackageDimensions: shippingService.calculatePackageDimensions
  };

  return (
    <ShippingContext.Provider value={value}>
      {children}
    </ShippingContext.Provider>
  );
};

export default ShippingProvider;