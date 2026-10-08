// RF01: Historial de Ciclos
export interface StatusStatementEnergy {
    generationCapacity: number;
    consumption: number;
    generationCost: number;
}
  
export interface StatusStatement {
    energy: StatusStatementEnergy;
    validUntil: string;
}
  
export interface DemandStatementRecord {
    quantity: number;
    valuePerKwh: number;
    appliedAt: string;
}
  
export interface VoluntaryNegotiation {
    id?: string | number;
    idpk?: string;
    proposalId?: string;
    cycleId?: string;
    cycle_id?: string;
    direction: 'take' | 'give';
    quantity: number;
    price_per_energy?: number;
    pricePerEnergy?: number;
    generation_cost?: number;
    status: string;
    status_reason?: string | null;
    created_at?: string;
    createdAt?: string;
  }
  
export interface NegotiationReport {
    budgetBalance: number;
    energyBalance: number;
    sentAt?: string;
}
  
export interface CycleSummary {
    cycleId: string;
    statusStatement: StatusStatement;
    fundsReceived: number;
    demandStatements: DemandStatementRecord[];
    voluntaryNegotiations: VoluntaryNegotiation[];
    negotiationReport: NegotiationReport;
    finalBalances: {
      budget: number;
      energy: number;
    };
    lastOperation: string;
}
  
// RF02: Conectividad / Tabla de distancias
export interface CityDistance {
    distance: number;
    transportCost: number;
    enabled: boolean;
}
  
export interface ConnectivityResponse {
    cityId: string;
    updatedAt: string;
    distances: Record<string, CityDistance>;
}
  
// RF05: Auditoría de anomalías
export interface DuplicateLog {
    idpk: string;
    originalMsgId: string;
    duplicateMsgId: string;
    type: string;
    detectedAt: string;
    action: string;
}

export interface RejectedMessageLog {
    msgId: string | null;
    reason: string;
    code: number | null;
    message: string;
    timestamp: string;
    type: 'nack' | 'discarded' | 'error';
}
  
export interface AuditLogsResponse {
    duplicates: DuplicateLog[];
    rejectedMessages: RejectedMessageLog[];
}