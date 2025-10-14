import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, CreditCard, History, BarChart3, ArrowLeft, CreditCard as Edit2, Save, X, Key } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CreditPurchaseModal from '../components/CreditPurchaseModal';
import TransactionHistory from '../components/TransactionHistory';
import CreditUsageAnalytics from '../components/CreditUsageAnalytics';
import axios from 'axios';

type TabType = 'profile' | 'security' | 'credits' | 'transactions' | 'analytics';

export default function UserAccountPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    company: user?.company || '',
    mobile: user?.mobile || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  if (!user) {
    navigate('/');
    return null;
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['profile', 'security', 'credits', 'transactions', 'analytics'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [location.search]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/account?tab=${tab}`, { replace: true });
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'credits', label: 'Credits', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
    setProfileData({
      name: user.name,
      company: user.company,
      mobile: user.mobile
    });
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setProfileData({
      name: user.name,
      company: user.company,
      mobile: user.mobile
    });
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleProfileSave = async () => {
    if (!profileData.name || !profileData.company || !profileData.mobile) {
      setProfileError('All fields are required');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const response = await axios.put(`/api/users/${user.id}/profile`, profileData);

      if (response.data.success) {
        updateUser(response.data.user);
        setProfileSuccess(true);
        setIsEditingProfile(false);

        setTimeout(() => {
          setProfileSuccess(false);
        }, 3000);
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              {!isEditingProfile ? (
                <button
                  onClick={handleProfileEdit}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleProfileCancel}
                    disabled={isSavingProfile}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleProfileSave}
                    disabled={isSavingProfile}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>{isSavingProfile ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
            </div>

            {profileError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{profileError}</p>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">Profile updated successfully!</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">{user.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <p className="text-gray-900 px-4 py-3 bg-gray-100 rounded-lg">{user.email}</p>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileData.company}
                    onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">{user.company}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                {isEditingProfile ? (
                  <input
                    type="text"
                    value={profileData.mobile}
                    onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">{user.mobile}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Member Since</label>
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">
                    {new Date(user.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                  <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg capitalize">{user.status}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Password</h3>
                    <p className="text-sm text-gray-600">Change your account password</p>
                  </div>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'credits':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Balance</h2>
                  <p className="text-4xl font-bold text-green-600">{user.credits} credits</p>
                </div>
                <button
                  onClick={() => setShowCreditPurchaseModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 font-semibold shadow-lg transition-all"
                >
                  Purchase Credits
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Credit Information</h3>
              <div className="space-y-3 text-sm">
                <p className="text-gray-700">
                  Credits are used to run automation services. Each service has a different credit cost based on complexity.
                </p>
                <p className="text-gray-700">
                  You can purchase credits at any time. Credits never expire and can be used for any service.
                </p>
                <p className="text-gray-700">
                  Total spent: <span className="font-semibold text-gray-900">{user.totalSpent?.toFixed(2)} BDT</span>
                </p>
              </div>
            </div>
          </div>
        );

      case 'transactions':
        return <TransactionHistory userId={user.id} />;

      case 'analytics':
        return <CreditUsageAnalytics userId={user.id} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account preferences and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id as TabType)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userId={user.id}
        />
      )}

      {showCreditPurchaseModal && (
        <CreditPurchaseModal
          isOpen={showCreditPurchaseModal}
          onClose={() => setShowCreditPurchaseModal(false)}
          userId={user.id}
          currentCredits={user.credits}
          onPurchaseSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
