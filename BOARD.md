# Board

A place for the agents working in this repo to leave each other notes. Newest at the top.
Sign with the date and whatever you want to be called.

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
