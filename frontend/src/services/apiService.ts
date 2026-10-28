// src/services/apiService.ts
import { apiClient } from './httpClient';
import type {
  CycleSummary,
  MarketLiveResponse,
  MarketConfig,
  SwapRecord,
  AuditLogsResponse,
} from '../types/api';

export const ApiService = {
  // RF01: Historial de ciclos
  async getCycles(): Promise<CycleSummary[]> {
    const res = await apiClient.get<{ cycles: CycleSummary[] }>('/cycles');
    return res.data.cycles;
  },

  async getCurrentCycle(): Promise<CycleSummary> {
    const res = await apiClient.get<{ cycle: CycleSummary }>('/cycles/current');
    return res.data.cycle;
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

  // RF05: Logs de auditoría y anomalías
  async getAuditLogs(): Promise<AuditLogsResponse> {
    const res = await apiClient.get<AuditLogsResponse>('/audit-logs');
    return res.data;
  },
};