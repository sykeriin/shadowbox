import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import https from 'node:https';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import selfsigned from 'selfsigned';
import { WebSocketServer } from 'ws';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

app.use(express.static(path.join(__dirname, '../public')));

// The Netlify mirror serves the same pages from a different origin and calls our /token
// and /references — allow that cross-origin (POST /token preflights because of the
// x-shadowbox-key header). The WebSocket relay is exempt from CORS by design.
app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, x-shadowbox-key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Exchange our server-side REACTOR_API_KEY for a short-lived, session-scoped JWT.
// Shape confirmed against https://docs.reactor.inc/quickstart on 2026-08-23:
//   POST https://api.reactor.inc/tokens
//   headers: Reactor-API-Key, Content-Type: application/json
//   body:   { authorization_details: [{ type: 'session', resources: { models: { match: [...] } } }] }
//   resp:   { jwt: '<token>' }
// Model name taken from the installed SDK's own MODEL_NAME constant (@reactor-models/x2
// v0.7.0 => "xmax/x2") — the authoritative source. Two earlier values both failed the live
// token exchange with "requested model is not available to this API key": the scaffold's
// original "reactor/x2" guess, and "x2" (which the docs catalog page appears to list, but
// which is not what the SDK actually sends). If this breaks after an SDK upgrade, re-read
// MODEL_NAME from the package rather than guessing.
app.post('/token', async (req, res) => {
  // Public-deployment guard (README warning): with TOKEN_SECRET set, only pages opened with
  // the matching ?key=... may mint JWTs against the paid key. Unset (local LAN) = open.
  const secret = process.env.TOKEN_SECRET;
  if (secret && req.get('x-shadowbox-key') !== secret) {
    return res.status(401).json({ error: 'missing or wrong ?key=... in the page URL' });
  }
  // No real key on file yet (missing, or still the .env.example placeholder) — hand back a
  // mock JWT so the rest of the pipeline (webcam, server, client wiring) can be exercised
  // with zero Reactor calls. The client checks `mock: true` and loops the local webcam back
  // instead of touching X2. Swap in a real rk_... key when you're ready to spend credits.
  const key = process.env.REACTOR_API_KEY;
  if (!key || key === 'rk_your_key_here') {
    return res.json({ jwt: 'mock-jwt-no-credits-spent', mock: true });
  }
  try {
    const r = await fetch('https://api.reactor.inc/tokens', {
      method: 'POST',
      headers: {
        'Reactor-API-Key': process.env.REACTOR_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorization_details: [
          {
            type: 'session',
            resources: { models: { match: ['xmax/x2'] } },
          },
        ],
      }),
    });
    const body = await r.text();
    if (!r.ok) return res.status(r.status).send(body);
    res.type('json').send(body);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Reference gallery: every image already sitting in public/ is pickable on the fighter page.
app.get('/references', (req, res) => {
  const files = fs
    .readdirSync(path.join(__dirname, '../public'))
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  res.json(files);
});

// LAN IPv4 addresses, used both for the cert's altNames and for printing usable URLs.
function lanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}

// getUserMedia only exists in a secure context. http://localhost qualifies, but a plain-HTTP
// LAN address does NOT — on a second laptop `navigator.mediaDevices` is undefined entirely
// (every browser, not just Safari). So the LAN needs HTTPS. A self-signed cert is enough;
// each fighter's browser has to accept the warning once. Cached under certs/ so a restart
// doesn't invalidate what they already accepted.
// NOTE: selfsigned v5's generate() is async (returns a Promise) — awaiting it is required,
// or cert/key come back undefined.
async function loadOrCreateCert() {
  const dir = path.join(__dirname, '../certs');
  const certPath = path.join(dir, 'cert.pem');
  const keyPath = path.join(dir, 'key.pem');
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  }
  // altNames must list every host the browser might use, or the cert won't match the URL:
  // DNS entries (type 2) for localhost, IP entries (type 7) for each LAN address.
  const altNames = [
    { type: 2, value: 'localhost' },
    { type: 7, ip: '127.0.0.1' },
    ...lanAddresses().map((ip) => ({ type: 7, ip })),
  ];
  const pems = await selfsigned.generate([{ name: 'commonName', value: 'localhost' }], {
    days: 365,
    keySize: 2048,
    altNames,
  });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(certPath, pems.cert);
  fs.writeFileSync(keyPath, pems.private);
  console.log('Generated self-signed cert in certs/ for: localhost, ' + lanAddresses().join(', '));
  return { cert: pems.cert, key: pems.private };
}

const httpServer = app.listen(PORT, () =>
  console.log(`HTTP  (host only): http://localhost:${PORT}`)
);

// On Render (or any host that terminates TLS in front of us), the platform provides real
// HTTPS on the public URL — the self-signed cert exists only so LAN laptops get a secure
// context locally. Render sets RENDER=true in the environment.
let httpsServer;
if (process.env.RENDER) {
  console.log('Running on Render — platform TLS in front, skipping self-signed HTTPS listener.');
} else try {
  const { key, cert } = await loadOrCreateCert();
  httpsServer = https.createServer({ key, cert }, app);
  httpsServer.listen(HTTPS_PORT, () => {
    for (const ip of lanAddresses()) {
      console.log(`HTTPS (other laptops): https://${ip}:${HTTPS_PORT}`);
    }
    console.log(`HTTPS (this laptop):  https://localhost:${HTTPS_PORT}`);
  });
} catch (err) {
  console.error('HTTPS setup failed — other laptops will not be able to use their webcam:', err.message);
}

// Minimal relay, per CLAUDE.md's architecture: carries WebRTC signaling (Hour 3, so each
// fighter's rendered main_video can reach the broadcast page) and hit-cue events (Hour 4).
// Never more than 3 clients (fighter A, fighter B, broadcast), so a flat flood relay —
// forward every message to every other connected client — is the whole job; no routing table
// needed. Each message carries its own `fighterId`/`type` so recipients that don't care just
// ignore it.
//
// noServer + a manual upgrade hook on BOTH listeners, rather than one WebSocketServer bound
// to a single server: the host may be on http://localhost while the other laptop is forced
// onto https://<lan-ip>, and two separate WebSocketServers would put them in different client
// sets, so signalling would never cross and the broadcast page would only ever see one feed.
const wss = new WebSocketServer({ noServer: true });
wss.on('connection', (ws) => {
  // Forward with the original frame type: send(Buffer) alone re-sends a TEXT frame as
  // BINARY, and browser clients then get a Blob whose JSON.parse throws — every relay
  // message (signaling and hit cues) silently dies at the recipient.
  ws.on('message', (data, isBinary) => {
    for (const client of wss.clients) {
      if (client !== ws && client.readyState === client.OPEN) client.send(data, { binary: isBinary });
    }
  });
});

for (const server of [httpServer, httpsServer]) {
  if (!server) continue;
  server.on('upgrade', (req, socket, head) => {
    if (new URL(req.url, 'http://localhost').pathname !== '/relay') {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });
}
