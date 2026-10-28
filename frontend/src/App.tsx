import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';

import { CyclesPage } from './pages/Cycles/CyclesPage';
import { MarketLivePage } from './pages/MarketLive/MarketLivePage.tsx';
import { MarketAdminPage } from './pages/MarketAdmin/MarketAdminPage';
import { SpanExperimentPage } from './pages/SpanExperiment/SpanExperimentPage';
import { AuditLogsPage } from './pages/AuditLogs/AuditLogsPage';

import { ProtectedRoute } from './components/ProtectedRoute';
import { AxiosAuthBridge } from './components/AxiosAuthBridge';
import './App.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="app-wrapper">
          {/* Componente Navbar modular */}
          <Navbar />

          {/* Lienzo principal con las rutas protegidas */}
          <main className="app-canvas">
            <AxiosAuthBridge>
              <Routes>
                <Route path="/" element={<Navigate to="/market" replace />} />
                <Route path="/cycles" element={<ProtectedRoute component={CyclesPage} />} />
                <Route path="/market" element={<ProtectedRoute component={MarketLivePage} />} />
                <Route path="/control" element={<ProtectedRoute component={MarketAdminPage} />} />
                <Route path="/experiments" element={<ProtectedRoute component={SpanExperimentPage} />} />
                <Route path="/audit" element={<ProtectedRoute component={AuditLogsPage} />} />
                
                {/* Redirecciones de compatibilidad */}
                <Route path="/connectivity" element={<Navigate to="/market" replace />} />
                <Route path="/proposals" element={<Navigate to="/control" replace />} />
              </Routes>
            </AxiosAuthBridge>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
};

export default App;