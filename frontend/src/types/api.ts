// src/types/api.ts

export type DecimalStringOrNumber = string | number;

export interface ApiErrorResponse {
  error: string | string[];
  detail?: string;
}

// ==========================================
// RF01: CICLOS Y PROTOCOLO P2P
// ==========================================

export interface StatusStatementEnergy {
  generationCapacity: number;
  consumption: number;
  generationCost: number;
}

export interface StatusStatement {
  energy: StatusStatementEnergy;
  validUntil: string;
}

export interface OwnOfferRecord {
  offerId: string;
  initialQuantity: number;
  remainingQuantity: number;
  pricePerEnergy: number;
  status: string;
  publishedAt?: string;
  updates?: Array<{
    remaining: number;
    updatedAt: string;
  }>;
}

export interface BidRecord {
  bidId?: string;
  offerId?: string;
  sourceCityId: string;
  targetCityId: string;
  quantity: number;
  status: 'bid-accepted' | 'bid-rejected' | 'pending';
  rejectionReason?: string | null;
  createdAt?: string;
}

export interface SwapCycleRecord {
  swapId: string;
  counterpartCityId: string;
  giveQuantity: number;
  giveUnit: string;
  takeQuantity: number;
  takeUnit: string;
  tokenVerified: boolean;
  status: 'pending' | 'settled' | 'rejected' | 'expired' | 'cancelled';
  statusReason?: string | null;
  timestamp?: string;
}

export interface TransportCharge {
  counterpartCityId: string;
  distanceKm: number;
  unitCost: number;
  totalCost: number;
  routeDisabledPenalty: boolean;
  appliedAt?: string;
}

export interface ImbalanceSettlement {
  coverageKwh: number;
  pricePerKwh: number;
  totalAmount: number;
  type: 'deficit' | 'surplus';
  settledAt?: string;
}

export interface NegotiationReport {
  budgetBalance: number;
  energyBalance: number;
  sentAt?: string;
}

export interface ReportTracking {
  missedAt?: string | null;
  tooEarly?: boolean;
  notBefore?: string | null;
}

export interface FinalBalances {
  budget: DecimalStringOrNumber;
  energy: DecimalStringOrNumber;
}

export type LastOperationType =
  | 'status-statement'
  | 'offer-published'
  | 'offer-updated'
  | 'bid-placed'
  | 'bid-accepted'
  | 'swap-proposed'
  | 'swap-settled'
  | 'trade-recorded'
  | 'negotiation-report'
  | 'imbalance-settlement'
  | 'transfer'
  | 'none'
  | string;

  // RF01 - CycleSummary E2
  export interface CycleSummary {
    cycleId: string;
    statusStatement?: StatusStatement;
    fundsReceived?: number;
    ownOffer?: OwnOfferRecord | null;
    bidsSent?: BidRecord[];
    bidsReceived?: BidRecord[];
    swaps?: SwapCycleRecord[];
    transportCharges?: TransportCharge[];
    imbalanceSettlement?: ImbalanceSettlement | null;
    negotiationReport?: NegotiationReport | null;
    finalBalances?: {
      budget: number;
      energy: number;
    };
    lastOperation?: string;
  }

// ==========================================
// RF02: MERCADO EN VIVO (LIVE BOOK & PRICING)
// ==========================================

export interface MarketOffer {
  offerId: string;
  cityId: string;
  pricePerEnergy: number;
  remainingEnergy: number;
  initialQuantity?: number;
  // Campos cruzados con la distance-table de tu ciudad
  distance: number; // en metros
  distanceKm: number;
  transportCostPerKwh: number;
  routeEnabled: boolean;
  effectivePrice: number; // pricePerEnergy + transportCostPerKwh
  publishedAt?: string;
}

export interface MarketLiveResponse {
  cityId: string;
  updatedAt: string;
  offers: MarketOffer[];
}

// Compatibilidad con la distance-table original si se consulta cruda
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

// ==========================================
// RF04: CONFIGURACIÓN DE ESTRATEGIA Y SWAPS
// ==========================================

export interface MarketSellerConfig {
  marginPercent: number;          // Margen sobre costo base (%)
  sellableFraction: number;        // Fracción de energía a vender (ej. 0.5 a 1.0)
  acceptancePolicy: 'FIFO' | 'HIGHEST_MARGIN' | 'LARGEST_QUANTITY';
}

export interface MarketBuyerConfig {
  waitSpanSeconds: number;        // Span en segundos antes de ofertar
  selectionPolicy: 'CHEAPEST_EFFECTIVE' | 'ENABLED_ROUTES_FIRST' | 'MET_FALLBACK';
}

export interface MarketConfig {
  seller: MarketSellerConfig;
  buyer: MarketBuyerConfig;
}

export interface SwapRecord {
  swapId: string;
  counterpartCityId: string;
  direction: 'give' | 'take';
  giveQuantity: number;
  giveUnit: string;
  takeQuantity: number;
  takeUnit: string;
  tokenVerified: boolean;
  status: 'pending' | 'settled' | 'rejected' | 'expired' | 'cancelled';
  statusReason?: string | null;
  updatedAt: string;
}

// ==========================================
// RF05: AUDITORÍA Y ANOMALÍAS
// ==========================================

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
  type: 'nack' | 'discarded' | 'identity_mismatch';
}

export interface AuditLogsResponse {
  duplicates: DuplicateLog[];
  rejectedMessages: RejectedMessageLog[];
}

// ==========================================
// RF06: EXPERIMENTO DE SPAN
// ==========================================

export interface SpanCycleData {
  cycleId: string;
  configuredSpanSeconds: number;
  initialDeficitKwh: number;
  coveredDeficitKwh: number;
  effectiveCostPaid: number;
  baselineCost: number; // 3 * imbalancePrice * deficit
  bidsRejectedCount: number;
  completedAt?: string;
}

export interface SpanAggregateMetrics {
  spanSeconds: number;
  totalCyclesEvaluated: number;
  averageSavingsPercent: number; // Porcentaje de ahorro respecto al baseline
  purchaseSuccessRate: number;    // % o ratio de compras exitosas (ej: 0.85 -> 85%)
  totalBidsRejected: number;
}

export interface SpanExperimentResponse {
  cyclesHistory: SpanCycleData[];
  aggregates: SpanAggregateMetrics[];
}