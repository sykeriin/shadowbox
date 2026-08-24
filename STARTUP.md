# STARTUP — how to run a Shadowbox fight night

The runbook. Read top to bottom the first time; after that you'll only ever need "Every time".

## First time only

1. **Node 18+** and a **Chromium browser** (Chrome/Edge/Brave) on every laptop.
   Firefox/Safari will not work — the X2 SDK's WebRTC handling is Chromium-only.
2. ```bash
   npm install
   ```
3. ```bash
   cp .env.example .env
   ```
   Put your real `REACTOR_API_KEY` (`rk_...`) in `.env`. No key = **mock mode**: the whole
   pipeline runs with your webcam looped back, zero credits spent — perfect for rehearsal.
4. ```bash
   npm run build:sdk
   ```
   Bundles the X2 SDK from `node_modules` into `public/vendor/x2.mjs`. Re-run only after
   an SDK upgrade.

## Every time

```bash
npm start
```

The console prints the URLs. **The LAN IP changes when you change networks** — always read
it from the console output, don't reuse yesterday's link.

| Who | URL |
|---|---|
| Host (this laptop) | `http://localhost:3000/?fighter=A` |
| Other laptops | `https://<lan-ip>:3443/?fighter=B` |
| Broadcast / venue screen | `http://localhost:3000/broadcast.html` |

- Other laptops **must** use the HTTPS URL — browsers only allow webcams on secure origins.
  The cert is self-signed: click **Advanced → Proceed** once per laptop per network.
- Open **exactly one** broadcast page. A second one steals the feeds.
- Order doesn't matter: pages reconnect and re-offer automatically. If anything looks stuck,
  reload that page.

## During the fight

- **Hit cues**: `1` = A landed it (B staggers), `2` = B landed it (A staggers), `r` = reset.
  Work on the broadcast page **and** on fighter pages. The hit fighter's screen flashes
  **HIT — REACT!** — they must physically stagger on camera; the model repaints real motion,
  it never invents it.
- **Recording**: ● Record on any page → MP4 (H.264+AAC) download. The broadcast recording
  keeps rolling even with the window minimized.
- **Arena**: pick per fight or leave on Random; the first fighter to start sets the venue
  for both. If a character's identity starts drifting, switch to "No arena".

## After the fight — this part costs money

1. Every fighter clicks **Stop** (or closes the tab). X2 bills **per session-second,
   including idle**, per fighter. Stopping the server does NOT stop X2 sessions — they run
   browser↔Reactor directly.
2. Stop the server (Ctrl-C). Don't leave it running idle.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Broadcast panes stuck on "waiting…" | Check the log at the bottom. No "Answered offer" → that fighter hasn't started or lost the relay: reload their page. |
| Log shows `link: checking` forever or `link: failed` | The network blocks device-to-device traffic (guest/hotel WiFi client isolation). Move everyone to a home network or phone hotspot. |
| `navigator.mediaDevices is undefined` on a friend's laptop | They opened the HTTP URL. Use `https://<lan-ip>:3443`. |
| 401 from `/token` | `TOKEN_SECRET` is set but the page URL is missing `?key=<secret>` (fighter pages remember a working key per browser). Locally, leave `TOKEN_SECRET` unset. |
| Friend can't load the page at all | Read the LAN IP from the current console output (it changes per network), then suspect the WiFi's client isolation. |
| Character looks wrong / identity drifting | One reference image per session — restart with a cleaner image, or set arena to "No arena" (stacked edits compete). |

## Public hosting (Render)

`render.yaml` deploys the whole server (pages + `/token` + relay) as one Render web service:
**New → Blueprint** → this repo → paste `REACTOR_API_KEY` (`TOKEN_SECRET` auto-generates).
Share `https://<app>.onrender.com/?fighter=A&key=<TOKEN_SECRET>`. Never deploy anywhere
public with `TOKEN_SECRET` unset — an open `/token` lets anyone mint JWTs against your paid
key. The free plan cold-starts for ~1 min after idle; fighters on different home networks
may additionally need a TURN server for the video feeds.
