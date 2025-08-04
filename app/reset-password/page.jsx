'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

function ResetPasswordFallback() {
  return <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-200">Loading...</div>;
}

function ResetPasswordContent() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) setMessage('Invalid reset link');
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/api/auth/reset-password', { token, newPassword });
      setMessage('Password reset successful. Redirecting...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-green-50 to-emerald-200">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-emerald-800 mb-4">Reset Password</h2>
        {message && <p className={message.includes('successful') ? 'text-emerald-700' : 'text-red-500'}>{message}</p>}
        <div className="mb-4">
          <input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size={20} color="#ffffff" /> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}