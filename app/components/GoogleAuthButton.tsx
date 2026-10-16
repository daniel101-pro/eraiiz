import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { showAuthToast } from '../utils/toast';
import { useState } from 'react';
import { homePathForRole, isPendingRole } from '@/lib/authRouting';
import { GOOGLE_CLIENT_ID } from '@/lib/googleClient';

interface GoogleAuthButtonProps {
  text: string;
  onSuccess?: () => void;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function GoogleAuthButton({ text, onSuccess }: GoogleAuthButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isGoogleConfigured = !!GOOGLE_CLIENT_ID;

  const handleGoogleLogin = useGoogleLogin({
    flow: 'auth-code',
    ux_mode: 'popup',
    onSuccess: async (codeResponse) => {
      try {
        setIsLoading(true);

        let data;
        let lastError: unknown;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const response = await axios.post(
              '/api/auth/google',
              {
                code: codeResponse.code,
                redirectUri: 'postmessage',
              },
              { timeout: 45000 }
            );
            data = response.data;
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            const status = axios.isAxiosError(error) ? error.response?.status : 0;
            if (status && status < 500 && status !== 429) throw error;
            if (attempt < 3) await sleep(1500 * attempt);
          }
        }
        if (lastError) throw lastError;

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
        router.push(homePathForRole(data.user.role, data.user.email));
      } catch (error: unknown) {
        console.error('Google auth error:', error);
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : 'Failed to sign in with Google. Please try again.';
        showAuthToast(message, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google login error:', errorResponse);
      showAuthToast(errorResponse?.error_description || 'Google sign in failed. Please try again.', 'error');
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
        </>
      )}
    </button>
  );
}
