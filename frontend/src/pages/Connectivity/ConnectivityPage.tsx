// src/pages/ConnectivityPage.tsx
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { ConnectivityResponse } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './ConnectivityPage.css';

export const ConnectivityPage: React.FC = () => {
  const [data, setData] = useState<ConnectivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectivity = () => {
    setLoading(true);
    setError(null);
    ApiService.getConnectivity()
      .then((res) => setData(res))
      .catch((err) => {
        console.error('Error fetching connectivity:', err);
        setError('No se pudo conectar con la API para consultar la tabla de distancias.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConnectivity();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Conectividad y Rutas de Transmisión (RF02)</h2>
          {data && (
            <p className="page-subtitle">
              <strong>Nodo Ciudad:</strong> {data.cityId} | <strong>Última actualización:</strong> {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : 'Sin datos'}
            </p>
          )}
        </div>
        <button onClick={fetchConnectivity} className="btn-primary">
          Refrescar Rutas
        </button>
      </div>

      {loading && <div>Cargando tabla de conectividad...</div>}

      {error && !loading && <ErrorMessage message={error} onRetry={fetchConnectivity} />}

      {!loading && !error && data && (
        <table className="data-table connectivity-table">
          <thead>
            <tr>
              <th>Ciudad Destino</th>
              <th>Distancia (km)</th>
              <th>Costo Transporte (créditos/kWh·km)</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.distances).map(([destCode, route]) => (
              <tr key={destCode}>
                <td><strong>{destCode}</strong></td>
                <td>{(route.distance / 1000).toLocaleString()} km</td>
                <td>{route.transportCost}</td>
                <td>
                  <span className={`status-badge ${route.enabled ? 'badge-enabled' : 'badge-disabled'}`}>
                    {route.enabled ? 'Habilitada' : 'Deshabilitada'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};