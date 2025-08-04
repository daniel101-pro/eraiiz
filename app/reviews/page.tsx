'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  Search as SearchIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Report as ReportIcon,
  Flag as FlagIcon
} from '@mui/icons-material';

interface Review {
  _id: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  username: string;
  rating: number;
  comment: string;
  images: string[];
  likes: number;
  dislikes: number;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reports?: Array<{
    reason: string;
    reportedBy: string;
    date: string;
  }>;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        _id: '1',
        productId: {
          _id: 'product1',
          name: 'Eco-Friendly Water Bottle',
          images: ['/placeholder-product.jpg']
        },
        userId: {
          _id: 'user1',
          name: 'John Doe',
          email: 'john@example.com'
        },
        username: 'john_doe',
        rating: 5,
        comment: 'Amazing product! Really love the sustainable materials and the quality is outstanding. Highly recommend to anyone looking for eco-friendly alternatives.',
        images: ['/placeholder-review1.jpg', '/placeholder-review2.jpg'],
        likes: 12,
        dislikes: 1,
        createdAt: '2024-01-25T10:30:00.000Z',
        status: 'pending'
      },
      {
        _id: '2',
        productId: {
          _id: 'product2',
          name: 'Organic Cotton T-Shirt',
          images: ['/placeholder-product2.jpg']
        },
        userId: {
          _id: 'user2',
          name: 'Jane Smith',
          email: 'jane@example.com'
        },
        username: 'jane_s',
        rating: 2,
        comment: 'Product quality is terrible. The fabric feels cheap and the sizing is completely off. Would not recommend.',
        images: [],
        likes: 3,
        dislikes: 8,
        createdAt: '2024-01-24T14:15:00.000Z',
        status: 'flagged',
        reports: [
          {
            reason: 'Fake review',
            reportedBy: 'user3',
            date: '2024-01-25T09:00:00.000Z'
          },
          {
            reason: 'Inappropriate content',
            reportedBy: 'user4',
            date: '2024-01-25T11:30:00.000Z'
          }
        ]
      },
      {
        _id: '3',
        productId: {
          _id: 'product3',
          name: 'Bamboo Phone Case',
          images: ['/placeholder-product3.jpg']
        },
        userId: {
          _id: 'user3',
          name: 'Mike Johnson',
          email: 'mike@example.com'
        },
        username: 'mike_j',
        rating: 4,
        comment: 'Good product overall. The bamboo material feels nice and provides good protection. Only minor issue is that it can be a bit slippery.',
        images: ['/placeholder-review3.jpg'],
        likes: 7,
        dislikes: 2,
        createdAt: '2024-01-23T16:45:00.000Z',
        status: 'approved'
      }
    ];
    
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.productId.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = selectedRating === 'all' || review.rating.toString() === selectedRating;
    const matchesStatus = selectedStatus === 'all' || review.status === selectedStatus;
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  const handleReviewAction = (action: string, reviewId: string) => {
    console.log(`${action} review:`, reviewId);
    
    if (action === 'approve') {
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { ...review, status: 'approved' as const }
          : review
      ));
    } else if (action === 'reject') {
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { ...review, status: 'rejected' as const }
          : review
      ));
    } else if (action === 'flag') {
      setReviews(prev => prev.map(review => 
        review._id === reviewId 
          ? { ...review, status: 'flagged' as const }
          : review
      ));
    }
  };

  const handleBulkAction = (action: string) => {
    console.log(`${action} selected reviews:`, selectedReviews);
    // Implement bulk actions here
  };

  const toggleReviewSelection = (reviewId: string) => {
    setSelectedReviews(prev => 
      prev.includes(reviewId) 
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const selectAllReviews = () => {
    setSelectedReviews(
      selectedReviews.length === filteredReviews.length 
        ? [] 
        : filteredReviews.map(review => review._id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'flagged': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <StarIcon 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const getPriorityLevel = (review: Review) => {
    if (review.status === 'flagged' && review.reports && review.reports.length > 1) return 'high';
    if (review.status === 'pending' && review.rating <= 2) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <StarIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Review Moderation</h1>
                <p className="text-sm text-gray-500 mt-1">Moderate customer reviews and handle reported content</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{reviews.filter(r => r.status === 'pending').length} Pending</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>{reviews.filter(r => r.status === 'flagged').length} Flagged</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {[
                { key: 'all', label: 'All', count: reviews.length },
                { key: 'pending', label: 'Pending', count: reviews.filter(r => r.status === 'pending').length },
                { key: 'flagged', label: 'Flagged', count: reviews.filter(r => r.status === 'flagged').length }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedStatus(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedStatus === tab.key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReviews.length > 0 && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-900">
                  {selectedReviews.length} review(s) selected
                </span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="flex items-center gap-2 px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <ApproveIcon className="w-4 h-4" />
                  Approve
                </button>
                <button 
                  onClick={() => handleBulkAction('reject')}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <RejectIcon className="w-4 h-4" />
                  Reject
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
                >
                  <DeleteIcon className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100">
          {loading ? (
            <div className="p-6 md:p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading reviews...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-6 md:p-12 text-center">
              <StarIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-sm text-gray-500">No reviews match your current filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredReviews.map((review) => {
                const priority = getPriorityLevel(review);
                
                return (
                  <div key={review._id} className={`p-4 md:p-6 hover:bg-gray-50 transition-colors ${
                    priority === 'high' ? 'bg-red-50/50' : ''
                  }`}>
                    <div className="flex items-start gap-3 md:gap-4">
                      {/* Icon */}
                      <div className={`p-1.5 md:p-2 rounded-lg ${
                        review.status === 'flagged' ? 'bg-orange-100 border-orange-200' :
                        review.status === 'pending' ? 'bg-yellow-100 border-yellow-200' :
                        review.status === 'approved' ? 'bg-green-100 border-green-200' :
                        'bg-gray-100 border-gray-200'
                      }`}>
                        <StarIcon className="w-4 h-4 text-gray-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 md:gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-medium text-gray-900">
                                {review.productId.name}
                              </h3>
                              {priority === 'high' && (
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm mb-2">
                              {review.comment}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <span>By {review.username}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                                <span>{review.rating}/5</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Posted: {new Date(review.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Status and Actions */}
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(review.status)}`}>
                              {review.status}
                            </span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleReviewAction('view', review._id)}
                                className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                              >
                                <ViewIcon className="w-3 h-3" />
                                View
                              </button>
                              {review.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleReviewAction('approve', review._id)}
                                    className="flex items-center gap-1 px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs font-medium transition-colors"
                                  >
                                    <ApproveIcon className="w-3 h-3" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReviewAction('reject', review._id)}
                                    className="flex items-center gap-1 px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs font-medium transition-colors"
                                  >
                                    <RejectIcon className="w-3 h-3" />
                                    Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-lg flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing 1 to {filteredReviews.length} of {reviews.length} results
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Previous
            </button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
              1
            </button>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}