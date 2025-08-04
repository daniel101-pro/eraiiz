'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Flag, Eye, CheckCircle, XCircle, Clock, Filter, Search, AlertTriangle } from 'lucide-react';

interface Report {
  _id: string;
  reporterId: string;
  productId: {
    _id: string;
    name: string;
    images: string[];
    description: string;
  };
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, status: string, notes?: string) => {
    try {
      setIsUpdating(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNotes: notes })
      });

      if (!response.ok) {
        throw new Error('Failed to update report');
      }

      // Refresh reports
      await fetchReports();
      setIsDetailModalOpen(false);
      setSelectedReport(null);
      setAdminNotes('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedReports.length === 0) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reports/bulk`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportIds: selectedReports,
          action
        })
      });

      if (!response.ok) {
        throw new Error('Failed to perform bulk action');
      }

      setSelectedReports([]);
      await fetchReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform bulk action');
    }
  };

  const toggleReportSelection = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const selectAllReports = () => {
    setSelectedReports(reports.map(report => report._id));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'dismissed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3" />;
      case 'reviewed':
        return <Eye className="w-3 h-3" />;
      case 'resolved':
        return <CheckCircle className="w-3 h-3" />;
      case 'dismissed':
        return <XCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: { [key: string]: string } = {
      'inappropriate_content': 'Inappropriate Content',
      'fake_product': 'Fake Product',
      'counterfeit': 'Counterfeit',
      'harmful_material': 'Harmful Material',
      'misleading_description': 'Misleading Description',
      'wrong_category': 'Wrong Category',
      'duplicate_listing': 'Duplicate Listing',
      'spam': 'Spam',
      'other': 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const filteredReports = reports.filter(report => {
    const matchesFilter = filter === 'all' || report.status === filter;
    const matchesSearch = report.productId.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    reviewed: reports.filter(r => r.status === 'reviewed').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    dismissed: reports.filter(r => r.status === 'dismissed').length
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Flag className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Product Reports</h1>
                <p className="text-sm text-gray-500">Manage and review product reports from users</p>
              </div>
            </div>
            <button
              onClick={fetchReports}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Flag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">Total Reports</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.reviewed}</p>
                <p className="text-sm text-gray-500">Reviewed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.resolved}</p>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <XCircle className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-gray-900">{stats.dismissed}</p>
                <p className="text-sm text-gray-500">Dismissed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReports.length > 0 && (
          <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedReports.length} report(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('reviewed')}
                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Mark as Reviewed
                </button>
                <button
                  onClick={() => handleBulkAction('resolved')}
                  className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
                >
                  Mark as Resolved
                </button>
                <button
                  onClick={() => handleBulkAction('dismissed')}
                  className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === filteredReports.length && filteredReports.length > 0}
                      onChange={selectAllReports}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((report) => (
                  <tr key={report._id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report._id)}
                        onChange={() => toggleReportSelection(report._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
                          {report.productId.images && report.productId.images.length > 0 ? (
                            <img
                              src={report.productId.images[0]}
                              alt={report.productId.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.productId.name}</div>
                          <div className="text-xs text-gray-500">ID: {report.productId._id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {getReasonLabel(report.reason)}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-2">
                          {report.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(report.status)}`}>
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status}</span>
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.adminNotes || '');
                            setIsDetailModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded text-xs font-medium transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reports found</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className={`fixed inset-0 z-50 ${isDetailModalOpen ? 'block' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsDetailModalOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Flag className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Report Details</h2>
                      <p className="text-sm text-gray-500">Review and update report status</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsDetailModalOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Product Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Reported Product</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                      {selectedReport.productId.images && selectedReport.productId.images.length > 0 ? (
                        <img
                          src={selectedReport.productId.images[0]}
                          alt={selectedReport.productId.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{selectedReport.productId.name}</div>
                      <div className="text-xs text-gray-500">ID: {selectedReport.productId._id}</div>
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Report Reason</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-900">
                        {getReasonLabel(selectedReport.reason)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-900">{selectedReport.description}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Current Status</h3>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedReport.status)}`}>
                      {getStatusIcon(selectedReport.status)}
                      <span className="capitalize">{selectedReport.status}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Admin Notes</h3>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add admin notes..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleStatusUpdate(selectedReport._id, 'reviewed', adminNotes)}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 border border-blue-200 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedReport._id, 'resolved', adminNotes)}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-green-600 bg-green-100 border border-green-200 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                  >
                    Mark as Resolved
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(selectedReport._id, 'dismissed', adminNotes)}
                    disabled={isUpdating}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
} 