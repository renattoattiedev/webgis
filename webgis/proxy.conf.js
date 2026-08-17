const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

function loadDotEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};

  const vars = {};
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  });
  return vars;
}

const dotenv = loadDotEnv();

function normalizeGeoTarget(url) {
  return String(url || '')
    .trim()
    .replace(/\/geoserver\/?$/i, '')
    .replace(/\/$/, '');
}

const GEO_TARGET = normalizeGeoTarget(
  process.env.GEOSERVER_URL ||
    dotenv.GEOSERVER_URL ||
    dotenv.GEOSERVER_HOST ||
    'http://localhost:8080/geoserver',
);

console.log('[proxy] GeoServer target:', GEO_TARGET);

// Agentes separados para HTTP e HTTPS
const httpAgent = new http.Agent({ keepAlive: false });
const httpsAgent = new https.Agent({ keepAlive: false });

function onProxyError(err, req, res) {
  if (err.code === 'ECONNRESET') {
    if (res && !res.headersSent) res.writeHead(502).end();
    else if (res) res.end();
    return;
  }
  console.error('[proxy]', err.code, err.message);
  if (res && !res.headersSent) res.writeHead(502).end();
  else if (res) res.end();
}

function withDefaults(entry) {
  const isHttps = entry.target && entry.target.startsWith('https');
  return {
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 15000,
    agent: isHttps ? httpsAgent : httpAgent, // Escolhe o agente correto dinamicamente
    on: { error: onProxyError },
    ...entry,
    secure: false,
  };
}

module.exports = {
  '/api-proxy': withDefaults({
    target: 'http://localhost:3333',
    pathRewrite: { '^/api-proxy': '' },
  }),
  '/tile-proxy': withDefaults({
    target: 'https://tile.openstreetmap.org',
    headers: {
      'User-Agent': 'webgis-dev (contact: dev@local)',
    },
    pathRewrite: { '^/tile-proxy': '' },
  }),

  '/imagery': withDefaults({
    target: 'https://services.arcgisonline.com',
    pathRewrite: {
      '^/imagery': '/arcgis/rest/services/World_Imagery/MapServer',
    },
  }),
  '/topo': withDefaults({
    target:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer',
    pathRewrite: { '^/topo': '' },
  }),
  '/physical': withDefaults({
    target:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer',
    pathRewrite: { '^/physical': '' },
  }),
  '/street': withDefaults({
    target:
      'https://services.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer',
    pathRewrite: { '^/street': '' },
  }),

  '/geoserver-proxy': withDefaults({
    target: GEO_TARGET,
    pathRewrite: { '^/geoserver-proxy': '/geoserver' },
  }),
  '/geoserver': withDefaults({
    target: GEO_TARGET,
    pathRewrite: { '^/geoserver': '/geoserver' },
  }),
};