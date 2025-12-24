/**
 * ═══════════════════════════════════════════════════════
 * NORMALIZAÇÃO DE REGIÃO/BAIRRO
 * ═══════════════════════════════════════════════════════
 */

export interface RegionData {
  key: string; // slug para agrupamento
  label: string; // nome formatado (Title Case)
  cidade?: string;
  estado?: string;
}

/**
 * Extrai e normaliza a região de um job
 * Preferência: bairro > cidade
 */
export function getRegionKey(job: any): RegionData {
  const location = job.location || {};
  
  // Preferência: bairro
  let rawName = location.bairro || location.cidade || 'Não especificado';
  const cidade = location.cidade || undefined;
  const estado = location.estado || undefined;
  
  // Normalizar
  const normalized = normalizeRegionName(rawName);
  
  return {
    key: createSlug(normalized),
    label: toTitleCase(normalized),
    cidade,
    estado,
  };
}

/**
 * Normaliza nome de região (trim, espaços duplicados)
 */
function normalizeRegionName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Cria slug para chave de agrupamento
 */
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Converte para Title Case
 */
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
