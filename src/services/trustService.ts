import { supabase } from '../lib/supabase';
import { User } from '../types';

export interface TrustBreakdown {
  score: number;
  tier: 'New User' | 'Trusted' | 'Highly Trusted';
  tierColor: string;
  items: {
    label: string;
    points: number;
    maxPoints: number;
    completed: boolean;
  }[];
}

export const calculateTrustScore = (user: Partial<User>): TrustBreakdown => {
  let score = 10; // Baseline for registration

  const items = [
    {
      label: 'Account Registration Baseline',
      points: 10,
      maxPoints: 10,
      completed: true,
    },
    {
      label: 'Phone Number Verification',
      points: user.phoneVerified ? 15 : 0,
      maxPoints: 15,
      completed: !!user.phoneVerified,
    },
    {
      label: 'Email Verification',
      points: user.emailVerified ? 10 : 0,
      maxPoints: 10,
      completed: !!user.emailVerified,
    },
    {
      label: 'Emergency Contact On File',
      points: user.emergencyContact?.phone ? 5 : 0,
      maxPoints: 5,
      completed: !!user.emergencyContact?.phone,
    },
    {
      label: 'Completed P2P Exchanges',
      points: Math.min((user.completedExchanges || 0) * 10, 30),
      maxPoints: 30,
      completed: (user.completedExchanges || 0) > 0,
    },
    {
      label: 'Completed Community Aid / Rides',
      points: Math.min(((user.completedDonations || 0) + (user.completedRides || 0)) * 10, 30),
      maxPoints: 30,
      completed: ((user.completedDonations || 0) + (user.completedRides || 0)) > 0,
    },
    {
      label: 'Rating & Feedback Score',
      points: Math.min(Math.round((user.rating || 0) * 4), 20),
      maxPoints: 20,
      completed: (user.rating || 0) > 0,
    },
  ];

  if (user.reportsCount && user.reportsCount > 0) {
    items.push({
      label: 'Resolved Fraud / Community Reports',
      points: -user.reportsCount * 20,
      maxPoints: 0,
      completed: false,
    });
  }

  const rawSum = items.reduce((sum, item) => sum + item.points, 0);
  const finalScore = Math.max(5, Math.min(100, rawSum));

  let tier: 'New User' | 'Trusted' | 'Highly Trusted' = 'New User';
  let tierColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';

  if (finalScore >= 70) {
    tier = 'Highly Trusted';
    tierColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
  } else if (finalScore >= 30) {
    tier = 'Trusted';
    tierColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  }

  return {
    score: finalScore,
    tier,
    tierColor,
    items,
  };
};

export const trustService = {
  calculateTrustScore,

  async fetchUserTrust(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, reports_count:reports(count)')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },
};

export default trustService;
