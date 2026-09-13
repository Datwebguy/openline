require('./env');

const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { createRequest, getRequest, buildPlans, approveRequest, runSimulation, runLive } = require('./store');
const { listProviders } = require('./providers');

const publicDir = path.join(__dirname, '..', 'public');
const preferredPorts = [5050, 5051, 4173, 4174, 8080, 8081, 4200];
const MAX_BODY_BYTES = 1_000_000;

function json(res, status, payload) {
  setSecurityHeaders(res);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    let rejected = false;
    req.on('data', (chunk) => {
      if (rejected) return;
      size += Buffer.byteLength(chunk);
      if (size > MAX_BODY_BYTES) {
        rejected = true;
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        req.resume();
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (rejected) return;
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (error) { reject(error); }
    });
    req.on('error', reject);
  });
}

function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(publicDir, requested));
  const relativePath = path.relative(publicDir, filePath);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return json(res, 403, { error: 'Forbidden' });
  }
  fs.readFile(filePath, (error, content) => {
    if (error) return json(res, 404, { error: 'Not found' });
    const ext = path.extname(filePath);
    const type = ext === '.html' ? 'text/html' : ext === '.css' ? 'text/css' : 'application/javascript';
    setSecurityHeaders(res);
    res.writeHead(200, { 'Content-Type': `${type}; charset=utf-8` });
    res.end(content);
  });
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
if (req.method === 'GET' && pathname === '/api/health') {
    const liveCallsEnabled = process.env.OPENLINE_MODE === 'live'
      && process.env.OPENLINE_LIVE_CONFIRM === 'true'
      && Boolean(process.env.CALLE_API_KEY || process.env.CALLE_API_KEY_FILE);
    const keyFile = process.env.CALLE_API_KEY_FILE || '';
    const keyFileReadable = Boolean(keyFile && fs.existsSync(keyFile) && (() => {
      try { return Boolean(fs.readFileSync(keyFile, 'utf8').trim()); } catch { return false; }
    })());
    const hasApiKey = Boolean(String(process.env.CALLE_API_KEY || '').trim()) || keyFileReadable;
    return json(res, 200, {
      ok: true,
      mode: liveCallsEnabled && hasApiKey ? 'live' : 'simulation',
      liveCallsEnabled: liveCallsEnabled && hasApiKey,
      liveKeySource: process.env.CALLE_API_KEY ? 'environment' : keyFile ? 'file' : 'missing',
      liveKeyFileReadable: keyFileReadable
    });
    }
    if (req.method === 'GET' && pathname === '/api/providers') {
      const publicProviders = listProviders().map(({ phone, ...provider }) => provider);
      return json(res, 200, { providers: publicProviders });
    }
    if (req.method === 'POST' && pathname === '/api/requests') {
      return json(res, 201, { request: createRequest(await readBody(req)) });
    }

    const match = pathname.match(/^\/api\/requests\/([^/]+)(?:\/(preview|approve|run))?$/);
    if (match) {
      const [, id, action] = match;
      const request = getRequest(id);
      if (!request) return json(res, 404, { error: 'Request not found' });
      if (req.method === 'GET' && !action) return json(res, 200, { request });
      if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
      if (action === 'preview') return json(res, 200, { request: buildPlans(request) });
      if (action === 'approve') return json(res, 200, { request: approveRequest(request) });
    if (action === 'run') {
      const result = process.env.OPENLINE_MODE === 'live'
        ? await runLive(request)
        : runSimulation(request);
      return json(res, 200, { request: result });
    }
    }

    return serveStatic(req, res, pathname);
  } catch (error) {
    return json(res, error.statusCode || 400, {
      error: error.message,
      code: error.code || null,
      details: error.details || null
    });
  }
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();
    probe.once('error', () => resolve(false));
    probe.once('listening', () => probe.close(() => resolve(true)));
    probe.listen(port, '127.0.0.1');
  });
}

async function findAvailablePort() {
  if (process.env.PORT) return Number(process.env.PORT);
  for (const candidate of preferredPorts) {
    if (await isPortAvailable(candidate)) return candidate;
  }
  return 0;
}

module.exports = { handle };

if (require.main === module) {
  const server = http.createServer(handle);
  findAvailablePort().then((selectedPort) => {
    server.listen(selectedPort, '127.0.0.1', () => {
      const address = server.address();
      console.log(`Openline running at http://localhost:${address.port}`);
      const liveReady = process.env.OPENLINE_MODE === 'live'
        && process.env.OPENLINE_LIVE_CONFIRM === 'true'
        && Boolean(process.env.CALLE_API_KEY || process.env.CALLE_API_KEY_FILE);
      console.log(`Mode: ${liveReady ? 'live (CALL-E enabled)' : 'simulation (no live calls will be placed)'}`);
    });
  });
}
