# Price Alert Daemon — Инструкция по установке

## 📦 Сборка архива

```bash
chmod +x build-archive.sh
./build-archive.sh
```

Это создаст файл `price-alert-daemon.tar.gz` со всем необходимым.

## 🚀 Установка из архива

```bash
# Распаковать
tar -xzf price-alert-daemon.tar.gz
cd price-alert-daemon

# Установить зависимости и собрать
npm install
cd daemon && npm install && npm run build && cd ..

# Создать symlink для CLI
sudo ln -sf $(pwd)/daemon/dist/index.js /usr/local/bin/price-alert

# Готово!
price-alert --help
```

## ⚡ Быстрый старт

```bash
# 1. Запустить демон
price-alert start

# 2. Добавить алерт
price-alert add "CME_MINI:ES1!" 5800 above

# 3. Проверить статус
price-alert status

# 4. Открыть Web UI
# http://localhost:3456
```

## 📋 Примеры алертов

```bash
# Фьючерсы
price-alert add "CME_MINI:ES1!" 5800 above      # S&P 500 выше 5800
price-alert add "COMEX:GC1!" 2400 below         # Золото ниже 2400
price-alert add "NYMEX:CL1!" 75 below 300       # Нефть ниже 75, повтор каждые 300с
price-alert add "CME_MINI:NQ1!" 20000 above     # Nasdaq выше 20000

# FOREX
price-alert add "FX:EURUSD" 1.10 above          # EUR/USD выше 1.10
price-alert add "FX:GBPUSD" 1.30 below          # GBP/USD ниже 1.30

# Крипто
price-alert add "BINANCE:BTCUSDT" 100000 above  # Bitcoin выше 100k
price-alert add "BINANCE:ETHUSDT" 4000 below    # Ethereum ниже 4000
```

## 🔧 Системные требования

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

## 📊 Источник данных

Все цены получаются через **TradingView WebSocket API** в реальном времени:
- Бесплатно, без API ключей
- Все рынки: FOREX, фьючерсы, металлы, крипто
- Задержка < 1 секунда

## 🌐 Web UI

После запуска демона откройте: **http://localhost:3456**

## 📖 Полная документация

См. `daemon/README.md`
