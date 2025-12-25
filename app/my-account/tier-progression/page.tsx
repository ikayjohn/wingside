"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface UserProfile {
  totalPoints: number;
  currentTier: string;
  tierProgress: {
    current: number;
    start: number;
    target: number;
    nextTier: string;
    percentage: number;
    pointsToNext: number;
  };
}

export default function TierProgressionPage() {
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/profile');

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserData(data.profile);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load tier data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Tier definitions
  const tiers = [
    {
      id: 1,
      name: 'Wing Member',
      pointsRange: '0 - 1000',
      description: 'Start your wing journey with exclusive member benefits',
      color: 'gray',
      isUnlocked: true,
    },
    {
      id: 2,
      name: 'Wing Leader',
      pointsRange: '1001 - 2000',
      description: 'Lead the flock with enhanced rewards and priority access',
      color: 'yellow',
      isUnlocked: (userData?.totalPoints || 0) > 1000,
    },
    {
      id: 3,
      name: 'Wingzard',
      pointsRange: '2000+',
      description: 'Master of wings with ultimate VIP treatment and exclusive perks',
      color: 'orange',
      isUnlocked: (userData?.totalPoints || 0) >= 2000,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading tier progression...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">{error || 'Failed to load tier data'}</div>
          </div>
        </div>
      </div>
    );
  }

  const isMaxTier = userData.currentTier === 'Wingzard';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 py-8 md:px-6 lg:px-8">

        {/* Back to Dashboard */}
        <Link href="/my-account/dashboard" className="tier-back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="tier-header">
          <h1 className="tier-title">Tier Progression</h1>
          <p className="tier-subtitle">Your journey to elite mastery and exclusive rewards</p>
        </div>

        {/* Current Status Card */}
        <div className="tier-current-status">
          <div className="tier-current-header">
            <div>
              <p className="tier-current-label">Current Status</p>
              <h2 className="tier-current-name">{userData.currentTier}</h2>
              <p className="tier-current-description">
                {userData.currentTier === 'Wing Member' && 'Start your wing journey with exclusive member benefits'}
                {userData.currentTier === 'Wing Leader' && 'Lead the flock with enhanced rewards and priority access'}
                {userData.currentTier === 'Wingzard' && 'Master of wings with ultimate VIP treatment and exclusive perks'}
              </p>
            </div>
            <div className="tier-current-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                <path d="M4 22h16"></path>
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
              </svg>
            </div>
          </div>

          {/* Stats Row */}
          <div className="tier-stats-row">
            <div className="tier-stat-item">
              <p className="tier-stat-label">
                {isMaxTier ? 'Total Points' : 'Points Needed'}
              </p>
              <p className="tier-stat-value">
                {isMaxTier ? userData.totalPoints : userData.tierProgress.pointsToNext}
              </p>
            </div>
            <div className="tier-stat-item">
              <p className="tier-stat-label">Current Points</p>
              <p className="tier-stat-value">{userData.totalPoints}</p>
            </div>
            <div className="tier-stat-item">
              <p className="tier-stat-label">Next Tier</p>
              <div className="tier-next-tier">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m2 4 3 12h14l3-12-6 7-4-4-4 4-6-7z"></path>
                  <path d="M3 16h18"></path>
                </svg>
                <span>{isMaxTier ? 'Max Tier' : userData.tierProgress.nextTier}</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {!isMaxTier && (
            <div className="tier-progress-section">
              <div className="tier-progress-header">
                <span>Progress to {userData.tierProgress.nextTier}</span>
                <span>{userData.tierProgress.percentage}%</span>
              </div>
              <div className="tier-progress-bar">
                <div
                  className="tier-progress-fill"
                  style={{ width: `${userData.tierProgress.percentage}%` }}
                ></div>
              </div>
              <p className="tier-progress-text">
                {userData.tierProgress.pointsToNext} more points to unlock {userData.tierProgress.nextTier.toLowerCase()}
              </p>
            </div>
          )}

          {isMaxTier && (
            <div className="tier-progress-section">
              <div className="tier-progress-header">
                <span className="text-green-600 font-medium">Maximum Tier Achieved!</span>
                <span>100%</span>
              </div>
              <div className="tier-progress-bar">
                <div className="tier-progress-fill" style={{ width: '100%' }}></div>
              </div>
              <p className="tier-progress-text">
                Congratulations! You are a Wingzard with {userData.totalPoints} points
              </p>
            </div>
          )}
        </div>

        {/* Ways to Earn Points */}
        <div className="tier-earn-section">
          <h3 className="tier-section-title">Ways to Earn Points</h3>
          <div className="tier-earn-grid">
            <div className="tier-earn-card">
              <div>
                <h4 className="tier-earn-title">Purchase Wings</h4>
                <p className="tier-earn-description">Earn 10 points per ₦200</p>
              </div>
              <Link href="/order" className="tier-earn-btn yellow">
                Order wings now
              </Link>
            </div>

            <div className="tier-earn-card">
              <div>
                <h4 className="tier-earn-title">Refer Friends</h4>
                <p className="tier-earn-description">Get 100 pts for every Wing Club...</p>
              </div>
              <button className="tier-earn-btn purple">
                Get my Wingzard Points
              </button>
            </div>

            <div className="tier-earn-card">
              <div>
                <h4 className="tier-earn-title">Birthday Bonus</h4>
                <p className="tier-earn-description">Special birthday reward</p>
              </div>
              <button className="tier-earn-btn gray">
                +50 pts
              </button>
            </div>
          </div>
        </div>

        {/* All Membership Tiers */}
        <div className="tier-all-section">
          <h3 className="tier-section-title">All Membership Tiers</h3>
          <div className="tier-cards-grid">
            {tiers.map((tier) => {
              const isCurrent = tier.name === userData.currentTier;
              return (
                <div key={tier.id} className={`tier-card ${tier.color} ${isCurrent ? 'current' : ''}`}>
                  <div className="tier-card-header">
                    <div className="tier-card-icon">
                      {tier.name === 'Wing Member' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                          <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                      )}
                      {tier.name === 'Wing Leader' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                          <path d="M4 22h16"></path>
                          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                        </svg>
                      )}
                      {tier.name === 'Wingzard' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m2 4 3 12h14l3-12-6 7-4-4-4 4-6-7z"></path>
                          <path d="M3 16h18"></path>
                        </svg>
                      )}
                      <span className="tier-card-name">{tier.name}</span>
                    </div>
                    {isCurrent && (
                      <span className="tier-card-badge">Current Tier</span>
                    )}
                    {!tier.isUnlocked && (
                      <div className="tier-card-lock">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="tier-card-body">
                    <div className="tier-card-points">
                      <p className="tier-card-points-label">Points Required</p>
                      <p className="tier-card-points-value">{tier.pointsRange}</p>
                    </div>
                    <p className="tier-card-description">{tier.description}</p>
                  </div>

                  {tier.isUnlocked && (
                    <div className="tier-card-check">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
