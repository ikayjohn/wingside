"use client";

import React from 'react';
import Link from 'next/link';

export default function EarnRewardsPage() {
  // Mock data - in real app this would come from API
  const rewardsData = {
    tasksCompleted: 2,
    totalTasks: 11,
    pointsAvailable: 1120,
    progressPercentage: 18,
  };

  const tasks = [
    {
      id: 1,
      title: 'Place Your First Order Today',
      description: 'Order any wings to start earning points',
      points: 15,
      icon: 'cart',
      iconColor: 'blue',
      completed: false,
    },
    {
      id: 2,
      title: 'Try a New Flavor',
      description: "Order a wing flavor you haven't tried before",
      points: 10,
      icon: 'flame',
      iconColor: 'blue',
      completed: false,
    },
    {
      id: 3,
      title: 'Share Your Wing Experience',
      description: 'Post about your order on social media',
      points: 10,
      icon: 'megaphone',
      iconColor: 'purple',
      completed: false,
    },
    {
      id: 4,
      title: 'Refer a Friend',
      description: 'Invite a friend to join Wing Club',
      points: 20,
      icon: 'users',
      iconColor: 'purple',
      completed: false,
    },
    {
      id: 5,
      title: 'Follow @wingsidens',
      description: 'Follow us on Instagram and Twitter',
      points: 100,
      icon: 'heart',
      iconColor: 'purple',
      completed: false,
    },
    {
      id: 6,
      title: 'Review Your Order',
      description: 'Give a review on your order',
      points: 100,
      icon: 'star',
      iconColor: 'yellow',
      completed: false,
    },
    {
      id: 7,
      title: 'Birthday Month',
      description: 'Let us celebrate with you',
      points: 100,
      icon: 'gift',
      iconColor: 'red',
      completed: false,
    },
  ];

  const getIcon = (iconName: string) => {
    const icons = {
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
    return icons[iconName as keyof typeof icons];
  };

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

        {/* Progress Section */}
        <div className="earn-rewards-progress-section">
          <div className="earn-rewards-progress-stats">
            <div className="earn-rewards-stat">
              <div className="earn-rewards-stat-value">{rewardsData.tasksCompleted}/{rewardsData.totalTasks}</div>
              <div className="earn-rewards-stat-label">Tasks Completed</div>
            </div>
            <div className="earn-rewards-stat">
              <div className="earn-rewards-stat-value earn-rewards-stat-yellow">{rewardsData.pointsAvailable} pts</div>
              <div className="earn-rewards-stat-label">Available</div>
            </div>
            <div className="earn-rewards-stat">
              <div className="earn-rewards-stat-value earn-rewards-stat-blue">{rewardsData.progressPercentage}%</div>
              <div className="earn-rewards-stat-label">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="earn-rewards-progress-bar">
            <div
              className="earn-rewards-progress-fill"
              style={{ width: `${rewardsData.progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="earn-rewards-tasks">
          {tasks.map((task) => (
            <div key={task.id} className="earn-rewards-task-card">
              <div className="earn-rewards-task-content">
                <div className={`earn-rewards-task-icon ${task.iconColor}`}>
                  {getIcon(task.icon)}
                </div>
                <div className="earn-rewards-task-info">
                  <h3 className="earn-rewards-task-title">{task.title}</h3>
                  <p className="earn-rewards-task-description">{task.description}</p>
                </div>
              </div>
              <div className="earn-rewards-task-points">+{task.points} pts</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
