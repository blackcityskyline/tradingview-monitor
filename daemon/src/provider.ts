import WebSocket from 'ws';
import { PriceData } from './types';

/**
 * TradingView WebSocket Provider
 * 
 * Получает цены в реальном времени через официальный WebSocket API TradingView
 * Endpoint: wss://data.tradingview.com/socket.io/websocket
 * 
 * Поддерживает все рынки:
 * - FOREX (FX:EURUSD, FX:GBPUSD, etc.)
 * - Futures (CME_MINI:ES1!, NYMEX:CL1!, COMEX:GC1!, etc.)
 * - Metals (FX:XAUUSD, FX:XAGUSD, etc.)
 * - Crypto (BINANCE:BTCUSDT, etc.)
 * - Stocks (NASDAQ:AAPL, NYSE:MSFT, etc.)
 */

// ─── Types ─────────────────────────────────────────────────────

interface TradingViewQuote {
  n: string;              // Symbol name
  v: {
    lp?: number;          // Last price
    ch?: number;          // Change
    chp?: number;         // Change percent
    open_price?: number;  // Open
    high_price?: number;  // High
    low_price?: number;   // Low
    prev_close_price?: number; // Previous close
    volume?: number;      // Volume
    short_name?: string;  // Short name
    description?: string; // Description
    exchange?: string;    // Exchange
    currency_code?: string; // Currency
  };
}

// ─── TradingView WebSocket Client ──────────────────────────────

class TradingViewWebSocket {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private sessionId: string = 'qs_stable';
  private messageCounter: number = 0;
  private subscribedSymbols: Set<string> = new Set();
  private priceCallbacks: Map<string, (data: PriceData) => void> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('Connecting to TradingView WebSocket...');
      
      this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
        origin: 'https://www.tradingview.com',
      });

      this.ws.on('open', () => {
        console.log('✅ TradingView WebSocket connected');
        this.connected = true;
        
        // Send authentication (public access)
        this.sendMessage('set_auth_token', ['unauthorized_user']);
        this.sendMessage('quote_create_session', [this.sessionId]);
        this.sendMessage('quote_set_fields', [
          this.sessionId,
          'ch', 'chp', 'current_volume', 'lang', 'local_description',
          'market', 'minmov', 'minmove2', 'original_name', 'pricescale',
          'pro_name', 'short_name', 'type', 'update_mode', 'volume',
          'currency_code', 'rch', 'rchp', 'rch', 'chp', 'fractional',
          'is_tradable', 'lp_time', 'lp', 'open_price', 'high_price',
          'low_price', 'prev_close_price', 'change', 'change_abs',
          'description', 'name', 'exchange', 'symbol'
        ]);

        // Start heartbeat
        this.startHeartbeat();
        
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        console.error('TradingView WebSocket error:', error.message);
        if (!this.connected) {
          reject(error);
        }
      });

      this.ws.on('close', () => {
        console.log('TradingView WebSocket closed');
        this.connected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      // Timeout for connection
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  private sendMessage(method: string, params: any[]): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    
    this.messageCounter++;
    const message = `~m~${this.messageCounter}~m~${JSON.stringify({ m: method, p: params })}`;
    this.ws.send(message);
  }

  private handleMessage(data: string): void {
    // TradingView uses ~m~ separator
    const messages = data.split('~m~');
    
    for (let i = 1; i < messages.length; i += 2) {
      try {
        const json = JSON.parse(messages[i]);
        
        // Handle quote updates
        if (json.m === 'qsd') {
          const quote = json.p[1] as TradingViewQuote;
          this.processQuote(quote);
        }
        
        // Handle heartbeat responses
        if (json.m === 'heartbeat') {
          // Respond to heartbeat
          this.sendMessage('heartbeat', ['qs_stable']);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  private processQuote(quote: TradingViewQuote): void {
    const symbol = quote.n;
    const v = quote.v;
    
    if (!v.lp) return; // No price data
    
    const priceData: PriceData = {
      symbol,
      price: v.lp,
      prevClose: v.prev_close_price || v.lp,
      change: v.ch || 0,
      changePercent: v.chp || 0,
      high: v.high_price || v.lp,
      low: v.low_price || v.lp,
      marketState: 'REGULAR', // TradingView doesn't provide market state
      lastUpdate: Date.now(),
    };

    // Call registered callback
    const callback = this.priceCallbacks.get(symbol);
    if (callback) {
      callback(priceData);
    }
  }

  subscribe(symbol: string, callback: (data: PriceData) => void): void {
    if (!this.connected) {
      console.warn('Cannot subscribe: not connected');
      return;
    }

    // Register callback
    this.priceCallbacks.set(symbol, callback);

    // Subscribe if not already subscribed
    if (!this.subscribedSymbols.has(symbol)) {
      this.sendMessage('quote_add_symbols', [this.sessionId, symbol]);
      this.subscribedSymbols.add(symbol);
      console.log(`📡 Subscribed to ${symbol}`);
    }
  }

  unsubscribe(symbol: string): void {
    if (!this.connected) return;

    if (this.subscribedSymbols.has(symbol)) {
      this.sendMessage('quote_remove_symbols', [this.sessionId, symbol]);
      this.subscribedSymbols.delete(symbol);
      this.priceCallbacks.delete(symbol);
      console.log(`📡 Unsubscribed from ${symbol}`);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) {
        this.sendMessage('heartbeat', [this.sessionId]);
      }
    }, 30000); // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    
    console.log('Reconnecting in 5 seconds...');
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
        
        // Re-subscribe to all symbols
        const symbols = Array.from(this.subscribedSymbols);
        this.subscribedSymbols.clear();
        for (const symbol of symbols) {
          this.sendMessage('quote_add_symbols', [this.sessionId, symbol]);
          this.subscribedSymbols.add(symbol);
        }
      } catch (e) {
        console.error('Reconnect failed:', e);
        this.scheduleReconnect();
      }
    }, 5000);
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.subscribedSymbols.clear();
    this.priceCallbacks.clear();
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// ─── Singleton instance ────────────────────────────────────────

let wsInstance: TradingViewWebSocket | null = null;

async function getWebSocket(): Promise<TradingViewWebSocket> {
  if (!wsInstance || !wsInstance.isConnected()) {
    wsInstance = new TradingViewWebSocket();
    await wsInstance.connect();
  }
  return wsInstance;
}

// ─── Public API ────────────────────────────────────────────────

/**
 * Fetch prices from TradingView WebSocket
 * Subscribes to symbols and waits for initial quotes
 */
export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  if (symbols.length === 0) return {};

  const results: Record<string, PriceData> = {};
  const ws = await getWebSocket();
  
  return new Promise((resolve) => {
    let receivedCount = 0;
    const timeout = setTimeout(() => {
      // Resolve with whatever we got after 10 seconds
      resolve(results);
    }, 10000);

    for (const symbol of symbols) {
      ws.subscribe(symbol, (data) => {
        results[symbol] = data;
        receivedCount++;
        
        // Resolve when we got all symbols
        if (receivedCount >= symbols.length) {
          clearTimeout(timeout);
          resolve(results);
        }
      });
    }

    // If no symbols to subscribe, resolve immediately
    if (symbols.length === 0) {
      clearTimeout(timeout);
      resolve(results);
    }
  });
}

/**
 * Fetch single price
 */
export async function fetchSinglePrice(symbol: string): Promise<PriceData | null> {
  const results = await fetchPrices([symbol]);
  return results[symbol] || null;
}

/**
 * Subscribe to real-time price updates
 */
export async function subscribeToPrice(
  symbol: string,
  callback: (data: PriceData) => void
): Promise<void> {
  const ws = await getWebSocket();
  ws.subscribe(symbol, callback);
}

/**
 * Unsubscribe from price updates
 */
export async function unsubscribeFromPrice(symbol: string): Promise<void> {
  if (wsInstance) {
    wsInstance.unsubscribe(symbol);
  }
}

/**
 * Get provider status
 */
export function getProviderInfo(): { name: string; available: boolean; note: string }[] {
  return [
    {
      name: 'TradingView WebSocket',
      available: wsInstance?.isConnected() || false,
      note: 'Real-time data from TradingView. All markets covered.',
    },
  ];
}

/**
 * Disconnect WebSocket (for graceful shutdown)
 */
export function disconnect(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}
