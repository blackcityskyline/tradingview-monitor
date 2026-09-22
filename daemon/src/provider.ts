import * as https from 'https';
import { PriceData } from './types';

/**
 * Yahoo Finance price provider
 * Uses the public v8 API endpoint (no auth required)
 */

interface YahooQuoteResult {
  symbol: string;
  regularMarketPrice: number;
  regularMarketPreviousClose: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  marketState: string;
  shortName?: string;
}

interface YahooResponse {
  quoteResponse?: {
    result?: YahooQuoteResult[];
    error?: string;
  };
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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

/**
 * Fetch prices for multiple symbols from Yahoo Finance
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  if (symbols.length === 0) return {};

  const results: Record<string, PriceData> = {};
  
  // Yahoo allows batch quotes (up to ~150 symbols)
  // Split into batches of 50 to be safe
  const batchSize = 50;
  const batches: string[][] = [];
  for (let i = 0; i < symbols.length; i += batchSize) {
    batches.push(symbols.slice(i, i + batchSize));
  }

  for (const batch of batches) {
    try {
      const encoded = batch.map(s => encodeURIComponent(s)).join(',');
      const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encoded}&range=1d&interval=1d&indicators=close&includeTimestamps=false&includePrePost=false`;
      
      // Try the spark endpoint first (faster)
      let data: string;
      try {
        data = await fetchUrl(url);
        const parsed = JSON.parse(data);
        
        // Parse spark response
        if (parsed.spark?.result) {
          for (const item of parsed.spark.result) {
            const sym = item.symbol;
            const resp = item.response?.[0];
            if (resp?.meta) {
              const meta = resp.meta;
              const price = meta.regularMarketPrice;
              const prevClose = meta.chartPreviousClose || meta.previousClose || price;
              results[sym] = {
                symbol: sym,
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
          }
          continue;
        }
      } catch {
        // Fallback to quote endpoint
      }

      // Fallback: use v7 quote endpoint
      const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encoded}`;
      data = await fetchUrl(quoteUrl);
      const parsed: YahooResponse = JSON.parse(data);
      
      if (parsed.quoteResponse?.result) {
        for (const quote of parsed.quoteResponse.result) {
          results[quote.symbol] = {
            symbol: quote.symbol,
            price: quote.regularMarketPrice,
            prevClose: quote.regularMarketPreviousClose,
            change: quote.regularMarketChange,
            changePercent: quote.regularMarketChangePercent,
            high: quote.regularMarketDayHigh,
            low: quote.regularMarketDayLow,
            marketState: quote.marketState,
            lastUpdate: Date.now(),
          };
        }
      }
    } catch (error) {
      console.error(`Failed to fetch prices for batch:`, error);
      // Try individual fallback
      for (const sym of batch) {
        if (!results[sym]) {
          try {
            const singleUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(sym)}`;
            const data = await fetchUrl(singleUrl);
            const parsed: YahooResponse = JSON.parse(data);
            if (parsed.quoteResponse?.result?.[0]) {
              const q = parsed.quoteResponse.result[0];
              results[q.symbol] = {
                symbol: q.symbol,
                price: q.regularMarketPrice,
                prevClose: q.regularMarketPreviousClose,
                change: q.regularMarketChange,
                changePercent: q.regularMarketChangePercent,
                high: q.regularMarketDayHigh,
                low: q.regularMarketDayLow,
                marketState: q.marketState,
                lastUpdate: Date.now(),
              };
            }
          } catch (e) {
            console.error(`Failed to fetch ${sym}:`, e);
          }
        }
      }
    }
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
