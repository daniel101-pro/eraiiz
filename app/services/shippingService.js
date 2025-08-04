import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://eraiiz-backend.onrender.com';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/shipping`,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle responses and errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('Shipping API Error:', error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
);

export const shippingService = {
  // ===== SHIPPING RATES =====
  
  /**
   * Calculate shipping rates for given addresses and parcels
   */
  async calculateRates(shippingData) {
    try {
      const response = await api.post('/rates', shippingData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to calculate shipping rates');
    }
  },

  // ===== SHIPMENTS =====
  
  /**
   * Create a new shipment
   */
  async createShipment(shipmentData) {
    try {
      const response = await api.post('/shipments', shipmentData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create shipment');
    }
  },

  /**
   * Get all shipments with optional filtering
   */
  async getShipments(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/shipments?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get shipments');
    }
  },

  /**
   * Get a specific shipment by ID
   */
  async getShipment(shipmentId) {
    try {
      const response = await api.get(`/shipments/${shipmentId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get shipment');
    }
  },

  /**
   * Update shipment status
   */
  async updateShipmentStatus(shipmentId, statusData) {
    try {
      const response = await api.patch(`/shipments/${shipmentId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update shipment status');
    }
  },

  /**
   * Cancel a shipment
   */
  async cancelShipment(shipmentId, reason = '') {
    try {
      const response = await api.post(`/shipments/${shipmentId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to cancel shipment');
    }
  },

  // ===== TRACKING =====
  
  /**
   * Track a shipment by tracking number
   */
  async trackShipment(trackingNumber) {
    try {
      const response = await api.get(`/track/${trackingNumber}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to track shipment');
    }
  },

  // ===== PICKUPS =====
  
  /**
   * Get available pickup slots
   */
  async getPickupSlots(pickupData) {
    try {
      const params = new URLSearchParams({
        address: JSON.stringify(pickupData.address),
        date: pickupData.date,
        courierId: pickupData.courierId
      });

      const response = await api.get(`/pickup-slots?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get pickup slots');
    }
  },

  /**
   * Schedule a pickup
   */
  async schedulePickup(pickupData) {
    try {
      const response = await api.post('/pickups', pickupData);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to schedule pickup');
    }
  },

  // ===== LABELS =====
  
  /**
   * Generate shipping label for a shipment
   */
  async generateLabel(shipmentId) {
    try {
      const response = await api.get(`/shipments/${shipmentId}/label`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to generate shipping label');
    }
  },

  // ===== COURIERS =====
  
  /**
   * Get available couriers
   */
  async getCouriers() {
    try {
      const response = await api.get('/couriers');
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get couriers');
    }
  },

  /**
   * Get courier services for a specific courier
   */
  async getCourierServices(courierId) {
    try {
      const response = await api.get(`/couriers/${courierId}/services`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get courier services');
    }
  },

  // ===== STATISTICS =====
  
  /**
   * Get shipping statistics
   */
  async getShippingStats(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to get shipping statistics');
    }
  },

  // ===== UTILITY METHODS =====

  /**
   * Format address for EasyShip API
   */
  formatAddress(address) {
    return {
      contactName: address.contactName || address.name || '',
      companyName: address.companyName || '',
      phone: address.phone || '',
      email: address.email || '',
      street: address.street || address.address || address.line1 || '',
      apartment: address.apartment || address.line2 || '',
      city: address.city || '',
      state: address.state || address.province || '',
      postalCode: address.postalCode || address.zipCode || '',
      country: address.country || 'NG'
    };
  },

  /**
   * Format parcel dimensions and weight
   */
  formatParcel(parcel) {
    return {
      length: parseFloat(parcel.length) || 10,
      width: parseFloat(parcel.width) || 10,
      height: parseFloat(parcel.height) || 10,
      weight: parseFloat(parcel.weight) || 0.5,
      packagingType: parcel.packagingType || 'box'
    };
  },

  /**
   * Format order items for shipping
   */
  formatItems(items) {
    return items.map(item => ({
      productId: item.productId || item._id,
      name: item.name || '',
      description: item.description || item.name || '',
      quantity: parseInt(item.quantity) || 1,
      price: parseFloat(item.price) || 0,
      currency: item.currency || 'NGN',
      weight: parseFloat(item.weight) || 0.5,
      category: item.category || 'general',
      hsCode: item.hsCode || '',
      originCountry: 'NG'
    }));
  },

  /**
   * Get status color for UI display
   */
  getStatusColor(status) {
    const statusColors = {
      pending: 'text-yellow-600 bg-yellow-100',
      confirmed: 'text-blue-600 bg-blue-100',
      picked_up: 'text-purple-600 bg-purple-100',
      in_transit: 'text-blue-600 bg-blue-100',
      out_for_delivery: 'text-orange-600 bg-orange-100',
      delivered: 'text-green-600 bg-green-100',
      failed_delivery: 'text-red-600 bg-red-100',
      returned: 'text-gray-600 bg-gray-100',
      cancelled: 'text-red-600 bg-red-100',
      exception: 'text-red-600 bg-red-100'
    };

    return statusColors[status] || 'text-gray-600 bg-gray-100';
  },

  /**
   * Get user-friendly status text
   */
  getStatusText(status) {
    const statusTexts = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      picked_up: 'Picked Up',
      in_transit: 'In Transit',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      failed_delivery: 'Failed Delivery',
      returned: 'Returned',
      cancelled: 'Cancelled',
      exception: 'Exception'
    };

    return statusTexts[status] || status;
  },

  /**
   * Calculate estimated delivery time
   */
  calculateEstimatedDelivery(courier, serviceType) {
    // This would typically come from the courier service data
    const estimatedDays = {
      'express': 1,
      'standard': 3,
      'economy': 7
    };

    const days = estimatedDays[serviceType?.toLowerCase()] || 3;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + days);
    
    return deliveryDate;
  },

  /**
   * Validate shipping address
   */
  validateAddress(address) {
    const errors = [];

    if (!address.contactName) errors.push('Contact name is required');
    if (!address.phone) errors.push('Phone number is required');
    if (!address.email) errors.push('Email is required');
    if (!address.street) errors.push('Street address is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    if (!address.postalCode) errors.push('Postal code is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Calculate package dimensions from items
   */
  calculatePackageDimensions(items) {
    // Simple calculation - in real scenarios, this would be more sophisticated
    const totalVolume = items.reduce((volume, item) => {
      const itemVolume = (item.length || 10) * (item.width || 10) * (item.height || 10);
      return volume + (itemVolume * item.quantity);
    }, 0);

    const totalWeight = items.reduce((weight, item) => {
      return weight + ((item.weight || 0.5) * item.quantity);
    }, 0);

    // Approximate box dimensions
    const side = Math.cbrt(totalVolume);
    
    return {
      length: Math.max(side, 10),
      width: Math.max(side, 10),
      height: Math.max(side, 10),
      weight: Math.max(totalWeight, 0.1)
    };
  }
};

export default shippingService;