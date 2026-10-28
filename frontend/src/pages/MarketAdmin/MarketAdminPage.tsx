import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { MarketConfig, SwapRecord } from '../../types/api';
import './MarketAdminPage.css';

export const MarketAdminPage: React.FC = () => {
  const [config, setConfig] = useState<MarketConfig>({
    seller: {
      marginPercent: 5,
      sellableFraction: 1.0,
      acceptancePolicy: 'FIFO',
    },
    buyer: {
      waitSpanSeconds: 60,
      selectionPolicy: 'CHEAPEST_EFFECTIVE',
    },
  });

  const [swaps, setSwaps] = useState<SwapRecord[]>([]);
  const [loadingConfig, setLoadingConfig] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  // Carga inicial de datos
  const loadData = () => {
    Promise.allSettled([ApiService.getMarketConfig(), ApiService.getCurrentSwaps()])
      .then(([configRes, swapsRes]) => {
        if (configRes.status === 'fulfilled') {
          setConfig(configRes.value);
        }
        if (swapsRes.status === 'fulfilled') {
          setSwaps(swapsRes.value);
        }
      })
      .finally(() => setLoadingConfig(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      ApiService.getCurrentSwaps().then(setSwaps).catch(console.error);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await ApiService.updateMarketConfig(config);
      setConfig(updated);
      setFeedback({ text: 'Configuración de estrategia actualizada correctamente.', isError: false });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al persistir la configuración del bot.';
      setFeedback({ text: typeof msg === 'string' ? msg : JSON.stringify(msg), isError: true });
    } finally {
      setSaving(false);
    }
  };

  if (loadingConfig) {
    return <div>Cargando parámetros de mercado...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Panel Admin Mercado  (RF04)</h2>
          <p className="page-subtitle">
            Control de estrategias de compra/venta sin redeploy (AD6) y monitor de swaps del ciclo activo.
          </p>
        </div>
        <button onClick={loadData} className="btn-primary">
          Actualizar Datos
        </button>
      </div>

      {feedback && (
        <div className={`feedback-banner ${feedback.isError ? 'feedback-error' : 'feedback-success'}`}>
          {feedback.text}
        </div>
      )}

      {/* SECCIÓN 1: Formulario de Estrategias */}
      <form onSubmit={handleSaveConfig} className="strategy-grid">
        {/* Tarjeta Vendedor */}
        <div className="config-card">
          <h3 className="config-card-title">Estrategia Vendedora (Oferta)</h3>
          
          <div className="form-group">
            <label>Margen sobre Costo (%)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={config.seller.marginPercent}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seller: { ...config.seller, marginPercent: parseFloat(e.target.value) || 0 },
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Fracción a Vender (0.1 a 1.0)</label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="1"
              value={config.seller.sellableFraction}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seller: { ...config.seller, sellableFraction: parseFloat(e.target.value) || 0.1 },
                })
              }
              required
            />
          </div>

          <div className="form-group">
            <label>Criterio de Aceptación de Bids</label>
            <select
              value={config.seller.acceptancePolicy}
              onChange={(e) =>
                setConfig({
                  ...config,
                  seller: { ...config.seller, acceptancePolicy: e.target.value as any },
                })
              }
            >
              <option value="FIFO">FIFO (Orden de llegada)</option>
              <option value="HIGHEST_MARGIN">Mayor Margen / Precio</option>
              <option value="LARGEST_QUANTITY">Mayor Volumen de Energía</option>
            </select>
          </div>
        </div>

        {/* Tarjeta Comprador */}
        <div className="config-card">
          <h3 className="config-card-title">Estrategia Compradora (Demanda)</h3>
          
          <div className="form-group">
            <label>Tiempo de Espera - Span (segundos)</label>
            <input
              type="number"
              step="5"
              min="0"
              max="1200"
              value={config.buyer.waitSpanSeconds}
              onChange={(e) =>
                setConfig({
                  ...config,
                  buyer: { ...config.buyer, waitSpanSeconds: parseInt(e.target.value, 10) || 0 },
                })
              }
              required
            />
            <small className="help-text">
              Pausa inicial antes de empezar a pujar en el mercado P2P.
            </small>
          </div>

          <div className="form-group">
            <label>Prioridad de Compra</label>
            <select
              value={config.buyer.selectionPolicy}
              onChange={(e) =>
                setConfig({
                  ...config,
                  buyer: { ...config.buyer, selectionPolicy: e.target.value as any },
                })
              }
            >
              <option value="CHEAPEST_EFFECTIVE">Menor Precio Efectivo (Oferta + Flete)</option>
              <option value="ENABLED_ROUTES_FIRST">Priorizar Rutas Habilitadas</option>
              <option value="MET_FALLBACK">Escalones de Compra con Central (MET)</option>
            </select>
          </div>

          <div className="form-submit-container">
            <button type="submit" disabled={saving} className="btn-primary btn-save">
              {saving ? 'Guardando...' : 'Aplicar Cambios en Caliente'}
            </button>
          </div>
        </div>
      </form>

      {/* SECCIÓN 2: Monitor de Swaps en Curso */}
      <div className="swaps-container">
        <h3 className="config-card-title">Swaps en Curso (Ciclo Activo)</h3>
        
        {swaps.length === 0 ? (
          <p className="empty-text">No hay propuestas de intercambio (swaps) activas en este ciclo.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Swap</th>
                <th>Ciudad Par</th>
                <th>Tipo</th>
                <th>Entregamos (Give)</th>
                <th>Recibimos (Take)</th>
                <th>Token</th>
                <th>Estado</th>
                <th>Última Act.</th>
              </tr>
            </thead>
            <tbody>
              {swaps.map((s) => (
                <tr key={s.swapId}>
                  <td><code>{s.swapId.slice(0, 8)}...</code></td>
                  <td><strong>{s.counterpartCityId}</strong></td>
                  <td>
                    <span className={`badge-direction ${s.direction}`}>
                      {s.direction.toUpperCase()}
                    </span>
                  </td>
                  <td>{s.giveQuantity.toLocaleString()} {s.giveUnit}</td>
                  <td>{s.takeQuantity.toLocaleString()} {s.takeUnit}</td>
                  <td>
                    <span className={s.tokenVerified ? 'token-ok' : 'token-pending'}>
                      {s.tokenVerified ? '✓ Verificado' : '⏳ En proceso'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge badge-${s.status}`}>
                      {s.status}
                    </span>
                    {s.statusReason && <small className="status-reason">{s.statusReason}</small>}
                  </td>
                  <td>{new Date(s.updatedAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};