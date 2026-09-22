import { SymbolInfo, SymbolCategory } from './types';

/**
 * Complete catalog of supported symbols:
 * FOREX Majors, Commodities, Metals, CFDs, Futures
 */
export const SYMBOL_CATALOG: SymbolInfo[] = [
  // ─── FOREX MAJORS ───────────────────────────────────────────
  { yahoo: 'FX:EURUSD', tradingView: 'FX:EURUSD', displayName: 'EUR/USD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FX:GBPUSD', tradingView: 'FX:GBPUSD', displayName: 'GBP/USD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FXCM:GBPUSD', tradingView: 'FXCM:GBPUSD', displayName: 'GBP/USD (FXCM)', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FX:USDJPY', tradingView: 'FX:USDJPY', displayName: 'USD/JPY', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FX:USDCHF', tradingView: 'FX:USDCHF', displayName: 'USD/CHF', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FX:AUDUSD', tradingView: 'FX:AUDUSD', displayName: 'AUD/USD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FX:USDCAD', tradingView: 'FX:USDCAD', displayName: 'USD/CAD', category: 'forex', group: 'FOREX Majors' },
  { yahoo: 'FX:NZDUSD', tradingView: 'FX:NZDUSD', displayName: 'NZD/USD', category: 'forex', group: 'FOREX Majors' },

  // ─── FUTURES: INDICES ───────────────────────────────────────
  { yahoo: 'CME_MINI:ES1!', tradingView: 'CME_MINI:ES1!', displayName: 'S&P 500 E-mini (ES)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'CME_MINI:NQ1!', tradingView: 'CME_MINI:NQ1!', displayName: 'Nasdaq 100 E-mini (NQ)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'CBT:YM1!', tradingView: 'CBT:YM1!', displayName: 'Dow E-mini (YM)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'CME_MINI:RTY1!', tradingView: 'CME_MINI:RTY1!', displayName: 'Russell 2000 (RTY)', category: 'futures_indices', group: 'Futures — Indices' },
  { yahoo: 'CBOE:VIX', tradingView: 'CBOE:VIX', displayName: 'VIX (Volatility)', category: 'futures_indices', group: 'Futures — Indices' },

  // ─── FUTURES: ENERGY ────────────────────────────────────────
  { yahoo: 'NYMEX:CL1!', tradingView: 'NYMEX:CL1!', displayName: 'WTI Crude Oil (CL)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'NYMEX:BZ1!', tradingView: 'NYMEX:BZ1!', displayName: 'Brent Crude Oil (BZ)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'NYMEX:NG1!', tradingView: 'NYMEX:NG1!', displayName: 'Natural Gas (NG)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'NYMEX:HO1!', tradingView: 'NYMEX:HO1!', displayName: 'Heating Oil (HO)', category: 'futures_energy', group: 'Futures — Energy' },
  { yahoo: 'NYMEX:RB1!', tradingView: 'NYMEX:RB1!', displayName: 'RBOB Gasoline (RB)', category: 'futures_energy', group: 'Futures — Energy' },

  // ─── FUTURES: METALS ────────────────────────────────────────
  { yahoo: 'COMEX:GC1!', tradingView: 'COMEX:GC1!', displayName: 'Gold (GC)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'COMEX:SI1!', tradingView: 'COMEX:SI1!', displayName: 'Silver (SI)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'NYMEX:PL1!', tradingView: 'NYMEX:PL1!', displayName: 'Platinum (PL)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'NYMEX:PA1!', tradingView: 'NYMEX:PA1!', displayName: 'Palladium (PA)', category: 'futures_metals', group: 'Futures — Metals' },
  { yahoo: 'COMEX:HG1!', tradingView: 'COMEX:HG1!', displayName: 'Copper (HG)', category: 'futures_metals', group: 'Futures — Metals' },

  // ─── FUTURES: AGRICULTURE / COMMODITIES ─────────────────────
  { yahoo: 'CBT:ZC1!', tradingView: 'CBT:ZC1!', displayName: 'Corn (ZC)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'CBT:ZS1!', tradingView: 'CBT:ZS1!', displayName: 'Soybeans (ZS)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'CBT:ZW1!', tradingView: 'CBT:ZW1!', displayName: 'Wheat (ZW)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'CBT:ZL1!', tradingView: 'CBT:ZL1!', displayName: 'Soybean Oil (ZL)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'CBT:ZM1!', tradingView: 'CBT:ZM1!', displayName: 'Soybean Meal (ZM)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ICEUS:KC1!', tradingView: 'ICEUS:KC1!', displayName: 'Coffee (KC)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ICEUS:CT1!', tradingView: 'ICEUS:CT1!', displayName: 'Cotton (CT)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ICEUS:SB1!', tradingView: 'ICEUS:SB1!', displayName: 'Sugar (SB)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ICEUS:CC1!', tradingView: 'ICEUS:CC1!', displayName: 'Cocoa (CC)', category: 'futures_agriculture', group: 'Futures — Agriculture' },
  { yahoo: 'ICEUS:OJ1!', tradingView: 'ICEUS:OJ1!', displayName: 'Orange Juice (OJ)', category: 'futures_agriculture', group: 'Futures — Agriculture' },

  // ─── CRYPTO ─────────────────────────────────────────────────
  { yahoo: 'BINANCE:BTCUSDT', tradingView: 'BINANCE:BTCUSDT', displayName: 'Bitcoin (BTC)', category: 'crypto', group: 'Crypto' },
  { yahoo: 'BINANCE:ETHUSDT', tradingView: 'BINANCE:ETHUSDT', displayName: 'Ethereum (ETH)', category: 'crypto', group: 'Crypto' },
  { yahoo: 'BINANCE:SOLUSDT', tradingView: 'BINANCE:SOLUSDT', displayName: 'Solana (SOL)', category: 'crypto', group: 'Crypto' },
  { yahoo: 'BINANCE:BNBUSDT', tradingView: 'BINANCE:BNBUSDT', displayName: 'BNB', category: 'crypto', group: 'Crypto' },
  { yahoo: 'BINANCE:XRPUSDT', tradingView: 'BINANCE:XRPUSDT', displayName: 'XRP', category: 'crypto', group: 'Crypto' },
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
