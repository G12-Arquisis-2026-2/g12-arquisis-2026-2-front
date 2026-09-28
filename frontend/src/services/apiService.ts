// src/services/apiService.ts
import { apiClient } from './httpClient';
import type {
  CycleSummary,
  ConnectivityResponse,
  VoluntaryNegotiation,
  AuditLogsResponse,
} from '../types/api';

// --- DATOS MOCK DE RESPALDO (Basados en Enunciado E1) ---
const MOCK_CYCLES: CycleSummary[] = [
  {
    cycleId: 'cycle-9431',
    statusStatement: {
      energy: {
        generationCapacity: 1234512,
        consumption: 1444121,
        generationCost: 210,
      },
      validUntil: '2026-09-01T14:20:00Z',
    },
    fundsReceived: 508145,
    demandStatements: [
      {
        quantity: 1500,
        valuePerKwh: 215,
        appliedAt: '2026-09-01T14:05:00Z',
      },
    ],
    voluntaryNegotiations: [
      {
        proposalId: 'prop-001',
        direction: 'take',
        quantity: 2024,
        pricePerEnergy: 210,
        status: 'paid',
        createdAt: '2026-09-01T14:08:00Z',
      },
    ],
    negotiationReport: {
      budgetBalance: 131212,
      energyBalance: 1232,
      sentAt: '2026-09-01T14:15:00Z',
    },
    finalBalances: {
      budget: 131212,
      energy: 1232,
    },
    lastOperation: 'negotiation-report',
  },
];

const MOCK_CONNECTIVITY: ConnectivityResponse = {
  cityId: 'COR',
  updatedAt: new Date().toISOString(),
  distances: {
    HGW: { distance: 62763183, transportCost: 0.0034, enabled: true },
    TAR: { distance: 94306517, transportCost: 0.0013, enabled: true },
    TAL: { distance: 45012399, transportCost: 0.0025, enabled: false },
    LSN: { distance: 120543210, transportCost: 0.0041, enabled: true },
  },
};

const MOCK_PROPOSALS: VoluntaryNegotiation[] = [
  {
    proposalId: 'prop-101',
    direction: 'take',
    quantity: 2024,
    pricePerEnergy: 210,
    status: 'confirmed',
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
  },
  {
    proposalId: 'prop-102',
    direction: 'give',
    quantity: 500,
    pricePerEnergy: 220.5,
    status: 'timeout',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

const MOCK_AUDIT: AuditLogsResponse = {
  duplicates: [
    {
      idpk: 'a81c12e2-9b21-4f11-b0d3-1a2f4c5e6d78',
      originalMsgId: 'msg-001',
      duplicateMsgId: 'msg-002',
      type: 'demand-statement',
      detectedAt: new Date(Date.now() - 5 * 60000).toISOString(),
      action: 'ignored_ledger_unchanged',
    },
  ],
  rejectedMessages: [
    {
      msgId: 'msg-999',
      reason: 'MALFORMED_MESSAGE',
      code: 422,
      message: 'quantity must be a positive number',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      type: 'nack',
    },
    {
      msgId: 'msg-888',
      reason: 'IDPK_EQUALS_MSGID',
      code: 422,
      message: 'idpk and msgId must differ',
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      type: 'nack',
    },
    {
      msgId: null,
      reason: 'UNPARSEABLE_OR_MISSING_MSGID',
      code: null,
      message: 'Dropped silently to logs',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      type: 'discarded',
    },
  ],
};

// --- MÉTODOS DEL SERVICIO ---
export const ApiService = {
  // RF01: Historial de ciclos
  async getCycles(): Promise<CycleSummary[]> {
    try {
      const res = await apiClient.get<{ cycles: CycleSummary[] }>('/cycles');
      return res.data.cycles;
    } catch {
      return MOCK_CYCLES;
    }
  },

  // RF02: Tabla de distancias
  async getConnectivity(): Promise<ConnectivityResponse> {
    try {
      const res = await apiClient.get<ConnectivityResponse>('/connectivity');
      return res.data;
    } catch {
      return MOCK_CONNECTIVITY;
    }
  },

  // RF04: Listar propuestas voluntarias
  async getProposals(): Promise<VoluntaryNegotiation[]> {
    try {
      const res = await apiClient.get<{ proposals: VoluntaryNegotiation[] }>('/proposals');
      return res.data.proposals;
    } catch {
      return MOCK_PROPOSALS;
    }
  },

  // RF04: Crear propuesta voluntaria
  async createProposal(proposal: {
    cycleId: string;
    direction: 'take' | 'give';
    quantity: number;
    pricePerEnergy: number;
  }): Promise<{ status: string; message: string }> {
    try {
      const res = await apiClient.post('/proposals', proposal);
      return res.data;
    } catch {
      return {
        status: 'pending',
        message: '[Simulado Mock] Propuesta enviada exitosamente',
      };
    }
  },

  // RF05: Logs de auditoría
  async getAuditLogs(): Promise<AuditLogsResponse> {
    try {
      const res = await apiClient.get<AuditLogsResponse>('/audit-logs');
      return res.data;
    } catch {
      return MOCK_AUDIT;
    }
  },
};