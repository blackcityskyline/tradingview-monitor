import { useState, useEffect, useRef, useCallback } from 'react';

interface PriceAlert {
  id: string;
  symbol: string;
  displayName: string;
  targetPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: number;
  triggeredAt?: number;
  enabled: boolean;
  lastNotifiedPrice?: number;
  repeatEvery?: number; // seconds, 0 = one-time
}

interface PriceData {
  symbol: string;
  price: number;
  prevPrice?: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  lastUpdate: number;
}

// Binance WebSocket for crypto
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

// Crypto symbols mapping (TradingView format -> Binance format)
const CRYPTO_MAP: Record<string, string> = {
  'BINANCE:BTCUSDT': 'btcusdt',
  'BINANCE:ETHUSDT': 'ethusdt',
  'BINANCE:BNBUSDT': 'bnbusdt',
  'BINANCE:SOLUSDT': 'solusdt',
  'BINANCE:XRPUSDT': 'xrpusdt',
  'BINANCE:DOGEUSDT': 'dogeusdt',
  'BINANCE:ADAUSDT': 'adausdt',
  'BINANCE:AVAXUSDT': 'avaxusdt',
  'BINANCE:DOTUSDT': 'dotusdt',
  'BINANCE:MATICUSDT': 'maticusdt',
  'BINANCE:LINKUSDT': 'linkusdt',
  'BINANCE:UNIUSDT': 'uniusdt',
  'BINANCE:ATOMUSDT': 'atomusdt',
  'BINANCE:LTCUSDT': 'ltcusdt',
  'BINANCE:ARBUSDT': 'arbusdt',
  'BINANCE:OPUSDT': 'opusdt',
  'BINANCE:APTUSDT': 'aptusdt',
  'BINANCE:SUIUSDT': 'suiusdt',
  'BINANCE:NEARUSDT': 'nearusdt',
  'BINANCE:PEPEUSDT': 'pepeusdt',
};

const SYMBOL_GROUPS = [
  {
    name: 'Криптовалюты',
    symbols: Object.keys(CRYPTO_MAP),
  },
  {
    name: 'Популярные',
    symbols: ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:SOLUSDT', 'BINANCE:BNBUSDT', 'BINANCE:XRPUSDT'],
  },
];

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

function formatSymbol(symbol: string): string {
  return symbol.replace('BINANCE:', '').replace('USDT', '/USDT');
}

export default function App() {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem('priceAlerts_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [newSymbol, setNewSymbol] = useState('BINANCE:BTCUSDT');
  const [customSymbol, setCustomSymbol] = useState('');
  const [newTargetPrice, setNewTargetPrice] = useState('');
  const [newCondition, setNewCondition] = useState<'above' | 'below'>('above');
  const [newRepeat, setNewRepeat] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'triggered' | 'all'>('active');
  const [showNotification, setShowNotification] = useState<{title: string; message: string; type: string} | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscribedStreams = useRef<Set<string>>(new Set());
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Save alerts to localStorage
  useEffect(() => {
    localStorage.setItem('priceAlerts_v2', JSON.stringify(alerts));
  }, [alerts]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  // Get unique symbols from alerts
  const getUniqueSymbols = useCallback(() => {
    const symbols = new Set<string>();
    alerts.forEach(alert => {
      if (alert.enabled) {
        symbols.add(alert.symbol);
      }
    });
    return Array.from(symbols);
  }, [alerts]);

  // Connect to Binance WebSocket
  const connectWebSocket = useCallback(() => {
    const symbols = getUniqueSymbols();
    if (symbols.length === 0) return;

    const streams = symbols
      .filter(s => CRYPTO_MAP[s])
      .map(s => `${CRYPTO_MAP[s]}@ticker`)
      .join('/');

    if (!streams) return;

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`${BINANCE_WS_URL}/${streams}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Binance WebSocket');
      subscribedStreams.current = new Set(symbols.filter(s => CRYPTO_MAP[s]));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.s) {
          const binanceSymbol = data.s.toLowerCase();
          // Find the TradingView format symbol
          const tvSymbol = Object.keys(CRYPTO_MAP).find(
            key => CRYPTO_MAP[key] === binanceSymbol
          );
          
          if (tvSymbol) {
            const price = parseFloat(data.c);
            const change = parseFloat(data.p);
            const changePercent = parseFloat(data.P);
            const high = parseFloat(data.h);
            const low = parseFloat(data.l);

            setPrices(prev => ({
              ...prev,
              [tvSymbol]: {
                symbol: tvSymbol,
                price,
                prevPrice: prev[tvSymbol]?.price,
                change24h: change,
                changePercent24h: changePercent,
                high24h: high,
                low24h: low,
                lastUpdate: Date.now(),
              },
            }));
          }
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting in 3 seconds...');
      reconnectTimeout.current = setTimeout(connectWebSocket, 3000);
    };
  }, [getUniqueSymbols]);

  // Connect/reconnect WebSocket when alerts change
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connectWebSocket]);

  // Use refs for notification/sound settings to avoid stale closures
  const notificationsEnabledRef = useRef(notificationsEnabled);
  const soundEnabledRef = useRef(soundEnabled);
  const alertsRef = useRef(alerts);
  
  useEffect(() => { notificationsEnabledRef.current = notificationsEnabled; }, [notificationsEnabled]);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);
  useEffect(() => { alertsRef.current = alerts; }, [alerts]);

  const playAlertSound = useCallback((frequency: number = 800) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      
      // Play 3 beeps
      for (let i = 0; i < 3; i++) {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        const startTime = ctx.currentTime + i * 0.3;
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      }
    } catch (e) {
      console.error('Audio error:', e);
    }
  }, []);

  const triggerAlert = useCallback((alert: PriceAlert, currentPrice: number) => {
    const conditionText = alert.condition === 'above' ? 'выше' : 'ниже';
    const title = `🔔 ${formatSymbol(alert.symbol)}`;
    const message = `Цена ${conditionText} ${formatPrice(alert.targetPrice)}\nТекущая: ${formatPrice(currentPrice)}`;

    // Show in-app notification
    setShowNotification({ title, message, type: alert.condition === 'above' ? 'success' : 'warning' });
    setTimeout(() => setShowNotification(null), 5000);

    // Browser notification
    if (notificationsEnabledRef.current) {
      new Notification(title, {
        body: message,
        tag: alert.id,
        requireInteraction: true,
      });
    }

    // Play sound
    if (soundEnabledRef.current) {
      playAlertSound(alert.condition === 'above' ? 880 : 440);
    }
  }, [playAlertSound]);

  // Check alerts against current prices
  useEffect(() => {
    const checkAlerts = () => {
      const currentAlerts = alertsRef.current;
      const triggeredIds: { alert: PriceAlert; price: number }[] = [];
      
      currentAlerts.forEach(alert => {
        if (!alert.enabled) return;
        
        const priceData = prices[alert.symbol];
        if (!priceData) return;

        const currentPrice = priceData.price;
        let shouldTrigger = false;

        if (!alert.triggered) {
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
            shouldTrigger = true;
          } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
            shouldTrigger = true;
          }
        } else if (alert.repeatEvery && alert.repeatEvery > 0 && alert.triggeredAt) {
          const timeSinceLastTrigger = (Date.now() - alert.triggeredAt) / 1000;
          if (timeSinceLastTrigger >= alert.repeatEvery) {
            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
              shouldTrigger = true;
            } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
              shouldTrigger = true;
            }
          }
        }

        if (shouldTrigger) {
          triggeredIds.push({ alert, price: currentPrice });
        }
      });

      if (triggeredIds.length > 0) {
        // Fire notifications
        triggeredIds.forEach(({ alert, price }) => {
          triggerAlert(alert, price);
        });
        
        // Update alerts state
        setAlerts(prev => prev.map(a => {
          const triggered = triggeredIds.find(t => t.alert.id === a.id);
          if (triggered) {
            return {
              ...a,
              triggered: true,
              triggeredAt: Date.now(),
              lastNotifiedPrice: triggered.price,
            };
          }
          return a;
        }));
      }
    };

    const interval = setInterval(checkAlerts, 500);
    return () => clearInterval(interval);
  }, [prices, triggerAlert]);

  const addAlert = () => {
    const symbol = customSymbol.trim().toUpperCase() || newSymbol;
    if (!newTargetPrice || !symbol) return;

    const newAlert: PriceAlert = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      symbol,
      displayName: formatSymbol(symbol),
      targetPrice: parseFloat(newTargetPrice),
      condition: newCondition,
      triggered: false,
      createdAt: Date.now(),
      enabled: true,
      repeatEvery: newRepeat,
    };

    setAlerts(prev => [...prev, newAlert]);
    setNewTargetPrice('');
    setCustomSymbol('');
    setShowAddForm(false);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, enabled: !a.enabled, triggered: !a.enabled ? false : a.triggered } : a
    ));
  };

  const resetAlert = (id: string) => {
    setAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, triggered: false, triggeredAt: undefined, lastNotifiedPrice: undefined } : a
    ));
  };

  const resetAllTriggered = () => {
    setAlerts(prev => prev.map(a => 
      a.triggered ? { ...a, triggered: false, triggeredAt: undefined, lastNotifiedPrice: undefined } : a
    ));
  };

  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
      if (permission === 'granted') {
        new Notification('✅ Уведомления включены', {
          body: 'Вы будете получать уведомления при достижении ценовых отметок',
        });
      }
    }
  };

  // Use current price as target
  const useCurrentPrice = () => {
    const priceData = prices[newSymbol];
    if (priceData) {
      setNewTargetPrice(priceData.price.toString());
    }
  };

  const activeAlerts = alerts.filter(a => a.enabled && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);
  const disabledAlerts = alerts.filter(a => !a.enabled);

  const filteredAlerts = activeTab === 'active' ? activeAlerts : 
                         activeTab === 'triggered' ? triggeredAlerts : alerts;

  const currentPrice = prices[newSymbol];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white">
      {/* In-app notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md ${
            showNotification.type === 'success' 
              ? 'bg-green-500/20 border-green-500/40' 
              : 'bg-yellow-500/20 border-yellow-500/40'
          }`}>
            <p className="font-bold text-lg">{showNotification.title}</p>
            <p className="text-sm text-gray-300 whitespace-pre-line">{showNotification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold">Price Alert Tracker</h1>
                <p className="text-xs text-gray-400">Неограниченные уведомления по ценовым отметкам • Real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={enableNotifications}
                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                  notificationsEnabled
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {notificationsEnabled ? '✓ Push' : '🔔 Push'}
              </button>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`px-3 py-2 text-sm rounded-lg transition-all ${
                  soundEnabled
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-blue-400">{alerts.length}</p>
            <p className="text-xs text-gray-400">Всего алертов</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-green-400">{activeAlerts.length}</p>
            <p className="text-xs text-gray-400">Активных</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-yellow-400">{triggeredAlerts.length}</p>
            <p className="text-xs text-gray-400">Сработавших</p>
          </div>
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-purple-400">{Object.keys(prices).length}</p>
            <p className="text-xs text-gray-400">Отслеживаемых</p>
          </div>
        </div>

        {/* Add Alert Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98]"
        >
          {showAddForm ? '✕ Закрыть' : '+ Добавить ценовой алерт'}
        </button>

        {/* Add Alert Form */}
        {showAddForm && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-6 animate-fade-in">
            <h3 className="text-lg font-semibold mb-4">Новый ценовой алерт</h3>
            
            {/* Symbol Selection */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Инструмент</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={newSymbol}
                  onChange={(e) => { setNewSymbol(e.target.value); setCustomSymbol(''); }}
                  className="px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                >
                  {SYMBOL_GROUPS.map(group => (
                    <optgroup key={group.name} label={group.name}>
                      {group.symbols.map(symbol => (
                        <option key={symbol} value={symbol} className="bg-gray-800">
                          {formatSymbol(symbol)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <input
                  type="text"
                  value={customSymbol}
                  onChange={(e) => { setCustomSymbol(e.target.value); if (e.target.value) setNewSymbol(e.target.value.toUpperCase()); }}
                  placeholder="Или введите: BINANCE:DOGEUSDT"
                  className="px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              {currentPrice && (
                <p className="mt-2 text-sm text-gray-400">
                  Текущая цена: <span className="text-white font-semibold">${formatPrice(currentPrice.price)}</span>
                  <button onClick={useCurrentPrice} className="ml-2 text-blue-400 hover:text-blue-300 text-xs underline">
                    использовать
                  </button>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Целевая цена</label>
                <input
                  type="number"
                  step="any"
                  value={newTargetPrice}
                  onChange={(e) => setNewTargetPrice(e.target.value)}
                  placeholder="Например: 50000"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Условие</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewCondition('above')}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${
                      newCondition === 'above'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                        : 'bg-white/5 text-gray-400 border border-white/20 hover:bg-white/10'
                    }`}
                  >
                    ↑ Выше
                  </button>
                  <button
                    onClick={() => setNewCondition('below')}
                    className={`flex-1 px-4 py-2.5 rounded-lg transition-all ${
                      newCondition === 'below'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-white/5 text-gray-400 border border-white/20 hover:bg-white/10'
                    }`}
                  >
                    ↓ Ниже
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Повтор (сек, 0 = один раз)</label>
                <input
                  type="number"
                  min="0"
                  value={newRepeat}
                  onChange={(e) => setNewRepeat(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={addAlert}
                disabled={!newTargetPrice}
                className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                ✓ Создать алерт
              </button>
              <button
                onClick={() => { setShowAddForm(false); setNewTargetPrice(''); setCustomSymbol(''); }}
                className="px-6 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-white/5 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === 'active' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Активные ({activeAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('triggered')}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === 'triggered' ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Сработавшие ({triggeredAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm rounded-md transition-all ${
              activeTab === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Все ({alerts.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Поиск по символам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
          />
        </div>

        {/* Triggered alerts batch action */}
        {activeTab === 'triggered' && triggeredAlerts.length > 0 && (
          <button
            onClick={resetAllTriggered}
            className="mb-4 px-4 py-2 text-sm bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors"
          >
            ↺ Сбросить все сработавшие
          </button>
        )}

        {/* Alerts List */}
        <div className="space-y-3">
          {filteredAlerts
            .filter(a => !searchQuery || a.symbol.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(alert => {
              const priceData = prices[alert.symbol];
              const currentPrice = priceData?.price;
              const distance = currentPrice ? Math.abs(currentPrice - alert.targetPrice) / currentPrice * 100 : null;
              
              return (
                <div
                  key={alert.id}
                  className={`bg-white/5 backdrop-blur-md rounded-xl p-4 border transition-all hover:bg-white/[0.07] ${
                    alert.triggered
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : !alert.enabled
                      ? 'border-gray-500/20 opacity-60'
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{formatSymbol(alert.symbol)}</h3>
                        {alert.triggered && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">
                            ✓ Сработал
                          </span>
                        )}
                        {!alert.enabled && (
                          <span className="px-2 py-0.5 text-xs bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                            Отключен
                          </span>
                        )}
                        {alert.repeatEvery && alert.repeatEvery > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                            ↻ {alert.repeatEvery}с
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className={`${alert.condition === 'above' ? 'text-green-400' : 'text-red-400'}`}>
                          {alert.condition === 'above' ? '↑ Выше' : '↓ Ниже'} {formatPrice(alert.targetPrice)}
                        </span>
                        {distance !== null && !alert.triggered && (
                          <span className="text-gray-500 text-xs">
                            ({distance.toFixed(2)}% от текущей)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Current Price */}
                    <div className="text-right mr-4">
                      {currentPrice ? (
                        <>
                          <p className={`text-lg font-bold ${
                            priceData?.prevPrice && currentPrice > priceData.prevPrice ? 'text-green-400' :
                            priceData?.prevPrice && currentPrice < priceData.prevPrice ? 'text-red-400' : 'text-white'
                          }`}>
                            ${formatPrice(currentPrice)}
                          </p>
                          <p className={`text-xs ${priceData?.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {priceData?.changePercent24h >= 0 ? '+' : ''}{priceData?.changePercent24h.toFixed(2)}%
                          </p>
                        </>
                      ) : (
                        <p className="text-gray-500 text-sm">Ожидание данных...</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          alert.enabled ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-gray-500/20 text-gray-400'
                        }`}
                        title={alert.enabled ? 'Отключить' : 'Включить'}
                      >
                        {alert.enabled ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                      {alert.triggered && (
                        <button
                          onClick={() => resetAlert(alert.id)}
                          className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                          title="Сбросить"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar showing distance to target */}
                  {currentPrice && !alert.triggered && alert.enabled && (
                    <div className="mt-3">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            alert.condition === 'above' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(0, 
                              alert.condition === 'above'
                                ? (1 - distance! / 100) * 100
                                : (1 - distance! / 100) * 100
                            ))}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Triggered info */}
                  {alert.triggered && alert.triggeredAt && (
                    <div className="mt-2 text-xs text-gray-500">
                      Сработал: {new Date(alert.triggeredAt).toLocaleString('ru-RU')}
                      {alert.lastNotifiedPrice && ` @ $${formatPrice(alert.lastNotifiedPrice)}`}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Empty State */}
        {filteredAlerts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="text-gray-400 text-lg mb-2">
              {activeTab === 'active' ? 'Нет активных алертов' : 
               activeTab === 'triggered' ? 'Нет сработавших алертов' : 'Нет алертов'}
            </p>
            <p className="text-gray-500 text-sm">
              Нажмите "Добавить ценовой алерт" чтобы начать отслеживание
            </p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="font-semibold text-sm text-blue-400 mb-2">📡 Real-time данные</h4>
            <p className="text-xs text-gray-400">Цены обновляются в реальном времени через Binance WebSocket API</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="font-semibold text-sm text-purple-400 mb-2">🔔 Уведомления</h4>
            <p className="text-xs text-gray-400">Push-уведомления браузера + звуковые сигналы + внутриприложные уведомления</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h4 className="font-semibold text-sm text-green-400 mb-2">∞ Без ограничений</h4>
            <p className="text-xs text-gray-400">Неограниченное количество алертов с возможностью повторных уведомлений</p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
}
