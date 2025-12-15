import { NextResponse } from 'next/server';

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

/**
 * Creates a standardized error response
 * 
 * @param status - HTTP status code
 * @param code - Error code identifier
 * @param message - Human-readable error message
 * @param details - Additional error details (optional)
 * @returns NextResponse with error structure
 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse<ErrorResponse> {
  const errorBody: ErrorResponse = {
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(errorBody, { status });
}

/**
 * Common error responses
 */
export const Errors = {
  unauthorized: (message = 'Não autorizado') =>
    errorResponse(401, 'unauthorized', message),
  
  forbidden: (message = 'Acesso negado') =>
    errorResponse(403, 'forbidden', message),
  
  notFound: (resource = 'Recurso', message?: string) =>
    errorResponse(404, 'not_found', message ?? `${resource} não encontrado`),
  
  badRequest: (message = 'Requisição inválida', details?: unknown) =>
    errorResponse(400, 'bad_request', message, details),
  
  conflict: (message = 'Conflito de dados', details?: unknown) =>
    errorResponse(409, 'conflict', message, details),
  
  internalError: (message = 'Erro interno do servidor', details?: unknown) =>
    errorResponse(500, 'internal_error', message, details),
  
  serviceUnavailable: (message = 'Serviço temporariamente indisponível') =>
    errorResponse(503, 'service_unavailable', message),
  
  rateLimited: (retryAfter?: number, details?: unknown) => {
    const rateLimitDetails = details
      ? { ...details as Record<string, unknown>, retryAfterSeconds: retryAfter }
      : { retryAfterSeconds: retryAfter };
    
    return errorResponse(
      429,
      'rate_limited',
      'Limite de requisições excedido',
      rateLimitDetails
    );
  },
};
