/**
 * Marketplace Validation - Specialty Balance
 * Source: Firebase (jobs + users with specialty data)
 */

import { getFirestore } from '@/lib/server/firebaseAdmin';
import type { SpecialtyBalance } from './types';

export async function getSpecialtyBalance(): Promise<SpecialtyBalance> {
  const db = getFirestore();

  // Get open requests grouped by specialty
  const requestsSnapshot = await db
    .collection('jobs')
    .where('status', 'in', ['pendente', 'em_andamento'])
    .get();

  const requestsBySpecialty = new Map<string, number>();

  requestsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const specialty = data.especialidade || data.specialty || 'Não especificado';
    
    requestsBySpecialty.set(specialty, (requestsBySpecialty.get(specialty) || 0) + 1);
  });

  // Get professionals grouped by specialty
  const professionalsSnapshot = await db
    .collection('users')
    .where('perfil', '==', 'profissional')
    .where('ativo', '==', true)
    .get();

  const professionalsBySpecialty = new Map<string, number>();

  professionalsSnapshot.forEach((doc: any) => {
    const data = doc.data();
    const specialty = data.especialidade || data.specialty || 'Não especificado';
    
    professionalsBySpecialty.set(specialty, (professionalsBySpecialty.get(specialty) || 0) + 1);
  });

  // Combine data
  const specialtySet = new Set([
    ...Array.from(requestsBySpecialty.keys()),
    ...Array.from(professionalsBySpecialty.keys())
  ]);

  const specialties = Array.from(specialtySet).map(name => {
    const openRequests = requestsBySpecialty.get(name) || 0;
    const professionals = professionalsBySpecialty.get(name) || 0;
    const ratio = openRequests > 0 ? professionals / openRequests : 999;

    let status: 'oversupply' | 'balanced' | 'undersupply';
    if (ratio > 1.5) status = 'oversupply';
    else if (ratio >= 0.8) status = 'balanced';
    else status = 'undersupply';

    return {
      name,
      openRequests,
      professionals,
      ratio,
      status
    };
  });

  // Sort by requests desc
  specialties.sort((a, b) => b.openRequests - a.openRequests);

  // Find most demanded and least supplied
  const mostDemanded = specialties[0]?.name || 'N/A';
  const leastSupplied = specialties
    .sort((a, b) => a.ratio - b.ratio)[0]?.name || 'N/A';

  return {
    specialties,
    mostDemanded,
    leastSupplied
  };
}
