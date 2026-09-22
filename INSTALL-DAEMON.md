# Price Alert Daemon - Полная установка

## Быстрая установка

Скопируй и выполни этот скрипт:

```bash
#!/bin/bash
# Создаём структуру
mkdir -p daemon/src
cd daemon

# package.json
cat > package.json << 'EOF'
{
  "name": "price-alert-daemon",
  "version": "1.0.0",
  "main": "dist/index.js",
  "bin": {"price-alert": "./dist/index.js"},
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js start",
    "stop": "node dist/index.js stop"
  },
  "dependencies": {"ws": "^8.16.0"},
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/ws": "^8.5.10",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
EOF

# tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
EOF

# Устанавливаем зависимости
npm install
npm run build

# Создаём symlink
sudo ln -sf $(pwd)/dist/index.js /usr/local/bin/price-alert

echo "✅ Daemon installed! Run: price-alert start"
```

## Файлы исходного кода (src/)

Все файлы исходного кода daemon находятся в директории `public/daemon/src/` и будут скопированы при билде.

После выполнения скрипта выше, скопируй файлы из `public/daemon/src/` в `daemon/src/`:

```bash
cp -r public/daemon/src/* daemon/src/
cd daemon
npm run build
```

## Использование

```bash
# Запустить демон
price-alert start

# Добавить алерт
price-alert add "CME_MINI:ES1!" 5800 above

# Список алертов
price-alert list

# Веб-интерфейс
# Открой http://localhost:3456
```

## Поддерживаемые символы

- FOREX: FX:EURUSD, FX:GBPUSD, FX:USDJPY, etc.
- Futures Indices: CME_MINI:ES1!, CME_MINI:NQ1!, CBT:YM1!, etc.
- Futures Energy: NYMEX:CL1!, NYMEX:BZ1!, NYMEX:NG1!, etc.
- Futures Metals: COMEX:GC1!, COMEX:SI1!, NYMEX:PL1!, etc.
- Crypto: BINANCE:BTCUSDT, BINANCE:ETHUSDT, etc.

Полный список: `price-alert symbols`
