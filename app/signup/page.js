'use client';
import Navbar from '../components/Navbar';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import Image from 'next/image';
import { FaShoppingCart, FaStore } from 'react-icons/fa';
import { ChevronDown } from 'lucide-react';
import countryCodes from '@/lib/countryCodes';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { showAuthToast } from '../utils/toast';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [role, setRole] = useState('buyer');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+234'); // Default to Nigeria
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Derive country name from countryCode
  const selectedCountry = countryCodes.find((code) => code.code === countryCode)?.name || 'Nigeria';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordError('');

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, phone: `${countryCode}${phone}`, country: selectedCountry }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      localStorage.setItem('verifyingEmail', email);
      localStorage.setItem('tempPassword', password);
      showAuthToast('Account created successfully! Please verify your email.', 'success');
      router.push('/verify-email');
    } catch (err) {
      console.error('Fetch error:', err.message, err);
      showAuthToast(`Signup failed: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="relative z-10 mb-20">
        <Navbar />
      </div>
      <div className="min-h-screen bg-white flex flex-col mt-10">
        <div className="flex-1 flex flex-col custom-md:flex-row items-center justify-center">
          <div className="w-full custom-md:w-1/2 p-6 flex items-center justify-center">
            <div className="max-w-md w-full">
              {/* Signup heading */}
              <h2 className="text-xs sm:text-sm md:text-base font-bold text-gray-800 mb-4 text-center">Welcome to Eraiiz</h2>
              <p className="text-center text-gray-500 mb-6">
                Create your account to start buying or selling with Eraiiz.
              </p>
              
              <GoogleAuthButton text="Sign up with Google" isSignup={true} />
              
              <div className="text-center text-gray-400 mb-4">Or</div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />

                {/* Role Selection */}
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Select your role</label>
                  <div className="flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`flex items-center px-4 py-2 rounded ${role === 'buyer' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      <FaShoppingCart className="mr-2" /> Buyer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('seller')}
                      className={`flex items-center px-4 py-2 rounded ${role === 'seller' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                      <FaStore className="mr-2" /> Seller
                    </button>
                  </div>
                </div>

                {/* Dynamic Policy Text */}
                <div className="mb-4 p-4 bg-gray-50 rounded">
                  {role === 'buyer' ? (
                    <p className="text-sm text-gray-600">
                      As a buyer, you agree to purchase items in good faith and follow our payment and return policies.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      As a seller, you agree to list accurate products and ship promptly per Eraiiz standards.
                    </p>
                  )}
                </div>

                {/* Phone Number with Country Code */}
                <div className="flex space-x-2">
                  <div className="relative w-1/4">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
                    >
                      {countryCodes.map((code) => (
                        <option key={code.code} value={code.code}>
                          {code.code} ({code.name})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="block w-3/4 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Password (At least 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    required
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-600">
                    I agree to Eraiiz's terms and conditions
                  </label>
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-semibold flex justify-center items-center"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner size={20} color="#ffffff" /> : 'Create my account'}
                </button>
                <p className="text-center text-gray-600">
                  Already have an account? <a href="/login" className="text-green-600 hover:underline">Sign in here</a>
                </p>
              </form>
            </div>
          </div>

          {/* Right Side - Image (Hidden on smaller screens) */}
          <div className="hidden custom-md:flex custom-md:w-1/2 p-6 bg-white border-l border-gray-200 items-center justify-center">
            <div className="relative w-full h-[calc(100vh-100px)]">
              <Image
                src="/signupright.png"
                alt="signup-right"
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}