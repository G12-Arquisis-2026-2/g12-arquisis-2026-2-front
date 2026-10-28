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
  generationCapacity: DecimalStringOrNumber;
  consumption: DecimalStringOrNumber;
  generationCost: DecimalStringOrNumber;
}

export interface StatusStatement {
  energy: StatusStatementEnergy;
  validUntil: string;
}

export interface OwnOfferRecord {
  offerId: string;
  initialQuantity: DecimalStringOrNumber;
  remainingQuantity: DecimalStringOrNumber;
  pricePerEnergy: DecimalStringOrNumber;
  status: 'active' | 'exhausted' | 'cancelled';
  updates?: Array<{
    timestamp: string;
    remainingQuantity: DecimalStringOrNumber;
  }>;
}

export interface BidRecord {
  bidId?: string;
  offerId?: string;
  counterpartyCityId: string;
  direction: 'sent' | 'received';
  quantity: DecimalStringOrNumber;
  pricePerEnergy: DecimalStringOrNumber;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: 'QUANTITY_UNAVAILABLE' | 'MARKET_CLOSED' | 'BELOW_MIN_BID' | string | null;
  createdAt?: string;
}

export interface TransportChargeRecord {
  tradeId?: string;
  counterpartyCityId: string;
  energyTransferred: DecimalStringOrNumber;
  distance: number; // metros o km
  unitRate: DecimalStringOrNumber;
  isPenaltyRate: boolean; // true si la ruta estaba disabled
  totalCost: DecimalStringOrNumber;
  appliedAt?: string;
}

export interface ImbalanceSettlement {
  type: 'surplus' | 'deficit' | 'balanced';
  coverage: DecimalStringOrNumber; // Positivo (excedente) o negativo (déficit)
  unitPrice: DecimalStringOrNumber; // buybackPrice o imbalancePrice
  totalAmount: DecimalStringOrNumber;
  settledAt?: string;
}

export interface NegotiationReport {
  budgetBalance: DecimalStringOrNumber;
  energyBalance: DecimalStringOrNumber;
  sentAt?: string | null;
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

export interface CycleSummary {
  cycleId: string;
  statusStatement?: StatusStatement | null;
  fundsReceived?: number;
  ownOffer?: OwnOfferRecord | null;
  bidsSent?: BidRecord[];
  bidsReceived?: BidRecord[];
  swaps?: SwapRecord[];
  transportCharges?: TransportChargeRecord[];
  imbalanceSettlement?: ImbalanceSettlement | null;
  negotiationReport?: NegotiationReport | null;
  reportTracking?: ReportTracking;
  finalBalances?: FinalBalances;
  lastOperation?: LastOperationType;
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

export type SellerPolicy = 'FIFO' | 'HIGHEST_MARGIN' | 'LARGEST_QUANTITY';
export type BuyerPolicy = 'LOWEST_EFFECTIVE_PRICE' | 'PRIORITIZE_ENABLED_ROUTES' | 'TIERED_WITH_MET';

export interface SellerConfig {
  marginPercent: number; // Margen sobre costo de generación / base
  sellableFraction: number; // Fracción a poner en venta (0.0 a 1.0)
  minBidQuantity: number;
  acceptancePolicy: SellerPolicy;
}

export interface BuyerConfig {
  spanSeconds: number; // Tiempo de espera (span) antes de pujar
  maxAcceptableEffectivePrice?: number;
  selectionPolicy: BuyerPolicy;
}

export interface MarketConfig {
  seller: SellerConfig;
  buyer: BuyerConfig;
}

export type SwapStatus =
  | 'proposed'
  | 'token_verified'
  | 'settled'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface SwapRecord {
  swapId: string;
  cycleId?: string;
  proposerCityId: string;
  acceptorCityId: string;
  giveKwh: DecimalStringOrNumber;
  takeCredits: DecimalStringOrNumber;
  token?: string;
  tokenVerified?: boolean;
  status: SwapStatus;
  statusReason?: string | null;
  createdAt: string;
  settledAt?: string | null;
}

// ==========================================
// RF05: AUDITORÍA Y ANOMALÍAS
// ==========================================

export interface DuplicateLog {
  idpk: string;
  originalMsgId: string | null;
  duplicateMsgId: string | null;
  type: string | null;
  detectedAt: string;
  action: 'ignored_ledger_unchanged' | string;
}

export interface RejectedMessageLog {
  msgId: string | null;
  reason: 'IDENTITY_MISMATCH' | 'MALFORMED_MESSAGE' | 'BELOW_MIN_BID' | string;
  code: number | null;
  message: string;
  timestamp: string;
  type: 'nack' | 'discarded' | 'error';
}

export interface AuditLogsResponse {
  duplicates: DuplicateLog[];
  rejectedMessages: RejectedMessageLog[];
}

// ==========================================
// RF06: EXPERIMENTO DE SPAN
// ==========================================

export interface CycleSpanExperimentRecord {
  cycleId: string;
  spanSeconds: number;
  initialDeficitKwh: number;
  coveredKwh: number;
  effectiveCostPaid: number;
  baselineCost: number; // 3 * imbalancePrice * deficit
  savingsAmount: number; // baselineCost - effectiveCostPaid
  savingsPercentage: number;
  rejectedBidsCount: number;
}

export interface SpanAggregateMetrics {
  spanSeconds: number;
  totalCyclesTested: number;
  averageSavingsPercentage: number;
  successPurchaseRate: number; // 0.0 a 1.0 (o porcentaje)
  totalRejectedBids: number;
}

export interface SpanExperimentResponse {
  historyByCycle: CycleSpanExperimentRecord[];
  aggregatedBySpan: SpanAggregateMetrics[];
}