/**
 * Lead Scoring System
 * Automatically calculates lead scores based on various factors
 */

export interface LeadScoringFactors {
  // Lead source
  source: string;

  // Qualification details
  budget?: string;
  timeline?: string;
  interest_level?: string;

  // Estimated value
  estimated_value?: number;

  // Engagement metrics
  activities_count?: number;
  last_contacted_at?: string;
  converted?: boolean;
}

/**
 * Calculate lead score based on multiple factors
 * Score ranges from 0-100
 */
export function calculateLeadScore(factors: LeadScoringFactors): number {
  let score = 0;

  // 1. Source scoring (0-20 points)
  const sourceScores: Record<string, number> = {
    referral: 20,      // Referrals are highest quality
    partner: 15,       // Partner leads
    event: 12,         // Event leads (already engaged)
    social: 10,        // Social media leads
    website: 8,        // Website leads
    other: 5           // Other sources
  };
  score += sourceScores[factors.source] || 5;

  // 2. Budget scoring (0-20 points)
  const budgetScores: Record<string, number> = {
    high: 20,
    medium: 12,
    low: 5,
    not_specified: 0
  };
  score += budgetScores[factors.budget || 'not_specified'];

  // 3. Timeline scoring (0-20 points)
  const timelineScores: Record<string, number> = {
    immediate: 20,
    '1-3_months': 15,
    '3-6_months': 10,
    '6-12_months': 5,
    not_sure: 2
  };
  score += timelineScores[factors.timeline || 'not_sure'];

  // 4. Interest level scoring (0-20 points)
  const interestScores: Record<string, number> = {
    high: 20,
    medium: 10,
    low: 3
  };
  score += interestScores[factors.interest_level || 'low'];

  // 5. Estimated value scoring (0-10 points)
  if (factors.estimated_value) {
    if (factors.estimated_value >= 100000) {
      score += 10;
    } else if (factors.estimated_value >= 50000) {
      score += 7;
    } else if (factors.estimated_value >= 20000) {
      score += 5;
    } else if (factors.estimated_value >= 5000) {
      score += 3;
    } else {
      score += 1;
    }
  }

  // 6. Engagement scoring (0-10 points)
  if (factors.activities_count) {
    const activityScore = Math.min(10, factors.activities_count * 2);
    score += activityScore;
  }

  // Recent contact bonus (0-5 points)
  if (factors.last_contacted_at) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(factors.last_contacted_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact <= 7) {
      score += 5;
    } else if (daysSinceContact <= 30) {
      score += 3;
    }
  }

  // Penalty if converted (should be handled by status, but just in case)
  if (factors.converted) {
    score = 0;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Get lead quality label based on score
 */
export function getLeadQuality(score: number): string {
  if (score >= 80) return 'Hot Lead';
  if (score >= 60) return 'Warm Lead';
  if (score >= 40) return 'Cold Lead';
  return 'Unqualified';
}

/**
 * Get lead quality color for UI
 */
export function getLeadQualityColor(score: number): string {
  if (score >= 80) return 'bg-red-100 text-red-800';
  if (score >= 60) return 'bg-orange-100 text-orange-800';
  if (score >= 40) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
}

/**
 * Auto-score a lead object
 */
export async function autoScoreLead(lead: any): Promise<number> {
  // Get activities count
  const activities_count = lead.activities?.length || 0;

  const factors: LeadScoringFactors = {
    source: lead.source,
    budget: lead.budget,
    timeline: lead.timeline,
    interest_level: lead.interest_level,
    estimated_value: lead.estimated_value,
    activities_count,
    last_contacted_at: lead.last_contacted_at,
    converted: lead.status === 'converted'
  };

  return calculateLeadScore(factors);
}

/**
 * Suggest follow-up actions based on lead score and status
 */
export function suggestFollowUpActions(lead: any): string[] {
  const actions: string[] = [];
  const score = lead.score || 0;

  if (score >= 80) {
    actions.push('Priority follow-up: Call within 24 hours');
    actions.push('Schedule demo or meeting');
    actions.push('Send pricing proposal');
  } else if (score >= 60) {
    actions.push('Send personalized email');
    actions.push('Connect on social media');
    actions.push('Schedule follow-up call');
  } else if (score >= 40) {
    actions.push('Add to nurture campaign');
    actions.push('Send educational content');
    actions.push('Monitor engagement');
  } else {
    actions.push('Research lead background');
    actions.push('Determine if good fit');
    actions.push('Consider disqualification');
  }

  // Timeline-based actions
  if (lead.timeline === 'immediate') {
    actions.push('Urgent: Fast-track to proposal');
  }

  // High value actions
  if (lead.estimated_value >= 100000) {
    actions.push('Executive outreach recommended');
    actions.push('Custom proposal preparation');
  }

  return actions;
}
