// src/pages/MarketLivePage.tsx
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { MarketLiveResponse } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './MarketLivePage.css';

export const MarketLivePage: React.FC = () => {
  const [data, setData] = useState<MarketLiveResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = () => {
    setLoading(true);
    setError(null);
    ApiService.getMarketLive()
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Error al consultar el mercado en vivo:', err);
        setError('No se pudo conectar con el mercado en vivo (cola market.{CODE}).');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMarket();
    // Sondeo periódico opcional cada 10 segundos
    const interval = setInterval(fetchMarket, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Mercado en Vivo (RF02)</h2>
          <p className="page-subtitle">
            Libro de ofertas activas entre ciudades. El precio efectivo incluye el costo de transporte por kWh hasta nuestro nodo.
          </p>
          {data && (
            <p className="market-meta">
              <strong>Nodo Local:</strong> {data.cityId || '—'} |{' '}
              <strong>Última sincronización:</strong>{' '}
              {data.updatedAt ? new Date(data.updatedAt).toLocaleTimeString() : '—'}
            </p>
          )}
        </div>
        <button onClick={fetchMarket} className="btn-primary">
          Refrescar Mercado
        </button>
      </div>

      {loading && !data && <div>Cargando libro de ofertas en vivo...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={fetchMarket} />}

      {!loading && !error && data && (
        <>
          {data.offers.length === 0 ? (
            <p className="empty-market-text">
              No hay ofertas activas en el exchange del mercado en este momento.
            </p>
          ) : (
            <table className="data-table market-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>ID Oferta</th>
                  <th>Energía Disponible</th>
                  <th>Precio Oferta</th>
                  <th>Distancia</th>
                  <th>Costo Transporte</th>
                  <th>Precio Efectivo</th>
                  <th>Estado Ruta</th>
                </tr>
              </thead>
              <tbody>
                {data.offers.map((offer) => {
                  const isRouteDisabled = !offer.routeEnabled;

                  return (
                    <tr
                      key={offer.offerId}
                      className={isRouteDisabled ? 'row-route-disabled' : ''}
                    >
                      <td>
                        <strong>{offer.cityId}</strong>
                        {offer.cityId === 'MET' && (
                          <span className="badge-met">CENTRAL</span>
                        )}
                      </td>
                      <td>
                        <code>{offer.offerId.slice(0, 8)}...</code>
                      </td>
                      <td>
                        <strong>{offer.remainingEnergy.toLocaleString()}</strong> kWh
                      </td>
                      <td>{offer.pricePerEnergy.toFixed(2)} cr/kWh</td>
                      <td>
                        {offer.distanceKm != null
                          ? `${offer.distanceKm.toLocaleString()} km`
                          : `${(offer.distance / 1000).toLocaleString()} km`}
                      </td>
                      <td>
                        <span className={isRouteDisabled ? 'penalty-rate' : ''}>
                          +{offer.transportCostPerKwh.toFixed(4)} cr/kWh
                        </span>
                      </td>
                      <td>
                        <strong className="effective-price-value">
                          {offer.effectivePrice.toFixed(2)}
                        </strong>{' '}
                        <small>cr/kWh</small>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            offer.routeEnabled ? 'badge-enabled' : 'badge-disabled'
                          }`}
                        >
                          {offer.routeEnabled ? 'Habilitada' : 'Penalizada'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
};