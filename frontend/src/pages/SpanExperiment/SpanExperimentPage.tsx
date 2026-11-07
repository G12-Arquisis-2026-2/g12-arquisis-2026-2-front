import React, { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import type { SpanCycleData, SpanAggregateMetrics } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './SpanExperimentPage.css';

const ITEMS_PER_PAGE = 10;

export const SpanExperimentPage: React.FC = () => {
  const [cyclesHistory, setCyclesHistory] = useState<SpanCycleData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de paginación para el detalle histórico
  const [currentHistoryPage, setCurrentHistoryPage] = useState<number>(1);

  const fetchExperimentData = () => {
    setLoading(true);
    setError(null);
    ApiService.getSpanExperiment()
      .then((data) => {
        setCyclesHistory(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Error al obtener datos del experimento:', err);
        setError('No se pudo cargar la información del experimento de span.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExperimentData();
  }, []);

  // Resetea a la página 1 si cambia la cantidad de registros
  useEffect(() => {
    setCurrentHistoryPage(1);
  }, [cyclesHistory.length]);

  // Cálculo dinámico de agregados agrupados por spanSeconds
  const aggregates: SpanAggregateMetrics[] = useMemo(() => {
    if (!cyclesHistory || cyclesHistory.length === 0) return [];

    const groups: Record<
      number,
      {
        cyclesCount: number;
        totalBaseline: number;
        totalPaid: number;
        totalInitialDeficit: number;
        totalCoveredDeficit: number;
        totalRejected: number;
      }
    > = {};

    cyclesHistory.forEach((c: any) => {
      const span = Number(c.configuredSpanSeconds ?? c.spanSeconds ?? 0);
      const baseline = Number(c.baselineCost ?? 0);
      const paid = Number(c.effectiveCostPaid ?? 0);
      const initialDeficit = Number(c.initialDeficitKwh ?? 0);
      const coveredDeficit = Number(c.coveredDeficitKwh ?? c.coveredKwh ?? 0);
      const rejected = Number(c.bidsRejectedCount ?? c.rejectedBidsCount ?? 0);

      if (!groups[span]) {
        groups[span] = {
          cyclesCount: 0,
          totalBaseline: 0,
          totalPaid: 0,
          totalInitialDeficit: 0,
          totalCoveredDeficit: 0,
          totalRejected: 0,
        };
      }

      groups[span].cyclesCount += 1;
      groups[span].totalBaseline += baseline;
      groups[span].totalPaid += paid;
      groups[span].totalInitialDeficit += initialDeficit;
      groups[span].totalCoveredDeficit += coveredDeficit;
      groups[span].totalRejected += rejected;
    });

    return Object.entries(groups)
      .map(([spanStr, g]) => {
        const spanSeconds = Number(spanStr);
        const savingsAmount = g.totalBaseline - g.totalPaid;
        const averageSavingsPercent =
          g.totalBaseline > 0 ? (savingsAmount / g.totalBaseline) * 100 : 0;
        const purchaseSuccessRate =
          g.totalInitialDeficit > 0
            ? Math.min(1, g.totalCoveredDeficit / g.totalInitialDeficit)
            : 1;

        return {
          spanSeconds,
          totalCyclesEvaluated: g.cyclesCount,
          averageSavingsPercent,
          purchaseSuccessRate,
          totalBidsRejected: g.totalRejected,
        };
      })
      .sort((a, b) => a.spanSeconds - b.spanSeconds);
  }, [cyclesHistory]);

  // Paginación del detalle histórico (máximo 10 por página)
  const totalPages = Math.max(1, Math.ceil(cyclesHistory.length / ITEMS_PER_PAGE));
  const paginatedCyclesHistory = useMemo(() => {
    const start = (currentHistoryPage - 1) * ITEMS_PER_PAGE;
    return cyclesHistory.slice(start, start + ITEMS_PER_PAGE);
  }, [cyclesHistory, currentHistoryPage]);

  return (
    <div>
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 className="page-title">Experimento de Span de Compra (RF06)</h2>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Impacto del tiempo de espera de compra frente al baseline de la central (3 × imbalancePrice).
          </p>
        </div>
        <button
          onClick={fetchExperimentData}
          className="btn-primary"
          style={{ padding: '8px 16px', cursor: 'pointer' }}
        >
          Refrescar Datos
        </button>
      </div>

      {loading && <div>Cargando datos del experimento...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={fetchExperimentData} />}

      {!loading && !error && (
        <>
          {/* SECCIÓN 1: RENDIMIENTO AGREGADO */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem' }}>
              1. Rendimiento Agregado por Valor de Span
            </h3>

            {aggregates.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                No hay ciclos suficientes para calcular agregados.
              </p>
            ) : (
              <>
                <div className="experiment-grid">
                  {aggregates.map((agg) => (
                    <div key={agg.spanSeconds} className="metric-card">
                      <div className="metric-card-header">
                        Span: <span className="badge-span">{agg.spanSeconds}s</span> ({agg.totalCyclesEvaluated} ciclos)
                      </div>
                      <div className="metric-card-value">
                        <span
                          className={
                            agg.averageSavingsPercent >= 0
                              ? 'metric-savings-positive'
                              : 'metric-savings-negative'
                          }
                        >
                          {agg.averageSavingsPercent >= 0
                            ? `+${agg.averageSavingsPercent.toFixed(1)}%`
                            : `${agg.averageSavingsPercent.toFixed(1)}%`}
                        </span>
                        <small
                          style={{
                            fontSize: '0.75rem',
                            color: '#64748b',
                            fontWeight: 500,
                            display: 'block',
                          }}
                        >
                          Ahorro promedio vs Baseline
                        </small>
                      </div>
                      <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#475569' }}>
                        <div>
                          <strong>Tasa de éxito:</strong> {(agg.purchaseSuccessRate * 100).toFixed(1)}%
                        </div>
                        <div>
                          <strong>Rechazos totales:</strong> {agg.totalBidsRejected}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <table
                  className="data-table"
                  style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}
                >
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '8px' }}>Span Configurado</th>
                      <th style={{ padding: '8px' }}>Ciclos Evaluados</th>
                      <th style={{ padding: '8px' }}>Ahorro Promedio vs Baseline</th>
                      <th style={{ padding: '8px' }}>Tasa Éxito en Compras</th>
                      <th style={{ padding: '8px' }}>Bids Rechazados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggregates.map((agg) => (
                      <tr key={agg.spanSeconds} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}>
                          <span className="badge-span">{agg.spanSeconds}s</span>
                        </td>
                        <td style={{ padding: '8px' }}>{agg.totalCyclesEvaluated}</td>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>
                          <span
                            className={
                              agg.averageSavingsPercent >= 0
                                ? 'metric-savings-positive'
                                : 'metric-savings-negative'
                            }
                          >
                            {agg.averageSavingsPercent >= 0
                              ? `+${agg.averageSavingsPercent.toFixed(2)}%`
                              : `${agg.averageSavingsPercent.toFixed(2)}%`}
                          </span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          {(agg.purchaseSuccessRate * 100).toFixed(1)}%
                        </td>
                        <td style={{ padding: '8px' }}>{agg.totalBidsRejected}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          {/* SECCIÓN 2: HISTÓRICO POR CICLO PAGINADO A 10 */}
          <section>
            <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>
              2. Detalle Histórico por Ciclo
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Comparación entre el costo efectivo asumido en el mercado P2P y la liquidación obligatoria de la central.
            </p>

            <table
              className="data-table"
              style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}
            >
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '8px' }}>Ciclo</th>
                  <th style={{ padding: '8px' }}>Span</th>
                  <th style={{ padding: '8px' }}>Déficit Inicial</th>
                  <th style={{ padding: '8px' }}>Cubierto en Mercado</th>
                  <th style={{ padding: '8px' }}>Costo Pagado</th>
                  <th style={{ padding: '8px' }}>Baseline (3× Imbalance)</th>
                  <th style={{ padding: '8px' }}>Ahorro Obtenido</th>
                  <th style={{ padding: '8px' }}>Bids Rechazados</th>
                </tr>
              </thead>
              <tbody>
                {cyclesHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}
                    >
                      Aún no hay ciclos registrados para este experimento.
                    </td>
                  </tr>
                ) : (
                  paginatedCyclesHistory.map((cycle: any, idx: number) => {
                    const span = cycle.configuredSpanSeconds ?? cycle.spanSeconds ?? 0;
                    const initialDeficit = Number(cycle.initialDeficitKwh ?? 0);
                    const coveredDeficit = Number(cycle.coveredDeficitKwh ?? cycle.coveredKwh ?? 0);
                    const paid = Number(cycle.effectiveCostPaid ?? 0);
                    const baseline = Number(cycle.baselineCost ?? 0);
                    const rejected = Number(cycle.bidsRejectedCount ?? cycle.rejectedBidsCount ?? 0);
                    const savings = baseline - paid;
                    const savingsPercent =
                      baseline > 0 ? (savings / baseline) * 100 : 0;

                    return (
                      <tr
                        key={cycle.cycleId || idx}
                        style={{ borderBottom: '1px solid #e2e8f0' }}
                      >
                        <td style={{ padding: '8px' }}>
                          <code>{cycle.cycleId || '—'}</code>
                        </td>
                        <td style={{ padding: '8px' }}>
                          <span className="badge-span">{span}s</span>
                        </td>
                        <td style={{ padding: '8px' }}>
                          {initialDeficit.toLocaleString()} kWh
                        </td>
                        <td style={{ padding: '8px' }}>
                          {coveredDeficit.toLocaleString()} kWh
                        </td>
                        <td style={{ padding: '8px' }}>${paid.toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>${baseline.toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>
                          <span
                            className={
                              savings >= 0
                                ? 'metric-savings-positive'
                                : 'metric-savings-negative'
                            }
                            style={{ fontWeight: 'bold' }}
                          >
                            {savings >= 0
                              ? `+$${savings.toLocaleString()}`
                              : `-$${Math.abs(savings).toLocaleString()}`}
                          </span>
                          <span
                            className="baseline-diff"
                            style={{ color: savings >= 0 ? '#166534' : '#991b1b' }}
                          >
                            ({savingsPercent.toFixed(1)}%)
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {rejected > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                              {rejected}
                            </span>
                          ) : (
                            <span style={{ color: '#64748b' }}>0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Barra de Paginación */}
            {cyclesHistory.length > 0 && (
              <div className="pagination-container">
                <span className="pagination-info">
                  Mostrando {Math.min((currentHistoryPage - 1) * ITEMS_PER_PAGE + 1, cyclesHistory.length)} -{' '}
                  {Math.min(currentHistoryPage * ITEMS_PER_PAGE, cyclesHistory.length)} de{' '}
                  {cyclesHistory.length} ciclos
                </span>
                <div className="pagination-actions">
                  <button
                    className="pagination-btn"
                    disabled={currentHistoryPage === 1}
                    onClick={() => setCurrentHistoryPage((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <span className="pagination-current">
                    Página {currentHistoryPage} de {totalPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={currentHistoryPage === totalPages}
                    onClick={() => setCurrentHistoryPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};