/**
 * ═══════════════════════════════════════════════════════
 * DASHBOARD REGIONS SERVICE
 * ═══════════════════════════════════════════════════════
 * Calcula top regiões por demanda
 */

import { type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import { getTimestampDaysAgo } from '@/lib/admin/dateHelpers';

export interface RegionStats {
  key: string;          // "São Paulo/SP"
  cidade: string;
  estado: string;
  label: string;
  jobs: number;
  familias: number;
  profissionais: number;
}

/**
 * Calcula top regiões por número de jobs
 */
export async function getTopRegions(limit: number = 5, windowDays: number = 30): Promise<RegionStats[]> {
  console.log('[Dashboard] Calculando top regiões, limit:', limit);
  
  const db = getFirestore();
  
  try {
    // Buscar jobs do período
    const windowStart = getTimestampDaysAgo(windowDays);
    const jobsSnapshot = await db
      .collection('jobs')
      .where('createdAt', '>=', windowStart)
      .get();
    
    const jobs = jobsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
      id: doc.id,
      ...(doc.data() as Record<string, unknown>),
    })) as Array<Record<string, any>>;
    
    // Agregar por região
    const regionMap = new Map<string, RegionStats>();
    
    jobs.forEach(job => {
      // Extrair localização de job.location
      const location = job.location || {};
      const cidade = location.cidade || 'Não informado';
      const estado = location.estado || 'N/A';
      const key = `${cidade}/${estado}`;
      
      if (!regionMap.has(key)) {
        regionMap.set(key, {
          key,
          cidade,
          estado,
          label: key,
          jobs: 0,
          familias: 0,
          profissionais: 0,
        });
      }
      
      const region = regionMap.get(key)!;
      region.jobs++;
    });
    
    // Converter para array e ordenar
    const regions = Array.from(regionMap.values())
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, limit);
    
    console.log('[Dashboard] Top regiões calculadas:', regions.length);
    return regions;
    
  } catch (error) {
    console.error('[Dashboard] ERRO ao calcular top regiões:', error);
    return [];
  }
}
