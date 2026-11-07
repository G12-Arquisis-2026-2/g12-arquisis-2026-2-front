// src/services/apiService.ts
import { apiClient } from './httpClient';
import type {
  CycleSummary,
  SpanCycleData,
  MarketLiveResponse,
  MarketConfig,
  SwapRecord,
  AuditLogsResponse,
  MarketStrategyPayload,
  MarketStrategy
} from '../types/api';

export const ApiService = {
  // RF01: Historial de ciclos
  async getCycles(): Promise<CycleSummary[]> {
    const res = await apiClient.get<{ cycles: CycleSummary[] }>('/cycles');
    return res.data.cycles;
  },

  async getCurrentCycle(): Promise<CycleSummary | null> {
    try {
      const res = await apiClient.get<any>('/cycles/current');
      return res.data?.cycle || res.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        return null;
      }
      throw err;
    }
  },

  async getCycleById(id: string): Promise<CycleSummary> {
    const res = await apiClient.get<{ cycle: CycleSummary }>(`/cycles/${id}`);
    return res.data.cycle;
  },

  // RF02: Mercado en Vivo
  async getMarketLive(): Promise<MarketLiveResponse> {
    const res = await apiClient.get<MarketLiveResponse>('/market/live');
    return res.data;
  },

  // RF04: Configuración de mercado
  async getMarketConfig(): Promise<MarketConfig> {
    const res = await apiClient.get<MarketConfig>('/market/config');
    return res.data;
  },

  async updateMarketConfig(config: MarketConfig): Promise<MarketConfig> {
    const res = await apiClient.patch<{ status: string; config: MarketConfig }>(
      '/market/config',
      config
    );
    return res.data.config;
  },

  // RF04: Monitor de swaps en vivo
  async getCurrentSwaps(): Promise<SwapRecord[]> {
    const res = await apiClient.get<{ swaps: SwapRecord[] }>('/market/swaps');
    return res.data.swaps;
  },

  // RF04: Obtener estrategia actual del mercado
  async getMarketStrategy(): Promise<MarketStrategy> {
    const res = await apiClient.get<any>('/market-strategy');
    // Tolera tanto el objeto plano como si viene envuelto en { marketStrategy: ... }
    return res.data?.marketStrategy || res.data;
  },

  // RF04: Actualizar parámetros en caliente (PATCH /market-strategy enviando { marketStrategy: {...} })
  async updateMarketStrategy(payload: MarketStrategyPayload): Promise<MarketStrategy> {
    const res = await apiClient.patch<any>('/market-strategy', {
      marketStrategy: {
        sellPriceMultiplier: Number(payload.sellPriceMultiplier),
        maxBuyEffectivePriceRatio: Number(payload.maxBuyEffectivePriceRatio),
        spanSeconds: parseInt(String(payload.spanSeconds), 10),
      },
    });

    // Si responde 200 o 201 Created
    return res.data?.marketStrategy || res.data;
  },

  // RF05: Logs de auditoría y anomalías
  async getAuditLogs(): Promise<AuditLogsResponse> {
    const res = await apiClient.get<AuditLogsResponse>('/audit-logs');
    return res.data;
  },

  // RF06: Experimento de Span
  async getSpanExperiment(): Promise<SpanCycleData[]> {
    try {
      const res = await apiClient.get<any>('/experiments/span');
      if (Array.isArray(res.data)) {
        return res.data;
      }
      return res.data?.cyclesHistory || res.data?.cycles || res.data?.historyByCycle || [];
    } catch (err) {
      console.warn('/experiments/span no disponible o con error, retornando lista vacía');
      return [];
    }
  },
};