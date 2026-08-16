// Dynamic proxy configuration so devs can point to any GeoServer without editing the repo.
// Usage:
//   GEOSERVER_URL=http://your-geoserver-host:8080 npm run start
// Falls back to GEOSERVER_HOST / GEOSERVER_URL from .env, then production GeoServer.

const fs = require('fs');
const path = require('path');
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

// Strip trailing /geoserver if present — pathRewrite adds it.
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

// Agente sem keep-alive: evita ECONNRESET causado por conexões TLS ociosas
// que o servidor remoto fecha enquanto o proxy ainda as considera abertas.
const noKeepAliveAgent = new https.Agent({ keepAlive: false });

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
  return {
    changeOrigin: true,
    timeout: 15000,
    proxyTimeout: 15000,
    agent: noKeepAliveAgent,
    on: { error: onProxyError },
    ...entry,
    // Force false: corporate SSL inspection breaks Node TLS verification.
    secure: false,
  };
}

module.exports = {
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
