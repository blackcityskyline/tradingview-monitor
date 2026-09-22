import WebSocket from 'ws';
import { PriceData } from './types';

class TradingViewWebSocket {
  private ws: WebSocket | null = null;
  private connected: boolean = false;
  private sessionId: string = 'qs_stable';
  private messageCounter: number = 0;
  private subscribedSymbols: Set<string> = new Set();
  private priceCallbacks: Map<string, (data: PriceData) => void> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('wss://data.tradingview.com/socket.io/websocket', {
        origin: 'https://www.tradingview.com',
      });

      this.ws.on('open', () => {
        this.connected = true;
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
        this.startHeartbeat();
        resolve();
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('error', (error) => {
        if (!this.connected) reject(error);
      });

      this.ws.on('close', () => {
        this.connected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      });

      setTimeout(() => {
        if (!this.connected) reject(new Error('Connection timeout'));
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
    const messages = data.split('~m~');
    for (let i = 1; i < messages.length; i += 2) {
      try {
        const json = JSON.parse(messages[i]);
        if (json.m === 'qsd') {
          const quote = json.p[1];
          this.processQuote(quote);
        }
        if (json.m === 'heartbeat') {
          this.sendMessage('heartbeat', ['qs_stable']);
        }
      } catch (e) {}
    }
  }

  private processQuote(quote: any): void {
    const symbol = quote.n;
    const v = quote.v;
    if (!v.lp) return;
    
    const priceData: PriceData = {
      symbol,
      price: v.lp,
      prevClose: v.prev_close_price || v.lp,
      change: v.ch || 0,
      changePercent: v.chp || 0,
      high: v.high_price || v.lp,
      low: v.low_price || v.lp,
      marketState: 'REGULAR',
      lastUpdate: Date.now(),
    };

    const callback = this.priceCallbacks.get(symbol);
    if (callback) callback(priceData);
  }

  subscribe(symbol: string, callback: (data: PriceData) => void): void {
    if (!this.connected) return;
    this.priceCallbacks.set(symbol, callback);
    if (!this.subscribedSymbols.has(symbol)) {
      this.sendMessage('quote_add_symbols', [this.sessionId, symbol]);
      this.subscribedSymbols.add(symbol);
    }
  }

  unsubscribe(symbol: string): void {
    if (!this.connected) return;
    if (this.subscribedSymbols.has(symbol)) {
      this.sendMessage('quote_remove_symbols', [this.sessionId, symbol]);
      this.subscribedSymbols.delete(symbol);
      this.priceCallbacks.delete(symbol);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) this.sendMessage('heartbeat', [this.sessionId]);
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      try {
        await this.connect();
        const symbols = Array.from(this.subscribedSymbols);
        this.subscribedSymbols.clear();
        for (const symbol of symbols) {
          this.sendMessage('quote_add_symbols', [this.sessionId, symbol]);
          this.subscribedSymbols.add(symbol);
        }
      } catch (e) {
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

let wsInstance: TradingViewWebSocket | null = null;

async function getWebSocket(): Promise<TradingViewWebSocket> {
  if (!wsInstance || !wsInstance.isConnected()) {
    wsInstance = new TradingViewWebSocket();
    await wsInstance.connect();
  }
  return wsInstance;
}

export async function fetchPrices(symbols: string[]): Promise<Record<string, PriceData>> {
  if (symbols.length === 0) return {};
  const results: Record<string, PriceData> = {};
  const ws = await getWebSocket();
  
  return new Promise((resolve) => {
    let receivedCount = 0;
    const timeout = setTimeout(() => resolve(results), 10000);

    for (const symbol of symbols) {
      ws.subscribe(symbol, (data) => {
        results[symbol] = data;
        receivedCount++;
        if (receivedCount >= symbols.length) {
          clearTimeout(timeout);
          resolve(results);
        }
      });
    }

    if (symbols.length === 0) {
      clearTimeout(timeout);
      resolve(results);
    }
  });
}

export async function fetchSinglePrice(symbol: string): Promise<PriceData | null> {
  const results = await fetchPrices([symbol]);
  return results[symbol] || null;
}

export function getProviderInfo(): { name: string; available: boolean; note: string }[] {
  return [
    {
      name: 'TradingView WebSocket',
      available: wsInstance?.isConnected() || false,
      note: 'Real-time data from TradingView. All markets covered.',
    },
  ];
}

export function disconnect(): void {
  if (wsInstance) {
    wsInstance.disconnect();
    wsInstance = null;
  }
}
