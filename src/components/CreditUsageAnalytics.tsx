import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Zap, Calendar } from 'lucide-react';
import axios from 'axios';

interface ServiceUsage {
  serviceId: string;
  serviceName: string;
  timesUsed: number;
  totalCreditsSpent: number;
  lastUsed: string;
  percentage: string;
}

interface CreditUsageAnalyticsProps {
  userId: string;
}

export default function CreditUsageAnalytics({ userId }: CreditUsageAnalyticsProps) {
  const [services, setServices] = useState<ServiceUsage[]>([]);
  const [totalCreditsSpent, setTotalCreditsSpent] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    fetchCreditUsage();
  }, [userId, dateFilter]);

  const fetchCreditUsage = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};

      if (dateFilter !== 'all') {
        const today = new Date();
        let dateFrom = new Date();

        switch (dateFilter) {
          case '7days':
            dateFrom.setDate(today.getDate() - 7);
            break;
          case '30days':
            dateFrom.setDate(today.getDate() - 30);
            break;
          case '90days':
            dateFrom.setDate(today.getDate() - 90);
            break;
        }

        filters.dateFrom = dateFrom.toISOString();
        filters.dateTo = today.toISOString();
      }

      const queryParams = new URLSearchParams(filters);
      const response = await axios.get(`/api/analytics/credit-usage/${userId}?${queryParams}`);

      if (response.data.success) {
        setServices(response.data.services);
        setTotalCreditsSpent(response.data.totalCreditsSpent);
      }
    } catch (err) {
      console.error('Failed to fetch credit usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const mostUsedService = services.length > 0 ? services[0] : null;
  const avgCreditsPerService = services.length > 0
    ? (totalCreditsSpent / services.reduce((sum, s) => sum + s.timesUsed, 0)).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Zap className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">Total Credits Spent</p>
          <p className="text-2xl font-bold text-blue-900">{totalCreditsSpent.toFixed(2)}</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-medium mb-1">Most Used Service</p>
          <p className="text-lg font-bold text-green-900 truncate">
            {mostUsedService ? mostUsedService.serviceName : 'N/A'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-sm text-purple-700 font-medium mb-1">Avg Credits/Use</p>
          <p className="text-2xl font-bold text-purple-900">{avgCreditsPerService}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Service Usage Breakdown</h3>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No usage data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {services.map((service, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{service.serviceName}</h4>
                    <p className="text-xs text-gray-500">Last used: {formatDate(service.lastUsed)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{service.totalCreditsSpent.toFixed(2)}</p>
                    <p className="text-xs text-gray-600">credits</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Times Used</p>
                    <p className="text-lg font-bold text-gray-900">{service.timesUsed}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Avg Credits</p>
                    <p className="text-lg font-bold text-gray-900">
                      {(service.totalCreditsSpent / service.timesUsed).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Percentage of Total</span>
                    <span className="font-semibold text-gray-900">{service.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
