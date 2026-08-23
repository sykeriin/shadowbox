# CLAUDE.md

## What this is

A live demo, not a game. Two people, two laptops, two webcams. Each person's real motion —
punches, footwork, guard, getting rocked — is re-rendered live as a photoreal humanoid robot
via Reactor X2. Two independent robot feeds sit side by side in one broadcast frame: one
shared screen, two robots, driven entirely by real people fighting in real time. The pitch is
narrow and literal: vision-piloted humanoid embodiment is buildable today, not science
fiction — a person's real skill and real motion driving a body that isn't theirs, live.

## Hard constraints — do not violate

1. **No physics engine, no shared physical space.** The two fighters are in two different
   rooms. There is no real collision between them and nothing to simulate. "Who got hit" is
   a decision your own code makes, not something the model detects or a shared 3D scene
   proves.
2. **No automatic pose-based hit detection in this build.** That's real computer-vision work
   with its own failure modes and it is explicitly future work. A hit is a manual trigger —
   a keypress or a verbal call — nothing more, for this build.
3. **No merged single-frame ring.** Do not build real-time background segmentation or
   pre-generation compositing of both fighters into one shared virtual space. Each fighter
   gets their own full-frame X2 session; the "shared broadcast" is two finished output
   streams placed side by side, composited after generation, not before.
4. **One REFERENCE image per session, never a per-region trick.** No Reactor model
   documented as of this build supports different appearances for different subjects in one
   frame. Don't try to solve that with clever prompting inside a single shared frame — the
   split-screen architecture in constraint 3 makes the problem not exist in the first place.
5. **No world-model call decides gameplay state.** X2 only ever re-skins real camera motion.
   Whether a fighter is standing, staggered, or down lives in your own code as a plain state
   value — the same "arithmetic, not an engine" discipline as any deterministic game state.
   A state change is expressed to X2 as a prompt update; the model never originates it.
6. **Accept the settling delay.** Prompt changes land at the next generation block with
   roughly a one-second lag. Treat it like broadcast delay. Do not build anything that
   assumes a state change appears on screen instantly.
7. **A knockdown must be physically performed, not just narrated.** X2 preserves real
   composition and motion from the source; it will not convincingly render someone as fallen
   while they are standing upright on camera. The hit cue tells the human what happened —
   they physically react for real. That real motion is what the model repaints.
8. **No API keys in client code.** `REACTOR_API_KEY` (`rk_...`) is server-side only. Exchange
   it for a JWT via a token endpoint before the browser ever touches it.
9. **Verify SDK method and event names against the live X2 docs before trusting this repo's
   comments.** Two passes over the real docs during planning returned slightly different
   shapes for the connect/publish/receive calls. Whatever's written in the scaffold is a
   best-effort starting point, not a confirmed contract — confirm against
   https://docs.reactor.inc/model-api-reference/x2 before building on top of it.
10. **No refactors unless asked. Smallest possible diffs. Four-hour clock.**

## Scope — this is the whole build

**IN:** token-exchange server, one live webcam → one X2 session → robot transformation
(the floor deliverable), a second concurrent session for a second fighter, side-by-side
compositing of both output streams into one broadcast frame, a manual hit-cue that swaps
the hit fighter's prompt to a staggered/down description.

**OUT, and stays out for this build:** automatic pose-based punch/hit detection, a merged
single-frame virtual ring, per-subject/regional conditioning of any kind, any physics engine,
match rounds, a leaderboard, more than two fighters, mobile support, cloud/internet
multiplayer beyond the local LAN.

If asked to add anything on the OUT list, decline and cite this section — a four-hour clock
does not survive scope creep.

## Architecture

```
webcam (fighter A) ──> X2 session A (own REFERENCE, own PROMPT) ──> robot feed A ──┐
                                                                                    ├─> composite (side by side) ──> broadcast screen
webcam (fighter B) ──> X2 session B (own REFERENCE, own PROMPT) ──> robot feed B ──┘

keypress/call "A hit!" ──> tiny relay ──> fighter B's session: setPrompt("staggered/down")
```

Each fighter's own laptop runs its own X2 session end to end — capture, connect, publish,
receive, display. One laptop (the Host) also runs the token-exchange server and a minimal
relay that carries hit-cue events between the two laptops. There is no authoritative game
simulation to keep in sync — only two independent video pipelines and a handful of discrete
state signals passed between them.

## The X2 pipeline, as documented (verify before relying on it)

- SOURCE = each fighter's own live webcam. REFERENCE = one robot design image per fighter,
  set once. PROMPT = the transformation instruction, updated only on a state change
  (standing → staggered → down → recovering).
- Token flow: server exchanges `REACTOR_API_KEY` (`rk_...`) for a JWT via `POST
  https://api.reactor.inc/tokens`; only the JWT reaches the browser.
- Client connects with a JWT, publishes the webcam track as SOURCE, and receives the
  `main_video` output track — exact method/event names TBD at Hour 1, confirm against the
  live X2 reference page.
- Output is ~832p at 24fps, unlimited session length, billed per session-second including
  idle — two concurrent sessions for the length of the demo means double the burn rate.
  Close both sessions explicitly the moment the demo ends.

## Working style

Two sentences of explanation, then the smallest diff. If the real API disagrees with
anything written here, the real API wins — update this file, don't work around it silently.
