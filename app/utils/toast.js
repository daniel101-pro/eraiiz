import toast from 'react-hot-toast';

// Toast configuration
const toastConfig = {
  duration: 3000,
  position: 'top-center',
  style: {
    background: '#1F2937',
    color: '#FFFFFF',
    padding: '16px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    minWidth: '300px',
  },
};

// Toast counter system to prevent flooding
class ToastCounter {
  constructor() {
    this.counters = new Map(); // Map of message -> { count, toastId, timeoutId }
    this.resetDelay = 3000; // Reset counter after toast expires
  }

  // Generate a key for grouping similar messages
  generateKey(message, type) {
    // Normalize message for grouping (remove dynamic parts like numbers, names)
    const normalizedMessage = message
      .replace(/\d+/g, 'X') // Replace numbers with X
      .replace(/["']([^"']+)["']/g, '"item"') // Replace quoted strings with "item"
      .toLowerCase()
      .trim();
    
    return `${type}:${normalizedMessage}`;
  }

  // Show toast with counter
  show(message, type, config = {}) {
    const key = this.generateKey(message, type);
    const existing = this.counters.get(key);

    if (existing) {
      // Dismiss existing toast
      toast.dismiss(existing.toastId);
      clearTimeout(existing.timeoutId);
      
      // Increment counter
      existing.count++;
      
      // Create updated message with count
      const countMessage = existing.count > 1 
        ? `${message} (×${existing.count})`
        : message;

      // Show new toast
      const toastId = this.showToast(countMessage, type, config);
      
      // Update the counter entry
      existing.toastId = toastId;
      existing.timeoutId = setTimeout(() => {
        this.counters.delete(key);
      }, this.resetDelay);
      
      return toastId;
    } else {
      // First time showing this message
      const toastId = this.showToast(message, type, config);
      
      // Create counter entry
      const timeoutId = setTimeout(() => {
        this.counters.delete(key);
      }, this.resetDelay);
      
      this.counters.set(key, {
        count: 1,
        toastId,
        timeoutId
      });
      
      return toastId;
    }
  }

  // Internal method to show actual toast
  showToast(message, type, config) {
    const toastFunction = toast[type] || toast;
    return toastFunction(message, {
      ...toastConfig,
      ...config,
      style: {
        ...toastConfig.style,
        ...config.style,
      },
    });
  }

  // Clear all counters (useful for cleanup)
  clear() {
    this.counters.forEach(({ timeoutId }) => {
      clearTimeout(timeoutId);
    });
    this.counters.clear();
  }

  // Get current counter for a message (for testing/debugging)
  getCount(message, type) {
    const key = this.generateKey(message, type);
    return this.counters.get(key)?.count || 0;
  }
}

// Global toast counter instance
const toastCounter = new ToastCounter();

// Enhanced toast functions with counter support
export const showSuccess = (message, options = {}) => {
  return toastCounter.show(message, 'success', {
    ...options,
    style: {
      background: '#059669',
      border: '1px solid #10B981',
      ...options.style,
    },
    icon: '✅',
  });
};

export const showError = (message, options = {}) => {
  return toastCounter.show(message, 'error', {
    ...options,
    style: {
      background: '#DC2626',
      border: '1px solid #EF4444',
      ...options.style,
    },
    icon: '❌',
  });
};

export const showWarning = (message, options = {}) => {
  return toastCounter.show(message, 'warning', {
    ...options,
    style: {
      background: '#D97706',
      border: '1px solid #F59E0B',
      ...options.style,
    },
    icon: '⚠️',
  });
};

export const showInfo = (message, options = {}) => {
  return toastCounter.show(message, 'info', {
    ...options,
    style: {
      background: '#2563EB',
      border: '1px solid #3B82F6',
      ...options.style,
    },
    icon: 'ℹ️',
  });
};

export const showLoading = (message, options = {}) => {
  return toast.loading(message, {
    ...toastConfig,
    ...options,
    style: {
      ...toastConfig.style,
      background: '#6B7280',
      border: '1px solid #9CA3AF',
      ...options.style,
    },
  });
};

// Dismiss functions
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const dismissAllToasts = () => {
  toast.dismiss();
  toastCounter.clear();
};

// Custom toast for cart operations with smart counter
export const showCartToast = (message, type = 'success') => {
  const config = {
    duration: 2500,
    style: {
      background: type === 'success' ? '#059669' : '#DC2626',
      border: `1px solid ${type === 'success' ? '#10B981' : '#EF4444'}`,
    },
    icon: type === 'success' ? '🛍️' : '🗑️',
  };
  
  return toastCounter.show(message, type === 'success' ? 'success' : 'error', config);
};

// Custom toast for authentication with smart counter
export const showAuthToast = (message, type = 'success') => {
  const config = {
    duration: 2500,
    style: {
      background: type === 'success' ? '#059669' : '#DC2626',
      border: `1px solid ${type === 'success' ? '#10B981' : '#EF4444'}`,
    },
    icon: type === 'success' ? '🔐' : '❌',
  };
  
  return toastCounter.show(message, type === 'success' ? 'success' : 'error', config);
};

// Custom toast for product operations with smart counter
export const showProductToast = (message, type = 'success') => {
  const config = {
    duration: 3000,
    style: {
      background: type === 'success' ? '#059669' : '#DC2626',
      border: `1px solid ${type === 'success' ? '#10B981' : '#EF4444'}`,
    },
    icon: type === 'success' ? '📦' : '❌',
  };
  
  return toastCounter.show(message, type === 'success' ? 'success' : 'error', config);
};

// Export the counter instance for advanced usage
export const getToastCounter = () => toastCounter;

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  cart: showCartToast,
  auth: showAuthToast,
  product: showProductToast,
  counter: toastCounter,
}; 