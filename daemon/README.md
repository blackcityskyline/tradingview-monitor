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

## Поддерживаемые символы

### FOREX Majors
| Символ | Описание |
|--------|----------|
| EURUSD=X | EUR/USD |
| GBPUSD=X | GBP/USD |
| USDJPY=X | USD/JPY |
| USDCHF=X | USD/CHF |
| AUDUSD=X | AUD/USD |
| USDCAD=X | USD/CAD |
| NZDUSD=X | NZD/USD |

### Futures — Indices
| Символ | Описание |
|--------|----------|
| ES=F | S&P 500 E-mini |
| NQ=F | Nasdaq 100 E-mini |
| YM=F | Dow E-mini |
| RTY=F | Russell 2000 |
| VX=F | VIX (Volatility) |

### Futures — Energy
| Символ | Описание |
|--------|----------|
| CL=F | WTI Crude Oil |
| BZ=F | Brent Crude Oil |
| NG=F | Natural Gas |
| HO=F | Heating Oil |
| RB=F | RBOB Gasoline |

### Futures — Metals
| Символ | Описание |
|--------|----------|
| GC=F | Gold |
| SI=F | Silver |
| PL=F | Platinum |
| PA=F | Palladium |
| HG=F | Copper |

### Futures — Agriculture
| Символ | Описание |
|--------|----------|
| ZC=F | Corn |
| ZS=F | Soybeans |
| ZW=F | Wheat |
| KC=F | Coffee |
| CT=F | Cotton |
| SB=F | Sugar |

### Crypto
| Символ | Описание |
|--------|----------|
| BTC-USD | Bitcoin |
| ETH-USD | Ethereum |
| SOL-USD | Solana |

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
price-alert add "ES=F" 5800 above           # S&P выше 5800
price-alert add "GC=F" 2400 below           # Золото ниже 2400
price-alert add "EURUSD=X" 1.10 above       # EUR/USD выше 1.10
price-alert add "CL=F" 75 below 300         # Нефть ниже 75, повтор каждые 300с
price-alert add "NQ=F" 20000 above 60       # Nasdaq выше 20000, повтор 60с

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
- Просматривать текущие цены
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
      "symbol": "ES=F",
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

## Откуда берутся цены?

### Источники данных

Демон использует **несколько источников данных** с автоматическим fallback:

#### 1. Yahoo Finance (основной)
- **Endpoint**: `query1.finance.yahoo.com/v7/finance/quote` и `/v8/finance/chart`
- **Авторизация**: Не требуется
- **Стоимость**: Бесплатно
- **Задержка**: 
  - FOREX, крипто: ~реальное время
  - US фьючерсы (ES, NQ, CL, GC): задержка 10-15 минут (требование биржи)
  - Азиатские/европейские рынки: может быть задержка
- **Лимиты**: ~2000 запросов/час (без авторизации)
- **Покрытие**: Все символы из каталога

#### 2. Twelve Data (fallback)
- **Endpoint**: `api.twelvedata.com/price`
- **Авторизация**: API ключ (бесплатный)
- **Стоимость**: 800 запросов/день бесплатно
- **Задержка**: ~реальное время
- **Настройка**: `export TWELVE_DATA_API_KEY=your_key`
- **Получить ключ**: https://twelvedata.com/pricing

#### 3. Binance WebSocket (для крипто)
- **Endpoint**: `wss://stream.binance.com:9443/ws`
- **Авторизация**: Не требуется
- **Стоимость**: Бесплатно
- **Задержка**: Реальное время (< 1 сек)
- **Покрытие**: Только крипто (BTC, ETH, SOL, etc.)

### Важные замечания

⚠️ **Задержка данных для фьючерсов**

Цены фьючерсов CME/CBOT/NYMEX (ES, NQ, CL, GC, ZS, etc.) через Yahoo Finance имеют **задержку 10-15 минут** — это требование бирж. Для real-time данных фьючерсов нужна платная подписка:
- CME Market Data: ~$10-30/месяц
- Или через брокера (Interactive Brokers, TD Ameritrade)

✅ **FOREX и крипто** — данные практически в реальном времени (задержка < 1 сек)

✅ **Металлы (spot)** — XAU/USD, XAG/USD доступны с минимальной задержкой

### Проверка источников

```bash
# Показать статус всех провайдеров
curl http://localhost:3456/api/providers

# Пример ответа:
{
  "providers": [
    {
      "name": "Yahoo Finance",
      "available": true,
      "note": "Free, no auth. May be rate-limited."
    },
    {
      "name": "Twelve Data",
      "available": false,
      "note": "Not configured. Set TWELVE_DATA_API_KEY."
    }
  ]
}
```

### Альтернативные источники (если Yahoo не работает)

Если Yahoo Finance заблокирован в вашем регионе или возвращает ошибки:

1. **Twelve Data** (рекомендуется)
   ```bash
   export TWELVE_DATA_API_KEY=your_key
   price-alert restart
   ```

2. **Finnhub** (60 calls/min бесплатно)
   ```bash
   export FINNHUB_API_KEY=your_key
   ```

3. **Свой прокси** — можно настроить проксирование через VPN/VPS

## Архитектура

```
daemon/
├── src/
│   ├── index.ts       — CLI entry point
│   ├── daemon.ts      — Основной процесс (polling + alerts)
│   ├── server.ts      — HTTP API + Web UI serving
│   ├── provider.ts    — Yahoo Finance price data
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
