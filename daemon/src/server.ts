import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { ConfigManager } from './config';
import { PriceData, DaemonStatus, PriceAlert } from './types';
import { SYMBOL_CATALOG, getSymbolsByGroup, searchSymbols, getTradingViewUrl } from './symbols';
import { getProviderInfo } from './provider';

interface ServerDeps {
  config: ConfigManager;
  prices: Record<string, PriceData>;
  startTime: number;
  lastPollTime: number;
}

export function createServer(deps: ServerDeps): http.Server {
  const { config, prices, startTime } = deps;

  const server = http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://localhost:${config.get().port}`);
    const pathname = url.pathname;

    try {
      // ─── API Routes ────────────────────────────────────────
      if (pathname.startsWith('/api/')) {
        res.setHeader('Content-Type', 'application/json');
        handleApiRequest(req, res, pathname, url, deps);
        return;
      }

      // ─── Static files (serve web UI) ───────────────────────
      serveStaticFile(req, res, pathname);
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  return server;
}

function handleApiRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  pathname: string,
  url: URL,
  deps: ServerDeps
): void {
  const { config, prices, startTime, lastPollTime } = deps;

  // GET /api/status
  if (pathname === '/api/status' && req.method === 'GET') {
    const alerts = config.getAlerts();
    const status: DaemonStatus = {
      running: true,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      pid: process.pid,
      alertsCount: alerts.length,
      activeAlerts: alerts.filter(a => a.enabled && !a.triggered).length,
      triggeredAlerts: alerts.filter(a => a.triggered).length,
      symbolsTracked: Object.keys(prices).length,
      lastPoll: lastPollTime,
      version: '1.0.0',
    };
    sendJson(res, 200, status);
    return;
  }

  // GET /api/prices
  if (pathname === '/api/prices' && req.method === 'GET') {
    sendJson(res, 200, prices);
    return;
  }

  // GET /api/alerts
  if (pathname === '/api/alerts' && req.method === 'GET') {
    sendJson(res, 200, config.getAlerts());
    return;
  }

  // POST /api/alerts
  if (pathname === '/api/alerts' && req.method === 'POST') {
    readBody(req).then(body => {
      const data = JSON.parse(body);
      const alert: PriceAlert = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        symbol: data.symbol,
        displayName: data.displayName || data.symbol,
        targetPrice: parseFloat(data.targetPrice),
        condition: data.condition || 'above',
        enabled: true,
        triggered: false,
        repeatEvery: data.repeatEvery || 0,
        createdAt: Date.now(),
        category: data.category || 'forex',
      };
      config.addAlert(alert);
      sendJson(res, 201, alert);
    });
    return;
  }

  // PUT /api/alerts/:id
  const alertMatch = pathname.match(/^\/api\/alerts\/([^/]+)$/);
  if (alertMatch) {
    const id = alertMatch[1];
    if (req.method === 'PUT') {
      readBody(req).then(body => {
        const data = JSON.parse(body);
        const updated = config.updateAlert(id, data);
        if (updated) {
          sendJson(res, 200, updated);
        } else {
          sendJson(res, 404, { error: 'Alert not found' });
        }
      });
      return;
    }
    if (req.method === 'DELETE') {
      const removed = config.removeAlert(id);
      if (removed) {
        sendJson(res, 200, { success: true });
      } else {
        sendJson(res, 404, { error: 'Alert not found' });
      }
      return;
    }
  }

  // GET /api/symbols
  if (pathname === '/api/symbols' && req.method === 'GET') {
    const groups = getSymbolsByGroup();
    sendJson(res, 200, { groups, catalog: SYMBOL_CATALOG });
    return;
  }

  // GET /api/symbols/search?q=...
  if (pathname === '/api/symbols/search' && req.method === 'GET') {
    const q = url.searchParams.get('q') || '';
    const results = searchSymbols(q);
    sendJson(res, 200, results);
    return;
  }

  // GET /api/symbols/:yahooSymbol/url
  const urlMatch = pathname.match(/^\/api\/symbols\/([^/]+)\/url$/);
  if (urlMatch && req.method === 'GET') {
    const yahooSymbol = decodeURIComponent(urlMatch[1]);
    const tvUrl = getTradingViewUrl(yahooSymbol);
    sendJson(res, 200, { url: tvUrl });
    return;
  }

  // GET /api/providers — show data source status
  if (pathname === '/api/providers' && req.method === 'GET') {
    sendJson(res, 200, { providers: getProviderInfo() });
    return;
  }

  // 404
  sendJson(res, 404, { error: 'Not found' });
}

function serveStaticFile(req: http.IncomingMessage, res: http.ServerResponse, pathname: string): void {
  // Serve the built web UI
  let filePath: string;
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, '../../dist/index.html');
  } else {
    filePath = path.join(__dirname, '../../dist', pathname);
  }

  // Security: prevent path traversal
  const distDir = path.resolve(path.join(__dirname, '../../dist'));
  if (!path.resolve(filePath).startsWith(distDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath)) {
    // SPA fallback
    filePath = path.join(__dirname, '../../dist/index.html');
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
  }

  const ext = path.extname(filePath);
  const mimeTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  const content = fs.readFileSync(filePath);
  res.writeHead(200);
  res.end(content);
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status);
  res.end(JSON.stringify(data));
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}
