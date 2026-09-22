import { useState, useEffect, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────

interface PriceAlert {
  id: string;
  symbol: string;
  displayName: string;
  targetPrice: number;
  condition: 'above' | 'below' | 'cross';
  enabled: boolean;
  triggered: boolean;
  repeatEvery: number;
  createdAt: number;
  triggeredAt?: number;
  lastNotifiedPrice?: number;
  category: string;
}

interface PriceData {
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

interface DaemonStatus {
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

interface SymbolInfo {
  yahoo: string;
  tradingView: string;
  displayName: string;
  category: string;
  group: string;
}

// ─── API ───────────────────────────────────────────────────────

const API_BASE = '/api';

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ─── Helpers ───────────────────────────────────────────────────

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}д ${h}ч ${m}м`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return `${diff}с назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)}м назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}ч назад`;
  return `${Math.floor(diff / 86400)}д назад`;
}

// ─── Component ─────────────────────────────────────────────────

export default function App() {
  const [status, setStatus] = useState<DaemonStatus | null>(null);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [symbols, setSymbols] = useState<SymbolInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'alerts' | 'add' | 'symbols'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // New alert form
  const [newSymbol, setNewSymbol] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCondition, setNewCondition] = useState<'above' | 'below' | 'cross'>('above');
  const [newRepeat, setNewRepeat] = useState('0');

  const fetchData = useCallback(async () => {
    try {
      const [statusData, alertsData, pricesData] = await Promise.all([
        api<DaemonStatus>('/status'),
        api<PriceAlert[]>('/alerts'),
        api<Record<string, PriceData>>('/prices'),
      ]);
      setStatus(statusData);
      setAlerts(alertsData);
      setPrices(pricesData);
      setError(null);
    } catch (e) {
      setError('Не удалось подключиться к демону. Убедитесь что он запущен: price-alert start');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSymbols = useCallback(async () => {
    try {
      const data = await api<{ catalog: SymbolInfo[] }>('/symbols');
      setSymbols(data.catalog);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchSymbols();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData, fetchSymbols]);

  const addAlert = async () => {
    if (!newSymbol || !newPrice) return;
    try {
      const symInfo = symbols.find(s => s.yahoo === newSymbol);
      await api('/alerts', {
        method: 'POST',
        body: JSON.stringify({
          symbol: newSymbol,
          displayName: symInfo?.displayName || newSymbol,
          targetPrice: parseFloat(newPrice),
          condition: newCondition,
          repeatEvery: parseInt(newRepeat) || 0,
          category: symInfo?.category || 'forex',
        }),
      });
      setNewPrice('');
      setActiveTab('alerts');
      fetchData();
    } catch (e) {
      alert('Ошибка добавления алерта');
    }
  };

  const removeAlert = async (id: string) => {
    await api(`/alerts/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleAlert = async (id: string, enabled: boolean) => {
    await api(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ enabled, triggered: enabled ? false : undefined }),
    });
    fetchData();
  };

  const resetAlert = async (id: string) => {
    await api(`/alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ triggered: false, triggeredAt: undefined }),
    });
    fetchData();
  };

  // ─── Render ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Подключение к демону...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Демон не запущен</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="bg-gray-900 rounded-lg p-4 text-left font-mono text-sm">
            <p className="text-green-400"># Запустить демон:</p>
            <p className="text-white">price-alert start</p>
            <p className="text-green-400 mt-2"># Добавить алерт:</p>
            <p className="text-white">price-alert add "ES=F" 5800 above</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredSymbols = symbols.filter(s =>
    !searchQuery ||
    s.yahoo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔔</span>
              </div>
              <div>
                <h1 className="text-lg font-bold">Price Alert Daemon</h1>
                <p className="text-xs text-gray-500">
                  {status?.running ? '🟢 Running' : '🔴 Stopped'} • PID {status?.pid} • v{status?.version}
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Uptime: {status ? formatUptime(status.uptime) : '—'}
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-gray-900/50 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', label: '📊 Дашборд' },
              { id: 'alerts', label: '🔔 Алерты' },
              { id: 'add', label: '➕ Добавить' },
              { id: 'symbols', label: '📋 Символы' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* ─── Dashboard ─────────────────────────────────────── */}
        {activeTab === 'dashboard' && status && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <StatCard label="Всего алертов" value={status.alertsCount} color="blue" />
              <StatCard label="Активных" value={status.activeAlerts} color="green" />
              <StatCard label="Сработавших" value={status.triggeredAlerts} color="yellow" />
              <StatCard label="Символов" value={status.symbolsTracked} color="purple" />
              <StatCard label="Последний poll" value={status.lastPoll ? timeAgo(status.lastPoll) : '—'} color="gray" />
            </div>

            {/* Active prices */}
            <div>
              <h2 className="text-lg font-semibold mb-3">📈 Текущие цены</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(prices)
                  .filter(p => alerts.some(a => a.symbol === p.symbol))
                  .sort((a, b) => a.symbol.localeCompare(b.symbol))
                  .map(p => (
                    <div key={p.symbol} className="bg-gray-900 rounded-xl p-4 border border-gray-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{getSymbolDisplayName(p.symbol, symbols)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.marketState === 'REGULAR' ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-400'
                        }`}>
                          {p.marketState === 'REGULAR' ? '● Live' : '○ Closed'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">${formatPrice(p.price)}</p>
                      <p className={`text-sm ${p.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {p.changePercent >= 0 ? '▲' : '▼'} {p.changePercent >= 0 ? '+' : ''}{p.changePercent.toFixed(2)}%
                      </p>
                      {/* Show related alerts */}
                      {alerts.filter(a => a.symbol === p.symbol && a.enabled).map(a => (
                        <div key={a.id} className={`mt-2 text-xs px-2 py-1 rounded ${
                          a.triggered ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {a.condition === 'above' ? '↑' : a.condition === 'below' ? '↓' : '↔'} {formatPrice(a.targetPrice)}
                          {a.triggered && ' ✓ HIT'}
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
              {Object.keys(prices).length === 0 && (
                <p className="text-gray-500 text-center py-8">Нет данных. Добавьте алерты для отслеживания.</p>
              )}
            </div>
          </div>
        )}

        {/* ─── Alerts ────────────────────────────────────────── */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">🔔 Ценовые алерты ({alerts.length})</h2>
              <button
                onClick={() => setActiveTab('add')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                + Новый алерт
              </button>
            </div>

            {alerts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">🔕</p>
                <p>Нет алертов. Добавьте первый!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map(alert => {
                  const price = prices[alert.symbol];
                  return (
                    <div
                      key={alert.id}
                      className={`bg-gray-900 rounded-xl p-4 border transition-all ${
                        alert.triggered
                          ? 'border-yellow-500/40 bg-yellow-500/5'
                          : alert.enabled
                          ? 'border-gray-800 hover:border-gray-700'
                          : 'border-gray-800/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{alert.displayName}</span>
                            <span className="text-xs text-gray-500 font-mono">{alert.symbol}</span>
                            {alert.triggered && (
                              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full">
                                ✓ Сработал
                              </span>
                            )}
                            {!alert.enabled && (
                              <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded-full">
                                ⏸ Отключен
                              </span>
                            )}
                            {alert.repeatEvery > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                ↻ {alert.repeatEvery}с
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm">
                            <span className={alert.condition === 'above' ? 'text-green-400' : alert.condition === 'below' ? 'text-red-400' : 'text-blue-400'}>
                              {alert.condition === 'above' ? '↑ Выше' : alert.condition === 'below' ? '↓ Ниже' : '↔ Пересечение'} {formatPrice(alert.targetPrice)}
                            </span>
                            {price && !alert.triggered && (
                              <span className="text-gray-500 text-xs">
                                (сейчас: ${formatPrice(price.price)},{' '}
                                {Math.abs(((price.price - alert.targetPrice) / price.price) * 100).toFixed(1)}% до цели)
                              </span>
                            )}
                          </div>
                          {alert.triggeredAt && (
                            <p className="text-xs text-gray-600 mt-1">
                              Сработал: {new Date(alert.triggeredAt).toLocaleString('ru-RU')}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {price && (
                            <div className="text-right mr-2">
                              <p className="font-bold text-lg">${formatPrice(price.price)}</p>
                              <p className={`text-xs ${price.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {price.changePercent >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                              </p>
                            </div>
                          )}
                          <button
                            onClick={() => toggleAlert(alert.id, !alert.enabled)}
                            className={`p-2 rounded-lg transition-colors ${
                              alert.enabled ? 'text-green-400 hover:bg-green-500/20' : 'text-gray-500 hover:bg-gray-800'
                            }`}
                            title={alert.enabled ? 'Отключить' : 'Включить'}
                          >
                            {alert.enabled ? '👁' : '👁‍🗨'}
                          </button>
                          {alert.triggered && (
                            <button
                              onClick={() => resetAlert(alert.id)}
                              className="p-2 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                              title="Сбросить"
                            >
                              ↺
                            </button>
                          )}
                          <button
                            onClick={() => removeAlert(alert.id)}
                            className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Удалить"
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Add Alert ─────────────────────────────────────── */}
        {activeTab === 'add' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">➕ Новый ценовой алерт</h2>
            
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
              {/* Symbol search */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Символ</label>
                <input
                  type="text"
                  placeholder="Поиск: gold, oil, ES, EUR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-2"
                />
                <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-800">
                  {filteredSymbols.slice(0, 20).map(s => (
                    <button
                      key={s.yahoo}
                      onClick={() => { setNewSymbol(s.yahoo); setSearchQuery(''); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-800 transition-colors flex items-center justify-between ${
                        newSymbol === s.yahoo ? 'bg-blue-500/20 text-blue-400' : 'text-gray-300'
                      }`}
                    >
                      <span>
                        <span className="font-medium">{s.displayName}</span>
                        <span className="text-gray-500 ml-2">{s.yahoo}</span>
                      </span>
                      <span className="text-xs text-gray-500">{s.group}</span>
                    </button>
                  ))}
                </div>
                {newSymbol && (
                  <p className="mt-2 text-sm text-blue-400">
                    Выбрано: <strong>{symbols.find(s => s.yahoo === newSymbol)?.displayName || newSymbol}</strong> ({newSymbol})
                  </p>
                )}
              </div>

              {/* Target price */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Целевая цена</label>
                <input
                  type="number"
                  step="any"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Например: 5800"
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                {prices[newSymbol] && (
                  <p className="mt-1 text-xs text-gray-500">
                    Текущая цена: ${formatPrice(prices[newSymbol].price)}
                    <button
                      onClick={() => setNewPrice(prices[newSymbol].price.toString())}
                      className="ml-2 text-blue-400 hover:underline"
                    >
                      использовать
                    </button>
                  </p>
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Условие</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewCondition('above')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      newCondition === 'above'
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                        : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    ↑ ВЫШЕ
                  </button>
                  <button
                    onClick={() => setNewCondition('below')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      newCondition === 'below'
                        ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50'
                        : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    ↓ НИЖЕ
                  </button>
                  <button
                    onClick={() => setNewCondition('cross')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      newCondition === 'cross'
                        ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/50'
                        : 'bg-gray-800 text-gray-400 border-2 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    ↔ CROSS
                  </button>
                </div>
              </div>

              {/* Repeat */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Повтор уведомления (сек, 0 = один раз)</label>
                <input
                  type="number"
                  min="0"
                  value={newRepeat}
                  onChange={(e) => setNewRepeat(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit */}
              <button
                onClick={addAlert}
                disabled={!newSymbol || !newPrice}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ Создать алерт
              </button>
            </div>
          </div>
        )}

        {/* ─── Symbols ───────────────────────────────────────── */}
        {activeTab === 'symbols' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">📋 Доступные символы ({symbols.length})</h2>
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm w-64"
              />
            </div>

            <div className="space-y-6">
              {Object.entries(
                filteredSymbols.reduce((acc, s) => {
                  if (!acc[s.group]) acc[s.group] = [];
                  acc[s.group].push(s);
                  return acc;
                }, {} as Record<string, SymbolInfo[]>)
              ).map(([group, syms]) => (
                <div key={group}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">{group}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {syms.map(s => {
                      const price = prices[s.yahoo];
                      return (
                        <div key={s.yahoo} className="bg-gray-900 rounded-lg p-3 border border-gray-800 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{s.displayName}</p>
                            <p className="text-xs text-gray-500 font-mono">{s.yahoo}</p>
                          </div>
                          <div className="text-right">
                            {price ? (
                              <>
                                <p className="font-bold text-sm">${formatPrice(price.price)}</p>
                                <p className={`text-xs ${price.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {price.changePercent >= 0 ? '+' : ''}{price.changePercent.toFixed(2)}%
                                </p>
                              </>
                            ) : (
                              <p className="text-xs text-gray-600">—</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    gray: 'text-gray-400',
  };
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <p className={`text-2xl font-bold ${colors[color] || 'text-white'}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function getSymbolDisplayName(symbol: string, catalog: SymbolInfo[]): string {
  const info = catalog.find(s => s.yahoo === symbol);
  return info?.displayName || symbol;
}
