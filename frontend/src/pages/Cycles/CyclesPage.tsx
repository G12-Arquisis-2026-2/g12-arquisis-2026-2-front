import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { CycleSummary } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CyclesErrorBoundary } from '../../components/CyclesErrorBoundary';
import './CyclesPage.css';

export const CyclesPage: React.FC = () => {
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [currentCycle, setCurrentCycle] = useState<CycleSummary | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      ApiService.getCycles(),
      ApiService.getCurrentCycle()
    ]).then(([cyclesRes, currentRes]) => {
      if (cyclesRes.status === 'fulfilled') setCycles(cyclesRes.value || []);
      if (currentRes.status === 'fulfilled') setCurrentCycle(currentRes.value || null);
      if (cyclesRes.status === 'rejected' && currentRes.status === 'rejected') {
        setError('No se pudo conectar con la API para obtener los ciclos.');
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCycle = (cycleId: string) => {
    setExpandedCycleId((prev) => (prev === cycleId ? null : cycleId));
  };

  // Punto 3: Comprobación de vigencia de validUntil
  const isCurrentCycleExpired = currentCycle?.statusStatement?.validUntil
    ? new Date(currentCycle.statusStatement.validUntil).getTime() < Date.now()
    : false;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Historial de Ciclos Energéticos (RF01)</h2>
          <p className="page-subtitle">Registro de balances, órdenes y reportes para cada ciclo de 2 horas[cite: 1, 3].</p>
        </div>
        <button onClick={loadData} className="btn-primary">
          Refrescar Ciclos
        </button>
      </div>

      {loading && <div>Cargando historial de ciclos...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={loadData} />}

      {/* Tarjeta "Ciclo Actual" tolerante a nulos y con estado de expiración */}
      {currentCycle && !error && !loading && (
        <div className="cycle-card current-cycle-highlight">
          <div className="current-cycle-header">
            <div className="current-cycle-title-group">
              <span className="current-cycle-badge">
                {isCurrentCycleExpired ? 'ÚLTIMO CICLO' : 'EN CURSO'}
              </span>
              <strong className="current-cycle-id">Ciclo: {currentCycle.cycleId || '—'}</strong>
            </div>
            <div className="current-cycle-timer">
              {currentCycle.statusStatement?.validUntil
                ? (isCurrentCycleExpired
                    ? `Ciclo cerrado a las ${new Date(currentCycle.statusStatement.validUntil).toLocaleTimeString()}`
                    : `Válido hasta: ${new Date(currentCycle.statusStatement.validUntil).toLocaleTimeString()}`)
                : 'Sin fecha de vigencia'}
            </div>
          </div>
          <div className="current-cycle-stats">
            <div>
              Generación: <strong>{currentCycle.statusStatement?.energy?.generationCapacity != null ? `${currentCycle.statusStatement.energy.generationCapacity.toLocaleString()} kWh` : '—'}</strong>
            </div>
            <div>
              Consumo: <strong>{currentCycle.statusStatement?.energy?.consumption != null ? `${currentCycle.statusStatement.energy.consumption.toLocaleString()} kWh` : '—'}</strong>
            </div>
            <div>
              Fondos: <span>{currentCycle.fundsReceived != null ? `+${currentCycle.fundsReceived.toLocaleString()} créditos` : 'Aún sin fondos recibidos'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error Boundary protegiendo la lista de ciclos */}
      <CyclesErrorBoundary onReset={loadData}>
        {!loading && !error && cycles.length === 0 && (
          <p>No hay ciclos registrados en el ledger local[cite: 1, 3].</p>
        )}

        {!loading && !error && cycles.map((c) => {
          const isExpanded = expandedCycleId === c.cycleId;

          // Cálculo seguro de excedente
          const genCap = c.statusStatement?.energy?.generationCapacity;
          const cons = c.statusStatement?.energy?.consumption;
          const hasEnergyData = genCap != null && cons != null;
          const energySurplus = hasEnergyData ? genCap - cons : null;

          return (
            <div key={c.cycleId} className="cycle-card">
              <div
                className={`cycle-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleCycle(c.cycleId)}
              >
                <div>
                  <span className="cycle-id">Ciclo: {c.cycleId || '—'}</span>
                  <span className="badge-operation">Última Op: {c.lastOperation || '—'}</span>
                </div>

                {/* Punto 2: Fila con "—" o "Sin datos" si falta finalBalances */}
                <div className="cycle-header-summary">
                  <div>
                    <div className="summary-label">Balance Final (Energía / Budget)</div>
                    <div className="summary-values">
                      {c.finalBalances?.energy != null ? `${c.finalBalances.energy.toLocaleString()} kWh` : '—'}
                      {' | '}
                      {c.finalBalances?.budget != null ? `${c.finalBalances.budget.toLocaleString()} créditos` : '—'}
                    </div>
                  </div>
                  <span className="accordion-arrow">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="cycle-details">
                  {/* status-statement y transfer */}
                  <div className="info-cards-grid">
                    <div className="info-card">
                      <h4 className="info-card-title">1. Estado Inicial (status-statement)</h4>
                      {c.statusStatement ? (
                        <>
                          <p className="info-card-row">
                            <strong>Generación:</strong> {c.statusStatement.energy?.generationCapacity != null ? `${c.statusStatement.energy.generationCapacity.toLocaleString()} kWh` : '—'}
                          </p>
                          <p className="info-card-row">
                            <strong>Consumo:</strong> {c.statusStatement.energy?.consumption != null ? `${c.statusStatement.energy.consumption.toLocaleString()} kWh` : '—'}
                          </p>
                          <p className="info-card-row">
                            <strong>Balance Inicial:</strong>{' '}
                            {energySurplus != null ? (
                              <span className={energySurplus >= 0 ? 'positive-value' : 'negative-value'}>
                                {energySurplus >= 0 ? `+${energySurplus.toLocaleString()}` : energySurplus.toLocaleString()} kWh
                              </span>
                            ) : '—'}
                          </p>
                          <p className="info-card-row">
                            <strong>Costo de Generación:</strong> {c.statusStatement.energy?.generationCost != null ? `${c.statusStatement.energy.generationCost} créditos/kWh` : '—'}
                          </p>
                          <small style={{ color: '#64748b' }}>
                            {c.statusStatement.validUntil ? `Válido hasta: ${new Date(c.statusStatement.validUntil).toLocaleTimeString()}` : 'Sin fecha límite'}
                          </small>
                        </>
                      ) : (
                        <p className="page-subtitle" style={{ fontStyle: 'italic', margin: '0.5rem 0' }}>
                          Aún no llega el status-statement de la central
                        </p>
                      )}
                    </div>

                    <div className="info-card">
                      <h4 className="info-card-title">2. Transferencia de Fondos (transfer)</h4>
                      {c.fundsReceived != null ? (
                        <>
                          <p className="transfer-amount">+{c.fundsReceived.toLocaleString()} créditos</p>
                          <p className="page-subtitle">Presupuesto inicial enviado por la central[cite: 1, 3].</p>
                        </>
                      ) : (
                        <p className="page-subtitle" style={{ fontStyle: 'italic', margin: '0.5rem 0' }}>
                          Aún sin fondos recibidos
                        </p>
                      )}
                    </div>
                  </div>

                  {/* demand-statements */}
                  <div>
                    <h4 className="info-card-title">3. Demandas Impuestas (demand-statement)</h4>
                    {(!c.demandStatements || c.demandStatements.length === 0) ? (
                      <p className="page-subtitle">Sin órdenes obligatorias en este ciclo[cite: 1, 3].</p>
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
                          {c.demandStatements.map((d, idx) => {
                            const isPositive = (d?.quantity ?? 0) >= 0;
                            const total = Math.abs(d?.quantity ?? 0) * (d?.valuePerKwh ?? 0);
                            return (
                              <tr key={idx}>
                                <td><strong>{d?.quantity != null ? `${d.quantity.toLocaleString()} kWh` : '—'}</strong></td>
                                <td>{d?.valuePerKwh != null ? `${d.valuePerKwh} créditos` : '—'}</td>
                                <td className={isPositive ? 'positive-value' : 'negative-value'}>
                                  {d?.quantity != null ? (isPositive ? `+${d.quantity.toLocaleString()} kWh` : `${d.quantity.toLocaleString()} kWh`) : '—'}
                                </td>
                                <td className={isPositive ? 'negative-value' : 'positive-value'}>
                                  {d?.quantity != null && d?.valuePerKwh != null ? (isPositive ? `-${total.toLocaleString()}` : `+${total.toLocaleString()}`) : '—'} créditos
                                </td>
                                <td>{d?.appliedAt ? new Date(d.appliedAt).toLocaleTimeString() : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* negociaciones */}
                  <div>
                    <h4 className="info-card-title">4. Negociaciones Voluntarias</h4>
                    {(!c.voluntaryNegotiations || c.voluntaryNegotiations.length === 0) ? (
                      <p className="page-subtitle">Sin negociaciones voluntarias en este ciclo[cite: 1, 3].</p>
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
                          {c.voluntaryNegotiations.map((neg, idx) => (
                            <tr key={idx}>
                              <td><code>{neg?.proposalId || 'N/A'}</code></td>
                              <td><strong>{neg?.direction ? neg.direction.toUpperCase() : '—'}</strong></td>
                              <td>{neg?.quantity != null ? `${neg.quantity.toLocaleString()} kWh` : '—'}</td>
                              <td>{neg?.pricePerEnergy != null ? `${neg.pricePerEnergy} créditos` : '—'}</td>
                              <td>
                                <span className={`status-badge ${neg?.status === 'paid' ? 'badge-paid' : 'badge-timeout'}`}>
                                  {neg?.status ? neg.status.toUpperCase() : 'DESCONOCIDO'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* reporte */}
                  <div className="final-report-card">
                    {c.negotiationReport ? (
                      <>
                        <div>
                          <h4 className="final-report-title">5. Reporte Emitido (negotiation-report)</h4>
                          {c.negotiationReport.sentAt ? (
                            <>
                              <p className="page-subtitle">Reportado sin multas a la central[cite: 1, 3].</p>
                              <small style={{ color: '#166534' }}>
                                Emitido a las: {new Date(c.negotiationReport.sentAt).toLocaleTimeString()}
                              </small>
                            </>
                          ) : (
                            <p className="page-subtitle" style={{ fontStyle: 'italic', margin: 0 }}>
                              Reporte aún no enviado (se emite en los últimos 5 minutos del ciclo)
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="summary-label">Balances Declarados:</div>
                          <div className="final-report-declared">
                            {c.negotiationReport.budgetBalance != null ? `${c.negotiationReport.budgetBalance.toLocaleString()} créditos` : '—'}
                            {' | '}
                            {c.negotiationReport.energyBalance != null ? `${c.negotiationReport.energyBalance.toLocaleString()} kWh` : '—'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <h4 className="final-report-title">5. Reporte Emitido (negotiation-report)</h4>
                        <p className="page-subtitle" style={{ fontStyle: 'italic', margin: 0 }}>
                          Reporte aún no enviado (se emite en los últimos 5 minutos del ciclo)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CyclesErrorBoundary>
    </div>
  );
};