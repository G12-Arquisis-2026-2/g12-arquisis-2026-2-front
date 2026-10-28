import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading } = useAuth0();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar-card">
      <div className="navbar-top-row">
        <div className="brand-group">
          <span className="brand-badge">
            <span>E</span>
            <span>S</span>
          </span>
        </div>

        {/* Botón hamburguesa para móviles */}
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

      {/* Contenedor de enlaces y autenticación */}
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
            to="/experiments"
            onClick={closeMenu}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Experimentos (RF06)
          </NavLink>
          <NavLink
            to="/audit"
            onClick={closeMenu}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            Auditoría (RF05)
          </NavLink>
        </nav>

        {/* Sección de autenticación con Auth0 */}
        <div className="nav-auth-section">
          {isLoading ? (
            <span className="auth-loading-text">Cargando...</span>
          ) : isAuthenticated ? (
            <div className="auth-user-box">
              <span className="auth-user-name" title={user?.name || user?.email}>
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
  );
};