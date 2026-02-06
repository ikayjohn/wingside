"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WingsideCard {
  id: string;
  card_serial: string;
  user_id: string;
  status: 'active' | 'suspended' | 'lost' | 'stolen' | 'expired' | 'terminated';
  card_type: 'standard' | 'gift' | 'corporate';
  max_debit: number;
  linked_at: string;
  last_used_at: string | null;
  total_transactions: number;
  total_spent: number;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
}

interface CardStats {
  total_cards: number;
  active_cards: number;
  suspended_cards: number;
  total_value: number;
  total_transactions: number;
}

export default function AdminWingsideCardsPage() {
  const [cards, setCards] = useState<WingsideCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<WingsideCard[]>([]);
  const [stats, setStats] = useState<CardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<WingsideCard | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('You must be logged in to view this page');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        setError('Admin access required');
        setLoading(false);
        return;
      }

      // User is admin, fetch data
      await Promise.all([fetchCards(), fetchStats()]);
    } catch (err) {
      console.error('Auth check failed:', err);
      setError('Failed to verify permissions');
      setLoading(false);
    }
  };

  useEffect(() => {
    filterCards();
  }, [searchQuery, statusFilter, cards]);

  const fetchCards = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/wingside-cards');

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch cards');
      }

      const data = await response.json();

      if (data.success) {
        setCards(data.cards || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching cards:', err);
      setError(`Failed to load cards: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/wingside-cards', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();

      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        throw new Error('Invalid stats response');
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Don't set error state here, stats are optional
      // Set default stats instead
      setStats({
        total_cards: 0,
        active_cards: 0,
        suspended_cards: 0,
        total_value: 0,
        total_transactions: 0
      });
    }
  };

  const filterCards = () => {
    let filtered = [...cards];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(card =>
        card.card_serial.toLowerCase().includes(query) ||
        card.user_email?.toLowerCase().includes(query) ||
        card.user_name?.toLowerCase().includes(query) ||
        card.user_phone?.includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(card => card.status === statusFilter);
    }

    setFilteredCards(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'lost': return 'bg-orange-100 text-orange-800';
      case 'stolen': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'terminated': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600">Loading Wingside Cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <Link
                href="/admin"
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors text-center"
              >
                Back to Admin
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wingside Cards Management</h1>
            <p className="text-gray-600 mt-1">Manage physical tap cards and monitor transactions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium transition-colors"
            >
              Generate Card Serial
            </button>
            <Link
              href="/admin"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Back to Admin
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Cards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_cards}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Active Cards</p>
              <p className="text-2xl font-bold text-green-600">{stats.active_cards}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Suspended</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.suspended_cards}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_value)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_transactions}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by card serial, email, name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="lost">Lost</option>
              <option value="stolen">Stolen</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
          <button
            onClick={fetchCards}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            <p className="mt-4 text-gray-600">Loading cards...</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="p-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <p className="text-gray-600">No cards found</p>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card Serial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-gray-900">
                        {card.card_serial}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{card.user_name || 'N/A'}</div>
                        <div className="text-gray-500">{card.user_email}</div>
                        {card.user_phone && (
                          <div className="text-gray-500">{card.user_phone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(card.status)}`}>
                        {card.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {card.card_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {card.total_transactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(card.total_spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(card.linked_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedCard(card)}
                        className="text-yellow-600 hover:text-yellow-900 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Card Serial Modal */}
      {showGenerateModal && (
        <GenerateCardSerialModal onClose={() => setShowGenerateModal(false)} />
      )}

      {/* Card Details Modal */}
      {selectedCard && (
        <CardDetailsModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onUpdate={fetchCards}
        />
      )}
    </div>
  );
}

// Generate Card Serial Modal
function GenerateCardSerialModal({ onClose }: { onClose: () => void }) {
  const [count, setCount] = useState(1);
  const [generatedSerials, setGeneratedSerials] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const generateSerials = async () => {
    setGenerating(true);
    const serials: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code (hex format)
      // Format: 372FB056 (numbers and letters A-F)
      const randomHex = Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase().padStart(8, '0');
      const serial = randomHex;

      // Check if serial already exists
      const { data } = await supabase
        .from('wingside_cards')
        .select('card_serial')
        .eq('card_serial', serial)
        .maybeSingle();

      if (!data) {
        serials.push(serial);
      } else {
        i--; // Retry if duplicate
      }
    }

    setGeneratedSerials(serials);
    setGenerating(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyAllToClipboard = () => {
    navigator.clipboard.writeText(generatedSerials.join('\n'));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Card Serials</h3>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Format:</strong> 8-character alphanumeric code
            <br />
            <strong>Example:</strong> 372FB056
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Serials to Generate
            </label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum 100 serials at a time</p>
          </div>

          <button
            onClick={generateSerials}
            disabled={generating}
            className="w-full px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate Serials'}
          </button>
        </div>

        {generatedSerials.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Generated Serials:</p>
              <button
                onClick={copyAllToClipboard}
                className="text-sm text-yellow-600 hover:text-yellow-800"
              >
                Copy All
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {generatedSerials.map((serial, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="font-mono text-sm">{serial}</span>
                  <button
                    onClick={() => copyToClipboard(serial)}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    📋
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ These serials are NOT saved to the database. Copy them now and print on physical cards.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Card Details Modal
function CardDetailsModal({
  card,
  onClose,
  onUpdate
}: {
  card: WingsideCard;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(card.status);

  const updateCardStatus = async () => {
    if (newStatus === card.status) {
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('wingside_cards')
        .update({ status: newStatus })
        .eq('id', card.id);

      if (error) throw error;

      alert('Card status updated successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Failed to update card status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Card Details</h3>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Card Serial</p>
              <p className="font-mono font-bold text-lg">{card.card_serial}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Card Type</p>
              <p className="font-medium capitalize">{card.card_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Status</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${card.status === 'active' ? 'bg-green-100 text-green-800' : card.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                {card.status.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Debit Limit</p>
              <p className="font-medium">₦{card.max_debit.toLocaleString()}</p>
            </div>
          </div>

          <hr />

          <div>
            <p className="text-sm text-gray-600 mb-1">Customer</p>
            <p className="font-medium">{card.user_name || 'N/A'}</p>
            <p className="text-sm text-gray-500">{card.user_email}</p>
            {card.user_phone && <p className="text-sm text-gray-500">{card.user_phone}</p>}
          </div>

          <hr />

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="font-bold text-xl">{card.total_transactions}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="font-bold text-xl">₦{card.total_spent.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Transaction</p>
              <p className="font-bold text-xl">
                ₦{card.total_transactions > 0 ? (card.total_spent / card.total_transactions).toFixed(0) : '0'}
              </p>
            </div>
          </div>

          <hr />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Linked Date</p>
              <p className="text-sm">{new Date(card.linked_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Used</p>
              <p className="text-sm">
                {card.last_used_at ? new Date(card.last_used_at).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>

          <hr />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Update Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="lost">Lost</option>
              <option value="stolen">Stolen</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={updateCardStatus}
            disabled={updating || newStatus === card.status}
            className="flex-1 px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium disabled:opacity-50"
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}
