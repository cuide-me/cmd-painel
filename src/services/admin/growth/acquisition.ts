/**
 * Acquisition Service
 * Tracks user acquisition funnel, channels, and conversion metrics
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import type {
  AcquisitionMetrics,
  AcquisitionFunnel,
  AcquisitionChannel,
} from './types';

/**
 * Get acquisition metrics for a given period
 */
export async function getAcquisitionMetrics(
  startDate: Date,
  endDate: Date
): Promise<AcquisitionMetrics> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // Query users created in period
  const usersSnapshot = await db
    .collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const users = usersSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];
  
  // Calculate funnel stages
  const funnel = calculateAcquisitionFunnel(users);
  
  // Calculate channel breakdown
  const byChannel = calculateChannelMetrics(users);
  
  // Calculate time series
  const byPeriod = calculatePeriodMetrics(users, startDate, endDate);
  
  // Calculate top landing pages
  const topLandingPages = calculateTopLandingPages(users);
  
  // Calculate overall metrics
  const totalVisitors = funnel.stage1_visitors;
  const totalSignups = funnel.stage2_signups;
  const totalConversions = funnel.stage6_firstAction;
  const conversionRate = totalVisitors > 0 
    ? (totalConversions / totalVisitors) * 100 
    : 0;
  
  // Calculate average time to convert
  const convertedUsers = users.filter(u => u.firstActionAt);
  const avgTimeToConvert = convertedUsers.length > 0
    ? convertedUsers.reduce((sum, user) => {
        const timeToConvert = new Date(user.firstActionAt).getTime() - new Date(user.createdAt).getTime();
        return sum + timeToConvert / 60000; // Convert to minutes
      }, 0) / convertedUsers.length
    : 0;
  
  // Calculate bounce rate (users who never completed signup)
  const bounceRate = totalSignups > 0
    ? ((totalSignups - funnel.stage3_completed) / totalSignups) * 100
    : 0;
  
  return {
    totalVisitors,
    totalSignups,
    totalConversions,
    conversionRate,
    avgTimeToConvert,
    bounceRate,
    byChannel,
    byPeriod,
    funnel,
    topLandingPages,
  };
}

/**
 * Calculate acquisition funnel stages
 */
function calculateAcquisitionFunnel(users: any[]): AcquisitionFunnel {
  const stage1_visitors = users.length; // All users who started
  const stage2_signups = users.filter(u => u.email).length; // Provided email
  const stage3_completed = users.filter(u => u.profileComplete >= 50).length; // Basic info
  const stage4_verified = users.filter(u => u.emailVerified || u.phoneVerified).length;
  const stage5_profileComplete = users.filter(u => u.profileComplete === 100).length;
  const stage6_firstAction = users.filter(u => u.firstActionAt).length;
  
  // Calculate conversion rates
  const visitorToSignup = stage1_visitors > 0 ? (stage2_signups / stage1_visitors) * 100 : 0;
  const signupToComplete = stage2_signups > 0 ? (stage3_completed / stage2_signups) * 100 : 0;
  const completeToVerified = stage3_completed > 0 ? (stage4_verified / stage3_completed) * 100 : 0;
  const verifiedToProfile = stage4_verified > 0 ? (stage5_profileComplete / stage4_verified) * 100 : 0;
  const profileToAction = stage5_profileComplete > 0 ? (stage6_firstAction / stage5_profileComplete) * 100 : 0;
  const overallConversion = stage1_visitors > 0 ? (stage6_firstAction / stage1_visitors) * 100 : 0;
  
  // Calculate dropoffs
  const dropoffs = [
    {
      stage: 'Signup → Complete',
      count: stage2_signups - stage3_completed,
      percentage: stage2_signups > 0 ? ((stage2_signups - stage3_completed) / stage2_signups) * 100 : 0,
      mainReasons: ['Form too long', 'Unclear value proposition', 'Technical issues'],
    },
    {
      stage: 'Complete → Verified',
      count: stage3_completed - stage4_verified,
      percentage: stage3_completed > 0 ? ((stage3_completed - stage4_verified) / stage3_completed) * 100 : 0,
      mainReasons: ['Email not received', 'Verification link expired', 'User forgot'],
    },
    {
      stage: 'Verified → Profile Complete',
      count: stage4_verified - stage5_profileComplete,
      percentage: stage4_verified > 0 ? ((stage4_verified - stage5_profileComplete) / stage4_verified) * 100 : 0,
      mainReasons: ['Too many fields', 'Unclear requirements', 'Lost interest'],
    },
    {
      stage: 'Profile → First Action',
      count: stage5_profileComplete - stage6_firstAction,
      percentage: stage5_profileComplete > 0 ? ((stage5_profileComplete - stage6_firstAction) / stage5_profileComplete) * 100 : 0,
      mainReasons: ['No clear next step', 'Overwhelmed', 'Waiting for matches'],
    },
  ];
  
  return {
    stage1_visitors,
    stage2_signups,
    stage3_completed,
    stage4_verified,
    stage5_profileComplete,
    stage6_firstAction,
    visitorToSignup,
    signupToComplete,
    completeToVerified,
    verifiedToProfile,
    profileToAction,
    overallConversion,
    dropoffs,
  };
}

/**
 * Calculate metrics by acquisition channel
 */
function calculateChannelMetrics(users: any[]): AcquisitionChannel[] {
  const channelMap = new Map<string, any>();
  
  users.forEach(user => {
    const channel = user.acquisitionChannel || 'direct';
    
    if (!channelMap.has(channel)) {
      channelMap.set(channel, {
        channel,
        visitors: 0,
        signups: 0,
        conversions: 0,
      });
    }
    
    const data = channelMap.get(channel);
    data.visitors++;
    if (user.email) data.signups++;
    if (user.firstActionAt) data.conversions++;
  });
  
  const channels: AcquisitionChannel[] = Array.from(channelMap.entries()).map(([key, data]) => {
    const conversionRate = data.visitors > 0 ? (data.conversions / data.visitors) * 100 : 0;
    
    // Simulate cost and CAC (in production, get from marketing data)
    const cost = data.channel === 'paid' ? data.signups * 50 : 0;
    const cpa = data.conversions > 0 ? cost / data.conversions : 0;
    
    // Determine trend (in production, compare with previous period)
    const trend: 'up' | 'down' | 'stable' = data.conversions > 10 ? 'up' : data.conversions < 5 ? 'down' : 'stable';
    
    return {
      channel: data.channel,
      label: getChannelLabel(data.channel),
      visitors: data.visitors,
      signups: data.signups,
      conversions: data.conversions,
      conversionRate,
      cost: cost > 0 ? cost : undefined,
      cpa: cpa > 0 ? cpa : undefined,
      trend,
    };
  });
  
  // Sort by conversions descending
  return channels.sort((a, b) => b.conversions - a.conversions);
}

/**
 * Calculate metrics by time period
 */
function calculatePeriodMetrics(users: any[], startDate: Date, endDate: Date) {
  const periodMap = new Map<string, any>();
  
  users.forEach(user => {
    const date = new Date(user.createdAt);
    const periodKey = `${date.getFullYear()}-W${getWeekNumber(date)}`;
    
    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        period: periodKey,
        visitors: 0,
        signups: 0,
        conversions: 0,
      });
    }
    
    const data = periodMap.get(periodKey);
    data.visitors++;
    if (user.email) data.signups++;
    if (user.firstActionAt) data.conversions++;
  });
  
  return Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period));
}

/**
 * Calculate top landing pages
 */
function calculateTopLandingPages(users: any[]) {
  const pageMap = new Map<string, any>();
  
  users.forEach(user => {
    const page = user.landingPage || '/';
    
    if (!pageMap.has(page)) {
      pageMap.set(page, {
        url: page,
        visitors: 0,
        conversions: 0,
      });
    }
    
    const data = pageMap.get(page);
    data.visitors++;
    if (user.firstActionAt) data.conversions++;
  });
  
  const pages = Array.from(pageMap.values()).map(page => ({
    ...page,
    conversionRate: page.visitors > 0 ? (page.conversions / page.visitors) * 100 : 0,
  }));
  
  // Sort by visitors and take top 10
  return pages.sort((a, b) => b.visitors - a.visitors).slice(0, 10);
}

// Utility functions

function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    organic: 'Busca Orgânica',
    paid: 'Anúncios Pagos',
    social: 'Redes Sociais',
    referral: 'Indicação',
    direct: 'Direto',
    email: 'Email Marketing',
    other: 'Outros',
  };
  return labels[channel] || channel;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
