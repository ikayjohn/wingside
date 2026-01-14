"use client";

import { useEffect, useState } from 'react';

interface SocialVerification {
  id: string;
  user_id: string;
  platform: string;
  username: string;
  status: 'pending' | 'verified' | 'rejected';
  reward_points: number;
  reward_claimed: boolean;
  submitted_at: string;
  verified_at?: string;
  metadata: {
    platform_url?: string;
    platform_name?: string;
  };
  // User info
  user_email?: string;
  user_name?: string;
}

export default function SocialVerificationsPage() {
  const [verifications, setVerifications] = useState<SocialVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  async function fetchVerifications() {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/admin/social-verifications?status=${filter}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch verifications');
      }

      setVerifications(data.verifications || []);
    } catch (err: any) {
      console.error('Error fetching verifications:', err);
      setError(err.message || 'Failed to load verifications');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    try {
      setProcessing(id);
      setError('');
      setSuccess('');

      const res = await fetch(`/api/admin/social-verifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} verification`);
      }

      setSuccess(`Verification ${action}ed successfully!`);
      setTimeout(() => setSuccess(''), 3000);

      // Refresh the list
      fetchVerifications();
    } catch (err: any) {
      console.error(`Error ${action}ing verification:`, err);
      setError(err.message || `Failed to ${action} verification`);
    } finally {
      setProcessing(null);
    }
  }

  function openSocialProfile(platform: string, username: string) {
    const urls: Record<string, string> = {
      instagram: `https://instagram.com/${username}`,
      twitter: `https://twitter.com/${username}`,
      tiktok: `https://tiktok.com/@${username}`,
      facebook: `https://facebook.com/${username}`,
      youtube: `https://youtube.com/@${username}`,
    };
    window.open(urls[platform] || '#', '_blank');
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.toUpperCase()}
      </span>
    );
  }

  function getPlatformIcon(platform: string) {
    const icons: Record<string, string> = {
      instagram: '📸',
      twitter: '𝕏',
      tiktok: '🎵',
      facebook: '👥',
      youtube: '▶️',
    };
    return icons[platform] || '🔗';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading verifications...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#552627]">Social Verifications</h1>
          <p className="text-gray-600 mt-1">Review and approve social media follow requests</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 mb-6 text-sm">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-[#552627] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({verifications.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({verifications.filter(v => v.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'verified'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Verified ({verifications.filter(v => v.status === 'verified').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'rejected'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Rejected ({verifications.filter(v => v.status === 'rejected').length})
          </button>
        </div>
      </div>

      {/* Verifications List */}
      <div className="space-y-4">
        {verifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-500 text-lg">No verifications found</div>
            <p className="text-gray-400 text-sm mt-2">
              {filter === 'pending' ? 'No pending verifications to review' : `No ${filter} verifications`}
            </p>
          </div>
        ) : (
          verifications.map((verification) => (
            <div
              key={verification.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Platform Icon */}
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {getPlatformIcon(verification.platform)}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {verification.metadata?.platform_name || verification.platform}
                      </h3>
                      {getStatusBadge(verification.status)}
                      <span className="text-sm text-gray-500">+{verification.reward_points} pts</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Username:</span>
                        <p className="font-medium text-gray-900">@{verification.username}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">User:</span>
                        <p className="font-medium text-gray-900">
                          {verification.user_name || verification.user_email || 'Unknown'}
                        </p>
                        {verification.user_email && (
                          <p className="text-xs text-gray-500">{verification.user_email}</p>
                        )}
                      </div>
                      <div>
                        <span className="text-gray-500">Submitted:</span>
                        <p className="font-medium text-gray-900">{formatDate(verification.submitted_at)}</p>
                      </div>
                    </div>

                    {verification.verified_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Verified: {formatDate(verification.verified_at)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => openSocialProfile(verification.platform, verification.username)}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    Check Profile
                  </button>

                  {verification.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(verification.id, 'approve')}
                        disabled={processing === verification.id}
                        className="flex-1 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {processing === verification.id ? '...' : '✓'}
                      </button>
                      <button
                        onClick={() => handleAction(verification.id, 'reject')}
                        disabled={processing === verification.id}
                        className="flex-1 px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {processing === verification.id ? '...' : '✕'}
                      </button>
                    </div>
                  )}

                  {verification.status === 'verified' && (
                    <div className="text-xs text-center text-green-600 font-medium px-3 py-2">
                      {verification.reward_claimed ? 'Points Awarded' : 'Points Pending'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
