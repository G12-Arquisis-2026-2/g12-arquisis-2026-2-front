import React, { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import {
  setTokenGetter,
  setUnauthorizedHandler,
  registerAuthInterceptor,
  registerResponseInterceptor,
  ejectInterceptors,
} from '../services/httpClient';

interface Props {
  children: React.ReactNode;
}

export const AxiosAuthBridge: React.FC<Props> = ({ children }) => {
  const { getAccessTokenSilently, loginWithRedirect, isLoading } = useAuth0();
  const [isInterceptorReady, setIsInterceptorReady] = useState(false);

  useEffect(() => {
    // 1. Conectar obtención de token
    setTokenGetter(async () => {
      try {
        return await getAccessTokenSilently();
      } catch {
        return undefined;
      }
    });

    // 2. Manejador para error 401: notificar y forzar nuevo login
    setUnauthorizedHandler(async () => {
      alert('Tu sesión ha expirado o no tienes autorización. Por favor, inicia sesión nuevamente.');
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
    });

    // 3. Registrar ambos interceptores (Request y Response)
    const reqInterceptorId = registerAuthInterceptor();
    const resInterceptorId = registerResponseInterceptor();
    setIsInterceptorReady(true);

    // 4. Cleanup: remover interceptores y limpiar referencias
    return () => {
      ejectInterceptors(reqInterceptorId, resInterceptorId);
      setTokenGetter(null);
      setUnauthorizedHandler(null);
    };
  }, [getAccessTokenSilently, loginWithRedirect]);

  if (isLoading || !isInterceptorReady) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        Inicializando contexto de seguridad...
      </div>
    );
  }

  return <>{children}</>;
};