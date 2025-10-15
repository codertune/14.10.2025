import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MailCheck,
  Phone,
  Building2,
  DollarSign,
  UserCheck,
  CheckCircle,
  AlertTriangle,
  Send,
  Key,
  Save,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Users,
  Receipt,
  History
} from 'lucide-react';
import TransactionHistory from './TransactionHistory';
import CreditHistoryTab from './CreditHistoryTab';

interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  mobile?: string;
  credits: number;
  isAdmin: boolean;
  status: string;
  emailVerified: boolean;
  memberSince: any;
  trialEndsAt: any;
  totalSpent: number;
  lastActivity: any;
  createdAt: any;
  updatedAt: any;
}

interface EnhancedUserTableProps {
  users: User[];
  editingUser: string | null;
  setEditingUser: (id: string | null) => void;
  handleUserUpdate: (id: string, field: string, value: any) => void;
  handleDeleteUser: (id: string, email: string) => void;
  suspendUser: (id: string) => void;
  activateUser: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterVerification: string;
  setFilterVerification: (verification: string) => void;
}

export default function EnhancedUserTable({
  users,
  editingUser,
  setEditingUser,
  handleUserUpdate,
  handleDeleteUser,
  suspendUser,
  activateUser,
  searchQuery,
  setSearchQuery,
  filterStatus,
  setFilterStatus,
  filterVerification,
  setFilterVerification
}: EnhancedUserTableProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<{[key: string]: string}>({});
  const [verifyingEmail, setVerifyingEmail] = useState<string | null>(null);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  const handleTabChange = (userId: string, tab: string) => {
    setActiveTab(prev => ({ ...prev, [userId]: tab }));
  };

  const getCurrentTab = (userId: string) => {
    return activeTab[userId] || 'account';
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRelativeTime = (date: any) => {
    if (!date) return 'Never';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const handleManualVerifyEmail = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Manually verify email for ${userEmail}?`)) return;

    setVerifyingEmail(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify-email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (result.success) {
        alert('Email verified successfully');
        window.location.reload();
      } else {
        alert(result.message || 'Failed to verify email');
      }
    } catch (error: any) {
      alert('Error verifying email: ' + error.message);
    } finally {
      setVerifyingEmail(null);
    }
  };

  const handleResendVerificationEmail = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Resend verification email to ${userEmail}?`)) return;

    setResendingEmail(userId);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Verification email sent successfully');
      } else {
        alert(result.message || 'Failed to send verification email');
      }
    } catch (error: any) {
      alert('Error sending email: ' + error.message);
    } finally {
      setResendingEmail(null);
    }
  };

  const handleManualPasswordReset = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Send password reset email to ${userEmail}?`)) return;

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Password reset email sent successfully');
      } else {
        alert(result.message || 'Failed to send password reset email');
      }
    } catch (error: any) {
      alert('Error sending password reset: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === '' ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.mobile?.includes(searchQuery);

    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    const matchesVerification = filterVerification === 'all' ||
      (filterVerification === 'verified' && user.emailVerified) ||
      (filterVerification === 'unverified' && !user.emailVerified);

    return matchesSearch && matchesStatus && matchesVerification;
  });

  return (
    <>
      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search by name, email, company, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verification</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Info</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <React.Fragment key={user.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedUserId === user.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Building2 className="h-4 w-4 mr-1 text-gray-400" />
                      {user.company || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Phone className="h-4 w-4 mr-1 text-gray-400" />
                      {user.mobile || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <MailCheck className="h-3 w-3 mr-1" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <ShieldAlert className="h-3 w-3 mr-1" />
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingUser === user.id ? (
                      <select
                        defaultValue={user.isAdmin ? 'admin' : 'user'}
                        onChange={(e) => handleUserUpdate(user.id, 'isAdmin', e.target.value === 'admin')}
                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.isAdmin ? <ShieldCheck className="h-3 w-3 mr-1" /> : null}
                        {user.isAdmin ? 'Admin' : 'User'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {editingUser === user.id && !user.isAdmin ? (
                      <input
                        type="number"
                        defaultValue={user.credits}
                        onChange={(e) => handleUserUpdate(user.id, 'credits', parseFloat(e.target.value))}
                        className="border border-gray-300 rounded px-2 py-1 w-20 text-sm"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {user.isAdmin ? '∞' : user.credits}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{formatDate(user.memberSince)}</div>
                    <div className="text-xs text-gray-500">{getRelativeTime(user.memberSince)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      {editingUser === user.id ? (
                        <button
                          onClick={() => setEditingUser(null)}
                          className="text-green-600 hover:text-green-900"
                          title="Save"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}

                      {user.status === 'active' ? (
                        <button
                          onClick={() => suspendUser(user.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Suspend User"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => activateUser(user.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Activate User"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Expanded Details Row */}
                {expandedUserId === user.id && (
                  <tr>
                    <td colSpan={10} className="px-4 py-6 bg-gray-50">
                      {/* Tab Navigation */}
                      <div className="mb-6">
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-6">
                            <button
                              onClick={() => handleTabChange(user.id, 'account')}
                              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                                getCurrentTab(user.id) === 'account'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Account Information
                            </button>
                            <button
                              onClick={() => handleTabChange(user.id, 'transactions')}
                              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                                getCurrentTab(user.id) === 'transactions'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <Receipt className="h-4 w-4 mr-2" />
                              Transaction History
                            </button>
                            <button
                              onClick={() => handleTabChange(user.id, 'credits')}
                              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center transition-colors ${
                                getCurrentTab(user.id) === 'credits'
                                  ? 'border-blue-500 text-blue-600'
                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <History className="h-4 w-4 mr-2" />
                              Credit History
                            </button>
                          </nav>
                        </div>
                      </div>

                      {/* Tab Content */}
                      <div className="mt-4">
                        {getCurrentTab(user.id) === 'account' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Account Information */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Account Information
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">User ID:</span>
                                  <span className="text-gray-900 font-mono text-xs">{user.id.substring(0, 8)}...</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Created:</span>
                                  <span className="text-gray-900">{formatDate(user.createdAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Last Updated:</span>
                                  <span className="text-gray-900">{formatDate(user.updatedAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Last Activity:</span>
                                  <span className="text-gray-900">{getRelativeTime(user.lastActivity)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Billing & Credits */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <DollarSign className="h-4 w-4 mr-2" />
                                Billing & Credits
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Current Credits:</span>
                                  <span className="text-gray-900 font-semibold">{user.isAdmin ? '∞' : user.credits}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Total Spent:</span>
                                  <span className="text-gray-900 font-semibold">৳{user.totalSpent || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Trial Ends:</span>
                                  <span className="text-gray-900">{formatDate(user.trialEndsAt)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Member Since:</span>
                                  <span className="text-gray-900">{formatDate(user.memberSince)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Email Verification & Actions */}
                            <div className="bg-white p-4 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <Mail className="h-4 w-4 mr-2" />
                                Email Management
                              </h4>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-500">Email Status:</span>
                                  {user.emailVerified ? (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Verified
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Unverified
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-2 pt-2 border-t border-gray-200">
                                  {!user.emailVerified && (
                                    <button
                                      onClick={() => handleManualVerifyEmail(user.id, user.email)}
                                      disabled={verifyingEmail === user.id}
                                      className="w-full px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                      <UserCheck className="h-4 w-4 mr-1" />
                                      {verifyingEmail === user.id ? 'Verifying...' : 'Verify Email Manually'}
                                    </button>
                                  )}

                                  {!user.emailVerified && (
                                    <button
                                      onClick={() => handleResendVerificationEmail(user.id, user.email)}
                                      disabled={resendingEmail === user.id}
                                      className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                      <Send className="h-4 w-4 mr-1" />
                                      {resendingEmail === user.id ? 'Sending...' : 'Resend Verification'}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleManualPasswordReset(user.id, user.email)}
                                    className="w-full px-3 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center"
                                  >
                                    <Key className="h-4 w-4 mr-1" />
                                    Send Password Reset
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {getCurrentTab(user.id) === 'transactions' && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <TransactionHistory userId={user.id} />
                          </div>
                        )}

                        {getCurrentTab(user.id) === 'credits' && (
                          <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <CreditHistoryTab userId={user.id} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-500">No users found matching your filters.</p>
        </div>
      )}
    </>
  );
}
