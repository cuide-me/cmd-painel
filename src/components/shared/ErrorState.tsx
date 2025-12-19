/**
 * ────────────────────────────────────────────────────────────────────────────
 * ERROR STATE - Estado de Erro Padronizado
 * ────────────────────────────────────────────────────────────────────────────
 */

'use client';

import React from 'react';

export interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  fullScreen?: boolean;
  icon?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message,
  retry,
  fullScreen = false,
  icon = '⚠️',
}: ErrorStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50 p-6">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      {content}
    </div>
  );
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * EMPTY STATE - Estado Vazio
 * ────────────────────────────────────────────────────────────────────────────
 */

export interface EmptyStateProps {
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: string;
}

export function EmptyState({
  title = 'Nenhum dado encontrado',
  message,
  action,
  icon = '📊',
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <div className="flex flex-col items-center justify-center text-center max-w-md">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ────────────────────────────────────────────────────────────────────────────
 * ERROR BOUNDARY - Componente para capturar erros
 * ────────────────────────────────────────────────────────────────────────────
 */

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorState
          title="Erro inesperado"
          message={
            this.state.error?.message ||
            'Ocorreu um erro ao renderizar este componente.'
          }
          retry={() => this.setState({ hasError: false, error: undefined })}
        />
      );
    }

    return this.props.children;
  }
}
