/**
 * Marketplace Validation - Geographic Coverage
 * Source: Firebase (jobs + users with location data)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { GeographicCoverage } from './types';

export async function getGeographicCoverage(): Promise<GeographicCoverage> {
  const db = getFirestore();

  // Get all open requests with location
  const requestsSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['pendente', 'em_andamento'])
    .get();

  // Group requests by city
  const requestsByCity = new Map<string, { state: string; count: number; professionals: Set<string> }>();

  requestsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const city = data.clientCity || data.cidade || 'Não informado';
    const state = data.clientState || data.estado || 'XX';

    if (!requestsByCity.has(city)) {
      requestsByCity.set(city, { state, count: 0, professionals: new Set() });
    }
    
    const cityData = requestsByCity.get(city)!;
    cityData.count++;
  });

  // Get professionals by city
  const professionalsSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .get();

  professionalsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const city = data.cidade || data.city || 'Não informado';
    
    if (requestsByCity.has(city)) {
      requestsByCity.get(city)!.professionals.add(doc.id);
    }
  });

  // Calculate coverage metrics
  const requestsByCityArray = Array.from(requestsByCity.entries()).map(([city, data]) => ({
    city,
    state: data.state,
    requests: data.count,
    professionals: data.professionals.size,
    ratio: data.count > 0 ? data.professionals.size / data.count : 0
  }));

  // Sort by requests desc and get top 5
  const requestsByCityTop5 = requestsByCityArray
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 5);

  // Count uncovered requests (cities with 0 professionals)
  const uncoveredRequests = requestsByCityArray
    .filter(city => city.professionals === 0)
    .reduce((sum, city) => sum + city.requests, 0);

  return {
    coveredCities: requestsByCity.size,
    totalRequests: requestsSnapshot.size,
    requestsByCityTop5,
    uncoveredRequests
  };
}
