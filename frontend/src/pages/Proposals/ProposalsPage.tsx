// src/pages/ProposalsPage.tsx
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { CycleSummary } from '../../types/api';
import type { VoluntaryNegotiation } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './ProposalsPage.css';

export const ProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<VoluntaryNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

// Estados del formulario
  const [cycleId, setCycleId] = useState<string>('');
  const [direction, setDirection] = useState<'take' | 'give'>('take');
  const [quantity, setQuantity] = useState<number>(1000);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [activeCycle, setActiveCycle] = useState<CycleSummary | null>(null);
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

  // Carga inicial del ciclo actual para alimentar el formulario
  useEffect(() => {
    fetchProposals();

    ApiService.getCurrentCycle()
      .then((cycle) => {
        if (cycle) {
          setCycleId(cycle.cycleId);
          setActiveCycle(cycle);
        }
      })
      .catch((err) => console.warn('No hay ciclo activo:', err));
  }, []);

  // Actualizar el precio calculado según el ciclo y la dirección (give / take)
  useEffect(() => {
    if (!activeCycle) {
      setCalculatedPrice(null);
      return;
    }

    const genCost = activeCycle.statusStatement?.energy?.generationCost || 210;

    // Si es give (vender), el precio base es el costo de generación
    // Si es take (comprar), se propone el costo de generación o precio de referencia
    if (direction === 'give') {
      setCalculatedPrice(genCost);
    } else {
      setCalculatedPrice(genCost);
    }
  }, [activeCycle, direction]);

  // Si el usuario cambia manualmente el Cycle ID en el input, intentar buscar ese ciclo
  const handleCycleIdChange = async (newId: string) => {
    setCycleId(newId);
    if (!newId.trim()) {
      setActiveCycle(null);
      return;
    }
    try {
      const cycle = await ApiService.getCycleById(newId);
      setActiveCycle(cycle);
    } catch {
      setActiveCycle(null);
    }
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!activeCycle) {
      setFeedback({
        text: 'El ciclo especificado no existe en el sistema. Ingrese un Cycle ID válido.',
        isError: true,
      });
      return;
    }

    try {
      const res = await ApiService.createProposal({
        cycleId,
        direction,
        quantity: Number(quantity),
        pricePerEnergy: calculatedPrice ?? 0,
      });

      setFeedback({ text: res.message, isError: false });
      fetchProposals();
    } catch (err: any) {
      const errorData = err.response?.data?.error;
      const msg = Array.isArray(errorData)
        ? errorData.join(', ')
        : errorData || 'Error al emitir la oferta hacia la API.';
      setFeedback({ text: msg, isError: true });
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Panel de Negociaciones Voluntarias (RF04)</h2>
          <p className="page-subtitle">Emisión y control de órdenes con ventana de confirmación de 30s[cite: 1].</p>
        </div>
      </div>

      <section className="proposal-form-container">
        <h3>Nueva Propuesta</h3>
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
            <input
              type="text"
              value={cycleId}
              onChange={(e) => handleCycleIdChange(e.target.value)}
              placeholder="Ej: cycle-9431"
              required
            />
            {!activeCycle && cycleId && (
              <small style={{ color: '#dc2626', marginTop: '4px' }}>
                Ciclo no encontrado
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Dirección:</label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'take' | 'give')}
            >
              <option value="take">Comprar (take)</option>
              <option value="give">Vender (give)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad (kWh):</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </div>

          {/* Campo de Precio: Solo lectura, calculado por el backend/ciclo */}
          <div className="form-group">
            <label>
              {direction === 'give' ? 'Precio Piso (Costo Gen.)' : 'Precio Referencia'}
            </label>
            <input
              type="text"
              value={
                calculatedPrice !== null
                  ? `${calculatedPrice} créditos/kWh`
                  : activeCycle
                  ? 'Calculando...'
                  : 'Requiere ciclo válido'
              }
              readOnly
              disabled={!activeCycle}
            />
            <small style={{ color: '#64748b', marginTop: '4px' }}>
              {direction === 'give'
                ? 'Fijado por el costo de generación del ciclo.'
                : 'Definido automáticamente según las reglas del ciclo.'}
            </small>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={!activeCycle || (calculatedPrice ?? 0) <= 0}
            >
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
              <th>Precio</th>
              <th>Estado</th>
              <th>Motivo / Razón</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((prop, idx) => {
              const identifier = prop?.id || prop?.proposalId || `prop-${idx}`;
              return (
                <tr key={identifier}>
                  <td><code>{identifier}</code></td>
                  <td><strong>{prop?.direction ? prop.direction.toUpperCase() : '—'}</strong></td>
                  <td>{prop?.quantity != null ? `${prop.quantity.toLocaleString()} kWh` : '—'}</td>
                  <td>{prop?.pricePerEnergy != null ? `${prop.pricePerEnergy} créditos` : '—'}</td>
                  <td>
                    <span className={`status-badge ${
                      prop?.status === 'paid' ? 'badge-paid' : prop?.status === 'timeout' ? 'badge-timeout' : 'badge-confirmed'
                    }`}>
                      {prop?.status ?? 'DESCONOCIDO'}
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