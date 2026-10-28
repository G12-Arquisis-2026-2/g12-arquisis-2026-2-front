import React, { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import type { CycleSummary } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { CyclesErrorBoundary } from '../../components/CyclesErrorBoundary';
import './CyclesPage.css';

const ITEMS_PER_PAGE = 5;

export const CyclesPage: React.FC = () => {
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [currentCycle, setCurrentCycle] = useState<CycleSummary | null>(null);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState<number>(1);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.allSettled([
      ApiService.getCycles(),
      ApiService.getCurrentCycle(),
    ]).then(([cyclesRes, currentRes]) => {
      if (cyclesRes.status === 'fulfilled') setCycles(cyclesRes.value || []);
      if (currentRes.status === 'fulfilled') setCurrentCycle(currentRes.value || null);
      if (cyclesRes.status === 'rejected' && currentRes.status === 'rejected') {
        setError('No se pudo conectar con la API para obtener el historial de ciclos.');
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // Reiniciar a la página 1 si cambia el listado
  useEffect(() => {
    setCurrentPage(1);
  }, [cycles.length]);

  const toggleCycle = (cycleId: string) => {
    setExpandedCycleId((prev) => (prev === cycleId ? null : cycleId));
  };

  const isCurrentExpired = currentCycle?.statusStatement?.validUntil
    ? new Date(currentCycle.statusStatement.validUntil).getTime() < Date.now()
    : false;

  // Lógica de corte para mostrar máximo 5 por página
  const totalPages = Math.max(1, Math.ceil(cycles.length / ITEMS_PER_PAGE));
  const paginatedCycles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return cycles.slice(start, start + ITEMS_PER_PAGE);
  }, [cycles, currentPage]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Historial de Ciclos Energéticos (RF01 - E2)</h2>
          <p className="page-subtitle">
            Balances, ofertas publicadas, bids, swaps, transporte y liquidación final.
          </p>
        </div>
        <button onClick={loadData} className="btn-primary">
          Refrescar Ciclos
        </button>
      </div>

      {loading && <div>Cargando historial de ciclos...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={loadData} />}

      {/* Tarjeta destacada del ciclo actual */}
      {currentCycle && !error && !loading && (
        <div className="cycle-card current-cycle-highlight">
          <div className="current-cycle-header">
            <div className="current-cycle-title-group">
              <span className="current-cycle-badge">
                {isCurrentExpired ? 'ÚLTIMO CICLO' : 'EN CURSO'}
              </span>
              <strong className="current-cycle-id">Ciclo: {currentCycle.cycleId || '—'}</strong>
            </div>
            <div className="current-cycle-timer">
              {currentCycle.statusStatement?.validUntil
                ? (isCurrentExpired
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
              Fondos: <span>{currentCycle.fundsReceived != null ? `+${currentCycle.fundsReceived.toLocaleString()} créditos` : 'Aún sin fondos'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Lista de ciclos protegida con ErrorBoundary y limitada a 5 */}
      <CyclesErrorBoundary onReset={loadData}>
        {!loading && !error && cycles.length === 0 && (
          <p>No hay ciclos registrados en el ledger local.</p>
        )}

        {!loading && !error && paginatedCycles.map((c) => {
          const isExpanded = expandedCycleId === c.cycleId;
          const genCap = c.statusStatement?.energy?.generationCapacity;
          const cons = c.statusStatement?.energy?.consumption;
          const energySurplus = genCap != null && cons != null ? genCap - cons : null;

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
                  {/* 1. Status Statement & Fondos */}
                  <div className="info-cards-grid">
                    <div className="info-card">
                      <h4 className="info-card-title">1. Estado Inicial (status-statement)</h4>
                      {c.statusStatement ? (
                        <>
                          <p className="info-card-row"><strong>Generación:</strong> {c.statusStatement.energy?.generationCapacity?.toLocaleString() ?? '—'} kWh</p>
                          <p className="info-card-row"><strong>Consumo:</strong> {c.statusStatement.energy?.consumption?.toLocaleString() ?? '—'} kWh</p>
                          <p className="info-card-row">
                            <strong>Balance Inicial:</strong>{' '}
                            {energySurplus != null ? (
                              <span className={energySurplus >= 0 ? 'positive-value' : 'negative-value'}>
                                {energySurplus >= 0 ? `+${energySurplus.toLocaleString()}` : energySurplus.toLocaleString()} kWh
                              </span>
                            ) : '—'}
                          </p>
                          <p className="info-card-row"><strong>Costo Generación:</strong> {c.statusStatement.energy?.generationCost ?? '—'} créditos/kWh</p>
                          <small style={{ color: '#64748b' }}>
                            {c.statusStatement.validUntil ? `Válido hasta: ${new Date(c.statusStatement.validUntil).toLocaleTimeString()}` : 'Sin expiración'}
                          </small>
                        </>
                      ) : (
                        <p className="page-subtitle" style={{ fontStyle: 'italic' }}>Aún no llega el status-statement de la central</p>
                      )}
                    </div>

                    <div className="info-card">
                      <h4 className="info-card-title">2. Transferencia de Fondos (transfer)</h4>
                      {c.fundsReceived != null ? (
                        <>
                          <p className="transfer-amount">+{c.fundsReceived.toLocaleString()} créditos</p>
                          <p className="page-subtitle">Presupuesto inicial para transaccionar en el mercado.</p>
                        </>
                      ) : (
                        <p className="page-subtitle" style={{ fontStyle: 'italic' }}>Aún sin fondos recibidos</p>
                      )}
                    </div>
                  </div>

                  {/* 2. Oferta Propia en el Mercado */}
                  <div>
                    <h4 className="info-card-title">3. Oferta Propia Publicada (market.{'{CODE}'})</h4>
                    {c.ownOffer ? (
                      <div className="info-card" style={{ background: '#f8fafc' }}>
                        <p className="info-card-row"><strong>Offer ID:</strong> <code>{c.ownOffer.offerId}</code></p>
                        <p className="info-card-row">
                          <strong>Cantidad:</strong> {c.ownOffer.remainingQuantity?.toLocaleString()} kWh restantes (de {c.ownOffer.initialQuantity?.toLocaleString()} kWh iniciales)
                        </p>
                        <p className="info-card-row"><strong>Precio Base:</strong> {c.ownOffer.pricePerEnergy} créditos/kWh</p>
                        <p className="info-card-row"><strong>Estado:</strong> <span className="status-badge badge-paid">{c.ownOffer.status}</span></p>
                      </div>
                    ) : (
                      <p className="page-subtitle" style={{ fontStyle: 'italic' }}>Este nodo no publicó oferta como vendedor en este ciclo.</p>
                    )}
                  </div>

                  {/* 3. Bids Enviados y Recibidos */}
                  <div>
                    <h4 className="info-card-title">4. Bids (Enviados y Recibidos)</h4>
                    {(!c.bidsSent?.length && !c.bidsReceived?.length) ? (
                      <p className="page-subtitle" style={{ fontStyle: 'italic' }}>No se registraron bids en este ciclo.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th>Tipo</th>
                            <th>Origen → Destino</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                            <th>Motivo / Razón</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.bidsSent?.map((bid, i) => (
                            <tr key={`sent-${i}`}>
                              <td><strong>ENVIADO (Compra)</strong></td>
                              <td>{bid.sourceCityId} → {bid.targetCityId}</td>
                              <td>{bid.quantity.toLocaleString()} kWh</td>
                              <td>
                                <span className={`status-badge ${bid.status === 'bid-accepted' ? 'badge-paid' : 'badge-timeout'}`}>
                                  {bid.status}
                                </span>
                              </td>
                              <td>{bid.rejectionReason || '—'}</td>
                            </tr>
                          ))}
                          {c.bidsReceived?.map((bid, i) => (
                            <tr key={`rec-${i}`}>
                              <td><strong>RECIBIDO (Venta)</strong></td>
                              <td>{bid.sourceCityId} → {bid.targetCityId}</td>
                              <td>{bid.quantity.toLocaleString()} kWh</td>
                              <td>
                                <span className={`status-badge ${bid.status === 'bid-accepted' ? 'badge-paid' : 'badge-timeout'}`}>
                                  {bid.status}
                                </span>
                              </td>
                              <td>{bid.rejectionReason || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* 4. Swaps P2P Realizados */}
                  <div>
                    <h4 className="info-card-title">5. Swaps en Wallet</h4>
                    {(!c.swaps || c.swaps.length === 0) ? (
                      <p className="page-subtitle" style={{ fontStyle: 'italic' }}>No se procesaron swaps en este ciclo.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th>Swap ID</th>
                            <th>Contraparte</th>
                            <th>Entrega (Give)</th>
                            <th>Recibe (Take)</th>
                            <th>Token Verificado</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.swaps.map((s, idx) => (
                            <tr key={idx}>
                              <td><code>{s.swapId.slice(0, 8)}...</code></td>
                              <td><strong>{s.counterpartCityId}</strong></td>
                              <td>{s.giveQuantity.toLocaleString()} {s.giveUnit}</td>
                              <td>{s.takeQuantity.toLocaleString()} {s.takeUnit}</td>
                              <td>{s.tokenVerified ? '✅ Sí' : '❌ No'}</td>
                              <td>
                                <span className={`status-badge ${s.status === 'settled' ? 'badge-paid' : 'badge-timeout'}`}>
                                  {s.status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* 5. Cargos de Transporte (trade-recorded) */}
                  <div>
                    <h4 className="info-card-title">6. Cargos de Transporte (trade-recorded)</h4>
                    {(!c.transportCharges || c.transportCharges.length === 0) ? (
                      <p className="page-subtitle" style={{ fontStyle: 'italic' }}>Sin cargos de transporte registrados.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr style={{ background: '#f1f5f9' }}>
                            <th>Ruta a Ciudad</th>
                            <th>Distancia</th>
                            <th>Tarifa Unit.</th>
                            <th>Total Cobrado</th>
                            <th>Penalización Ruta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {c.transportCharges.map((tc, idx) => (
                            <tr key={idx}>
                              <td><strong>{tc.counterpartCityId}</strong></td>
                              <td>{tc.distanceKm} km</td>
                              <td>{tc.unitCost} créditos/km</td>
                              <td className="negative-value">-{tc.totalCost.toLocaleString()} créditos</td>
                              <td>
                                {tc.routeDisabledPenalty ? (
                                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ Penalización Aplicada</span>
                                ) : (
                                  <span style={{ color: '#16a34a' }}>Normal</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* 6. Liquidación de Cierre (imbalance-settlement) */}
                  <div className="info-card" style={{ borderLeft: '4px solid #0284c7', background: '#f0f9ff' }}>
                    <h4 className="info-card-title" style={{ color: '#0369a1' }}>7. Liquidación por Desbalance (imbalance-settlement)</h4>
                    {c.imbalanceSettlement ? (
                      <div>
                        <p className="info-card-row">
                          <strong>Condición al cierre:</strong>{' '}
                          {c.imbalanceSettlement.type === 'surplus' ? (
                            <span className="positive-value">Excedente (+{c.imbalanceSettlement.coverageKwh.toLocaleString()} kWh)</span>
                          ) : (
                            <span className="negative-value">Déficit ({c.imbalanceSettlement.coverageKwh.toLocaleString()} kWh)</span>
                          )}
                        </p>
                        <p className="info-card-row"><strong>Precio Aplicado:</strong> {c.imbalanceSettlement.pricePerKwh} créditos/kWh</p>
                        <p className="info-card-row">
                          <strong>Monto Liquidado:</strong>{' '}
                          <span className={c.imbalanceSettlement.type === 'surplus' ? 'positive-value' : 'negative-value'}>
                            {c.imbalanceSettlement.type === 'surplus' ? '+' : '-'}${Math.abs(c.imbalanceSettlement.totalAmount).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    ) : (
                      <p className="page-subtitle" style={{ fontStyle: 'italic', margin: 0 }}>
                        Liquidación final aún no efectuada por la central.
                      </p>
                    )}
                  </div>

                  {/* 7. Reporte a la Central */}
                  <div className="final-report-card">
                    {c.negotiationReport ? (
                      <>
                        <div>
                          <h4 className="final-report-title">8. Reporte Emitido (negotiation-report)</h4>
                          {c.negotiationReport.sentAt ? (
                            <>
                              <p className="page-subtitle">Reportado sin multas a la central.</p>
                              <small style={{ color: '#166534' }}>
                                Emitido a las: {new Date(c.negotiationReport.sentAt).toLocaleTimeString()}
                              </small>
                            </>
                          ) : (
                            <p className="page-subtitle" style={{ fontStyle: 'italic', margin: 0 }}>
                              Reporte aún no enviado (se emite en los últimos 5 minutos del ciclo).
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
                        <h4 className="final-report-title">8. Reporte Emitido (negotiation-report)</h4>
                        <p className="page-subtitle" style={{ fontStyle: 'italic', margin: 0 }}>
                          Reporte aún no enviado (se emite en los últimos 5 minutos del ciclo).
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Barra de Paginación (solo si hay ciclos) */}
        {!loading && !error && cycles.length > 0 && (
          <div className="pagination-container">
            <span className="pagination-info">
              Mostrando {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, cycles.length)} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, cycles.length)} de {cycles.length} ciclos
            </span>
            <div className="pagination-actions">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                ← Anterior
              </button>
              <span className="pagination-current">
                Página {currentPage} de {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </CyclesErrorBoundary>
    </div>
  );
};