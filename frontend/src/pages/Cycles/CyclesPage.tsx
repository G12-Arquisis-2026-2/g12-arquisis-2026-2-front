import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { CycleSummary } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './CyclesPage.css';

export const CyclesPage: React.FC = () => {
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);

  const fetchCycles = () => {
    setLoading(true);
    setError(null);
    ApiService.getCycles()
      .then((data) => {
        setCycles(data);
        if (data.length > 0 && !expandedCycleId) {
          setExpandedCycleId(data[0].cycleId);
        }
      })
      .catch((err) => {
        console.error('Error fetching cycles:', err);
        setError('No se pudo conectar con la API para obtener el historial de ciclos.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const toggleCycle = (cycleId: string) => {
    setExpandedCycleId((prev) => (prev === cycleId ? null : cycleId));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Historial de Ciclos Energéticos (RF01)</h2>
          <p className="page-subtitle">
            Registro de balances, órdenes y reportes para cada ciclo de 2 horas.
          </p>
        </div>
        <button onClick={fetchCycles} className="btn-primary">
          Refrescar Ciclos
        </button>
      </div>

      {loading && <div>Cargando historial de ciclos...</div>}

      {error && !loading && <ErrorMessage message={error} onRetry={fetchCycles} />}

      {!loading && !error && cycles.length === 0 && (
        <p>No hay ciclos registrados en el ledger local.</p>
      )}

      {!loading && !error && (
        cycles.map((c) => {
          const isExpanded = expandedCycleId === c.cycleId;
          const energySurplus = c.statusStatement.energy.generationCapacity - c.statusStatement.energy.consumption;

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
                  <div className="info-cards-grid">
                    <div className="info-card">
                      <h4 className="info-card-title">1. Estado Inicial (status-statement)</h4>
                      <p className="info-card-row">
                        <strong>Generación:</strong> {c.statusStatement.energy.generationCapacity.toLocaleString()} kWh
                      </p>
                      <p className="info-card-row">
                        <strong>Consumo:</strong> {c.statusStatement.energy.consumption.toLocaleString()} kWh
                      </p>
                      <p className="info-card-row">
                        <strong>Balance Inicial:</strong>{' '}
                        <span className={energySurplus >= 0 ? 'positive-value' : 'negative-value'}>
                          {energySurplus >= 0 ? `+${energySurplus.toLocaleString()}` : energySurplus.toLocaleString()} kWh
                        </span>
                      </p>
                      <p className="info-card-row">
                        <strong>Costo de Generación:</strong> {c.statusStatement.energy.generationCost} créditos/kWh
                      </p>
                      <small style={{ color: '#64748b' }}>
                        Válido hasta: {new Date(c.statusStatement.validUntil).toLocaleTimeString()}
                      </small>
                    </div>

                    <div className="info-card">
                      <h4 className="info-card-title">2. Transferencia de Fondos (transfer)</h4>
                      <p className="transfer-amount">+{c.fundsReceived.toLocaleString()} créditos</p>
                      <p className="page-subtitle">Presupuesto inicial enviado por la central.</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="info-card-title">3. Demandas Impuestas (demand-statement)</h4>
                    {c.demandStatements.length === 0 ? (
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
                          {c.demandStatements.map((d, idx) => {
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

                  <div>
                    <h4 className="info-card-title">4. Negociaciones Voluntarias</h4>
                    {c.voluntaryNegotiations.length === 0 ? (
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
                        {c.voluntaryNegotiations.map((neg, idx) => (
                          <tr key={neg.id || neg.proposalId || idx}>
                            <td><code>{neg.id || neg.proposalId || 'N/A'}</code></td>
                            <td><strong>{neg.direction.toUpperCase()}</strong></td>
                            <td className="data-table-num">{neg.quantity.toLocaleString()} kWh</td>
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

                  <div className="final-report-card">
                    <div>
                      <h4 className="final-report-title">5. Reporte Emitido (negotiation-report)</h4>
                      <p className="page-subtitle">Reportado sin multas a la central.</p>
                      {c.negotiationReport.sentAt && (
                        <small style={{ color: '#166534' }}>
                          Emitido a las: {new Date(c.negotiationReport.sentAt).toLocaleTimeString()}
                        </small>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="summary-label">Balances Declarados:</div>
                      <div className="final-report-declared">
                        {c.negotiationReport.budgetBalance.toLocaleString()} créditos |{' '}
                        {c.negotiationReport.energyBalance.toLocaleString()} kWh
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};