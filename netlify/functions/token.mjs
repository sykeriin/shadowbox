// Netlify Functions port of the Express /token route in server/index.js — same
// exchange, same mock fallback. REACTOR_API_KEY lives in Netlify env vars
// (Site settings → Environment variables, or `netlify env:import .env`), never here.
// Model name "xmax/x2" comes from the installed SDK's MODEL_NAME constant — see the
// comment block in server/index.js before changing it.
export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const key = process.env.REACTOR_API_KEY;
  if (!key || key === 'rk_your_key_here') {
    return Response.json({ jwt: 'mock-jwt-no-credits-spent', mock: true });
  }

  try {
    const r = await fetch('https://api.reactor.inc/tokens', {
      method: 'POST',
      headers: {
        'Reactor-API-Key': key,
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
    return new Response(body, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
};
