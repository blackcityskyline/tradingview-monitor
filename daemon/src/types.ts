export interface PriceAlert {
  id: string;
  symbol: string;           // Yahoo Finance symbol (e.g. "EURUSD=X", "ES=F")
  displayName: string;      // Human-readable name
  targetPrice: number;
  condition: 'above' | 'below';
  enabled: boolean;
  triggered: boolean;
  repeatEvery: number;      // seconds, 0 = one-time
  createdAt: number;
  triggeredAt?: number;
  lastNotifiedPrice?: number;
  category: SymbolCategory;
}

export type SymbolCategory = 
  | 'forex'
  | 'futures_indices'
  | 'futures_energy'
  | 'futures_metals'
  | 'futures_agriculture'
  | 'crypto';

export interface SymbolInfo {
  yahoo: string;            // Yahoo Finance symbol
  tradingView: string;      // TradingView symbol for URL
  displayName: string;
  category: SymbolCategory;
  group: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  prevClose: number;
  prevPrice?: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  marketState: string;
  lastUpdate: number;
}

export interface DaemonConfig {
  port: number;
  pollInterval: number;     // seconds between price checks
  dataDir: string;          // where to store state
  pidFile: string;
  logFile: string;
  alerts: PriceAlert[];
  soundEnabled: boolean;
  notificationUrgency: 'low' | 'normal' | 'critical';
}

export interface DaemonStatus {
  running: boolean;
  uptime: number;
  pid: number;
  alertsCount: number;
  activeAlerts: number;
  triggeredAlerts: number;
  symbolsTracked: number;
  lastPoll: number;
  version: string;
}
