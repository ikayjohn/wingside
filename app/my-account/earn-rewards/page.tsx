"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SocialVerifyModal from '@/components/SocialVerifyModal';

interface ClaimedReward {
  id: string;
  reward_type: string;
  created_at: string;
}

interface Reward {
  id: string;
  reward_type: string;
  points: number;
  amount_spent: number;
  description: string;
  created_at: string;
}

interface RewardsData {
  points: number;
  purchasePoints: number;
  totalSpent: number;
  rewards: Reward[];
  claimedRewards: ClaimedReward[];
}

export default function EarnRewardsPage() {
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [socialVerifyModal, setSocialVerifyModal] = useState<{
    open: boolean;
    platform: 'instagram' | 'twitter';
    platformName: string;
    platformUrl: string;
    points: number;
  }>({
    open: false,
    platform: 'instagram',
    platformName: '',
    platformUrl: '',
    points: 0
  });

  // Fetch rewards data
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rewards');

        if (!response.ok) {
          throw new Error('Failed to fetch rewards');
        }

        const data = await response.json();
        setRewardsData(data);
      } catch (err: any) {
        console.error('Error fetching rewards:', err);
        setError(err.message || 'Failed to load rewards');
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, []);

  const claimReward = async (rewardType: string, points: number) => {
    try {
      setClaiming(rewardType);
      setSuccessMessage('');
      setError('');

      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rewardType,
          points,
          description: getRewardDescription(rewardType)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.alreadyClaimed) {
          setError('You have already claimed this reward');
        } else {
          throw new Error(data.error || 'Failed to claim reward');
        }
        return;
      }

      setSuccessMessage(data.message || `You've earned ${points} points!`);

      // Refresh rewards data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      console.error('Error claiming reward:', err);
      setError(err.message || 'Failed to claim reward');
    } finally {
      setClaiming(null);
    }
  };

  const getRewardDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      first_order: 'First order bonus',
      instagram_follow: 'Following @mywingside on Instagram',
      twitter_follow: 'Following @mywingside on Twitter',
      review: 'Order review',
      birthday: 'Birthday bonus'
    };
    return descriptions[type] || 'Reward claimed';
  };

  const isClaimed = (rewardType: string) => {
    return rewardsData?.claimedRewards?.some(r => r.reward_type === rewardType);
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      cart: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
      ),
      flame: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path>
        </svg>
      ),
      megaphone: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 11 18-5v12L3 14v-3z"></path>
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
        </svg>
      ),
      users: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
      ),
      heart: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
      instagram: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      ),
      star: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      ),
      gift: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
        </svg>
      ),
    };
    return icons[iconName];
  };

  const tasks = [
    {
      id: 'first_order',
      title: 'Place Your First Order',
      description: 'Order any wings to start earning points',
      points: 15,
      icon: 'cart',
      iconColor: 'blue',
      type: 'one-time'
    },
    {
      id: 'referral',
      title: 'Refer a Friend',
      description: 'Invite a friend to join Wing Club',
      points: 20,
      icon: 'users',
      iconColor: 'purple',
      type: 'link',
      link: '/my-account/referrals'
    },
    {
      id: 'instagram_follow',
      title: 'Follow @mywingside on Instagram',
      description: 'Follow us on Instagram for exclusive updates',
      points: 100,
      icon: 'instagram',
      iconColor: 'pink',
      type: 'social-verify',
      platform: 'instagram' as const,
      platformName: 'Instagram',
      platformUrl: 'https://instagram.com/mywingside'
    },
    {
      id: 'purchase',
      title: 'Every ₦100 Spent',
      description: 'Earn 10 points for every ₦100 spent on orders',
      points: rewardsData?.purchasePoints || 0,
      icon: 'flame',
      iconColor: 'orange',
      type: 'passive',
      earned: rewardsData?.purchasePoints || 0
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
              <p className="text-gray-600">Loading rewards...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <Link href="/my-account/dashboard" className="earn-rewards-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="earn-rewards-header">
          <h1 className="earn-rewards-title">Earn Rewards</h1>
          <p className="earn-rewards-subtitle">Complete tasks to earn Wing Club points</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Progress Section */}
        <div className="earn-rewards-progress-section">
          <div className="earn-rewards-progress-stats">
            <div className="earn-rewards-stat">
              <div className="earn-rewards-stat-value">{rewardsData?.claimedRewards?.length || 0}</div>
              <div className="earn-rewards-stat-label">Rewards Claimed</div>
            </div>
            <div className="earn-rewards-stat">
              <div className="earn-rewards-stat-value earn-rewards-stat-yellow">{rewardsData?.points || 0} pts</div>
              <div className="earn-rewards-stat-label">Total Points</div>
            </div>
            <div className="earn-rewards-stat">
              <div className="earn-rewards-stat-value earn-rewards-stat-blue">₦{(rewardsData?.totalSpent || 0).toLocaleString()}</div>
              <div className="earn-rewards-stat-label">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="earn-rewards-tasks">
          {tasks.map((task) => {
            const claimed = task.type === 'one-time' && isClaimed(task.id);

            return (
              <div key={task.id} className={`earn-rewards-task-card ${claimed ? 'opacity-60' : ''}`}>
                <div className="earn-rewards-task-content">
                  <div className={`earn-rewards-task-icon ${task.iconColor}`}>
                    {getIcon(task.icon)}
                  </div>
                  <div className="earn-rewards-task-info">
                    <h3 className="earn-rewards-task-title">
                      {task.title}
                      {claimed && <span className="ml-2 text-xs text-green-600 font-medium">✓ Claimed</span>}
                    </h3>
                    <p className="earn-rewards-task-description">{task.description}</p>
                  </div>
                </div>
                <div className="earn-rewards-task-action">
                  {task.type === 'link' ? (
                    <Link href={task.link!} className="btn-primary text-sm py-2 px-4">
                      Refer Friends
                    </Link>
                  ) : task.type === 'passive' ? (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">+{task.points}</div>
                      <div className="text-xs text-gray-500">points earned</div>
                    </div>
                  ) : task.type === 'social-verify' ? (
                    <button
                      onClick={() => setSocialVerifyModal({
                        open: true,
                        platform: task.platform,
                        platformName: task.platformName,
                        platformUrl: task.platformUrl,
                        points: task.points
                      })}
                      className="bg-[#F7C400] text-gray-900 py-2 px-4 rounded-full font-medium text-sm hover:bg-[#e5b500] transition-colors"
                    >
                      Verify & Claim
                    </button>
                  ) : claimed ? (
                    <span className="text-gray-500 text-sm py-2 px-4">Claimed</span>
                  ) : (
                    <button
                      onClick={() => claimReward(task.id, task.points)}
                      disabled={claiming === task.id}
                      className="bg-[#F7C400] text-gray-900 py-2 px-4 rounded-full font-medium text-sm hover:bg-[#e5b500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {claiming === task.id ? 'Claiming...' : `Claim +${task.points} pts`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Points Breakdown */}
        {rewardsData && rewardsData.rewards.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {rewardsData.rewards.slice(0, 5).map((reward) => (
                <div key={reward.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reward.description || reward.reward_type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(reward.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold">+{reward.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Verification Modal */}
        <SocialVerifyModal
          isOpen={socialVerifyModal.open}
          onClose={() => setSocialVerifyModal({ ...socialVerifyModal, open: false })}
          platform={socialVerifyModal.platform}
          platformName={socialVerifyModal.platformName}
          platformUrl={socialVerifyModal.platformUrl}
          points={socialVerifyModal.points}
          onSuccess={() => {
            setSuccessMessage('Verification submitted! We will review it shortly.');
            setTimeout(() => setSuccessMessage(''), 3000);
          }}
        />

      </div>
    </div>
  );
}
