import { useEffect, useRef, useState, useCallback } from 'react';
import { ApiService } from '../services/apiService';
import type { FeedEventRecord } from '../types/api';

export type SseConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error';

const KNOWN_EVENT_TYPES = [
  'offer-published',
  'bid-placed',
  'bid-accepted',
  'bid-rejected',
  'wallet-transfer',
  'ledger-reconciled',
  'saga-started',
  'swap-settled',
  'saga-compensated',
  'saga-failed',
  'alert-triggered',
];

const MAX_FEED_ITEMS = 100;

export function useEventFeed(enabled = true) {
  const [events, setEvents] = useState<FeedEventRecord[]>([]);
  const [status, setStatus] = useState<SseConnectionStatus>('connecting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastEventIdRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const isUnmountedRef = useRef<boolean>(false);

  const appendEvent = useCallback((incoming: FeedEventRecord) => {
    if (incoming.id && incoming.id > lastEventIdRef.current) {
      lastEventIdRef.current = incoming.id;
    }

    setEvents((prev) => {
      // Evita duplicados si un evento llegó tanto por snapshot como por stream
      if (incoming.id && prev.some((e) => e.id === incoming.id)) {
        return prev;
      }
      const next = [incoming, ...prev];
      return next.slice(0, MAX_FEED_ITEMS);
    });
  }, []);

  const clearFeed = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    isUnmountedRef.current = false;

    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

    const connectStream = async (isRetry = false) => {
      if (isUnmountedRef.current) return;

      setStatus(isRetry ? 'reconnecting' : 'connecting');
      setErrorMessage(null);

      try {
        // 1. Si es la primera carga, hidratar con snapshot histórico
        if (!isRetry && lastEventIdRef.current === 0) {
          const snapshot = await ApiService.getFeedSnapshot(30);
          if (!isUnmountedRef.current && snapshot.length > 0) {
            const sortedDesc = [...snapshot].sort((a, b) => b.id - a.id);
            lastEventIdRef.current = sortedDesc[0].id;
            setEvents(sortedDesc.slice(0, MAX_FEED_ITEMS));
          }
        }

        // 2. Pedir ticket efímero de un solo uso (TTL 30s)
        const { ticket } = await ApiService.createFeedTicket();
        if (isUnmountedRef.current) return;

        // 3. Construir URL con ticket y lastEventId como respaldo de reconexión
        const params = new URLSearchParams({ ticket });
        if (lastEventIdRef.current > 0) {
          params.set('lastEventId', String(lastEventIdRef.current));
        }

        const es = new EventSource(`${baseUrl}/events/stream?${params.toString()}`);
        eventSourceRef.current = es;

        es.onopen = () => {
          if (!isUnmountedRef.current) {
            setStatus('connected');
            setErrorMessage(null);
          }
        };

        const handleIncomingMessage = (event: MessageEvent) => {
          try {
            const parsed: FeedEventRecord = JSON.parse(event.data);
            const numericId = Number(event.lastEventId || parsed.id || 0);
            appendEvent({
              ...parsed,
              id: numericId || parsed.id,
              type: parsed.type || event.type,
            });
          } catch (err) {
            console.error('Error parseando evento SSE:', err, event.data);
          }
        };

        // Registrar listeners para todos los eventos nombrados del contrato
        KNOWN_EVENT_TYPES.forEach((eventName) => {
          es.addEventListener(eventName, handleIncomingMessage as EventListener);
        });

        // Fallback por si llega un evento genérico sin campo "event:"
        es.onmessage = handleIncomingMessage;

        // EventSource nativo intenta reutilizar la misma URL al reconectar, lo que
        // fallaría con 401 porque el ticket es de un solo uso. Cerramos y pedimos uno nuevo.
        es.onerror = () => {
          es.close();
          eventSourceRef.current = null;

          if (!isUnmountedRef.current) {
            setStatus('reconnecting');
            reconnectTimerRef.current = window.setTimeout(() => {
              connectStream(true);
            }, 3000);
          }
        };
      } catch (err) {
        console.error('Error iniciando conexión SSE:', err);
        if (!isUnmountedRef.current) {
          setStatus('error');
          setErrorMessage('No se pudo obtener ticket SSE. Reintentando en 5s...');
          reconnectTimerRef.current = window.setTimeout(() => {
            connectStream(true);
          }, 5000);
        }
      }
    };

    connectStream(false);

    return () => {
      isUnmountedRef.current = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
    };
  }, [enabled, appendEvent]);

  return {
    events,
    status,
    errorMessage,
    clearFeed,
  };
}