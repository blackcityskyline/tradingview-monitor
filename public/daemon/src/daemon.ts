import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './config';
import { fetchPrices, disconnect as disconnectProvider } from './provider';
import { sendNotification, playAlertSound } from './notifier';
import { createServer } from './server';
import { PriceData, PriceAlert } from './types';

export class PriceAlertDaemon {
  private config: ConfigManager;
  private prices: Record<string, PriceData> = {};
  private startTime: number = Date.now();
  private lastPollTime: number = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private running: boolean = false;
  private logFile: string;

  constructor(configPath?: string) {
    this.config = new ConfigManager(configPath);
    this.logFile = this.config.get().logFile;
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    this.log('Daemon starting...');

    const dataDir = this.config.get().dataDir;
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const server = createServer({
      config: this.config, prices: this.prices,
      startTime: this.startTime, lastPollTime: this.lastPollTime,
    });

    const port = this.config.get().port;
    server.listen(port, '0.0.0.0', () => {
      this.log(`HTTP API server listening on port ${port}`);
    });

    this.startPolling();
    this.log(`Daemon started (PID: ${process.pid})`);

    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private startPolling(): void {
    const interval = this.config.get().pollInterval * 1000;
    this.pollPrices();
    this.pollTimer = setInterval(() => this.pollPrices(), interval);
  }

  private async pollPrices(): Promise<void> {
    const alerts = this.config.getAlerts().filter(a => a.enabled);
    if (alerts.length === 0) return;

    const symbols = [...new Set(alerts.map(a => a.symbol))];
    try {
      this.lastPollTime = Date.now();
      const newPrices = await fetchPrices(symbols);
      for (const [sym, data] of Object.entries(newPrices)) {
        const prev = this.prices[sym];
        this.prices[sym] = { ...data, prevPrice: prev?.price } as any;
      }
      this.checkAlerts(alerts);
    } catch (error) {
      this.log(`Poll error: ${error}`);
    }
  }

  private checkAlerts(alerts: PriceAlert[]): void {
    for (const alert of alerts) {
      const priceData = this.prices[alert.symbol];
      if (!priceData) continue;
      const currentPrice = priceData.price;
      const prevPrice = priceData.prevPrice;
      let shouldNotify = false;

      if (!alert.triggered) {
        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) shouldNotify = true;
        else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) shouldNotify = true;
        else if (alert.condition === 'cross' && prevPrice !== undefined) {
          const crossedUp = prevPrice < alert.targetPrice && currentPrice >= alert.targetPrice;
          const crossedDown = prevPrice > alert.targetPrice && currentPrice <= alert.targetPrice;
          if (crossedUp || crossedDown) shouldNotify = true;
        }
      } else if (alert.repeatEvery > 0 && alert.triggeredAt) {
        const elapsed = (Date.now() - alert.triggeredAt) / 1000;
        if (elapsed >= alert.repeatEvery) {
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice) shouldNotify = true;
          else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) shouldNotify = true;
          else if (alert.condition === 'cross' && prevPrice !== undefined) {
            const crossedUp = prevPrice < alert.targetPrice && currentPrice >= alert.targetPrice;
            const crossedDown = prevPrice > alert.targetPrice && currentPrice <= alert.targetPrice;
            if (crossedUp || crossedDown) shouldNotify = true;
          }
        }
      }

      if (shouldNotify) this.fireAlert(alert, currentPrice);
    }
  }

  private async fireAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    this.log(`🔔 ALERT: ${alert.displayName} ${alert.condition} ${alert.targetPrice} (current: ${currentPrice})`);
    await sendNotification(alert, currentPrice, this.config.get().notificationUrgency);
    if (this.config.get().soundEnabled) playAlertSound();
    this.config.updateAlert(alert.id, { triggered: true, triggeredAt: Date.now(), lastNotifiedPrice: currentPrice });
  }

  private shutdown(): void {
    this.log('Daemon shutting down...');
    this.running = false;
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    disconnectProvider();
    const pidFile = this.config.get().pidFile;
    if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);
    this.log('Daemon stopped');
    process.exit(0);
  }

  private log(message: string): void {
    const line = `[${new Date().toISOString()}] ${message}`;
    console.log(line);
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(this.logFile, line + '\n');
    } catch {}
  }
}
