import * as fs from 'fs';
import * as path from 'path';
import { DaemonConfig, PriceAlert } from './types';

const DEFAULT_CONFIG: DaemonConfig = {
  port: 3456,
  pollInterval: 10,
  dataDir: path.join(process.env.HOME || '/tmp', '.price-alert-daemon'),
  pidFile: '/tmp/price-alert-daemon.pid',
  logFile: '/tmp/price-alert-daemon.log',
  alerts: [],
  soundEnabled: true,
  notificationUrgency: 'critical',
};

export class ConfigManager {
  private configPath: string;
  private config: DaemonConfig;

  constructor(configPath?: string) {
    this.configPath = configPath || path.join(process.env.HOME || '/tmp', '.price-alert-daemon', 'config.json');
    this.config = this.load();
  }

  private load(): DaemonConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.error(`Failed to load config from ${this.configPath}:`, e);
    }
    return { ...DEFAULT_CONFIG };
  }

  save(): void {
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
  }

  get(): DaemonConfig {
    return this.config;
  }

  update(partial: Partial<DaemonConfig>): DaemonConfig {
    this.config = { ...this.config, ...partial };
    this.save();
    return this.config;
  }

  // Alert management
  addAlert(alert: PriceAlert): void {
    this.config.alerts.push(alert);
    this.save();
  }

  removeAlert(id: string): boolean {
    const idx = this.config.alerts.findIndex(a => a.id === id);
    if (idx >= 0) {
      this.config.alerts.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  updateAlert(id: string, partial: Partial<PriceAlert>): PriceAlert | null {
    const alert = this.config.alerts.find(a => a.id === id);
    if (alert) {
      Object.assign(alert, partial);
      this.save();
      return alert;
    }
    return null;
  }

  getAlerts(): PriceAlert[] {
    return this.config.alerts;
  }

  getAlert(id: string): PriceAlert | undefined {
    return this.config.alerts.find(a => a.id === id);
  }
}
