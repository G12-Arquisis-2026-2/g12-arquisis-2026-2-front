import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { CycleSummary } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './CyclesPage.css';

export const CyclesPage: React.FC = () => {
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [currentCycle, setCurrentCycle] = useState<CycleSummary | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [selectedCycleDetails, setSelectedCycleDetails] = useState<Record<string, CycleSummary>>({});
  
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);

    // Consulta en paralelo el historial general y el ciclo en curso
    Promise.allSettled([
      ApiService.getCycles(),
      ApiService.getCurrentCycle()
    ]).then(([cyclesRes, currentRes]) => {
      if (cyclesRes.status === 'fulfilled') {
        setCycles(cyclesRes.value);
      }
      if (currentRes.status === 'fulfilled') {
        setCurrentCycle(currentRes.value);
      }
      if (cyclesRes.status === 'rejected' && currentRes.status === 'rejected') {
        setError('No se pudo conectar con la API para obtener los ciclos energéticos.');
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Al expandir, se aprovecha GET /cycles/:id para asegurar datos actualizados
  const toggleCycle = async (cycleId: string) => {
    if (expandedCycleId === cycleId) {
      setExpandedCycleId(null);
      return;
    }

    setExpandedCycleId(cycleId);

    // Si aún no tenemos los detalles de este ciclo en caché local, los pedimos a /cycles/:id
    if (!selectedCycleDetails[cycleId]) {
      setLoadingDetail(true);
      try {
        const detail = await ApiService.getCycleById(cycleId);
        setSelectedCycleDetails((prev) => ({ ...prev, [cycleId]: detail }));
      } catch (err) {
        console.error(`Error al cargar el detalle del ciclo ${cycleId}:`, err);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  if (loading) return <div>Cargando historial de ciclos...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Historial de Ciclos Energéticos (RF01)</h2>
          <p className="page-subtitle">
            Registro de balances, órdenes y reportes para cada ciclo de 2 horas.
          </p>
        </div>
        <button onClick={loadData} className="btn-primary">
          Refrescar Ciclos
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadData} />}

      {/* --- Tarjeta destacada para GET /cycles/current --- */}
      {currentCycle && !error && (
        <div className="cycle-card current-cycle-highlight">
          <div className="current-cycle-header">
            <div className="current-cycle-title-group">
              <span className="current-cycle-badge">EN CURSO</span>
              <strong className="current-cycle-id">Ciclo Actual: {currentCycle.cycleId}</strong>
            </div>
            <div className="current-cycle-timer">
              Válido hasta: {new Date(currentCycle.statusStatement.validUntil).toLocaleTimeString()}
            </div>
          </div>
          
          <div className="current-cycle-stats">
            <div>
              Generación: <strong>{currentCycle.statusStatement.energy.generationCapacity.toLocaleString()} kWh</strong>
            </div>
            <div>
              Consumo: <strong>{currentCycle.statusStatement.energy.consumption.toLocaleString()} kWh</strong>
            </div>
            <div>
              Fondos: <span>+{currentCycle.fundsReceived.toLocaleString()} créditos</span>
            </div>
          </div>
        </div>
      )}

      {/* --- Listado general desde GET /cycles --- */}
      {!loading && !error && cycles.length === 0 && (
        <p>No hay ciclos registrados en el ledger local.</p>
      )}

      {!loading && !error && (
        cycles.map((c) => {
          const isExpanded = expandedCycleId === c.cycleId;
          // Usa los detalles cargados bajo demanda vía GET /cycles/:id si existen, o la data base
          const activeData = selectedCycleDetails[c.cycleId] || c;
          const energySurplus = activeData.statusStatement.energy.generationCapacity - activeData.statusStatement.energy.consumption;

          return (
            <div key={c.cycleId} className="cycle-card">
              <div
                className={`cycle-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleCycle(c.cycleId)}
              >
                <div>
                  <span className="cycle-id">Ciclo: {c.cycleId}</span>
                  <span className="badge-operation">Última Op: {c.lastOperation}</span>
                </div>

                <div className="cycle-header-summary">
                  <div>
                    <div className="summary-label">Balance Final (Energía / Budget)</div>
                    <div className="summary-values">
                      {c.finalBalances.energy.toLocaleString()} kWh | {c.finalBalances.budget.toLocaleString()} créditos
                    </div>
                  </div>
                  <span className="accordion-arrow">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="cycle-details">
                  {loadingDetail && !selectedCycleDetails[c.cycleId] ? (
                    <div>Cargando detalle del ciclo...</div>
                  ) : (
                    <>
                      {/* 1. Status Statement & 2. Transfer */}
                      <div className="info-cards-grid">
                        <div className="info-card">
                          <h4 className="info-card-title">1. Estado Inicial (status-statement)</h4>
                          <p className="info-card-row">
                            <strong>Generación:</strong> {activeData.statusStatement.energy.generationCapacity.toLocaleString()} kWh
                          </p>
                          <p className="info-card-row">
                            <strong>Consumo:</strong> {activeData.statusStatement.energy.consumption.toLocaleString()} kWh
                          </p>
                          <p className="info-card-row">
                            <strong>Balance Inicial:</strong>{' '}
                            <span className={energySurplus >= 0 ? 'positive-value' : 'negative-value'}>
                              {energySurplus >= 0 ? `+${energySurplus.toLocaleString()}` : energySurplus.toLocaleString()} kWh
                            </span>
                          </p>
                          <p className="info-card-row">
                            <strong>Costo de Generación:</strong> {activeData.statusStatement.energy.generationCost} créditos/kWh
                          </p>
                          <small style={{ color: '#64748b' }}>
                            Válido hasta: {new Date(activeData.statusStatement.validUntil).toLocaleTimeString()}
                          </small>
                        </div>

                        <div className="info-card">
                          <h4 className="info-card-title">2. Transferencia de Fondos (transfer)</h4>
                          <p className="transfer-amount">+{activeData.fundsReceived.toLocaleString()} créditos</p>
                          <p className="page-subtitle">Presupuesto inicial enviado por la central.</p>
                        </div>
                      </div>

                      {/* 3. Demand Statements */}
                      <div>
                        <h4 className="info-card-title">3. Demandas Impuestas (demand-statement)</h4>
                        {activeData.demandStatements.length === 0 ? (
                          <p className="page-subtitle">Sin órdenes obligatorias en este ciclo.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr style={{ background: '#f1f5f9' }}>
                                <th>Cantidad</th>
                                <th>Valor/kWh</th>
                                <th>Efecto Energía</th>
                                <th>Efecto Presupuesto</th>
                                <th>Hora</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeData.demandStatements.map((d, idx) => {
                                const isPositive = d.quantity >= 0;
                                const total = Math.abs(d.quantity) * d.valuePerKwh;
                                return (
                                  <tr key={idx}>
                                    <td><strong>{d.quantity.toLocaleString()} kWh</strong></td>
                                    <td>{d.valuePerKwh} créditos</td>
                                    <td className={isPositive ? 'positive-value' : 'negative-value'}>
                                      {isPositive ? `+${d.quantity.toLocaleString()}` : d.quantity.toLocaleString()} kWh
                                    </td>
                                    <td className={isPositive ? 'negative-value' : 'positive-value'}>
                                      {isPositive ? `-${total.toLocaleString()}` : `+${total.toLocaleString()}`} créditos
                                    </td>
                                    <td>{new Date(d.appliedAt).toLocaleTimeString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* 4. Negociaciones Voluntarias */}
                      <div>
                        <h4 className="info-card-title">4. Negociaciones Voluntarias</h4>
                        {activeData.voluntaryNegotiations.length === 0 ? (
                          <p className="page-subtitle">Sin negociaciones voluntarias en este ciclo.</p>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr style={{ background: '#f1f5f9' }}>
                                <th>ID</th>
                                <th>Operación</th>
                                <th>Cantidad</th>
                                <th>Precio Techo</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeData.voluntaryNegotiations.map((neg, idx) => (
                                <tr key={idx}>
                                  <td><code>{neg.proposalId || 'N/A'}</code></td>
                                  <td><strong>{neg.direction.toUpperCase()}</strong></td>
                                  <td>{neg.quantity.toLocaleString()} kWh</td>
                                  <td>{neg.pricePerEnergy} créditos</td>
                                  <td>
                                    <span className={`status-badge ${neg.status === 'paid' ? 'badge-paid' : 'badge-timeout'}`}>
                                      {neg.status.toUpperCase()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* 5. Reporte Emitido */}
                      <div className="final-report-card">
                        <div>
                          <h4 className="final-report-title">5. Reporte Emitido (negotiation-report)</h4>
                          <p className="page-subtitle">Reportado sin multas a la central.</p>
                          {activeData.negotiationReport.sentAt && (
                            <small style={{ color: '#166534' }}>
                              Emitido a las: {new Date(activeData.negotiationReport.sentAt).toLocaleTimeString()}
                            </small>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="summary-label">Balances Declarados:</div>
                          <div className="final-report-declared">
                            {activeData.negotiationReport.budgetBalance.toLocaleString()} créditos |{' '}
                            {activeData.negotiationReport.energyBalance.toLocaleString()} kWh
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};