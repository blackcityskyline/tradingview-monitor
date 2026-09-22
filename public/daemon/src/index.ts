#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { ConfigManager } from './config';
import { PriceAlertDaemon } from './daemon';
import { PriceAlert } from './types';
import { SYMBOL_CATALOG, getSymbolsByGroup, searchSymbols, getTradingViewUrl } from './symbols';

const HOME = process.env.HOME || '/tmp';
const DATA_DIR = path.join(HOME, '.price-alert-daemon');
const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
const PID_FILE = '/tmp/price-alert-daemon.pid';
const LOG_FILE = '/tmp/price-alert-daemon.log';

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const config = new ConfigManager(CONFIG_PATH);
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  switch (command) {
    case 'start': await startDaemon(); break;
    case 'stop': await stopDaemon(); break;
    case 'restart': await stopDaemon(); setTimeout(() => startDaemon(), 1000); break;
    case 'status': showStatus(); break;
    case 'logs': showLogs(parseInt(args[1]) || 50); break;
    case 'add': await addAlert(); break;
    case 'list': listAlerts(); break;
    case 'remove': case 'rm': removeAlert(args[1]); break;
    case 'enable': toggleAlert(args[1], true); break;
    case 'disable': toggleAlert(args[1], false); break;
    case 'reset': resetAlert(args[1]); break;
    case 'symbols': showSymbols(args[1]); break;
    case 'test': await testNotification(); break;
    case 'run': await runDaemonForeground(); break;
    case 'help': case '--help': case '-h': case undefined: showHelp(); break;
    default: console.error(`Unknown command: ${command}`); showHelp(); process.exit(1);
  }
}

async function startDaemon(): Promise<void> {
  if (isRunning()) { console.log('⚠️  Daemon is already running (PID: ' + getPid() + ')'); return; }
  console.log('🚀 Starting Price Alert Daemon...');
  const child = spawn('node', [__filename, 'run'], { detached: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, PRICE_ALERT_CONFIG: CONFIG_PATH } });
  if (child.pid) fs.writeFileSync(PID_FILE, child.pid.toString());
  const logStream = fs.createWriteStream(LOG_FILE, { flags: 'a' });
  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);
  child.unref();
  await new Promise(resolve => setTimeout(resolve, 1500));
  if (isRunning()) {
    console.log(`✅ Daemon started (PID: ${child.pid}, Port: ${config.get().port})`);
    console.log(`   Web UI: http://localhost:${config.get().port}`);
  } else {
    console.error('❌ Failed to start daemon');
  }
}

async function stopDaemon(): Promise<void> {
  const pid = getPid();
  if (!pid || !isRunning()) { console.log('ℹ️  Daemon is not running'); if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); return; }
  console.log(`🛑 Stopping daemon (PID: ${pid})...`);
  try {
    process.kill(pid, 'SIGTERM');
    for (let i = 0; i < 10; i++) { await new Promise(resolve => setTimeout(resolve, 500)); if (!isRunning()) break; }
    if (isRunning()) process.kill(pid, 'SIGKILL');
    if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
    console.log('✅ Daemon stopped');
  } catch (e) { console.error('❌ Error:', e); if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE); }
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
  if (running && pid) console.log(`║  PID:        ${String(pid).padEnd(28)}║`);
  console.log(`║  Port:       ${String(cfg.port).padEnd(28)}║`);
  console.log(`║  Poll:       ${String(cfg.pollInterval + 's').padEnd(28)}║`);
  console.log(`║  Alerts:     ${String(alerts.length).padEnd(28)}║`);
  console.log(`║  Active:     ${String(alerts.filter(a => a.enabled && !a.triggered).length).padEnd(28)}║`);
  console.log(`║  Triggered:  ${String(alerts.filter(a => a.triggered).length).padEnd(28)}║`);
  if (running) console.log(`║  Web UI:     ${('http://localhost:' + cfg.port).padEnd(28)}║`);
  console.log('╚══════════════════════════════════════════╝');
}

function showLogs(lines: number): void {
  if (!fs.existsSync(LOG_FILE)) { console.log('No log file found'); return; }
  const content = fs.readFileSync(LOG_FILE, 'utf-8');
  console.log(content.trim().split('\n').slice(-lines).join('\n'));
}

async function addAlert(): Promise<void> {
  const symbol = args[1];
  const price = args[2];
  const condition = (args[3] as 'above' | 'below') || 'above';
  const repeat = parseInt(args[4]) || 0;
  if (!symbol || !price) {
    console.log('Usage: price-alert add <symbol> <target_price> [above|below] [repeat_seconds]');
    console.log('Examples:');
    console.log('  price-alert add "CME_MINI:ES1!" 5800 above');
    console.log('  price-alert add "COMEX:GC1!" 2400 below');
    console.log('  price-alert add "FX:EURUSD" 1.10 above 300');
    return;
  }
  const symInfo = SYMBOL_CATALOG.find(s => s.yahoo === symbol);
  const alert: PriceAlert = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    symbol, displayName: symInfo?.displayName || symbol,
    targetPrice: parseFloat(price), condition, enabled: true,
    triggered: false, repeatEvery: repeat, createdAt: Date.now(),
    category: symInfo?.category || 'forex',
  };
  config.addAlert(alert);
  console.log(`✅ Alert added: ${alert.displayName} ${condition} ${price}`);
  console.log(`   TradingView: ${getTradingViewUrl(symbol)}`);
}

function listAlerts(): void {
  const alerts = config.getAlerts();
  if (alerts.length === 0) { console.log('No alerts configured.'); return; }
  console.log('');
  console.log('┌─────┬──────────────────────┬───────────┬─────────┬────────┐');
  console.log('│ ID  │ Symbol               │ Target    │ Cond.   │ Status │');
  console.log('├─────┼──────────────────────┼───────────┼─────────┼────────┤');
  for (const alert of alerts) {
    const id = alert.id.substring(0, 4);
    const name = alert.displayName.substring(0, 20).padEnd(20);
    const target = String(alert.targetPrice).padEnd(9);
    const cond = (alert.condition === 'above' ? '⬆ above' : '⬇ below').padEnd(7);
    const status = alert.triggered ? '🔔 HIT ' : !alert.enabled ? '⏸ OFF ' : '✅ ON  ';
    console.log(`│ ${id.padEnd(3)} │ ${name} │ ${target} │ ${cond} │ ${status} │`);
  }
  console.log('└─────┴──────────────────────┴───────────┴─────────┴────────┘');
}

function removeAlert(id?: string): void {
  if (!id) { console.log('Usage: price-alert remove <id>'); return; }
  const alerts = config.getAlerts();
  const match = alerts.find(a => a.id === id || a.id.startsWith(id));
  if (!match) { console.error(`❌ Alert not found: ${id}`); return; }
  config.removeAlert(match.id);
  console.log(`✅ Removed: ${match.displayName}`);
}

function toggleAlert(id: string | undefined, enable: boolean): void {
  if (!id) { console.log(`Usage: price-alert ${enable ? 'enable' : 'disable'} <id>`); return; }
  const alerts = config.getAlerts();
  const match = alerts.find(a => a.id === id || a.id.startsWith(id));
  if (!match) { console.error(`❌ Alert not found: ${id}`); return; }
  config.updateAlert(match.id, { enabled: enable });
  console.log(`${enable ? '✅ Enabled' : '⏸ Disabled'}: ${match.displayName}`);
}

function resetAlert(id: string | undefined): void {
  if (!id) { console.log('Usage: price-alert reset <id>'); return; }
  const alerts = config.getAlerts();
  const match = alerts.find(a => a.id === id || a.id.startsWith(id));
  if (!match) { console.error(`❌ Alert not found: ${id}`); return; }
  config.updateAlert(match.id, { triggered: false, triggeredAt: undefined, lastNotifiedPrice: undefined });
  console.log(`✅ Reset: ${match.displayName}`);
}

function showSymbols(query?: string): void {
  if (query) {
    const results = searchSymbols(query);
    if (results.length === 0) { console.log(`No symbols found for: ${query}`); return; }
    console.log(`\nSearch results for "${query}":\n`);
    for (const s of results) console.log(`  ${s.yahoo.padEnd(20)} ${s.displayName.padEnd(30)} ${s.group}`);
  } else {
    const groups = getSymbolsByGroup();
    console.log('\n📊 Available Symbols:\n');
    for (const [group, symbols] of Object.entries(groups)) {
      console.log(`\n  ${group}:`);
      for (const s of symbols) console.log(`    ${s.yahoo.padEnd(20)} ${s.displayName}`);
    }
  }
}

async function testNotification(): Promise<void> {
  console.log('📤 Sending test notification...');
  const { sendNotification } = await import('./notifier');
  const testAlert: PriceAlert = {
    id: 'test', symbol: 'COMEX:GC1!', displayName: 'Gold (GC)',
    targetPrice: 2500, condition: 'above', enabled: true,
    triggered: false, repeatEvery: 0, createdAt: Date.now(), category: 'futures_metals',
  };
  const result = await sendNotification(testAlert, 2501.50, 'critical');
  if (result.success) console.log(`✅ Notification sent via ${result.method}`);
  else console.error(`❌ Failed (${result.method}): ${result.error}`);
}

async function runDaemonForeground(): Promise<void> {
  const configPath = process.env.PRICE_ALERT_CONFIG || CONFIG_PATH;
  const daemon = new PriceAlertDaemon(configPath);
  fs.writeFileSync(PID_FILE, process.pid.toString());
  await daemon.start();
}

function isRunning(): boolean {
  const pid = getPid();
  if (!pid) return false;
  try { process.kill(pid, 0); return true; } catch { return false; }
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
╚══════════════════════════════════════════════════════════╝

USAGE: price-alert <command> [options]

DAEMON: start, stop, restart, status, logs [lines]
ALERTS: add <sym> <price> [above|below] [repeat], list, remove <id>, enable <id>, disable <id>, reset <id>
SYMBOLS: symbols [query]
OTHER: test, help

EXAMPLES:
  price-alert start
  price-alert add "CME_MINI:ES1!" 5800 above
  price-alert add "COMEX:GC1!" 2400 below 300
  price-alert add "FX:EURUSD" 1.10 above
  price-alert symbols oil
`);
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });
