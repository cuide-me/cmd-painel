/**
 * Feature Flags System
 * Controla funcionalidades que podem estar incompletas ou em teste
 */

export interface FeatureFlags {
  // GA4 Custom Events
  ga4CustomEvents: boolean;
  ga4ConversionFunnel: boolean;
  
  // Alertas
  intelligentAlerts: boolean;
  alertNotifications: boolean;
  slackIntegration: boolean;
  
  // Observabilidade
  performanceMetrics: boolean;
  errorTracking: boolean;
  cacheMonitoring: boolean;
  
  // Features Avançadas
  predictiveAnalytics: boolean;
  cohortAnalysis: boolean;
  abTesting: boolean;
  
  // Integrações
  stripeAdvanced: boolean;
  firebaseRealtime: boolean;
}

/**
 * Configuração de feature flags
 * TRUE = Feature habilitada
 * FALSE = Feature desabilitada (mostra placeholder ou esconde)
 */
export const FEATURE_FLAGS: FeatureFlags = {
  // GA4 - Infraestrutura pronta, aguardando integração frontend
  ga4CustomEvents: false, // Mudar para true após integrar nos forms
  ga4ConversionFunnel: true, // UI pronta, mostra placeholder
  
  // Alertas - Implementado nesta fase
  intelligentAlerts: true,
  alertNotifications: true,
  slackIntegration: false, // Requer SLACK_WEBHOOK_URL
  
  // Observabilidade - Implementado nesta fase
  performanceMetrics: true,
  errorTracking: true,
  cacheMonitoring: false, // Futuro: Redis/Vercel KV
  
  // Features Avançadas - Futuro
  predictiveAnalytics: false,
  cohortAnalysis: false,
  abTesting: false,
  
  // Integrações - Já funcionando
  stripeAdvanced: true,
  firebaseRealtime: false, // Usa snapshot queries
};

/**
 * Hook para verificar se uma feature está habilitada
 */
export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Função helper para componentes server-side
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag];
}

/**
 * Retorna todas as flags (útil para debug)
 */
export function getAllFeatureFlags(): FeatureFlags {
  return FEATURE_FLAGS;
}
