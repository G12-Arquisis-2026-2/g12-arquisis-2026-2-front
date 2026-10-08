import { Component } from 'react';
import type {ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
}

export class CyclesErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error al renderizar los ciclos:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    if (this.props.onReset) this.props.onReset();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '1.5rem',
          borderRadius: '8px',
          backgroundColor: '#fee2e2',
          border: '1.5px solid #dc2626',
          margin: '1.5rem 0',
          textAlign: 'center'
        }}>
          <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 1rem 0' }}>
            ⚠️ Ocurrió un error al desplegar la lista de ciclos.
          </p>
          <button onClick={this.handleRetry} className="btn-primary" style={{ backgroundColor: '#dc2626' }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}