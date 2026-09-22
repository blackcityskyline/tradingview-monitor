import * as https from 'https';
import * as http from 'http';
import { PriceData } from './types';

/**
 * Multi-provider price data system
 * 
 * Providers (in priority order):
 * 1. Binance WebSocket — Crypto (free, real-time, no auth)
 * 2. Yahoo Finance — Everything else (free, delayed 15min for some markets)
 * 3. Twelve Data — Fallback (free tier: 800 req/day, needs API key)
 * 4. Finnhub — Fallback (free tier: 60 calls/min, needs API key)
 * 
 * Yahoo Finance endpoints tried:
 * - v8/finance/spark (fast, batch)
 * - v7/finance/quote (reliable, batch)
 * - v8/finance/chart/{symbol} (single, most reliable)
 */

// ─── Types ─────────────────────────────────────────────────────

interface YahooChartResult {
  meta?: {
    regularMarketPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
    regularMarketDayHigh?: number;
    regularMarketDayLow?: number;
    marketState?: string;
    currency?: string;
    symbol?: string;
  };
}

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  marketState: string;
}

// ─── HTTP helpers ──────────────────────────────────────────────

function fetchUrl(url: string, headers?: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const mod = parsedUrl.protocol === 'https:' ? https : http;
    
    const req = mod.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.5',
        ...headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else if (res.statusCode === 301 || res.statusCode === 302) {
          // Follow redirect
          const location = res.headers.location;
          if (location) {
            fetchUrl(location, headers).then(resolve).catch(reject);
          } else {
            reject(new Error(`Redirect without location: ${res.statusCode}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 200)}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// ─── Yahoo Finance Provider ────────────────────────────────────

/**
 * Fetch prices from Yahoo Finance using multiple endpoint strategies
 */
async function fetchFromYahoo(symbols: string[]): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  
  // Strategy 1: v7/finance/quote (batch, most reliable for multiple symbols)
  try {
    const encoded = symbols.map(s => encodeURIComponent(s)).join(',');
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`;
    const data = await fetchUrl(url);
    const parsed = JSON.parse(data);
    
    if (parsed.quoteResponse?.result) {
      for (const q of parsed.quoteResponse.result as YahooQuoteResult[]) {
        if (q.regularMarketPrice) {
          results[q.symbol] = {
            symbol: q.symbol,
            price: q.regularMarketPrice,
            prevClose: q.regularMarketPreviousClose || q.regularMarketPrice,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            high: q.regularMarketDayHigh || q.regularMarketPrice,
            low: q.regularMarketDayLow || q.regularMarketPrice,
            marketState: q.marketState || 'REGULAR',
            lastUpdate: Date.now(),
          };
        }
      }
      
      // If we got all symbols, return
      if (Object.keys(results).length === symbols.length) {
        return results;
      }
    }
  } catch (e) {
    // Strategy 1 failed, try strategy 2
  }

  // Strategy 2: v8/finance/chart/{symbol} (individual, most reliable)
  const remaining = symbols.filter(s => !results[s]);
  
  for (const symbol of remaining) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
      const data = await fetchUrl(url);
      const parsed = JSON.parse(data);
      
      const chart = parsed.chart?.result?.[0] as YahooChartResult | undefined;
      if (chart?.meta?.regularMarketPrice) {
        const meta = chart.meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        
        results[symbol] = {
          symbol,
          price,
          prevClose,
          change: price - prevClose,
          changePercent: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          high: meta.regularMarketDayHigh || price,
          low: meta.regularMarketDayLow || price,
          marketState: meta.marketState || 'REGULAR',
          lastUpdate: Date.now(),
        };
      }
    } catch (e) {
      console.error(`Yahoo chart fetch failed for ${symbol}:`, (e as Error).message);
    }
    
    // Small delay between requests to avoid rate limiting
    if (remaining.length > 1) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return results;
}

// ─── Twelve Data Provider (fallback, needs API key) ────────────

async function fetchFromTwelveData(symbols: string[], apiKey: string): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  
  // Map Yahoo symbols to Twelve Data symbols
  const symbolMap: Record<string, string> = {};
  for (const sym of symbols) {
    // EURUSD=X -> EUR/USD, GC=F -> XAU/USD, etc.
    if (sym.endsWith('=X')) {
      // Forex: EURUSD=X -> EUR/USD
      const base = sym.replace('=X', '');
      symbolMap[sym] = `${base.substring(0, 3)}/${base.substring(3)}`;
    } else if (sym === 'GC=F') {
      symbolMap[sym] = 'XAU/USD';
    } else if (sym === 'SI=F') {
      symbolMap[sym] = 'XAG/USD';
    } else if (sym === 'CL=F') {
      symbolMap[sym] = 'WTI';
    } else {
      symbolMap[sym] = sym.replace('=F', '').replace('-USD', '/USD');
    }
  }

  for (const [yahooSym, tdSym] of Object.entries(symbolMap)) {
    try {
      const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(tdSym)}&apikey=${apiKey}`;
      const data = await fetchUrl(url);
      const parsed = JSON.parse(data);
      
      if (parsed.price) {
        const price = parseFloat(parsed.price);
        results[yahooSym] = {
          symbol: yahooSym,
          price,
          prevClose: price, // We don't have prev close from this endpoint
          change: 0,
          changePercent: 0,
          high: price,
          low: price,
          marketState: 'REGULAR',
          lastUpdate: Date.now(),
        };
      }
    } catch (e) {
      // Skip failed symbols
    }
  }

  return results;
}

// ─── Main fetch function ───────────────────────────────────────

/**
 * Fetch prices using the best available provider
 * Falls back through providers if one fails
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  if (symbols.length === 0) return {};

  let results: Record<string, PriceData> = {};

  // Try Yahoo Finance first (free, no auth needed)
  try {
    results = await fetchFromYahoo(symbols);
    if (Object.keys(results).length > 0) {
      return results;
    }
  } catch (e) {
    console.error('Yahoo Finance failed:', (e as Error).message);
  }

  // Fallback: Twelve Data (if API key configured)
  const twelveDataKey = process.env.TWELVE_DATA_API_KEY;
  if (twelveDataKey) {
    try {
      const tdResults = await fetchFromTwelveData(symbols, twelveDataKey);
      results = { ...results, ...tdResults };
    } catch (e) {
      console.error('Twelve Data failed:', (e as Error).message);
    }
  }

  // Log missing symbols
  const missing = symbols.filter(s => !results[s]);
  if (missing.length > 0) {
    console.warn(`Could not fetch prices for: ${missing.join(', ')}`);
  }

  return results;
}

/**
 * Fetch single price
 */
export async function fetchSinglePrice(symbol: string): Promise<PriceData | null> {
  const results = await fetchPrices([symbol]);
  return results[symbol] || null;
}

/**
 * Get provider status info
 */
export function getProviderInfo(): { name: string; available: boolean; note: string }[] {
  return [
    {
      name: 'Yahoo Finance',
      available: true,
      note: 'Free, no auth. May be rate-limited. Delayed 15min for some US markets.',
    },
    {
      name: 'Twelve Data',
      available: !!process.env.TWELVE_DATA_API_KEY,
      note: process.env.TWELVE_DATA_API_KEY
        ? 'Configured via TWELVE_DATA_API_KEY. 800 req/day free.'
        : 'Not configured. Set TWELVE_DATA_API_KEY env var for fallback.',
    },
    {
      name: 'Binance WebSocket',
      available: true,
      note: 'Crypto only. Real-time, free, no auth. Used separately via WebSocket.',
    },
  ];
}
