import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://eraiiz-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for hibernating services
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data, error.message);
    
    // Handle session expiration and authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear all auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          // Show a user-friendly message before redirecting
          const message = error.response?.status === 401 
            ? 'Your session has expired. Please log in again.'
            : 'Access denied. Please log in with valid credentials.';
          
          // Dispatch a custom event for the notification system
          const notificationEvent = new CustomEvent('showNotification', {
            detail: {
              type: 'error',
              title: 'Session Expired',
              message: message,
              duration: 3000
            }
          });
          window.dispatchEvent(notificationEvent);
          
          // Redirect after showing notification
          setTimeout(() => {
            window.location.href = '/login';
          }, 3000);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error: any) {
      // Handle hibernation mode (503 errors on Render)
      if (error.response?.status === 503) {
        // Wait a moment and retry once
        await new Promise(resolve => setTimeout(resolve, 3000));
        try {
          const retryResponse = await api.post('/auth/login', { email, password });
          return retryResponse.data;
        } catch (retryError: any) {
          throw new Error('Server is starting up. Please try again in a moment.');
        }
      }
      throw error;
    }
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/refresh', { 
        refreshToken 
      });
      return response.data;
    } catch (error: any) {
      console.error('Refresh token error:', error);
      throw error;
    }
  }
};

// Users API
export const usersAPI = {
  getUsers: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isVerified?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  
  getUserById: async (id: string) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  
  updateUser: async (id: string, data: any) => {
    const response = await api.patch(`/admin/users/${id}`, data);
    return response.data;
  },
  
  deleteUser: async (id: string) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  
  verifyUser: async (id: string) => {
    const response = await api.patch(`/admin/users/${id}/verify`);
    return response.data;
  },
  
  blockUser: async (id: string, blocked = true) => {
    const response = await api.patch(`/admin/users/${id}/block`, { blocked });
    return response.data;
  },
  
  bulkAction: async (action: string, userIds: string[], data?: any) => {
    const response = await api.post('/admin/users/bulk', { action, userIds, ...data });
    return response.data;
  }
};

// Products API
export const productsAPI = {
  getProducts: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
    sellerId?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await api.get('/admin/products', { params });
    return response.data;
  },
  
  getProductById: async (id: string) => {
    const response = await api.get(`/admin/products/${id}`);
    return response.data;
  },
  
  updateProduct: async (id: string, data: any) => {
    const response = await api.patch(`/admin/products/${id}`, data);
    return response.data;
  },
  
  deleteProduct: async (id: string) => {
    const response = await api.delete(`/admin/products/${id}`);
    return response.data;
  },
  
  approveProduct: async (id: string) => {
    const response = await api.patch(`/admin/products/${id}/approve`);
    return response.data;
  },
  
  rejectProduct: async (id: string, reason?: string) => {
    const response = await api.patch(`/admin/products/${id}/reject`, { reason });
    return response.data;
  },
  
  updateProductStatus: async (id: string, status: string) => {
    const response = await api.patch(`/admin/products/${id}/status`, { status });
    return response.data;
  },
  
  bulkAction: async (action: string, productIds: string[], data?: any) => {
    const response = await api.post('/admin/products/bulk', { action, productIds, ...data });
    return response.data;
  },
  
  getCategories: async () => {
    const response = await api.get('/admin/products/categories/list');
    return response.data;
  }
};

// Orders API
export const ordersAPI = {
  getOrders: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await api.get('/admin/orders', { params });
    return response.data;
  },
  
  getOrderById: async (id: string) => {
    const response = await api.get(`/admin/orders/${id}`);
    return response.data;
  },
  
  updateOrder: async (id: string, data: any) => {
    const response = await api.patch(`/admin/orders/${id}`, data);
    return response.data;
  },
  
  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.patch(`/admin/orders/${id}/status`, { status });
    return response.data;
  },
  
  addTrackingNumber: async (id: string, trackingNumber: string) => {
    const response = await api.patch(`/admin/orders/${id}/tracking`, { trackingNumber });
    return response.data;
  },
  
  cancelOrder: async (id: string, reason?: string) => {
    const response = await api.patch(`/admin/orders/${id}/cancel`, { reason });
    return response.data;
  },
  
  bulkAction: async (action: string, orderIds: string[], data?: any) => {
    const response = await api.post('/admin/orders/bulk', { action, orderIds, data });
    return response.data;
  },
  
  getOrderStats: async () => {
    const response = await api.get('/admin/orders/stats/overview');
    return response.data;
  }
};

// Reviews API
export const reviewsAPI = {
  getReviews: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    rating?: string;
    status?: string;
    productId?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await api.get('/admin/reviews', { params });
    return response.data;
  },
  
  getReviewById: async (id: string) => {
    const response = await api.get(`/admin/reviews/${id}`);
    return response.data;
  },
  
  approveReview: async (id: string) => {
    const response = await api.patch(`/admin/reviews/${id}/approve`);
    return response.data;
  },
  
  rejectReview: async (id: string, reason?: string) => {
    const response = await api.patch(`/admin/reviews/${id}/reject`, { reason });
    return response.data;
  },
  
  flagReview: async (id: string, reason?: string) => {
    const response = await api.patch(`/admin/reviews/${id}/flag`, { reason });
    return response.data;
  },
  
  deleteReview: async (id: string) => {
    const response = await api.delete(`/admin/reviews/${id}`);
    return response.data;
  },
  
  bulkAction: async (action: string, reviewIds: string[], reason?: string) => {
    const response = await api.post('/admin/reviews/bulk', { action, reviewIds, reason });
    return response.data;
  },
  
  getReviewStats: async () => {
    const response = await api.get('/admin/reviews/stats/overview');
    return response.data;
  }
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params: {
    page?: number;
    limit?: number;
    search?: string;
    channel?: string;
    status?: string;
    type?: string;
    sortBy?: string;
    sortOrder?: string;
  } = {}) => {
    const response = await api.get('/admin/notifications', { params });
    return response.data;
  },
  
  createNotification: async (data: {
    userId?: string;
    type: string;
    message: string;
    channel: string;
  }) => {
    const response = await api.post('/admin/notifications', data);
    return response.data;
  },
  
  sendNotification: async (id: string) => {
    const response = await api.post(`/admin/notifications/${id}/send`);
    return response.data;
  },
  
  deleteNotification: async (id: string) => {
    const response = await api.delete(`/admin/notifications/${id}`);
    return response.data;
  },
  
  bulkAction: async (action: string, notificationIds: string[]) => {
    const response = await api.post('/admin/notifications/bulk', { action, notificationIds });
    return response.data;
  },
  
  getNotificationStats: async () => {
    const response = await api.get('/admin/notifications/stats/overview');
    return response.data;
  }
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard-stats');
    return response.data;
  },
  
  getSalesData: async (params: {
    period?: string;
    startDate?: string;
    endDate?: string;
  } = {}) => {
    const response = await api.get('/admin/sales-analytics', { params });
    return response.data;
  },
  
  getCategoryAnalytics: async () => {
    const response = await api.get('/admin/category-analytics');
    return response.data;
  },
  
  getUserAnalytics: async () => {
    const response = await api.get('/admin/user-analytics');
    return response.data;
  },
  
  getTopProducts: async () => {
    const response = await api.get('/admin/top-products');
    return response.data;
  },
  
  getRecentActivity: async () => {
    const response = await api.get('/admin/recent-activity');
    return response.data;
  }
};

export { api };
export default api;