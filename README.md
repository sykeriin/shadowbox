# 🥊 SHADOWBOX

**POV: you and your friend are throwing hands in two different bedrooms and the livestream says you're mechs in a volcano.**

Shadowbox takes your actual webcam — your actual jabs, your actual footwork, your actual
"oh no" face — and re-renders it **live** as a photoreal robot (or Superman, or literally any
character you drag in) via [Reactor X2](https://docs.reactor.inc/model-api-reference/x2).
Two fighters, two rooms, one broadcast screen. Blue corner vs red corner. It looks like a
televised mech fight. It is two people shadowboxing at their desks. We will not be taking
questions.

No mocap suit. No game engine. No 3D anything. A webcam, a prompt, and one image. That's the
whole tech stack fr.

## How a fight goes

1. Each fighter opens their page, drops in a character image (or picks from the gallery),
   lets the dice pick an arena, hits **Start**. ~2 seconds later you're a robot. Real.
2. The arena syncs to the other fighter automatically so both halves of the screen are the
   same venue. One world, zero compositing crimes.
3. The broadcast page puts both renders side by side with a big slanted **VS**. This is the
   screen you point the TV at.
4. Someone lands a punch → someone presses a key (`1`: A landed it, `2`: B landed it). The
   hit fighter's whole screen screams **HIT — REACT!** and here's the bit: **they have to
   actually sell it.** Stagger. Stumble. Go down. X2 repaints what the camera sees — the
   acting is the physics engine, and the physics engine is you.
5. `r` resets. ● Record on any page = instant MP4 for the group chat.

Yes, the referee is a keyboard. Yes, flopping is not only allowed, it is the mechanic.

## Speedrun (first time)

```bash
npm install
cp .env.example .env      # put your rk_... key in .env
npm run build:sdk
npm start
```

Then open (Chromium only — Firefox catches the L on this SDK, sorry):

| Page | URL | Vibe |
|---|---|---|
| Fighter A | `http://localhost:3000/?fighter=A` | blue corner |
| Fighter B | `https://<lan-ip>:3443/?fighter=B` | red corner, friend's laptop |
| Broadcast | `http://localhost:3000/broadcast.html` | the TV |

The LAN IP is printed when the server starts and **changes when you switch WiFi** — read it
fresh, don't trust an old link. Friends will hit a scary cert warning: Advanced → Proceed,
it's our own cert, it's fine.

No API key? It runs in **mock mode** — full pipeline, webcam loopback, zero credits burned.
Rehearse for free, cook later.

Full runbook with troubleshooting: [STARTUP.md](STARTUP.md).

## The toys

- **Any character.** Drag any image in. One reference per session — the image IS the
  identity, the prompt never describes it. Your fursona is between you and the model.
- **Arenas.** Neon coliseum, wasteland junkyard, volcano crater, glacier field, city rooftop —
  or Random rolls one per fight. Same venue lands on both fighters automatically.
- **Robot voice.** WebAudio ring modulator on your mic (X2 is video-only, so the 30Hz robot
  voice is homemade). Goes to the broadcast + recordings, never into your own ears.
- **Recording.** Every page has ● Record → real MP4 (H.264+AAC), plays everywhere, shares
  anywhere. The broadcast records 1080p with both feeds and both voices mixed — and keeps
  recording with the window minimized, so you can go fight while it cooks.

## What it deliberately is not

- **No punch detection.** A human calls hits. Pose detection is real CV work with real ways
  to embarrass you mid-demo — future us's problem.
- **No merged frame.** The fighters are never composited into one generated shot. Each gets
  their own full-frame X2 session; the "same world" is the same arena prompt on both. This is
  load-bearing: X2 takes exactly ONE reference image per session, so a shared frame couldn't
  give two fighters two bodies anyway.
- **No physics, no engine.** Fight state is a variable and a prompt swap. A knockdown looks
  real because somebody actually hit the floor. Commit to the bit.

## Architecture, one breath

```
webcam A ──> X2 session A (own reference, own prompt) ──> robot feed A ──┐
                                                                          ├──> broadcast (side by side)
webcam B ──> X2 session B (own reference, own prompt) ──> robot feed B ──┘

keypress "A landed it" ──> WebSocket relay ──> fighter B's page ──> staggered prompt + HIT — REACT!
```

One small Node server: `/token` swaps the API key for a browser-safe JWT, static pages over
HTTP :3000 + self-signed HTTPS :3443 (webcams demand a secure origin), and a three-client
WebSocket flood relay for signaling, hit cues, and arena sync. That's it. That's the backend.

## Hosting (Render)

Serverless can't hold the WebSocket relay, so the whole server deploys to
[Render](https://render.com) as one service — `render.yaml` is the blueprint:
**New → Blueprint** → this repo → paste `REACTOR_API_KEY` (`TOKEN_SECRET` auto-generates).
Render does real TLS, so the cert warning disappears; everyone just opens
`https://<app>.onrender.com/?fighter=A&key=<TOKEN_SECRET>`. Free tier naps after ~15 min and
takes ~1 min to wake — open it before showtime. Fighters on different home networks may need
a TURN server for the feeds; same-LAN is fine.

## ⚠️ Read this or pay for it

- `REACTOR_API_KEY` never touches the browser. `/token` is guarded by `TOKEN_SECRET` when
  set (pages pass `?key=...`); **unset = open endpoint = LAN only.** Do not put an unguarded
  deployment on the internet unless you enjoy strangers speedrunning your credit balance.
- X2 bills **per session-second, including idle** — standing there in the arena doing nothing
  is still on the meter, times two fighters. **Stop** actually disconnects. Use it. And
  stopping the server does NOT stop live X2 sessions (they run browser↔Reactor directly) —
  fighters must Stop or close their tabs.
