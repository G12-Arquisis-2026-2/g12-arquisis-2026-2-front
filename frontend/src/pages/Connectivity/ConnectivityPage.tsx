// src/pages/ConnectivityPage.tsx
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { ConnectivityResponse } from '../../types/api';
import './ConnectivityPage.css';

export const ConnectivityPage: React.FC = () => {
  const [data, setData] = useState<ConnectivityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getConnectivity()
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Cargando tabla de conectividad...</div>;
  if (!data) return <div>No se pudo cargar la información de conectividad.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Conectividad y Rutas de Transmisión (RF02)</h2>
          <p className="page-subtitle">
            <strong>Nodo Ciudad:</strong> {data.cityId} | <strong>Última actualización:</strong> {new Date(data.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

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
    </div>
  );
};