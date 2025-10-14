import React, { useState, useEffect } from 'react';
import { Download, Filter, Search, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import axios from 'axios';

interface Transaction {
  id: string;
  transaction_type: string;
  amount_bdt: number;
  credits_amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  payment_date: string;
  created_at: string;
}

interface TransactionHistoryProps {
  userId: string;
}

export default function TransactionHistory({ userId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_spent: 0,
    total_credits_purchased: 0
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [userId, page, dateFilter, statusFilter]);

  const fetchTransactions = async () => {
    if (!userId) {
      setError('User ID is required');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

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

      if (statusFilter !== 'all') {
        filters.paymentStatus = statusFilter;
      }

      const queryParams = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((page - 1) * itemsPerPage).toString(),
        ...filters
      });

      const response = await axios.get(`/api/transactions/${userId}?${queryParams}`);

      if (response.data.success) {
        setTransactions(response.data.transactions || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        setError(response.data.message || 'Failed to fetch transactions');
      }
    } catch (err: any) {
      console.error('Failed to fetch transactions:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load transactions');
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummary = async () => {
    if (!userId) return;

    try {
      const response = await axios.get(`/api/transactions/${userId}/summary`);
      if (response.data.success) {
        setSummary(response.data.summary || {
          total_transactions: 0,
          total_spent: 0,
          total_credits_purchased: 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setSummary({
        total_transactions: 0,
        total_spent: 0,
        total_credits_purchased: 0
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 border-green-300',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
      refunded: 'bg-gray-100 text-gray-700 border-gray-300'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${styles[status as keyof typeof styles] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors = {
      bkash: 'bg-pink-100 text-pink-700',
      nagad: 'bg-orange-100 text-orange-700',
      card: 'bg-blue-100 text-blue-700',
      bank_transfer: 'bg-indigo-100 text-indigo-700'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[method as keyof typeof colors] || 'bg-gray-100 text-gray-700'}`}>
        {method.toUpperCase()}
      </span>
    );
  };

  const filteredTransactions = transactions.filter(txn =>
    txn.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const exportToCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Type', 'Amount (BDT)', 'Credits', 'Payment Method', 'Status'];
    const rows = filteredTransactions.map(txn => [
      formatDate(txn.created_at),
      txn.transaction_id,
      txn.transaction_type,
      txn.amount_bdt.toString(),
      txn.credits_amount.toString(),
      txn.payment_method,
      txn.payment_status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-sm text-blue-700 font-medium mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-blue-900">{Number(summary.total_spent || 0).toFixed(2)} BDT</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-green-700 font-medium mb-1">Credits Purchased</p>
          <p className="text-2xl font-bold text-green-900">{summary.total_credits_purchased}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
          <p className="text-sm text-purple-700 font-medium mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-purple-900">{summary.total_transactions}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by transaction ID..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={exportToCSV}
              disabled={filteredTransactions.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-700 font-medium">{error}</p>
            </div>
            <button
              onClick={() => { setError(null); fetchTransactions(); fetchSummary(); }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Transaction ID</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Credits</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Method</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{formatDate(txn.created_at)}</td>
                      <td className="py-3 px-4 text-sm font-mono text-gray-700">{txn.transaction_id}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900">{Number(txn.amount_bdt || 0).toFixed(2)} BDT</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">+{txn.credits_amount}</td>
                      <td className="py-3 px-4">{getPaymentMethodBadge(txn.payment_method)}</td>
                      <td className="py-3 px-4">{getStatusBadge(txn.payment_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalCount)} of {totalCount} transactions
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
