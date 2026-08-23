# 🥊 SHADOWBOX

**Two people. Two rooms. Two webcams. One broadcast — and neither fighter looks human anymore.**

Shadowbox is a live demo of vision-piloted embodiment: your real punches, footwork, and
(let's be honest) flinching are re-rendered in real time as a photoreal robot — or Superman,
or your own mech design — via [Reactor X2](https://docs.reactor.inc/model-api-reference/x2).
Two independent renders land side by side in one broadcast frame, blue corner vs red corner,
and suddenly two people shadowboxing in their bedrooms look like a televised mech fight.

No motion-capture suit. No game engine. No 3D scene. A webcam, a prompt, and a reference image.

## How a "fight" works

1. Each fighter opens their page, drops in a character image (or picks one from the gallery),
   picks an arena — or lets the dice pick one — and hits **Start**.
2. X2 repaints their webcam feed live: same motion, same framing, brand-new body, brand-new venue.
   The arena choice syncs to the other fighter so both halves of the screen read as one world.
3. The broadcast page shows both renders side by side with a big slanted **VS** down the middle.
4. Somebody lands a punch? A human presses a key (`1`: A landed it, `2`: B landed it). The hit
   fighter's screen flashes **HIT — REACT!** — and here's the trick: **they actually stagger,
   for real, on camera.** X2 repaints real motion; it doesn't invent motion. The model gets a
   "just got rocked" prompt, the human supplies the acting, and physics is played by a person.
5. `r` resets both fighters to standing. Recordings are one button away on every page.

Yes, the referee is a keyboard. That's a feature (see "What this is not").

## Quickstart

```bash
npm install
cp .env.example .env      # put your real REACTOR_API_KEY (rk_...) in .env
npm run build:sdk         # bundles the X2 SDK for the browser
npm start
```

Then open (Chromium browsers only — the SDK's SDP munging upsets Firefox/WebKit):

| Page | URL | Who |
|---|---|---|
| Fighter A | `http://localhost:3000/?fighter=A` | Blue corner |
| Fighter B | `https://<lan-ip>:3443/?fighter=B` | Red corner, on the second laptop |
| Broadcast | `http://localhost:3000/broadcast.html` | The venue screen |

The second laptop must use the HTTPS URL — browsers only allow webcams in secure contexts.
The cert is self-signed; accept the warning once. No API key? The pipeline runs in **mock
mode** (your webcam loops back, zero credits spent) so you can rehearse the whole show for free.

## The controls

- **Character**: drag-drop any image, click to browse, or pick from the thumbnails of images
  already in `public/`. One reference per session — identity comes entirely from the image.
- **Arena**: random per render, or pick — neon coliseum, wasteland junkyard, volcano crater,
  glacier field, city rooftop — or keep your real room if your character's identity starts
  drifting (stacked edits compete for the model's attention).
- **Robot voice**: a WebAudio ring modulator on your mic (X2 is video-only, so the classic
  30 Hz robot voice is done locally). Pushed to the broadcast, mixed into recordings, never
  played back at yourself.
- **● Record**: every page records. Fighter pages capture their own render + robot voice;
  the broadcast page composites both feeds onto a 1920×1080 canvas with a WebAudio mix of
  both voices. All of it lands as downloadable `.webm` — the browser is the production truck.

## What this is not (on purpose)

- **No pose detection.** Hits are called by a human. Automatic punch detection is real
  computer-vision work with real failure modes — future work, not demo-weekend work.
- **No merged single frame.** The two fighters are never composited into one generated
  world-frame. Each fighter gets their own full-frame X2 session; the "shared world" illusion
  comes from both sessions rendering the *same arena description*. This is load-bearing: X2
  takes exactly one reference image per session, so one shared frame could not give two
  fighters two different bodies anyway.
- **No physics, no game engine.** Fight state is a plain variable and a prompt swap.
  A knockdown looks real because a real person falls over.

## Architecture, briefly

```
webcam A ──> X2 session A (own reference, own prompt) ──> robot feed A ──┐
                                                                          ├──> broadcast page (side by side)
webcam B ──> X2 session B (own reference, own prompt) ──> robot feed B ──┘

keypress "A landed it" ──> WebSocket relay ──> fighter B's page ──> staggered prompt + HIT overlay
```

One Node server does three small jobs: exchanges the API key for a browser-safe JWT
(`POST /token`), serves the pages (HTTP :3000 + self-signed HTTPS :3443 for LAN webcams),
and runs a three-client WebSocket flood relay for signaling, hit cues, and arena sync.

## ⚠️ Before you get creative

- `REACTOR_API_KEY` is server-side only and never reaches the browser. But `/token` has
  **no auth** — anyone who can reach the server can mint JWTs against your paid key. Keep it
  on your LAN; add a shared secret before exposing it anywhere public.
- X2 bills **per session-second, including idle**. Two fighters = double burn. Hit Stop when
  the fight's over — the button actually disconnects, it's not decorative.
