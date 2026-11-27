// src/components/LiveActivityPanel.tsx
import React, { useMemo, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useEventFeed } from '../hooks/useEventFeed';
import type { FeedEventCategory, FeedEventRecord } from '../types/api';
import './LiveActivityPanel.css';

function classifyEvent(type: string): {
  category: FeedEventCategory;
  label: string;
} {
  if (type === 'alert-triggered') {
    return { category: 'alert', label: 'ALERTA' };
  }
  if (type.startsWith('saga-') || type === 'swap-settled') {
    return { category: 'saga', label: 'SAGA' };
  }
  if (type.startsWith('wallet-') || type === 'ledger-reconciled') {
    return { category: 'wallet', label: 'WALLET' };
  }
  return { category: 'market', label: 'MERCADO' };
}

function summarizePayload(ev: FeedEventRecord): string {
  const p = ev.payload || {};
  switch (ev.type) {
    case 'offer-published':
      return `Oferta ${p.sellerCityId || ''} — ${Number(p.quantity || 0).toLocaleString()} kWh @ ${p.price ?? '—'} cr/kWh`;
    case 'bid-placed':
    case 'bid-accepted':
    case 'bid-rejected':
      return `Bid (${p.counterparty || '—'}) — ${Number(p.quantity || 0).toLocaleString()} kWh${p.reason ? ` (${p.reason})` : ''}`;
    case 'wallet-transfer':
      return `Transferencia ${p.direction || ''} — $${Number(p.amount || 0).toLocaleString()} (${p.status || 'ok'})`;
    case 'ledger-reconciled':
      return `Reconciliación — Local: ${p.localBalance ?? '—'} | Wallet: ${p.walletBalance ?? '—'} (Δ ${p.delta ?? 0})`;
    case 'saga-started':
    case 'swap-settled':
    case 'saga-compensated':
    case 'saga-failed':
      return `Contraparte: ${p.counterparty || '—'}${p.amountKwh ? ` · ${Number(p.amountKwh).toLocaleString()} kWh` : ''}${p.reason ? ` · Motivo: ${p.reason}` : ''}`;
    case 'alert-triggered':
      return `[${p.severity || 'ALERT'}] ${p.title || p.alertCode || 'Incidente'}: ${p.details || ''}`;
    default:
      return JSON.stringify(p);
  }
}

export const LiveActivityPanel: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth0();
  const { events, status, errorMessage, clearFeed } = useEventFeed(true);
  const [filter, setFilter] = useState<'all' | FeedEventCategory>('all');
  const [collapsed, setCollapsed] = useState<boolean>(false);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter((ev) => classifyEvent(ev.type).category === filter);
  }, [events, filter]);

  const statusConfig = {
    connected: { text: 'Conectado (SSE en vivo)', dotClass: 'dot-connected' },
    connecting: { text: 'Conectando stream...', dotClass: 'dot-reconnecting' },
    reconnecting: { text: 'Reconectando...', dotClass: 'dot-reconnecting' },
    error: { text: 'Sin conexión SSE', dotClass: 'dot-error' },
  }[status];

  return (
    <section className="live-feed-card">
      <div className="live-feed-header">
        <div className="live-feed-title-group">
          <span className={`sse-status-dot ${statusConfig.dotClass}`} />
          <h3 className="live-feed-title">Actividad en Vivo (SSE)</h3>
          <span className="sse-status-label">{statusConfig.text}</span>
          <span className="live-feed-counter">{filteredEvents.length}</span>
        </div>

        <div className="live-feed-controls">
          {(['all', 'market', 'wallet', 'saga', 'alert'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`feed-filter-btn ${filter === cat ? 'active' : ''}`}
            >
              {cat === 'all'
                ? 'Todos'
                : cat === 'market'
                ? 'Mercado'
                : cat === 'wallet'
                ? 'Wallet'
                : cat === 'saga'
                ? 'Sagas'
                : 'Alertas'}
            </button>
          ))}
          <button onClick={clearFeed} className="feed-action-btn" title="Limpiar vista local">
            Limpiar
          </button>
          <button
            onClick={() => setCollapsed((prev) => !prev)}
            className="feed-action-btn"
          >
            {collapsed ? 'Expandir' : 'Minimizar'}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="live-feed-warning">{errorMessage}</div>
      )}

      {!collapsed && (
        <div className="live-feed-stream">
          {filteredEvents.length === 0 ? (
            <div className="live-feed-empty">
              Esperando eventos en tiempo real desde el backend...
            </div>
          ) : (
            filteredEvents.map((ev, idx) => {
              const { category, label } = classifyEvent(ev.type);
              return (
                <div
                  key={ev.id || `${ev.timestamp}-${idx}`}
                  className={`feed-item feed-item-${category}`}
                >
                  <div className="feed-item-top">
                    <div className="feed-item-badges">
                      <span className={`feed-cat-badge badge-${category}`}>{label}</span>
                      <code className="feed-event-type">{ev.type}</code>
                      {ev.id ? <span className="feed-seq-id">#{ev.id}</span> : null}
                    </div>
                    <span className="feed-timestamp">
                      {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : '—'}
                    </span>
                  </div>

                  <div className="feed-item-summary">{summarizePayload(ev)}</div>

                  {(ev.cycleId || ev.swapId || ev.idpk) && (
                    <div className="feed-item-correlation">
                      {ev.cycleId && <span>cycleId: <code>{ev.cycleId}</code></span>}
                      {ev.swapId && <span>swapId: <code>{ev.swapId}</code></span>}
                      {ev.idpk && <span>idpk: <code>{ev.idpk}</code></span>}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};