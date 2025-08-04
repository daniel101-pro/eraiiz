import { authAPI } from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
}

class AuthService {
  private static instance: AuthService;
  private user: AdminUser | null = null;
  private token: string | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('adminToken');
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    try {
      const response = await authAPI.login(email, password);
      
      console.log('Auth service received response:', response);
      
      // Handle the actual response format from the server
      if (response.accessToken && response.user) {
        this.token = response.accessToken;
        this.user = response.user;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', this.token || '');
          localStorage.setItem('adminRefreshToken', response.refreshToken || '');
          localStorage.setItem('adminUser', JSON.stringify(this.user));
        }
        
        return { success: true, user: this.user! };
      } else if (response.token && response.user) {
        // Fallback for different response format
        this.token = response.token;
        this.user = response.user;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', this.token || '');
          localStorage.setItem('adminUser', JSON.stringify(this.user));
        }
        
        return { success: true, user: this.user! };
      } else {
        console.error('Unexpected response format:', response);
        return { success: false, error: 'Invalid response from server' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Better error handling
      if (error.response?.status === 404) {
        return { success: false, error: 'User not found. Please check your email.' };
      } else if (error.response?.status === 401) {
        return { success: false, error: 'Invalid password. Please try again.' };
      } else if (error.response?.status === 403) {
        return { success: false, error: 'Access denied. Admin privileges required.' };
      } else if (error.response?.data?.message) {
        return { success: false, error: error.response.data.message };
      } else if (error.message) {
        return { success: false, error: error.message };
      } else {
        return { success: false, error: 'Unable to connect to server. Please try again.' };
      }
    }
  }

  async logout(): Promise<void> {
    this.user = null;
    this.token = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  }

  async getProfile(): Promise<AdminUser | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await authAPI.getProfile();
      this.user = response.user;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('adminUser', JSON.stringify(this.user));
      }
      
      return this.user;
    } catch (error) {
      console.error('Get profile error:', error);
      await this.logout();
      return null;
    }
  }

  getCurrentUser(): AdminUser | null {
    if (!this.user && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('adminUser');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
      }
    }
    return this.user;
  }

  getToken(): string | null {
    return this.token;
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  hasPermission(permission: string): boolean {
    if (!this.user) return false;
    
    // Super admin has all permissions
    if (this.user.role === 'super_admin') return true;
    
    return this.user.permissions?.includes(permission) || false;
  }

  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  async refreshToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await authAPI.refreshToken();
      
      if (response.accessToken || response.token) {
        this.token = response.accessToken || response.token;
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminToken', this.token || '');
          if (response.refreshToken) {
            localStorage.setItem('adminRefreshToken', response.refreshToken);
          }
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return false;
    }
  }
}

export const authService = AuthService.getInstance();

// Permission constants
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  DELETE_USERS: 'delete_users',
  VERIFY_USERS: 'verify_users',
  
  // Product management
  VIEW_PRODUCTS: 'view_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  APPROVE_PRODUCTS: 'approve_products',
  
  // Order management
  VIEW_ORDERS: 'view_orders',
  EDIT_ORDERS: 'edit_orders',
  PROCESS_ORDERS: 'process_orders',
  
  // Review moderation
  VIEW_REVIEWS: 'view_reviews',
  MODERATE_REVIEWS: 'moderate_reviews',
  DELETE_REVIEWS: 'delete_reviews',
  
  // Notification management
  VIEW_NOTIFICATIONS: 'view_notifications',
  SEND_NOTIFICATIONS: 'send_notifications',
  DELETE_NOTIFICATIONS: 'delete_notifications',
  
  // Analytics
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data',
  
  // System settings
  MANAGE_SETTINGS: 'manage_settings',
  SYSTEM_ADMIN: 'system_admin'
};

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  ANALYST: 'analyst'
};

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USERS,
    PERMISSIONS.VERIFY_USERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.APPROVE_PRODUCTS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.EDIT_ORDERS,
    PERMISSIONS.PROCESS_ORDERS,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.MODERATE_REVIEWS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.MODERATOR]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.APPROVE_PRODUCTS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.MODERATE_REVIEWS,
    PERMISSIONS.DELETE_REVIEWS,
    PERMISSIONS.VIEW_NOTIFICATIONS
  ],
  [ROLES.ANALYST]: [
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_ORDERS,
    PERMISSIONS.VIEW_REVIEWS,
    PERMISSIONS.VIEW_NOTIFICATIONS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ]
};