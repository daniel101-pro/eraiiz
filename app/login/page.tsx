'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../lib/auth';
import Image from 'next/image';
import ServerStatus from '../components/ServerStatus';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated
    if (authService.isAuthenticated()) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await authService.login(email, password);
      
      if (result.success) {
        router.push('/');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message) {
        setError(error.message);
      } else if (error.response?.status === 503) {
        setError('Server is starting up. Please wait a moment and try again.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('Unable to connect to server. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        {/* Left Side - Branding (Desktop Only) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#008C00] to-[#006600] items-center justify-center p-12">
          <div className="text-center text-white space-y-8">
            <div className="mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-6 inline-block mb-6">
                <AdminIcon className="w-16 h-16 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-4">Eraiiz Admin</h1>
              <p className="text-xl text-green-100">
                Comprehensive Platform Management
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm text-green-100">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">7+</div>
                <div className="text-sm text-green-100">Products</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">100%</div>
                <div className="text-sm text-green-100">Sustainable</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold">24/7</div>
                <div className="text-sm text-green-100">Monitoring</div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-green-100">
                "Building a sustainable future through technology"
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-8 w-full">
          <div className="w-full max-w-md space-y-6 lg:space-y-8">
            {/* Mobile Header */}
            <div className="text-center lg:hidden mb-6">
              <div className="bg-green-600 rounded-full p-3 inline-block mb-3">
                <AdminIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Eraiiz Admin</h1>
              <p className="text-sm text-gray-600">Sign in to your account</p>
            </div>
            
            {/* Header - Hidden on mobile since we have mobile header */}
            <div className="text-center hidden lg:block">
              <div className="flex justify-center mb-6">
                <div className="bg-primary/10 backdrop-blur-sm rounded-full p-4">
                  <AdminIcon className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-foreground">
                Welcome Back
              </h2>
              <p className="mt-2 text-muted-foreground">
                Sign in to access the Eraiiz administration panel
              </p>
            </div>

            {/* Server Status */}
            <ServerStatus />

            {/* Login Form */}
            <div className="bg-white border border-gray-200 rounded-xl lg:rounded-2xl shadow-lg p-6 lg:p-8">
              <form className="space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="admin@eraiiz.com"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <VisibilityOffIcon className="h-5 w-5" />
                      ) : (
                        <VisibilityIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm text-red-600 font-medium">{error}</p>
                  </div>
                )}

                {/* Access Information */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="text-sm text-green-700 font-medium mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                    Access Credentials
                  </p>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex items-center">
                      <span className="text-xs">🔐</span>
                      <span className="ml-2">Login credentials are shared with authorized personnel only</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs">👥</span>
                      <span className="ml-2">Contact your administrator for access</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-sm lg:text-base"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <LoginIcon className="w-5 h-5 mr-2" />
                      Sign in to Admin Panel
                    </div>
                  )}
                </button>

                {/* Security Notice */}
                <div className="text-center pt-4">
                  <p className="text-xs text-gray-500">
                    🔒 Secure admin portal • Unauthorized access is prohibited
                  </p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Powered by Eraiiz • Sustainable Technology Platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}