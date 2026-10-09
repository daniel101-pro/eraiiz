import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { showAuthToast } from '../utils/toast';
import { useState } from 'react';
import { homePathForRole, isPendingRole } from '@/lib/authRouting';

interface GoogleAuthButtonProps {
  text: string;
  onSuccess?: () => void;
}

export default function GoogleAuthButton({ text, onSuccess }: GoogleAuthButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Check if Google Client ID is configured
  const isGoogleConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`,
          { code: codeResponse.code }
        );

        console.log('=== GOOGLE AUTH RESPONSE ===');
        console.log('Full response data:', data);
        console.log('isNewUser:', data.isNewUser);
        console.log('user role:', data.user?.role);
        console.log('============================');

        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('role', data.user.role);

        if (isPendingRole(data.user?.role)) {
          localStorage.setItem('tempGoogleUser', JSON.stringify(data.user));
          localStorage.setItem('tempGoogleTokens', JSON.stringify({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          }));
          showAuthToast('Welcome! Please select your account type.', 'success');
          onSuccess?.();
          router.push('/role-selection');
          return;
        }

        showAuthToast('Successfully signed in with Google!', 'success');
        onSuccess?.();
        router.push(homePathForRole(data.user.role));
      } catch (error: any) {
        console.error('Google auth error:', error);
        showAuthToast(error.response?.data?.message || 'Failed to sign in with Google. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google login error:', errorResponse);
      showAuthToast('Google sign in failed. Please try again.', 'error');
      setIsLoading(false);
    },
  });

  const handleClick = () => {
    if (!isGoogleConfigured) {
      showAuthToast('Google authentication is not configured. Please try another method.', 'error');
      return;
    }
    handleGoogleLogin();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full bg-white border border-gray-300 text-gray-700 p-3 rounded-lg mb-4 flex items-center justify-center transition duration-200 ${
        isGoogleConfigured ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'
      }`}
      disabled={!isGoogleConfigured || isLoading}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="w-5 h-5 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin mr-2"></div>
          Signing in...
        </div>
      ) : (
        <>
          <FcGoogle className="mr-2 text-xl" /> {text}
          {!isGoogleConfigured && <span className="ml-2 text-xs text-red-500">(Not configured)</span>}
        </>
      )}
    </button>
  );
} 