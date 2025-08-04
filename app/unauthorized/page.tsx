'use client';

import Link from 'next/link';
import { Block as BlockIcon, Home as HomeIcon } from '@mui/icons-material';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <BlockIcon className="mx-auto h-12 w-12 text-red-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this resource.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">
            This page requires specific permissions that your account doesn't currently have. 
            Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-2">
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Link>
          
          <Link
            href="/login"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sign in with different account
          </Link>
        </div>
      </div>
    </div>
  );
}