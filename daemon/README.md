# Price Alert Daemon

Linux daemon для неограниченных уведомлений по ценовым отметкам с системными уведомлениями и кнопкой открытия графика в TradingView.

## Возможности

- 📊 **Все рынки**: FOREX, Futures (NQ, ES, CL, GC...), Metals, Commodities, Crypto
- 🔔 **Системные уведомления** Linux с кнопкой "Открыть график" (DBus/notify-send)
- 🔗 **Кнопка в уведомлении** → открывает TradingView в браузере
- ∞ **Неограниченное количество** алертов
- 🔁 **Повторные уведомления** с настраиваемым интервалом
- 🌐 **Web UI** для мониторинга и управления
- 💾 **Сохранение** конфигурации в JSON
- ⚙️ **systemd** интеграция для автозапуска
- ⚡ **Real-time** данные через TradingView WebSocket

## 📊 Источник данных

Демон использует **TradingView WebSocket API** для получения цен в реальном времени.

### TradingView WebSocket
- **Endpoint**: `wss://data.tradingview.com/socket.io/websocket`
- **Авторизация**: Не требуется (публичный доступ)
- **Стоимость**: Бесплатно
- **Задержка**: Реальное время (< 1 сек для всех рынков)
- **Покрытие**: Все рынки — FOREX, фьючерсы, металлы, крипто, акции

### ✅ Преимущества

- **Реальное время** для всех инструментов (включая фьючерсы CME, NYMEX, COMEX)
- **Все рынки** в одном источнике
- **Бесплатно** без API ключей
- **Стабильность** — WebSocket соединение с автоматическим переподключением
- **Точность** — те же данные что на TradingView.com

## Поддерживаемые символы

### FOREX Majors
| Символ | Описание |
|--------|----------|
| FX:EURUSD | EUR/USD |
| FX:GBPUSD | GBP/USD |
| FX:USDJPY | USD/JPY |
| FX:USDCHF | USD/CHF |
| FX:AUDUSD | AUD/USD |
| FX:USDCAD | USD/CAD |
| FX:NZDUSD | NZD/USD |

### Futures — Indices
| Символ | Описание |
|--------|----------|
| CME_MINI:ES1! | S&P 500 E-mini |
| CME_MINI:NQ1! | Nasdaq 100 E-mini |
| CBT:YM1! | Dow E-mini |
| CME_MINI:RTY1! | Russell 2000 |
| CBOE:VIX | VIX (Volatility) |

### Futures — Energy
| Символ | Описание |
|--------|----------|
| NYMEX:CL1! | WTI Crude Oil |
| NYMEX:BZ1! | Brent Crude Oil |
| NYMEX:NG1! | Natural Gas |
| NYMEX:HO1! | Heating Oil |
| NYMEX:RB1! | RBOB Gasoline |

### Futures — Metals
| Символ | Описание |
|--------|----------|
| COMEX:GC1! | Gold |
| COMEX:SI1! | Silver |
| NYMEX:PL1! | Platinum |
| NYMEX:PA1! | Palladium |
| COMEX:HG1! | Copper |

### Futures — Agriculture
| Символ | Описание |
|--------|----------|
| CBT:ZC1! | Corn |
| CBT:ZS1! | Soybeans |
| CBT:ZW1! | Wheat |
| ICEUS:KC1! | Coffee |
| ICEUS:CT1! | Cotton |
| ICEUS:SB1! | Sugar |

### Crypto
| Символ | Описание |
|--------|----------|
| BINANCE:BTCUSDT | Bitcoin |
| BINANCE:ETHUSDT | Ethereum |
| BINANCE:SOLUSDT | Solana |

## Установка

### Автоматическая установка

```bash
cd daemon
chmod +x install.sh
./install.sh
```

### Ручная установка

```bash
cd daemon
npm install
npm run build
sudo ln -sf $(pwd)/dist/index.js /usr/local/bin/price-alert
```

### Зависимости

```bash
# Ubuntu/Debian
sudo apt install nodejs npm libnotify-bin xdg-utils

# Arch Linux
sudo pacman -S nodejs npm libnotify xdg-utils

# Fedora
sudo dnf install nodejs npm libnotify xdg-utils
```

## Использование

### Управление демоном

```bash
price-alert start              # Запустить демон
price-alert stop               # Остановить
price-alert restart            # Перезапустить
price-alert status             # Статус
price-alert logs               # Логи
```

### Управление алертами

```bash
# Добавить алерт
price-alert add "CME_MINI:ES1!" 5800 above           # S&P выше 5800
price-alert add "COMEX:GC1!" 2400 below              # Золото ниже 2400
price-alert add "FX:EURUSD" 1.10 above               # EUR/USD выше 1.10
price-alert add "NYMEX:CL1!" 75 below 300            # Нефть ниже 75, повтор каждые 300с
price-alert add "CME_MINI:NQ1!" 20000 above 60       # Nasdaq выше 20000, повтор 60с

# Список
price-alert list

# Управление
price-alert enable <id>
price-alert disable <id>
price-alert reset <id>
price-alert remove <id>
```

### Поиск символов

```bash
price-alert symbols              # Все символы
price-alert symbols gold         # Поиск по "gold"
price-alert symbols oil          # Поиск по "oil"
```

### Тест уведомлений

```bash
price-alert test                 # Отправить тестовое уведомление
```

## Systemd (автозапуск)

```bash
# Установить как user service
cp daemon/price-alert-daemon@.service ~/.config/systemd/user/
sed -i "s/%i/$USER/g" ~/.config/systemd/user/price-alert-daemon@.service
systemctl --user daemon-reload

# Запустить
systemctl --user start price-alert-daemon
systemctl --user enable price-alert-daemon

# Статус
systemctl --user status price-alert-daemon
```

## Web UI

После запуска демона откройте: http://localhost:3456

Web UI позволяет:
- Просматривать текущие цены в реальном времени
- Добавлять/удалять алерты
- Мониторить статус демона
- Управлять настройками

## Уведомления

Уведомления отправляются через:
1. **notify-send** с action-кнопкой (dunst, mako)
2. **gdbus** напрямую к DBus (gnome-shell, KDE)
3. **Простой notify-send** (fallback)

При клике на кнопку "📊 Открыть график" — открывается TradingView в браузере.

### Требования для уведомлений

- `libnotify-bin` — утилита notify-send
- Notification daemon — dunst, mako, или встроенный (GNOME/KDE)
- `xdg-utils` — для открытия URL

## Конфигурация

Файл: `~/.price-alert-daemon/config.json`

```json
{
  "port": 3456,
  "pollInterval": 10,
  "alerts": [
    {
      "id": "abc123",
      "symbol": "CME_MINI:ES1!",
      "displayName": "S&P 500 E-mini (ES)",
      "targetPrice": 5800,
      "condition": "above",
      "enabled": true,
      "triggered": false,
      "repeatEvery": 300,
      "createdAt": 1700000000000,
      "category": "futures_indices"
    }
  ],
  "soundEnabled": true,
  "notificationUrgency": "critical"
}
```

## Архитектура

```
daemon/
├── src/
│   ├── index.ts       — CLI entry point
│   ├── daemon.ts      — Основной процесс (polling + alerts)
│   ├── server.ts      — HTTP API + Web UI serving
│   ├── provider.ts    — TradingView WebSocket client
│   ├── notifier.ts    — Linux system notifications (DBus)
│   ├── config.ts      — Config management
│   ├── symbols.ts     — Symbol catalog
│   └── types.ts       — TypeScript types
├── install.sh         — Install script
├── price-alert-daemon@.service — systemd unit
└── package.json
```

## Лицензия

MIT
