'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import RealTimeUpdater from '../components/RealTimeUpdater';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as VerifyIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { api } from '../../lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  country: string;
  isVerified: boolean;
  createdAt: string;
  stats?: {
    productCount: number;
    orderCount: number;
  };
}

interface UserStats {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  roleDistribution: {
    buyer: number;
    seller: number;
    admin: number;
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [limit, setLimit] = useState(20);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Fetch users from API
  const fetchUsers = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: limit.toString(),
        search: searchTerm,
        role: selectedRole,
        isVerified: selectedVerification,
        sortBy,
        sortOrder
      });

      const response = await api.get(`/admin/users?${params}`);
      const { users: fetchedUsers, pagination: paginationData } = response.data;
      
      setUsers(fetchedUsers);
      setPagination(paginationData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user statistics
  const fetchUserStats = async () => {
    try {
      const response = await api.get('/admin/users/stats');
      setUserStats(response.data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  // Real-time updates
  useEffect(() => {
    fetchUsers(true);
  }, [pagination.currentPage, limit, sortBy, sortOrder]);

  // Filter users when search/filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchUsers();
  }, [searchTerm, selectedRole, selectedVerification]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesVerification = selectedVerification === 'all' || 
                               (selectedVerification === 'verified' && user.isVerified) ||
                               (selectedVerification === 'unverified' && !user.isVerified);
    
    return matchesSearch && matchesRole && matchesVerification;
  });

  const handleUserAction = async (action: string, userId: string) => {
    try {
      switch (action) {
        case 'verify':
          await api.patch(`/admin/users/${userId}/verify`);
          break;
        case 'block':
          await api.patch(`/admin/users/${userId}/block`);
          break;
        case 'delete':
          if (confirm('Are you sure you want to delete this user?')) {
            await api.delete(`/admin/users/${userId}`);
          }
          break;
        default:
          console.log(`${action} user:`, userId);
      }
      
      // Refresh data after action
      fetchUsers(true);
      fetchUserStats();
    } catch (error) {
      console.error(`Error ${action} user:`, error);
    }
  };

  const handleBulkAction = async (action: string) => {
    try {
      if (selectedUsers.length === 0) return;
      
      switch (action) {
        case 'verify':
          await api.patch('/admin/users/bulk/verify', { userIds: selectedUsers });
          break;
        case 'block':
          await api.patch('/admin/users/bulk/block', { userIds: selectedUsers });
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) {
            await api.delete('/admin/users/bulk', { data: { userIds: selectedUsers } });
          }
          break;
      }
      
      setSelectedUsers([]);
      fetchUsers(true);
      fetchUserStats();
    } catch (error) {
      console.error(`Error bulk ${action}:`, error);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user._id)
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'from-purple-500 to-purple-600';
      case 'seller': return 'from-green-500 to-green-600';
      case 'buyer': return 'from-blue-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'seller': return 'Seller';
      case 'buyer': return 'Buyer';
      default: return role;
    }
  };

  return (
    <AdminLayout>
      <RealTimeUpdater 
        onUpdate={() => {
          fetchUsers(true);
          fetchUserStats();
        }} 
        interval={30000} 
        enabled={!loading} 
      />
      
      <div className="space-y-8">
        {/* Simplified Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage user accounts, roles, and verification status</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Live</span>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* User Statistics */}
        {userStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.totalUsers.toLocaleString()}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.verifiedUsers.toLocaleString()}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <VerifyIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.newUsersThisMonth.toLocaleString()}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.activeUsers.toLocaleString()}</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 border border-gray-300 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>

            {/* Verification Filter */}
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {pagination.totalUsers} users
              </div>
              <button
                onClick={() => {
                  fetchUsers(true);
                  fetchUserStats();
                }}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200"
                title="Refresh"
              >
                <RefreshIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-blue-800">
                  {selectedUsers.length} user(s) selected
                </span>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => handleBulkAction('verify')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <VerifyIcon className="w-4 h-4" />
                  <span>Verify</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('block')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <BlockIcon className="w-4 h-4" />
                  <span>Block</span>
                </button>
                <button 
                  onClick={() => handleBulkAction('delete')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                >
                  <DeleteIcon className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onChange={selectAllUsers}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition-all duration-200">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => toggleUserSelection(user._id)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r ${getRoleColor(user.role)} text-white shadow-sm`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{user.phone}</div>
                        <div>{user.country}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          user.isVerified 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {user.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {user.stats && (
                            <div className="space-y-1">
                              <div>Products: {user.stats.productCount}</div>
                              <div>Orders: {user.stats.orderCount}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUserAction('view', user._id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 hover:bg-blue-50 rounded-lg"
                            title="View User"
                          >
                            <ViewIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('edit', user._id)}
                            className="text-green-600 hover:text-green-800 transition-colors p-1 hover:bg-green-50 rounded-lg"
                            title="Edit User"
                          >
                            <EditIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('verify', user._id)}
                            className="text-purple-600 hover:text-purple-800 transition-colors p-1 hover:bg-purple-50 rounded-lg"
                            title="Verify User"
                          >
                            <VerifyIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('block', user._id)}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors p-1 hover:bg-yellow-50 rounded-lg"
                            title="Block User"
                          >
                            <BlockIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUserAction('delete', user._id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-1 hover:bg-red-50 rounded-lg"
                            title="Delete User"
                          >
                            <DeleteIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modern Pagination */}
        <div className="bg-white/80 backdrop-blur-sm px-6 py-4 border border-gray-100 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * limit) + 1} to {Math.min(pagination.currentPage * limit, pagination.totalUsers)} of {pagination.totalUsers} results
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPrevPage}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
              {pagination.currentPage}
            </span>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNextPage}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}