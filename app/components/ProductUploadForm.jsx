'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showProductToast, showError } from '../utils/toast';
import { useRouter } from 'next/navigation';
import { useCurrency } from '../context/CurrencyContext';
import { getValidAccessToken, refreshAccessToken } from '../utils/auth';
import { ArrowLeft, ChevronDown, Plus, Minus, X } from 'lucide-react';
import CrazyLoader from './CrazyLoader';
import { homePathForRole } from '@/lib/authRouting';

const ProductUploadForm = () => {
  const { getCurrencyInfo, convertPriceExplicit, formatPrice, exchangeRates, selectedCurrency } = useCurrency();
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    currency: selectedCurrency || 'USD',
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
    { value: 'fossil_fuel', label: 'Local diesel generator' },
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

  const fetchSession = async () => {
    try {
      let token = await getValidAccessToken();
      let res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000,
      });
      setSession(res.data);
      setError(null);
      return true;
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          const token = await refreshAccessToken();
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/session`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 30000,
          });
          setSession(res.data);
          setError(null);
          return true;
        } catch (refreshErr) {
          console.error('Client: Session Error:', refreshErr.response?.data || refreshErr.message);
        }
      } else {
        console.error('Client: Session Error:', err.response?.data || err.message);
      }
      if (!session) {
        setError('Please sign in to access this page.');
      }
      return false;
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchSession();
      setIsLoading(false);
    };
    load();

    const keepAlive = setInterval(() => {
      getValidAccessToken().catch(() => {});
    }, 10 * 60 * 1000);

    return () => clearInterval(keepAlive);
  }, []);

  useEffect(() => {
    setProduct((prev) => {
      if (prev.name || prev.price) return prev;
      if (prev.currency === selectedCurrency) return prev;
      return { ...prev, currency: selectedCurrency || prev.currency };
    });
  }, [selectedCurrency]);

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
      const token = await getValidAccessToken();
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
      const listingCurrency = product.currency || 'NGN';
      const listingPrice = Number(product.price);

      if (!Number.isFinite(listingPrice) || listingPrice <= 0) {
        const priceError = 'Please enter a valid price';
        setError(priceError);
        showError(priceError);
        setIsSubmitting(false);
        return;
      }

      if (listingCurrency !== 'NGN' && !exchangeRates) {
        const rateError = 'Exchange rates are still loading. Please wait a moment and try again.';
        setError(rateError);
        showError(rateError);
        setIsSubmitting(false);
        return;
      }

      const priceNgn = convertPriceExplicit(listingPrice, listingCurrency, 'NGN');
      const token = await getValidAccessToken();
      const formData = new FormData();

      // Canonical store price is NGN for Paystack. Keep the seller's amount for display.
      const productPayload = {
        ...product,
        price: priceNgn,
        currency: 'NGN',
        listingPrice,
        listingCurrency,
        sustainability: {
          ...product.sustainability,
          listingCurrency,
          listingPrice,
        },
      };

      Object.keys(productPayload).forEach((key) => {
        if (key === 'images') {
          productPayload.images.forEach((image) => formData.append('images', image));
        } else if (key === 'sizes' || key === 'bonus' || key === 'sustainability') {
          formData.append(key, JSON.stringify(productPayload[key]));
        } else if (Array.isArray(productPayload[key])) {
          formData.append(key, JSON.stringify(productPayload[key]));
        } else {
          formData.append(key, productPayload[key]);
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
      router.push(`/dashboard/seller/upload/success?productId=${response.data.productId}`);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(errorMessage);
      showError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const fieldClass =
    'w-full border border-gray-200 bg-white px-4 py-3 text-green-950 placeholder:text-gray-400 focus:border-green-900 focus:outline-none';

  const goBack = () => {
    try {
      const referrer = document.referrer;
      if (referrer) {
        const from = new URL(referrer);
        if (from.origin === window.location.origin && !from.pathname.includes('/upload')) {
          router.back();
          return;
        }
      }
    } catch {
      // ignore
    }
    router.push(homePathForRole(localStorage.getItem('role') || 'seller'));
  };

  if (isLoading) {
    return <CrazyLoader title="Loading upload" subtitle="Checking your seller session" />;
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-green-950">Sign in required</h2>
          <p className="mt-2 text-sm text-gray-600">Log in as a seller to upload a product.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white text-green-950">
      {isSubmitting ? (
        <CrazyLoader fullscreen title="Uploading product" subtitle="Do not close this tab" />
      ) : null}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={goBack}
          aria-label="Go back"
          className="mb-8 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-green-950 transition hover:border-green-900 hover:bg-green-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <p className="text-sm font-medium text-green-800">Seller</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">New product</h1>
        <p className="mt-2 max-w-xl text-sm text-gray-600">
          Name, photos, price, and impact details. Required fields must be filled before you can list.
        </p>

        {success && <p className="mt-6 text-sm text-green-800">{success}</p>}
        {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSubmit} className="mt-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Details</h2>

                {/* Product Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Product name</label>
                  <input
                    type="text"
                    name="name"
                    value={product.name}
                    onChange={handleInputChange}
                    className={fieldClass}
                    placeholder="Product name"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Description</label>
                  <textarea
                    name="description"
                    value={product.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={fieldClass}
                    placeholder="What is this product, and how was it made?"
                    required
                  />
                </div>

                {/* Price and Currency */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Price</label>
                  
                  <div className="flex gap-3">
                    <div className="relative w-40">
                      <button
                        type="button"
                        onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                        className="flex w-full items-center justify-between border border-gray-200 bg-white p-3 text-left hover:border-green-900"
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
                          <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto border border-gray-200 bg-white shadow-lg">
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
                        className={`${fieldClass} pl-10`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {product.currency !== 'NGN' && Number(product.price) > 0 && exchangeRates && (
                    <p className="mt-2 text-xs text-gray-600">
                      Shoppers will see {getCurrencyInfo(product.currency).symbol}{Number(product.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
                      Checkout charges {formatPrice(convertPriceExplicit(Number(product.price), product.currency, 'NGN'), 'NGN')} (Paystack is naira-only).
                    </p>
                  )}
                  
                  {/* Price Info */}
                  <p className="mt-2 text-xs text-gray-500">
                    Enter the price buyers should see. Checkout in Africa still settles in naira.
                  </p>
                </div>

                {/* Category */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Category</label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={(e) => {
                      handleInputChange(e);
                      setProduct(prev => ({ ...prev, subcategory: '' }));
                    }}
                    className={fieldClass}
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
                    <label className="mb-2 block text-sm font-medium">Subcategory</label>
                    <select
                      name="subcategory"
                      value={product.subcategory}
                      onChange={handleInputChange}
                      className={fieldClass}
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
                  <label className="mb-2 block text-sm font-medium">Material</label>
                  <input
                    type="text"
                    name="material"
                    value={product.material}
                    onChange={handleInputChange}
                    className={fieldClass}
                    placeholder="Recycled plastic, bamboo, organic cotton"
                    required
                  />
                </div>

                {/* Product Details */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Extra details</label>
                  <div className="space-y-2">
                    {product.details.map((detail, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={detail}
                          onChange={(e) => handleDetailChange(index, e.target.value)}
                          className={`flex-1 ${fieldClass}`}
                          placeholder="Size notes, care, origin"
                        />
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="border border-gray-200 px-3 text-gray-500 hover:border-red-700 hover:text-red-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addDetail}
                      className="text-sm text-green-800 underline"
                    >
                      Add detail
                    </button>
                  </div>
                </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="mb-4 text-lg font-semibold">Photos</h2>
                <div className="border border-dashed border-gray-300 p-8 text-center hover:border-green-900">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <p className="font-medium">Add images</p>
                    <p className="mt-1 text-sm text-gray-500">PNG or JPG, up to 10MB each</p>
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
                          className="h-32 w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 bg-white/90 p-1 text-green-950 opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h2 className="mb-1 text-lg font-semibold">Sizes</h2>
                <p className="mb-4 text-sm text-gray-500">Optional. Skip if the product has no sizes.</p>

                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(product.sizes).map((size) => (
                    <div key={size} className="border border-gray-200 p-4">
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
                          className={fieldClass}
                          min="0"
                        />
                      )}
                    </div>
                  ))}
                </div>
                
              </div>

              <div>
                <h2 className="mb-4 text-lg font-semibold">Bonus</h2>

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
                        className={fieldClass}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed amount</option>
                      </select>
                      <input
                        type="number"
                        value={product.bonus.value}
                        onChange={(e) => handleBonusChange('value', e.target.value)}
                        className={fieldClass}
                        placeholder={product.bonus.type === 'percentage' ? '10' : '50'}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSustainability(!showSustainability)}
                className="flex w-full items-center justify-between border border-gray-200 px-4 py-3 text-left hover:border-green-900"
              >
                <span>
                  <span className="block font-medium">Impact details</span>
                  <span className="text-sm text-gray-500">Required before you can list</span>
                </span>
                <ChevronDown className={`h-4 w-4 transition ${showSustainability ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

           {showSustainability && (
             <div className="mt-12 space-y-8 border-t border-gray-200 pt-10">
                 <div>
                   <h2 className="text-lg font-semibold">Impact</h2>
                   <p className="mt-1 text-sm text-gray-500">Used to estimate carbon footprint for the listing.</p>
                 </div>

                 <div>
                       <h3 className="mb-4 text-base font-semibold">Materials</h3>
                   
                   {product.sustainability.materials.map((material, index) => (
                     <div key={index} className="mb-4 grid grid-cols-1 items-end gap-4 border border-gray-200 p-4 md:grid-cols-4">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Material Name</label>
                         <input
                           type="text"
                           placeholder="e.g., Recycled Plastic"
                           value={material.name}
                           onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                           className={fieldClass}
                           required
                         />
                       </div>
                       <div>
                         <label className="mb-2 block text-sm font-medium">Type</label>
                         <select
                           value={material.type}
                           onChange={(e) => updateMaterial(index, 'type', e.target.value)}
                           className={fieldClass}
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
                           className={fieldClass}
                           min="0"
                           max="100"
                         />
                       </div>
                       {product.sustainability.materials.length > 1 && (
                         <button
                           type="button"
                           onClick={() => removeMaterial(index)}
                           className="border border-gray-200 px-4 py-3 text-gray-500 hover:border-red-700 hover:text-red-700"
                         >
                           <Minus className="h-5 w-5" />
                         </button>
                       )}
                     </div>
                   ))}
                   <button
                     type="button"
                     onClick={addMaterial}
                     className="text-sm text-green-800 underline"
                   >
                     Add material
                   </button>
                 </div>

                 <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                   <div>
                     <h3 className="mb-4 text-base font-semibold">Weight</h3>
                     
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
                           className={`flex-1 ${fieldClass}`}
                           required
                         />
                           <select
                             value={product.sustainability.weight.unit}
                             onChange={(e) => updateSustainability('weight', { 
                               ...product.sustainability.weight, 
                               unit: e.target.value 
                             })}
                             className={fieldClass}
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

                   <div>
                     <h3 className="mb-4 text-base font-semibold">Production energy</h3>
                     <div>
                       <label className="mb-2 block text-sm font-medium">Energy source</label>
                       <select
                         value={product.sustainability.productionEnergySource}
                         onChange={(e) => updateSustainability('productionEnergySource', e.target.value)}
                         className={fieldClass}
                       >
                         {energySources.map(source => (
                           <option key={source.value} value={source.value}>{source.label}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="mb-4 text-base font-semibold">Made in</h3>
                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                     <div>
                       <label className="mb-2 block text-sm font-medium">Country</label>
                       <input
                         type="text"
                         placeholder="Nigeria"
                         value={product.sustainability.manufacturingLocation.country}
                         onChange={(e) => updateSustainability('manufacturingLocation', { 
                           ...product.sustainability.manufacturingLocation, 
                           country: e.target.value 
                         })}
                         className={fieldClass}
                         required
                       />
                     </div>
                     <div>
                       <label className="mb-2 block text-sm font-medium">City</label>
                       <input
                         type="text"
                         placeholder="Lagos"
                         value={product.sustainability.manufacturingLocation.city}
                         onChange={(e) => updateSustainability('manufacturingLocation', { 
                           ...product.sustainability.manufacturingLocation, 
                           city: e.target.value 
                         })}
                         className={fieldClass}
                         required
                       />
                     </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="mb-4 text-base font-semibold">Shipping</h3>
                   
                   <div className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Origin Country</label>
                         <input
                           type="text"
                           placeholder="Origin Country"
                           value={product.sustainability.shipping.origin.country}
                           onChange={(e) => updateShippingLocation('origin', 'country', e.target.value)}
                           className={fieldClass}
                           required
                         />
                       </div>
                       <div>
                         <label className="mb-2 block text-sm font-medium">Origin city</label>
                         <input
                           type="text"
                           placeholder="Origin city"
                           value={product.sustainability.shipping.origin.city}
                           onChange={(e) => updateShippingLocation('origin', 'city', e.target.value)}
                           className={fieldClass}
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
                           className={fieldClass}
                         >
                           {shippingMethods.map(method => (
                             <option key={method.value} value={method.value}>{method.label}</option>
                           ))}
                         </select>
                       </div>
                       <div>
                         <label className="mb-2 block text-sm font-medium">Distance (km)</label>
                         <input
                           type="number"
                           placeholder="0"
                           value={product.sustainability.shipping.distance}
                           onChange={(e) => updateShipping('distance', Number(e.target.value))}
                           className={fieldClass}
                           min="0"
                           required
                         />
                       </div>
                       <div>
                         <label className="mb-2 block text-sm font-medium">Packaging</label>
                         <select
                           value={product.sustainability.shipping.packagingType}
                           onChange={(e) => updateShipping('packagingType', e.target.value)}
                           className={fieldClass}
                         >
                           {packagingTypes.map(type => (
                             <option key={type.value} value={type.value}>{type.label}</option>
                           ))}
                         </select>
                       </div>
                     </div>
                   </div>
                 </div>

                 <div className="border-t border-gray-200 pt-8">
                       <h3 className="text-base font-semibold">Carbon footprint</h3>
                       <p className="mt-1 text-sm text-gray-500">Required. Uses the impact details above.</p>
                     <button
                       type="button"
                       onClick={calculateCarbonFootprint}
                       disabled={isCalculating}
                       className="mt-4 bg-green-900 px-6 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:bg-gray-300"
                     >
                       {isCalculating ? 'Calculating…' : 'Calculate footprint'}
                     </button>

                     {carbonFootprint && (
                       <div className="mt-6 grid grid-cols-2 gap-4 border-t border-gray-200 pt-6 lg:grid-cols-4">
                           <div>
                             <div className="text-xl font-bold">
                               {carbonFootprint?.total || '0'}
                             </div>
                             <div className="text-sm text-gray-500">kg CO₂e</div>
                           </div>
                           <div>
                             <div className="text-xl font-bold">
                               {carbonFootprint?.impactScore || 'Medium'}
                             </div>
                             <div className="text-sm text-gray-500">Impact</div>
                           </div>
                           <div>
                             <div className="text-xl font-bold">
                               {carbonFootprint?.treesToOffset || '0 trees'}
                             </div>
                             <div className="text-sm text-gray-500">Trees to offset</div>
                           </div>
                           <div>
                             <div className="text-xl font-bold">
                               {carbonFootprint?.equivalentCarRide || '0 km'}
                             </div>
                             <div className="text-sm text-gray-500">Car-ride equivalent</div>
                           </div>
                         {carbonFootprint?.savingsVsConventional && (
                             <p className="col-span-full text-sm text-green-800">
                               {carbonFootprint.savingsVsConventional}
                             </p>
                         )}
                       </div>
                     )}
                 </div>
             </div>
           )}

          <div className="mt-12 border-t border-gray-200 pt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isSubmitting ? 'Uploading…' : 'List product'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductUploadForm;