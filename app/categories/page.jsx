'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DualNavbarSell from '../components/DualNavbarSell';
import ProductCard from '../components/ProductCard';
import axios from 'axios';

export default function CategoriesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = 'Categories | Eraiiz';
  }, []);

  const categories = [
    { id: 'all', name: 'All Products', image: '/recycling-grid.png', color: 'bg-gradient-to-r from-green-400 to-green-600' },
    { 
      id: 'plastic', 
      name: 'Plastic', 
      image: '/plastic-products.png', 
      color: 'bg-gradient-to-r from-blue-400 to-blue-600',
      subcategories: [
        { id: 'plastic-fashion', name: 'Fashion', description: 'Shoes (Men & Women), Clothing, Accessories' },
        { id: 'plastic-kitchen', name: 'Kitchen Wares', description: 'Utensils, Containers, Appliances' },
        { id: 'plastic-furniture', name: 'Furniture', description: 'Chairs, Tables, Storage Solutions' },
        { id: 'plastic-lifestyle', name: 'Lifestyle', description: 'Home Decor, Personal Care, Sports' }
      ]
    },
    { 
      id: 'glass', 
      name: 'Glass', 
      image: '/glass-products.png', 
      color: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
      subcategories: [
        { id: 'glass-kitchen', name: 'Kitchen Wares', description: 'Drinking Glasses, Bowls, Storage' },
        { id: 'glass-decor', name: 'Home Decor', description: 'Vases, Lamps, Decorative Items' },
        { id: 'glass-furniture', name: 'Furniture', description: 'Tables, Shelves, Display Cases' },
        { id: 'glass-lifestyle', name: 'Lifestyle', description: 'Jewelry, Art, Collectibles' }
      ]
    },
    { 
      id: 'rubber', 
      name: 'Rubber', 
      image: '/image3.png', 
      color: 'bg-gradient-to-r from-gray-400 to-gray-600',
      subcategories: [
        { id: 'rubber-automotive', name: 'Automotive', description: 'Tires, Mats, Gaskets' },
        { id: 'rubber-industrial', name: 'Industrial', description: 'Seals, Belts, Hoses' },
        { id: 'rubber-lifestyle', name: 'Lifestyle', description: 'Shoes, Sports Equipment, Toys' },
        { id: 'rubber-construction', name: 'Construction', description: 'Flooring, Insulation, Safety Gear' }
      ]
    },
    { 
      id: 'wood', 
      name: 'Wood', 
      image: '/image4.png', 
      color: 'bg-gradient-to-r from-amber-400 to-amber-600',
      subcategories: [
        { id: 'wood-furniture', name: 'Furniture', description: 'Tables, Chairs, Cabinets' },
        { id: 'wood-decor', name: 'Home Decor', description: 'Wall Art, Sculptures, Frames' },
        { id: 'wood-kitchen', name: 'Kitchen Wares', description: 'Cutting Boards, Utensils, Bowls' },
        { id: 'wood-lifestyle', name: 'Lifestyle', description: 'Jewelry, Accessories, Gifts' }
      ]
    },
    { 
      id: 'palm', 
      name: 'Palm', 
      image: '/image5.png', 
      color: 'bg-gradient-to-r from-orange-400 to-orange-600',
      subcategories: [
        { id: 'palm-basketry', name: 'Basketry', description: 'Baskets, Mats, Storage' },
        { id: 'palm-decor', name: 'Home Decor', description: 'Wall Hangings, Rugs, Ornaments' },
        { id: 'palm-furniture', name: 'Furniture', description: 'Chairs, Tables, Shelves' },
        { id: 'palm-lifestyle', name: 'Lifestyle', description: 'Hats, Bags, Accessories' }
      ]
    },
    { 
      id: 'recycled', 
      name: 'Recycled', 
      image: '/recycled-products.png', 
      color: 'bg-gradient-to-r from-green-500 to-green-700',
      subcategories: [
        { id: 'recycled-fashion', name: 'Fashion', description: 'Clothing, Bags, Accessories' },
        { id: 'recycled-home', name: 'Home & Garden', description: 'Furniture, Decor, Garden Items' },
        { id: 'recycled-office', name: 'Office & Stationery', description: 'Paper Products, Desk Items' },
        { id: 'recycled-lifestyle', name: 'Lifestyle', description: 'Personal Care, Sports, Toys' }
      ]
    },
    { 
      id: 'fruits', 
      name: 'Fruits', 
      image: '/image6.png', 
      color: 'bg-gradient-to-r from-red-400 to-red-600',
      subcategories: [
        { id: 'fruits-fresh', name: 'Fresh Fruits', description: 'Organic, Seasonal, Local' },
        { id: 'fruits-processed', name: 'Processed Products', description: 'Dried Fruits, Jams, Juices' },
        { id: 'fruits-skincare', name: 'Skincare', description: 'Natural Face Masks, Scrubs, Oils' },
        { id: 'fruits-beverages', name: 'Beverages', description: 'Juices, Smoothies, Teas' }
      ]
    },
    { 
      id: 'others', 
      name: 'Others', 
      image: '/image11.png', 
      color: 'bg-gradient-to-r from-purple-400 to-purple-600',
      subcategories: [
        { id: 'others-textiles', name: 'Textiles', description: 'Fabrics, Clothing, Home Textiles' },
        { id: 'others-electronics', name: 'Electronics', description: 'Gadgets, Accessories, Components' },
        { id: 'others-crafts', name: 'Crafts', description: 'Handmade Items, Art Supplies' },
        { id: 'others-misc', name: 'Miscellaneous', description: 'Unique Items, Collectibles, Gifts' }
      ]
    },
  ];

  const fetchProducts = async (category = 'all', subcategory = null) => {
    setIsLoading(true);
    setError(null);
    
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/products`;
      const params = new URLSearchParams();
      
      if (category !== 'all') {
        params.append('category', category);
      }
      
      if (subcategory) {
        params.append('subcategory', subcategory);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url, {
        timeout: 10000,
      });
      
      // Ensure products is always an array
      let productData = [];
      if (response.data) {
        if (Array.isArray(response.data)) {
          productData = response.data;
        } else if (response.data.products && Array.isArray(response.data.products)) {
          productData = response.data.products;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          productData = response.data.data;
        } else if (typeof response.data === 'object' && Object.keys(response.data).length === 0) {
          productData = [];
        } else {
          console.warn('Unexpected API response format:', response.data);
          productData = [];
        }
      }
      
      console.log('Products data:', productData);
      setProducts(productData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setProducts([]); // Ensure products is an empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(selectedCategory, selectedSubcategory);
  }, [selectedCategory, selectedSubcategory]);

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(null); // Reset subcategory when main category changes
  };

  const handleSubcategoryClick = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
  };

  const getCategoryDisplayName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'All Products';
  };

  const getCurrentCategory = () => {
    return categories.find(cat => cat.id === selectedCategory);
  };

  const getCurrentSubcategory = () => {
    const category = getCurrentCategory();
    if (!category || !category.subcategories) return null;
    return category.subcategories.find(sub => sub.id === selectedSubcategory);
  };

  return (
    <>
      <DualNavbarSell />
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center mb-8 mt-8">
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-2">
                Product Categories
              </h1>
              <p className="text-xs text-gray-600">
                Discover sustainable products across all categories
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex items-center justify-center px-4 py-2.5 rounded-full text-xs font-medium transition-all duration-200 min-w-[90px] h-8 ${
                    selectedCategory === category.id
                      ? 'bg-[#3F8E3F] text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${category.color.replace('bg-gradient-to-r', 'bg')}`}></div>
                  <span className="text-center leading-none whitespace-nowrap">{category.name}</span>
                </button>
              ))}
            </div>

            {/* Subcategories Section */}
            {getCurrentCategory() && getCurrentCategory().subcategories && (
              <div className="mt-6">
                <div className="text-center mb-4">
                  <h2 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    {getCurrentCategory().name} Subcategories
                  </h2>
                  <p className="text-xs text-gray-500">
                    Explore specific {getCurrentCategory().name.toLowerCase()} product types
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {getCurrentCategory().subcategories.map((subcategory) => (
                    <button
                      key={subcategory.id}
                      onClick={() => handleSubcategoryClick(subcategory.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                        selectedSubcategory === subcategory.id
                          ? 'border-[#3F8E3F] bg-[#3F8E3F] text-white shadow-md'
                          : 'border-gray-200 bg-white hover:border-[#3F8E3F] hover:bg-gray-50'
                      }`}
                    >
                      <div className="space-y-2">
                        <h3 className={`text-xs font-semibold leading-tight ${
                          selectedSubcategory === subcategory.id ? 'text-white' : 'text-gray-900'
                        }`}>
                          {subcategory.name}
                        </h3>
                        <p className={`text-xs leading-tight ${
                          selectedSubcategory === subcategory.id ? 'text-gray-100' : 'text-gray-500'
                        }`}>
                          {subcategory.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Section */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Category Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xs sm:text-sm md:text-base font-semibold text-gray-900">
                {selectedSubcategory ? getCurrentSubcategory()?.name : getCategoryDisplayName(selectedCategory)}
                {selectedSubcategory && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({getCategoryDisplayName(selectedCategory)})
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                {Array.isArray(products) ? products.length : 0} {Array.isArray(products) && products.length === 1 ? 'product' : 'products'} found
                {selectedSubcategory && getCurrentSubcategory() && (
                  <span className="ml-1">
                    in {getCurrentSubcategory().name}
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {selectedSubcategory && (
                <button
                  onClick={() => setSelectedSubcategory(null)}
                  className="text-xs text-[#3F8E3F] hover:text-[#357C35] font-medium"
                >
                  View All {getCategoryDisplayName(selectedCategory)}
                </button>
              )}
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => handleCategoryClick('all')}
                  className="text-xs text-[#3F8E3F] hover:text-[#357C35] font-medium"
                >
                  View All Products
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3F8E3F]"></div>
              <span className="ml-3 text-sm text-gray-600">Loading products...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Error Loading Products</h3>
              <p className="text-xs text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => fetchProducts(selectedCategory)}
                className="px-4 py-2 bg-[#3F8E3F] text-white text-xs rounded-lg hover:bg-[#357C35] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && (
            <>
              {!Array.isArray(products) || products.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No Products Found</h3>
                  <p className="text-xs text-gray-500">
                    No products available in this category yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Category Stats */}
          {!isLoading && !error && Array.isArray(products) && products.length > 0 && (
            <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Category Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Total Products</p>
                  <p className="font-semibold text-gray-900">{products.length}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price Range</p>
                  <p className="font-semibold text-gray-900">
                    ₦{Math.min(...products.map(p => p.price)).toLocaleString()} - ₦{Math.max(...products.map(p => p.price)).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Average Rating</p>
                  <p className="font-semibold text-gray-900">
                    {(products.reduce((sum, p) => sum + (p.averageRating || 0), 0) / products.length).toFixed(1)} ⭐
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-semibold text-[#3F8E3F]">{getCategoryDisplayName(selectedCategory)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}