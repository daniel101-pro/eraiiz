'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart, User, ChevronDown, Search, Menu, X } from 'lucide-react';

export default function SoloNavbar({ handleLogout }) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogoClick = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const role = parsedUser?.role || 'buyer'; // Default to 'buyer' if role is not found
        router.push(`/dashboard/${role}`);
      } else {
        router.push('/login'); // Redirect to login if no user is found
      }
    } catch (err) {
      console.error('Error parsing user data:', err);
      router.push('/login'); // Fallback to login on error
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      {/* Single Navbar for Mobile */}
      <header className="md:hidden border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar}>
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            <button onClick={handleLogoClick} className="text-xl font-bold text-green-600 flex items-center">
              Eraiiz<span className="ml-1">🌱</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-gray-600 hover:text-green-600">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link href="/account" className="text-gray-600 hover:text-green-600">
              <User className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full">NG</span>
              <ChevronDown className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Modal for Mobile */}
      <div
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
            isSidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={toggleSidebar}
        ></div>

        {/* Sidebar Content */}
        <div
          className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <button onClick={handleLogoClick} className="text-xl font-bold text-green-600 flex items-center">
              Eraiiz<span className="ml-1">🌱</span>
            </button>
            <button onClick={toggleSidebar}>
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
          <div className="p-4 flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search item or product codes..."
                className="pl-10 pr-4 py-2 border rounded-md text-sm focus:outline-none w-full"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* Top Navbar Links */}
            <nav className="flex flex-col gap-3 text-sm text-gray-600">
              <Link href="/about" className="hover:text-green-600" onClick={toggleSidebar}>
                About Eraiiz
              </Link>
              <Link href="/supplier" className="hover:text-green-600" onClick={toggleSidebar}>
                Become a Supplier
              </Link>
              <Link href="/help" className="hover:text-green-600" onClick={toggleSidebar}>
                Help
              </Link>
              <Link href="/contact" className="hover:text-green-600" onClick={toggleSidebar}>
                Contact Support
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-red-600 hover:underline"
              >
                Log out
              </button>
            </nav>

            {/* Divider */}
            <hr className="my-2 border-gray-200" />

            {/* Bottom Navbar Links (Categories) */}
            <nav className="flex flex-col gap-3 text-sm text-gray-600">
              <Link href="/category/plastic" className="hover:text-green-600" onClick={toggleSidebar}>
                Plastic Made Products
              </Link>
              <Link href="/category/glass" className="hover:text-green-600" onClick={toggleSidebar}>
                Glass Made Products
              </Link>
              <Link href="/category/fruits-waste" className="hover:text-green-600" onClick={toggleSidebar}>
                Fruits Waste Products
              </Link>
              <Link href="/category/others" className="hover:text-green-600" onClick={toggleSidebar}>
                Others
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Top Navbar for Desktop */}
      <header className="hidden md:block border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={handleLogoClick} className="text-xl font-bold text-green-600 flex items-center">
              Eraiiz<span className="ml-1">🌱</span>
            </button>
            <nav className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
              <Link href="/about" className="hover:text-green-600">About ERaiiz</Link>
              <Link href="/supplier" className="hover:text-green-600">Become a Supplier</Link>
              <Link href="/help" className="hover:text-green-600">Help</Link>
              <Link href="/contact" className="hover:text-green-600">Contact Support</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/cart" className="text-gray-600 hover:text-green-600">
              <ShoppingCart className="h-5 w-5" />
            </Link>
            <Link href="/account" className="text-gray-600 hover:text-green-600">
              <User className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-1 text-sm">
              <span className="flex items-center justify-center w-6 h-6 bg-green-600 text-white rounded-full">NG</span>
              <ChevronDown className="h-4 w-4 text-green-600" />
            </div>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
    </>
  );
}