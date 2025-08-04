'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const reportReasons = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Contains offensive, harmful, or inappropriate material'
  },
  {
    value: 'fake_product',
    label: 'Fake Product',
    description: 'Product is not genuine or misrepresents what it is'
  },
  {
    value: 'counterfeit',
    label: 'Counterfeit',
    description: 'Unauthorized copy or imitation of a genuine product'
  },
  {
    value: 'harmful_material',
    label: 'Harmful Material',
    description: 'Contains dangerous or hazardous materials'
  },
  {
    value: 'misleading_description',
    label: 'Misleading Description',
    description: 'Product description is inaccurate or deceptive'
  },
  {
    value: 'wrong_category',
    label: 'Wrong Category',
    description: 'Product is listed in the wrong category'
  },
  {
    value: 'duplicate_listing',
    label: 'Duplicate Listing',
    description: 'Same product listed multiple times'
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unwanted or repetitive content'
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above'
  }
];

export default function ReportModal({ isOpen, onClose, productId, productName }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason || !description.trim()) {
      setError('Please select a reason and provide a description');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide a more detailed description (at least 10 characters)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Please log in to submit a report');
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/reports`,
        {
          productId,
          reason: selectedReason,
          description: description.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setSelectedReason('');
        setDescription('');
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setSelectedReason('');
      setDescription('');
      setError('');
      setIsSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Report Product</h2>
                <p className="text-sm text-gray-500">Help us maintain quality standards</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success State */}
          {isSuccess && (
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted</h3>
              <p className="text-sm text-gray-600">
                Thank you for your report. We'll review it and take appropriate action.
              </p>
            </div>
          )}

          {/* Form */}
          {!isSuccess && (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Reporting:</p>
                <p className="text-sm font-medium text-gray-900">{productName}</p>
              </div>

              {/* Reason Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for Report *
                </label>
                <div className="space-y-2">
                  {reportReasons.map((reason) => (
                    <label
                      key={reason.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedReason === reason.value
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={reason.value}
                        checked={selectedReason === reason.value}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="mt-1 w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {reason.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {reason.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Additional Details *
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please provide specific details about your concern..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Be specific and helpful</span>
                  <span>{description.length}/500</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedReason || !description.trim()}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
} 