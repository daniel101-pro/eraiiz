'use client';

// Imports from Next.js and React
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import Image from 'next/image';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { boostProductsByPlan } from '@/lib/boostProducts';
import { clearLocalInbox, fetchNotificationFeed } from '../utils/notificationFeed';
import { homePathForRole } from '@/lib/authRouting';

// Icons from lucide-react
import { ShoppingCart, User, ChevronDown, Search, Filter, Menu, X, LogOut, Clock, ArrowRight, Globe, Bell, Star, RotateCcw } from 'lucide-react';

const FILTER_CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Plastic Made Products', label: 'Plastic' },
  { value: 'Rubber Made Products', label: 'Rubber' },
  { value: 'Glass Made Products', label: 'Glass' },
  { value: 'Wood Made Products', label: 'Wood' },
  { value: 'Palm Frond Made Products', label: 'Palm' },
  { value: 'General Recycled Items', label: 'Recycled' },
  { value: 'Fruits Waste Products', label: 'Fruits' },
];

const EMPTY_FILTERS = {
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
  minRating: '',
};

export default function DualNavbarSell({ handleLogout }) {
  const router = useRouter();
  const { selectedCurrency, setSelectedCurrency, getCurrencyInfo, loading: currencyLoading, detectedCountryName, currencyManual } = useCurrency();
  const { cartItems, clearCart } = useCart();

  // State for sidebar, filter modal, filter settings, and user role
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filterSettings, setFilterSettings] = useState(EMPTY_FILTERS);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [userRole, setUserRole] = useState(null); // Initially null to avoid SSR mismatch
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);

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

  // Load auth + role from localStorage only on the client
  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      const loggedIn = Boolean(token && storedUser);
      setIsAuthenticated(loggedIn);

      if (!loggedIn) {
        setUserRole(null);
        setNotifications([]);
        setNotificationCount(0);
        setIsNotificationModalOpen(false);
        setSelectedNotification(null);
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser?.role || 'buyer');
      } catch (err) {
        console.error('Error parsing user data:', err);
        setUserRole('buyer');
      }
    };

    syncAuth();
    window.addEventListener('eraiiz:auth-changed', syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener('eraiiz:auth-changed', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, []);

  // Close currency dropdown when clicking outside sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCurrencyOpen && isSidebarOpen) {
        // Check if the click is outside the sidebar
        const sidebar = document.querySelector('aside');
        if (sidebar && !sidebar.contains(event.target)) {
          setIsCurrencyOpen(false);
        }
      }
    };

    if (isCurrencyOpen && isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCurrencyOpen, isSidebarOpen]);

  // Save search history to localStorage
  const saveToHistory = (query) => {
    const updatedHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // Real-time product suggestions
  const fetchSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const token = localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await axios.get(
        `${apiUrl}/api/products/?search=${encodeURIComponent(query)}`,
        {
          headers,
          timeout: 30000,
        }
      );

      const products = Array.isArray(res.data) ? res.data : res.data.products || [];
      
      // Only show products that match the search query
      const matchingProducts = (await boostProductsByPlan(products))
        .filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5); // Limit to 5 suggestions

      setSuggestions(matchingProducts);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    }
  };

  // Debounce the fetchSuggestions function to avoid too many API calls
  const debouncedFetchSuggestions = useCallback(
    debounce((query) => fetchSuggestions(query), 300),
    []
  );

  // Handle currency change
  const handleCurrencyChange = (code) => {
    setSelectedCurrency(code);
    setIsCurrencyOpen(false);
  };

  // Handle logo click to redirect based on user role
  const handleLogoClick = () => {
    if (isAuthenticated && userRole) {
      let email = '';
      try {
        email = JSON.parse(localStorage.getItem('user') || '{}')?.email || '';
      } catch {
        email = '';
      }
      router.push(homePathForRole(userRole, email));
    } else {
      router.push('/for-you');
    }
  };

  // Handle logout
  const onLogout = () => {
    const token = localStorage.getItem('accessToken');
    clearCart();
    clearLocalInbox();
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserRole(null);
    setNotifications([]);
    setNotificationCount(0);
    setIsNotificationModalOpen(false);
    setSelectedNotification(null);
    window.dispatchEvent(new Event('eraiiz:auth-changed'));

    if (handleLogout) {
      handleLogout(token);
    }

    router.push('/for-you');
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
    if (isSidebarOpen) {
      setIsFilterModalOpen(false);
    }
  };

  // Toggle filter modal visibility
  const toggleFilterModal = () => {
    setIsFilterModalOpen((prev) => !prev);
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  // Handle filter settings change
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilterSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const setFilterField = (name, value) => {
    setFilterSettings((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => setFilterSettings(EMPTY_FILTERS);

  const activeFilterCount = [
    filterSettings.category,
    filterSettings.minPrice,
    filterSettings.maxPrice,
    filterSettings.inStock,
    filterSettings.minRating,
  ].filter(Boolean).length;

  // Handle filter submission
  const handleFilterSubmit = () => {
    const params = new URLSearchParams();
    if (filterSettings.category) params.append('category', filterSettings.category);
    if (filterSettings.minPrice) params.append('minPrice', filterSettings.minPrice);
    if (filterSettings.maxPrice) params.append('maxPrice', filterSettings.maxPrice);
    if (filterSettings.inStock) params.append('inStock', 'true');
    if (filterSettings.minRating) params.append('minRating', filterSettings.minRating);

    router.push(`/filter?${params.toString()}`);
    setIsFilterModalOpen(false);
  };

  const currencySymbol = currencies.find((c) => c.code === selectedCurrency)?.symbol || '₦';

  // Handle search query changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedFetchSuggestions(query);
  };

  // Handle search submission
  const handleSearch = (query = searchQuery) => {
    const searchTerm = String(query || '').trim();
    if (!searchTerm) return;
    
    saveToHistory(searchTerm);
    setIsMobileSearchOpen(false);
    setIsDesktopSearchOpen(false);
    setSearchQuery('');
    router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  // Add this small component for the cart badge
  const CartBadge = () => (
    <div className="relative">
      <ShoppingCart className="h-5 w-5" />
      {cartItems.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-white text-[#3F8E3F] border-2 border-[#3F8E3F] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm">
          {cartItems.length}
        </span>
      )}
    </div>
  );

  // Fetch notifications only for signed-in shoppers
  const fetchNotifications = async () => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }
    try {
      const validNotifications = await fetchNotificationFeed();
      setNotifications(validNotifications);
      setNotificationCount(validNotifications.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setNotificationCount(0);
      setIsNotificationModalOpen(false);
      return undefined;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    window.addEventListener('eraiiz-inbox-updated', fetchNotifications);
    window.addEventListener('storage', fetchNotifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener('eraiiz-inbox-updated', fetchNotifications);
      window.removeEventListener('storage', fetchNotifications);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && isNotificationModalOpen) {
      fetchNotifications();
    }
  }, [isAuthenticated, isNotificationModalOpen]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-white z-50 shadow">
        {/* Mobile Navbar */}
        <header className="md:hidden">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={toggleSidebar} aria-label="Open Sidebar">
                <Menu className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex items-center">
                <button onClick={handleLogoClick} className="flex items-center focus:outline-none" aria-label="Go to dashboard">
                  <Image
                    src="/logo.png"
                    alt="Eraiiz Logo"
                    width={60}
                    height={20}
                    className="h-5 w-auto"
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <button 
                  onClick={() => setIsNotificationModalOpen(true)}
                  className="text-gray-600 hover:text-green-600 relative"
                  aria-label="Notifications"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 font-medium">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    )}
                  </div>
                </button>
              ) : null}
              <div className="relative">
                <button 
                  onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} 
                  aria-label="Search" 
                  className="text-gray-600 hover:text-green-600"
                >
                  <Search className="h-5 w-5" />
                </button>

                {/* Mobile Search Dropdown */}
                {isMobileSearchOpen && (
                  <>
                    {/* Overlay to capture clicks outside */}
                    <div 
                      className="fixed inset-0 bg-black bg-opacity-50 z-30"
                      onClick={() => {
                        setIsMobileSearchOpen(false);
                        setSearchQuery('');
                        setSuggestions([]);
                      }}
                    />
                    
                    {/* Search Panel */}
                    <div className="fixed left-0 right-0 top-0 bg-white z-40 border-b border-gray-200">
                      <div className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <button 
                            onClick={() => {
                              setIsMobileSearchOpen(false);
                              setSearchQuery('');
                              setSuggestions([]);
                            }}
                            className="text-gray-600"
                          >
                            <X className="h-6 w-6" />
                          </button>
                          <form 
                            className="flex-1"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSearch(searchQuery);
                            }}
                          >
                            <div className="relative">
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search item or product codes..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-green-600 shadow-sm"
                                autoFocus
                              />
                              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            </div>
                          </form>
                        </div>

                        {/* Search Content */}
                        <div className="max-h-[calc(100vh-150px)] overflow-y-auto">
                          {/* Recent Searches */}
                          {!searchQuery && searchHistory.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Searches</h3>
                              <div className="space-y-2">
                                {searchHistory.map((query, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleSearch(query)}
                                    className="flex items-center w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-150"
                                  >
                                    <Clock className="h-4 w-4 mr-3 text-gray-400" />
                                    <span>{query}</span>
                                    <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Search Suggestions */}
                          {searchQuery && (
                            <div>
                              {suggestions.length > 0 ? (
                                <div className="space-y-2">
                                  {suggestions.map((product) => (
                                    <button
                                      key={product._id}
                                      onClick={() => {
                                        router.push(`/product/${product._id}`);
                                        setIsMobileSearchOpen(false);
                                        setSearchQuery('');
                                        setSuggestions([]);
                                      }}
                                      className="flex items-center w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-150"
                                    >
                                      <Search className="h-4 w-4 mr-3 text-gray-400" />
                                      <div>
                                        <div className="font-medium">{product.name}</div>
                                        <div className="text-xs text-gray-500">{product.category}</div>
                                      </div>
                                      <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-6">
                                  <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                  <p className="text-gray-500 text-sm">No products found for "{searchQuery}"</p>
                                  <button
                                    onClick={() => {
                                      handleSearch();
                                      setIsMobileSearchOpen(false);
                                    }}
                                    className="mt-2 px-4 py-1.5 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors duration-150"
                                  >
                                    Search anyway
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Link href="/cart" className="text-gray-600 hover:text-green-600" aria-label="Cart">
                <CartBadge />
              </Link>
              <Link
                href={isAuthenticated ? '/account' : '/login?next=%2Faccount'}
                className="text-gray-600 hover:text-green-600"
                aria-label={isAuthenticated ? 'Account' : 'Sign in'}
              >
                <User className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <div
          className={`fixed inset-0 z-[60] flex transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
              isSidebarOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={toggleSidebar}
            aria-hidden="true"
          ></div>

          <aside
            className={`fixed top-0 left-0 w-64 h-screen bg-white shadow-lg transform transition-transform duration-300 ${
              isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } flex flex-col`}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <button onClick={handleLogoClick} className="flex items-center focus:outline-none" aria-label="Go to dashboard">
                  <Image
                    src="/logo.png"
                    alt="Eraiiz Logo"
                    width={60}
                    height={20}
                    className="h-5 w-auto"
                  />
                </button>
              </div>
              <button onClick={toggleSidebar} aria-label="Close Sidebar">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-4 flex flex-col gap-4">
                <nav className="flex flex-col gap-3 text-sm text-gray-600">
                  {isAuthenticated ? (
                    <button 
                      onClick={() => {
                        setIsNotificationModalOpen(true);
                        toggleSidebar();
                      }}
                      className="nav-link hover:text-green-600 relative group flex items-center gap-2 w-full text-left"
                    >
                      <div className="relative">
                        <Bell className="h-4 w-4 group-hover:animate-float" />
                        {notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[12px] h-3 flex items-center justify-center px-0.5 font-medium">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        )}
                      </div>
                      <span className="group-hover:animate-float">Notifications</span>
                      <span className="nav-link-effect"></span>
                    </button>
                  ) : (
                    <Link
                      href="/login?next=%2Faccount"
                      className="nav-link hover:text-green-600 relative group"
                      onClick={toggleSidebar}
                    >
                      <span className="group-hover:animate-float">Sign in</span>
                      <span className="nav-link-effect"></span>
                    </Link>
                  )}
                  <Link href="/seller-about" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">About Eraiiz</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/faqs" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Help</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/contact" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Contact Support</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/policies" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Policies</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  {userRole === 'buyer' && (
                    <Link href="/supplier/migrate" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                      <span className="group-hover:animate-float">Become a Supplier</span>
                      <span className="nav-link-effect"></span>
                    </Link>
                  )}
                  {isAuthenticated ? (
                    <button
                      onClick={() => { onLogout(); toggleSidebar(); }}
                      className="nav-link flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 relative group"
                      aria-label="Logout"
                    >
                      <LogOut className="h-4 w-4 group-hover:animate-spin-slow" />
                      <span className="group-hover:animate-float">Logout</span>
                      <span className="nav-link-effect"></span>
                    </button>
                  ) : null}
                </nav>

                <hr className="my-2 border-gray-200" />

                <nav className="flex flex-col gap-3 text-sm text-gray-600">
                  <Link href="/categories/plastic" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Plastic Made Products</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories/glass" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Glass Made Products</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories/rubber" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Rubber Made Products</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories/wood" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Wood Made Products</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories/palm-frond" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Palm Frond Made Products</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories/recycled" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">General Recycled Items</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories/fruits" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Fruits Waste Products</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/categories" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Others</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                </nav>

                {/* Currency Selector in Mobile Sidebar */}
                <div className="px-4 py-3 border-t border-gray-200 mt-4">
                  <div className="relative">
                    <button
                      onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-gray-600" />
                        <div className="text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {getCurrencyInfo(selectedCurrency).flag} {selectedCurrency}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getCurrencyInfo(selectedCurrency).name}
                            {!currencyManual && detectedCountryName ? ` · ${detectedCountryName}` : ''}
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Currency Dropdown */}
                    {isCurrencyOpen && (
                      <>
                        {/* Overlay for click outside */}
                        <div 
                          className="fixed inset-0 z-[70]"
                          onClick={() => setIsCurrencyOpen(false)}
                        />
                        
                        {/* Dropdown */}
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[80] max-h-48 overflow-y-auto">
                          <div className="text-xs font-medium text-gray-500 px-3 py-2">
                            {currencyManual
                              ? 'Your currency'
                              : detectedCountryName
                                ? `Based on ${detectedCountryName}`
                                : 'Select currency'}
                          </div>
                          {currencies.map((currency) => (
                            <button
                              key={currency.code}
                              onClick={() => handleCurrencyChange(currency.code)}
                              className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors duration-150 ${
                                selectedCurrency === currency.code ? 'bg-green-50 text-green-600' : 'text-gray-700'
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
                </div>

                {/* Auth action in Mobile Sidebar */}
                <div className="px-4 py-3 border-t border-gray-200 mt-auto">
                  {isAuthenticated ? (
                    <button
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <LogOut className="h-5 w-5" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  ) : (
                    <Link
                      href="/login?next=%2Faccount"
                      onClick={toggleSidebar}
                      className="w-full flex items-center justify-center gap-2 p-3 bg-[#008C00] text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium">Sign in</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Desktop Dual Navbar */}
        <div className="hidden md:block">
          <header>
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-3 py-3 sm:px-4 lg:px-6">
              <div className="flex min-w-0 items-center gap-4 lg:gap-5">
                <div className="flex items-center">
                  <button onClick={handleLogoClick} className="flex items-center focus:outline-none group" aria-label="Go to dashboard">
                    <Image
                      src="/logo.png"
                      alt="Eraiiz Logo"
                      width={60}
                      height={20}
                      className="h-5 w-auto transform transition-transform group-hover:scale-110"
                    />
                  </button>
                </div>
                <nav className="hidden md:flex items-center gap-3 text-sm text-gray-600 lg:gap-4">
                  <Link href="/seller-about" className="nav-link hover:text-green-600 relative group">
                    <span className="group-hover:animate-float">About</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/contact" className="nav-link hover:text-green-600 relative group">
                    <span className="group-hover:animate-float">Contact</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/policies" className="nav-link hover:text-green-600 relative group">
                    <span className="group-hover:animate-float">Policies</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  {userRole === 'buyer' && (
                    <Link href="/supplier/migrate" className="nav-link hover:text-green-600 relative group">
                      <span className="group-hover:animate-float">Sell</span>
                      <span className="nav-link-effect"></span>
                    </Link>
                  )}
                </nav>
              </div>
              <div className="relative mx-4 max-w-xl flex-1 lg:mx-6">
                <div className="relative group">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSearch(searchQuery);
                  }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setIsDesktopSearchOpen(true)}
                      placeholder="Search item or product codes..."
                      className="w-full pl-10 pr-4 py-2 border rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-green-600 transition-all duration-300 hover:shadow-md focus:shadow-lg"
                    />
                    <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors duration-300" />
                  </form>
                </div>

                {/* Desktop Search Dropdown */}
                {isDesktopSearchOpen && (
                  <>
                    {/* Overlay to capture clicks outside */}
                    <div 
                      className="fixed inset-0 z-30"
                      onClick={() => {
                        setIsDesktopSearchOpen(false);
                        setSearchQuery('');
                        setSuggestions([]);
                      }}
                    />
                    
                    {/* Dropdown Panel */}
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-40 overflow-hidden animate-slideDown">
                      <div className="max-h-[400px] overflow-y-auto">
                        {/* Recent Searches */}
                        {!searchQuery && searchHistory.length > 0 && (
                          <div className="p-3">
                            <h3 className="text-sm font-medium text-gray-900 mb-2">Recent Searches</h3>
                            <div className="space-y-1">
                              {searchHistory.map((query, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSearch(query)}
                                  className="flex items-center w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-150"
                                >
                                  <Clock className="h-4 w-4 mr-3 text-gray-400" />
                                  <span>{query}</span>
                                  <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Desktop Search Suggestions */}
                        {searchQuery && (
                          <div className="p-3">
                            {suggestions.length > 0 ? (
                              <div className="space-y-1">
                                {suggestions.map((product) => (
                                  <button
                                    key={product._id}
                                    onClick={() => router.push(`/product/${product._id}`)}
                                    className="flex items-center w-full text-left text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-150"
                                  >
                                    <Search className="h-4 w-4 mr-3 text-gray-400" />
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-xs text-gray-500">{product.category}</div>
                                    </div>
                                    <ArrowRight className="h-4 w-4 ml-auto text-gray-400" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-6">
                                <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500 text-sm">No products found for "{searchQuery}"</p>
                                <button
                                  onClick={() => handleSearch()}
                                  className="mt-2 px-4 py-1.5 bg-green-600 text-white rounded-full text-sm hover:bg-green-700 transition-colors duration-150"
                                >
                                  Search anyway
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4">
                {/* Currency Selector */}
                <div className="relative">
                  <button
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors duration-200 group"
                    aria-label="Select Currency"
                  >
                    <Globe className="h-5 w-5 group-hover:animate-float" />
                    <span className="text-sm font-medium hidden lg:block group-hover:animate-float">
                      {getCurrencyInfo(selectedCurrency).flag} {selectedCurrency}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Currency Dropdown */}
                  {isCurrencyOpen && (
                    <>
                      {/* Overlay */}
                      <div 
                        className="fixed inset-0 z-30"
                        onClick={() => setIsCurrencyOpen(false)}
                      />
                      
                      {/* Dropdown */}
                      <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-64 overflow-y-auto animate-slideDown">
                        <div className="p-2">
                          <div className="text-xs font-medium text-gray-500 px-3 py-2 uppercase tracking-wider">
                            {currencyManual
                              ? 'Your currency'
                              : detectedCountryName
                                ? `Based on ${detectedCountryName}`
                                : 'Select currency'}
                          </div>
                          {currencies.map((currency) => (
                            <button
                              key={currency.code}
                              onClick={() => handleCurrencyChange(currency.code)}
                              className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 ${
                                selectedCurrency === currency.code ? 'bg-green-50 text-green-600 ring-1 ring-green-200' : 'text-gray-700'
                              }`}
                            >
                              <span className="text-lg">{currency.flag}</span>
                              <div className="text-left flex-1">
                                <div className="text-sm font-medium">{currency.code}</div>
                                <div className="text-xs text-gray-500">{currency.name}</div>
                              </div>
                              <span className="text-sm text-gray-500 font-mono">{currency.symbol}</span>
                              {selectedCurrency === currency.code && (
                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <Link href="/cart" className="text-gray-600 hover:text-green-600 relative group transform transition-transform hover:-translate-y-1" aria-label="Cart">
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 group-hover:animate-float" />
                    {cartItems.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-white text-[#3F8E3F] border-2 border-[#3F8E3F] text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium shadow-sm group-hover:animate-bounce">
                        {cartItems.length}
                      </span>
                    )}
                  </div>
                </Link>
                {isAuthenticated ? (
                  <button 
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="text-gray-600 hover:text-green-600 relative group transform transition-transform hover:-translate-y-1"
                    aria-label="Notifications"
                  >
                    <div className="relative">
                      <Bell className="h-6 w-6 group-hover:animate-float" />
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-medium animate-pulse">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </div>
                  </button>
                ) : null}
                <Link
                  href={isAuthenticated ? '/account' : '/login?next=%2Faccount'}
                  className="text-gray-600 hover:text-green-600 relative group transform transition-transform hover:-translate-y-1"
                  aria-label={isAuthenticated ? 'Account' : 'Sign in'}
                >
                  <User className="h-6 w-6 group-hover:animate-float" />
                </Link>
              </div>
            </div>
          </header>

          {/* Gradient Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-green-600/30 to-transparent"></div>

          <nav className="bg-white">
            <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-3 py-2 sm:px-4 lg:px-6">
              <nav className="flex min-w-0 items-center gap-3 overflow-x-auto text-sm text-gray-600 no-scrollbar md:gap-4">
                <Link href="/categories/plastic" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Plastic
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/glass" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Glass
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/rubber" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Rubber
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/wood" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Wood
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/palm-frond" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Palm
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/recycled" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Recycled
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/fruits" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Fruits
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  Others
                  <span className="nav-link-effect"></span>
                </Link>
              </nav>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleFilterModal}
                  className="filter-button relative group flex items-center gap-2 whitespace-nowrap text-sm text-gray-600 hover:text-green-600"
                  aria-label="Open Filter Modal"
                >
                  <Filter className="h-4 w-4 group-hover:animate-spin-slow" />
                  <span className="group-hover:animate-float">Filters</span>
                  {activeFilterCount > 0 ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#008C00] px-1 text-[10px] font-semibold text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                  <span className="nav-link-effect"></span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Clear fixed dual navbar (mobile single bar + desktop header + category row) */}
      <div className="h-[56px] md:h-[116px]" aria-hidden="true" />

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
          onClick={toggleFilterModal}
        >
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />
          <div
            className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-[#E5E5E5] bg-white shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-products-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#E5E5E5] px-5 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#008C00]">Refine</p>
                <h2 id="filter-products-title" className="mt-0.5 text-lg font-semibold text-[#1A1A1A]">
                  Filter products
                </h2>
                <p className="mt-0.5 text-xs text-[#666666]">
                  {activeFilterCount
                    ? `${activeFilterCount} filter${activeFilterCount === 1 ? '' : 's'} selected`
                    : 'Browse by category, price, stock, and rating'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleFilterModal}
                aria-label="Close filters"
                className="rounded-full border border-[#E5E5E5] p-2 text-[#666666] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto px-5 py-5">
              <div>
                <div className="mb-2.5 flex items-center justify-between">
                  <p className="text-sm font-medium text-[#1A1A1A]">Category</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {FILTER_CATEGORIES.map((category) => {
                    const selected = filterSettings.category === category.value;
                    return (
                      <button
                        key={category.label}
                        type="button"
                        onClick={() => setFilterField('category', category.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          selected
                            ? 'border-[#008C00] bg-[#008C00] text-white'
                            : 'border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#008C00]/
                        }`}
                      >
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-sm font-medium text-[#1A1A1A]">Price range ({currencySymbol})</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-wide text-[#666666]">Min</span>
                    <div className="flex items-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 focus-within:border-[#008C00] focus-within:bg-white">
                      <span className="mr-1 text-sm text-[#666666]">{currencySymbol}</span>
                      <input
                        type="number"
                        name="minPrice"
                        min="0"
                        value={filterSettings.minPrice}
                        onChange={handleFilterChange}
                        placeholder="0"
                        className="w-full bg-transparent py-2.5 text-sm text-[#1A1A1A] outline-none"
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-[11px] uppercase tracking-wide text-[#666666]">Max</span>
                    <div className="flex items-center rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] px-3 focus-within:border-[#008C00] focus-within:bg-white">
                      <span className="mr-1 text-sm text-[#666666]">{currencySymbol}</span>
                      <input
                        type="number"
                        name="maxPrice"
                        min="0"
                        value={filterSettings.maxPrice}
                        onChange={handleFilterChange}
                        placeholder="Any"
                        className="w-full bg-transparent py-2.5 text-sm text-[#1A1A1A] outline-none"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-sm font-medium text-[#1A1A1A]">Minimum rating</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setFilterField('minRating', '')}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      !filterSettings.minRating
                        ? 'border-[#008C00] bg-[#008C00] text-white'
                        : 'border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#008C00]'
                    }`}
                  >
                    Any
                  </button>
                  {[1, 2, 3, 4, 5].map((rating) => {
                    const selected = String(filterSettings.minRating) === String(rating);
                    return (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFilterField('minRating', String(rating))}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          selected
                            ? 'border-[#008C00] bg-[#008C00] text-white'
                            : 'border-[#E5E5E5] bg-white text-[#1A1A1A] hover:border-[#008C00]'
                        }`}
                      >
                        <Star
                          className={`h-3 w-3 ${selected ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`}
                        />
                        {rating}+
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFilterField('inStock', !filterSettings.inStock)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                  filterSettings.inStock
                    ? 'border-[#008C00] bg-[#F3FBF3]'
                    : 'border-[#E5E5E5] bg-white hover:border-[#008C00]/
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-[#1A1A1A]">In stock only</p>
                  <p className="text-xs text-[#666666]">Hide listings that are sold out</p>
                </div>
                <span
                  className={`relative h-6 w-11 rounded-full transition ${
                    filterSettings.inStock ? 'bg-[#008C00]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      filterSettings.inStock ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[#E5E5E5] bg-white px-5 py-4">
              <button
                type="button"
                onClick={clearFilters}
                disabled={!activeFilterCount}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E5E5] px-3 py-2.5 text-sm font-medium text-[#1A1A1A] transition hover:border-[#1A1A1A] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={toggleFilterModal}
                  className="rounded-xl border border-[#E5E5E5] px-4 py-2.5 text-sm font-medium text-[#666666] transition hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFilterSubmit}
                  className="rounded-xl bg-[#008C00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
                >
                  Show results
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {isAuthenticated && isNotificationModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setIsNotificationModalOpen(false)}
        >
          {/* Blurred Background */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          
          {/* Modal Content */}
          <div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-6 w-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
                  <p className="text-sm text-gray-500">
                    {notificationCount > 0 ? `${notificationCount} unread` : 'All caught up!'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsNotificationModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close notifications"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                  <p className="text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 10).map((notif) => (
                    <div
                      key={notif._id}
                      onClick={() => setSelectedNotification(notif)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        !notif.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          !notif.read ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <Bell className={`h-4 w-4 ${
                            !notif.read ? 'text-blue-600' : 'text-gray-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {notif.message || 'Notification'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                                {new Date(notif.createdAt).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length > 10 && (
                    <Link 
                      href="/account?section=notifications"
                      className="block text-center py-3 text-green-600 hover:text-green-700 font-medium"
                      onClick={() => setIsNotificationModalOpen(false)}
                    >
                      View all notifications →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {isAuthenticated && selectedNotification && (
        <div 
          className="fixed inset-0 z-[102] flex items-center justify-center p-4"
          onClick={() => setSelectedNotification(null)}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div 
            className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-[103]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notification Details</h3>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              <div className={`p-4 rounded-lg mb-4 ${
                !selectedNotification.read ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                <p className="text-gray-900 mb-2">{selectedNotification.message}</p>
                <p className="text-xs text-gray-500">
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={selectedNotification.link || '/account?section=notifications'}
                  className="flex-1 text-center py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  onClick={() => {
                    setSelectedNotification(null);
                    setIsNotificationModalOpen(false);
                  }}
                >
                  {selectedNotification.link?.includes('Shipping')
                    ? 'Open shipping'
                    : selectedNotification.link?.includes('Orders')
                      ? 'View order'
                      : 'View All'}
                </Link>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add animation keyframes */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(180deg);
          }
        }

        .animate-float {
          animation: float 1s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 0.6s ease-in-out;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out forwards;
        }

        /* Hide scrollbar but keep functionality */
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        /* Enhanced hover effects for all nav items */
        .nav-link, .filter-button {
          padding: 4px 0;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .nav-link-effect {
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #3F8E3F, #87cf87);
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease;
        }

        .nav-link:hover .nav-link-effect,
        .filter-button:hover .nav-link-effect {
          transform: scaleX(1);
          transform-origin: left;
        }

        .nav-link:hover,
        .filter-button:hover {
          text-shadow: 0 0 8px rgba(63, 142, 63, 0.3);
          transform: translateY(-1px);
        }

        /* Filter button specific styles */
        .filter-button {
          padding: 6px 12px;
          border-radius: 15px;
          transition: all 0.3s ease;
        }

        .filter-button:hover {
          background: linear-gradient(135deg, rgba(63, 142, 63, 0.1), rgba(135, 207, 135, 0.1));
          box-shadow: 0 4px 12px rgba(63, 142, 63, 0.15);
          transform: translateY(-1px);
        }

        /* Search input animation */
        input[type="text"] {
          transition: all 0.3s ease;
        }

        input[type="text"]:hover {
          border-color: #3F8E3F;
        }

        input[type="text"]:focus {
          transform: translateY(-1px);
        }

        /* Cart badge animation */
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }

        .animate-bounce {
          animation: bounce 0.6s ease-in-out infinite;
        }

        /* Logo hover effect */
        .logo-hover {
          transition: transform 0.3s ease;
        }

        .logo-hover:hover {
          transform: scale(1.1);
        }
      `}</style>
    </>
  );
}