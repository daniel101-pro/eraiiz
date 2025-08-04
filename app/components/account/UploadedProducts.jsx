'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Edit2, Trash2, Eye, DollarSign, Package, Calendar, MoreVertical, Search } from 'lucide-react';

export default function UploadedProducts({ onTokenError }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          onTokenError();
          return;
        }
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products/seller`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          timeout: 30000,
        });
        setProducts(res.data);
      } catch (err) {
        if (err.response?.status === 401 || err.message.includes('Invalid or expired token')) {
          onTokenError();
        } else if (err.response?.status === 404) {
          setError('No products found. Start uploading products to see them here!');
        } else {
          setError(err.message || 'Failed to fetch products');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [onTokenError]);

  const handleDelete = async (productId) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setProducts(products.filter((p) => p._id !== productId));
      setDeleteProduct(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete product');
      setDeleteProduct(null);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct({ ...product });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${editingProduct._id}`, {
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        category: editingProduct.category,
        status: editingProduct.status,
      }, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setProducts(products.map((p) => p._id === editingProduct._id ? res.data : p));
      setEditingProduct(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleChange = (e) => {
    setEditingProduct({ ...editingProduct, [e.target.name]: e.target.value });
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Enhanced search - check name, description, and category
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower)) ||
        (product.category && product.category.toLowerCase().includes(searchLower));
      
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      
      // Debug logging
      if (searchQuery && product.name) {
        console.log(`Searching "${searchQuery}" in "${product.name}": ${matchesSearch}`);
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        case 'oldest':
          return new Date(a.updatedAt) - new Date(b.updatedAt);
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        dot: 'bg-green-400',
        label: 'Active'
      },
      inactive: {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        dot: 'bg-gray-400',
        label: 'Inactive'
      },
      draft: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        dot: 'bg-yellow-400',
        label: 'Draft'
      }
    };

    const config = statusConfig[status] || statusConfig.inactive;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading products...</span>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-8">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
          <p className="text-gray-500 mb-6">{error}</p>
          <button className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Package className="w-4 h-4 mr-2" />
            Upload Your First Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-xl border border-gray-100">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your uploaded products ({products.length} total{searchQuery || filterStatus !== 'all' ? `, ${filteredProducts.length} filtered` : ''})
            </p>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, description, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
            
            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-6">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products match your filters</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="group bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-200 overflow-hidden">
                <div className="p-4">
                  {/* Title at top (ProductCard layout) */}
                  <div className="relative mb-3">
                    <h3 className="font-semibold text-gray-900 text-base mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* Status badge in top right */}
                    <div className="absolute top-0 right-0">
                      {getStatusBadge(product.status)}
                    </div>
                  </div>

                  {/* Price and Reviews in same line (ProductCard layout) */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center text-green-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold text-lg">
                        {product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      {product.totalReviews || '0'} reviews
                    </div>
                  </div>

                  {/* Category tag (ProductCard layout) */}
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 bg-blue-50 rounded-full px-2 py-1 inline-block">
                      {product.category || 'Uncategorized'}
                    </span>
                  </div>

                  {/* Product Image (ProductCard layout) */}
                  <div className="relative aspect-square overflow-hidden bg-gray-50 rounded-lg mb-4">
                    <Image
                      src={product.images[0] || '/placeholder-product.png'}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-50">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3 mr-1" />
                    Updated: {new Date(product.updatedAt).toLocaleDateString()}
                  </div>

                  {/* Action Buttons at bottom (ProductCard layout) */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteProduct(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
              <p className="text-sm text-gray-500 mt-1">Update your product information</p>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                <input
                  type="text"
                  name="name"
                  value={editingProduct.name || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  value={editingProduct.description || ''}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (₦)</label>
                <input
                  type="number"
                  name="price"
                  value={editingProduct.price || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  value={editingProduct.category || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="Plastic Made Products">Plastic Made Products</option>
                  <option value="Rubber Made Products">Rubber Made Products</option>
                  <option value="Glass Made Products">Glass Made Products</option>
                  <option value="Wood Made Products">Wood Made Products</option>
                  <option value="Palm Frond Made Products">Palm Frond Made Products</option>
                  <option value="General Recycled Items">General Recycled Items</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={editingProduct.status || 'active'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Product</h3>
              <p className="text-gray-500 mb-6">
                Are you sure you want to delete "{deleteProduct.name}"? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDelete(deleteProduct._id)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteProduct(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}