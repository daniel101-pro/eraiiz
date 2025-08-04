import { useState } from 'react';
import { refreshAccessToken } from '../../utils/auth';
import { User, Mail, Phone, MapPin, Calendar, Globe, Building, Edit3, Save, X, Check, AlertCircle, CreditCard, BarChart3 } from 'lucide-react';
import EnvironmentalImpact from './EnvironmentalImpact';

export default function MyEraiizAccount({ user, setUser }) {
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    phone: user?.phone || '',
    country: user?.country || '',
    state: user?.state || '',
    houseAddress: user?.billingAddress?.houseAddress || '',
    city: user?.billingAddress?.city || '',
    postalAddress: user?.billingAddress?.postalAddress || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      let res;
      try {
        res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/users/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
            phone: formData.phone,
            country: formData.country,
            state: formData.state,
            billingAddress: {
              houseAddress: formData.houseAddress,
              city: formData.city,
              postalAddress: formData.postalAddress,
            },
          }),
        });
      } catch (err) {
        if (err.cause?.status === 401) {
          try {
            token = await refreshAccessToken();
            res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/users/me', {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              credentials: 'include',
              body: JSON.stringify({
                name: formData.name,
                email: formData.email,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth) : null,
                phone: formData.phone,
                country: formData.country,
                state: formData.state,
                billingAddress: {
                  houseAddress: formData.houseAddress,
                  city: formData.city,
                  postalAddress: formData.postalAddress,
                },
              }),
            });
          } catch (refreshErr) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return;
          }
        } else {
          throw err;
        }
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user data');
      }
      setUser(data);
      setIsEditingAccount(false);
      setIsEditingBilling(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      seller: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: '🏪',
        label: 'Seller'
      },
      buyer: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        icon: '🛍️',
        label: 'Buyer'
      },
      admin: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        icon: '👑',
        label: 'Admin'
      }
    };

    const config = roleConfig[role] || roleConfig.buyer;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <span>{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-2 md:p-3 bg-green-100 rounded-lg">
            <User className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm md:text-base font-semibold text-gray-900">Account Overview</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Manage your personal information and preferences</p>
          </div>
          <div className="flex items-center gap-3">
            {getRoleBadge(user?.role)}
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 md:p-4 flex items-center gap-3">
          <div className="p-1 bg-green-100 rounded-full">
            <Check className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
          </div>
          <p className="text-green-800 text-xs md:text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 md:p-4 flex items-center gap-3">
          <div className="p-1 bg-red-100 rounded-full">
            <AlertCircle className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
          </div>
          <p className="text-red-800 text-xs md:text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Account Details */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 md:p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-semibold text-gray-900">Personal Information</h2>
                <p className="text-xs md:text-sm text-gray-500">Your basic account details</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditingAccount(!isEditingAccount)}
              className="flex items-center gap-2 px-2 md:px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs md:text-sm font-medium"
            >
              {isEditingAccount ? (
                <>
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                  Edit
                </>
              )}
            </button>
          </div>

          {isEditingAccount ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">State</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-xs font-medium text-gray-900">{user?.name || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-xs font-medium text-gray-900">{user?.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-xs font-medium text-gray-900">
                    {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-xs font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-xs font-medium text-gray-900">{user?.country || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">State</p>
                    <p className="text-xs font-medium text-gray-900">{user?.state || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Billing Address */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 md:mb-6">
            <div className="flex items-center gap-3">
              <div className="p-1.5 md:p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-semibold text-gray-900">Billing Address</h2>
                <p className="text-xs md:text-sm text-gray-500">Your address for billing and shipping</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditingBilling(!isEditingBilling)}
              className="flex items-center gap-2 px-2 md:px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs md:text-sm font-medium"
            >
              {isEditingBilling ? (
                <>
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                  Edit
                </>
              )}
            </button>
          </div>

          {isEditingBilling ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">House Address</label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <textarea
                    name="houseAddress"
                    value={formData.houseAddress}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter your complete house address"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter your city"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Postal Code</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
                  <input
                    type="text"
                    name="postalAddress"
                    value={formData.postalAddress}
                    onChange={handleChange}
                    className="w-full pl-8 md:pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">House Address</p>
                  <p className="text-xs font-medium text-gray-900">
                    {user?.billingAddress?.houseAddress || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-xs font-medium text-gray-900">
                    {user?.billingAddress?.city || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Postal Code</p>
                  <p className="text-xs font-medium text-gray-900">
                    {user?.billingAddress?.postalAddress || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Eraiiz Stats */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 md:mb-6">
          <div className="p-1.5 md:p-2 bg-orange-100 rounded-lg">
            <BarChart3 className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold text-gray-900">Account Statistics</h2>
            <p className="text-xs md:text-sm text-gray-500">Your activity summary on Eraiiz</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 md:p-6 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-900">Total Purchases</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-blue-900 mt-1">
                  {user?.eraizStats?.numberOfPurchases || 0}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-blue-200 rounded-lg">
                <BarChart3 className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 md:p-6 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-900">Total Spent</p>
                <p className="text-xs sm:text-sm md:text-base font-bold text-green-900 mt-1">
                  ₦{(user?.eraizStats?.totalAmountSpent || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-green-200 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Environmental Impact Section */}
      <EnvironmentalImpact />
    </div>
  );
}