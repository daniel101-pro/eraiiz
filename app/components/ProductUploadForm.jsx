'use client';
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import axios from 'axios';
import Image from 'next/image';
import { Toaster } from 'react-hot-toast';
import { showProductToast, showError, showSuccess } from '../utils/toast';
import { useRouter } from 'next/navigation';
import { useCurrency } from '../context/CurrencyContext';
import { ChevronDown, Globe, DollarSign, Info, Upload, X, Plus, Minus, Package, Camera, Star, ShoppingBag, Leaf, Award } from 'lucide-react';

const ProductUploadForm = () => {
  const { getCurrencyInfo } = useCurrency();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'NGN',
    category: '',
    subcategory: '',
    material: '',
    details: [''],
    images: [],
    sizes: {
      S: { available: false, stock: 0 },
      L: { available: false, stock: 0 },
      XL: { available: false, stock: 0 },
      XXL: { available: false, stock: 0 },
      XXXL: { available: false, stock: 0 }
    },
    bonus: {
      enabled: false,
      type: 'percentage',
      value: 0
    },
    sustainability: {
      materials: [{ name: '', type: 'conventional', percentage: 100 }],
      weight: { value: 0, unit: 'kg' },
      manufacturingLocation: { country: '', city: '' },
      productionEnergySource: 'unknown',
      shipping: {
        origin: { country: '', city: '' },
        destination: { country: 'Nigeria', city: '' },
        method: 'mixed',
        distance: 0,
        packagingType: 'conventional'
      },
      certifications: []
    }
  });

  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSustainability, setShowSustainability] = useState(false);
  const [carbonFootprint, setCarbonFootprint] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const router = useRouter();

  // Currency options
  const currencies = [
    { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  ];

  // Categories with subcategories
  const categories = [
    {
      name: 'Plastic Made Products',
      subcategories: [
        'Fashion',
        'Kitchen Wares',
        'Furniture',
        'Lifestyle'
      ]
    },
    {
      name: 'Rubber Made Products',
      subcategories: [
        'Automotive',
        'Industrial',
        'Lifestyle',
        'Construction'
      ]
    },
    {
      name: 'Glass Made Products',
      subcategories: [
        'Kitchen Wares',
        'Home Decor',
        'Furniture',
        'Lifestyle'
      ]
    },
    {
      name: 'Wood Made Products',
      subcategories: [
        'Furniture',
        'Home Decor',
        'Kitchen Wares',
        'Lifestyle'
      ]
    },
    {
      name: 'Palm Frond Made Products',
      subcategories: [
        'Basketry',
        'Home Decor',
        'Furniture',
        'Lifestyle'
      ]
    },
    {
      name: 'General Recycled Items',
      subcategories: [
        'Fashion',
        'Home & Garden',
        'Office & Stationery',
        'Lifestyle'
      ]
    },
  ];

  // Sustainability options
  const materialTypes = [
    { value: 'organic', label: 'Organic' },
    { value: 'recycled', label: 'Recycled' },
    { value: 'sustainable', label: 'Sustainable' },
    { value: 'conventional', label: 'Conventional' }
  ];

  const energySources = [
    { value: 'solar', label: 'Solar Power' },
    { value: 'wind', label: 'Wind Power' },
    { value: 'hydro', label: 'Hydroelectric' },
    { value: 'nuclear', label: 'Nuclear' },
    { value: 'fossil_fuel', label: 'Fossil Fuel' },
    { value: 'mixed', label: 'Mixed Sources' },
    { value: 'unknown', label: 'Unknown' }
  ];

  const shippingMethods = [
    { value: 'air', label: 'Air Freight' },
    { value: 'sea', label: 'Sea Freight' },
    { value: 'land', label: 'Land Transport' },
    { value: 'rail', label: 'Rail Transport' },
    { value: 'mixed', label: 'Mixed Methods' }
  ];

  const packagingTypes = [
    { value: 'recycled', label: 'Recycled Materials' },
    { value: 'biodegradable', label: 'Biodegradable' },
    { value: 'minimal', label: 'Minimal Packaging' },
    { value: 'conventional', label: 'Conventional' }
  ];

  // Session management functions
  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    try {
      const { data } = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 30000 }
      );
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    } catch (err) {
      console.error('Client: Refresh Error:', err.response?.data || err.message);
      return null;
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please sign in to access this page.');
        setIsLoading(false);
        return;
      }
      try {
        let res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        });
        if (res.status === 401) {
          token = await refreshToken();
          if (!token) throw new Error('Unable to refresh token');
          res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
          });
        }
        setSession(res.data);
      } catch (err) {
        console.error('Client: Session Error:', err.response?.data || err.message);
        setError('Please sign in to access this page.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const handleDetailChange = (index, value) => {
    const newDetails = [...product.details];
    newDetails[index] = value;
    setProduct((prev) => ({ ...prev, details: newDetails }));
  };

  const addDetail = () => {
    setProduct((prev) => ({
      ...prev,
      details: [...prev.details, ''],
    }));
  };

  const removeDetail = (index) => {
    setProduct((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setProduct((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeImage = (index) => {
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSizeToggle = (size) => {
    setProduct((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: {
          ...prev.sizes[size],
          available: !prev.sizes[size].available
        }
      }
    }));
  };

  const handleSizeStockChange = (size, value) => {
    setProduct((prev) => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [size]: {
          ...prev.sizes[size],
          stock: parseInt(value) || 0
        }
      }
    }));
  };

  const handleBonusToggle = () => {
    setProduct((prev) => ({
      ...prev,
      bonus: {
        ...prev.bonus,
        enabled: !prev.bonus.enabled
      }
    }));
  };

  const handleBonusChange = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      bonus: {
        ...prev.bonus,
        [field]: value
      }
    }));
  };

  // Sustainability handlers
  const addMaterial = () => {
    setProduct((prev) => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        materials: [...prev.sustainability.materials, { name: '', type: 'conventional', percentage: 0 }]
      }
    }));
  };

  const removeMaterial = (index) => {
    setProduct((prev) => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        materials: prev.sustainability.materials.filter((_, i) => i !== index)
      }
    }));
  };

  const updateMaterial = (index, field, value) => {
    setProduct((prev) => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        materials: prev.sustainability.materials.map((material, i) =>
          i === index ? { ...material, [field]: value } : material
        )
      }
    }));
  };

  const updateSustainability = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        [field]: value
      }
    }));
  };

  const updateShipping = (field, value) => {
    setProduct((prev) => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        shipping: {
          ...prev.sustainability.shipping,
          [field]: value
        }
      }
    }));
  };

  const updateShippingLocation = (type, field, value) => {
    setProduct((prev) => ({
      ...prev,
      sustainability: {
        ...prev.sustainability,
        shipping: {
          ...prev.sustainability.shipping,
          [type]: {
            ...prev.sustainability.shipping[type],
            [field]: value
          }
        }
      }
    }));
  };

  const calculateCarbonFootprint = async () => {
    // Validate required sustainability data before sending
    if (!product.sustainability.materials || product.sustainability.materials.length === 0) {
      showError('Please add at least one material before calculating carbon footprint');
      return;
    }
    
    if (!product.sustainability.weight || product.sustainability.weight.value <= 0) {
      showError('Please enter a valid product weight before calculating carbon footprint');
      return;
    }

    setIsCalculating(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/carbon-footprint/calculate`,
        { sustainabilityData: product.sustainability },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );
      
      console.log('Carbon footprint API response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('Carbon footprint data:', response.data.data.carbonFootprint);
        setCarbonFootprint(response.data.data.carbonFootprint);
        showProductToast('Carbon footprint calculated successfully!', 'success');
      } else {
        console.error('Carbon footprint calculation failed:', response.data);
        throw new Error(response.data?.error || 'Calculation failed');
      }
    } catch (error) {
      console.error('Error calculating carbon footprint:', error);
      
      if (error.response?.status === 404) {
        showError('Carbon footprint service is not available. Please try again later.');
      } else if (error.response?.status === 400) {
        showError(error.response?.data?.message || 'Invalid sustainability data provided');
      } else if (error.response?.status === 500) {
        showError('Server error while calculating carbon footprint. Please try again.');
      } else if (error.code === 'ECONNABORTED') {
        showError('Request timed out. Please check your connection and try again.');
      } else {
        showError(error.message || 'Failed to calculate carbon footprint. Please check your data and try again.');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const validateSustainability = () => {
    const { sustainability } = product;
    
    // Check if materials are filled
    if (!sustainability.materials.length || 
        sustainability.materials.some(material => !material.name.trim())) {
      return 'Please fill in all material names';
    }
    
    // Check if weight is provided
    if (!sustainability.weight.value || sustainability.weight.value <= 0) {
      return 'Please provide a valid product weight';
    }
    
    // Check if manufacturing location is provided
    if (!sustainability.manufacturingLocation.country.trim() || 
        !sustainability.manufacturingLocation.city.trim()) {
      return 'Please provide manufacturing location (country and city)';
    }
    
    // Check if shipping origin is provided
    if (!sustainability.shipping.origin.country.trim() || 
        !sustainability.shipping.origin.city.trim()) {
      return 'Please provide shipping origin (country and city)';
    }
    
    // Check if shipping distance is provided
    if (!sustainability.shipping.distance || sustainability.shipping.distance <= 0) {
      return 'Please provide shipping distance';
    }
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validate sustainability information
    const sustainabilityError = validateSustainability();
    if (sustainabilityError) {
      setError(sustainabilityError);
      showError(sustainabilityError);
      setIsSubmitting(false);
      return;
    }

    // Validate that carbon footprint has been calculated
    if (!carbonFootprint) {
      const cfError = 'Please calculate the carbon footprint before uploading the product';
      setError(cfError);
      showError(cfError);
      setIsSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();

      // Add product data
      Object.keys(product).forEach((key) => {
        if (key === 'images') {
          product.images.forEach((image) => formData.append('images', image));
        } else if (key === 'sizes' || key === 'bonus' || key === 'sustainability') {
          formData.append(key, JSON.stringify(product[key]));
        } else if (Array.isArray(product[key])) {
          formData.append(key, JSON.stringify(product[key]));
        } else {
          formData.append(key, product[key]);
        }
      });

      // Add carbon footprint if calculated
      if (carbonFootprint) {
        formData.append('carbonFootprint', JSON.stringify(carbonFootprint));
        console.log('Adding carbon footprint to upload:', carbonFootprint);
      }

      // Debug: Log what we're sending
      console.log('Uploading product with sustainability data:', product.sustainability);
      console.log('Carbon footprint being uploaded:', carbonFootprint);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000,
        }
      );

      setSuccess('Product uploaded successfully!');
      showProductToast('Product uploaded successfully!', 'success');
      
      // Redirect to success page with product ID
      setTimeout(() => {
        router.push(`/dashboard/seller/upload/success?productId=${response.data.productId}`);
      }, 2000);

    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white md:bg-gradient-to-br md:from-green-50 md:via-white md:to-blue-50 p-0 md:py-12 md:px-4">

      
      <div className="max-w-6xl mx-auto m-0 md:mt-0">
        {/* Header Section */}
        <div className="text-center mb-2 md:mb-12">
          <div className="hidden md:inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
            <Upload className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-bold text-gray-900 mb-2 md:mb-4">Upload New Product</h1>
          <p className="text-sm md:text-xl text-gray-600 max-w-3xl mx-auto">
            Create your product listing with all the essential details to attract customers and boost sales
          </p>
        </div>

        {/* Alert Messages */}
        {success && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-green-800 flex items-center gap-2">
              <Award className="h-5 w-5" />
              {success}
            </p>
          </div>
        )}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-800 flex items-center gap-2">
              <X className="h-5 w-5" />
              {error}
            </p>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-white md:rounded-3xl md:shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            
            {/* Left Column */}
            <div className="p-8 lg:p-12 space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Info className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900">Basic Information</h2>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter a catchy product name..."
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="Describe what makes your product special..."
                    required
                  />
                </div>

                {/* Price and Currency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Price & Currency
                  </label>
                  
                  <div className="flex gap-3">
                    {/* Currency Selector */}
                    <div className="relative w-40">
                      <button
                        type="button"
                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                        className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCurrencyInfo(product.currency).flag}</span>
                          <span className="text-sm font-medium">{product.currency}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Currency Dropdown */}
                      {isCurrencyOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10"
                            onClick={() => setIsCurrencyOpen(false)}
                          />
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                            {currencies.map((currency) => (
                              <button
                                key={currency.code}
                                type="button"
                                onClick={() => {
                                  setProduct(prev => ({ ...prev, currency: currency.code }));
                                  setIsCurrencyOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors duration-150 ${
                                  product.currency === currency.code ? 'bg-green-50 text-green-600' : 'text-gray-700'
                                }`}
                              >
                                <span className="text-lg">{currency.flag}</span>
                                <div className="text-left flex-1">
                                  <div className="text-sm font-medium">{currency.code}</div>
                                  <div className="text-xs text-gray-500">{currency.name}</div>
                                </div>
                                <span className="text-sm text-gray-500">{currency.symbol}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Price Input */}
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                        <span className="text-sm font-medium">{getCurrencyInfo(product.currency).symbol}</span>
                      </div>
                      <input
                        type="number"
                        name="price"
                        value={product.price}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Price Info */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-700">
                        <p className="font-medium mb-1">💡 Pricing Tips:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Research similar products to stay competitive</li>
                          <li>Buyers can view prices in their preferred currency</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={(e) => {
                      handleInputChange(e);
                      // Reset subcategory when category changes
                      setProduct(prev => ({ ...prev, subcategory: '' }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select a category...</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                {product.category && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Subcategory</label>
                    <select
                      name="subcategory"
                      value={product.subcategory}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                      required
                    >
                      <option value="">Select a subcategory...</option>
                      {categories.find(cat => cat.name === product.category)?.subcategories.map((subcat) => (
                        <option key={subcat} value={subcat}>{subcat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Material */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Material</label>
                  <input
                    type="text"
                    name="material"
                    value={product.material}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    placeholder="e.g., Recycled plastic, Bamboo, Organic cotton..."
                    required
                  />
                </div>

                {/* Product Details */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Details</label>
                  <div className="space-y-2">
                    {product.details.map((detail, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={detail}
                          onChange={(e) => handleDetailChange(index, e.target.value)}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter product detail..."
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="p-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors duration-200"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDetail}
                      className="flex items-center gap-2 text-green-600 hover:text-green-700 p-2 hover:bg-green-50 rounded-xl transition-colors duration-200"
                    >
                      <Plus className="h-4 w-4" />
                      Add Detail
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="bg-gray-50 p-8 lg:p-12 space-y-8">
              {/* Product Images */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Camera className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900">Product Images</h2>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-green-400 transition-colors duration-200">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Camera className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">Upload Product Images</p>
                    <p className="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
                  </label>
                </div>

                {/* Image Previews */}
                {product.images.length > 0 && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {product.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="h-32 w-full object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sizes */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-5 w-5 text-purple-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900">Available Sizes</h2>
                  <span className="text-gray-500 text-sm font-medium">(Optional)</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(product.sizes).map((size) => (
                    <div key={size} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={product.sizes[size].available}
                            onChange={() => handleSizeToggle(size)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="font-medium text-gray-700">Size {size}</span>
                        </label>
                      </div>
                      {product.sizes[size].available && (
                        <input
                          type="number"
                          placeholder="Stock"
                          value={product.sizes[size].stock}
                          onChange={(e) => handleSizeStockChange(size, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          min="0"
                        />
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Optional note */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-gray-600">
                      <p className="font-medium mb-1">💡 Size Information:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Sizes are optional - you can skip this section if your product doesn't have sizes</li>
                        <li>Only select sizes that are available for your product</li>
                        <li>Stock quantities help customers know availability</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonus Offers */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-900">Bonus Offers</h2>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={product.bonus.enabled}
                      onChange={handleBonusToggle}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="font-medium text-gray-700">Enable bonus offers</span>
                  </label>

                  {product.bonus.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                      <select
                        value={product.bonus.type}
                        onChange={(e) => handleBonusChange('type', e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>
                      <input
                        type="number"
                        value={product.bonus.value}
                        onChange={(e) => handleBonusChange('value', e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={product.bonus.type === 'percentage' ? '10' : '50'}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Sustainability Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowSustainability(!showSustainability)}
                  className="flex items-center gap-3 w-full p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors duration-200"
                >
                  <Leaf className="h-6 w-6 text-red-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-red-800">Sustainability Information</h3>
                    <p className="text-sm text-red-600">Required environmental impact data</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-red-600 ml-auto transition-transform duration-200 ${showSustainability ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>

                     {/* Sustainability Section (Full Width) */}
           {showSustainability && (
             <div className="border-t border-gray-200 p-8 lg:p-12 bg-white">
               <div className="max-w-6xl mx-auto space-y-8">
                 <div className="text-center mb-8">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full mb-4">
                     <Leaf className="h-8 w-8 text-white" />
                   </div>
                   <h2 className="text-xs sm:text-sm md:text-base lg:text-sm font-bold text-gray-900 mb-2">Sustainability Information</h2>
                   <p className="text-gray-600">Help customers understand the environmental impact of your product</p>
                 </div>

                 {/* Materials Section */}
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                        <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                         <Package className="h-5 w-5 text-red-600" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900">Materials Used</h3>
                       <span className="text-red-500 text-sm font-semibold">*Required</span>
                     </div>
                   
                   {product.sustainability.materials.map((material, index) => (
                     <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mb-4 p-4 bg-gray-50 rounded-xl">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Material Name</label>
                         <input
                           type="text"
                           placeholder="e.g., Recycled Plastic"
                           value={material.name}
                           onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           required
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                         <select
                           value={material.type}
                           onChange={(e) => updateMaterial(index, 'type', e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                         >
                           {materialTypes.map(type => (
                             <option key={type.value} value={type.value}>{type.label}</option>
                           ))}
                         </select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Percentage</label>
                         <input
                           type="number"
                           placeholder="100"
                           value={material.percentage}
                           onChange={(e) => updateMaterial(index, 'percentage', Number(e.target.value))}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                           min="0"
                           max="100"
                         />
                       </div>
                       {product.sustainability.materials.length > 1 && (
                         <button
                           type="button"
                           onClick={() => removeMaterial(index)}
                           className="flex items-center justify-center px-4 py-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors duration-200"
                         >
                           <Minus className="h-5 w-5" />
                         </button>
                       )}
                     </div>
                   ))}
                   <button
                     type="button"
                     onClick={addMaterial}
                     className="flex items-center gap-2 text-green-600 hover:text-green-700 p-3 hover:bg-green-50 rounded-xl transition-colors duration-200"
                   >
                     <Plus className="h-4 w-4" />
                     Add Material
                   </button>
                 </div>

                 {/* Weight and Energy Section */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                     <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                         <Star className="h-5 w-5 text-blue-600" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                     </div>
                     
                     <div className="space-y-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Product Weight <span className="text-red-500 font-semibold">*Required</span>
                         </label>
                         <div className="flex gap-3">
                                                    <input
                           type="number"
                           step="0.01"
                           placeholder="0.00"
                           value={product.sustainability.weight.value}
                           onChange={(e) => updateSustainability('weight', { 
                             ...product.sustainability.weight, 
                             value: Number(e.target.value) 
                           })}
                           className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           required
                         />
                           <select
                             value={product.sustainability.weight.unit}
                             onChange={(e) => updateSustainability('weight', { 
                               ...product.sustainability.weight, 
                               unit: e.target.value 
                             })}
                             className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                           >
                             <option value="kg">kg</option>
                             <option value="g">g</option>
                             <option value="lbs">lbs</option>
                             <option value="oz">oz</option>
                           </select>
                         </div>
                       </div>
                     </div>
                   </div>

                   <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                     <div className="flex items-center gap-3 mb-6">
                       <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                         <Globe className="h-5 w-5 text-yellow-600" />
                       </div>
                       <h3 className="text-xl font-bold text-gray-900">Production Energy</h3>
                     </div>
                     
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Energy Source</label>
                       <select
                         value={product.sustainability.productionEnergySource}
                         onChange={(e) => updateSustainability('productionEnergySource', e.target.value)}
                         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                       >
                         {energySources.map(source => (
                           <option key={source.value} value={source.value}>{source.label}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                 </div>

                 {/* Manufacturing Location */}
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                       <Globe className="h-5 w-5 text-purple-600" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900">Manufacturing Location</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                       <input
                         type="text"
                         placeholder="e.g., Nigeria"
                         value={product.sustainability.manufacturingLocation.country}
                         onChange={(e) => updateSustainability('manufacturingLocation', { 
                           ...product.sustainability.manufacturingLocation, 
                           country: e.target.value 
                         })}
                         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                         required
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                       <input
                         type="text"
                         placeholder="e.g., Lagos"
                         value={product.sustainability.manufacturingLocation.city}
                         onChange={(e) => updateSustainability('manufacturingLocation', { 
                           ...product.sustainability.manufacturingLocation, 
                           city: e.target.value 
                         })}
                         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                         required
                       />
                     </div>
                   </div>
                 </div>

                 {/* Shipping Information */}
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                       <Package className="h-5 w-5 text-indigo-600" />
                     </div>
                     <h3 className="text-xl font-bold text-gray-900">Shipping Information</h3>
                   </div>
                   
                   <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Origin Country</label>
                         <input
                           type="text"
                           placeholder="Origin Country"
                           value={product.sustainability.shipping.origin.country}
                           onChange={(e) => updateShippingLocation('origin', 'country', e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           required
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Origin City</label>
                         <input
                           type="text"
                           placeholder="Origin City"
                           value={product.sustainability.shipping.origin.city}
                           onChange={(e) => updateShippingLocation('origin', 'city', e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           required
                         />
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Method</label>
                         <select
                           value={product.sustainability.shipping.method}
                           onChange={(e) => updateShipping('method', e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                         >
                           {shippingMethods.map(method => (
                             <option key={method.value} value={method.value}>{method.label}</option>
                           ))}
                         </select>
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Distance (km)</label>
                         <input
                           type="number"
                           placeholder="0"
                           value={product.sustainability.shipping.distance}
                           onChange={(e) => updateShipping('distance', Number(e.target.value))}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                           min="0"
                           required
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Packaging Type</label>
                         <select
                           value={product.sustainability.shipping.packagingType}
                           onChange={(e) => updateShipping('packagingType', e.target.value)}
                           className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                         >
                           {packagingTypes.map(type => (
                             <option key={type.value} value={type.value}>{type.label}</option>
                           ))}
                         </select>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Carbon Footprint Calculation */}
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                   <div className="text-center">
                     <div className="mb-4">
                       <h3 className="text-xl font-bold text-gray-900 mb-2">
                         Calculate Carbon Footprint <span className="text-red-500">*Required</span>
                       </h3>
                       <p className="text-gray-600">
                         Calculate your product's environmental impact based on the information provided
                       </p>
                     </div>
                     
                     <button
                       type="button"
                       onClick={calculateCarbonFootprint}
                       disabled={isCalculating}
                       className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                     >
                       {isCalculating ? (
                         <>
                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                           Calculating Carbon Footprint...
                         </>
                       ) : (
                         <>
                           <Leaf className="h-5 w-5" />
                           Calculate Carbon Footprint (Required)
                         </>
                       )}
                     </button>

                     {carbonFootprint && (
                       <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200">
                         <h4 className="text-lg font-semibold text-green-800 mb-4">🌱 Carbon Footprint Results</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                             <div className="text-xs sm:text-sm md:text-base font-bold text-green-600">
                               {carbonFootprint?.total || '0'}
                             </div>
                             <div className="text-sm text-gray-600">kg CO₂e Total</div>
                           </div>
                           <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                             <div className="text-xs sm:text-sm md:text-base font-bold text-blue-600">
                               {carbonFootprint?.impactScore || 'Medium'}
                             </div>
                             <div className="text-sm text-gray-600">Impact Score</div>
                           </div>
                           <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                             <div className="text-xs sm:text-sm md:text-base font-bold text-purple-600">
                               {carbonFootprint?.treesToOffset || '0 trees'}
                             </div>
                             <div className="text-sm text-gray-600">Trees to Offset</div>
                           </div>
                           <div className="text-center bg-gray-50 rounded-lg p-4 border border-gray-200">
                             <div className="text-xs sm:text-sm md:text-base font-bold text-orange-600">
                               {carbonFootprint?.equivalentCarRide || '0 km'}
                             </div>
                             <div className="text-sm text-gray-600">Car Ride Equivalent</div>
                           </div>
                         </div>
                         
                         {carbonFootprint?.savingsVsConventional && (
                           <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                             <p className="text-sm text-green-700 font-medium">
                               💚 {carbonFootprint.savingsVsConventional}
                             </p>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           )}

          {/* Submit Button */}
          <div className="border-t border-gray-200 p-8 lg:p-12 bg-white">
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading Product...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    Upload Product
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductUploadForm;