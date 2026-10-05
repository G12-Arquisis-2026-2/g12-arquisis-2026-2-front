// src/pages/ProposalsPage.tsx
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { VoluntaryNegotiation } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './ProposalsPage.css';

export const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<VoluntaryNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [cycleId, setCycleId] = useState('cycle-9431');
  const [direction, setDirection] = useState<'take' | 'give'>('take');
  const [quantity, setQuantity] = useState<number>(1000);
  const [pricePerEnergy, setPricePerEnergy] = useState<number>(210);
  const [feedback, setFeedback] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchProposals = () => {
    setLoading(true);
    setError(null);
    ApiService.getProposals()
      .then(setProposals)
      .catch((err) => {
        console.error('Error fetching proposals:', err);
        setError('No se pudo conectar con la API para obtener el listado de negociaciones.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProposals();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await ApiService.createProposal({
        cycleId,
        direction,
        quantity: Number(quantity),
        pricePerEnergy: Number(pricePerEnergy),
      });
      setFeedback({ text: res.message, isError: false });
      fetchProposals();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Error al emitir la oferta hacia la API.';
      setFeedback({ text: msg, isError: true });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Panel de Negociaciones Voluntarias (RF04)</h2>
          <p className="page-subtitle">Emisión y control de órdenes con ventana de confirmación de 30s.</p>
        </div>
      </div>

      <section className="proposal-form-container">
        <h3 style={{ margin: '0 0 1rem 0' }}>Nueva Propuesta</h3>
        {feedback && (
          <div
            className="feedback-message"
            style={{ color: feedback.isError ? '#dc2626' : '#0284c7' }}
          >
            {feedback.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="proposal-form">
          <div className="form-group">
            <label>Cycle ID:</label>
            <input type="text" value={cycleId} onChange={(e) => setCycleId(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Dirección:</label>
            <select value={direction} onChange={(e) => setDirection(e.target.value as 'take' | 'give')}>
              <option value="take">Comprar (take)</option>
              <option value="give">Vender (give)</option>
            </select>
          </div>
          <div className="form-group">
            <label>Cantidad (kWh):</label>
            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>Precio Techo:</label>
            <input type="number" step="0.1" min="1" value={pricePerEnergy} onChange={(e) => setPricePerEnergy(Number(e.target.value))} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Enviar Oferta
            </button>
          </div>
        </form>
      </section>

      <h3 style={{ marginBottom: '0.5rem' }}>Historial de Negociaciones</h3>
      {loading && <p>Cargando ofertas...</p>}

      {error && !loading && <ErrorMessage message={error} onRetry={fetchProposals} />}

      {!loading && !error && (
        <table className="data-table">
          <thead>
            <tr style={{ background: '#e2e8f0' }}>
              <th>ID</th>
              <th>Dirección</th>
              <th>Cantidad</th>
              <th>Precio Techo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((prop, idx) => {
              const identifier = prop.id || prop.proposalId || `prop-${idx}`;

              return (
                <tr key={identifier}>
                  <td><code>{identifier}</code></td>
                  <td><strong>{prop.direction.toUpperCase()}</strong></td>
                  <td>{prop.quantity.toLocaleString()} kWh</td>
                  <td>{prop.pricePerEnergy}</td>
                  <td>
                    <span className={`status-badge ${
                      prop.status === 'paid' ? 'badge-paid' : prop.status === 'timeout' ? 'badge-timeout' : 'badge-confirmed'
                    }`}>
                      {prop.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};