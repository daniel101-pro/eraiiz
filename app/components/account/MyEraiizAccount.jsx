import { useState, useEffect } from 'react';
import { getValidAccessToken, refreshAccessToken } from '../../utils/auth';
import { User, Mail, Phone, MapPin, Calendar, Globe, Building, Edit3, Save, X, Check, AlertCircle, CreditCard, BarChart3 } from 'lucide-react';
import EnvironmentalImpact from './EnvironmentalImpact';
import EcoRankBadge from './EcoRankBadge';
import { formatDateOfBirthDisplay, profileFromUser } from '@/lib/accountProfile';
import { applyProfileOverlay, profileSnapshot, saveProfileLocally } from '@/lib/profileOverlay';
import { useCurrency } from '../../context/CurrencyContext';

export default function MyEraiizAccount({ user, setUser }) {
  const { formatPrice, convertPrice } = useCurrency();
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState(() => profileSnapshot(user));
  const [ecoImpact, setEcoImpact] = useState(null);
  const [stats, setStats] = useState({
    purchases: user?.eraizStats?.numberOfPurchases || 0,
    spent: user?.eraizStats?.totalAmountSpent || 0,
    salesCount: 0,
    salesAmount: 0,
    toShip: 0,
  });
  const displayUser = applyProfileOverlay(user) || user;
  const display = profileFromUser(displayUser);

  useEffect(() => {
    if (!user) return;
    if (isEditingAccount || isEditingBilling) return;
    setFormData(profileSnapshot(user));
  }, [user, isEditingAccount, isEditingBilling]);

  const cancelAccountEdit = () => {
    setFormData(profileSnapshot(user));
    setIsEditingAccount(false);
    setError(null);
  };

  const cancelBillingEdit = () => {
    setFormData(profileSnapshot(user));
    setIsEditingBilling(false);
    setError(null);
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;
        const response = await fetch('/api/account-stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        setStats({
          purchases: Number(data.purchases || 0),
          spent: Number(data.spent || 0),
          salesCount: Number(data.salesCount || 0),
          salesAmount: Number(data.salesAmount || 0),
          toShip: Number(data.toShip || 0),
        });
      } catch (err) {
        console.error('Failed to load account stats', err);
      }
    };
    loadStats();
  }, []);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('eraiiz_eco_impact') || 'null');
      if (cached) setEcoImpact(cached);
    } catch {
      // ignore
    }
    const onImpact = (event) => {
      if (event?.detail) setEcoImpact(event.detail);
    };
    window.addEventListener('eraiiz:eco-impact-updated', onImpact);
    return () => window.removeEventListener('eraiiz:eco-impact-updated', onImpact);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let token;
      try {
        token = await getValidAccessToken();
      } catch {
        token = null;
      }
      if (!token) {
        window.location.href = '/login';
        return;
      }

      let res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profile: formData }),
      });

      if (res.status === 401) {
        try {
          token = await refreshAccessToken();
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return;
        }
        res = await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ profile: formData }),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.user) {
          const recovered = saveProfileLocally(data.user, formData);
          setUser(recovered);
        }
        throw new Error(data.message || 'Failed to update user data');
      }

      // Pin DOB/billing locally, then re-fetch so UI matches the database.
      const baseUser = data.user || user;
      let updatedUser = saveProfileLocally(baseUser, {
        ...profileFromUser(baseUser),
        ...formData,
      });

      try {
        const verify = await fetch('/api/account/profile', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const verified = await verify.json().catch(() => ({}));
        if (verify.ok && verified.user) {
          updatedUser = saveProfileLocally(verified.user, {
            ...profileFromUser(verified.user),
            ...formData,
          });
        }
      } catch {
        // keep patched user
      }

      setUser(updatedUser);
      setFormData(profileFromUser(updatedUser));
      try {
        sessionStorage.removeItem('eraiiz_checkout');
        window.dispatchEvent(new Event('eraiiz:account-updated'));
      } catch (storageErr) {
        console.error('Failed to cache updated account', storageErr);
      }
      setIsEditingAccount(false);
      setIsEditingBilling(false);
      setSuccess(
        data.persisted === 'database'
          ? 'Profile saved to your account.'
          : 'Profile saved. DOB and billing are stored with your account.'
      );
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
          <div className="flex flex-wrap items-center gap-3">
            {ecoImpact?.rank ? (
              <EcoRankBadge
                rank={ecoImpact.rank}
                level={ecoImpact.level || 1}
                size="sm"
                showLabel
              />
            ) : null}
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
              type="button"
              onClick={() => (isEditingAccount ? cancelAccountEdit() : setIsEditingAccount(true))}
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
                  <p className="text-xs font-medium text-gray-900">{display.name || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Email Address</p>
                  <p className="text-xs font-medium text-gray-900">{display.email || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="text-xs font-medium text-gray-900">
                    {formatDateOfBirthDisplay(display.dateOfBirth) || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-xs font-medium text-gray-900">{display.phone || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Country</p>
                    <p className="text-xs font-medium text-gray-900">{display.country || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">State</p>
                    <p className="text-xs font-medium text-gray-900">{display.state || 'Not provided'}</p>
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
              type="button"
              onClick={() => (isEditingBilling ? cancelBillingEdit() : setIsEditingBilling(true))}
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
                    {display.houseAddress || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">City</p>
                  <p className="text-xs font-medium text-gray-900">
                    {display.city || 'Not provided'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Postal Code</p>
                  <p className="text-xs font-medium text-gray-900">
                    {display.postalAddress || 'Not provided'}
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
                  {stats.purchases}
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
                  {formatPrice(convertPrice(Number(stats.spent || 0), 'NGN'))}
                </p>
              </div>
              <div className="p-2 md:p-3 bg-green-200 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-700" />
              </div>
            </div>
          </div>

          {(user?.role === 'seller' || stats.salesCount > 0) && (
            <>
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 md:p-6 rounded-lg border border-emerald-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-emerald-900">Items sold</p>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-emerald-900 mt-1">
                      {stats.salesCount}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 bg-emerald-200 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-emerald-700" />
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-4 md:p-6 rounded-lg border border-amber-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-900">Orders to ship</p>
                    <p className="text-xs sm:text-sm md:text-base font-bold text-amber-900 mt-1">
                      {stats.toShip}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 bg-amber-200 rounded-lg">
                    <CreditCard className="w-5 h-5 text-amber-700" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Environmental Impact Section */}
      <EnvironmentalImpact />
    </div>
  );
}