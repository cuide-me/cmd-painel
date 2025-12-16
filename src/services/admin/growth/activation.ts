/**
 * Activation Service
 * Tracks user activation, onboarding milestones, and first-week engagement
 */

import { getFirebaseAdmin } from '@/lib/server/firebaseAdmin';
import { getFirestore } from 'firebase-admin/firestore';
import type {
  OnboardingMetrics,
  ActivationMilestone,
  ActivationHealth,
} from './types';

/**
 * Get activation metrics for new users in a period
 */
export async function getActivationMetrics(
  startDate: Date,
  endDate: Date
): Promise<OnboardingMetrics> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // Get new users in period
  const usersSnapshot = await db
    .collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const users = usersSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];
  
  const totalNewUsers = users.length;
  
  // Calculate milestones
  const milestones = calculateActivationMilestones(users);
  
  // Calculate activation rate (users who completed critical milestones)
  const activatedUsers = users.filter(user => 
    user.emailVerified &&
    user.profileComplete === 100 &&
    user.firstActionAt
  ).length;
  
  const activationRate = totalNewUsers > 0 ? (activatedUsers / totalNewUsers) * 100 : 0;
  
  // Calculate average time to activate
  const activatedUsersList = users.filter(user => 
    user.emailVerified && user.profileComplete === 100 && user.firstActionAt
  );
  
  const avgTimeToActivate = activatedUsersList.length > 0
    ? activatedUsersList.reduce((sum, user) => {
        const timeToActivate = new Date(user.firstActionAt).getTime() - new Date(user.createdAt).getTime();
        return sum + timeToActivate / 60000; // minutes
      }, 0) / activatedUsersList.length
    : 0;
  
  // Calculate dropoff points
  const dropoffPoints = [
    {
      step: 'Email Verification',
      dropoffCount: users.filter(u => !u.emailVerified).length,
      dropoffRate: totalNewUsers > 0 ? (users.filter(u => !u.emailVerified).length / totalNewUsers) * 100 : 0,
    },
    {
      step: 'Profile Completion',
      dropoffCount: users.filter(u => u.emailVerified && u.profileComplete < 100).length,
      dropoffRate: totalNewUsers > 0 ? (users.filter(u => u.emailVerified && u.profileComplete < 100).length / totalNewUsers) * 100 : 0,
    },
    {
      step: 'First Action',
      dropoffCount: users.filter(u => u.profileComplete === 100 && !u.firstActionAt).length,
      dropoffRate: totalNewUsers > 0 ? (users.filter(u => u.profileComplete === 100 && !u.firstActionAt).length / totalNewUsers) * 100 : 0,
    },
  ];
  
  // Calculate cohort-based activation
  const bySignupCohort = calculateCohortActivation(users);
  
  // Calculate first week engagement
  const firstWeekEngagement = await calculateFirstWeekEngagement(users);
  
  return {
    totalNewUsers,
    activatedUsers,
    activationRate,
    avgTimeToActivate,
    milestones,
    dropoffPoints,
    bySignupCohort,
    firstWeekEngagement,
  };
}

/**
 * Calculate activation health score and insights
 */
export async function getActivationHealth(
  startDate: Date,
  endDate: Date
): Promise<ActivationHealth> {
  getFirebaseAdmin();
  const db = getFirestore();
  
  // Get users from period
  const usersSnapshot = await db
    .collection('users')
    .where('createdAt', '>=', startDate)
    .where('createdAt', '<=', endDate)
    .get();
  
  const users = usersSnapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  })) as any[];
  
  // Calculate retention rates
  const d1Retention = calculateRetentionRate(users, 1);
  const d7Retention = calculateRetentionRate(users, 7);
  const d30Retention = calculateRetentionRate(users, 30);
  
  // Calculate engagement metrics
  const avgSessionsFirstWeek = calculateAvgSessions(users, 7);
  const avgActionsFirstWeek = calculateAvgActions(users, 7);
  
  // Calculate time to "aha moment" (first booking)
  const timeToAha = calculateTimeToAha(users);
  
  // Calculate overall health score
  const score = calculateActivationScore({
    d1Retention,
    d7Retention,
    d30Retention,
    avgSessionsFirstWeek,
    avgActionsFirstWeek,
    timeToAha,
  });
  
  // Determine status
  let status: ActivationHealth['status'];
  if (score >= 80) status = 'excellent';
  else if (score >= 60) status = 'good';
  else if (score >= 40) status = 'needs_improvement';
  else status = 'critical';
  
  // Identify issues and recommendations
  const issues = identifyActivationIssues({
    d1Retention,
    d7Retention,
    d30Retention,
    avgSessionsFirstWeek,
    avgActionsFirstWeek,
    timeToAha,
  });
  
  return {
    score,
    status,
    metrics: {
      d1Retention,
      d7Retention,
      d30Retention,
      avgSessionsFirstWeek,
      avgActionsFirstWeek,
      timeToAha,
    },
    issues,
  };
}

/**
 * Calculate activation milestones
 */
function calculateActivationMilestones(users: any[]): ActivationMilestone[] {
  const totalUsers = users.length;
  
  const milestones: ActivationMilestone[] = [
    {
      milestone: 'signup',
      label: 'Cadastro Iniciado',
      users: users.filter(u => u.email).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 5, // 5 minutes
    },
    {
      milestone: 'verify',
      label: 'Email Verificado',
      users: users.filter(u => u.emailVerified).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 30, // 30 minutes
    },
    {
      milestone: 'profile',
      label: 'Perfil Completo',
      users: users.filter(u => u.profileComplete === 100).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 60, // 1 hour
    },
    {
      milestone: 'first_search',
      label: 'Primeira Busca',
      users: users.filter(u => u.firstSearchAt).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 120, // 2 hours
    },
    {
      milestone: 'first_match',
      label: 'Primeiro Match',
      users: users.filter(u => u.firstMatchAt).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 1440, // 24 hours
    },
    {
      milestone: 'first_booking',
      label: 'Primeira Reserva',
      users: users.filter(u => u.firstBookingAt).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 2880, // 48 hours
    },
    {
      milestone: 'first_session',
      label: 'Primeira Sessão Completa',
      users: users.filter(u => u.firstSessionCompletedAt).length,
      percentage: 0,
      avgTimeFromSignup: 0,
      completionRate: 0,
      idealTimeframe: 10080, // 7 days
    },
  ];
  
  // Calculate percentages and avg time
  milestones.forEach(milestone => {
    milestone.percentage = totalUsers > 0 ? (milestone.users / totalUsers) * 100 : 0;
    
    const completedUsers = users.filter(u => {
      const field = getFieldForMilestone(milestone.milestone);
      return u[field];
    });
    
    if (completedUsers.length > 0) {
      const totalTime = completedUsers.reduce((sum, user) => {
        const field = getFieldForMilestone(milestone.milestone);
        const timeFromSignup = new Date(user[field]).getTime() - new Date(user.createdAt).getTime();
        return sum + timeFromSignup / 60000; // minutes
      }, 0);
      
      milestone.avgTimeFromSignup = totalTime / completedUsers.length;
      
      // Calculate completion rate (within ideal timeframe)
      const onTimeCompletions = completedUsers.filter(user => {
        const field = getFieldForMilestone(milestone.milestone);
        const timeFromSignup = (new Date(user[field]).getTime() - new Date(user.createdAt).getTime()) / 60000;
        return timeFromSignup <= milestone.idealTimeframe;
      }).length;
      
      milestone.completionRate = (onTimeCompletions / completedUsers.length) * 100;
    }
  });
  
  return milestones;
}

/**
 * Calculate cohort-based activation
 */
function calculateCohortActivation(users: any[]) {
  const cohortMap = new Map<string, any>();
  
  users.forEach(user => {
    const date = new Date(user.createdAt);
    const cohortKey = `Week ${getWeekNumber(date)} ${getMonthName(date)}`;
    
    if (!cohortMap.has(cohortKey)) {
      cohortMap.set(cohortKey, {
        cohort: cohortKey,
        signups: 0,
        activated: 0,
        totalTimeToActivate: 0,
      });
    }
    
    const data = cohortMap.get(cohortKey);
    data.signups++;
    
    if (user.emailVerified && user.profileComplete === 100 && user.firstActionAt) {
      data.activated++;
      const timeToActivate = new Date(user.firstActionAt).getTime() - new Date(user.createdAt).getTime();
      data.totalTimeToActivate += timeToActivate / 60000; // minutes
    }
  });
  
  return Array.from(cohortMap.values()).map(cohort => ({
    cohort: cohort.cohort,
    signups: cohort.signups,
    activated: cohort.activated,
    activationRate: cohort.signups > 0 ? (cohort.activated / cohort.signups) * 100 : 0,
    avgTimeToActivate: cohort.activated > 0 ? cohort.totalTimeToActivate / cohort.activated : 0,
  }));
}

/**
 * Calculate first week engagement
 */
async function calculateFirstWeekEngagement(users: any[]) {
  // Simulate engagement data (in production, query actual activity logs)
  const engagement = [];
  
  for (let day = 0; day < 7; day++) {
    const activeUsers = Math.round(users.length * (1 - day * 0.1)); // Simulate decay
    const actionsPerUser = Math.max(1, 10 - day);
    const retentionRate = users.length > 0 ? (activeUsers / users.length) * 100 : 0;
    
    engagement.push({
      day: day + 1,
      activeUsers,
      actionsPerUser,
      retentionRate,
    });
  }
  
  return engagement;
}

// Helper functions

function calculateRetentionRate(users: any[], days: number): number {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const eligibleUsers = users.filter(u => new Date(u.createdAt) <= cutoffDate);
  if (eligibleUsers.length === 0) return 0;
  
  // Simulate retention (in production, check actual activity)
  const activeUsers = eligibleUsers.filter(u => {
    // Check if user has activity within the retention window
    return u.lastActivityAt && new Date(u.lastActivityAt) >= cutoffDate;
  }).length;
  
  return (activeUsers / eligibleUsers.length) * 100;
}

function calculateAvgSessions(users: any[], days: number): number {
  // Simulate session data (in production, query actual session logs)
  return Math.random() * 10 + 5; // 5-15 sessions
}

function calculateAvgActions(users: any[], days: number): number {
  // Simulate action data (in production, query actual activity logs)
  return Math.random() * 20 + 10; // 10-30 actions
}

function calculateTimeToAha(users: any[]): number {
  const usersWithBooking = users.filter(u => u.firstBookingAt);
  if (usersWithBooking.length === 0) return 0;
  
  const totalTime = usersWithBooking.reduce((sum, user) => {
    const time = new Date(user.firstBookingAt).getTime() - new Date(user.createdAt).getTime();
    return sum + time / 60000; // minutes
  }, 0);
  
  return totalTime / usersWithBooking.length;
}

function calculateActivationScore(metrics: ActivationHealth['metrics']): number {
  let score = 0;
  
  // D1 retention (25 points)
  score += (metrics.d1Retention / 100) * 25;
  
  // D7 retention (25 points)
  score += (metrics.d7Retention / 100) * 25;
  
  // D30 retention (20 points)
  score += (metrics.d30Retention / 100) * 20;
  
  // First week sessions (15 points)
  score += Math.min(15, (metrics.avgSessionsFirstWeek / 10) * 15);
  
  // First week actions (10 points)
  score += Math.min(10, (metrics.avgActionsFirstWeek / 20) * 10);
  
  // Time to aha (5 points - lower is better)
  const idealAhaTime = 2880; // 48 hours
  if (metrics.timeToAha > 0) {
    score += Math.max(0, 5 * (1 - metrics.timeToAha / (idealAhaTime * 2)));
  }
  
  return Math.round(score);
}

function identifyActivationIssues(metrics: ActivationHealth['metrics']) {
  const issues: ActivationHealth['issues'] = [];
  
  if (metrics.d1Retention < 50) {
    issues.push({
      issue: 'Low Day 1 Retention',
      severity: 'high',
      recommendation: 'Improve first-time user experience and onboarding flow. Consider sending welcome email with clear next steps.',
    });
  }
  
  if (metrics.d7Retention < 30) {
    issues.push({
      issue: 'Low Day 7 Retention',
      severity: 'high',
      recommendation: 'Implement engagement campaigns (email, push) to bring users back. Add value reminders.',
    });
  }
  
  if (metrics.avgSessionsFirstWeek < 3) {
    issues.push({
      issue: 'Low First Week Engagement',
      severity: 'medium',
      recommendation: 'Add more engaging features in first week. Consider gamification or progress tracking.',
    });
  }
  
  if (metrics.timeToAha > 4320) { // > 3 days
    issues.push({
      issue: 'Slow Time to Aha Moment',
      severity: 'medium',
      recommendation: 'Reduce friction in booking flow. Consider offering quick wins or demo experiences.',
    });
  }
  
  return issues;
}

function getFieldForMilestone(milestone: string): string {
  const fieldMap: Record<string, string> = {
    signup: 'email',
    verify: 'emailVerified',
    profile: 'profileComplete',
    first_search: 'firstSearchAt',
    first_match: 'firstMatchAt',
    first_booking: 'firstBookingAt',
    first_session: 'firstSessionCompletedAt',
  };
  return fieldMap[milestone] || milestone;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getMonthName(date: Date): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[date.getMonth()];
}
