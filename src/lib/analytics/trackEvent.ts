/**
 * ────────────────────────────────────
 * ANALYTICS: TRACK EVENT HELPER
 * ────────────────────────────────────
 * Helper para tracking de eventos GA4
 */

// Tipagem global para gtag
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | object,
      config?: any
    ) => void;
    dataLayer?: any[];
  }
}

export interface EventParams {
  [key: string]: any;
}

/**
 * Track evento no Google Analytics 4
 * 
 * @param eventName - Nome do evento (ex: 'sign_up', 'contact_caregiver')
 * @param params - Parâmetros do evento
 */
export function trackEvent(eventName: string, params?: EventParams) {
  if (typeof window === 'undefined') {
    // Server-side rendering, não fazer nada
    return;
  }

  if (!window.gtag) {
    console.warn(`[Analytics] gtag não disponível para evento: ${eventName}`);
    return;
  }

  try {
    window.gtag('event', eventName, params);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics] Event tracked:', eventName, params);
    }
  } catch (error) {
    console.error('[Analytics] Erro ao track evento:', error);
  }
}

/**
 * Eventos de Conversão
 */
export const ConversionEvents = {
  /**
   * Usuário completou cadastro
   */
  signUp: (params: {
    method: 'email' | 'google' | 'facebook';
    user_type: 'profissional' | 'cliente';
  }) => trackEvent('sign_up', params),

  /**
   * Usuário completou perfil
   */
  profileComplete: (params: {
    user_type: 'profissional' | 'cliente';
    profile_completion: number; // 0-100
  }) => trackEvent('profile_complete', params),

  /**
   * Cliente criou solicitação de cuidado
   */
  contactCaregiver: (params: {
    job_id: string;
    specialty?: string;
    modality?: string;
    user_id: string;
  }) => trackEvent('contact_caregiver', params),

  /**
   * Profissional aceitou match
   */
  matchAccepted: (params: {
    job_id: string;
    specialist_id: string;
    client_id: string;
  }) => trackEvent('match_accepted', params),

  /**
   * Pagamento bem-sucedido
   */
  paymentSuccess: (params: {
    transaction_id: string;
    value: number;
    currency: string;
    payment_method: string;
  }) => trackEvent('payment_success', params),

  /**
   * Usuário iniciou assinatura
   */
  subscriptionStart: (params: {
    subscription_id: string;
    plan: string;
    value: number;
    currency: string;
  }) => trackEvent('subscription_start', params),

  /**
   * Job foi completado
   */
  jobCompleted: (params: {
    job_id: string;
    duration_days: number;
    rating?: number;
  }) => trackEvent('job_completed', params),

  /**
   * Feedback foi submetido
   */
  feedbackSubmitted: (params: {
    job_id: string;
    rating: number;
    has_comment: boolean;
  }) => trackEvent('feedback_submitted', params),
};

/**
 * Eventos de Ecommerce
 */
export const EcommerceEvents = {
  /**
   * Usuário visualizou plano
   */
  viewItem: (params: {
    item_id: string;
    item_name: string;
    item_category: string;
    price: number;
    currency: string;
  }) => trackEvent('view_item', {
    currency: params.currency,
    value: params.price,
    items: [{
      item_id: params.item_id,
      item_name: params.item_name,
      item_category: params.item_category,
      price: params.price,
      quantity: 1,
    }],
  }),

  /**
   * Usuário iniciou checkout
   */
  beginCheckout: (params: {
    item_id: string;
    item_name: string;
    value: number;
    currency: string;
  }) => trackEvent('begin_checkout', {
    currency: params.currency,
    value: params.value,
    items: [{
      item_id: params.item_id,
      item_name: params.item_name,
      price: params.value,
      quantity: 1,
    }],
  }),

  /**
   * Compra completada
   */
  purchase: (params: {
    transaction_id: string;
    value: number;
    currency: string;
    tax?: number;
    shipping?: number;
    items: Array<{
      item_id: string;
      item_name: string;
      price: number;
      quantity: number;
    }>;
  }) => trackEvent('purchase', params),
};

export default trackEvent;
