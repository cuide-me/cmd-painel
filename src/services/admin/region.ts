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

export type SaoPauloZoneKey = 'norte' | 'sul' | 'leste' | 'oeste';

const SAO_PAULO_ZONE_LABELS: Record<SaoPauloZoneKey, string> = {
  norte: 'Zona Norte',
  sul: 'Zona Sul',
  leste: 'Zona Leste',
  oeste: 'Zona Oeste',
};

const EXPLICIT_ZONE_PATTERNS: Array<{ zone: SaoPauloZoneKey; patterns: RegExp[] }> = [
  { zone: 'norte', patterns: [/\bzona norte\b/, /\bnorte\b/, /\bzn\b/] },
  { zone: 'sul', patterns: [/\bzona sul\b/, /\bsul\b/, /\bzs\b/] },
  { zone: 'leste', patterns: [/\bzona leste\b/, /\bleste\b/, /\bzl\b/] },
  { zone: 'oeste', patterns: [/\bzona oeste\b/, /\boeste\b/, /\bzo\b/] },
];

const SAO_PAULO_BAIRRO_TO_ZONE: Record<string, SaoPauloZoneKey> = {
  'alto de pinheiros': 'oeste',
  anhanguera: 'norte',
  aricanduva: 'leste',
  'artur alvim': 'leste',
  belem: 'leste',
  'barra funda': 'oeste',
  brasilandia: 'norte',
  brooklin: 'sul',
  'butanta': 'oeste',
  cachoeirinha: 'norte',
  cambuci: 'sul',
  'campo belo': 'sul',
  'campo limpo': 'sul',
  'capao redondo': 'sul',
  'casa verde': 'norte',
  carrao: 'leste',
  'cerqueira cesar': 'oeste',
  'cidade ademar': 'sul',
  'cidade dutra': 'sul',
  'cidade lider': 'leste',
  'cidade tiradentes': 'leste',
  'ermelino matarazzo': 'leste',
  'freguesia do o': 'norte',
  'grajau': 'sul',
  guaianases: 'leste',
  ipiranga: 'sul',
  itaim: 'leste',
  'itaim paulista': 'leste',
  itaquera: 'leste',
  jabaquara: 'sul',
  jaguare: 'oeste',
  'jaragua': 'norte',
  'jardim angela': 'sul',
  'jardim bonfiglioli': 'oeste',
  'jardim paulista': 'oeste',
  'jardim sao luis': 'sul',
  jacana: 'norte',
  lapa: 'oeste',
  liberdade: 'sul',
  limao: 'norte',
  mandaqui: 'norte',
  moema: 'sul',
  mooca: 'leste',
  morumbi: 'sul',
  penha: 'leste',
  perus: 'norte',
  perdizes: 'oeste',
  pinheiros: 'oeste',
  pompeia: 'oeste',
  pirituba: 'norte',
  'rio pequeno': 'oeste',
  sacoma: 'sul',
  santana: 'norte',
  'santo amaro': 'sul',
  'sao mateus': 'leste',
  'sao miguel': 'leste',
  'sao miguel paulista': 'leste',
  saude: 'sul',
  socorro: 'sul',
  sumare: 'oeste',
  tatuape: 'leste',
  tremembe: 'norte',
  tucuruvi: 'norte',
  'vila formosa': 'leste',
  'vila guilherme': 'norte',
  'vila leopoldina': 'oeste',
  'vila madalena': 'oeste',
  'vila maria': 'norte',
  'vila mariana': 'sul',
  'vila matilde': 'leste',
  'vila medeiros': 'norte',
  'vila prudente': 'leste',
  'vila sonia': 'oeste',
};

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

export function getSaoPauloZoneLabel(zone: SaoPauloZoneKey): string {
  return SAO_PAULO_ZONE_LABELS[zone];
}

export function inferSaoPauloZone(record: any): SaoPauloZoneKey | null {
  const location = record?.location || {};
  const address = getAddressCandidate(record);
  const cidade = normalizeLocationName(
    pickFirstString([
      location.cidade,
      location.city,
      address?.cidade,
      address?.city,
      address?.localidade,
      address?.municipio,
      record?.cidade,
      record?.city,
    ])
  );
  const estado = normalizeLocationName(
    pickFirstString([
      location.estado,
      location.state,
      address?.estado,
      address?.state,
      address?.uf,
      record?.estado,
      record?.state,
      record?.uf,
    ])
  );
  const bairro = normalizeLocationName(
    pickFirstString([
      location.bairro,
      location.neighborhood,
      address?.bairro,
      address?.neighborhood,
      address?.district,
      address?.borough,
      record?.bairro,
      record?.neighborhood,
      record?.district,
    ])
  );

  const explicitZone = resolveExplicitZone([
    location.zona,
    location.zone,
    location.regiao,
    location.region,
    address?.zona,
    address?.zone,
    address?.regiao,
    address?.region,
    record?.zona,
    record?.zone,
    record?.regiao,
    record?.region,
  ]);

  const mappedZone = bairro ? SAO_PAULO_BAIRRO_TO_ZONE[bairro] || null : null;
  const hasExplicitDifferentCity = Boolean(cidade && !isSaoPauloCity(cidade) && estado && !isSaoPauloState(estado));

  if (explicitZone && !hasExplicitDifferentCity) {
    return explicitZone;
  }

  if (mappedZone && !hasExplicitDifferentCity) {
    return mappedZone;
  }

  return null;
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

function normalizeLocationName(name: string | null): string | null {
  if (!name) {
    return null;
  }

  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/.-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickFirstString(candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return null;
}

function getAddressCandidate(record: any): Record<string, any> | null {
  const candidates = [record?.address, record?.endereco, record?.enderecoResidencial, record?.residentialAddress];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object') {
      return candidate as Record<string, any>;
    }
  }

  return null;
}

function resolveExplicitZone(candidates: unknown[]): SaoPauloZoneKey | null {
  for (const candidate of candidates) {
    if (typeof candidate !== 'string' || candidate.trim().length === 0) {
      continue;
    }

    const normalized = normalizeLocationName(candidate);
    if (!normalized) {
      continue;
    }

    for (const matcher of EXPLICIT_ZONE_PATTERNS) {
      if (matcher.patterns.some((pattern) => pattern.test(normalized))) {
        return matcher.zone;
      }
    }
  }

  return null;
}

function isSaoPauloCity(cidade: string | null): boolean {
  if (!cidade) {
    return false;
  }

  return cidade === 'sao paulo' || cidade === 'sao paulo/sp' || cidade === 'sp';
}

function isSaoPauloState(estado: string | null): boolean {
  return estado === 'sp' || estado === 'sao paulo';
}
