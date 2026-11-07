import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { MarketStrategy, MarketStrategyPayload }  from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './MarketAdminPage.css';

export const MarketAdminPage: React.FC = () => {
  const [strategy, setStrategy] = useState<MarketStrategyPayload>({
    sellPriceMultiplier: 1.1,
    maxBuyEffectivePriceRatio: 1.0,
    spanSeconds: 60,
  });

  const [activeStrategyMetadata, setActiveStrategyMetadata] = useState<MarketStrategy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const fetchStrategy = () => {
    setLoading(true);
    setError(null);
    ApiService.getMarketStrategy()
      .then((data) => {
        if (data) {
          setActiveStrategyMetadata(data);
          setStrategy({
            sellPriceMultiplier: data.sellPriceMultiplier ?? 1.1,
            maxBuyEffectivePriceRatio: data.maxBuyEffectivePriceRatio ?? 1.25,
            spanSeconds: data.spanSeconds ?? 60,
          });
        }
      })
      .catch((err) => {
        console.error('Error al obtener /market-strategy:', err);
        setError('No se pudo conectar con el endpoint /market-strategy.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const updated = await ApiService.updateMarketStrategy(strategy);
      setActiveStrategyMetadata(updated);
      setFeedback({
        text: 'Estrategia actualizada correctamente (HTTP 201/200). Se aplicará al siguiente ciclo.',
        isError: false,
      });
    } catch (err: any) {
      console.error('Error al actualizar estrategia:', err);
              const d = err.response?.data;
        const msg = d?.errors ? Object.entries(d.errors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join(' | ') : d?.error || d?.message || 'Error al guardar la nueva estrategia en el backend.';
      setFeedback({
        text: typeof msg === 'string' ? msg : JSON.stringify(msg),
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="page-title">Administración del Mercado (RF04)</h2>
          <p className="page-subtitle">
            Control de estrategias de compra/venta sin redeploy (AD6) contra <code>/market-strategy</code>.
          </p>
        </div>
        <button onClick={fetchStrategy} className="btn-primary" style={{ padding: '8px 16px', cursor: 'pointer' }}>
          Refrescar
        </button>
      </div>

      {loading && <div>Cargando estrategia actual...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={fetchStrategy} />}

      {!loading && !error && (
        <>
          {feedback && (
            <div className={`feedback-banner ${feedback.isError ? 'feedback-error' : 'feedback-success'}`}>
              {feedback.text}
            </div>
          )}

          {activeStrategyMetadata && (
            <div style={{ marginBottom: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              <strong>Estrategia ID:</strong> <code>{activeStrategyMetadata.id || 'N/A'}</code>
              {activeStrategyMetadata.createdAt && (
                <> | <strong>Creada:</strong> {new Date(activeStrategyMetadata.createdAt).toLocaleString()}</>
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="strategy-grid">
            {/* Parámetros de Venta */}
            <div className="config-card">
              <h3 className="config-card-title">1. Estrategia de Venta (Ofertas)</h3>
              
              <div className="form-group">
                <label>Multiplicador de Precio Venta (sellPriceMultiplier)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max="5.0"
                  value={strategy.sellPriceMultiplier}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      sellPriceMultiplier: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
                <small className="help-text">
                  Multiplicador sobre <code>generationCost</code>. Ej: <code>1.15</code> equivale a un 15% de margen.
                </small>
              </div>
            </div>

            {/* Parámetros de Compra */}
            <div className="config-card">
              <h3 className="config-card-title">2. Estrategia de Compra (Bids)</h3>

              <div className="form-group">
                <label>Ratio Máx. Precio Efectivo (maxBuyEffectivePriceRatio)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01" 
                  max="1"
                  value={strategy.maxBuyEffectivePriceRatio}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      maxBuyEffectivePriceRatio: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
                <small className="help-text">
                  Techo admisible para el precio efectivo (oferta + transporte) relativo al baseline.
                </small>
              </div>

              <div className="form-group">
                <label>Ventana de Espera - Span (spanSeconds)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="1200"
                  value={strategy.spanSeconds}
                  onChange={(e) =>
                    setStrategy({
                      ...strategy,
                      spanSeconds: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  required
                />
                <small className="help-text">
                  Segundos de pausa inicial antes de emitir bids de compra al exchange P2P.
                </small>
              </div>

              <div className="form-submit-container">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary btn-save"
                  style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? 'Guardando en BD...' : 'Aplicar Estrategia (PATCH)'}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
};