import React from 'react';
import { withAuthenticationRequired } from '@auth0/auth0-react';

interface Props {
  component: React.ComponentType<object>;
}

export const ProtectedRoute: React.FC<Props> = ({ component: Component }) => {
  const ComponentWithAuth = withAuthenticationRequired(Component, {
    onRedirecting: () => (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Redirigiendo al inicio de sesión...
      </div>
    ),
  });

  return <ComponentWithAuth />;
};