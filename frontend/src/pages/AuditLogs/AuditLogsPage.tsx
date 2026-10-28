import React, { useEffect, useState, useMemo } from 'react';
import { ApiService } from '../../services/apiService';
import type { AuditLogsResponse } from '../../types/api';
import { ErrorMessage } from '../../components/ErrorMessage';
import './AuditLogsPage.css';

const REJECTED_PER_PAGE = 7;

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterReason, setFilterReason] = useState<string>('ALL');

  // Estado de paginación para Mensajes Rechazados
  const [currentRejPage, setCurrentRejPage] = useState<number>(1);

  const fetchAuditLogs = () => {
    setLoading(true);
    setError(null);
    ApiService.getAuditLogs()
      .then(setLogs)
      .catch((err) => {
        console.error('Error fetching audit logs:', err);
        setError('No se pudo conectar con la API para obtener el registro de auditoría.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  // Filtrado de incidentes
  const filteredRejections = useMemo(() => {
    if (!logs?.rejectedMessages) return [];
    if (filterReason === 'ALL') return logs.rejectedMessages;
    if (filterReason === 'IDENTITY_MISMATCH') {
      return logs.rejectedMessages.filter(
        (r) => r.reason.includes('IDENTITY_MISMATCH') || r.type === 'identity_mismatch'
      );
    }
    return logs.rejectedMessages.filter((r) => r.type === filterReason);
  }, [logs, filterReason]);

  // Si cambia el filtro o los datos, se regresa a la página 1
  useEffect(() => {
    setCurrentRejPage(1);
  }, [filterReason, logs?.rejectedMessages?.length]);

  // Paginación: máximo 7 elementos
  const totalRejPages = Math.max(1, Math.ceil(filteredRejections.length / REJECTED_PER_PAGE));
  const paginatedRejections = useMemo(() => {
    const start = (currentRejPage - 1) * REJECTED_PER_PAGE;
    return filteredRejections.slice(start, start + REJECTED_PER_PAGE);
  }, [filteredRejections, currentRejPage]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Registro de Auditoría y Anomalías (RF05 - E2)</h2>
          <p className="page-subtitle">
            Evidencia de idempotencia (idpk), rechazos (NACK), descartes y descalificaciones por IDENTITY_MISMATCH.
          </p>
        </div>
        <button onClick={fetchAuditLogs} className="btn-primary">
          Refrescar Auditoría
        </button>
      </div>

      {loading && <div>Cargando auditoría...</div>}
      {error && !loading && <ErrorMessage message={error} onRetry={fetchAuditLogs} />}

      {!loading && !error && logs && (
        <>
          {/* SECCIÓN 1: DUPLICADOS IDPK */}
          <section className="audit-section">
            <h3 className="audit-section-title-dup">1. Mensajes Duplicados Ignorados (Idempotencia)</h3>
            <p className="page-subtitle">
              Mensajes con clave de idempotencia (`idpk`) ya registrada. El ledger y la wallet permanecen inalterados.
            </p>
            <table className="data-table table-duplicates">
              <thead>
                <tr>
                  <th>idpk</th>
                  <th>Tipo Mensaje</th>
                  <th>MsgID Duplicado</th>
                  <th>Acción Ejecutada</th>
                  <th>Hora Detección</th>
                </tr>
              </thead>
              <tbody>
                {logs.duplicates.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '12px' }}>
                      No se han detectado mensajes duplicados.
                    </td>
                  </tr>
                ) : (
                  logs.duplicates.map((dup, idx) => (
                    <tr key={idx}>
                      <td><code>{dup.idpk}</code></td>
                      <td>{dup.type}</td>
                      <td><code>{dup.duplicateMsgId}</code></td>
                      <td className="action-highlight">{dup.action}</td>
                      <td>{new Date(dup.detectedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          {/* SECCIÓN 2: RECHAZADOS PAGINADOS (MÁXIMO 7) */}
          <section className="audit-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="audit-section-title-rej">2. Mensajes Rechazados (NACK), IDENTITY_MISMATCH y Descartes</h3>
              
              {/* Filtro rápido */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filtrar:</label>
                <select 
                  value={filterReason} 
                  onChange={(e) => setFilterReason(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1.5px solid var(--jp-border-soft)' }}
                >
                  <option value="ALL">Todos los rechazos</option>
                  <option value="IDENTITY_MISMATCH">IDENTITY_MISMATCH</option>
                  <option value="nack">Solo NACKs</option>
                  <option value="discarded">Solo Descartes silenciosos</option>
                </select>
              </div>
            </div>

            <p className="page-subtitle">
              Mensajes con cabecera AMQP inconsistente con el payload, malformados o no parseables.
            </p>

            <table className="data-table table-rejected">
              <thead>
                <tr>
                  <th>Tipo / Error</th>
                  <th>msgId</th>
                  <th>Razón (reason)</th>
                  <th>Código</th>
                  <th>Mensaje de Detalle</th>
                  <th>Hora</th>
                </tr>
              </thead>
              <tbody>
                {filteredRejections.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '12px' }}>
                      No hay incidentes registrados para este filtro.
                    </td>
                  </tr>
                ) : (
                  paginatedRejections.map((rej, idx) => {
                    const isIdentityMismatch =
                      rej.reason.includes('IDENTITY_MISMATCH') || rej.type === 'identity_mismatch';
                    return (
                      <tr key={idx} style={isIdentityMismatch ? { backgroundColor: '#fee2e2' } : {}}>
                        <td>
                          {isIdentityMismatch ? (
                            <span style={{ color: '#dc2626', fontWeight: 900 }}>IDENTITY_MISMATCH</span>
                          ) : (
                            <strong>{rej.type.toUpperCase()}</strong>
                          )}
                        </td>
                        <td><code>{rej.msgId || 'null (descartado)'}</code></td>
                        <td><strong style={{ color: '#991b1b' }}>{rej.reason}</strong></td>
                        <td>{rej.code ?? 'N/A'}</td>
                        <td>{rej.message}</td>
                        <td>{rej.timestamp ? new Date(rej.timestamp).toLocaleTimeString() : '—'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Barra de Paginación para Rechazados (solo si hay elementos) */}
            {filteredRejections.length > 0 && (
              <div className="pagination-container">
                <span className="pagination-info">
                  Mostrando {Math.min((currentRejPage - 1) * REJECTED_PER_PAGE + 1, filteredRejections.length)} -{' '}
                  {Math.min(currentRejPage * REJECTED_PER_PAGE, filteredRejections.length)} de{' '}
                  {filteredRejections.length} rechazos
                </span>
                <div className="pagination-actions">
                  <button
                    className="pagination-btn"
                    disabled={currentRejPage === 1}
                    onClick={() => setCurrentRejPage((p) => Math.max(1, p - 1))}
                  >
                    ← Anterior
                  </button>
                  <span className="pagination-current">
                    Página {currentRejPage} de {totalRejPages}
                  </span>
                  <button
                    className="pagination-btn"
                    disabled={currentRejPage === totalRejPages}
                    onClick={() => setCurrentRejPage((p) => Math.min(totalRejPages, p + 1))}
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