'use client';

import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import {
  Save as SaveIcon,
  Restore as RestoreIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  Palette as ThemeIcon,
  Email as EmailIcon
} from '@mui/icons-material';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'Eraiiz Admin Panel',
    siteDescription: 'Administrative panel for Eraiiz platform',
    adminEmail: 'admin@eraiiz.com',
    supportEmail: 'support@eraiiz.com',
    timezone: 'UTC',
    language: 'en',
    maintenanceMode: false
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    passwordMinLength: 8,
    passwordRequireSpecialChars: true,
    allowMultipleSessions: false
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    orderNotifications: true,
    userRegistrationNotifications: true,
    productApprovalNotifications: true,
    reviewModerationNotifications: true,
    systemAlerts: true,
    dailyReports: false,
    weeklyReports: true
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@eraiiz.com',
    fromName: 'Eraiiz Platform'
  });

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = () => {
    // Reset to default values
    setGeneralSettings({
      siteName: 'Eraiiz Admin Panel',
      siteDescription: 'Administrative panel for Eraiiz platform',
      adminEmail: 'admin@eraiiz.com',
      supportEmail: 'support@eraiiz.com',
      timezone: 'UTC',
      language: 'en',
      maintenanceMode: false
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ThemeIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Configure system settings and preferences</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
              >
                <RestoreIcon className="w-4 h-4" />
                <span>Restore Defaults</span>
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <SaveIcon className="w-4 h-4" />
                )}
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="bg-white shadow-sm rounded-xl border border-green-200 p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm font-medium text-green-800">Settings saved successfully!</p>
            </div>
          </div>
        )}

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <LanguageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                <p className="text-sm text-gray-500">Configure basic platform settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Name
                </label>
                <input
                  type="text"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({...generalSettings, siteName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site Description
                </label>
                <textarea
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({...generalSettings, siteDescription: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    value={generalSettings.adminEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, adminEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Support Email
                  </label>
                  <input
                    type="email"
                    value={generalSettings.supportEmail}
                    onChange={(e) => setGeneralSettings({...generalSettings, supportEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={generalSettings.maintenanceMode}
                  onChange={(e) => setGeneralSettings({...generalSettings, maintenanceMode: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                  Enable Maintenance Mode
                </label>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <SecurityIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-500">Configure authentication and security preferences</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requireTwoFactor"
                    checked={securitySettings.requireTwoFactor}
                    onChange={(e) => setSecuritySettings({...securitySettings, requireTwoFactor: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requireTwoFactor" className="ml-2 block text-sm text-gray-900">
                    Require Two-Factor Authentication
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="passwordRequireSpecialChars"
                    checked={securitySettings.passwordRequireSpecialChars}
                    onChange={(e) => setSecuritySettings({...securitySettings, passwordRequireSpecialChars: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="passwordRequireSpecialChars" className="ml-2 block text-sm text-gray-900">
                    Require Special Characters in Passwords
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="allowMultipleSessions"
                    checked={securitySettings.allowMultipleSessions}
                    onChange={(e) => setSecuritySettings({...securitySettings, allowMultipleSessions: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="allowMultipleSessions" className="ml-2 block text-sm text-gray-900">
                    Allow Multiple Login Sessions
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <NotificationsIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                <p className="text-sm text-gray-500">Configure system notification preferences</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, emailNotifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                  Email Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="orderNotifications"
                  checked={notificationSettings.orderNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, orderNotifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="orderNotifications" className="ml-2 block text-sm text-gray-900">
                  Order Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="userRegistrationNotifications"
                  checked={notificationSettings.userRegistrationNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, userRegistrationNotifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="userRegistrationNotifications" className="ml-2 block text-sm text-gray-900">
                  User Registration Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="productApprovalNotifications"
                  checked={notificationSettings.productApprovalNotifications}
                  onChange={(e) => setNotificationSettings({...notificationSettings, productApprovalNotifications: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="productApprovalNotifications" className="ml-2 block text-sm text-gray-900">
                  Product Approval Notifications
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="weeklyReports"
                  checked={notificationSettings.weeklyReports}
                  onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReports: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="weeklyReports" className="ml-2 block text-sm text-gray-900">
                  Weekly Reports
                </label>
              </div>
            </div>
          </div>

          {/* Email Configuration */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <EmailIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
                <p className="text-sm text-gray-500">Configure email server and notification settings</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Host
                  </label>
                  <input
                    type="text"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Port
                  </label>
                  <input
                    type="number"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings({...emailSettings, smtpPort: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Username
                </label>
                <input
                  type="text"
                  value={emailSettings.smtpUser}
                  onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SMTP Password
                </label>
                <input
                  type="password"
                  value={emailSettings.smtpPassword}
                  onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={emailSettings.fromEmail}
                    onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={emailSettings.fromName}
                    onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}