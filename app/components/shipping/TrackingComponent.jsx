'use client';

import { useState, useEffect } from 'react';
import { useShipping } from '../../context/ShippingContext';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Search,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

const TrackingComponent = ({ initialTrackingNumber = '', onTrackingResult = null }) => {
  const { trackShipment, isLoading, getStatusColor, getStatusText } = useShipping();
  
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  // Auto-track if initial tracking number is provided
  useEffect(() => {
    if (initialTrackingNumber) {
      handleTrack();
    }
  }, [initialTrackingNumber]);

  const handleTrack = async () => {
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    try {
      setIsTracking(true);
      setError('');
      
      const result = await trackShipment(trackingNumber.trim());
      setTrackingData(result);
      
      if (onTrackingResult) {
        onTrackingResult(result);
      }
    } catch (error) {
      console.error('Tracking error:', error);
      setError(error.message || 'Failed to track shipment');
      setTrackingData(null);
    } finally {
      setIsTracking(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTrack();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'in_transit':
      case 'out_for_delivery':
        return <Truck className="w-6 h-6 text-blue-600" />;
      case 'picked_up':
        return <Package className="w-6 h-6 text-purple-600" />;
      case 'exception':
      case 'failed_delivery':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Package className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = (status) => {
    const statusProgress = {
      'pending': 10,
      'confirmed': 20,
      'picked_up': 40,
      'in_transit': 60,
      'out_for_delivery': 80,
      'delivered': 100,
      'failed_delivery': 70,
      'returned': 50,
      'cancelled': 0,
      'exception': 50
    };
    
    return statusProgress[status] || 0;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <Package className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          Track Your Package
        </h2>
      </div>

      {/* Search Input */}
      <div className="mb-8">
        <div className="flex space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter tracking number (e.g., TR123456789)"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <button
            onClick={handleTrack}
            disabled={isTracking || !trackingNumber.trim()}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isTracking ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            <span>{isTracking ? 'Tracking...' : 'Track'}</span>
          </button>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Tracking Results */}
      {trackingData && (
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(trackingData.status)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {getStatusText(trackingData.status)}
                  </h3>
                  <p className="text-gray-600">
                    Tracking Number: {trackingData.trackingNumber}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(trackingData.status)}`}>
                  {getStatusText(trackingData.status)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage(trackingData.status)}%` }}
              ></div>
            </div>

            {/* Delivery Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {trackingData.estimatedDeliveryDate && (
                <div>
                  <span className="text-gray-600">Estimated Delivery:</span>
                  <div className="font-medium">
                    {formatDate(trackingData.estimatedDeliveryDate)}
                  </div>
                </div>
              )}
              {trackingData.actualDeliveryDate && (
                <div>
                  <span className="text-gray-600">Delivered On:</span>
                  <div className="font-medium text-green-600">
                    {formatDate(trackingData.actualDeliveryDate)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <span>From</span>
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{trackingData.originAddress?.contactName}</div>
                <div>{trackingData.originAddress?.street}</div>
                <div>
                  {trackingData.originAddress?.city}, {trackingData.originAddress?.state}{' '}
                  {trackingData.originAddress?.postalCode}
                </div>
              </div>
            </div>

            {/* Destination */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-green-600" />
                <span>To</span>
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>{trackingData.destinationAddress?.contactName}</div>
                <div>{trackingData.destinationAddress?.street}</div>
                <div>
                  {trackingData.destinationAddress?.city}, {trackingData.destinationAddress?.state}{' '}
                  {trackingData.destinationAddress?.postalCode}
                </div>
              </div>
            </div>
          </div>

          {/* Courier Information */}
          {trackingData.courierName && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <span>Courier</span>
              </h4>
              <p className="text-gray-600">{trackingData.courierName}</p>
            </div>
          )}

          {/* Tracking Events */}
          {trackingData.trackingEvents && trackingData.trackingEvents.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-600" />
                <span>Tracking History</span>
              </h4>
              
              <div className="space-y-4">
                {trackingData.trackingEvents
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0 w-3 h-3 bg-green-600 rounded-full mt-2"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {event.description}
                        </p>
                        <time className="text-xs text-gray-500">
                          {formatDate(event.timestamp)}
                        </time>
                      </div>
                      {event.location && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{event.location}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Actions */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={handleTrack}
              disabled={isTracking}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-5 h-5 ${isTracking ? 'animate-spin' : ''}`} />
              <span>Refresh Tracking</span>
            </button>
            
            {trackingData.easyshipTracking?.tracking_url && (
              <a
                href={trackingData.easyshipTracking.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="w-5 h-5" />
                <span>View on Courier Site</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!trackingData && !error && !isTracking && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Track Your Package
          </h3>
          <p className="text-gray-600">
            Enter your tracking number above to get real-time updates on your shipment.
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackingComponent;