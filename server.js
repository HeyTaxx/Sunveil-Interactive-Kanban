/**
 * Sunveil Interactive Kanban & Mindmap - Hardened Local Server
 * 
 * 100% .EXE FREE: Runs purely on Node.js without binary executables.
 * 
 * Built-in Security Architecture:
 * 1. Strict Loopback Isolation: Binds exclusively to 127.0.0.1 (never 0.0.0.0 or LAN).
 * 2. DNS Rebinding Protection: Rejects spoofed or external Host headers.
 * 3. Cross-Site Attack Hardening: Rejects cross-origin requests from external web domains.
 * 4. Path Traversal & Sensitive File Protection: Strict path canonicalization, blocks /data/profile, /.git.
 * 5. DoS Prevention: Maximum payload limits on incoming POST bodies.
 * 6. MCP Tool Whitelisting: Validates tool names against allowed set.
 * 7. Modern Defensive Headers: nosniff, DENY framing, no-referrer.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const mcp = require('./mcp-server.js');

const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'kanban_data.json');
const PROFILE_DIR = path.join(DATA_DIR, 'profile');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Track file modification time / version for live sync with MCP
function getFileMtime() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return fs.statSync(DATA_FILE).mtimeMs;
    }
  } catch (e) {}
  return 0;
}

let lastHeartbeat = Date.now() + 20000; // 20s startup grace
const MAX_PAYLOAD_BYTES = 25 * 1024 * 1024; // 25 MB max (allows large mindmap drawings)

const ALLOWED_MCP_TOOLS = new Set([
  'kanban_get_board',
  'kanban_list_columns',
  'kanban_list_cards',
  'kanban_get_card',
  'kanban_create_card',
  'kanban_update_card',
  'kanban_move_card',
  'kanban_delete_card',
  'kanban_create_column',
  'kanban_add_mindmap_node'
]);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

// Security Check: Validate Host Header against DNS Rebinding attacks
function isValidHost(hostHeader) {
  if (!hostHeader) return false;
  const host = hostHeader.split(':')[0].toLowerCase();
  return host === '127.0.0.1' || host === 'localhost';
}

// Security Check: Validate Origin Header to prevent malicious websites from calling API
function isAllowedOrigin(originHeader) {
  if (!originHeader) return true; // Direct local browser / app window request
  try {
    const parsed = new URL(originHeader);
    const hostname = parsed.hostname.toLowerCase();
    return hostname === '127.0.0.1' || hostname === 'localhost';
  } catch (e) {
    return false;
  }
}

// Safe body reader with size protection against DoS
function readBody(req, limit = MAX_PAYLOAD_BYTES) {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        req.destroy();
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

const server = http.createServer(async (req, res) => {
  // 1. DNS Rebinding Protection: Verify Host Header
  if (!isValidHost(req.headers.host)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Invalid Host header (DNS rebinding protection).');
    return;
  }

  // 2. Cross-Site Protection: Verify Origin & Sec-Fetch-Site
  const origin = req.headers.origin;
  if (!isAllowedOrigin(origin)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Cross-origin access from external websites is blocked.');
    return;
  }

  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite === 'cross-site') {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Cross-site request rejected.');
    return;
  }

  // 3. Modern Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  // Strict CORS: Only echo verified local origins
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Update Heartbeat on valid requests
  lastHeartbeat = Date.now();

  const parsedUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // --------------------------------------------------------------------------
  // API Endpoints
  // --------------------------------------------------------------------------

  // 1. API: Ping / Heartbeat
  if (pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ pong: true, time: Date.now() }));
    return;
  }

  // 2. API: Shutdown on browser window close
  if (pathname === '/api/shutdown') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ bye: true }));
    setTimeout(() => {
      process.exit(0);
    }, 500);
    return;
  }

  // 3. API: Data Version / Timestamp (for real-time sync when MCP modifies file)
  if (pathname === '/api/version') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version: getFileMtime() }));
    return;
  }

  // 4. API: GET Data
  if (pathname === '/api/data' && req.method === 'GET') {
    if (fs.existsSync(DATA_FILE)) {
      try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(content);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end('{}');
      return;
    }
  }

  // 5. API: POST Data (with payload size enforcement & atomic write)
  if (pathname === '/api/data' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      // Validate that it's valid JSON before writing to disk
      JSON.parse(body);

      // Atomic write using temporary file
      const tempFile = DATA_FILE + '.tmp';
      fs.writeFileSync(tempFile, body, 'utf8');
      fs.renameSync(tempFile, DATA_FILE);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ saved: true, version: getFileMtime() }));
    } catch (err) {
      const status = err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 6. API: MCP HTTP endpoint (allows web UI to call MCP tools directly)
  if (pathname === '/api/mcp' && req.method === 'POST') {
    try {
      const body = await readBody(req, 5 * 1024 * 1024);
      const payload = JSON.parse(body);
      const { tool, arguments: args } = payload;

      if (!tool || !ALLOWED_MCP_TOOLS.has(tool)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Invalid or unallowed MCP tool: '${tool}'.` }));
        return;
      }

      const result = mcp.callTool(tool, args || {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      const status = err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --------------------------------------------------------------------------
  // Static Files with Path Traversal Protection
  // --------------------------------------------------------------------------
  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  const resolvedBase = path.resolve(BASE_DIR);
  const safePath = path.resolve(BASE_DIR, '.' + pathname);

  // Check that the requested path does not escape the project root directory
  const relative = path.relative(resolvedBase, safePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Path Traversal detected.');
    return;
  }

  // Block access to private / sensitive folders & files
  const normalizedLower = safePath.toLowerCase();
  const forbiddenList = [
    path.join(resolvedBase, 'data', 'profile').toLowerCase(),
    path.join(resolvedBase, '.git').toLowerCase(),
    path.join(resolvedBase, 'node_modules').toLowerCase(),
    path.join(resolvedBase, '.env').toLowerCase()
  ];

  for (const forbidden of forbiddenList) {
    if (normalizedLower === forbidden || normalizedLower.startsWith(forbidden + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden: Access to sensitive data is restricted.');
      return;
    }
  }

  if (fs.existsSync(safePath) && fs.statSync(safePath).isFile()) {
    const ext = path.extname(safePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(safePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

// Locate Edge or Chrome for native desktop app window mode
function findBrowser() {
  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = [
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    path.join(localAppData, 'Microsoft\\Edge\\Application\\msedge.exe'),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe')
  ];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Strict Loopback Binding on 127.0.0.1
server.listen(0, '127.0.0.1', () => {
  const port = server.address().port;
  const appUrl = `http://127.0.0.1:${port}/index.html`;

  console.log(`=======================================================`);
  console.log(`  🚀 Sunveil Interactive Kanban & Visual Mindmap`);
  console.log(`  100% .EXE FREE - Antivirus-safe`);
  console.log(`  Security Hardened: Strictly 127.0.0.1 (Loopback)`);
  console.log(`  Server running at: ${appUrl}`);
  console.log(`  MCP Server ready: node mcp-server.js`);
  console.log(`=======================================================`);

  // Launch browser in app window mode if not explicitly disabled
  if (!process.argv.includes('--no-browser')) {
    const browser = findBrowser();
    if (browser) {
      const args = [
        `--app=${appUrl}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--window-size=1540,960',
        '--disable-features=TranslateUI',
        '--disable-extensions',
        '--no-first-run'
      ];
      spawn(browser, args, { detached: true, stdio: 'ignore' }).unref();
    } else {
      exec(`start "" "${appUrl}"`);
    }
  }

  // Auto-Shutdown Watchdog: terminates server when desktop window is closed
  setInterval(() => {
    if (Date.now() - lastHeartbeat > 15000) {
      console.log('Window closed (heartbeat expired). Shutting down server.');
      process.exit(0);
    }
  }, 2000);
});
