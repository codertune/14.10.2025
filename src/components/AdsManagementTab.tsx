import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface AdSetting {
  id: string;
  ad_client_id: string;
  ad_slot_id: string;
  ad_format: string;
  full_width_responsive: boolean;
  enabled: boolean;
  placement_location: string;
  page_name: string;
  description: string;
}

export default function AdsManagementTab() {
  const { user } = useAuth();
  const [adsSettings, setAdsSettings] = useState<AdSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchAdsSettings();
  }, []);

  const fetchAdsSettings = async () => {
    try {
      const response = await axios.get('/api/ads/settings');
      if (response.data.success) {
        setAdsSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching ads settings:', error);
      showMessage('error', 'Failed to load ads settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleToggle = async (id: string, currentValue: boolean) => {
    try {
      const response = await axios.patch(`/api/ads/toggle/${id}`, {
        enabled: !currentValue,
        userId: user?.id
      });

      if (response.data.success) {
        setAdsSettings(prev =>
          prev.map(setting =>
            setting.id === id ? { ...setting, enabled: !currentValue } : setting
          )
        );
        showMessage('success', response.data.message);
      }
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to toggle ad placement');
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises = adsSettings.map(setting =>
        axios.put(`/api/ads/settings/${setting.id}`, {
          ...setting,
          userId: user?.id
        })
      );

      await Promise.all(promises);
      showMessage('success', 'All ad settings saved successfully');
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to save ad settings');
    } finally {
      setSaving(false);
    }
  };

  const groupedSettings = adsSettings.reduce((acc, setting) => {
    if (!acc[setting.page_name]) {
      acc[setting.page_name] = [];
    }
    acc[setting.page_name].push(setting);
    return acc;
  }, {} as Record<string, AdSetting[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Google AdSense Management</h2>
            <p className="text-sm text-gray-600">
              Control ad placements across Dashboard and Blog pages
            </p>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        {/* Google AdSense Info */}
        {adsSettings.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Current AdSense Configuration</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Client ID:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded text-blue-600">
                  {adsSettings[0].ad_client_id}
                </code>
              </div>
              <div>
                <span className="text-gray-600">Ad Slot ID:</span>
                <code className="ml-2 bg-white px-2 py-1 rounded text-blue-600">
                  {adsSettings[0].ad_slot_id}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ad Placements by Page */}
      {Object.entries(groupedSettings).map(([pageName, settings]) => (
        <div key={pageName} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">{pageName} Page</h3>
            <span className="text-sm text-gray-600">
              {settings.filter(s => s.enabled).length} of {settings.length} active
            </span>
          </div>

          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className={`border-2 rounded-lg p-4 transition-all ${
                  setting.enabled
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {setting.placement_location.split('_').map(word =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        setting.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {setting.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {setting.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Format: {setting.ad_format}</span>
                      <span>Responsive: {setting.full_width_responsive ? 'Yes' : 'No'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(setting.id, setting.enabled)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      setting.enabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {setting.enabled ? (
                      <>
                        <EyeOff className="h-4 w-4" />
                        <span>Disable</span>
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        <span>Enable</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Ad Placement Information</h3>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Dashboard After Stats:</strong> Ad appears below the statistics cards on the user dashboard
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Dashboard After Button:</strong> Ad appears after the "Start Automation" button
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Blog Listing Top:</strong> Ad appears at the top of the blog listing page, after the hero section
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Blog Listing Bottom:</strong> Ad appears at the bottom of the blog listing page
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Blog Single Top:</strong> Ad appears at the top of individual blog posts
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p>
              <strong>Blog Single Bottom:</strong> Ad appears at the bottom of individual blog posts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
