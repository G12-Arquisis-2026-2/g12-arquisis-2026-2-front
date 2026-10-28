import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

import { CyclesPage } from './pages/Cycles/CyclesPage';
import { MarketLivePage } from './pages/MarketLive/MarketLivePage.tsx';
import { MarketAdminPage } from './pages/MarketAdmin/MarketAdminPage';
import { AuditLogsPage } from './pages/AuditLogs/AuditLogsPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AxiosAuthBridge } from './components/AxiosAuthBridge';
import './App.css';

export const App: React.FC = () => {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-wrapper">
          {/* NAVBAR RESPONSIVO INDEPENDIENTE */}
          <header className="navbar-card">
            <div className="navbar-top-row">
              <div className="brand-group">
                <span className="brand-badge">E S</span>
                <h1 className="app-title"> EnergyShark </h1>
              </div>

              {/* Botón hamburguesa (solo visible en pantallas móviles) */}
              <button
                className={`menu-toggle-btn ${menuOpen ? 'open' : ''}`}
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Alternar navegación"
              >
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </button>
            </div>

            {/* Contenedor colapsable en móvil / fila en escritorio */}
            <div className={`navbar-collapse ${menuOpen ? 'show' : ''}`}>
              <nav className="nav-links">
                <NavLink
                  to="/cycles"
                  onClick={closeMenu}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Ciclos (RF01)
                </NavLink>
                <NavLink
                  to="/market"
                  onClick={closeMenu}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Mercado (RF02)
                </NavLink>
                <NavLink
                  to="/control"
                  onClick={closeMenu}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Estrategias (RF04)
                </NavLink>
                <NavLink
                  to="/audit"
                  onClick={closeMenu}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  Auditoría (RF05)
                </NavLink>
              </nav>

              {/* Autenticación Auth0 */}
              <div className="nav-auth-section">
                {isLoading ? (
                  <span className="auth-loading-text">Cargando...</span>
                ) : isAuthenticated ? (
                  <div className="auth-user-box">
                    <span className="auth-user-name">
                      {user?.name || user?.email}
                    </span>
                    <button
                      onClick={() => {
                        closeMenu();
                        logout({ logoutParams: { returnTo: window.location.origin } });
                      }}
                      className="btn-primary btn-logout"
                    >
                      Salir
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      closeMenu();
                      loginWithRedirect();
                    }}
                    className="btn-primary btn-login"
                  >
                    Entrar (Login)
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* CONTENEDOR PRINCIPAL */}
          <main className="app-canvas">
            <AxiosAuthBridge>
              <Routes>
                <Route path="/" element={<Navigate to="/market" replace />} />
                <Route path="/cycles" element={<ProtectedRoute component={CyclesPage} />} />
                <Route path="/market" element={<ProtectedRoute component={MarketLivePage} />} />
                <Route path="/control" element={<ProtectedRoute component={MarketAdminPage} />} />
                <Route path="/audit" element={<ProtectedRoute component={AuditLogsPage} />} />
              </Routes>
            </AxiosAuthBridge>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;