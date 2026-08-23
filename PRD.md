# PRD.md — Shadowbox

## What this is

A four-hour build, one person driving Claude Code. Two people, two webcams, two laptops on
one LAN. Each person's real motion — punches, guard, footwork, getting rocked — is
re-rendered live as a photoreal humanoid robot by a world model. Both robot feeds sit side by
side in one broadcast frame: one screen, two robots, entirely driven by two real people
fighting in real time, right now, with no rig and no game engine underneath the visual.

## The pitch

Vision-piloted humanoid embodiment doesn't need to wait for better robot hardware — the hard
part was never the actuators, it was getting a machine to convincingly wear a human's real
motion. That part is buildable today with a camera and a world model. This demo is the
smallest possible proof: a person's real skill and real motion driving a body that isn't
theirs, live, in front of you.

## Pitch, 15 seconds

> "This is a live camera feed. What you're watching isn't a costume or a game character —
> it's a world model repainting a real person, live, as they actually move. Two people are
> really fighting right now, on two different laptops, and what you're seeing is what a
> human piloting a robot body could look like today."

## Demo script

1. One person alone on camera, moving. Point at the screen: this is a robot, live, driven by
   nothing but their real motion.
2. Bring up the second laptop. Now it's two robots, side by side, one broadcast — but two
   completely independent people, in two different rooms.
3. Call a hit. The loser sells it for real — staggers, drops — and the screen catches up a
   beat later with the same reaction on the robot.
4. Say plainly: nothing here is a game engine or a rig. Every frame is generated, live, from
   a real camera.

## Success criteria, in priority order

1. One person, live, on camera, reads convincingly as a robot in real time.
2. Two independent sessions run at once without one breaking the other.
3. Both feeds sit in one shared broadcast frame.
4. A hit cue produces a visibly different, appropriately laggy reaction.

Cut in reverse order. Never cut below 1 — it is the entire pitch.

## Out of scope, and stays out

Automatic pose-based hit detection, a single merged virtual ring, per-subject/regional
conditioning, any physics engine, rounds, a leaderboard, more than two fighters, mobile,
cloud multiplayer.

## The honest version of the Reactor story

Nothing about the fight is simulated. There is no shared 3D space, no collision detection, no
physics. Two people are really moving on two real cameras in two real rooms, and a world
model is doing exactly the one thing it's actually good at — repainting real, live motion
into a different physical form — twice, independently, composited together afterward. The
"who got hit" decision is a plain variable in code, same as any deterministic game state; the
model never touches it. Say that plainly. The honest claim — "the model does the one thing
it's uniquely good at, and nothing it isn't" — is the stronger pitch anyway.
