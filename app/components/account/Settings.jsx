'use client';

import { useEffect, useState } from 'react';
import { getValidAccessToken, refreshAccessToken } from '../../utils/auth';
import { Bell, Lock, Trash2, Save, Shield, AlertTriangle } from 'lucide-react';
import { applyProfileOverlay, cacheMergedUser } from '@/lib/profileOverlay';

export default function Settings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const token = await getValidAccessToken();
        const res = await fetch('/api/account/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          const user = applyProfileOverlay(data.user || {}) || data.user || {};
          if (typeof user.emailNotifications === 'boolean') {
            setSettings((prev) => ({
              ...prev,
              emailNotifications: user.emailNotifications,
            }));
          }
          cacheMergedUser(user);
        }
      } catch {
        try {
          const user = JSON.parse(localStorage.getItem('user') || 'null');
          if (typeof user?.emailNotifications === 'boolean') {
            setSettings((prev) => ({ ...prev, emailNotifications: user.emailNotifications }));
          }
        } catch {
          // ignore
        }
      } finally {
        setIsHydrating(false);
      }
    };
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      let token = await getValidAccessToken();

      const body = {
        settingsOnly: true,
        emailNotifications: settings.emailNotifications,
        ...(settings.newPassword ? { password: settings.newPassword } : {}),
      };

      let res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update settings');
      }

      try {
        const base =
          applyProfileOverlay(data.user || {}) ||
          data.user ||
          JSON.parse(localStorage.getItem('user') || '{}');
        const nextUser = {
          ...base,
          emailNotifications: settings.emailNotifications,
        };
        cacheMergedUser(nextUser);
        window.dispatchEvent(new Event('eraiiz:account-updated'));
      } catch {
        // ignore
      }
      setSettings((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
      setSuccess(
        settings.newPassword
          ? 'Password and notification settings saved.'
          : 'Notification settings saved.'
      );
    } catch (err) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let token = await getValidAccessToken();
      const requestUrl = process.env.NEXT_PUBLIC_API_URL + '/api/auth/delete-account';

      let res = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (res.status === 401) {
        token = await refreshAccessToken();
        res = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to delete account');
      }

      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to delete account');
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage notifications, password, and account</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-gray-900">Notifications</h2>
              <p className="text-xs text-gray-500">Email alerts for orders and updates</p>
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleChange}
              disabled={isHydrating || isLoading}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-700">Email notifications</span>
          </label>
        </div>

        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lock className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-gray-900">Password</h2>
              <p className="text-xs text-gray-500">Leave blank to keep your current password</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">New password</label>
              <input
                type="password"
                name="newPassword"
                value={settings.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                value={settings.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                autoComplete="new-password"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isHydrating}
          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 text-sm"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save settings
            </>
          )}
        </button>
      </form>

      <div className="bg-white shadow-sm rounded-xl border border-red-100 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-100 rounded-lg">
            <Shield className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold text-gray-900">Danger zone</h2>
            <p className="text-xs text-gray-500">Permanently delete your account</p>
          </div>
        </div>
        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              This cannot be undone. All account data will be removed.
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Confirm delete
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
