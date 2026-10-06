// src/App.tsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { CyclesPage } from './pages/Cycles/CyclesPage';
import { ConnectivityPage } from './pages/Connectivity/ConnectivityPage';
import { ProposalsPage } from './pages//Proposals/ProposalsPage';
import { AuditLogsPage } from './pages/AuditLogs/AuditLogsPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { setupAxiosInterceptors } from './services/httpClient';
import './App.css';

export const App: React.FC = () => {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  // Conectar el interceptor de Axios con Auth0 al montar
  useEffect(() => {
    if (isAuthenticated) {
      setupAxiosInterceptors(async () => {
        const token = await getAccessTokenSilently();
        return token ?? '';
      });
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-wrapper">
          {/* NAVBAR FLOTANTE */}
          <header className="navbar-card">
            <div className="brand-group">
              <span className="brand-badge">E S</span>
              <h1 className="app-title">EnergyShark</h1>
            </div>

            <nav className="nav-links">
              <NavLink to="/cycles" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Historial Ciclos (RF01)
              </NavLink>
              <NavLink to="/connectivity" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Conectividad (RF02)
              </NavLink>
              <NavLink to="/proposals" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Negociaciones (RF04)
              </NavLink>
              <NavLink to="/audit" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                Auditoría (RF05)
              </NavLink>
            </nav>

            {/* SECCIÓN DE AUTENTICACIÓN */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isLoading ? (
                <span style={{ fontSize: '0.8rem', color: '#6b5e56' }}>Cargando...</span>
              ) : isAuthenticated ? (
                <>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    {user?.name || user?.email}
                  </span>
                  <button
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                    className="btn-primary"
                    style={{ padding: '6px 14px', fontSize: '0.78rem' }}
                  >
                    Salir
                  </button>
                </>
              ) : (
                <button
                  onClick={() => loginWithRedirect()}
                  className="btn-primary"
                  style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                >
                  Entrar (Login)
                </button>
              )}
            </div>
          </header>

          {/* RUTAS PROTEGIDAS */}
          <main className="app-canvas">
            <Routes>
              <Route path="/" element={<Navigate to="/cycles" replace />} />
              <Route path="/cycles" element={<ProtectedRoute component={CyclesPage} />} />
              <Route path="/connectivity" element={<ProtectedRoute component={ConnectivityPage} />} />
              <Route path="/proposals" element={<ProtectedRoute component={ProposalsPage} />} />
              <Route path="/audit" element={<ProtectedRoute component={AuditLogsPage} />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;