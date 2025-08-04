'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '../../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRole 
}: ProtectedRouteProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          router.push('/login');
          return;
        }

        // Check role requirements
        if (requiredRole && !authService.hasRole(requiredRole)) {
          router.push('/unauthorized');
          return;
        }

        // Check permission requirements
        if (requiredPermissions.length > 0) {
          const hasAllPermissions = requiredPermissions.every(permission => 
            authService.hasPermission(permission)
          );
          
          if (!hasAllPermissions) {
            router.push('/unauthorized');
            return;
          }
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, requiredPermissions, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect to login or unauthorized
  }

  return <>{children}</>;
}