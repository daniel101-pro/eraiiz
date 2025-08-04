'use client';

import { useState } from 'react';

export default function DebugAuth() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const checkUser = async () => {
    try {
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-user/${encodeURIComponent(email)}`);
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('No access token found. Please login first.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult({ deleted: true, message: data.message });
      } else {
        setError(data.message || 'Failed to delete account');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Debug Auth Issues</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email to check"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={checkUser}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Check User Exists
            </button>
            
            <button
              onClick={deleteAccount}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Delete Account
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <h3 className="font-medium text-red-800">Error:</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="font-medium text-gray-800 mb-2">Result:</h3>
              <pre className="text-sm text-gray-600 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="font-medium text-blue-800 mb-2">Instructions:</h3>
            <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
              <li>Enter the email you used to create the account</li>
              <li>Click "Check User Exists" to see if the account exists in the database</li>
              <li>If it exists, you can try deleting it (make sure you're logged in first)</li>
              <li>Check again after deletion to confirm it's gone</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">Current localStorage:</h3>
            <div className="text-yellow-700 text-sm space-y-1">
              <div><strong>Access Token:</strong> {localStorage.getItem('accessToken') ? 'Present' : 'Not found'}</div>
              <div><strong>User:</strong> {localStorage.getItem('user') || 'Not found'}</div>
              <div><strong>Role:</strong> {localStorage.getItem('role') || 'Not found'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 