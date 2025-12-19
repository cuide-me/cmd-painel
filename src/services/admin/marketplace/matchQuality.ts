/**
 * Marketplace Validation - Match Quality Analysis
 * Source: Firebase (jobs with match metadata)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { MatchQuality } from './types';

export async function getMatchQuality(): Promise<MatchQuality> {
  const db = getFirestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get matched jobs (jobs with specialistId)
  const matchedJobsSnapshot = await db
    .collection('jobs')
    .where('specialistId', '!=', null)
    .where('createdAt', '>=', thirtyDaysAgo)
    .get();

  let totalScore = 0;
  let perfectMatches = 0;
  let goodMatches = 0;
  let poorMatches = 0;
  let specialtyMatches = 0;
  let locationMatches = 0;
  let availabilityMatches = 0;
  const totalMatches = matchedJobsSnapshot.size;

  matchedJobsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    
    // Calculate match score based on metadata
    let matchScore = 100;
    
    // Check specialty match
    if (data.requestedSpecialty && data.professionalSpecialty) {
      if (data.requestedSpecialty === data.professionalSpecialty) {
        specialtyMatches++;
      } else {
        matchScore -= 30;
      }
    }
    
    // Check location proximity (simplified - assuming we have distance data)
    if (data.distanceKm !== undefined) {
      if (data.distanceKm <= 10) {
        locationMatches++;
      } else {
        matchScore -= Math.min(30, data.distanceKm * 2);
      }
    }
    
    // Check availability match (simplified - assuming we have schedule overlap)
    if (data.scheduleOverlap !== undefined && data.scheduleOverlap > 0.5) {
      availabilityMatches++;
    }
    
    totalScore += matchScore;
    
    if (matchScore === 100) perfectMatches++;
    else if (matchScore >= 80) goodMatches++;
    else poorMatches++;
  });

  const averageMatchScore = totalMatches > 0 ? totalScore / totalMatches : 0;
  const specialtyMatchPercent = totalMatches > 0 ? (specialtyMatches / totalMatches) * 100 : 0;
  const locationMatchPercent = totalMatches > 0 ? (locationMatches / totalMatches) * 100 : 0;
  const availabilityMatchPercent = totalMatches > 0 ? (availabilityMatches / totalMatches) * 100 : 0;

  return {
    averageMatchScore,
    perfectMatches,
    goodMatches,
    poorMatches,
    matchCriteria: {
      specialtyMatch: specialtyMatchPercent,
      locationMatch: locationMatchPercent,
      availabilityMatch: availabilityMatchPercent
    }
  };
}
