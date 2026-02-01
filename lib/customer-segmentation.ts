/**
 * Customer Segmentation System
 * Automatically categorizes customers based on behavior, value, and patterns
 */

export interface Customer {
  total_spent?: number;
  total_orders?: number;
  created_at: string;
  last_order_date?: string | null;
  avg_days_between_orders?: number;
  referral_count?: number;
  social_verifications?: number;
  avg_order_value?: number;
}

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  criteria: (customer: Customer) => boolean;
}

export const CUSTOMER_SEGMENTS: CustomerSegment[] = [
  {
    id: 'vip',
    name: 'VIP Customer',
    description: 'High-value customers with significant spending',
    color: 'purple',
    icon: '👑',
    criteria: (c) => (c.total_spent || 0) >= 100000
  },
  {
    id: 'regular',
    name: 'Regular Customer',
    description: 'Frequent customers who order consistently',
    color: 'blue',
    icon: '⭐',
    criteria: (c) => (c.total_orders || 0) >= 10 && (c.total_spent || 0) < 100000
  },
  {
    id: 'new',
    name: 'New Customer',
    description: 'Recently joined customers',
    color: 'green',
    icon: '🆕',
    criteria: (c) => {
      const daysSinceJoined = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceJoined <= 30;
    }
  },
  {
    id: 'at-risk',
    name: 'At Risk',
    description: 'Customers who haven\'t ordered in 60+ days',
    color: 'orange',
    icon: '⚠️',
    criteria: (c) => {
      if (!c.last_order_date) return false;
      const daysSinceLastOrder = Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastOrder >= 60 && daysSinceLastOrder < 90;
    }
  },
  {
    id: 'churned',
    name: 'Churned',
    description: 'Inactive customers (90+ days since last order)',
    color: 'red',
    icon: '❌',
    criteria: (c) => {
      if (!c.last_order_date) return false;
      const daysSinceLastOrder = Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastOrder >= 90;
    }
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Business customers with high order volume',
    color: 'indigo',
    icon: '🏢',
    criteria: (c) => (c.total_orders || 0) >= 20 && (c.avg_order_value || 0) >= 15000
  },
  {
    id: 'weekend-warrior',
    name: 'Weekend Warrior',
    description: 'Prefers ordering on weekends',
    color: 'yellow',
    icon: '🎉',
    criteria: (c) => c.weekend_order_ratio >= 0.6
  },
  {
    id: 'big-spender',
    name: 'Big Spender',
    description: 'High average order value',
    color: 'emerald',
    icon: '💰',
    criteria: (c) => (c.avg_order_value || 0) >= 10000
  },
  {
    id: 'one-time',
    name: 'One-Time Customer',
    description: 'Only ordered once',
    color: 'gray',
    icon: '🔸',
    criteria: (c) => (c.total_orders || 0) === 1
  }
];

/**
 * Calculate customer segments based on customer data
 */
export function calculateCustomerSegments(customer: Customer): string[] {
  const segments: string[] = [];

  for (const segment of CUSTOMER_SEGMENTS) {
    if (segment.criteria(customer)) {
      segments.push(segment.id);
    }
  }

  // Default segment if no matches
  if (segments.length === 0) {
    segments.push('emerging');
  }

  return segments;
}

/**
 * Get segment info by ID
 */
export function getSegmentInfo(segmentId: string): CustomerSegment | undefined {
  return CUSTOMER_SEGMENTS.find(s => s.id === segmentId);
}

/**
 * Get all matching segment objects
 */
export function getCustomerSegments(customer: Customer): CustomerSegment[] {
  const segmentIds = calculateCustomerSegments(customer);
  return CUSTOMER_SEGMENTS.filter(s => segmentIds.includes(s.id));
}

/**
 * Calculate customer health score (0-100)
 */
export function calculateCustomerHealth(customer: Customer): number {
  let score = 50; // Base score

  // Total orders (up to 20 points)
  score += Math.min(20, (customer.total_orders || 0) * 2);

  // Total spent (up to 20 points)
  const spent = customer.total_spent || 0;
  if (spent >= 100000) score += 20;
  else if (spent >= 50000) score += 15;
  else if (spent >= 20000) score += 10;
  else if (spent >= 5000) score += 5;

  // Recent activity (up to 20 points)
  if (customer.last_order_date) {
    const daysSinceLastOrder = Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastOrder <= 7) score += 20;
    else if (daysSinceLastOrder <= 30) score += 15;
    else if (daysSinceLastOrder <= 60) score += 10;
    else if (daysSinceLastOrder <= 90) score += 5;
  }

  // Order frequency consistency (up to 20 points)
  if (customer.avg_days_between_orders) {
    if (customer.avg_days_between_orders <= 14) score += 20;
    else if (customer.avg_days_between_orders <= 30) score += 15;
    else if (customer.avg_days_between_orders <= 60) score += 10;
  }

  // Referral activity (up to 10 points)
  if (customer.referral_count > 0) {
    score += Math.min(10, customer.referral_count * 2);
  }

  // Social verifications (up to 10 points)
  if (customer.social_verifications > 0) {
    score += Math.min(10, customer.social_verifications * 2);
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Get health label and color
 */
export function getHealthInfo(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
  if (score >= 40) return { label: 'Fair', color: 'text-yellow-600 bg-yellow-100' };
  return { label: 'Poor', color: 'text-red-600 bg-red-100' };
}

/**
 * Predict next order date (simple heuristic)
 */
export function predictNextOrder(customer: Customer): Date | null {
  if (!customer.last_order_date || !customer.avg_days_between_orders) return null;

  const lastOrder = new Date(customer.last_order_date);
  const avgDays = customer.avg_days_between_orders;

  // Add average days between orders to last order date
  const predictedDate = new Date(lastOrder.getTime() + (avgDays * 24 * 60 * 60 * 1000));

  return predictedDate;
}

/**
 * Calculate churn risk (0-100)
 */
export function calculateChurnRisk(customer: Customer): number {
  let risk = 0;

  if (!customer.last_order_date) return 50;

  const daysSinceLastOrder = Math.floor((Date.now() - new Date(customer.last_order_date).getTime()) / (1000 * 60 * 60 * 24));

  // Days since last order (up to 40 points)
  if (daysSinceLastOrder >= 90) risk += 40;
  else if (daysSinceLastOrder >= 60) risk += 30;
  else if (daysSinceLastOrder >= 30) risk += 20;
  else if (daysSinceLastOrder >= 14) risk += 10;

  // Decreasing order frequency (up to 30 points)
  if (customer.avg_days_between_orders && customer.last_days_between_orders) {
    if (customer.last_days_between_orders > customer.avg_days_between_orders * 1.5) {
      risk += 30;
    }
  }

  // Decreasing order value (up to 20 points)
  if (customer.avg_order_value && customer.last_order_value) {
    if (customer.last_order_value < customer.avg_order_value * 0.5) {
      risk += 20;
    }
  }

  // Low engagement (up to 10 points)
  if (!customer.social_verifications || customer.social_verifications === 0) {
    risk += 5;
  }

  if (!customer.referral_count || customer.referral_count === 0) {
    risk += 5;
  }

  return Math.min(100, Math.max(0, risk));
}

/**
 * Get churn risk label
 */
export function getChurnRiskLabel(risk: number): { label: string; color: string } {
  if (risk >= 70) return { label: 'High Risk', color: 'text-red-600 bg-red-100' };
  if (risk >= 40) return { label: 'Medium Risk', color: 'text-yellow-600 bg-yellow-100' };
  return { label: 'Low Risk', color: 'text-green-600 bg-green-100' };
}
