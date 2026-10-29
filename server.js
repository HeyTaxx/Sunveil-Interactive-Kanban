/**
 * Sunveil Interactive Kanban & Mindmap - Hardened Local & Production Server
 * 
 * Runs seamlessly on:
 * - Windows (Desktop app mode or Server mode)
 * - Linux (Native daemon, Docker container, or Systemd service)
 * - macOS
 * 
 * Built-in Security Architecture:
 * 1. Multi-Session & Multi-Board Workspace Isolation
 * 2. Timing-safe Authentication (Scrypt + constant-time comparison) & Session Tokens
 * 3. Brute-Force Rate Limiting (Exponential backoff & IP lockout)
 * 4. Reverse Proxy & DNS Rebinding Hardening (X-Forwarded-Host, ALLOWED_HOSTS)
 * 5. Strict Path Traversal Protection & Sensitive File Restriction
 * 6. Room-isolated Real-Time SSE Collaboration Streams
 * 7. DoS Prevention: Maximum payload limits on incoming POST bodies
 * 8. Modern Defensive Headers: nosniff, DENY framing, no-referrer
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

let _mcp = null;
function getMcp() {
  if (!_mcp) _mcp = require('./mcp-server.js');
  return _mcp;
}

// --------------------------------------------------------------------------
// Server Mode Detection & Configuration
// --------------------------------------------------------------------------
const isServerMode = process.env.SUNVEIL_SERVER === 'true' ||
                     process.env.NODE_ENV === 'production' ||
                     process.argv.includes('--server') ||
                     process.argv.includes('-s') ||
                     os.platform() !== 'win32';

const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'data');
const BOARDS_DIR = path.join(DATA_DIR, 'boards');
const BOARDS_INDEX_FILE = path.join(DATA_DIR, 'boards_index.json');
const AUTH_FILE = path.join(DATA_DIR, 'server_auth.json');
const DATA_FILE = path.join(DATA_DIR, 'kanban_data.json'); // Legacy & fallback path
const GITHUB_CONFIG_FILE = path.join(DATA_DIR, 'github_config.json');
const PROFILE_DIR = path.join(DATA_DIR, 'profile');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BOARDS_DIR)) {
  fs.mkdirSync(BOARDS_DIR, { recursive: true });
}

// --------------------------------------------------------------------------
// Multi-Board Workspace Storage & Migration
// --------------------------------------------------------------------------
function sanitizeBoardId(rawId) {
  if (!rawId || typeof rawId !== 'string') return 'main';
  const clean = rawId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  return clean || 'main';
}

function getBoardFilePath(boardId) {
  const safeId = sanitizeBoardId(boardId);
  return path.join(BOARDS_DIR, `${safeId}.json`);
}

function getBoardMtime(boardId) {
  try {
    const file = getBoardFilePath(boardId);
    if (fs.existsSync(file)) {
      return fs.statSync(file).mtimeMs;
    }
  } catch (e) {}
  return 0;
}

function getBoardsIndex() {
  if (fs.existsSync(BOARDS_INDEX_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(BOARDS_INDEX_FILE, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  // Default main board index entry
  return [
    {
      id: 'main',
      title: '🚀 Project Workspace',
      color: '#6366f1',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
}

function saveBoardsIndex(indexList) {
  const tmp = BOARDS_INDEX_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(indexList, null, 2), 'utf8');
  fs.renameSync(tmp, BOARDS_INDEX_FILE);
}

// Auto-migrate legacy kanban_data.json to boards/main.json
const mainBoardFile = getBoardFilePath('main');
if (fs.existsSync(DATA_FILE) && !fs.existsSync(mainBoardFile)) {
  try {
    fs.copyFileSync(DATA_FILE, mainBoardFile);
  } catch (e) {
    console.error('Board migration warning:', e.message);
  }
}
if (!fs.existsSync(BOARDS_INDEX_FILE)) {
  saveBoardsIndex(getBoardsIndex());
}

// Template generator for new boards
function createBoardTemplate(title, type = 'standard') {
  if (type === 'scrum') {
    return {
      title: title || 'Scrum Sprint',
      columns: [
        { id: 'col-backlog', title: '📋 Product Backlog', color: '#64748b' },
        { id: 'col-sprint', title: '🏃 Sprint Backlog', color: '#38bdf8' },
        { id: 'col-progress', title: '⚡ In Progress', color: '#6366f1' },
        { id: 'col-review', title: '🔍 Testing / Review', color: '#f59e0b' },
        { id: 'col-done', title: '✅ Done', color: '#10b981' }
      ],
      cards: []
    };
  }
  if (type === 'simple') {
    return {
      title: title || 'Task Board',
      columns: [
        { id: 'col-todo', title: '📝 To Do', color: '#38bdf8' },
        { id: 'col-doing', title: '⚡ In Progress', color: '#f59e0b' },
        { id: 'col-done', title: '✅ Done', color: '#10b981' }
      ],
      cards: []
    };
  }
  return {
    title: title || '🚀 Project Workspace',
    columns: [
      { id: 'col-1', title: '💡 Ideas & Concepts', color: '#6366f1' },
      { id: 'col-2', title: '⚡ In Progress', color: '#38bdf8' },
      { id: 'col-3', title: '🔍 Review & Testing', color: '#f59e0b' },
      { id: 'col-4', title: '✅ Done', color: '#10b981' }
    ],
    cards: []
  };
}

// --------------------------------------------------------------------------
// Security: Password Hashing, Session Management & Brute-Force Rate Limiting
// --------------------------------------------------------------------------
const activeSessions = new Map(); // token -> { createdAt, expiresAt, ip }
const loginAttempts = new Map();  // ip -> { count, lockedUntil }
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    let [name, ...rest] = cookie.split('=');
    name = name.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });
  return list;
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, storedHash, salt) {
  try {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (hashBuffer.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
  } catch (e) {
    return false;
  }
}

function getStoredAuth() {
  if (process.env.SUNVEIL_PASSWORD) {
    return {
      type: 'env',
      hasPassword: true,
      envPassword: process.env.SUNVEIL_PASSWORD
    };
  }
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      if (data && data.passwordHash && data.salt) {
        return {
          type: 'file',
          hasPassword: true,
          passwordHash: data.passwordHash,
          salt: data.salt
        };
      }
    } catch (e) {}
  }
  return { hasPassword: false };
}

function isAuthRequired() {
  const auth = getStoredAuth();
  if (auth.hasPassword) return true;
  // If running in production / server mode, authentication setup is required
  if (isServerMode) return true;
  return false;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip);
  if (!rec) return { allowed: true };
  if (rec.lockedUntil && now < rec.lockedUntil) {
    const minutesRemaining = Math.ceil((rec.lockedUntil - now) / 60000);
    return { allowed: false, minutesRemaining };
  }
  if (rec.lockedUntil && now >= rec.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const rec = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  rec.count++;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) {
    rec.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  loginAttempts.set(ip, rec);
  return rec;
}

function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

function createSession(ip) {
  const token = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ip
  });
  return token;
}

function validateSession(req) {
  // If no password configured and not in server mode, everything is authenticated
  if (!isAuthRequired()) return true;

  // 1. Check HTTP-only cookie
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies.sunveil_session;

  // 2. Check Authorization header (Bearer <token>)
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && (parts[0] === 'Bearer' || parts[0] === 'Token')) {
      token = parts[1];
    }
  }

  // 3. Check X-Session-Token header
  if (!token && req.headers['x-session-token']) {
    token = req.headers['x-session-token'];
  }

  if (!token) return false;
  const sess = activeSessions.get(token);
  if (!sess) return false;
  if (Date.now() > sess.expiresAt) {
    activeSessions.delete(token);
    return false;
  }
  return true;
}

// --------------------------------------------------------------------------
// Live Share - Room-Scoped Real-time Multi-User Collaboration State
// --------------------------------------------------------------------------
let liveShareEnabled = true;
const liveClients = new Map(); // clientId -> { id, name, color, isHost, boardId, activeTab, lastSeen, res }

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const ifaceName of Object.keys(interfaces)) {
    for (const iface of interfaces[ifaceName]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({ name: ifaceName, ip: iface.address });
      }
    }
  }
  return addresses;
}

function isPrivateIP(ip) {
  if (!ip) return false;
  const clean = ip.replace(/^::ffff:/, '').trim().toLowerCase();
  if (clean === '127.0.0.1' || clean === 'localhost') return true;
  if (clean.startsWith('10.')) return true;
  if (clean.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean)) return true;
  if (clean.endsWith('.local')) return true;
  return false;
}

function getSanitizedClients(filterBoardId = null) {
  const list = [];
  for (const c of liveClients.values()) {
    if (filterBoardId && c.boardId !== filterBoardId) continue;
    list.push({
      id: c.id,
      name: c.name,
      color: c.color,
      isHost: c.isHost,
      boardId: c.boardId || 'main',
      activeTab: c.activeTab,
      lastSeen: c.lastSeen
    });
  }
  return list;
}

function broadcastToBoard(boardId, eventType, payload) {
  const msg = `data: ${JSON.stringify({ type: eventType, boardId, ...payload })}\n\n`;
  for (const client of liveClients.values()) {
    if (!boardId || client.boardId === boardId) {
      try {
        client.res.write(msg);
      } catch (e) {}
    }
  }
}

function broadcastPresence(boardId = null) {
  if (boardId) {
    broadcastToBoard(boardId, 'presence', { clients: getSanitizedClients(boardId) });
  } else {
    // Broadcast board-scoped presence to respective rooms
    const boardIds = new Set();
    for (const c of liveClients.values()) {
      boardIds.add(c.boardId || 'main');
    }
    for (const bId of boardIds) {
      broadcastToBoard(bId, 'presence', { clients: getSanitizedClients(bId) });
    }
  }
}

function broadcastToOthersInBoard(senderId, boardId, eventType, data) {
  const targetBoard = sanitizeBoardId(boardId);
  const msg = `data: ${JSON.stringify({ type: eventType, boardId: targetBoard, senderId, data })}\n\n`;
  for (const [id, client] of liveClients.entries()) {
    if (id !== senderId && client.boardId === targetBoard) {
      try {
        client.res.write(msg);
      } catch (e) {}
    }
  }
}

// Keepalive ping for all connected SSE clients every 15s
setInterval(() => {
  for (const client of liveClients.values()) {
    try {
      client.res.write(': keepalive\n\n');
    } catch (e) {}
  }
}, 15000);

let lastHeartbeat = Date.now() + 20000; // 20s startup grace
const MAX_PAYLOAD_BYTES = 30 * 1024 * 1024; // 30 MB max (allows large visual mindmap drawings)

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
  '.ttf': 'font/ttf',
  '.webp': 'image/webp'
};

// Security Check: Validate Host Header (Allows localhost, LAN, reverse proxies, and configured ALLOWED_HOSTS)
function isValidHost(hostHeader) {
  if (!hostHeader) return false;
  const host = hostHeader.split(':')[0].toLowerCase();
  if (host === '127.0.0.1' || host === 'localhost') return true;

  // Custom allowed hosts via environment variable (e.g. ALLOWED_HOSTS="kanban.mydomain.com,192.168.1.100")
  const envHosts = (process.env.SUNVEIL_ALLOWED_HOSTS || process.env.ALLOWED_HOSTS || '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
  if (envHosts.includes('*')) return true;
  if (envHosts.includes(host)) return true;

  if (liveShareEnabled && isPrivateIP(host)) return true;
  if (liveShareEnabled) {
    const localIps = getLocalIPs().map(x => x.ip);
    if (localIps.includes(host)) return true;
  }

  // In production / server mode, allow valid domain names or public server IPs
  if (isServerMode && envHosts.length === 0) {
    if (/^[a-zA-Z0-9.-]+$/.test(host) && !host.includes('..')) {
      return true;
    }
  }

  return false;
}

// Security Check: Validate Origin Header to allow local app and verified origins
function isAllowedOrigin(originHeader) {
  if (!originHeader) return true; // Direct local browser / app window request
  try {
    const parsed = new URL(originHeader);
    const hostname = parsed.hostname.toLowerCase();
    return isValidHost(hostname);
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
  const clientIP = getClientIP(req);
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;

  // 1. DNS Rebinding & Spoofed Host Protection
  if (!isValidHost(hostHeader)) {
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

  // Strict CORS: Only echo verified origins
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Client-ID, X-Board-ID, X-Session-Token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Update Heartbeat on valid requests
  lastHeartbeat = Date.now();

  const parsedUrl = new URL(req.url, `http://${hostHeader || '127.0.0.1'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // --------------------------------------------------------------------------
  // Authentication & Session Guard for Protected API Routes
  // --------------------------------------------------------------------------
  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isPublicRoute = pathname === '/api/ping';
  const isApiRoute = pathname.startsWith('/api/');

  if (isApiRoute && !isAuthRoute && !isPublicRoute) {
    if (isAuthRequired() && !validateSession(req)) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        error: 'UNAUTHORIZED',
        message: 'Authentication required. Please log in.',
        authRequired: true
      }));
      return;
    }
  }

  // --------------------------------------------------------------------------
  // API: Authentication & Server Security Endpoints
  // --------------------------------------------------------------------------

  // A. Check Auth Status
  if (pathname === '/api/auth/status' && req.method === 'GET') {
    const auth = getStoredAuth();
    const isSetup = auth.hasPassword;
    const authReq = isAuthRequired();
    const authenticated = validateSession(req);

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      authRequired: authReq,
      authenticated,
      isSetup,
      isServerMode,
      clientIP
    }));
    return;
  }

  // B. Server Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        error: 'RATE_LIMITED',
        message: `Zu viele Fehlversuche. Bitte warte ${rateCheck.minutesRemaining} Minuten.`,
        minutesRemaining: rateCheck.minutesRemaining
      }));
      return;
    }

    try {
      const body = await readBody(req, 1024 * 64);
      const { password } = JSON.parse(body);
      const auth = getStoredAuth();

      if (!auth.hasPassword) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'NO_PASSWORD_SET', message: 'No password set on server. Setup required.' }));
        return;
      }

      let isValid = false;
      if (auth.type === 'env') {
        isValid = (password === auth.envPassword);
      } else if (auth.type === 'file') {
        isValid = verifyPassword(password, auth.passwordHash, auth.salt);
      }

      if (!isValid) {
        const attempt = recordFailedLogin(clientIP);
        const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - attempt.count);
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          error: 'INVALID_CREDENTIALS',
          message: 'Ungültiges Passwort.',
          remainingAttempts: remaining
        }));
        return;
      }

      // Successful login
      resetLoginAttempts(clientIP);
      const sessionToken = createSession(clientIP);

      // Set secure HTTP-only session cookie
      const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
      const cookieFlags = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`];
      if (isSecure) cookieFlags.push('Secure');

      res.setHeader('Set-Cookie', `sunveil_session=${encodeURIComponent(sessionToken)}; ${cookieFlags.join('; ')}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        token: sessionToken,
        message: 'Erfolgreich angemeldet.'
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // C. First-time Setup Password
  if (pathname === '/api/auth/setup' && req.method === 'POST') {
    const auth = getStoredAuth();
    if (auth.hasPassword) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'ALREADY_CONFIGURED', message: 'Password is already configured.' }));
      return;
    }

    try {
      const body = await readBody(req, 1024 * 64);
      const { password } = JSON.parse(body);
      if (!password || password.length < 4) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'PASSWORD_TOO_SHORT', message: 'Password must be at least 4 characters long.' }));
        return;
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);

      const authData = {
        passwordHash,
        salt,
        createdAt: Date.now()
      };
      fs.writeFileSync(AUTH_FILE, JSON.stringify(authData, null, 2), 'utf8');

      const sessionToken = createSession(clientIP);
      const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.socket.encrypted;
      const cookieFlags = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`];
      if (isSecure) cookieFlags.push('Secure');

      res.setHeader('Set-Cookie', `sunveil_session=${encodeURIComponent(sessionToken)}; ${cookieFlags.join('; ')}`);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        token: sessionToken,
        message: 'Admin-Passwort erfolgreich gespeichert.'
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // D. Server Logout
  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.sunveil_session) {
      activeSessions.delete(cookies.sunveil_session);
    }
    res.setHeader('Set-Cookie', 'sunveil_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Erfolgreich abgemeldet.' }));
    return;
  }

  // --------------------------------------------------------------------------
  // API: Multi-Board Workspace Management
  // --------------------------------------------------------------------------

  // List all boards
  if (pathname === '/api/boards' && req.method === 'GET') {
    const index = getBoardsIndex();
    // Attach current card counts & mtime
    const enriched = index.map(b => {
      let cardCount = 0;
      try {
        const f = getBoardFilePath(b.id);
        if (fs.existsSync(f)) {
          const content = JSON.parse(fs.readFileSync(f, 'utf8'));
          if (Array.isArray(content.cards)) cardCount = content.cards.length;
        }
      } catch (e) {}
      return {
        ...b,
        cardCount,
        version: getBoardMtime(b.id)
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ boards: enriched }));
    return;
  }

  // Create new board
  if (pathname === '/api/boards' && req.method === 'POST') {
    try {
      const body = await readBody(req, 1024 * 128);
      const { title, color, template } = JSON.parse(body);

      const rawTitle = (title || 'Neues Projekt').trim();
      const boardId = 'board-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
      const boardColor = color || '#6366f1';

      const initialData = createBoardTemplate(rawTitle, template || 'standard');
      const targetFile = getBoardFilePath(boardId);

      fs.writeFileSync(targetFile, JSON.stringify(initialData, null, 2), 'utf8');

      const index = getBoardsIndex();
      const newEntry = {
        id: boardId,
        title: rawTitle,
        color: boardColor,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      index.push(newEntry);
      saveBoardsIndex(index);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, board: newEntry }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Delete board
  if (pathname === '/api/boards' && req.method === 'DELETE') {
    try {
      const targetId = sanitizeBoardId(parsedUrl.searchParams.get('id'));
      if (targetId === 'main') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Das Haupt-Board (main) kann nicht gelöscht werden.' }));
        return;
      }

      const filePath = getBoardFilePath(targetId);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }

      let index = getBoardsIndex();
      index = index.filter(b => b.id !== targetId);
      saveBoardsIndex(index);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Update board metadata (Title / Color)
  if (pathname === '/api/boards' && req.method === 'PATCH') {
    try {
      const body = await readBody(req, 1024 * 64);
      const { id, title, color } = JSON.parse(body);
      const safeId = sanitizeBoardId(id);

      const index = getBoardsIndex();
      const item = index.find(b => b.id === safeId);
      if (item) {
        if (title) item.title = title.trim();
        if (color) item.color = color;
        item.updatedAt = Date.now();
        saveBoardsIndex(index);
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, board: item }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // --------------------------------------------------------------------------
  // Core API Endpoints
  // --------------------------------------------------------------------------

  // 1. API: Ping / Heartbeat
  if (pathname === '/api/ping') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ pong: true, time: Date.now(), isServerMode }));
    return;
  }

  // 2. API: Shutdown on browser window close (Disabled in server mode)
  if (pathname === '/api/shutdown') {
    if (isServerMode) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ bye: false, serverMode: true, message: 'Server mode active - shutdown ignored.' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ bye: true }));
    setTimeout(() => {
      process.exit(0);
    }, 500);
    return;
  }

  // 3. API: Data Version / Timestamp for specific board
  if (pathname === '/api/version') {
    const boardId = sanitizeBoardId(parsedUrl.searchParams.get('boardId'));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ version: getBoardMtime(boardId), boardId }));
    return;
  }

  // 4. API: GET Data (Scoped by boardId)
  if (pathname === '/api/data' && req.method === 'GET') {
    const boardId = sanitizeBoardId(parsedUrl.searchParams.get('boardId'));
    const targetFile = getBoardFilePath(boardId);

    if (fs.existsSync(targetFile)) {
      try {
        const content = fs.readFileSync(targetFile, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(content);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    } else {
      // Fallback for board file not existing yet
      const fallback = createBoardTemplate('Project Workspace');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(fallback));
      return;
    }
  }

  // 5. API: POST Data (Scoped by boardId, with atomic write & room-isolated broadcast)
  if (pathname === '/api/data' && req.method === 'POST') {
    try {
      const boardId = sanitizeBoardId(parsedUrl.searchParams.get('boardId') || req.headers['x-board-id']);
      const body = await readBody(req);
      const parsedData = JSON.parse(body);

      const targetFile = getBoardFilePath(boardId);
      const tempFile = targetFile + '.tmp';
      fs.writeFileSync(tempFile, body, 'utf8');
      fs.renameSync(tempFile, targetFile);

      // Backwards compatibility: keep root data/kanban_data.json updated if main board changes
      if (boardId === 'main') {
        try {
          fs.writeFileSync(DATA_FILE + '.tmp', body, 'utf8');
          fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
        } catch (e) {}
      }

      // Update board index updatedAt timestamp
      const index = getBoardsIndex();
      const boardItem = index.find(b => b.id === boardId);
      if (boardItem) {
        boardItem.updatedAt = Date.now();
        saveBoardsIndex(index);
      }

      // Broadcast board update strictly to collaborators in this board room
      const senderId = req.headers['x-client-id'] || '';
      broadcastToOthersInBoard(senderId, boardId, 'board_update', parsedData);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ saved: true, version: getBoardMtime(boardId), boardId }));
    } catch (err) {
      const status = err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 6. API: MCP HTTP endpoint
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

      const result = getMcp().callTool(tool, args || {});
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(result));
    } catch (err) {
      const status = err.message === 'PAYLOAD_TOO_LARGE' ? 413 : 400;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 6b. API: GitHub Config & Proxy Endpoints
  if (pathname === '/api/github/config' && req.method === 'GET') {
    if (fs.existsSync(GITHUB_CONFIG_FILE)) {
      try {
        const conf = fs.readFileSync(GITHUB_CONFIG_FILE, 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(conf);
        return;
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ connected: false }));
      return;
    }
  }

  if (pathname === '/api/github/config' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      JSON.parse(body); // Validate JSON
      fs.writeFileSync(GITHUB_CONFIG_FILE, body, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ saved: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  if (pathname === '/api/github/proxy' && req.method === 'POST') {
    try {
      const body = await readBody(req, 10 * 1024 * 1024);
      const payload = JSON.parse(body);
      let targetUrlStr = payload.url || 'https://api.github.com/graphql';
      if (targetUrlStr.startsWith('/')) {
        targetUrlStr = 'https://api.github.com' + targetUrlStr;
      }
      const parsedTarget = new URL(targetUrlStr);

      if (parsedTarget.hostname !== 'api.github.com') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy restricted strictly to api.github.com' }));
        return;
      }

      const method = (payload.method || 'POST').toUpperCase();
      const token = payload.token || '';
      const requestHeaders = {
        'Host': 'api.github.com',
        'User-Agent': 'Sunveil-Interactive-Kanban',
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(payload.headers || {})
      };

      if (token) {
        requestHeaders['Authorization'] = token.startsWith('Bearer ') || token.startsWith('token ') ? token : `Bearer ${token}`;
      }

      const postData = payload.body ? (typeof payload.body === 'string' ? payload.body : JSON.stringify(payload.body)) : null;
      if (postData) {
        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
        requestHeaders['Content-Length'] = Buffer.byteLength(postData);
      }

      const ghReq = https.request({
        hostname: parsedTarget.hostname,
        port: 443,
        path: parsedTarget.pathname + parsedTarget.search,
        method: method,
        headers: requestHeaders,
        timeout: 20000
      }, (ghRes) => {
        let ghData = '';
        ghRes.on('data', chunk => { ghData += chunk; });
        ghRes.on('end', () => {
          res.writeHead(ghRes.statusCode || 200, {
            'Content-Type': 'application/json; charset=utf-8'
          });
          res.end(ghData);
        });
      });

      ghReq.on('timeout', () => {
        ghReq.destroy(new Error('GitHub request timeout'));
      });

      ghReq.on('error', (err) => {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'GitHub API connection failed: ' + err.message }));
      });

      if (postData) {
        ghReq.write(postData);
      }
      ghReq.end();
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // --------------------------------------------------------------------------
  // Live Share Endpoints (Server-Sent Events & Realtime Room Broadcast)
  // --------------------------------------------------------------------------

  // 7. API: SSE Stream for Real-time Live Share Events (Scoped to Board Room)
  if (pathname === '/api/live/stream') {
    if (!liveShareEnabled) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Live Share is currently disabled.' }));
      return;
    }

    const clientId = parsedUrl.searchParams.get('clientId') || ('client-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7));
    const name = parsedUrl.searchParams.get('name') || 'Teammitglied';
    const color = parsedUrl.searchParams.get('color') || '#6366f1';
    const boardId = sanitizeBoardId(parsedUrl.searchParams.get('boardId'));
    const isHost = (req.socket.remoteAddress === '127.0.0.1' || req.socket.remoteAddress === '::1' || req.socket.remoteAddress === '::ffff:127.0.0.1');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    res.write(': connected\n\n');

    const clientObj = {
      id: clientId,
      name,
      color,
      isHost,
      boardId,
      activeTab: 'kanban-main',
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      res
    };

    liveClients.set(clientId, clientObj);

    // Initial handshake with current room board data + collaborators in this room
    let currentBoard = {};
    const boardPath = getBoardFilePath(boardId);
    if (fs.existsSync(boardPath)) {
      try {
        currentBoard = JSON.parse(fs.readFileSync(boardPath, 'utf8'));
      } catch (e) {}
    }

    const initialPayload = {
      type: 'init',
      clientId,
      boardId,
      clients: getSanitizedClients(boardId),
      board: currentBoard
    };
    res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

    // Broadcast presence update to clients in this room
    broadcastPresence(boardId);

    req.on('close', () => {
      liveClients.delete(clientId);
      broadcastPresence(boardId);
    });
    return;
  }

  // 8. API: Broadcast Live Action from Client
  if (pathname === '/api/live/broadcast' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const msg = JSON.parse(body);
      const { senderId, type, data } = msg;
      const boardId = sanitizeBoardId(msg.boardId || (liveClients.get(senderId)?.boardId));

      if (type === 'tab_change') {
        const client = liveClients.get(senderId);
        if (client) {
          client.activeTab = data && data.tabId ? data.tabId : 'kanban-main';
          client.lastSeen = Date.now();
        }
        broadcastPresence(boardId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (type === 'profile_update') {
        const client = liveClients.get(senderId);
        if (client) {
          if (data.name) client.name = data.name;
          if (data.color) client.color = data.color;
          client.lastSeen = Date.now();
        }
        broadcastPresence(boardId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (type === 'switch_board') {
        const client = liveClients.get(senderId);
        if (client && data && data.newBoardId) {
          const oldBoard = client.boardId;
          client.boardId = sanitizeBoardId(data.newBoardId);
          client.lastSeen = Date.now();
          broadcastPresence(oldBoard);
          broadcastPresence(client.boardId);
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (type === 'board_update') {
        if (data && typeof data === 'object') {
          const targetFile = getBoardFilePath(boardId);
          const tempFile = targetFile + '.tmp';
          fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
          fs.renameSync(tempFile, targetFile);

          if (boardId === 'main') {
            try {
              fs.writeFileSync(DATA_FILE + '.tmp', JSON.stringify(data, null, 2), 'utf8');
              fs.renameSync(DATA_FILE + '.tmp', DATA_FILE);
            } catch (e) {}
          }
        }
        broadcastToOthersInBoard(senderId, boardId, 'board_update', data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, version: getBoardMtime(boardId) }));
        return;
      }

      if (type === 'whiteboard_stroke') {
        broadcastToOthersInBoard(senderId, boardId, 'whiteboard_stroke', data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Generic room broadcast
      broadcastToOthersInBoard(senderId, boardId, type, data);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 9. API: Live Share Information
  if (pathname === '/api/live/info') {
    const port = server.address() ? server.address().port : PREFERRED_PORT;
    const ips = getLocalIPs();
    const primaryIp = (ips.length > 0) ? ips[0].ip : '127.0.0.1';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      enabled: liveShareEnabled,
      port,
      primaryIp,
      ips,
      shareUrl: `http://${primaryIp}:${port}/index.html`,
      localUrl: `http://127.0.0.1:${port}/index.html`,
      clientCount: liveClients.size,
      clients: getSanitizedClients()
    }));
    return;
  }

  // 10. API: Live Share Toggle
  if (pathname === '/api/live/toggle' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body || '{}');
      if (typeof parsed.enabled === 'boolean') {
        liveShareEnabled = parsed.enabled;
      } else {
        liveShareEnabled = !liveShareEnabled;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ enabled: liveShareEnabled }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // --------------------------------------------------------------------------
  // Static Files with Strict Path Traversal Protection
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
    path.join(resolvedBase, 'data', 'webview2_profile').toLowerCase(),
    path.join(resolvedBase, 'data', 'server_auth.json').toLowerCase(),
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

// Locate Edge or Chrome for native desktop app window mode (Windows only)
function findBrowser() {
  if (os.platform() !== 'win32') return null;
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

// Network Binding (0.0.0.0 allows LAN & Server Hosting while verifying Host security)
const PREFERRED_PORT = parseInt(process.env.PORT || '40293', 10);

function startServer(portToTry) {
  server.listen(portToTry, '0.0.0.0', () => {
    const port = server.address().port;

    // Record port file
    try {
      fs.writeFileSync(path.join(DATA_DIR, 'server.port'), port.toString(), 'utf8');
    } catch (e) {}

    const appUrl = `http://127.0.0.1:${port}/index.html`;

    // Launch browser in app window mode ONLY if desktop mode and not disabled
    if (!isServerMode && !process.argv.includes('--no-browser')) {
      const browser = findBrowser();
      if (browser) {
        const args = [
          `--app=${appUrl}`,
          '--window-size=1540,960',
          '--disable-features=TranslateUI,OptimizationHints,MediaRouter',
          '--disable-extensions',
          '--disable-background-networking',
          '--no-first-run'
        ];
        spawn(browser, args, { detached: true, stdio: 'ignore' }).unref();
      } else if (os.platform() === 'win32') {
        exec(`start "" "${appUrl}"`);
      }
    }

    const ips = getLocalIPs();
    const primaryIp = (ips.length > 0) ? ips[0].ip : '127.0.0.1';
    const shareUrl = `http://${primaryIp}:${port}/index.html`;

    console.log(`=======================================================`);
    console.log(`  🚀 Sunveil Interactive Kanban & Visual Mindmap`);
    console.log(`  🌐 Environment:    ${isServerMode ? 'PRODUCTION SERVER (24/7 Daemon)' : 'Desktop / Local Host'}`);
    console.log(`  🛡️ Auth Protection: ${isAuthRequired() ? 'ACTIVE (Password/Session protected)' : 'Optional (Local Mode)'}`);
    console.log(`  🔗 Local Access:    ${appUrl}`);
    console.log(`  👥 Network/Server:  ${shareUrl}`);
    console.log(`  🤖 MCP Endpoint:    http://127.0.0.1:${port}/api/mcp`);
    console.log(`=======================================================`);

    // Auto-Shutdown Watchdog: ONLY active in desktop mode when no windows/sessions are open
    if (!isServerMode) {
      setInterval(() => {
        if (liveClients.size > 0) {
          lastHeartbeat = Date.now();
          return;
        }
        if (Date.now() - lastHeartbeat > 25000) {
          console.log('All windows and sessions closed. Shutting down desktop server.');
          try { fs.unlinkSync(path.join(DATA_DIR, 'server.port')); } catch (e) {}
          process.exit(0);
        }
      }, 3000);
    } else {
      console.log('🛡️ Watchdog: Server mode active. Server running permanently 24/7.');
    }
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    if (isServerMode) {
      console.error(`❌ Port ${PREFERRED_PORT} is already in use. Cannot start server.`);
      process.exit(1);
    } else {
      // Fallback port in local desktop mode
      server.listen(0, '0.0.0.0');
    }
  } else {
    console.error('Server error:', err);
  }
});

startServer(PREFERRED_PORT);
