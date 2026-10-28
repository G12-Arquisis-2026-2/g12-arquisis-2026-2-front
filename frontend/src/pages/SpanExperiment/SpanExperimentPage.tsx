import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { SpanExperimentResponse } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './SpanExperimentPage.css';

export const SpanExperimentPage: React.FC = () => {
  const [data, setData] = useState<SpanExperimentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperimentData = () => {
    setLoading(true);
    setError(null);
    ApiService.getSpanExperiment()
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Error al obtener datos del experimento:', err);
        setError('No se pudo cargar la información del experimento de span.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchExperimentData();
  }, []);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Experimento de Span de Compra (RF06)</h2>
          <p className="page-subtitle" style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Impacto del tiempo de espera de compra frente al baseline de la central (3 × imbalancePrice).
          </p>
        </div>
        <button onClick={fetchExperimentData} className="btn-primary" style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Refrescar Datos
        </button>
      </div>

      {loading && <div>Cargando datos del experimento...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={fetchExperimentData} />}

      {!loading && !error && data && (
        <>
          {/* SECCIÓN 1: MÉTRICAS AGREGADAS POR SPAN */}
          <section style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ color: '#0f172a', marginBottom: '1rem' }}>
              1. Rendimiento Agregado por Valor de Span
            </h3>
            
            <div className="experiment-grid">
              {data.aggregates.map((agg) => (
                <div key={agg.spanSeconds} className="metric-card">
                  <div className="metric-card-header">
                    Span: <span className="badge-span">{agg.spanSeconds}s</span> ({agg.totalCyclesEvaluated} ciclos)
                  </div>
                  <div className="metric-card-value">
                    <span className={agg.averageSavingsPercent >= 0 ? 'metric-savings-positive' : 'metric-savings-negative'}>
                      {agg.averageSavingsPercent >= 0 ? `+${agg.averageSavingsPercent.toFixed(1)}%` : `${agg.averageSavingsPercent.toFixed(1)}%`}
                    </span>
                    <small style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, display: 'block' }}>
                      Ahorro promedio vs Baseline
                    </small>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#475569' }}>
                    <div><strong>Tasa de éxito:</strong> {(agg.purchaseSuccessRate * 100).toFixed(1)}%</div>
                    <div><strong>Rechazos totales:</strong> {agg.totalBidsRejected}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* TABLA COMPARATIVA DE AGREGADOS */}
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '1rem' }}>
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
                {data.aggregates.map((agg) => (
                  <tr key={agg.spanSeconds} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px' }}>
                      <span className="badge-span">{agg.spanSeconds}s</span>
                    </td>
                    <td style={{ padding: '8px' }}>{agg.totalCyclesEvaluated}</td>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>
                      <span className={agg.averageSavingsPercent >= 0 ? 'metric-savings-positive' : 'metric-savings-negative'}>
                        {agg.averageSavingsPercent >= 0 ? `+${agg.averageSavingsPercent.toFixed(2)}%` : `${agg.averageSavingsPercent.toFixed(2)}%`}
                      </span>
                    </td>
                    <td style={{ padding: '8px' }}>{(agg.purchaseSuccessRate * 100).toFixed(1)}%</td>
                    <td style={{ padding: '8px' }}>{agg.totalBidsRejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* SECCIÓN 2: HISTÓRICO POR CICLO */}
          <section>
            <h3 style={{ color: '#0f172a', marginBottom: '0.5rem' }}>
              2. Detalle Histórico por Ciclo
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
              Comparación entre el costo efectivo asumido en el mercado y la liquidación obligatoria de la central.
            </p>

            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
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
                {data.cyclesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                      Aún no hay ciclos registrados para este experimento.
                    </td>
                  </tr>
                ) : (
                  data.cyclesHistory.map((cycle) => {
                    const savings = cycle.baselineCost - cycle.effectiveCostPaid;
                    const savingsPercent = cycle.baselineCost > 0 ? (savings / cycle.baselineCost) * 100 : 0;

                    return (
                      <tr key={cycle.cycleId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px' }}><code>{cycle.cycleId}</code></td>
                        <td style={{ padding: '8px' }}><span className="badge-span">{cycle.configuredSpanSeconds}s</span></td>
                        <td style={{ padding: '8px' }}>{cycle.initialDeficitKwh.toLocaleString()} kWh</td>
                        <td style={{ padding: '8px' }}>{cycle.coveredDeficitKwh.toLocaleString()} kWh</td>
                        <td style={{ padding: '8px' }}>${cycle.effectiveCostPaid.toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>${cycle.baselineCost.toLocaleString()}</td>
                        <td style={{ padding: '8px' }}>
                          <span className={savings >= 0 ? 'metric-savings-positive' : 'metric-savings-negative'} style={{ fontWeight: 'bold' }}>
                            {savings >= 0 ? `+$${savings.toLocaleString()}` : `-$${Math.abs(savings).toLocaleString()}`}
                          </span>
                          <span className="baseline-diff" style={{ color: savings >= 0 ? '#166534' : '#991b1b' }}>
                            ({savingsPercent.toFixed(1)}%)
                          </span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          {cycle.bidsRejectedCount > 0 ? (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{cycle.bidsRejectedCount}</span>
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
          </section>
        </>
      )}
    </div>
  );
};