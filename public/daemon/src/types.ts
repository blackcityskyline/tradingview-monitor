export interface PriceAlert {
  id: string;
  symbol: string;
  displayName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  enabled: boolean;
  triggered: boolean;
  repeatEvery: number;
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
  yahoo: string;
  tradingView: string;
  displayName: string;
  category: SymbolCategory;
  group: string;
}

export interface PriceData {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  marketState: string;
  lastUpdate: number;
}

export interface DaemonConfig {
  port: number;
  pollInterval: number;
  dataDir: string;
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
