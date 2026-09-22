#!/usr/bin/env node

/**
 * Price Alert Daemon — CLI Interface
 * 
 * Commands:
 *   start              Start the daemon in background
 *   stop               Stop the daemon
 *   restart            Restart the daemon
 *   status             Show daemon status
 *   logs [lines]       Show recent log lines
 *   add                Add a new price alert (interactive)
 *   list               List all alerts
 *   remove <id>        Remove an alert
 *   enable <id>        Enable an alert
 *   disable <id>       Disable an alert
 *   reset <id>         Reset a triggered alert
 *   symbols [query]    List available symbols
 *   test               Send a test notification
 */

import * as fs from 'fs';
import * as path from 'path';
import { spawn, exec } from 'child_process';
import { ConfigManager } from './config';
import { PriceAlertDaemon } from './daemon';
import { PriceAlert } from './types';
import { SYMBOL_CATALOG, getSymbolsByGroup, searchSymbols, getTradingViewUrl } from './symbols';
import { sendNotification } from './notifier';

const DAEMON_SCRIPT = path.join(__dirname, 'daemon-runner.js');
const HOME = process.env.HOME || '/tmp';
const DATA_DIR = path.join(HOME, '.price-alert-daemon');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const PID_FILE = '/tmp/price-alert-daemon.pid';
const LOG_FILE = '/tmp/price-alert-daemon.log';

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const config = new ConfigManager(CONFIG_PATH);
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'start':
      await startDaemon();
      break;
    case 'stop':
      await stopDaemon();
      break;
    case 'restart':
      await stopDaemon();
      setTimeout(() => startDaemon(), 1000);
      break;
    case 'status':
      showStatus();
      break;
    case 'logs':
      showLogs(parseInt(args[1]) || 50);
      break;
    case 'add':
      await addAlert();
      break;
    case 'list':
      listAlerts();
      break;
    case 'remove':
    case 'rm':
      removeAlert(args[1]);
      break;
    case 'enable':
      toggleAlert(args[1], true);
      break;
    case 'disable':
      toggleAlert(args[1], false);
      break;
    case 'reset':
      resetAlert(args[1]);
      break;
    case 'symbols':
      showSymbols(args[1]);
      break;
    case 'test':
      await testNotification();
      break;
    case 'run':
      // Internal: run daemon in foreground (used by start command)
      await runDaemonForeground();
      break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// ─── Commands ──────────────────────────────────────────────────

async function startDaemon(): Promise<void> {
  if (isRunning()) {
    console.log('⚠️  Daemon is already running (PID: ' + getPid() + ')');
    return;
  }

  console.log('🚀 Starting Price Alert Daemon...');
  
  // Fork the daemon process
  const child = spawn('node', [__filename, 'run'], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PRICE_ALERT_CONFIG: CONFIG_PATH },
  });

  // Save PID
  if (child.pid) {
    fs.writeFileSync(PID_FILE, child.pid.toString());
  }

  // Pipe output to log file
  const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);

  child.unref();

  // Wait a moment and check
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  if (isRunning()) {
    console.log(`✅ Daemon started successfully`);
    console.log(`   PID: ${child.pid}`);
    console.log(`   Port: ${config.get().port}`);
    console.log(`   Web UI: http://localhost:${config.get().port}`);
    console.log(`   Logs: tail -f ${LOG_FILE}`);
  } else {
    console.error('❌ Failed to start daemon. Check logs:');
    console.error(`   tail -20 ${LOG_FILE}`);
  }
}

async function stopDaemon(): Promise<void> {
  const pid = getPid();
  if (!pid || !isRunning()) {
    console.log('ℹ️  Daemon is not running');
    // Clean up stale PID file
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    return;
  }

  console.log(`🛑 Stopping daemon (PID: ${pid})...`);
  
  try {
    process.kill(pid, 'SIGTERM');
    // Wait for process to die
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!isRunning()) break;
    }
    
    if (isRunning()) {
      process.kill(pid, 'SIGKILL');
    }
    
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    console.log('✅ Daemon stopped');
  } catch (e) {
    console.error('❌ Error stopping daemon:', e);
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  }
}

function showStatus(): void {
  const running = isRunning();
  const pid = getPid();
  const cfg = config.get();
  const alerts = config.getAlerts();

  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║       Price Alert Daemon — Status        ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Running:    ${running ? '✅ Yes' : '❌ No'}                       ║`);
  if (running && pid) {
    console.log(`║  PID:        ${String(pid).padEnd(28)}║`);
  }
  console.log(`║  Port:       ${String(cfg.port).padEnd(28)}║`);
  console.log(`║  Poll:       ${String(cfg.pollInterval + 's').padEnd(28)}║`);
  console.log(`║  Alerts:     ${String(alerts.length).padEnd(28)}║`);
  console.log(`║  Active:     ${String(alerts.filter(a => a.enabled && !a.triggered).length).padEnd(28)}║`);
  console.log(`║  Triggered:  ${String(alerts.filter(a => a.triggered).length).padEnd(28)}║`);
  console.log(`║  Sound:      ${String(cfg.soundEnabled ? '🔊 On' : '🔇 Off').padEnd(28)}║`);
  console.log(`║  Config:     ${CONFIG_PATH.substring(0, 28).padEnd(28)}║`);
  if (running) {
    console.log(`║  Web UI:     ${('http://localhost:' + cfg.port).padEnd(28)}║`);
  }
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
}

function showLogs(lines: number): void {
  if (!fs.existsSync(LOG_FILE)) {
    console.log('No log file found');
    return;
  }
  
  const content = fs.readFileSync(LOG_FILE, 'utf-8');
  const allLines = content.trim().split('\n');
  const recent = allLines.slice(-lines);
  console.log(recent.join('\n'));
}

async function addAlert(): Promise<void> {
  // Interactive: parse from args or prompt
  // Usage: price-alert add <symbol> <price> [above|below|cross] [repeat_seconds]
  
  const symbol = args[1];
  const price = args[2];
  const condition = (args[3] as 'above' | 'below' | 'cross') || 'above';
  const repeat = parseInt(args[4]) || 0;

  if (!symbol || !price) {
    console.log('Usage: price-alert add <symbol> <target_price> [above|below|cross] [repeat_seconds]');
    console.log('');
    console.log('Conditions:');
    console.log('  above  — срабатывает когда цена ВЫШЕ target');
    console.log('  below  — срабатывает когда цена НИЖЕ target');
    console.log('  cross  — срабатывает при ПЕРЕСЕЧЕНИИ target с любой стороны');
    console.log('');
    console.log('Examples:');
    console.log('  price-alert add "CME_MINI:ES1!" 5800 above');
    console.log('  price-alert add "COMEX:GC1!" 2400 below');
    console.log('  price-alert add "FX:EURUSD" 1.10 cross 300');
    console.log('  price-alert add "FXCM:GBPUSD" 1.27 cross');
    console.log('  price-alert add "NYMEX:CL1!" 75 below 60');
    console.log('');
    console.log('Available symbols:');
    console.log('  price-alert symbols          — list all');
    console.log('  price-alert symbols forex    — search forex');
    return;
  }

  // Find symbol info
  const symInfo = SYMBOL_CATALOG.find(s => s.yahoo === symbol);
  const displayName = symInfo?.displayName || symbol;
  const category = symInfo?.category || 'forex';

  const alert: PriceAlert = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    symbol,
    displayName,
    targetPrice: parseFloat(price),
    condition,
    enabled: true,
    triggered: false,
    repeatEvery: repeat,
    createdAt: Date.now(),
    category,
  };

  config.addAlert(alert);
  
  console.log(`✅ Alert added:`);
  console.log(`   ID: ${alert.id}`);
  console.log(`   Symbol: ${displayName} (${symbol})`);
  const condText = condition === 'above' ? '⬆ Above' : condition === 'below' ? '⬇ Below' : '↔ Cross';
  console.log(`   Condition: ${condText} ${price}`);
  if (repeat > 0) {
    console.log(`   Repeat: every ${repeat}s`);
  }
  console.log('');
  console.log(`TradingView: ${getTradingViewUrl(symbol)}`);
}

function listAlerts(): void {
  const alerts = config.getAlerts();
  
  if (alerts.length === 0) {
    console.log('No alerts configured.');
    console.log('Add one: price-alert add <symbol> <price> [above|below]');
    return;
  }

  console.log('');
  console.log('┌─────┬──────────────────────┬───────────┬─────────┬────────┬──────────┐');
  console.log('│ ID  │ Symbol               │ Target    │ Cond.   │ Status │ Repeat   │');
  console.log('├─────┼──────────────────────┼───────────┼─────────┼────────┼──────────┤');
  
  for (const alert of alerts) {
    const id = alert.id.substring(0, 4);
    const name = alert.displayName.substring(0, 20).padEnd(20);
    const target = String(alert.targetPrice).padEnd(9);
    const cond = (alert.condition === 'above' ? '⬆ above' : alert.condition === 'below' ? '⬇ below' : '↔ cross').padEnd(7);
    let status: string;
    if (alert.triggered) status = '🔔 HIT ';
    else if (!alert.enabled) status = '⏸ OFF ';
    else status = '✅ ON  ';
    const repeat = alert.repeatEvery > 0 ? `${alert.repeatEvery}s` : 'once';
    
    console.log(`│ ${id.padEnd(3)} │ ${name} │ ${target} │ ${cond} │ ${status} │ ${repeat.padEnd(8)} │`);
  }
  
  console.log('└─────┴──────────────────────┴───────────┴─────────┴────────┴──────────┘');
  console.log('');
}

function removeAlert(id?: string): void {
  if (!id) {
    console.log('Usage: price-alert remove <id>');
    console.log('Use "price-alert list" to see alert IDs');
    return;
  }

  // Find by partial ID match
  const alerts = config.getAlerts();
  const match = alerts.find(a => a.id === id || a.id.startsWith(id));
  if (!match) {
    console.error(`❌ Alert not found: ${id}`);
    return;
  }

  config.removeAlert(match.id);
  console.log(`✅ Removed: ${match.displayName} ${match.condition} ${match.targetPrice}`);
}

function toggleAlert(id: string | undefined, enable: boolean): void {
  if (!id) {
    console.log(`Usage: price-alert ${enable ? 'enable' : 'disable'} <id>`);
    return;
  }

  const alerts = config.getAlerts();
  const match = alerts.find(a => a.id === id || a.id.startsWith(id));
  if (!match) {
    console.error(`❌ Alert not found: ${id}`);
    return;
  }

  config.updateAlert(match.id, { enabled: enable });
  console.log(`${enable ? '✅ Enabled' : '⏸ Disabled'}: ${match.displayName} ${match.condition} ${match.targetPrice}`);
}

function resetAlert(id: string | undefined): void {
  if (!id) {
    console.log('Usage: price-alert reset <id>');
    return;
  }

  const alerts = config.getAlerts();
  const match = alerts.find(a => a.id === id || a.id.startsWith(id));
  if (!match) {
    console.error(`❌ Alert not found: ${id}`);
    return;
  }

  config.updateAlert(match.id, { triggered: false, triggeredAt: undefined, lastNotifiedPrice: undefined });
  console.log(`✅ Reset: ${match.displayName} ${match.condition} ${match.targetPrice}`);
}

function showSymbols(query?: string): void {
  if (query) {
    const results = searchSymbols(query);
    if (results.length === 0) {
      console.log(`No symbols found for: ${query}`);
      return;
    }
    console.log(`\nSearch results for "${query}":\n`);
    for (const s of results) {
      console.log(`  ${s.yahoo.padEnd(15)} ${s.displayName.padEnd(30)} ${s.group}`);
    }
  } else {
    const groups = getSymbolsByGroup();
    console.log('\n📊 Available Symbols:\n');
    for (const [group, symbols] of Object.entries(groups)) {
      console.log(`\n  ${group}:`);
      for (const s of symbols) {
        console.log(`    ${s.yahoo.padEnd(15)} ${s.displayName}`);
      }
    }
  }
  console.log('');
}

async function testNotification(): Promise<void> {
  console.log('📤 Sending test notification...');
  
  const testAlert: PriceAlert = {
    id: 'test',
    symbol: 'GC=F',
    displayName: 'Gold (GC)',
    targetPrice: 2500,
    condition: 'above',
    enabled: true,
    triggered: false,
    repeatEvery: 0,
    createdAt: Date.now(),
    category: 'futures_metals',
  };

  const result = await sendNotification(testAlert, 2501.50, 'critical');
  
  if (result.success) {
    console.log(`✅ Notification sent via ${result.method}`);
    console.log('   If you see it with a button, click it to test the URL opening.');
  } else {
    console.error(`❌ Notification failed (${result.method}): ${result.error}`);
    console.error('   Make sure notify-send is installed: sudo apt install libnotify-bin');
  }
}

async function runDaemonForeground(): Promise<void> {
  const configPath = process.env.PRICE_ALERT_CONFIG || CONFIG_PATH;
  const daemon = new PriceAlertDaemon(configPath);
  
  // Write PID
  fs.writeFileSync(PID_FILE, process.pid.toString());
  
  await daemon.start();
}

// ─── Helpers ───────────────────────────────────────────────────

function isRunning(): boolean {
  const pid = getPid();
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getPid(): number | null {
  if (!fs.existsSync(PID_FILE)) return null;
  const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
  return isNaN(pid) ? null : pid;
}

function showHelp(): void {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║          Price Alert Daemon — Linux Service              ║
║    System notifications for price levels with actions    ║
╚══════════════════════════════════════════════════════════╝

USAGE:
  price-alert <command> [options]

DAEMON CONTROL:
  start              Start daemon in background
  stop               Stop daemon
  restart            Restart daemon
  status             Show daemon status
  logs [lines]       Show recent logs (default: 50)

ALERT MANAGEMENT:
  add <sym> <price> [above|below|cross] [repeat_sec]
                     Add a price alert
                     above  — price goes ABOVE target
                     below  — price goes BELOW target
                     cross  — price CROSSES target (either direction)
  list               List all alerts
  remove <id>        Remove an alert
  enable <id>        Enable an alert
  disable <id>       Disable an alert
  reset <id>         Reset a triggered alert

SYMBOLS:
  symbols [query]    List/search available symbols

OTHER:
  test               Send a test notification
  help               Show this help

EXAMPLES:
  price-alert start
  price-alert add "CME_MINI:ES1!" 5800 above
  price-alert add "COMEX:GC1!" 2400 below 300
  price-alert add "FX:EURUSD" 1.10 cross
  price-alert add "FXCM:GBPUSD" 1.27 cross 60
  price-alert add "NYMEX:CL1!" 75 below 60
  price-alert list
  price-alert symbols forex
  price-alert test

SUPPORTED MARKETS:
  • FOREX Majors (EUR/USD, GBP/USD, USD/JPY, ...)
  • Futures — Indices (ES, NQ, YM, RTY, VIX)
  • Futures — Energy (Crude Oil, Brent, NatGas, ...)
  • Futures — Metals (Gold, Silver, Platinum, ...)
  • Futures — Agriculture (Corn, Soybeans, Wheat, ...)
  • Crypto (BTC, ETH, SOL, ...)

NOTIFICATIONS:
  Notifications are sent via Linux desktop notifications
  (notify-send / DBus) with a button to open TradingView.
  
  Requirements:
    • libnotify-bin (notify-send)
    • A notification daemon (dunst, mako, gnome-shell, etc.)
    • xdg-utils (xdg-open for URL opening)
`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
