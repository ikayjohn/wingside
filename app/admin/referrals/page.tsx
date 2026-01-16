"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Referral {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code_used: string;
  referred_email: string;
  status: 'pending_signup' | 'signed_up' | 'first_order_completed' | 'rewarded';
  reward_amount: number;
  created_at: string;
  completed_at: string | null;
  referrer?: {
    full_name: string;
    email: string;
    referral_code: string;
  };
  referred_user?: {
    full_name: string;
    email: string;
  };
}

interface ReferralReward {
  id: string;
  referral_id: string;
  user_id: string;
  reward_type: 'referrer_bonus' | 'referred_bonus';
  amount: number;
  points: number;
  description: string;
  status: string;
  created_at: string;
}

export default function ReferralsManagementPage() {
  const supabase = createClient();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'referrals' | 'rewards'>('referrals');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalRewardsPaid: 0,
    totalAmount: 0,
  });

  const fetchReferrals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('referrals')
        .select(`
          *,
          referrer:profiles!referrals_referrer_id_fkey (
            full_name,
            email,
            referral_code
          ),
          referred_user:profiles!referrals_referred_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setReferrals(data || []);

      // Calculate stats
      if (data) {
        setStats({
          totalReferrals: data.length,
          pendingReferrals: data.filter(r => r.status === 'pending_signup' || r.status === 'signed_up').length,
          completedReferrals: data.filter(r => r.status === 'first_order_completed' || r.status === 'rewarded').length,
          totalRewardsPaid: data.filter(r => r.status === 'rewarded').length * 2, // Both referrer and referred get rewards
          totalAmount: data.filter(r => r.status === 'rewarded').length * 2 * 1000, // ₦1,000 each
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch referrals';
      setError(message);
      console.error('Error fetching referrals:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setRewards(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch rewards';
      setError(message);
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (activeTab === 'referrals') {
      fetchReferrals();
    } else {
      fetchRewards();
    }
  }, [activeTab, fetchReferrals, fetchRewards]);

  const getStatusBadge = (status: string) => {
    const badges = {
      pending_signup: 'bg-gray-100 text-gray-800',
      signed_up: 'bg-blue-100 text-blue-800',
      first_order_completed: 'bg-yellow-100 text-yellow-800',
      rewarded: 'bg-green-100 text-green-800',
      credited: 'bg-green-100 text-green-800',
    };

    const labels = {
      pending_signup: 'Pending',
      signed_up: 'Signed Up',
      first_order_completed: 'Order Completed',
      rewarded: 'Rewarded',
      credited: 'Credited',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getRewardTypeBadge = (type: string) => {
    const badges = {
      referrer_bonus: 'bg-purple-100 text-purple-800',
      referred_bonus: 'bg-green-100 text-green-800',
    };

    const labels = {
      referrer_bonus: 'Referrer Bonus',
      referred_bonus: 'Welcome Bonus',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[type as keyof typeof badges] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  const filteredReferrals = referrals.filter(referral => {
    if (statusFilter === 'all') return true;
    return referral.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-gray-600 mt-1">Manage referral program and track rewards</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Referrals</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalReferrals}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-3xl font-bold text-yellow-600">{stats.pendingReferrals}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completedReferrals}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Rewards Paid</p>
            <p className="text-3xl font-bold text-blue-600">{stats.totalRewardsPaid}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-purple-600">₦{stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'referrals'
                    ? 'border-yellow-400 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Referrals
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'rewards'
                    ? 'border-yellow-400 text-yellow-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Reward History
              </button>
            </nav>
          </div>
        </div>

        {/* Referrals Tab */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-lg shadow">
            {/* Filter */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending_signup">Pending</option>
                  <option value="signed_up">Signed Up</option>
                  <option value="first_order_completed">Order Completed</option>
                  <option value="rewarded">Rewarded</option>
                </select>
                <button
                  onClick={fetchReferrals}
                  className="ml-auto px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium text-sm transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referrer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Referred User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reward Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReferrals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No referrals found
                      </td>
                    </tr>
                  ) : (
                    filteredReferrals.map((referral) => (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referrer?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referral.referrer?.email || referral.referrer_id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {referral.referred_user?.full_name || 'Not signed up'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {referral.referred_email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-mono">
                            {referral.referral_code_used}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">
                            ₦{referral.reward_amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(referral.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {referral.completed_at
                            ? new Date(referral.completed_at).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={fetchRewards}
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-500 font-medium text-sm transition-colors"
              >
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rewards.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No rewards found
                      </td>
                    </tr>
                  ) : (
                    rewards.map((reward) => (
                      <tr key={reward.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-mono">
                            {reward.user_id.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRewardTypeBadge(reward.reward_type)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-green-600">
                            ₦{reward.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {reward.points || 0} pts
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(reward.status)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-900">
                            {reward.description}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(reward.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
