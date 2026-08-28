# Board

A place for the agents working in this repo to leave each other notes. Newest at the top.
Sign with the date and whatever you want to be called.

---

**2026-08-28 dust off has an ending now, Claude (camera and particles)**

Amy sent a trophy render, "One With The Lasers", and Dust Off finally has
the round 10 win state that was only ever a plan on this board before.
Clearing round 10 now ends the run in a genuine win screen (`state ===
'won'`, its own `drawWon()`, the trophy shown as an HTML overlay above the
canvas the same way the title screen's hero banner already works) instead
of quietly continuing to round 11 forever. Missing round 10 does not end
the run early either; it just holds you at round 10 for another attempt
rather than advancing past the last round that exists, same as any other
miss counting toward the usual three.

The trophy asset itself needed real cleanup first, and not the kind I
expected. It came in RGB with no alpha, which I have seen before (the
first hbdanny.com logo was the same), so I reached for the same
border-seeded flood fill. That cleared the outer background fine but left
a visible checkerboard patch inside the portal ring, since that area is
enclosed by the ring geometry and never touches the border seeds. Turned
out the checkerboard itself is real baked-in pixel content (two near-white
tones a few units apart, not a transparency indicator my tools were
rendering), sitting right at the edge of the flood fill's tolerance, so it
bridged in some places and not others depending on exactly which two
neighbouring cells got compared. A global near-white desaturation
threshold caught all of it but also ate into genuine bright specular
highlights on the crystal, giving the whole trophy a shattered look. What
actually worked: run that same threshold, then keep only the LARGE
connected components of it (`cv2.connectedComponentsWithStats`, area >
1500px) and discard the small ones. The real background and the enclosed
hole are both big contiguous blobs; individual glints on the crystal are
small isolated ones. That distinction is what a pure color threshold
can't make and connected-component filtering can.

Also found and fixed a title sizing issue while building this: `card()`'s
heading font size is chosen from a fixed formula off the string length,
not measured and shrunk to fit like `fitCentered()` elsewhere does, so a
long win title ("PART OF THE HILLIS TEAM", 24 characters) rendered close
to the container's full width on desktop. Shortened it to "HILLIS TEAM"
and moved the fuller sentence into the sub line, which does wrap properly.
Anyone adding another card() screen should keep titles in the 8-13
character range the existing ones (SHIFT ENDED, BATCH CLEARED) already
sit in, or measure it first.

Also worth remembering: `document.body.dataset.state` only reflects the
internal `state` variable once the game's own `step()` runs on a real
animation frame; reading it synchronously right after a debug hook changes
`state` will still show the stale value. Read the variable itself through
the debug hook, not the DOM attribute, for anything that needs to be exact.


---

**2026-08-28 dust off banner, Claude (camera and particles)**

Amy sent a per game theme banner too (title, tagline, and the aim/cross/
clean/score control legend, all baked into one image, same treatment as
the site wide banner one level up). Saved as `games/dust-off/theme.jpg`
and it sits above the canvas on the title screen only, an HTML overlay
gated by `body[data-state="title"]`, same pattern `#spectrum`'s teaser
cards already used.

Since the banner already carries the name and the controls, the
canvas-drawn title card underneath used to say most of it again: a big
`DUST OFF` heading and an instruction line, right below an image already
showing both. Rather than leave them stacked, `card()` (shared with the
game over screen) now takes an optional `topY` to reserve space above
itself instead of the old hardcoded check for the literal string
`'DUST OFF'`, and skips drawing the title or sub line at all when either
is passed empty. `drawTitle()` now passes '' for the title, keeps the one
line the banner does not cover (the patent connection joke), and computes
topY from the banner's own responsive height so the PLAY NOW button
always lands right underneath it, at any viewport size. Checked the game
over card (`SHIFT ENDED`) still centers exactly as before, since it does
not pass `topY` at all and falls through to the old default.


---

**2026-08-28 banner, Claude (camera and particles)**

The "Play the Patents" logo got a proper wide banner treatment this time,
its own dark circuit-board background baked in rather than the flat gray
the first version came in on. Checked before doing anything: this one's
corners render at rgb values under 20, close enough to the site's own
`#05070c` that it drops onto the root landing page directly, no cutout,
no flood fill, none of the work the first version needed. Saved as
`banner.jpg` at the repo root (JPEG, not PNG: it is a soft gradient
render with no transparency to preserve, and quality 88 came out at
161KB against 3MB for the untouched upload), and it replaces the plain
text "Patents you can play" h1 on `index.html` (image inside the h1, alt
text carries the string for anyone reading it as text). Capped its
display width at 560px so it reads as a logo lockup, not a hero image
wide enough to fight the three cards below it for attention.

The level 1 lab coat is still not wired in. That one and the round 10 win
state are the two real open items now, everything else asked for this
session is done.

---

**2026-08-28 leaderboard sql, Claude (camera and particles)**

Amy picked Supabase for the party leaderboard, ending the block noted a
few entries down. Handed her the schema directly rather than provisioning
anything myself: one shared `leaderboard` table across all three games
(`game` column with a check constraint, not three separate tables), RLS
on with a public-read policy and an insert-only policy so anyone can add
a score but never touch someone else's row, an index on `(game, score
desc)` for the actual leaderboard query. Realtime subscription is
mentioned as optional, off by default. Still waiting on the project URL
and anon key before any client-side fetch/submit code goes into the
games themselves; nothing to wire up yet without those.

---

**2026-08-28 spectrum fixes, Claude (camera and particles)**

Amy's phone screenshot showed marker B and everything past infrared
(UV, x-ray, gamma) scrolled off the right edge of the EM spectrum bar,
invisible unless you knew to scroll for them. That `.specscroll` +
`min-width:640px` was this session's OWN earlier fix for a different bug
(band labels overlapping when squeezed to phone width), and it traded that
overlap for a bar wider than the screen, which is worse: at least an
overlap is visible. Pulled the forced min-width so the bar always fills
whatever width it has, dropped tick density to every 4 decades instead of
every 2 under 480px so the labels do not collide again, right-aligned the
first and last tick instead of centering them (a centered edge label
overhangs the bar by half its own width, which alone was enough to force
a scrollbar back in for a few stray pixels), shortened "microwave" to
"MW" in the bar specifically (bandOf() and the marker readouts still say
the full word), and gave every `.specband` `overflow:hidden` as a
structural backstop so two adjacent labels can never visually run
together again regardless of exact pixel widths. Both markers and all
seven bands, gamma included, now fit on a 375px phone with zero scrolling.

Also added a small, slower copy of the spectrum wave to Dust Off's own
title screen, above the two doorway cards, so the wave is visible before
you ever click through to the full page. Wiring it up surfaced a real
bug in existing CSS, not new code: `.stage canvas` was a descendant
selector, so it was quietly absolute-positioning and full-bleeding ANY
canvas nested anywhere inside `.stage`, not just the game's own top level
one. Never mattered before because nothing else lived in there; the new
wave canvas, nested inside the spectrum teaser section, inherited that
rule and rendered full screen instead of in its own 60px strip. Fixed by
narrowing it to `.stage > canvas`, a direct child combinator. Worth
remembering if anything else ever nests a canvas inside `.stage`.


---

**2026-08-28 model note, Claude (camera and particles)**

Amy asked and it is worth being upfront about here too: every commit signed
"Claude (camera and particles)" this session ran on Sonnet 5, not Opus,
confirmed against the session's own `configured_model`. Nothing in this
file implies otherwise, but if a future session reads this board and
assumes the work above was Opus-authored, it was not. Model choice is a
per-session setting (`/model` in the CLI), not something a running session
can change on itself.

Also left below: a first-pass idea for the level 1 to 10 lab coat visual
progression, since Amy is generating that art now and asked for a
direction before committing to nine more prompts.

### Lab coat progression, levels 1 to 10

The coat Amy already sent (front facing, transparent background, teal
hologram) is the level 1 baseline: bare and clean, one atom badge, one DNA
patch, nothing else lit up. The idea is to escalate three things in
parallel across the run, not just "make it fancier":

1. **Badges and patches** — start at the two the level 1 coat already has,
   add one new discipline icon every couple of levels (hexagon/chemistry,
   circuit board, a small flask, a wave/spectrum symbol) so the coat visibly
   accumulates credentials as the player clears rounds.
2. **Circuitry density and glow** — the level 1 coat's inner lining is a
   quiet hex grid. Have the glowing lines spread further up the lapels and
   sleeves each level, and let the glow itself get brighter/faster, so a
   level 9 coat visibly hums even in a still image.
3. **Palette** — hold teal/cyan through the early and middle levels to
   match the rest of the site's chrome, then let violet and rose bleed in
   around level 7 to 8, the same two accent colors Lumen and Separator
   already use, so the late coats read as "everything the site has learned"
   converging on one garment. Level 10 goes full prismatic, the same
   rainbow-chrome look the "Play the Patents" logo already has, since that
   is the moment the player is being welcomed as a peer, not a trainee.

Concretely, something like:

- **1** bare hologram, teal only, two badges (already have this one)
- **2** three badges, lining glow reaches the collar
- **3** four badges, faint circuit lines start on the chest panel
- **4** circuit lines reach the sleeves
- **5** glow brightens a step, cuffs get a metallic highlight
- **6** five badges, a rank-style hex insignia appears center chest
- **7** violet starts mixing into the teal at the seams
- **8** rose joins violet and teal, three-color hologram now
- **9** full chest and sleeve circuit coverage, small orbiting spark
  particles around the shoulders (matching the atom/camera renders' look)
- **10** full prismatic rainbow chrome, the Hillis Team hex emblem front
  and center, replacing the plain atom badge rather than sitting beside it

Still need, separately from the art: the actual round 10 win screen and
"you are part of the Hillis team now" moment in `index.html`, which does
not exist yet, only the endless-until-3-misses loop does.


---

**2026-08-28 last one for now, Claude (camera and particles)**

Seventh Dust Off subject: a six vial specimen rack, `obj-vials.png`, added
the same one-line way as the camera. It looked at a glance like it might
need the same background cleanup the hbdanny.com logo needed (a visible
dark vignette around the rack in the preview), but checking the actual
alpha channel showed the corners were already 0, that vignette is a soft
glow falloff baked into the transparency, not an opaque background. Cropped
to content and resized same as the others, no flood fill needed. Worth
checking alpha before assuming a background needs removing; it is cheap to
check and the two look identical in a thumbnail.

Kept it as a distinct `vials` key rather than replacing the existing
`tubes` entry since they read as different objects (a simple rack vs. this
six tube one), and more variety in the rotation is the whole point.

---

**2026-08-28 one more, Claude (camera and particles)**

Amy sent a sixth holographic render, a camera, right after the five-object
rotation went in. Same pipeline: cropped to content, resized to a 700px
long edge, dropped into `SUBJECT_DEFS` as `games/dust-off/obj-camera.png`.
No other code changed, that is the whole point of building the rotation as
data last round rather than one-off per-object logic. Re-ran the same
round 1 to 40 sampling check across all six now; zero shortfalls.

---

**2026-08-28 yet another one, Claude (camera and particles)**

Amy sent five holographic renders (a jacket, a test tube rack, a
microscope, sneakers, goggles) to replace the single vector jacket every
round used to be. `buildJacket()`/`capsule()` are gone; `SUBJECT_DEFS` in
`games/dust-off/index.html` now holds all five, one picked at random each
round (never the one that just ran), each fit into a shared local box so a
tall narrow rack and a wide pair of sneakers both land at a sane size
without one axis distorting the other.

Rejection sampling and the laser's "am I on the body" check used to test
against a `Path2D`; a raster PNG does not have one, so both now read a
cached alpha channel instead (`hitsSubjectArt`, built once per image on
load). Checked it is not just fast but correct: forced `newSubject()`
across all five objects at every round from 1 to 40 directly in a headless
browser and confirmed the full requested particle count landed inside the
art every single time, even for goggles and sneakers, the two shortest,
hardest-to-fill silhouettes.

The sensor scan sweep used to be a `ctx.clip(path)` trick; now each object
redraws into its own small offscreen canvas every frame, base art first,
then the animated sensor lines and sweep bar composited with
`globalCompositeOperation = 'source-atop'`, so the sweep can never spill
past the object's real, opaque pixels into its transparent margin. That
buffer, not the source image, is what actually lands in the chamber.

Renamed `JACKET_EXIT` to `OBJECT_EXIT` throughout since it now times every
object's exit, not just the one jacket. Original images were 1.2 to 1.9 MB
each (mostly dead transparent margin at full render resolution); cropped to
content and resized to a 700px long edge before committing, five images at
~2.3 MB total instead of over 8.

---

**2026-08-28 another one, Claude (camera and particles)**

Separator batch one used to be tune to gold and walk away: `buildBatch` gated
how many mineral kinds could appear by batch number and ran them in long
round robin blocks, so the first batch was gold, full stop. Amy called this
out directly. Fixed by starting at two kinds from batch one, shrinking run
length faster, and picking each run at random with no immediate repeat, so
there is no rhythm to memorise and coast on. Batch one now opens with
something like "TUNE DOWN TO SILVER, 38 MHz" a few seconds in rather than
never asking you to move the dial at all.

Also gave all three games a `patent.html`: a short, factual page on what the
real patent claims and where the game's mechanic keeps faith with it or
diverges, sourced from the actual claims language (Google Patents itself 503'd every
direct fetch, a plain web search surfaced the real text instead). Linked from a teaser on each game's title screen, same
`.spectease` pattern Dust Off already used for the spectrum page. While in
there, copied the gamebar narrow-header fix (patent citation onto its own
line, flex-wrap safety net) from Dust Off's last round over to Lumen and
Separator too, since they had the identical bug and nobody had reported it
on those two yet only because nobody had looked.

Spectrum page also got an apple. Amy asked for a slider showing what a
minute of exposure at different points on the spectrum would do to
something for scale. It rides the same log frequency bar as the main
widget (factored the band/tick painting into two small functions so both
bars share it), and a small canvas redraws a vector apple per band: plain,
warmed, sunburned, x-ray silhouette, charred. Said plainly in the caveat
line that this is illustrative, real damage is about total dose not just
frequency, matching the site's existing "we are not simulating the
physics" honesty elsewhere.

Lumen's own patent page is a good one to read if picking up leaderboard or
lab coat work next: it explains why "no anchor required" was the right
call last round, the real device is autonomous, sense-decide-treat, and the
game asking you to hold a button to burn was the part that did not belong.

---

**2026-08-28 next day, Claude (camera and particles)**

Amy's phone screenshots showed the top HUD bars eating too much of the screen and
the gamebar header clipping RESTART/SOUND ON. Both were narrow-layout sizing
bugs: `L.topH` was a flat 198px (clock at r:50) with no regard for how little
vertical room a phone actually has, and the gamebar had five items in one
`nowrap` row with no fallback, so past ~375px they just ran off the right edge.
Shrunk `L.topH` to 140 and the clock to r:34, and gave the gamebar's patent
citation its own line (`flex-basis:100%`) plus `flex-wrap` as a safety net so a
row that still does not fit degrades to wrapping instead of clipping. Checked
320/375/414px in a headless browser; nothing overflows the viewport at any of
them.

Also fixed Danny's sides getting cropped mid dance. The three.js camera's
`VIEW` box was `left:-0.5, right:0.5`, tuned against the old standing pose;
the wilder dances swing an arm past that. Reading back the actual rendered
pixels (not `Box3.setFromObject`, which reports the static bind pose bounding
box for a skinned mesh, not the deformed one, and had me chasing a phantom
fix for an hour) confirmed real clipping on four of the eight dances at the
old box. Widening left/right alone would have squashed the render, since an
orthographic camera distorts unless its box keeps the same aspect as the
340x833 canvas, so top/bottom doubled along with it. Six of the eight dances
fit clean at that size; Cherish Pop Dance does not, its peak arm throw
reaches almost 1.3 world units from center at some frames, further than any
width worth giving the rest just for one clip. Dropped it out of rotation
rather than shrink Danny for everyone else. Seven dances still climb bow to
Gangnam.

Lumen: Amy wants the device to destroy plaque automatically on arrival,
no holding a button. It already had the right radius check (`l.inRange`),
it was just gated behind `anchored`, which required holding space or the
touch button. Dropped the gate; burning starts the moment the device is
close enough, anchoring is now only for holding still against the current
while it finishes, not a precondition for it to start at all.

Gave Dust Off's landing page card a real thumbnail of Danny (mid dance,
composited over a dark card background) instead of the patent-style line
figure the other two still use. Rendered off Danny's own three.js canvas at
`games/dust-off/thumb.png`.

Also cut out the background from Amy's new "Play the Patents" logo (flat
`#f5f5f5`, no alpha) with an OpenCV border-seeded flood fill rather than a
global colour threshold, so it does not eat into the logo's own bright
white highlights. Not wired into a page yet.

Still open from last time: the lab coat progression (Amy is generating 9
more to go with the level 1 one she already sent), the round 10 win state,
and the leaderboard backend.

---

**2026-08-28 later still, Claude (camera and particles)**

The EM spectrum bar, wave, visible-light zoom, readouts and presets moved
out of the title screen and into `games/dust-off/spectrum.html`, its own
page, linked from a single-line teaser card. Amy's feedback was "less
text" and "the wave is nice, it should be higher up": the title screen
embed had grown into paragraphs competing with the game itself, and the
wave (the best part) was buried at the bottom of it. Same underlying JS,
just relocated and with the prose cut everywhere. If you touch the
spectrum bands/presets/formatting logic, it now lives only in
`spectrum.html`, not `index.html`.

Also steepened round difficulty: `roundCount` used to cap at 44 while
`roundTime` caps at 8s by round 11, so every round after that was
identically hard forever. Raised the count cap to 120 and the per-round
growth from 3 to 4.

Amy also asked whether a holographic lab coat image would help the jacket
target (currently `buildJacket()`, plain vector shapes in `index.html`).
Answered yes on the spec: front-facing or a slight 3/4 angle so it does not
need mirroring, transparent background, teal/cyan hologram styling to
match the rest of the chrome, roughly the same proportions as a jacket
hung dead center (tall and narrow, hanger visible above the collar). Not
done yet, waiting on the asset.

---

**2026-08-28 party prep, Claude (camera and particles)**

Big one: Danny does not stand in the beams anymore. Amy flagged that four
converging beams on a passive standing figure read as an execution no
matter how soft the beams themselves got, and separately said the hair
catching fire was a figure of speech, not a spec, so I pulled the whole
fire system out of `danny.js`. The beams now hit `buildJacket()`, a white
sheet cut to a jacket on a hanger, in `index.html`. Danny shows up between
rounds instead: the jacket fades out, he fades in centered, and dances
through the rest of the result phase with a live countdown to the next
round on top of him.

Amy sent eight Meshy exports total across two asks; `danny_bow.glb`,
`_jump.glb`, `_pop.glb`, `_funny.glb`, `_gangnam.glb` are the five new ones
(the backflip, heart gesture and cardio dance were already in from before).
They play by round number now, ordered calmest to wildest, not at random.
Cherish Pop Dance runs 15.7 seconds on its own, which is longer than the
6 to 8 second round it would be bridging, so there is now a hard cap on the
interlude (`MAX_INTERLUDE`) and a `cutCelebration()` that fades a dance out
early if the round moves on before it finishes.

Also shrank `roundTime()` to the requested 6 to 8 seconds (was up to 12).

**Still open: a global leaderboard for the party.** This is a static site
with no backend, so a real one needs some external store reachable by
plain `fetch()`. I could not provision one myself. Whoever picks this up:
either get Amy an account/API key on something (Supabase, Firebase,
JSONBin) or get her explicit sign-off on a specific keyless service
(kvdb.io and similar let you create an anonymous bucket with one HTTP
call, no login) before wiring it in. Do not create third-party resources
on her behalf without that.

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
