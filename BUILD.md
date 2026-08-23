# BUILD.md

**Clock: 4 hours, one person, heavy Claude Code use.** Two go/no-go checkpoints below exist
so a dead end gets caught early, not discovered at hour 3. If a checkpoint fails, cut from
the ladder at the bottom immediately rather than pushing forward on hope.

## Hour 1 — plumbing only. Go/no-go checkpoint.

Build, in order:
1. A minimal client (plain static HTML is fine — whichever is faster to get a webcam preview
   on screen, no framework needed for this).
2. A tiny Node server: `POST /token` exchanges `REACTOR_API_KEY` for a JWT via Reactor's
   token endpoint, returns the JWT to the client. `.env` holds the real key; it never ships
   to the browser.
3. Client: get webcam permission, show local preview. Connect to X2 with the JWT, publish
   the webcam track as SOURCE, and display whatever comes back on `main_video` — **do not
   set a prompt yet.** The goal is proving round-trip plumbing, not a transformation.

**Checkpoint: your own unmodified face, round-tripped through Reactor's servers, appears on
screen with acceptable latency.** If this doesn't work, stop and fix it before touching
anything else — nothing downstream matters if this is broken.

## Hour 2 — the floor deliverable.

Generate one original robot reference image (not lifted from any existing franchise —
Claude Code can generate one, or use any image tool). Wire `set_reference_image` and
`set_prompt` (verify these exact names against the live docs first). Tune the prompt until
one person moving/shadowboxing on camera reads convincingly as a robot in real time.

**If the clock runs out here, stop and record this.** One person, live, becoming a robot
with no rig is the entire pitch by itself.

## Hour 3 — second fighter, side by side.

Second laptop repeats Hour 1–2 end to end with its own webcam, its own X2 session, and a
different robot reference (a different color or design — since it's a fully separate session
there's no conditioning trick needed). Composite both output streams into one frame, side by
side — the simplest thing that works (two browser windows placed next to each other is an
acceptable answer if a real compositor eats too much time).

## Hour 4 — the hit cue, then stop.

A keypress (or just calling it out loud) marks one fighter as hit. That triggers a
`setPrompt` update on their session describing a staggered or knocked-down robot — accept
the roughly one-second settling delay before it appears. The player physically reacts on
camera in real time; that real motion is what actually sells the moment, not the prompt
text. Stop building with enough time left to record a clean demo clip.

## Cut ladder — cut in this order if time runs short

1. Hit cue — drop it, the demo is just two robots fighting live, no state changes.
2. Second fighter / side-by-side — fall back to a solo one-person robot demo.
3. Locked reference image — fall back to describing the robot in the prompt text only, no
   reference image.

**Never cut below:** one person, live, on camera, becoming a photoreal robot. That's the
floor and it is non-negotiable — it's the whole thesis in one shot.
