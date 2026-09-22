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

## Структура проекта

```
├── daemon/          ← Linux демон (Node.js)
│   ├── src/         ← Исходный код демона
│   ├── install.sh   ← Скрипт установки
│   └── README.md    ← Документация демона
├── src/             ← Web UI (React + Vite)
│   └── App.tsx      ← Основной компонент
└── package.json     ← Зависимости Web UI
```

## Быстрый старт

### 1. Установка демона

```bash
cd daemon
chmod +x install.sh
./install.sh
```

### 2. Запуск

```bash
price-alert start
```

### 3. Добавление алертов

```bash
# Фьючерсы
price-alert add "CME_MINI:ES1!" 5800 above      # S&P 500 выше 5800
price-alert add "COMEX:GC1!" 2400 below         # Золото ниже 2400
price-alert add "NYMEX:CL1!" 75 below 300       # Нефть ниже 75, повтор каждые 300с

# FOREX
price-alert add "FX:EURUSD" 1.10 above          # EUR/USD выше 1.10

# Крипто
price-alert add "BINANCE:BTCUSDT" 100000 above  # Bitcoin выше 100k
```

### 4. Web UI

Откройте http://localhost:3456

## Источник данных

Все цены получаются через **TradingView WebSocket API** в реальном времени:
- Бесплатно, без API ключей
- Все рынки: FOREX, фьючерсы, металлы, крипто
- Задержка < 1 секунда

## Поддерживаемые символы

### FOREX Majors
- FX:EURUSD, FX:GBPUSD, FX:USDJPY, FX:USDCHF, FX:AUDUSD, FX:USDCAD, FX:NZDUSD

### Futures — Indices
- CME_MINI:ES1! (S&P 500), CME_MINI:NQ1! (Nasdaq), CBT:YM1! (Dow), CME_MINI:RTY1! (Russell), CBOE:VIX

### Futures — Energy
- NYMEX:CL1! (WTI Oil), NYMEX:BZ1! (Brent), NYMEX:NG1! (Natural Gas)

### Futures — Metals
- COMEX:GC1! (Gold), COMEX:SI1! (Silver), NYMEX:PL1! (Platinum), NYMEX:PA1! (Palladium)

### Futures — Agriculture
- CBT:ZC1! (Corn), CBT:ZS1! (Soybeans), CBT:ZW1! (Wheat), ICEUS:KC1! (Coffee)

### Crypto
- BINANCE:BTCUSDT, BINANCE:ETHUSDT, BINANCE:SOLUSDT

Полный список: `price-alert symbols`

## Системные требования

- **Node.js** 18+
- **Linux** (для системных уведомлений)
- **libnotify-bin** (для notify-send)
- **xdg-utils** (для открытия URL)

```bash
# Ubuntu/Debian
sudo apt install nodejs npm libnotify-bin xdg-utils

# Arch Linux
sudo pacman -S nodejs npm libnotify xdg-utils
```

## Команды CLI

```bash
price-alert start              # Запустить демон
price-alert stop               # Остановить
price-alert restart            # Перезапустить
price-alert status             # Статус
price-alert logs               # Логи
price-alert list               # Список алертов
price-alert add <sym> <price>  # Добавить алерт
price-alert remove <id>        # Удалить алерт
price-alert enable <id>        # Включить алерт
price-alert disable <id>       # Отключить алерт
price-alert reset <id>         # Сбросить сработавший алерт
price-alert symbols [query]    # Поиск символов
price-alert test               # Тест уведомления
```

## Документация

Полная документация: [daemon/README.md](daemon/README.md)

## Лицензия

MIT
