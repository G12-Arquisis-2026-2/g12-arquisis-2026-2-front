import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un fallo:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor: '#fee2e2',
          border: '1.5px solid #dc2626',
          margin: '1rem 0',
          textAlign: 'center',
          color: '#991b1b'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
            ⚠️ Ocurrió un error al renderizar este componente
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            {this.props.fallbackMessage || this.state.error?.message || 'Error inesperado.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}