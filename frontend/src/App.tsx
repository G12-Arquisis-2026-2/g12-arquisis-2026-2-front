import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { CyclesPage } from './pages/Cycles/CyclesPage';
import { ConnectivityPage } from './pages/Connectivity/ConnectivityPage';
import { ProposalsPage } from './pages/Proposals/ProposalsPage.tsx';
import { AuditLogsPage } from './pages/AuditLogs/AuditLogsPage';
import './App.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-wrapper">
          {/* CUADRO 1: NAVBAR INDEPENDIENTE COLOR CREMA */}
          <header className="navbar-card">
            <div className="brand-group">
              <span className="brand-badge">E S</span>
              <h1 className="app-title">EnergyShark</h1>
            </div>
            <nav className="nav-links">
              <NavLink 
                to="/cycles" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Historial Ciclos (RF01)
              </NavLink>
              <NavLink 
                to="/connectivity" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Conectividad (RF02)
              </NavLink>
              <NavLink 
                to="/proposals" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Negociaciones (RF04)
              </NavLink>
              <NavLink 
                to="/audit" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Auditoría (RF05)
              </NavLink>
            </nav>
          </header>

          {/* CUADRO 2: CONTENEDOR PRINCIPAL INDEPENDIENTE COLOR CREMA */}
          <main className="app-canvas">
            <Routes>
              <Route path="/" element={<Navigate to="/cycles" replace />} />
              <Route path="/cycles" element={<CyclesPage />} />
              <Route path="/connectivity" element={<ConnectivityPage />} />
              <Route path="/proposals" element={<ProposalsPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;