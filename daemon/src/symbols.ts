import { SymbolInfo, SymbolCategory } from './types';

/**
 * Complete catalog of supported symbols:
 * FOREX Majors, Commodities, Metals, CFDs, Futures
 */
export const SYMBOL_CATALOG: SymbolInfo[] = [
  // ─── FOREX MAJORS ───────────────────────────────────────────
  { yahoo: 'EURUSD=X', tradingView: 'FX:EURUSD', displayName: 'EUR/USD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'GBPUSD=X', tradingView: 'FX:GBPUSD', displayName: 'GBP/USD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'USDJPY=X', tradingView: 'FX:USDJPY', displayName: 'USD/JPY', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'USDCHF=X', tradingView: 'FX:USDCHF', displayName: 'USD/CHF', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'AUDUSD=X', tradingView: 'FX:AUDUSD', displayName: 'AUD/USD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'USDCAD=X', tradingView: 'FX:USDCAD', displayName: 'USD/CAD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'NZDUSD=X', tradingView: 'FX:NZDUSD', displayName: 'NZD/USD', category: 'forex', group: 'FOREX Majors' },

  // ─── FUTURES: INDICES ───────────────────────────────────────
  { yahoo: 'ES=F', tradingView: 'CME_MINI:ES1!', displayName: 'S&P 500 E-mini (ES)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'NQ=F', tradingView: 'CME_MINI:NQ1!', displayName: 'Nasdaq 100 E-mini (NQ)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'YM=F', tradingView: 'CBT:YM1!', displayName: 'Dow E-mini (YM)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'RTY=F', tradingView: 'CME_MINI:RTY1!', displayName: 'Russell 2000 (RTY)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'VX=F', tradingView: 'CBOE:VIX', displayName: 'VIX (Volatility)', category: 'futures_indices', group: 'Futures — Indices' },

  // ─── FUTURES: ENERGY ────────────────────────────────────────
  { yahoo: 'CL=F', tradingView: 'NYMEX:CL1!', displayName: 'WTI Crude Oil (CL)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'BZ=F', tradingView: 'NYMEX:BZ1!', displayName: 'Brent Crude Oil (BZ)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'NG=F', tradingView: 'NYMEX:NG1!', displayName: 'Natural Gas (NG)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'HO=F', tradingView: 'NYMEX:HO1!', displayName: 'Heating Oil (HO)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'RB=F', tradingView: 'NYMEX:RB1!', displayName: 'RBOB Gasoline (RB)', category: 'futures_energy', group: 'Futures — Energy' },

  // ─── FUTURES: METALS ────────────────────────────────────────
  { yahoo: 'GC=F', tradingView: 'COMEX:GC1!', displayName: 'Gold (GC)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'SI=F', tradingView: 'COMEX:SI1!', displayName: 'Silver (SI)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'PL=F', tradingView: 'NYMEX:PL1!', displayName: 'Platinum (PL)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'PA=F', tradingView: 'NYMEX:PA1!', displayName: 'Palladium (PA)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'HG=F', tradingView: 'COMEX:HG1!', displayName: 'Copper (HG)', category: 'futures_metals', group: 'Futures — Metals' },

  // ─── FUTURES: AGRICULTURE / COMMODITIES ─────────────────────
  { yahoo: 'ZC=F', tradingView: 'CBT:ZC1!', displayName: 'Corn (ZC)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ZS=F', tradingView: 'CBT:ZS1!', displayName: 'Soybeans (ZS)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ZW=F', tradingView: 'CBT:ZW1!', displayName: 'Wheat (ZW)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ZL=F', tradingView: 'CBT:ZL1!', displayName: 'Soybean Oil (ZL)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ZM=F', tradingView: 'CBT:ZM1!', displayName: 'Soybean Meal (ZM)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'KC=F', tradingView: 'ICEUS:KC1!', displayName: 'Coffee (KC)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'CT=F', tradingView: 'ICEUS:CT1!', displayName: 'Cotton (CT)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'SB=F', tradingView: 'ICEUS:SB1!', displayName: 'Sugar (SB)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'CC=F', tradingView: 'ICEUS:CC1!', displayName: 'Cocoa (CC)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'OJ=F', tradingView: 'ICEUS:OJ1!', displayName: 'Orange Juice (OJ)', category: 'futures_agriculture', group: 'Futures — Agriculture' },

  // ─── CRYPTO (via Binance on Yahoo) ──────────────────────────
  { yahoo: 'BTC-USD', tradingView: 'BINANCE:BTCUSDT', displayName: 'Bitcoin (BTC)', category: 'crypto', group: 'Crypto' },
  { yahoo: 'ETH-USD', tradingView: 'BINANCE:ETHUSDT', displayName: 'Ethereum (ETH)', category: 'crypto', group: 'Crypto' },
  { yahoo: 'SOL-USD', tradingView: 'BINANCE:SOLUSDT', displayName: 'Solana (SOL)', category: 'crypto', group: 'Crypto' },
  { yahoo: 'BNB-USD', tradingView: 'BINANCE:BNBUSDT', displayName: 'BNB', category: 'crypto', group: 'Crypto' },
  { yahoo: 'XRP-USD', tradingView: 'BINANCE:XRPUSDT', displayName: 'XRP', category: 'crypto', group: 'Crypto' },
];

/**
 * Get TradingView chart URL for a symbol
 */
export function getTradingViewUrl(yahooSymbol: string): string {
  const info = SYMBOL_CATALOG.find(s => s.yahoo === yahooSymbol);
  if (info) {
    return `https://www.tradingview.com/chart/?symbol=${info.tradingView}`;
  }
  // Fallback: search on TradingView
  return `https://www.tradingview.com/chart/?symbol=${yahooSymbol}`;
}

/**
 * Get all symbols grouped by category
 */
export function getSymbolsByGroup(): Record<string, SymbolInfo[]> {
  const groups: Record<string, SymbolInfo[]> = {};
  for (const sym of SYMBOL_CATALOG) {
    if (!groups[sym.group]) groups[sym.group] = [];
    groups[sym.group].push(sym);
  }
  return groups;
}

/**
 * Get all Yahoo symbols as flat array
 */
export function getAllYahooSymbols(): string[] {
  return SYMBOL_CATALOG.map(s => s.yahoo);
}

/**
 * Find symbol info by Yahoo symbol
 */
export function findSymbol(yahooSymbol: string): SymbolInfo | undefined {
  return SYMBOL_CATALOG.find(s => s.yahoo === yahooSymbol);
}

/**
 * Search symbols by query
 */
export function searchSymbols(query: string): SymbolInfo[] {
  const q = query.toLowerCase();
  return SYMBOL_CATALOG.filter(s =>
    s.yahoo.toLowerCase().includes(q) ||
    s.displayName.toLowerCase().includes(q) ||
    s.group.toLowerCase().includes(q) ||
    s.category.toLowerCase().includes(q)
  );
}
