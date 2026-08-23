# HANDOFF — continue from here in a fresh session

Repo: https://github.com/sykeriin/shadowbox (private) · local: `C:\Users\sykeriin\Desktop\Projects\shadowbox`
Read CLAUDE.md first — its constraints still govern. Run `npm start`; real `REACTOR_API_KEY` is in `.env` (never commit).

## What works (verified live)

- Full pipeline: webcam → token exchange → X2 session → robot render → side-by-side broadcast.
- Token exchange: model name is **`xmax/x2`** — read from the SDK's `MODEL_NAME` constant, NOT the docs
  ("reactor/x2" and "x2" both fail with a misleading "not available to this API key" error).
- SDK is installed locally (`@reactor-models/x2`), bundled to `public/vendor/x2.mjs` by `npm run build:sdk`
  (esbuild, `hls.js` external). No CDN.
- Session lifecycle gotchas (all handled in `public/index.html`, keep them if refactoring):
  - Subscribe `onMainVideo` **before** `connect()` — the track arrives during connect and the event never replays.
  - Wait for status `"ready"` before `publishSource` — `connect()` only reaches `"waiting"`.
  - Stop must call `disconnect()` — billing is per session-second including idle.
- Prompts follow https://docs.reactor.inc/model-api-reference/x2/prompt-guide.md (append `.md` to any docs URL for
  raw markdown): verbatim Chinese capability prefix `视频中角色替换成参考图中角色`, spatially named target, one
  preservation boundary, character NEVER described in text (the reference image supplies identity).
- HTTPS on :3443 (self-signed, cached in `certs/`, gitignored) alongside HTTP :3000, one shared relay across both —
  getUserMedia needs a secure context, so other devices must use `https://<lan-ip>:3443`. Chromium browsers only
  (Firefox/WebKit reject the SDK's SDP munging).
- Hit cue: broadcast page buttons/keys (1/2/r) → relay → target fighter's prompt swaps to a staggered variant +
  instant cosmetic flash. The fighter must physically react (CLAUDE.md constraint 7).

## Current state of the in-progress feature batch

`public/index.html` (fighter page) is DONE and coherent:
- Big full-viewport panes, header, status dot, polished controls.
- Drag/drop custom reference image (any character; falls back to robot1.png for A / robot2.png for B).
- "Robot voice (mic)" toggle: WebAudio ring modulator (30Hz) — X2 has NO audio tracks (verified in SDK types),
  so voice is local-only; pushed to broadcast alongside video, mixed into local recordings.
- "Arena background" toggle (default ON): prompt variant where X2 also repaints the room as a sci-fi arena —
  IDENTICAL arena text on both fighters so the split-screen reads as one venue. Prompt-guide caveat: stacked
  edits compete; if character identity weakens, untoggle → back to reliable single-edit prompt.
- ● Record button: MediaRecorder on rendered feed + morphed voice → `shadowbox-fighter-X.webm`.

## Remaining tasks (in order)

1. **Rewrite `public/broadcast.html`** to match: arena-styled chrome (gradient/glow, center VS divider, name
   plates), keep peers/offer/answer/ice logic, hit buttons + keys 1/2/r + flash animation exactly as now.
   Received streams may now contain audio: keep `<video>` elements MUTED live (feedback), route audio only into
   the recording mix.
2. **Broadcast recording**: 1920×1080 canvas, both feeds contain-fit left/right, rAF draw loop while recording,
   WebAudio mix of both fighters' audio → MediaRecorder(canvas.captureStream(30) + mix) → `shadowbox-broadcast.webm`.
3. **Verify** (start server, load pages, check console, then STOP the server — standing user preference: server
   runs only during active testing, credits).
4. **Commit + push.**

## Explicitly declined / out of scope (don't re-open without the user overriding CLAUDE.md)

- Punches physically connecting across the split-screen (= merged single-frame ring, constraint 3).
- Automatic pose-based hit detection (constraint 2).
- Real voice conversion (X2 has no audio; ring-mod is the agreed approximation).
- Public deploy note: `/token` has NO auth — anyone with the URL can mint JWTs against the paid key. Add a
  shared-secret gate before deploying anywhere public.
