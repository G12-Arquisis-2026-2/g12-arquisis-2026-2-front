// src/services/apiService.ts
import { apiClient } from './httpClient';
import type {
  CycleSummary,
  ConnectivityResponse,
  VoluntaryNegotiation,
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

  // RF02: Tabla de distancias y conectividad
  async getConnectivity(): Promise<ConnectivityResponse> {
    const res = await apiClient.get<ConnectivityResponse>('/connectivity');
    return res.data;
  },

  // RF04: Listar propuestas de negociación
  async getProposals(): Promise<VoluntaryNegotiation[]> {
    const res = await apiClient.get<{ proposals: VoluntaryNegotiation[] }>('/proposals');
    return res.data.proposals;
  },

  // RF04: Crear propuesta voluntaria
  async createProposal(proposal: {
    cycleId: string;
    direction: 'take' | 'give';
    quantity: number;
    pricePerEnergy: number;
  }): Promise<{ status: string; message: string }> {
    const res = await apiClient.post('/proposals', proposal);
    return res.data;
  },

  // RF05: Logs de auditoría y anomalías
  async getAuditLogs(): Promise<AuditLogsResponse> {
    const res = await apiClient.get<AuditLogsResponse>('/audit-logs');
    return res.data;
  },
};