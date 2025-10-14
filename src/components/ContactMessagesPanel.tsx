import React, { useState, useEffect } from 'react';
import { Mail, Search, Filter, RefreshCw, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  message: string;
  submitted_at: string;
  status: 'new' | 'read' | 'resolved';
}

export default function ContactMessagesPanel() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/contact-messages?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.messages);
      setTotal(data.total);
    } catch (error) {
      console.error('Error fetching contact messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: 'new' | 'read' | 'resolved') => {
    setUpdating(messageId);
    try {
      const response = await fetch(`/api/contact-messages/${messageId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update message status');
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId ? { ...msg, status: newStatus } : msg
        )
      );

      if (selectedMessage?.id === messageId) {
        setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating message status:', error);
      alert('Failed to update message status');
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [offset, statusFilter, searchQuery]);

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800',
      read: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800'
    };

    const icons = {
      new: Mail,
      read: Eye,
      resolved: CheckCircle
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Contact Messages</h2>
          <p className="text-sm text-gray-500 mt-1">
            {total} total message{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading && messages.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
          <p className="text-gray-500">Loading messages...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No messages found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`border rounded-lg p-4 transition-all ${
                selectedMessage?.id === message.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{message.name}</h3>
                    {getStatusBadge(message.status)}
                  </div>
                  <p className="text-sm text-gray-600">
                    <a href={`mailto:${message.email}`} className="text-blue-600 hover:underline">
                      {message.email}
                    </a>
                    {message.company && (
                      <span className="ml-2 text-gray-500">• {message.company}</span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDate(message.submitted_at)}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="font-medium text-gray-900 mb-1">{message.subject}</p>
                {selectedMessage?.id === message.id ? (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                ) : (
                  <p className="text-sm text-gray-600 line-clamp-2">{message.message}</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setSelectedMessage(
                    selectedMessage?.id === message.id ? null : message
                  )}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedMessage?.id === message.id ? 'Show less' : 'Show more'}
                </button>

                {message.status !== 'resolved' && (
                  <>
                    {message.status === 'new' && (
                      <button
                        onClick={() => updateMessageStatus(message.id, 'read')}
                        disabled={updating === message.id}
                        className="text-sm px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors disabled:opacity-50"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => updateMessageStatus(message.id, 'resolved')}
                      disabled={updating === message.id}
                      className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      Mark as Resolved
                    </button>
                  </>
                )}

                {message.status === 'resolved' && (
                  <button
                    onClick={() => updateMessageStatus(message.id, 'new')}
                    disabled={updating === message.id}
                    className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Reopen
                  </button>
                )}

                <a
                  href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                  className="text-sm px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ml-auto"
                >
                  Reply
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
