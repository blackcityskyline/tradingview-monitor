# Price Alert Daemon - Полная установка

## Шаг 1: Создай структуру проекта

```bash
mkdir -p daemon/src
cd daemon
```

## Шаг 2: Создай package.json

```bash
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
```

## Шаг 3: Создай tsconfig.json

```bash
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
```

## Шаг 4: Установи зависимости и собери

```bash
npm install
npm run build
sudo ln -sf $(pwd)/dist/index.js /usr/local/bin/price-alert
```

## Шаг 5: Скопируй исходный код

Все файлы исходного кода (src/*.ts) находятся в директории `public/daemon/src/` этого репозитория.

Скопируй их:

```bash
cp -r ../public/daemon/src/* src/
npm run build
```

Или создай вручную файлы из `public/daemon/src/`:
- types.ts
- symbols.ts
- config.ts
- provider.ts
- notifier.ts
- server.ts
- daemon.ts
- index.ts

## Шаг 6: Запусти

```bash
price-alert start
price-alert add "CME_MINI:ES1!" 5800 above
price-alert list
```

## Веб-интерфейс

Открой http://localhost:3456

## Поддерживаемые символы

- FOREX: FX:EURUSD, FX:GBPUSD, FX:USDJPY
- Futures: CME_MINI:ES1!, COMEX:GC1!, NYMEX:CL1!
- Crypto: BINANCE:BTCUSDT, BINANCE:ETHUSDT

Полный список: `price-alert symbols`
