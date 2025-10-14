import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, X, TrendingUp, TrendingDown, ShoppingCart, Cog, RefreshCw, DollarSign } from 'lucide-react';

interface CreditHistoryEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  creditsChange: number;
  amountBdt: number | null;
  paymentMethod: string;
  referenceId: string;
  status: string;
}

interface CreditHistorySummary {
  totalPurchased: number;
  totalUsed: number;
  netChange: number;
  currentBalance: number;
}

interface CreditHistoryTabProps {
  userId: string;
}

export default function CreditHistoryTab({ userId }: CreditHistoryTabProps) {
  const [history, setHistory] = useState<CreditHistoryEntry[]>([]);
  const [summary, setSummary] = useState<CreditHistorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const fetchCreditHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((currentPage - 1) * pageSize).toString(),
      });

      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      if (transactionType) params.append('transactionType', transactionType);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/users/${userId}/credit-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
        setSummary(data.summary);
        setTotalCount(data.totalCount);
        setTotalPages(data.totalPages);
      } else {
        setError(data.message || 'Failed to fetch credit history');
      }
    } catch (err) {
      setError('Failed to load credit history. Please try again.');
      console.error('Credit history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditHistory();
  }, [userId, currentPage, pageSize]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchCreditHistory();
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTransactionType('');
    setSearchQuery('');
    setCurrentPage(1);
    setTimeout(fetchCreditHistory, 100);
  };

  const handleExportCSV = () => {
    const csvHeaders = ['Date', 'Type', 'Description', 'Credits Change', 'Balance'];
    const csvRows = history.map(entry => [
      new Date(entry.date).toLocaleString(),
      entry.type,
      entry.description,
      entry.creditsChange > 0 ? `+${entry.creditsChange}` : entry.creditsChange,
      entry.amountBdt ? `৳${entry.amountBdt}` : '-'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `credit_history_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCart className="h-5 w-5 text-green-600" />;
      case 'usage':
        return <Cog className="h-5 w-5 text-red-600" />;
      case 'refund':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const badges = {
      purchase: 'bg-green-100 text-green-800',
      usage: 'bg-red-100 text-red-800',
      refund: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const activeFilterCount = [dateFrom, dateTo, transactionType, searchQuery].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total Purchased</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{summary.totalPurchased.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Total Used</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{summary.totalUsed.toFixed(2)}</p>
              </div>
              <TrendingDown className="h-10 w-10 text-red-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Net Change</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {summary.netChange > 0 ? '+' : ''}{summary.netChange.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Current Balance</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">{summary.currentBalance.toFixed(2)}</p>
              </div>
              <ShoppingCart className="h-10 w-10 text-purple-600 opacity-50" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Credit History</h3>
              <p className="text-sm text-gray-500 mt-1">
                Complete record of all credit transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors relative"
              >
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="purchase">Purchases</option>
                    <option value="usage">Usage</option>
                    <option value="refund">Refunds</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search description..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading credit history...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="text-red-600 mb-4">
              <X className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-700 font-medium">{error}</p>
            <button
              onClick={fetchCreditHistory}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Credit History Yet</h3>
            <p className="text-gray-500">Purchase credits or use services to see activity here.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits Change
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount (BDT)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        entry.creditsChange > 0 ? 'bg-green-50/30' : 'bg-red-50/30'
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(entry.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(entry.type)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(entry.type)}`}>
                            {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {entry.description}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${
                        entry.creditsChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.creditsChange > 0 ? '+' : ''}{entry.creditsChange.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                        {entry.amountBdt ? `৳${entry.amountBdt.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} of {totalCount} entries
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={10}>10 per page</option>
                  <option value={20}>20 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded-lg text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
