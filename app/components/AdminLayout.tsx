'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';
import { useMobileMenu } from './MobileMenuContext';
import SearchDropdown from './SearchDropdown';
import {
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { toggleMobileMenu } = useMobileMenu();
  
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-slate-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Modern Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 lg:px-8 py-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Mobile Menu Button */}
                <button 
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-3 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
                >
                  <MenuIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-xl shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Eraiiz Admin
                    </h1>
                    <p className="text-sm text-gray-600 hidden sm:block">
                      Sustainable Platform Management
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Modern Search */}
                <div className="hidden md:block">
                  <SearchDropdown />
                </div>
                
                {/* Modern Notifications */}
                <button className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 relative group">
                  <NotificationsIcon className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">3</span>
                  </span>
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">New order received</p>
                            <p className="text-xs text-gray-500">2 minutes ago</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">User registration</p>
                            <p className="text-xs text-gray-500">5 minutes ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
                
                {/* Modern Profile */}
                <div className="flex items-center space-x-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">Admin User</p>
                    <p className="text-xs text-gray-500">Super Admin</p>
                  </div>
                  <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-green-700 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">A</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4 lg:p-6 bg-slate-50">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}