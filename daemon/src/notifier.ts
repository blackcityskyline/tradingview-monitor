import { exec } from 'child_process';
import { PriceAlert } from './types';
import { getTradingViewUrl, findSymbol } from './symbols';

/**
 * Linux system notification sender using DBus (via gdbus/notify-send)
 * Supports action buttons that open TradingView charts
 */

interface NotifyResult {
  success: boolean;
  method: string;
  error?: string;
}

/**
 * Send a desktop notification with an action button
 */
export async function sendNotification(
  alert: PriceAlert,
  currentPrice: number,
  urgency: 'low' | 'normal' | 'critical' = 'critical'
): Promise<NotifyResult> {
  const symbolInfo = findSymbol(alert.symbol);
  const displayName = symbolInfo?.displayName || alert.displayName || alert.symbol;
  const tvUrl = getTradingViewUrl(alert.symbol);
  
  const conditionText = alert.condition === 'above' ? '⬆ Выше' : '⬇ Ниже';
  const title = `🔔 ${displayName}: ${conditionText} ${formatPrice(alert.targetPrice)}`;
  const body = `Текущая цена: ${formatPrice(currentPrice)}\n${tvUrl}`;

  // Method 1: Try notify-send with actions (works with dunst, mako, notify-osd)
  try {
    const result = await notifySend(title, body, tvUrl, urgency);
    if (result.success) return result;
  } catch (e) {
    // Fall through to method 2
  }

  // Method 2: Try gdbus directly (more reliable for actions)
  try {
    const result = await gdbusNotify(title, body, tvUrl, urgency);
    if (result.success) return result;
  } catch (e) {
    // Fall through to method 3
  }

  // Method 3: Simple notify-send without actions
  try {
    const result = await simpleNotifySend(title, body, urgency);
    if (result.success) return result;
  } catch (e) {
    return { success: false, method: 'none', error: String(e) };
  }

  return { success: false, method: 'none', error: 'All notification methods failed' };
}

/**
 * notify-send with action button
 */
function notifySend(title: string, body: string, url: string, urgency: string): Promise<NotifyResult> {
  return new Promise((resolve) => {
    const escapedTitle = escapeShell(title);
    const escapedBody = escapeShell(body);
    const escapedUrl = escapeShell(url);
    
    const cmd = `notify-send "${escapedTitle}" "${escapedBody}" ` +
      `--app-name="PriceAlert" ` +
      `--urgency=${urgency} ` +
      `--action="open=📊 Открыть график" ` +
      `--hint=string:x-canonical-private-synchronous:price-alert`;

    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, method: 'notify-send', error: stderr || error.message });
        return;
      }
      
      // Parse action response
      const action = stdout.trim();
      if (action === 'open' || action.includes('open')) {
        // User clicked the button — open TradingView
        exec(`xdg-open "${escapedUrl}"`, { timeout: 5000 });
      }
      
      resolve({ success: true, method: 'notify-send' });
    });
  });
}

/**
 * gdbus notification (more reliable action handling)
 */
function gdbusNotify(title: string, body: string, url: string, urgency: string): Promise<NotifyResult> {
  return new Promise((resolve) => {
    const escapedTitle = escapeShell(title);
    const escapedBody = escapeShell(body);
    const escapedUrl = escapeShell(url);
    
    // Use gdbus to call org.freedesktop.Notifications
    const urgencyMap = { low: '1', normal: '2', critical: '3' };
    const cmd = `gdbus call --session ` +
      `--dest org.freedesktop.Notifications ` +
      `--object-path /org/freedesktop/Notifications ` +
      `--method org.freedesktop.Notifications.Notify ` +
      `"PriceAlert" 0 "dialog-information" ` +
      `"${escapedTitle}" "${escapedBody}" ` +
      `['open','📊 Открыть график'] ` +
      `{'urgency': <byte ${urgencyMap[urgency] || '2'}>} ` +
      `0`;

    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, method: 'gdbus', error: stderr || error.message });
        return;
      }
      
      // Parse notification ID from response like "(uint32 42,)"
      const match = stdout.match(/uint32\s+(\d+)/);
      if (match) {
        const notifId = match[1];
        // Start listening for action on this notification
        listenForAction(notifId, url);
      }
      
      resolve({ success: true, method: 'gdbus' });
    });
  });
}

/**
 * Listen for notification action via dbus-monitor
 */
function listenForAction(notificationId: string, url: string): void {
  const cmd = `dbus-monitor "interface='org.freedesktop.Notifications',member='ActionInvoked'" --profile`;
  const proc = exec(cmd, { timeout: 30000 });
  
  proc.stdout?.on('data', (data: string) => {
    // Look for our notification ID and "open" action
    if (data.includes(notificationId) && data.includes('open')) {
      exec(`xdg-open "${escapeShell(url)}"`, { timeout: 5000 });
      proc.kill();
    }
  });

  // Auto-kill after 30 seconds
  setTimeout(() => {
    try { proc.kill(); } catch {}
  }, 30000);
}

/**
 * Simple notify-send without actions (fallback)
 */
function simpleNotifySend(title: string, body: string, urgency: string): Promise<NotifyResult> {
  return new Promise((resolve) => {
    const escapedTitle = escapeShell(title);
    const escapedBody = escapeShell(body);
    
    const cmd = `notify-send "${escapedTitle}" "${escapedBody}" ` +
      `--app-name="PriceAlert" ` +
      `--urgency=${urgency}`;

    exec(cmd, { timeout: 5000 }, (error) => {
      if (error) {
        resolve({ success: false, method: 'notify-send-simple', error: error.message });
      } else {
        resolve({ success: true, method: 'notify-send-simple' });
      }
    });
  });
}

/**
 * Play system alert sound
 */
export function playAlertSound(): void {
  // Try multiple sound methods
  const sounds = [
    'paplay /usr/share/sounds/freedesktop/stereo/message.oga',
    'aplay /usr/share/sounds/alsa/Front_Center.wav',
    'play -q -n synth 0.3 sine 880 fade 0.05 0.3 0.05',
  ];
  
  for (const cmd of sounds) {
    exec(cmd, { timeout: 3000 }, () => {
      // Ignore errors, just try the next one
    });
    break; // Only try the first available
  }
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
