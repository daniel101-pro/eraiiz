'use client';

import { useState } from 'react';
import { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showCartToast, 
  showAuthToast, 
  showProductToast,
  dismissAllToasts,
  getToastCounter
} from '../utils/toast';

export default function ToastDemo() {
  const [count, setCount] = useState(0);

  const handleCartAdd = () => {
    showCartToast('Added to cart!', 'success');
    setCount(prev => prev + 1);
  };

  const handleCartRemove = () => {
    showCartToast('Removed from cart', 'error');
  };

  const handleAuthSuccess = () => {
    showAuthToast('Successfully logged in!', 'success');
  };

  const handleAuthError = () => {
    showAuthToast('Login failed', 'error');
  };

  const handleProductSuccess = () => {
    showProductToast('Product uploaded successfully!', 'success');
  };

  const handleGenericSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleGenericError = () => {
    showError('Something went wrong!');
  };

  const handleWarning = () => {
    showWarning('This is a warning message');
  };

  const handleInfo = () => {
    showInfo('This is some information');
  };

  const handleSimilarMessages = () => {
    showCartToast('Added Product A to cart!', 'success');
    setTimeout(() => showCartToast('Added Product B to cart!', 'success'), 100);
    setTimeout(() => showCartToast('Added Product C to cart!', 'success'), 200);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Toast Counter Demo</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {/* Cart Actions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Cart Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleCartAdd}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add to Cart ({count})
                </button>
                <button
                  onClick={handleCartRemove}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Remove from Cart
                </button>
              </div>
            </div>

            {/* Auth Actions */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">Auth Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleAuthSuccess}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Login Success
                </button>
                <button
                  onClick={handleAuthError}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Login Error
                </button>
              </div>
            </div>

            {/* Product Actions */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-3">Product Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={handleProductSuccess}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Upload Product
                </button>
              </div>
            </div>

            {/* Generic Actions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Generic Toasts</h3>
              <div className="space-y-2">
                <button
                  onClick={handleGenericSuccess}
                  className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Success
                </button>
                <button
                  onClick={handleGenericError}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Error
                </button>
              </div>
            </div>

            {/* More Generic */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-3">More Types</h3>
              <div className="space-y-2">
                <button
                  onClick={handleWarning}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Warning
                </button>
                <button
                  onClick={handleInfo}
                  className="w-full bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Info
                </button>
              </div>
            </div>

            {/* Special Tests */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-semibold text-indigo-900 mb-3">Special Tests</h3>
              <div className="space-y-2">
                <button
                  onClick={handleSimilarMessages}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Rapid Similar Messages
                </button>
                <button
                  onClick={dismissAllToasts}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">How to Test the Counter:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Click "Add to Cart" multiple times quickly - you'll see the counter increase (×2, ×3, etc.)</li>
              <li>Try "Rapid Similar Messages" to see how similar toasts get grouped together</li>
              <li>Different types of messages (cart, auth, product) are grouped separately</li>
              <li>Messages with different content are also grouped separately</li>
              <li>The counter resets after the toast duration expires</li>
              <li>The modern design includes better spacing and visual feedback</li>
            </ul>
          </div>

          {/* Counter Debug Info */}
          <div className="mt-6 bg-blue-100 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Debug Info:</h3>
            <p className="text-blue-800">
              Current active counters: {getToastCounter().counters.size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 