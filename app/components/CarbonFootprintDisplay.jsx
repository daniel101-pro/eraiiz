'use client';
import React, { useState } from 'react';

const CarbonFootprintDisplay = ({ sustainability, carbonFootprint, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!sustainability && !carbonFootprint) {
    return null;
  }

  const getImpactColor = (impactScore) => {
    switch (impactScore?.toLowerCase()) {
      case 'very low':
        return 'text-green-600 bg-green-50';
      case 'low':
        return 'text-emerald-600 bg-emerald-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-orange-600 bg-orange-50';
      case 'very high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <span className="text-green-600 mr-2">🌱</span>
          <h3 className="text-lg font-semibold text-gray-900">Environmental Impact</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-green-600 hover:text-green-700"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Carbon Footprint Summary */}
      {carbonFootprint && (
        <div className="mb-6">
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {carbonFootprint.total} kg CO₂e
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getImpactColor(carbonFootprint.impactScore)}`}>
              <span className="mr-1">📊</span>
              {carbonFootprint.impactScore} Impact
            </div>
          </div>

          {/* Environmental Equivalents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl mb-2 block">🚗</span>
              <div className="text-sm text-gray-600">Car Ride Equivalent</div>
              <div className="text-lg font-semibold text-gray-900">
                {carbonFootprint.equivalentCarRide || 'N/A'}
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <span className="text-2xl mb-2 block">🌳</span>
              <div className="text-sm text-gray-600">Trees to Offset</div>
              <div className="text-lg font-semibold text-gray-900">
                {carbonFootprint.treesToOffset || 'N/A'}
              </div>
            </div>
            {carbonFootprint.savingsVsConventional && (
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <span className="text-2xl mb-2 block">🏆</span>
                <div className="text-sm text-gray-600">Savings vs Conventional</div>
                <div className="text-lg font-semibold text-green-700">
                  {carbonFootprint.savingsVsConventional}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detailed Sustainability Information */}
      {showDetails && sustainability && (
        <div className="space-y-6 border-t pt-6">
          {/* Materials */}
          {sustainability.materials && sustainability.materials.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Materials Used</h4>
              <div className="space-y-2">
                {sustainability.materials.map((material, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{material.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{material.type}</div>
                    </div>
                    <div className="text-sm text-gray-600">{material.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Production Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sustainability.weight && sustainability.weight.value > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Product Weight</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {sustainability.weight.value} {sustainability.weight.unit}
                  </div>
                </div>
              </div>
            )}

            {sustainability.productionEnergySource && sustainability.productionEnergySource !== 'unknown' && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Production Energy</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="mr-2">⚡</span>
                    <span className="text-gray-900 capitalize">
                      {sustainability.productionEnergySource.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Manufacturing Location */}
          {sustainability.manufacturingLocation && (
            sustainability.manufacturingLocation.country || sustainability.manufacturingLocation.city
          ) && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Manufacturing Location</h4>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  <span className="text-gray-900">
                    {sustainability.manufacturingLocation.city && sustainability.manufacturingLocation.country
                      ? `${sustainability.manufacturingLocation.city}, ${sustainability.manufacturingLocation.country}`
                      : sustainability.manufacturingLocation.city || sustainability.manufacturingLocation.country
                    }
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Shipping Information */}
          {sustainability.shipping && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Shipping Information</h4>
              <div className="space-y-3">
                {sustainability.shipping.origin && (
                  sustainability.shipping.origin.country || sustainability.shipping.origin.city
                ) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Origin</div>
                    <div className="text-gray-900">
                      {sustainability.shipping.origin.city && sustainability.shipping.origin.country
                        ? `${sustainability.shipping.origin.city}, ${sustainability.shipping.origin.country}`
                        : sustainability.shipping.origin.city || sustainability.shipping.origin.country
                      }
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {sustainability.shipping.method && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Method</div>
                      <div className="text-gray-900 capitalize">
                        {sustainability.shipping.method.replace('_', ' ')}
                      </div>
                    </div>
                  )}

                  {sustainability.shipping.distance && sustainability.shipping.distance > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Distance</div>
                      <div className="text-gray-900">
                        {sustainability.shipping.distance} km
                      </div>
                    </div>
                  )}

                  {sustainability.shipping.packagingType && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Packaging</div>
                      <div className="flex items-center">
                        <span className="mr-2">📦</span>
                        <span className="text-gray-900 capitalize">
                          {sustainability.shipping.packagingType}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Environmental Tips */}
      {carbonFootprint && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="text-sm font-medium text-green-800 mb-2">Environmental Tips</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Consider the environmental impact when making purchasing decisions</li>
            <li>• Support products with lower carbon footprints</li>
            <li>• Look for recycled and sustainable materials</li>
            <li>• Choose products with minimal packaging</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default CarbonFootprintDisplay; 