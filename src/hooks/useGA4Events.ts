'use client';

import { useCallback } from 'react';

/**
 * Hook para rastrear custom events no Google Analytics 4
 * 
 * @example
 * const { trackSignUp, trackCreateRequest, trackHireCaregiver } = useGA4Events();
 * trackSignUp('email', 'professional');
 */

// Declaração de tipos para gtag (evita erros TypeScript)
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      eventParams?: Record<string, any>
    ) => void;
  }
}

export function useGA4Events() {
  /**
   * Rastreia cadastro de novo usuário
   * @param method - Método de cadastro (email, google, facebook)
   * @param userType - Tipo de usuário (professional, family)
   */
  const trackSignUp = useCallback((method: string, userType: 'professional' | 'family') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'sign_up', {
        method,
        user_type: userType,
      });
      console.log('[GA4] Event tracked: sign_up', { method, user_type: userType });
    }
  }, []);

  /**
   * Rastreia criação de solicitação de cuidador
   * @param requestId - ID da solicitação criada
   * @param serviceType - Tipo de serviço solicitado
   */
  const trackCreateRequest = useCallback((requestId: string, serviceType: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'create_request', {
        request_id: requestId,
        service_type: serviceType,
      });
      console.log('[GA4] Event tracked: create_request', { request_id: requestId, service_type: serviceType });
    }
  }, []);

  /**
   * Rastreia contratação de cuidador
   * @param requestId - ID da solicitação
   * @param professionalId - ID do profissional contratado
   * @param value - Valor da contratação (opcional)
   */
  const trackHireCaregiver = useCallback((
    requestId: string,
    professionalId: string,
    value?: number
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const params: Record<string, any> = {
        request_id: requestId,
        professional_id: professionalId,
      };
      
      if (value) {
        params.value = value;
        params.currency = 'BRL';
      }

      window.gtag('event', 'hire_caregiver', params);
      console.log('[GA4] Event tracked: hire_caregiver', params);
    }
  }, []);

  /**
   * Rastreia preenchimento completo de perfil
   * @param userId - ID do usuário
   * @param userType - Tipo de usuário
   */
  const trackCompleteProfile = useCallback((userId: string, userType: 'professional' | 'family') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'complete_profile', {
        user_id: userId,
        user_type: userType,
      });
      console.log('[GA4] Event tracked: complete_profile', { user_id: userId, user_type: userType });
    }
  }, []);

  /**
   * Rastreia visualização de perfil profissional
   * @param professionalId - ID do profissional visualizado
   * @param viewedBy - Tipo de quem visualizou
   */
  const trackViewProfessional = useCallback((
    professionalId: string,
    viewedBy: 'family' | 'admin'
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_professional', {
        professional_id: professionalId,
        viewed_by: viewedBy,
      });
      console.log('[GA4] Event tracked: view_professional', { professional_id: professionalId, viewed_by: viewedBy });
    }
  }, []);

  /**
   * Rastreia evento genérico
   * @param eventName - Nome do evento
   * @param params - Parâmetros do evento
   */
  const trackCustomEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, params);
      console.log('[GA4] Event tracked:', eventName, params);
    }
  }, []);

  return {
    trackSignUp,
    trackCreateRequest,
    trackHireCaregiver,
    trackCompleteProfile,
    trackViewProfessional,
    trackCustomEvent,
  };
}
