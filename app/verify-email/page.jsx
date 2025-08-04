'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

export default function VerifyEmail() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('johndoe45@gmail.com'); // Default to match image
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRefs = useRef([]);

  useEffect(() => {
    const storedEmail = localStorage.getItem('verifyingEmail');
    if (storedEmail) setEmail(storedEmail);
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    setIsLoading(true);
    const otpCode = otp.join('');
    try {
      console.log('Sending verify request:', { email, otp: otpCode });
      const res = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/auth/verify-email', {
        email,
        code: otpCode,
      });
      setMessage(res.data.message);
      if (res.data.message === 'Email verified successfully') {
        console.log('Verification successful, logging in user');

        // Fetch user data and tokens after verification
        const userRes = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/auth/login', {
          email,
          password: localStorage.getItem('tempPassword'), // Store password temporarily during signup
        });

        const { accessToken, refreshToken, user } = userRes.data;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.removeItem('verifyingEmail');
        localStorage.removeItem('tempPassword'); // Clean up

        console.log('User logged in, redirecting to welcome page');
        router.push('/welcome');
      }
    } catch (err) {
      console.error('Verify error:', err.response?.data, err.message);
      setMessage(err.response?.data?.message || 'Error verifying email');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      console.log('Sending resend request:', { email });
      const res = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/auth/resend-otp', { email });
      setMessage(res.data.message);
    } catch (err) {
      console.error('Resend error:', err.response?.data, err.message);
      setMessage(err.response?.data?.message || 'Error resending OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Bar */}
      <div className="w-full bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-green-600 flex items-center">
          Erailz<span className="ml-1">🌱</span>
        </div>
        <div className="flex items-center space-x-4 text-gray-600">
          <a href="#" className="hover:text-green-600">About Eraiz</a>
          <a href="#" className="hover:text-green-600">Become a Supplier</a>
          <a href="#" className="hover:text-green-600">Help</a>
          <a href="#" className="hover:text-green-600">Contact Support</a>
          <div className="flex items-center gap-1 text-green-600">
            <span>NG</span>
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col custom-md:flex-row items-center justify-center">
        {/* Left Side - Verify Email Form */}
        <div className="w-full custom-md:w-1/2 p-6 flex items-center justify-center">
          <div className="max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Check your mail!</h2>
            <p className="text-center text-gray-500 mb-6">
              We have sent a 6-digit code to{' '}
              <span className="font-semibold text-green-600">{email}</span>. Please input it in the
              field below
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {otp.slice(0, 3).map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-12 text-center text-lg font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
              ))}
              <span className="w-12 h-12 flex items-center justify-center">-</span>
              {otp.slice(3).map((digit, index) => (
                <input
                  key={index + 3}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index + 3, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index + 3, e)}
                  ref={(el) => (inputRefs.current[index + 3] = el)}
                  className="w-12 h-12 text-center text-lg font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                />
              ))}
            </div>

            {message && (
              <p
                className={`text-center mb-4 ${
                  message.includes('successfully') ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleVerify}
              disabled={isLoading || otp.some(digit => !digit)}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition duration-200 font-semibold flex justify-center items-center"
            >
              {isLoading ? 'Verifying...' : 'Verify my email'}
            </button>

            <p className="text-center text-gray-600 mt-4">
              Didn’t get a code?{' '}
              <button
                onClick={handleResend}
                disabled={isLoading}
                className={`${
                  isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-green-600 hover:underline'
                }`}
              >
                {isLoading ? 'Resending...' : 'Resend Code'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Image (Hidden on screens < 1000px) */}
        <div className="hidden custom-md:flex custom-md:w-1/2 p-6 bg-white border-l border-gray-200 items-center justify-center">
          <div className="relative w-full h-[calc(100vh-100px)]">
            <Image
              src="/signupright.png"
              alt="Verify Email Illustration"
              layout="fill"
              objectFit="cover"
              className="rounded-lg"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}