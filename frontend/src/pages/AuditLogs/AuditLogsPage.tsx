// src/pages/AuditLogsPage.tsx
import React, { useEffect, useState } from 'react';
import { ApiService } from '../../services/apiService';
import type { AuditLogsResponse } from '../../types/api';
import './AuditLogsPage.css';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiService.getAuditLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Cargando auditoría...</div>;
  if (!logs) return <div>Error al cargar los registros.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Registro de Auditoría y Anomalías (RF05)</h2>
          <p className="page-subtitle">Evidencia de idempotencia, rechazos y descartes para la demo en vivo.</p>
        </div>
      </div>

      <section className="audit-section">
        <h3 className="audit-section-title-dup">1. Mensajes Duplicados Ignorados (Idempotencia)</h3>
        <p className="page-subtitle">
          Mensajes con clave de idempotencia (`idpk`) repetida. El ledger no se modifica dos veces.
        </p>
        <table className="data-table table-duplicates">
          <thead>
            <tr>
              <th>idpk</th>
              <th>Tipo Mensaje</th>
              <th>MsgID Duplicado</th>
              <th>Acción Ejecutada</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.duplicates.map((dup, idx) => (
              <tr key={idx}>
                <td><code>{dup.idpk}</code></td>
                <td>{dup.type}</td>
                <td><code>{dup.duplicateMsgId}</code></td>
                <td className="action-highlight">{dup.action}</td>
                <td>{new Date(dup.detectedAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="audit-section">
        <h3 className="audit-section-title-rej">2. Mensajes Rechazados (NACK) y Descartes</h3>
        <p className="page-subtitle">
          Mensajes malformados, tipos desconocidos o descartados por falta de msgId.
        </p>
        <table className="data-table table-rejected">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>msgId</th>
              <th>Razón (reason)</th>
              <th>Código</th>
              <th>Mensaje de Detalle</th>
            </tr>
          </thead>
          <tbody>
            {logs.rejectedMessages.map((rej, idx) => (
              <tr key={idx}>
                <td><strong>{rej.type.toUpperCase()}</strong></td>
                <td><code>{rej.msgId || 'null (descartado)'}</code></td>
                <td>{rej.reason}</td>
                <td>{rej.code ?? 'N/A'}</td>
                <td>{rej.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};