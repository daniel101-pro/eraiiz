'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaShoppingCart, FaStore } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { showAuthToast } from '../utils/toast';

export default function RoleSelection() {
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const router = useRouter();

  const roles = [
    {
      id: 'buyer',
      title: 'I want to Buy',
      subtitle: 'Discover sustainable products and make eco-friendly purchases',
      icon: FaShoppingCart,
      color: 'green',
      features: [
        'Browse sustainable products',
        'Track your carbon footprint',
        'Get personalized recommendations',
        'Join the eco-community'
      ]
    },
    {
      id: 'seller',
      title: 'I want to Sell',
      subtitle: 'List and sell your sustainable products to eco-conscious buyers',
      icon: FaStore,
      color: 'emerald',
      features: [
        'Upload sustainable products',
        'Reach eco-conscious customers',
        'Track sales analytics',
        'Build your green business'
      ]
    }
  ];

  useEffect(() => {
    // Check if user came from Google auth and has temporary data
    const tempUser = localStorage.getItem('tempGoogleUser');
    const tempTokens = localStorage.getItem('tempGoogleTokens');
    
    if (!tempUser || !tempTokens) {
      // If no temp data, redirect to login
      router.push('/login');
      return;
    }

    try {
      setUserData(JSON.parse(tempUser));
    } catch (error) {
      console.error('Error parsing temp user data:', error);
      router.push('/login');
    }
  }, [router]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      showAuthToast('Please select a role to continue', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const tempTokens = localStorage.getItem('tempGoogleTokens');
      if (!tempTokens) {
        throw new Error('No authentication data found');
      }

      const tokens = JSON.parse(tempTokens);

      // Update user role in backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ role: selectedRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update role');
      }

      const updatedUser = await response.json();

      // Store final user data and tokens
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('role', updatedUser.role);

      // Clean up temporary data
      localStorage.removeItem('tempGoogleUser');
      localStorage.removeItem('tempGoogleTokens');

      showAuthToast(`Welcome! Your ${selectedRole} account is ready.`, 'success');

      // Redirect to welcome page then to dashboard
      router.push('/welcome');

    } catch (error) {
      console.error('Role selection error:', error);
      showAuthToast(error.message || 'Failed to set up your account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
          >
            <span className="text-white text-xs sm:text-sm md:text-base font-bold">E</span>
          </motion.div>
          <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-3">
            Welcome to Eraiiz! 👋
          </h1>
          <p className="text-gray-600 text-xl">
            Hi {userData.name}, choose how you'd like to get started
          </p>
        </motion.div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {roles.map((role, index) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect(role.id)}
              className={`relative cursor-pointer bg-white rounded-3xl p-8 shadow-xl transition-all duration-500 hover:shadow-2xl ${
                selectedRole === role.id
                  ? role.color === 'green' 
                    ? 'ring-4 ring-green-500 ring-opacity-50 shadow-green-200'
                    : 'ring-4 ring-emerald-500 ring-opacity-50 shadow-emerald-200'
                  : 'hover:shadow-green-100'
              }`}
              style={{ minHeight: '500px' }}
            >
              {/* Selection Indicator */}
              {selectedRole === role.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  className={`absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    role.color === 'green' ? 'bg-green-500' : 'bg-emerald-500'
                  }`}
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}

              {/* Card Content */}
              <div className="text-center h-full flex flex-col">
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br ${
                    role.color === 'green' 
                      ? 'from-green-400 to-green-600' 
                      : 'from-emerald-400 to-emerald-600'
                  }`}
                >
                  <role.icon className="text-xs sm:text-sm md:text-base text-white" />
                </motion.div>

                {/* Title */}
                <h3 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-4">
                  {role.title}
                </h3>

                {/* Subtitle */}
                <p className="text-gray-600 text-base mb-6 leading-relaxed flex-grow">
                  {role.subtitle}
                </p>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {role.features.map((feature, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + (0.1 * idx) }}
                      className="flex items-center justify-start"
                    >
                      <div className={`w-2 h-2 rounded-full mr-3 flex-shrink-0 ${
                        role.color === 'green' ? 'bg-green-500' : 'bg-emerald-500'
                      }`} />
                      <span className="text-gray-700 text-sm text-left">{feature}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Select Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 ${
                    selectedRole === role.id
                      ? role.color === 'green'
                        ? 'bg-green-600 text-white shadow-lg'
                        : 'bg-emerald-600 text-white shadow-lg'
                      : role.color === 'green'
                        ? 'bg-green-50 text-green-600 hover:bg-green-100 border-2 border-green-200'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-2 border-emerald-200'
                  }`}
                >
                  {selectedRole === role.id ? 'Selected ✓' : 'Select This Option'}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: selectedRole ? 1.02 : 1 }}
            whileTap={{ scale: selectedRole ? 0.98 : 1 }}
            onClick={handleContinue}
            disabled={!selectedRole || isLoading}
            className={`w-full max-w-md py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 ${
              selectedRole && !isLoading
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-t-2 border-b-2 border-white rounded-full mr-2"
                />
                Setting up your account...
              </div>
            ) : selectedRole ? (
              `Continue as ${selectedRole === 'buyer' ? 'Buyer' : 'Seller'} →`
            ) : (
              'Select a role to continue'
            )}
          </motion.button>
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-gray-500">
            Don't worry! You can always switch between buyer and seller modes later in your account settings.
          </p>
        </motion.div>
      </div>
    </div>
  );
} 