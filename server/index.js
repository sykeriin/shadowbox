import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '../public')));

// Exchange our server-side REACTOR_API_KEY for a short-lived, session-scoped JWT.
// Shape confirmed against https://docs.reactor.inc/quickstart on 2026-08-23:
//   POST https://api.reactor.inc/tokens
//   headers: Reactor-API-Key, Content-Type: application/json
//   body:   { authorization_details: [{ type: 'session', resources: { models: { match: [...] } } }] }
//   resp:   { jwt: '<token>' }
// The quickstart's own example scoped this to "reactor/helios" — we're guessing the X2
// equivalent is "reactor/x2" by analogy with the catalog slug. CONFIRM this string against
// the live X2 reference page before relying on it; a wrong match here fails the token
// exchange, not the session, so it'll show up immediately.
app.post('/token', async (req, res) => {
  if (!process.env.REACTOR_API_KEY) {
    return res.status(500).json({ error: 'REACTOR_API_KEY not set in .env' });
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
            resources: { models: { match: ['reactor/x2'] } },
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

app.listen(PORT, () => console.log(`Shadowbox server on http://localhost:${PORT}`));
