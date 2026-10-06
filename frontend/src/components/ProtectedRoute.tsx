// src/components/ProtectedRoute.tsx
import React from 'react';
import { withAuthenticationRequired, useAuth0 } from '@auth0/auth0-react';

interface Props {
  component: React.ComponentType<object>;
}

export const ProtectedRoute: React.FC<Props> = ({ component: Component }) => {
  const { error } = useAuth0();

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#b91c1c' }}>
        <h3>Error de autenticación en Auth0</h3>
        <p><strong>Detalle:</strong> {error.message}</p>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ padding: '8px 16px', marginTop: '1rem', cursor: 'pointer' }}
        >
          Limpiar y reintentar
        </button>
      </div>
    );
  }

  const ComponentWithAuth = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Redirigiendo al inicio de sesión...
      </div>
    ),
  });

  return <ComponentWithAuth />;
};