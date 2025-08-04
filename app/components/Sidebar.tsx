'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Dashboard as DashboardIcon,
  People as UsersIcon,
  Inventory as ProductsIcon,
  Receipt as OrdersIcon,
  RateReview as ReviewsIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  LocalShipping as ShippingIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { authService } from '../../lib/auth';
import { useMobileMenu } from './MobileMenuContext';

const menuItems = [
  { path: '/', icon: DashboardIcon, label: 'Dashboard' },
  { path: '/users', icon: UsersIcon, label: 'Users' },
  { path: '/products', icon: ProductsIcon, label: 'Products' },
  { path: '/orders', icon: OrdersIcon, label: 'Orders' },
  { path: '/shipping', icon: ShippingIcon, label: 'Shipping' },
  { path: '/reviews', icon: ReviewsIcon, label: 'Reviews' },
  { path: '/notifications', icon: NotificationsIcon, label: 'Notifications' },
  { path: '/analytics', icon: AnalyticsIcon, label: 'Analytics' },
  { path: '/settings', icon: SettingsIcon, label: 'Settings' },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isMobileOpen, closeMobileMenu } = useMobileMenu();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  return (
    <>


      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-white/30 backdrop-blur-sm z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Modern Sidebar */}
      <div className={`
        bg-white/95 backdrop-blur-md border-r border-gray-100 h-screen shadow-xl flex flex-col
        fixed lg:relative z-50
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-16' : 'w-64'} 
        transition-transform duration-300 ease-in-out
      `}>
        {/* Modern Header */}
        <div className="p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 rounded-xl shadow-lg">
                <AdminIcon className="h-6 w-6 text-white" />
              </div>
              {!isCollapsed && (
                <div>
                  <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Eraiiz
                  </span>
                  <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
                </div>
              )}
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={closeMobileMenu}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modern Navigation */}
        <nav className="mt-6 px-4 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center px-4 py-4 mb-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200 shadow-lg' 
                    : 'text-gray-600 hover:text-green-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${isActive ? 'opacity-20' : ''}`}></div>
                
                <div className="relative z-10 flex items-center w-full">
                  <div className={`p-2 rounded-lg ${isActive ? 'bg-green-600 text-white' : 'text-gray-600 group-hover:text-green-600 group-hover:bg-green-100'} transition-all duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  {!isCollapsed && (
                    <span className="ml-3 font-semibold">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          {!isCollapsed && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-semibold text-sm">A</span>
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">Admin User</p>
                  <p className="text-gray-500 text-xs truncate">admin@eraiiz.com</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center p-3' : 'px-3 py-3'} text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors`}
            title={isCollapsed ? 'Sign Out' : undefined}
          >
            <LogoutIcon className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && <span className="ml-3 truncate">Sign Out</span>}
          </button>
        </div>
      </div>
    </>
  );
}