import { exec } from 'child_process';
import { PriceAlert } from './types';
import { getTradingViewUrl, findSymbol } from './symbols';

export async function sendNotification(
  alert: PriceAlert,
  currentPrice: number,
  urgency: 'low' | 'normal' | 'critical' = 'critical'
): Promise<{success: boolean; method: string; error?: string}> {
  const symbolInfo = findSymbol(alert.symbol);
  const displayName = symbolInfo?.displayName || alert.displayName || alert.symbol;
  const tvUrl = getTradingViewUrl(alert.symbol);
  
  const conditionText = alert.condition === 'above' ? '⬆ Выше' : alert.condition === 'below' ? '⬇ Ниже' : '↔ Пересечение';
  const title = `🔔 ${displayName}: ${conditionText} ${formatPrice(alert.targetPrice)}`;
  const body = `Текущая цена: ${formatPrice(currentPrice)}\n${tvUrl}`;

  try {
    const result = await notifySend(title, body, tvUrl, urgency);
    if (result.success) return result;
  } catch (e) {}

  try {
    const result = await gdbusNotify(title, body, tvUrl, urgency);
    if (result.success) return result;
  } catch (e) {}

  try {
    const result = await simpleNotifySend(title, body, urgency);
    if (result.success) return result;
  } catch (e) {}

  return { success: false, method: 'none', error: 'All methods failed' };
}

function notifySend(title: string, body: string, url: string, urgency: string): Promise<{success: boolean; method: string; error?: string}> {
  return new Promise((resolve) => {
    const cmd = `notify-send "${escapeShell(title)}" "${escapeShell(body)}" --app-name="PriceAlert" --urgency=${urgency} --action="open=📊 Открыть график"`;
    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve({ success: false, method: 'notify-send', error: error.message });
        return;
      }
      const action = stdout.trim();
      if (action === 'open' || action.includes('open')) {
        exec(`xdg-open "${escapeShell(url)}"`, { timeout: 5000 });
      }
      resolve({ success: true, method: 'notify-send' });
    });
  });
}

function gdbusNotify(title: string, body: string, url: string, urgency: string): Promise<{success: boolean; method: string; error?: string}> {
  return new Promise((resolve) => {
    const urgencyMap: Record<string, string> = { low: '1', normal: '2', critical: '3' };
    const cmd = `gdbus call --session --dest org.freedesktop.Notifications --object-path /org/freedesktop/Notifications --method org.freedesktop.Notifications.Notify "PriceAlert" 0 "dialog-information" "${escapeShell(title)}" "${escapeShell(body)}" ['open','📊 Открыть график'] {'urgency': <byte ${urgencyMap[urgency] || '2'}>} 0`;
    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      if (error) {
        resolve({ success: false, method: 'gdbus', error: error.message });
        return;
      }
      const match = stdout.match(/uint32\s+(\d+)/);
      if (match) {
        const notifId = match[1];
        listenForAction(notifId, url);
      }
      resolve({ success: true, method: 'gdbus' });
    });
  });
}

function listenForAction(notificationId: string, url: string): void {
  const cmd = `dbus-monitor "interface='org.freedesktop.Notifications',member='ActionInvoked'" --profile`;
  const proc = exec(cmd, { timeout: 30000 });
  proc.stdout?.on('data', (data: string) => {
    if (data.includes(notificationId) && data.includes('open')) {
      exec(`xdg-open "${escapeShell(url)}"`, { timeout: 5000 });
      proc.kill();
    }
  });
  setTimeout(() => { try { proc.kill(); } catch {} }, 30000);
}

function simpleNotifySend(title: string, body: string, urgency: string): Promise<{success: boolean; method: string; error?: string}> {
  return new Promise((resolve) => {
    const cmd = `notify-send "${escapeShell(title)}" "${escapeShell(body)}" --app-name="PriceAlert" --urgency=${urgency}`;
    exec(cmd, { timeout: 5000 }, (error) => {
      if (error) {
        resolve({ success: false, method: 'notify-send-simple', error: error.message });
      } else {
        resolve({ success: true, method: 'notify-send-simple' });
      }
    });
  });
}

export function playAlertSound(): void {
  exec('paplay /usr/share/sounds/freedesktop/stereo/message.oga', { timeout: 3000 }, () => {});
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toFixed(2);
  if (price >= 1) return price.toFixed(4);
  if (price >= 0.01) return price.toFixed(6);
  return price.toFixed(8);
}

function escapeShell(str: string): string {
  return str.replace(/["\\$`!]/g, '\\$&');
}
