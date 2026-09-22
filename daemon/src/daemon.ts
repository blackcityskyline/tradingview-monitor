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
    if (this.running) {
      console.log('Daemon is already running');
      return;
    }

    this.running = true;
    this.startTime = Date.now();
    this.log('Daemon starting...');

    // Ensure data directory exists
    const dataDir = this.config.get().dataDir;
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Start HTTP API server
    const server = createServer({
      config: this.config,
      prices: this.prices,
      startTime: this.startTime,
      lastPollTime: this.lastPollTime,
    });

    const port = this.config.get().port;
    server.listen(port, '0.0.0.0', () => {
      this.log(`HTTP API server listening on port ${port}`);
      this.log(`Web UI: http://localhost:${port}`);
    });

    // Start price polling
    this.startPolling();

    this.log(`Daemon started (PID: ${process.pid})`);
    this.log(`Tracking ${this.config.getAlerts().length} alerts`);

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private startPolling(): void {
    const interval = this.config.get().pollInterval * 1000;
    
    // Initial poll
    this.pollPrices();
    
    // Schedule recurring polls
    this.pollTimer = setInterval(() => {
      this.pollPrices();
    }, interval);
  }

  private async pollPrices(): Promise<void> {
    const alerts = this.config.getAlerts().filter(a => a.enabled);
    if (alerts.length === 0) return;

    // Get unique symbols
    const symbols = [...new Set(alerts.map(a => a.symbol))];
    
    try {
      this.lastPollTime = Date.now();
      const newPrices = await fetchPrices(symbols);
      
      // Merge with existing prices (keep prevPrice for change detection)
      for (const [sym, data] of Object.entries(newPrices)) {
        const prev = this.prices[sym];
        this.prices[sym] = {
          ...data,
          prevPrice: prev?.price,
        };
      }

      // Check alerts
      this.checkAlerts(alerts);
      
      this.log(`Polled ${symbols.length} symbols, ${Object.keys(newPrices).length} prices received`);
    } catch (error) {
      this.log(`Poll error: ${error}`);
    }
  }

  private checkAlerts(alerts: PriceAlert[]): void {
    for (const alert of alerts) {
      const priceData = this.prices[alert.symbol];
      if (!priceData) continue;

      const currentPrice = priceData.price;
      let shouldNotify = false;

      if (!alert.triggered) {
        // First-time trigger
        if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
          shouldNotify = true;
        } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
          shouldNotify = true;
        }
      } else if (alert.repeatEvery > 0 && alert.triggeredAt) {
        // Repeat notification
        const elapsed = (Date.now() - alert.triggeredAt) / 1000;
        if (elapsed >= alert.repeatEvery) {
          if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
            shouldNotify = true;
          } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
            shouldNotify = true;
          }
        }
      }

      if (shouldNotify) {
        this.fireAlert(alert, currentPrice);
      }
    }
  }

  private async fireAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    const conditionText = alert.condition === 'above' ? '⬆ выше' : '⬇ ниже';
    this.log(`🔔 ALERT: ${alert.displayName} ${conditionText} ${alert.targetPrice} (current: ${currentPrice})`);

    // Send system notification
    const result = await sendNotification(
      alert,
      currentPrice,
      this.config.get().notificationUrgency
    );

    if (!result.success) {
      this.log(`Notification failed (${result.method}): ${result.error}`);
    }

    // Play sound
    if (this.config.get().soundEnabled) {
      playAlertSound();
    }

    // Update alert state
    this.config.updateAlert(alert.id, {
      triggered: true,
      triggeredAt: Date.now(),
      lastNotifiedPrice: currentPrice,
    });
  }

  private shutdown(): void {
    this.log('Daemon shutting down...');
    this.running = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }

    // Disconnect TradingView WebSocket
    disconnectProvider();

    // Remove PID file
    const pidFile = this.config.get().pidFile;
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile);
    }

    this.log('Daemon stopped');
    process.exit(0);
  }

  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}`;
    console.log(line);
    
    // Also write to log file
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      fs.appendFileSync(this.logFile, line + '\n');
    } catch {
      // Ignore log file errors
    }
  }
}
