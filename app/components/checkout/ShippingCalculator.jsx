'use client';

import { useState, useEffect } from 'react';
import { useShipping } from '../../context/ShippingContext';
import { Truck, Package, Clock, DollarSign, Shield } from 'lucide-react';

const ShippingCalculator = ({ 
  cartItems = [], 
  shippingAddress, 
  onRateSelected, 
  selectedRate = null 
}) => {
  const { 
    calculateShippingRates, 
    isCalculatingRates, 
    shippingRates,
    formatAddress,
    formatParcel,
    formatItems,
    calculatePackageDimensions
  } = useShipping();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Calculate rates when shipping address or cart items change
  useEffect(() => {
    if (shippingAddress && cartItems.length > 0) {
      calculateRates();
    }
  }, [shippingAddress, cartItems]);

  const calculateRates = async () => {
    try {
      setLoading(true);
      setError('');

      if (!shippingAddress) {
        setError('Shipping address is required');
        return;
      }

      if (cartItems.length === 0) {
        setError('Cart is empty');
        return;
      }

      // Format shipping data for API
      const originAddress = {
        contactName: 'Eraiiz Warehouse',
        companyName: 'Eraiiz',
        phone: '+234-800-ERAIIZ',
        email: 'shipping@eraiiz.com',
        street: 'Eraiiz Logistics Center',
        city: 'Lagos',
        state: 'Lagos',
        postalCode: '100001',
        country: 'NG'
      };

      const destinationAddress = formatAddress(shippingAddress);
      const packageDimensions = calculatePackageDimensions(cartItems);
      const parcels = [formatParcel(packageDimensions)];

      const shippingData = {
        originAddress,
        destinationAddress,
        parcels,
        isInsured: false
      };

      await calculateShippingRates(shippingData);
    } catch (error) {
      console.error('Error calculating shipping rates:', error);
      setError(error.message || 'Failed to calculate shipping rates');
    } finally {
      setLoading(false);
    }
  };

  const handleRateSelection = (rate) => {
    onRateSelected(rate);
  };

  const formatCurrency = (amount, currency = 'NGN') => {
    if (currency === 'NGN') {
      return `₦${Number(amount).toLocaleString()}`;
    }
    return `${currency} ${Number(amount).toFixed(2)}`;
  };

  const formatDeliveryTime = (minDays, maxDays) => {
    if (minDays === maxDays) {
      return `${minDays} ${minDays === 1 ? 'day' : 'days'}`;
    }
    return `${minDays}-${maxDays} days`;
  };

  const getRateIcon = (serviceType) => {
    if (serviceType?.toLowerCase().includes('express')) {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }
    if (serviceType?.toLowerCase().includes('standard')) {
      return <Truck className="w-5 h-5 text-green-600" />;
    }
    return <Package className="w-5 h-5 text-gray-600" />;
  };

  if (!shippingAddress) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Add Shipping Address
        </h3>
        <p className="text-gray-600">
          Please provide your shipping address to calculate shipping rates.
        </p>
      </div>
    );
  }

  if (loading || isCalculatingRates) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <span className="text-gray-600">Calculating shipping rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800">
              Shipping Error
            </h3>
            <p className="text-red-600">{error}</p>
          </div>
          <button
            onClick={calculateRates}
            className="ml-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!shippingRates || shippingRates.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <Package className="w-6 h-6 text-yellow-600" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">
              No Shipping Options Available
            </h3>
            <p className="text-yellow-700">
              No shipping rates found for your location. Please contact support.
            </p>
          </div>
          <button
            onClick={calculateRates}
            className="ml-auto bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Truck className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Choose Shipping Method
        </h3>
      </div>

      <div className="space-y-4">
        {shippingRates.map((rate, index) => (
          <div
            key={index}
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
              selectedRate?.courier_id === rate.courier_id &&
              selectedRate?.courier_service_id === rate.courier_service_id
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
            }`}
            onClick={() => handleRateSelection(rate)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getRateIcon(rate.service_name)}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-gray-900">
                      {rate.courier_name}
                    </h4>
                    <span className="text-sm text-gray-500">
                      {rate.service_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {formatDeliveryTime(
                          rate.min_delivery_time,
                          rate.max_delivery_time
                        )}
                      </span>
                    </span>
                    {rate.is_insured && (
                      <span className="flex items-center space-x-1">
                        <Shield className="w-4 h-4" />
                        <span>Insured</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(rate.total_charge, rate.currency)}
                </div>
                {rate.total_charge !== rate.shipment_charge && (
                  <div className="text-sm text-gray-500">
                    Base: {formatCurrency(rate.shipment_charge, rate.currency)}
                  </div>
                )}
              </div>
            </div>

            {/* Additional rate information */}
            {selectedRate?.courier_id === rate.courier_id &&
             selectedRate?.courier_service_id === rate.courier_service_id && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Base Rate:</span>
                    <div className="font-medium">
                      {formatCurrency(rate.shipment_charge, rate.currency)}
                    </div>
                  </div>
                  {rate.fuel_surcharge > 0 && (
                    <div>
                      <span className="text-gray-600">Fuel Surcharge:</span>
                      <div className="font-medium">
                        {formatCurrency(rate.fuel_surcharge, rate.currency)}
                      </div>
                    </div>
                  )}
                  {rate.insurance_fee > 0 && (
                    <div>
                      <span className="text-gray-600">Insurance:</span>
                      <div className="font-medium">
                        {formatCurrency(rate.insurance_fee, rate.currency)}
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <div className="font-bold text-green-600">
                      {formatCurrency(rate.total_charge, rate.currency)}
                    </div>
                  </div>
                </div>

                {rate.delivery_note && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{rate.delivery_note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Package Information */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Package Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Items:</span>
            <div className="font-medium">
              {cartItems.reduce((total, item) => total + item.quantity, 0)} items
            </div>
          </div>
          <div>
            <span className="text-gray-600">Est. Weight:</span>
            <div className="font-medium">
              {calculatePackageDimensions(cartItems).weight.toFixed(1)} kg
            </div>
          </div>
          <div>
            <span className="text-gray-600">Dimensions:</span>
            <div className="font-medium text-xs">
              {Math.round(calculatePackageDimensions(cartItems).length)} x{' '}
              {Math.round(calculatePackageDimensions(cartItems).width)} x{' '}
              {Math.round(calculatePackageDimensions(cartItems).height)} cm
            </div>
          </div>
          <div>
            <span className="text-gray-600">Destination:</span>
            <div className="font-medium">
              {shippingAddress.city}, {shippingAddress.state}
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-4 text-center">
        <button
          onClick={calculateRates}
          disabled={loading || isCalculatingRates}
          className="text-sm text-green-600 hover:text-green-700 disabled:text-gray-400"
        >
          Refresh Rates
        </button>
      </div>
    </div>
  );
};

export default ShippingCalculator;