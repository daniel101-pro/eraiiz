'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import RealTimeUpdater from '../components/RealTimeUpdater';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  material: string;
  images: string[];
  status: 'active' | 'inactive' | 'pending' | 'rejected';
  averageRating: number;
  totalReviews: number;
  stock: number;
  sellerId: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  sustainability?: {
    materials: Array<{
      name: string;
      type: string;
      percentage: number;
    }>;
  };
  carbonFootprint?: {
    total: number;
    impactScore: string;
  };
}

interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  totalRevenue: number;
  averageRating: number;
  topCategories: Array<{
    category: string;
    count: number;
  }>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [limit, setLimit] = useState(20);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch products from API
  const fetchProducts = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: limit.toString(),
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        sortBy,
        sortOrder
      });

      const response = await api.get(`/admin/products?${params}`);
      const { products: fetchedProducts, pagination: paginationData } = response.data;
      
      setProducts(fetchedProducts);
      setPagination(paginationData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch product statistics
  const fetchProductStats = async () => {
    try {
      const response = await api.get('/admin/products/stats');
      setProductStats(response.data);
    } catch (error) {
      console.error('Error fetching product stats:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProducts();
    fetchProductStats();
  }, []);

  // Real-time updates
  useEffect(() => {
    fetchProducts(true);
  }, [pagination.currentPage, limit, sortBy, sortOrder]);

  // Filter products when search/filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchProducts();
  }, [searchTerm, selectedCategory, selectedStatus]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleProductAction = async (action: string, productId: string) => {
    try {
      switch (action) {
        case 'approve':
          await api.patch(`/admin/products/${productId}/approve`);
          break;
        case 'reject':
          await api.patch(`/admin/products/${productId}/reject`);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this product?')) {
            await api.delete(`/admin/products/${productId}`);
          }
          break;
        default:
          console.log(`${action} product:`, productId);
      }
      
      // Refresh data after action
      fetchProducts(true);
      fetchProductStats();
    } catch (error) {
      console.error(`Error ${action} product:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      if (selectedProducts.length === 0) return;
      
      switch (action) {
        case 'approve':
          await api.patch('/admin/products/bulk/approve', { productIds: selectedProducts });
          break;
        case 'reject':
          await api.patch('/admin/products/bulk/reject', { productIds: selectedProducts });
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
            await api.delete('/admin/products/bulk', { data: { productIds: selectedProducts } });
          }
          break;
      }
      
      setSelectedProducts([]);
      fetchProducts(true);
      fetchProductStats();
    } catch (error) {
      console.error(`Error bulk ${action}:`, error);
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAllProducts = () => {
    setSelectedProducts(
      selectedProducts.length === filteredProducts.length 
        ? [] 
        : filteredProducts.map(product => product._id)
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Very Low': return 'bg-green-100 text-green-800';
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = ['Kitchen & Dining', 'Clothing', 'Home & Garden', 'Electronics', 'Beauty & Personal Care'];

  return (
    <AdminLayout>
      <RealTimeUpdater 
        onUpdate={() => {
          fetchProducts(true);
          fetchProductStats();
        }} 
        interval={30000} 
        enabled={!loading} 
      />
      
      <div className="space-y-8">
        {/* Simplified Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">Manage products, approve listings, and monitor sustainability</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live</span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Product Statistics */}
        {productStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats.totalProducts.toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats.activeProducts.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <ApproveIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats.pendingProducts.toLocaleString()}</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{productStats.averageRating.toFixed(1)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <StarIcon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-200 rounded-xl w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredProducts.length} of {pagination.totalProducts} products
              </div>
              <button
                onClick={() => {
                  fetchProducts(true);
                  fetchProductStats();
                }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                title="Refresh"
              >
                <RefreshIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-blue-800">
                  {selectedProducts.length} product(s) selected
                </span>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleBulkAction('approve')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <ApproveIcon className="w-4 h-4" />
                  <span>Approve</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('reject')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <RejectIcon className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <DeleteIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="bg-white rounded-[24px] overflow-hidden p-5 border border-[#E5E5E5] hover:shadow-xl transition-all duration-300">
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product._id)}
                          onChange={() => toggleProductSelection(product._id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                      </div>
                      {product.carbonFootprint && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getImpactColor(product.carbonFootprint.impactScore)}`}>
                          {product.carbonFootprint.impactScore} Impact
                        </span>
                      )}
                    </div>

                    {/* Product Title */}
                    <h3 className="text-xs sm:text-xs md:text-xs text-[#1A1A1A] font-medium leading-tight mb-2">
                      {product.name}
                    </h3>

                    {/* Price and Reviews */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs sm:text-xs md:text-xs text-[#1A1A1A] font-semibold">
                        {product.currency} {product.price}
                      </div>
                      <div className="text-[#666666] text-[8px] sm:text-xs">
                        {product.totalReviews || '0'} reviews
                      </div>
                    </div>

                    {/* Category Tag */}
                    <div className="mb-3">
                      <span className="inline-block bg-[#EBF6FF] text-[#1A1A1A] px-1.5 py-0.5 rounded-full text-[8px] sm:text-xs">
                        {product.category || 'Uncategorized'}
                      </span>
                    </div>

                    {/* Product Image */}
                    <div className="mb-4">
                      <div className="relative rounded-xl overflow-hidden h-[140px] sm:h-[180px] md:h-[220px] bg-gray-200">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Info Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 text-xs">Material:</span>
                        <div className="font-medium text-xs">{product.material}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Stock:</span>
                        <div className="font-medium text-xs">{product.stock || 0}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Seller:</span>
                        <div className="font-medium text-xs truncate">{product.sellerId.name}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Rating:</span>
                        <div className="font-medium text-xs">{product.averageRating?.toFixed(1) || '0.0'}</div>
                      </div>
                    </div>

                    {/* Rating Display */}
                    {product.totalReviews > 0 && (
                      <div className="flex items-center gap-1 bg-white rounded-full px-2 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.08)] mb-3 w-fit">
                        <svg className="w-2 h-2 text-[#3F8E3F]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-[#3F8E3F] text-[8px] sm:text-xs font-medium">{product.averageRating?.toFixed(1) || '0.0'}</span>
                      </div>
                    )}

                    {/* Sustainability Info */}
                    {product.sustainability && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-500 mb-1">Sustainable Materials:</div>
                        <div className="flex flex-wrap gap-1">
                          {product.sustainability.materials.map((material, index) => (
                            <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {material.percentage}% {material.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleProductAction('view', product._id)}
                        className="flex-1 text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium flex items-center justify-center"
                        title="View Details"
                      >
                        <ViewIcon className="w-4 h-4 mr-1" />
                        View
                      </button>
                      {product.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleProductAction('approve', product._id)}
                            className="flex-1 text-green-600 hover:text-green-800 transition-colors text-sm font-medium flex items-center justify-center"
                            title="Approve Product"
                          >
                            <ApproveIcon className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleProductAction('reject', product._id)}
                            className="flex-1 text-red-600 hover:text-red-800 transition-colors text-sm font-medium flex items-center justify-center"
                            title="Reject Product"
                          >
                            <RejectIcon className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </>
                      )}
                      {product.status !== 'pending' && (
                        <>
                          <button
                            onClick={() => handleProductAction('edit', product._id)}
                            className="flex-1 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium flex items-center justify-center"
                            title="Edit Product"
                          >
                            <EditIcon className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleProductAction('delete', product._id)}
                            className="flex-1 text-red-600 hover:text-red-800 transition-colors text-sm font-medium flex items-center justify-center"
                            title="Delete Product"
                          >
                            <DeleteIcon className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modern Pagination */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-4 border border-gray-100 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * limit) + 1} to {Math.min(pagination.currentPage * limit, pagination.totalProducts)} of {pagination.totalProducts} results
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
              {pagination.currentPage}
            </span>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}