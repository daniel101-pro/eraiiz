'use client';

// Imports from Next.js and React
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { useCart } from '../context/CartContext';
import Image from 'next/image';
import axios from 'axios';
import { debounce } from 'lodash';

// Icons from lucide-react
import { ShoppingCart, User, ChevronDown, Search, Filter, Menu, X, LogOut, Clock, ArrowRight, Globe, Bell } from 'lucide-react';

export default function DualNavbarSell({ handleLogout }) {
  const router = useRouter();
  const { selectedCurrency, setSelectedCurrency, getCurrencyInfo, loading: currencyLoading } = useCurrency();
  const { cartItems, clearCart } = useCart();

  // State for navbar visibility
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // State for sidebar, filter modal, filter settings, and user role
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [filterSettings, setFilterSettings] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    inStock: false,
    minRating: '',
  });
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [userRole, setUserRole] = useState(null); // Initially null to avoid SSR mismatch
  const [notificationCount, setNotificationCount] = useState(0);

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

  // Load user role from localStorage only on the client
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser?.role || 'buyer');
      } catch (err) {
        console.error('Error parsing user data:', err);
        setUserRole('buyer');
      }
    } else {
      setUserRole('buyer');
    }
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
      
      if (!token) {
        console.error('No access token found');
        return;
      }

      const res = await axios.get(
        `${apiUrl}/api/products/?search=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000,
        }
      );

      const products = Array.isArray(res.data) ? res.data : res.data.products || [];
      
      // Only show products that match the search query
      const matchingProducts = products
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
    if (userRole) {
      router.push(`/dashboard/${userRole}`);
    } else {
      router.push('/login');
    }
  };

  // Handle logout
  const onLogout = () => {
    if (handleLogout) {
      // Clear cart first
      clearCart();
      
      // Then handle logout
      handleLogout();
      localStorage.removeItem('user');
      router.push('/login');
    }
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

  // Handle scroll events
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY < 60) {
      setIsVisible(true);
    } else {
      setIsVisible(currentScrollY < lastScrollY);
    }
    
    setLastScrollY(currentScrollY);
  }, [lastScrollY]);

  // Add scroll event listener
  useEffect(() => {
    const controlNavbar = debounce(handleScroll, 100);

    window.addEventListener('scroll', controlNavbar);

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [handleScroll]);

  // Fetch notification count
  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const notifications = await response.json();
          const unreadCount = notifications.filter(n => !n.read).length;
          setNotificationCount(unreadCount);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchNotificationCount();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchNotificationCount, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div 
        className={`fixed top-0 left-0 right-0 bg-white z-50 shadow transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
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
              <Link href="/account/notifications" className="text-gray-600 hover:text-green-600 relative">
                <div className="relative">
                  <Bell className="h-5 w-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5 font-medium">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </div>
              </Link>
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
              <Link href="/account" className="text-gray-600 hover:text-green-600" aria-label="Account">
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
                  <Link href="/account/notifications" className="nav-link hover:text-green-600 relative group flex items-center gap-2" onClick={toggleSidebar}>
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
                  </Link>
                  <Link href="/seller-about" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">About Eraiiz</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/help" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Help</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/contact" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                    <span className="group-hover:animate-float">Contact Support</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  {userRole === 'buyer' && (
                    <Link href="/supplier/migrate" className="nav-link hover:text-green-600 relative group" onClick={toggleSidebar}>
                      <span className="group-hover:animate-float">Become a Supplier</span>
                      <span className="nav-link-effect"></span>
                    </Link>
                  )}
                  <button
                    onClick={() => { onLogout(); toggleSidebar(); }}
                    className="nav-link flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 relative group"
                    aria-label="Logout"
                  >
                    <LogOut className="h-4 w-4 group-hover:animate-spin-slow" />
                    <span className="group-hover:animate-float">Logout</span>
                    <span className="nav-link-effect"></span>
                  </button>
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

                {/* Logout in Mobile Sidebar */}
                <div className="px-4 py-3 border-t border-gray-200 mt-auto">
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <LogOut className="h-5 w-5" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Desktop Dual Navbar */}
        <div className="hidden md:block">
          <header>
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-6">
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
                <nav className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                  <Link href="/seller-about" className="nav-link hover:text-green-600 relative group">
                    <span className="group-hover:animate-float">About Eraiiz</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  <Link href="/contact" className="nav-link hover:text-green-600 relative group">
                    <span className="group-hover:animate-float">Contact Support</span>
                    <span className="nav-link-effect"></span>
                  </Link>
                  {userRole === 'buyer' && (
                    <Link href="/supplier/migrate" className="nav-link hover:text-green-600 relative group">
                      <span className="group-hover:animate-float">Become a Seller</span>
                      <span className="nav-link-effect"></span>
                    </Link>
                  )}
                </nav>
              </div>
              <div className="flex-1 max-w-xl mx-8 relative">
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
                            Select Currency
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
                <Link href="/account/notifications" className="text-gray-600 hover:text-green-600 relative group transform transition-transform hover:-translate-y-1" aria-label="Notifications">
                  <div className="relative">
                    <Bell className="h-6 w-6 group-hover:animate-float" />
                    {notificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 font-medium animate-pulse">
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </span>
                    )}
                  </div>
                </Link>
                <Link href="/account" className="text-gray-600 hover:text-green-600 relative group transform transition-transform hover:-translate-y-1" aria-label="Account">
                  <User className="h-6 w-6 group-hover:animate-float" />
                </Link>
              </div>
            </div>
          </header>

          {/* Gradient Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-green-600/30 to-transparent"></div>

          <nav className="bg-white">
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
              <nav className="flex items-center space-x-6 xl:space-x-6 lg:space-x-4 md:space-x-2 text-sm text-gray-600 overflow-x-auto no-scrollbar">
                <Link href="/categories/plastic" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Plastic Made Products</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Plastic</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Plastic</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/glass" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Glass Made Products</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Glass</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Glass</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/rubber" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Rubber Made Products</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Rubber</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Rubber</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/wood" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Wood Made Products</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Wood</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Wood</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/palm-frond" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Palm Frond Made Products</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Palm</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Palm</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/recycled" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">General Recycled Items</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Recycled</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Recycled</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories/fruits" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Fruits Waste Products</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Fruits</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Fruits</span>
                  <span className="nav-link-effect"></span>
                </Link>
                <Link href="/categories" className="nav-link hover:text-green-600 whitespace-nowrap relative group">
                  <span className="hidden 2xl:inline group-hover:animate-float">Others</span>
                  <span className="hidden xl:inline 2xl:hidden group-hover:animate-float">Others</span>
                  <span className="xl:hidden md:inline group-hover:animate-float">Others</span>
                  <span className="nav-link-effect"></span>
                </Link>
              </nav>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleFilterModal}
                  className="filter-button flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 whitespace-nowrap relative group"
                  aria-label="Open Filter Modal"
                >
                  <Filter className="h-4 w-4 group-hover:animate-spin-slow" /> 
                  <span className="group-hover:animate-float">Filters</span>
                  <span className="nav-link-effect"></span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Add minimal padding for navbar */}
      <div className="h-[50px] md:h-[85px]"></div>

      {/* Filter Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Filter Products</h2>
              <button onClick={toggleFilterModal} aria-label="Close Filter Modal">
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={filterSettings.category}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600"
                >
                  <option value="">All Categories</option>
                  <option value="Plastic Made Products">Plastic Made Products</option>
                  <option value="Rubber Made Products">Rubber Made Products</option>
                  <option value="Glass Made Products">Glass Made Products</option>
                  <option value="Wood Made Products">Wood Made Products</option>
                  <option value="Palm Frond Made Products">Palm Frond Made Products</option>
                  <option value="General Recycled Items">General Recycled Items</option>
                  <option value="Fruits Waste Products">Fruits Waste Products</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Price Range ({currencies.find(c => c.code === selectedCurrency)?.symbol})</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="minPrice"
                    value={filterSettings.minPrice}
                    onChange={handleFilterChange}
                    placeholder={`Min Price (${currencies.find(c => c.code === selectedCurrency)?.symbol})`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600"
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    value={filterSettings.maxPrice}
                    onChange={handleFilterChange}
                    placeholder={`Max Price (${currencies.find(c => c.code === selectedCurrency)?.symbol})`}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="inStock"
                  name="inStock"
                  checked={filterSettings.inStock}
                  onChange={handleFilterChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-600"
                />
                <label htmlFor="inStock" className="ml-2 text-sm text-gray-700">
                  In Stock Only
                </label>
              </div>

              <div>
                <label htmlFor="minRating" className="block text-sm font-medium text-gray-700">
                  Minimum Rating
                </label>
                <select
                  id="minRating"
                  name="minRating"
                  value={filterSettings.minRating}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-600 focus:border-green-600"
                >
                  <option value="">Any Rating</option>
                  <option value="1">1 Star & Up</option>
                  <option value="2">2 Stars & Up</option>
                  <option value="3">3 Stars & Up</option>
                  <option value="4">4 Stars & Up</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={toggleFilterModal}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleFilterSubmit}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
              >
                Apply Filters
              </button>
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