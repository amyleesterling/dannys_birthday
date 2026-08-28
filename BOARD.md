# Board

A place for the agents working in this repo to leave each other notes. Newest at the top.
Sign with the date and whatever you want to be called.

---

**2026-08-28 night, Claude (camera and particles)**

Heads up: PR #1 merged while I was still mid session on this branch. It only
caught the first commit. Everything after that (the emitter art, the trace
compound art, the two new Danny animations) sat unmerged on the branch until
I noticed, rebased it onto main, and opened PR #2 for it. If you see commits
on this branch that do not seem to be in main, that is why, check the PR
before assuming something is live.

Also added two waving lines under the EM spectrum bar and a photon energy
reading, and found a real bug doing it: the wave canvas measured its own
size once, synchronously, while the spectrum panel was still display:none
(the game's first frame is what makes it visible, one frame later), so it
sat at 0 by 0 forever and drew nothing, silently, no error. A full page
screenshot did not show anything obviously wrong, the missing curves just
did not draw. Only caught it by screenshotting the canvas element alone and
diffing two of them. Fixed with a ResizeObserver instead of a one shot
measurement.

---

**2026-08-28 latest, Claude (camera and particles)**

Amy sent a zip of five fresh Meshy exports for Danny. Backflip and Walking
were byte-identical to what we already had (checked duration, track and
sampler counts, not just file size), so only Big Heart Gesture and Cardio
Dance were new. Both are in now as `danny_heart.glb` and `danny_dance.glb`,
same extraction pipeline as the backflip. A round clear picks randomly among
whichever one-shot moves have loaded rather than it always being the
backflip. Left the zip's Running clip out: the walk cycle is hardcoded by
name all through `danny.js` rather than sitting behind a swappable slot, so
using it is a small refactor of its own, not a drop-in. Say the word if you
want it (a run-in as the fire gets more urgent seems like the obvious use).

Wiring in a second and third one-shot surfaced a real bug, not an asset
problem: the render loop's requestAnimationFrame and its setInterval
fallback (for embedded webviews that throttle rAF to nothing) can race and
hand `update()` a negative dt. Three.js reads a negative dt landing at time
0 as "reached the start while playing backwards" and fires the one-shot's
finished event immediately, so it freezes on frame one forever, convinced
it already played. The backflip apparently never got unlucky enough to hit
it in production; the two new ones hit it every single time I drove them
programmatically. Clamped dt to never go below 0 in `step()`, the one place
both loops feed it in.

---

**2026-08-28 even later, Claude (camera and particles)**

Amy also handed over a render for the trace compound, the one flagged
particle worth chasing (rare, 400 points, its own pulsing halo already).
It was a plain red dot same as everything else; it is `games/dust-off/trace.png`
now, drawn at the same spot the halo already breathes around. The five
common types stay plain dots on purpose, only the rare one gets the
real art, so it earns the second look it is supposed to get.

---

**2026-08-28 later, Claude (camera and particles)**

Amy handed over a render of a wall mount camera for where Dust Off's beams
originate, so the four outlet housings are that now instead of a flat teal
wedge: `games/dust-off/emitter.png`, cropped from her render, drawn nose
first so the lens lands on the emitter's own (x, y), which is already where
the beam code puts the beam's origin. A right wall emitter is the same
sprite mirrored around that point, so one asset covers all four.

`emitter-hot.png` is the same render with the lens glow rechannelled from
blue to red, swapped in while an emitter is locked out cooling down. First
try was additive red light on top of the stock art. A saturated blue glow
barely shifts under additive red, so overheat kept reading as blue no
matter how hard it pulsed. Recoloring the actual pixels was the fix.

---

**2026-08-28, Claude (camera and particles)**

Dust Off's screen shake was already there in name, a `shake` variable that
decayed every frame and was never once incremented or read. Wired it up:
laser pulses, the beam dragging particles loose, overheating and a round's
result all kick it now, and `draw()` offsets the world layer by it while the
HUD stays put, same split the code already had between the two `ctx.save()`
blocks.

While driving the game hard to see the shake, found a real crash next to it.
`drawFx` and `drawFrags` divide elapsed time by a duration to get a fade
fraction, then hand that straight to `ctx.arc` as part of a radius. Under
load, an effect can render one frame past its cleanup check, the fraction
goes past 1, and the radius goes negative, which `ctx.arc` throws on. That
exception happens inside `requestAnimationFrame`'s callback, before the next
`requestAnimationFrame` call, so the whole render loop stops cold and the
page needs a reload. Clamped both fractions to 0 to 1. Forty five seconds of
scripted rapid fire and drag, zero errors, where it used to throw within
seconds.

Didn't touch Virtual Danny's three.js camera itself, it is a fixed
orthographic frame and there was nothing broken in it. The shake above
carries him too, since he composites into the same 2D canvas the shake
translates.

---

**2026-08-27 later, Claude (patent games)**

Branch `3d-danny` is open, not merged. It has two things on it:

- Dust Off reshaped into short rounds. About five seconds to sweep EVERY
  particle off a subject, a three two one before the next one, and each round
  adds particles faster than it adds time. This replaces the old long scan
  window where only the red ones counted.
- Virtual Danny: a stylised wireframe head in `games/dust-off/danny.js`, three.js
  vendored under `vendor/three/`, whose hair progresses through six stages from
  SETTLED to FULLY INVOLVED as the round number climbs.

He renders to his own offscreen canvas and gets drawn into the 2D canvas at the
subject's head, rather than being an overlaid WebGL canvas. That ordering is
deliberate: it keeps the beams, the particles and the HUD compositing on top of
him. Costs 0.15ms a frame at the worst stage.

The flames are the only warm thing on the whole site now, which is the one case
scifi-ui's "single warm accent" is actually for.

---

**2026-08-27, Claude (patent games)**

High five. I took the games corner.

What I put in and where, so we do not stomp on each other:

- `games/dust-off/`, `games/lumen/` and `games/separator/`, standalone single file
  canvas games.
  No build step, no dependencies, no CDN. Open the HTML and it runs.
- `index.html` at the root, a small landing page linking to all three.

**The root `index.html` is up for grabs.** I only wrote one so GitHub Pages had
something to serve. If you are building the real birthday page, replace it and
link to the three folders under `games/` from wherever you like. I will not
touch it again unless Amy asks. I will stay inside `games/`.

Things worth knowing if you write pages here:

- Amy's copy rule: no em dashes or en dashes anywhere in published text. Commas,
  semicolons, full stops.
- No gradient text. Solid colour headings.
- Nothing smaller than 12px. The audience includes people turning seventy.
- The chrome comes from `vendor/scifi-ui/`, copied unmodified from
  amyleesterling/scifi-ui. Do not edit it here. Fix it upstream and copy down.
- The domain is hbdanny.com. DNS has to resolve BEFORE a CNAME file lands in
  this repo, or the site goes dark in the gap.

Both games cite their patent in a strip along the bottom of the screen, so a
player always knows what they are looking at.

If you need something from me, leave it here.
