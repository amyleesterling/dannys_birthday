# Board

A place for the agents working in this repo to leave each other notes. Newest at the top.
Sign with the date and whatever you want to be called.

---

**2026-08-28 no text selection inside the games, Claude (camera and particles)**

Amy caught this on a phone: a drag that started near the top bar selected the
word GAMES and put Apple's Copy / Find Selection menu over the middle of a
round. Playing Dust Off is a press and drag, which is exactly the gesture iOS
uses to start selecting text, so the two were always going to collide.

`user-select: none` plus `-webkit-touch-callout: none` on `html, body` in all
three games. The callout is the separate long press menu and needs its own
property; turning off selection alone does not stop it. Also
`-webkit-tap-highlight-color: transparent`, which kills the grey box iOS paints
over a tapped link, since every button in the bar is a tap target during play.

Scoped, not global. On `spectrum.html` only `.specbar`, `.specmark`,
`.specvisbar` and `canvas` get it, because the markers are dragged over
paragraphs that someone might reasonably want to copy. The landing page and the
three patent write ups are untouched for the same reason.

Verified by actually selecting through the DOM in a real browser rather than
reading the computed property: a Range over the target, then checking how much
text came back. Worth doing that way, because `-webkit-touch-callout` reads as
`undefined` in Chromium's computed style, so a property check alone would look
like a failure on a rule that is in fact correct and simply Safari only.

---

**2026-08-28 the game teaches its own rules again, Claude (camera and particles)**

Amy played the build from the entry below and asked two questions: what the
crossed circle means, and whether particles come off with a repeated blaze or
a longer one. Both are complete answers on their own. I had shipped three new
rules (tap knocks and hold does not, loose particles settle back, contaminants
fail the round) behind a single dim 12px line of static text, and none of it
was discoverable. The mechanics were fine; the teaching was absent.

Two fixes, both in `drawGoal`.

`coachLine(s)` replaces the static sentence and says the one next thing rather
than everything at once. Nothing loose yet, so "tap the object to knock
particles loose", and on a wide screen it adds "holding the beam will not",
because that is the exact wrong guess Amy made. Something loose, so "hold and
drag them down into the intake", in cyan rather than dim so the line reads as
having changed.

`drawLegend` draws the two real glyphs through `drawSpeck` and `drawFoul`, the
same functions the game itself draws them with, labelled RECOVER and REJECT.
Words alone could not do this: you can read "leave the crossed ones" and still
not know which speck that means at four pixels. It only appears in rounds that
actually contain a contaminant.

The general lesson, since this repo keeps relearning it: a mechanic that
changes what an existing gesture does needs the *hint* changed in the same
commit. The old copy said "tap, then drag them to the intake", which was
technically still true and completely failed to convey that holding no longer
strips anything.

Difficulty is still unplaytested. Amy's confusion was about legibility, not
about the numbers, so nothing in the balance moved here.

---

**2026-08-28 Dust Off is a game now: two verbs, a settle clock, contaminants, Claude (camera and particles)**

Amy asked for loose lifetime, heat that matters, and hazard particles. All
three are in. But the thing that actually made the game trivial was none of
them, and it turned up while testing the first one.

**The intake was a vacuum, not a mouth.** Its suction reached 300px above the
vent across the full width of the screen. On a phone that is the bottom half
of the display, which contains most of the sample, so anything knocked off the
lower body simply fell in by itself. "Drag them to the intake" was barely a
verb. It is `VENT_REACH` 70 and `VENT_MARGIN` 22 now, and you have to deliver.
If Dust Off ever feels like it plays itself again, look here first.

The three asked-for changes:

**BEAM_STRIP is 0.** The HUD has always said tap to knock, then hold and drag,
two verbs, but the held beam stripped as well as pushed, so one sweep did both
jobs. That is why particle counts and clock never made it harder: they only
made you sweep faster. Taps knock, holds herd, both cost heat. The constant is
still wired up so the verbs can be blended again from one number.

**LOOSE_LIFE 3.6s**, then the particle settles back onto the body at the exact
local point it came off, so it can never land in empty space. It settles
rather than vanishing because vanishing reads as the game stealing something
you earned. It flickers for the last 1.2s, faster as it runs out.

**Contaminants.** `foulFrac` runs one in sixteen up to just under a third.
Feeding one to the intake costs 180 and *fails the round*, not just some
points, because a mere score penalty leaves "sweep it all in and eat the cost"
as the fastest play. They are drawn as a crossed ring, not just a violet dot:
at four pixels over Amy's holographic art, violet against red is a coin flip,
so the shape has to carry it where the hue cannot.

**Balance is the honest weak spot here.** I measured throughput at 0.36 to
0.79 particles per second across runs, against 0.74 needed for round one and
6.8 for round ten. But my bot herds one column at `cx` and taps a few fixed
targets, so it is a floor, not an estimate, and the spread between runs shows
how noisy it is. I used it only to catch the case where I had clearly gone too
far: at `PULSE_HEAT` 12 the emitter locked out after four taps and the late
rounds were unreachable, so taps came down to 6, `PULSE_RADIUS` up to 74, and
`roundCount` from `8 + n*4` capped at 120 to `5 + (n-1)*3.2` capped at 60.
Heat should price herding, the sustained action, not aiming.

Turn these first if Amy says it is wrong, in this order: `roundCount`,
`LOOSE_LIFE`, `foulFrac`, `VENT_REACH`, `PULSE_HEAT`.

One testing note that has now cost two sessions: **the canvas sits 51px below
the viewport top**, under the gamebar. `page.mouse` takes viewport coordinates
and everything inside the game is in canvas coordinates. My first delivery
test reported FAIL for both trace and contaminant purely because of this, and
the difficulty bot from an earlier entry died the same way. Convert with the
canvas `getBoundingClientRect()` before every synthetic pointer event.

---

**2026-08-28 gamma is unresolvable now, and my earlier reasoning was wrong, Claude (camera and particles)**

Amy, twice: gamma should be so fast you cannot see it. The note further down
this file argued that meant strobing, refused on seizure grounds, and left it
there. That refusal was reasoning about the wrong thing.

**A strobe is what you see when something is slow enough to resolve.**
Genuinely too fast to see is a smear, not a flicker. So the honest render and
the safe render are the same render, and the whole objection dissolves. What
climbs is the *spatial* frequency; nothing on either page flashes.

Two places changed, both the same way.

`spectrum.html` is the one that mattered and the one I had missed. Its
`CYCLES_ACROSS` was a **fixed** 3.2, so a marker dragged to gamma drew exactly
the same wave as one parked on radio, only scrolling faster. That constant was
the entire reason her ask could never be satisfied. Cycles follow `toX(f)` now,
1.2 up to 240 across the lane. Measured by dragging marker A and counting
midline crossings: radio 6, microwave 30, infrared 128, x-ray 434, gamma **1**,
with ink coverage going 0.03 to 0.68. That last row is the ask, met.

The Dust Off title card got the same treatment for consistency.

Where the wave stops being drawn is a measured threshold, not taste. Nyquist
puts the hard floor at two pixels per cycle, but a *stroked* line needs more
headroom than a sample does: at 2.2 the trace was still drawn and came out as
aliasing teeth, which reads as a broken wave rather than a fast one. I saw that
in the first render and moved it to 3.2, where the last drawable cycles still
look like cycles. The step floor went 0.6 to 0.3 for the same reason, since 0.6
left only about three samples per cycle up there.

The smear is not a flat bar. A sinusoid dwells at its turning points and
crosses the middle fast, so a blurred one is two bright rails with a dim
centre, the arcsine density. It is approximated with nine gradient stops
rather than integrated per frame.

Cost: 61fps to 50 on the card during the dense part of the sweep. Acceptable
for decoration; if it ever matters, the gradient is rebuilt every frame and
could be cached against a quantised `u`.

---

**2026-08-28 new Dust Off wordmark, and how it was cut out, Claude (camera and particles)**

`games/dust-off/logo.png` is Amy's new one: wider beams, a crosshair in the O,
no badge. 900x225 at 281KB, from a 2508x627 source.

The cutout is worth reading before you replace this asset. The source is RGB
with no alpha, on what looks like a black field but is not one: the corners
measure 12 to 18 luma and the *median* pixel is 37, because there is a broad
atmospheric glow behind the whole frame. A threshold cutout of any kind gives
you a choice between clipping that atmosphere and leaving a visible dark
rectangle on the panel. Neither is what the art wants.

So alpha follows luminance instead, `smoothstep(22, 62, max(R,G,B))`, RGB left
alone. That is the standard move for glow-on-black art: the atmosphere fades
out where it actually fades rather than at a frame edge, and the lettering,
which is far above 62, stays fully opaque. 23% of the image ends up truly
transparent and 32% truly opaque, with a real gradient between.

The two numbers are tuned to this image, not universal. 22 is above the
brightest corner, which is what makes the edges vanish; 62 is below the dimmest
part of the beams, which is what keeps them solid. If the next asset has a
lighter background, remeasure the corners first.

Checked on the panel colour and at full size on the device lost screen, not
just on magenta. Magenta shows you the mask; only the real panel shows you
whether the atmosphere reads as a box.

---

**2026-08-28 gamebar reordered, emitters spaced and drifting, Claude (camera and particles)**

The wordmark leads on the left and the controls sit together on the right, in
all three games rather than only the one Amy was looking at. The back link
moved in the markup from first to just before the sound button, and
`.gamebar-back` gained `margin-left: auto`. That last part matters: leaning on
`.gamebar-title` to absorb the slack works on a desktop and fails on a phone,
where the title *and* the citation are both `display: none` and the controls
would sit stranded against the logo.

The emitters were too big and too close together, reading as one lump with
two barrels per wall. Width is `L.emW` now, 74 on a phone and 92 on a desktop
against a flat 108 before, and the vertical gap went from 0.09/0.11 of the
height to 0.15/0.17. On a phone that is a 119px gap where it was about 76.

`lensGap` follows `L.emW` rather than the hardcoded 14 it used to add, since
that number was a stand-in for how far the lens sticks into the chamber and
the lens just changed size. Objects got a little wider as a result, which is
the correct consequence and not an accident: `objScale` on a phone went 1.94
to 2.04.

The housings now drift when they are not firing. `emAim.idle` fades 0 to 1
over about a second either way, and `emitterSweep` gives each of the four its
own phase and rate, about eleven degrees either side. Amy's note is the reason
it is worth it: the art has a jointed arm behind the lens, so the rotation
reads as a machine idling rather than a sprite wobbling. Two things to keep if
you touch it. The fade is what stops a housing snapping to true the instant
you touch the screen, so do not replace it with a boolean. And the four rates
differ on purpose; in lockstep they look like a screensaver.

Verified geometry rather than eyeballed, both viewports, all three bars: logo
within 11px of the left edge, sound button within 11px of the right, back link
right of the logo everywhere. Idle drift confirmed by screenshotting the
emitter's own bounding area twice, 900ms apart, and comparing buffers. First
run said "not moving" on desktop and that was my clip, sampling x 0 to 130
when the desktop emitters sit at x 302.

---

**2026-08-28 Dust Off title copy, and the EM card sweeps the spectrum, Claude (camera and particles)**

The title screen was still running the old blurb, "a radiofrequency particle
separator, except up the spectrum, because we are using light beams". Amy had
given the line for this card a while back and it only ever landed on the
landing page. Both now read the same sentence, verbatim: "Radiofrequency
particle separator, except up the frequency five million fold because LASERS."

Note for whoever edits it next, because the entry further down this file
already warns about it and it nearly caught me: **five million fold is
correct here.** That is radiofrequency to a green laser, about 1e8 to 5.6e14
Hz. The 1e16 "ten quadrillion" figure is radio to gamma, which is the whole
bar on spectrum.html, a different claim. Neither is a typo for the other.

The teaser card under the play button used to be two sine waves at fixed
wavelengths, scrolling. It drifts up and down the spectrum now, 26 seconds
for a full traverse, bunching from about one lazy radio cycle across the card
to seventeen at the gamma end, with the stroke colour crossfading through the
same band colours spectrum.html uses. The two lanes are offset by 0.22 of the
sweep so the card always shows two places on the spectrum rather than one
doubled.

Two things in there are deliberate and should survive the next edit.

**Only the spatial wavelength sweeps. The scroll rate is a constant.** The
honest version, where the temporal rate tracks the frequency, is the thing
the older entry below already talks itself out of: it strobes into an
unresolvable blur somewhere around UV and stays there for the top of the bar.
Useless to look at and a real seizure risk. Do not "finish" this by wiring
scroll speed to `u`.

**The sample step tightens as the wave bunches**, `w / (cycles * 26)` clamped
to 0.6 and 2. The old fixed 2px step was fine for 3.2 cycles and would have
turned the dense end into sampling noise rather than a wave. Checked across
six points of the sweep: clean curves at every density, 61fps.

`prefers-reduced-motion` freezes the card at one point of the sweep instead
of running it. My first pass froze the top lane and left the bottom one
sweeping, because the two were computing their sweep position separately.
Both come off one `phase` now. Verified still by screenshotting the card
twice, 2.5s apart, and comparing the buffers.

---

**2026-08-28 Lumen: a gentler opening, a pink bed, the rover on the lost screen, Claude (camera and particles)**

Three things Amy asked for after playing it on a phone and dying on bed one
with nothing cleared.

**The opening is easier, and the thing that made it hard was not what I first
reached for.** My first attempt eased the lesion *choice*: pick a nearer leaf
out of the far ones. Measured over 200 generated beds, that moved the median
trip from 884 to 884. Nothing. The reason is worth writing down: a bed has
only about seven leaves and they all land between 800 and 1060 units out,
because every branch grows to much the same radius, so there is no near leaf
to pick. The trunk length is the only real lever, and the opening beds are
physically smaller now (`sizeScale`, 0.70 on level 1 to 1.0 from level 3).
Vessel *radius* is deliberately untouched, so an early bed also has wider
corridors relative to its length.

Measured, 200 beds per level, level 1 against level 3:

- median distance to the first plaque: 682 vs 889
- p90 distance, the bad luck bed: 781 vs 1093
- clots circulating: 2.7 vs 13.0
- wall scrape rate: 0.50x vs 1.00x

`ease(lv)` is the one curve all of that hangs off: 1 on level 1, 0.5 on level
2, 0 from level 3. Nothing about level 3 and up changed.

**The bed is hot pink.** It sat at 340 to 355 degrees, plain arterial red,
while the Lumen wordmark and the site's `--rose` token are pink. Everything is
at 330 now. Two things to know if you touch this. Rotating hue alone reads as
a duller red, not a pink, so the lit tones also gained 6 to 10 points of
saturation. And `COL` was not the whole palette: twelve more reds were
hardcoded in the drawing code (clots, cells, panel fills, the tissue
backdrop), and shifting only `COL` would have left the game two-tone. If you
recolour this game again, sweep the file, not the constant block.

**The rover is on the device lost screen**, above the wordmark. It uses its
own `.gscreen-art--rover` rather than `.gscreen-art--tall`: that modifier is
cut for Dust Off's trophy at 513x700, and the rover is 256x297, so the shared
rule would have made it the biggest thing on the panel.

Still true, and now load bearing twice: the game is an IIFE with nothing on
`window`. Both the difficulty measurement and Dust Off's subject test were
done by rewriting the response body through Playwright's `page.route`. That
is the way to instrument these games without shipping a debug hook.

---

**2026-08-28 the lab coat is an eighth subject, Claude (camera and particles)**

`obj-labcoat.png` is in `SUBJECT_DEFS`, so Dust Off now rotates eight objects
instead of seven. Amy sent this as "level 1 lab coat", the first of the ten
coat progression sketched further down this file, and I asked whether she
wanted it as that progression's reward or as another thing to dust off. She
picked subject. So the levels 1 to 10 idea below is still unbuilt, and this
art is now doing a different job than it was generated for. If the progression
ever gets built, this coat is spoken for and level 1 needs its own render, or
the coat needs to appear in both places knowingly.

Worth seeing: `obj-jacket.png` is the same artwork cropped to a waist length
jacket. Side by side they are obviously one design, which is why the coat
needed no restyling to sit in the rotation.

The asset had the alpha quantisation bug again: the coat body topped out at
253, not 255, so 41% of the image was very slightly translucent and nothing
in it was fully opaque. Lifted everything at 245 or above to 255 and left
the rest, which keeps the soft outer glow (2.3% of pixels sit between 1 and
40) while making the body solid. If a render Amy sends looks faintly washed
out over the chamber, check `alpha.max()` before you go looking at blend
modes.

Checked the silhouette rather than assuming: `newSubject` rejection samples
inside the alpha mask, so a sparse object costs more tries. The coat fills
58.4% of its local box, the best in the set alongside the camera, against
40.9% for the microscope. About 205 expected samples to place 120 particles,
with a guard at 36000. No risk of a round shipping short.

One testing note for whoever comes next. The game is inside an IIFE, so there
is nothing on `window` to poke and you cannot force a subject from
`page.evaluate`. Rather than add a debug hook (an earlier entry below records
what removing one cost), use Playwright's `page.route` to rewrite
`SUBJECT_DEFS` down to the one object you want in the response body. Real code
path, no test scaffolding in the shipped file.

---

**2026-08-28 the page closes on a birthday card, Claude (camera and particles)**

`hbd.jpg` is at the foot of the landing page, where the line "Happy birthday,
Danny." used to be. The line is gone rather than sitting above a picture of
itself; the words live in the image's alt text, so a screen reader still gets
them and nothing is said twice.

It is 1440x810 at q88, 384KB, down from a 3MB PNG. The source is a dark image
full of glow gradients, which is exactly what JPEG bands, so this was encoded
with `subsampling=0` (no chroma subsampling) and checked against the resized
original rather than by eye: 37.6 dB PSNR, and the worst pixels are on the
letter edges where they belong. If you re-encode it, measure; a banded
gradient on a black page is very visible and a thumbnail will not show it.

Wider than the header banner on purpose, 720px against 560. It is the last
thing on the page and shares the room with nothing.

---

**2026-08-28 the landing cards carry the wordmarks now, Claude (camera and particles)**

Lumen and Separator's cards had text headings while their games had wordmarks,
so the two ways in didn't look like the same thing. The headings are images
now, the same `logo.png` each game's gamebar loads. Sized by height rather
than width: all three wordmarks share an image-height-to-letter-height ratio,
so one height gives one letter size across the set. Dust Off's card gets no
wordmark because the banner above it already says the name.

The trap, and it cost a round: `.card` is `display: flex; flex-direction:
column`, so `align-items` defaults to `normal` and children are stretched to
the full cross axis. An `<img>` with `width: auto` is stretched right along
with them, and `width: auto` never gets a say. Both wordmarks rendered at the
card's full width, 300x34 on a phone, badly squashed. `align-self: flex-start`
fixes it, which is exactly what `.card .go` had already been doing for the
same reason. If you put an image in one of these cards, expect this.

What caught it was asserting the *rendered* dimensions rather than looking at
a screenshot. 153x34 for Lumen and 172x34 for Separator are the right aspect
ratios; a screenshot of a squashed wordmark looks like a wordmark.

---

**2026-08-28 no restart button, and the sample sized to its room, Claude (camera and particles)**

The RESTART button is out of all three gamebars. `r` still restarts, and the
play/restart screens still have their own buttons, so the only thing actually
lost is restarting *mid-run* on a phone, where there is no keyboard. That was
the ask; worth knowing it is the tradeoff.

Objects are bigger, but the interesting part is what was stopping them. The
caps went 150x185 to 165x200, and the scale they are drawn at is no longer
`L.figScale`. That constant is Danny's height over 185, and tying the sample
to it meant the sample's size had nothing to do with the space it had. On a
desktop the tall objects were being drawn straight *through* the particle
readout, and had been before this change too, just less far.

`L.objScale` is computed from the room that actually exists: sideways from the
emitter lenses (which sit 17px off each wall on a phone, 30px on a desktop),
vertically from the bottom of the readout down to the floor. Measured every
object against both on both layouts rather than eyeballing it, which is how
the desktop collision turned up at all.

Phone gains about 11 per cent in each direction, and the wide flat ones
(vials, goggles, sneakers) still leave a lot of vertical room empty because
they are simply flat: they hit the width limit long before the height one.
Desktop objects are now *smaller* than they were, because they were
overlapping the readout and had to come back inside it. If someone wants them
big again there, the readout block is the thing in the way and the side panels
already carry the same numbers, so moving it out of the chamber would give
back about 95px of height.

---

**2026-08-28 lumen has a real rover now, Claude (camera and particles)**

`games/lumen/rover.png` replaces the little vector arrow the device was drawn
as. Amy flagged the one thing that matters for wiring it up: the art is framed
**nose up**, while `dev.ang` is a plain atan2 heading with zero pointing along
+x. So the sprite turns by `ang + Math.PI / 2`, not `ang`. Verified by
steering it by cursor in all four directions and checking the glowing eye and
the headlamp cone both lead the heading, rather than trusting the derivation.

Two things about this cutout that the earlier ones did not need.

The usual near-white threshold would have eaten the rover. Its hull is a white
sphere whose lit rim samples 245-247, and the checkerboard is 242-255, so
there is genuinely no brightness contrast at the boundary in places. What does
separate them is that the background is *periodic* and the hull is smooth: a
local max minus local min over a 17px window (wider than the 14px checker
cell) reads 7 to 22 across the checkerboard and under 7 on the body. Take the
border-connected part of that periodic region and the hull is never at risk.
The 17px window cannot classify the ~8px band right at the object edge, so the
confident background is then grown back through bright pixels only.

The anchor is not the bounding box centre. The legs splay wide and the tail
hangs well below the hull, so centring the sprite would have swung the body
off the device's actual position as it turned. `ROVER_FX/FY` is the centre of
the largest circle that fits inside the artwork, found with a distance
transform, which lands exactly on the hull: 0.499, 0.389. A first attempt at
this using brightness found only the lit left half of the sphere and put the
anchor visibly off centre, which is the sort of thing a crosshair render
catches and arithmetic does not.

The wall-gripping wheels are gone from the drawing since the render has its
own legs, but `dev.wheel` still accumulates distance and now drives a half
pixel of gait along the sprite's own axis, so a rigid render does not read as
sliding. `dev.emit` used to recolour the vector body, which a fixed render
cannot do, so it is a cyan bloom around the hull instead.

---

**2026-08-28 the spectrum numbers were understating reality, Claude (camera and particles)**

Amy, on the EM spectrum teaser: "shouldn't gamma ray be so fast you can't
even see it? 1,000 trillions more is nuts!!" She is right, and there were
two separate things wrong.

The old teaser copy read "Radio to gamma, five million times up", which
quietly borrowed the *default marker separation* and passed it off as the
span of the whole bar. The bar runs 1e4 Hz to 1e20 Hz, so end to end it is
1e16, ten quadrillion, not five million. That copy is already gone with the
title screen rebuild, but the misconception it left is worth naming.

The live readout had a real bug behind the same number. `BIG` stopped at
trillion, so dragging A and B to the two ends rendered 8.2e15 as "8200
trillion". It goes to quadrillion now and reads "8.2 quadrillion", checked
by actually dragging both markers to the rails rather than trusting the
formatter by eye. The sub line also states the full span outright now, so
the page says how big the bar is without needing you to drag it.

Worth keeping straight, because these two numbers look alike and are both
correct in their own place: "five million fold" on the Dust Off landing card
is *not* wrong. That one is radiofrequency to a green laser, roughly 1e8 Hz
to 5.6e14 Hz, which really is about five million. Radio to gamma is the
1e16 one. Do not "fix" the card to match the page.

Not done, and it is a good question: the wave on the spectrum page does not
speed up with the marker. Its animation rate is cosmetic on purpose. An
honest one would strobe into an unresolvable blur somewhere around UV and
stay there for the top two thirds of the bar, which is both useless to look
at and a genuine seizure risk, so it stays decorative unless someone wants
to design a better answer than "flash faster".

---

**2026-08-28 phone HUD on a diet, and a difficulty pass that did not work, Claude (camera and particles)**

Amy: "the playable area is so small on my phone, there is too much crap in
the top of the screen". She was right, the two bars were eating a third of
it. `topH` 140 to 84, `botH` 66 to 46, the clock down to r24 and without its
'LONG NOW YEAR' caption, score and round moved either side of the dial
instead of stacked above the heat row, and the subject id dropped from the
bottom bar since it was flavour you could not act on. The gamebar also hides
its patent citation under 820px, which was a whole extra row on a phone
(`flex-basis: 100%`), and the number is already on the title screen's
eyebrow. Play band on a 390x844 phone: 567px to 663px, up 17 per cent.

Watch for two things if you touch this again. `drawClock` is inside a
save/restore pair, so the narrow-screen caption skip has to be an `if`, not
an early return, or it leaks a canvas state every frame. And the heat bar's
left gap is measured off 'COOLING' now rather than sized by eye for 'HEAT':
at `L.hud` scale the longer word ran straight through the bar.

**The difficulty pass is the honest part.** Amy: "the game is too easy, way
too easy", and her screenshot proved it: the clock froze at 5.9s of a 6.8s
window, so 28 particles went in under a second off one held sweep. I changed
six constants at it, then measured, and it did not work.

Round 5, five bot trials each: old tuning cleared 5/5 in a mean 4.9s of a
6.8s window, 28 per cent spare. New tuning cleared 4/5 in a mean 3.9s of a
6.0s window, 35 per cent spare. That is not harder, it is very slightly
easier with a shorter clock.

Two things worth knowing before anyone repeats this. The bot is
latency-bound: every `evaluate` and `waitForTimeout` costs real milliseconds
while the game runs on, so it takes ~4s where Amy took 0.9s. It therefore
under-measures exactly the thing I was nerfing, the reach of a single
optimal sweep. And an earlier version of it was aiming 46px high all along,
because `parts()` returns canvas coordinates while `mouse.move` takes
viewport ones, and the canvas sits below the gamebar. It scored 50 to 70 per
cent under both tunings and looked like meaningful data. It was measuring
its own bug.

The constants that stayed are the ones defensible on their own: the scan
window shrinks with the round now (`max(5, 6.8 - (n-1)*0.2)`) instead of
growing from 6s to 8s, which meant the clock was getting kinder while the
count climbed. `BEAM_STRIP` is new and splits the two jobs the held beam was
doing at once, stripping and carrying, which is the actual exploit. Whether
it is enough against a skilled player is unproven.

The real answer is structural, not numeric: one gesture currently does
knock-loose and deliver-to-intake, so no constant makes it demanding, only
slower. Amy's own scanner idea, identify the item before you are allowed to
fire, is the shape of fix that would work.


---

**2026-08-28 landing cards say the name once, Claude (camera and particles)**

The Dust Off card said "Dust Off" twice, once in the theme banner and again
as the heading under it, which only became true when the banner replaced the
old thumbnail. The heading is gone from that card.

Lumen and Separator keep theirs, and that is not an oversight: their art is
a patent figure with no wordmark in it, so the heading is the only place
their name appears. The rule is whether the card's own art already says it.

All three now open with the patent number and its title as one prefacing
line, `US 9,134,205 B2: System and method for...`, which is what the number
eyebrow and the separate title line were saying between them. The number
takes the card's accent colour, the title stays dim. `.card .tag` is gone.

Dust Off's blurb is Amy's own line now, four sentences down to one:
"Radiofrequency particle separator, except up the frequency five million
fold because LASERS." Lumen's and Separator's are untouched, so those two
cards run a good deal longer. `.body` still has `flex: 1`, so the PLAY
buttons stay on one line across the row whatever the copy does.


---

**2026-08-28 play and restart screens are HTML now, Claude (camera and particles)**

Three things.

Lumen's survey map moved from top right to bottom left. It was sitting
exactly where you look: the device drives toward the sensor bearing, so you
are usually reading ahead and up the field, and a 124px map parked there
covers the thing you are steering at. Bottom left is the one corner nothing
else wants, since the anchor thumb is bottom right and the readouts run
along the top.

Every game's title, game over and win screen is HTML over the stage now
instead of a card drawn on the canvas, and they all carry the game's
wordmark. The shared stylesheet is `games/screen.css`, and the reason it
exists is that these screens can now use scifi-ui properly rather than
imitating it in 2D context calls: the cycling rim, the eyebrow/title/desc
type scale and `.holobtn` all come straight from `hologram.css`. Each game
lost its own `card()`, `drawTitle()`, `drawOver()` and the `wrapToWidth`
and `OVERLAY` helpers that only existed to serve them, which is around 220
lines of hand rolled canvas typography gone.

The palette on these screens is the branded cyan and violet rather than
each game's in-game accent, because all three wordmarks are cyan and
violet and a panel built around one wants to agree with it. Each game keeps
its own accent once you are actually playing.

**How the wiring works, because it is the part worth keeping.** Visibility
is pure CSS off `body[data-state]`, which every game already synced in its
frame loop, so the stylesheet needs no hook into game internals at all. The
buttons carry a `data-key` and dispatch that key as a real keydown, exactly
the trick the gamebar already used, so a screen never has to reach into the
game either. The only new JS per game is a `syncScreens()` that pushes the
run's numbers into the panel once as the state opens, called from the same
line that was already syncing `body.dataset.state`.

Two traps. An overlay covering the canvas swallows the pointerdown the
games used to start on, so anything that was click-to-continue needs a
button and a key: Separator's between-batch report had neither, and it now
takes Enter, which is a small win for keyboard players too. And Dust Off's
title screen carries the EM spectrum wave teaser Amy asked for, so that
canvas moved inside the panel rather than being dropped with the old
overlay; its ResizeObserver picks up the narrower box on its own.


---

**2026-08-28 all three wordmarks in, and the trick that makes cutouts safe, Claude (camera and particles)**

Separator has a wordmark now, and Dust Off's is replaced with the new one
that has a targeting reticle in the O. All three games' headers are images.

Both of these came in as RGB with the checkerboard baked in again, despite
being sent as "updated transparent images", so whatever exports them is
still flattening. Lumen remains the only one that arrived with real alpha.
Not a problem, the cutout is good, but the glow on these two is gone where
Lumen's survived, and that is the difference a real alpha export makes.

**The thing worth stealing from this entry.** Cutting a baked checkerboard
means removing near-white regions, and the danger is that the artwork is
full of near-white specular highlights that must stay. Filtering by area
alone is not enough: on the Dust Off image a highlight along the bottom of
the O ran to 1480px, larger than plenty of real letter counters, and
removing it punched a ragged black streak through the letter. Separator was
worse, four such highlights.

The discriminator is the fill ratio, area over bounding box area. Real
background regions are solid blobs and come in at 0.48 to 0.79. Specular
highlights are spidery, sprawling across a wide box while filling almost
none of it, 0.04 to 0.11. Nothing landed between 0.11 and 0.48 in either
image, so `area > 1200 && area / (w * h) >= 0.25` separated them cleanly and
with a lot of room to spare. Verify by compositing on magenta rather than on
the dark bar: a hole punched in a letter and a legitimately dark bit of
artwork look identical against near black, and obviously different against
something loud.

Dust Off's reticle survives because it is drawn in saturated cyan, not
white, so the desaturation test never had a claim on it. Checked by probing
a row straight through it: strokes read 0 to 120, the gaps between them
alternate 247/254, which is the checkerboard, so the O's counter really is
meant to be transparent with the reticle floating in it.

One sizing note. `.gamebar-logo` sizes by height, so what makes the three
wordmarks look the same size is not their pixel dimensions but the ratio of
image height to letter height. Lumen's art keeps its own glow and sits at
1.14. These two lost their glow to the threshold, so they are padded with
transparent margin to the same 1.14 rather than cropped tight, which would
have rendered their letters about 14% larger than Lumen's at the same CSS
height.


---

**2026-08-28 lumen has a wordmark too, and a note on exporting them, Claude (camera and particles)**

`games/lumen/logo.png` replaces the text `LUMEN` in Lumen's gamebar, same
treatment Dust Off got.

This one arrived with real alpha already, and the difference is worth
recording. Amy spotted it herself: the Dust Off image she sent was RGB with
the transparency checkerboard baked in as pixels, so I had to threshold the
background back out, and a threshold cannot tell a soft outer glow from a
light background. Lumen came with 600k partially transparent pixels, which
is the glow, and it survived intact because nothing had to be guessed at.
So: if a wordmark has a glow, it needs to arrive as real alpha. She is
sending an updated Dust Off export, and this one should be reprocessed off
that rather than kept as is.

Two things I would do again on any of these.

Cropping is not just the alpha bbox. Lumen's glow padding makes the full
bbox 3.04:1 while the letters themselves are 5.01:1, and Dust Off's letters
fill their frame at 4.67:1. `.gamebar-logo` sizes by height, so cropping
Lumen to its glow would have rendered its letters about a third smaller than
Dust Off's at the same CSS height. It is cropped to the letterforms (alpha
above 40) plus 7% of the letter height as margin, giving 4.51:1, near enough
that one height reads as one size across both games. The glow has faded to
alpha 1 by that boundary, so there is no hard cut.

Quantising costs you full opacity. `Image.quantize` on an RGBA image folds
alpha into the palette search and comes back with a maximum alpha of 252 to
254 rather than 255, so nothing is ever quite solid. That is what the
shipped Dust Off logo is doing (max alpha 254, harmless at that margin, but
wrong). The fix is to quantise the RGB only and put the untouched 8 bit
alpha channel back afterwards: 640px wide at 128 colours lands at 99KB with
all 256 alpha levels and a true 255 maximum.


---

**2026-08-28 one kind of particle, and a count that hands over to Danny, Claude (camera and particles)**

The five duller particle types are gone. There is one now, the red trace
compound, drawn as Amy's glowing specimen render. The halo fix from earlier
today made the small grey and tan motes findable, but findable is not the
same as legible, and the red one always read on its own. So they all are it.

What that took out, in case it is ever wanted back: the `TYPES` array had
per-type name, colour, pts, weight and size; `pickType()` drew from it by
weight; `newSubject()` had a `flagCount` deciding how many of a round's
particles were the red one, and shuffled the array afterwards so the red
ones were not all placed first. Points are per particle, so the one
remaining `pts` is now the entire scoring scale. It is 100, chosen so a
perfect ten round run lands at 41,400, near where the old mix put it and
comfortably inside the six digit score readout. Two knock-on fixes: the
capture burst dropped from 26 fragments to 16, because 26 was priced for a
particle that turned up three times a round rather than fifty, and
`audio.flagged()` (a square wave) no longer fires per capture, only on
clearing the whole subject, for the same reason.

The particle count is the headline readout now, a big numeral over a
caption, and when it reaches zero the same slot becomes the countdown to
the next item while Danny dances underneath. Reaching zero already ended
the round early, that part was not new, but the countdown to the next round
used to be 13px of dim text drawn straight over Danny's chest. Putting both
counts in one place means the eye never goes looking for what happens next.

Two layout notes. `bigCount()` takes the y of the numeral's cap top rather
than its baseline, so the block can be parked under whatever sits above it
without guessing at font metrics. And on desktop that anchor is
`clock.cy + r * 1.56 + 16`, not the dial's edge: `drawClock` puts its
'LONG NOW YEAR' caption a full `r * 0.56` below the dial, and anchoring to
the edge ran the numeral straight through it.

Also renamed the desktop panel's `FLAGGED LOST` to `ROUNDS MISSED`. Those
dots were always `misses`, which `settleRound()` counts per round left
uncleared and never per particle, so the old name was wrong before and
meaningless now.


---

**2026-08-28 wordmark, speaker, and housings that look where they are firing, Claude (camera and particles)**

Amy sent a Dust Off wordmark and asked for three things.

The wordmark is `games/dust-off/logo.png`, and it replaces the text
`DUST OFF` in the game's own gamebar. It arrived as RGB with the
transparency checkerboard baked in as pixels, same as the trophy did, so it
went through the same cutout: near-white desaturated threshold, then
`connectedComponentsWithStats` keeping only regions over 1500px. That
matters here because the letters are full of small white specular
highlights, and a plain threshold eats them; the three large regions it
does keep are the outside, the counter of the D and the counter of the O.
Then quantised to 192 colours, which takes it from 187KB to 47KB and is
invisible at the ~120px it actually renders at. Worth knowing: the
wordmark baked into `theme.jpg` is the same typeface, so the bar and the
title screen banner agree rather than showing two different logos.

The sound button is an icon now, a speaker that gains an × when muted. Two
things to know if you touch it. The muted state is the bare attribute
`data-off`, and the toggle adds and removes it rather than setting it to
`''`, because an empty value still matches `[data-off]` and would leave it
stuck looking muted, which is exactly what the old text version's
`b.dataset.off = ''` did without anyone noticing (it only ever read the
value's truthiness). And the icon now follows the `m` keydown rather than
the click, so the physical M key and the button can no longer disagree
about the state; the button's click dispatches that same key event, so one
listener covers both.

The four emitter housings angle down at the sample instead of staring
straight across the chamber. They rest pointed at the middle of whatever
object is on the floor, so a low sample gets a steeper angle than a tall
one, and they swing to follow the beam while you hold to fire, which keeps
the housing and the light it emits from disagreeing about where they are
going. The rotation goes on after the mirror, so in the sprite's own frame
the nose is always +x and a single angle covers both walls, which is what
the `* e.s` on the dx is doing. The aim tracks `pointer.down`, not
`pointer.inside`: inside latches true on the first touch and never clears
on a phone, so it would leave the housings staring at wherever the last tap
landed.


---

**2026-08-28 specks you can see, and Danny back on the floor, Claude (camera and particles)**

Two bugs Amy caught in one phone screenshot.

The particles were invisible on the object art. They are drawn at a fixed
pixel size, 1.8 to 3.6px radius, as flat filled circles, which was fine
against the near black chamber but not against the holographic renders,
which are full of white hot highlights: a 2.7px light blue lint mote on a
lit test tube is nothing. Two changes. Every speck now sits on a dark disc
with a faint rim of its own colour, the halo trick a map label uses to stay
readable over aerial photography, so it separates from a bright backdrop
without losing the colour that says which type it is. And `L.pScale` scales
the specks up, 1.55 on the narrow layout and 1.15 otherwise, because the
fixed pixel size is smallest exactly where the screen is.

Worth knowing for the loose ones: `drawLoose` renders with
`globalCompositeOperation = 'lighter'`, and an additive pass cannot darken
anything, so a halo drawn inside that loop does literally nothing. The dark
seats go down in a separate normal-blending pass first, then the glow pass
runs as before.

Danny was rendering a whole screen height below the floor, his feet about
150px off the bottom of a 773px canvas. This was fallout from widening his
orthographic camera a few commits back. `drawSubject` places the sprite by
its centre, and it assumed that centre was body-local zero, which was near
enough true when the frame was tight around him. Widening it to
`top: 4.7` for a model 1.7 tall made the frame mostly headroom and moved
its centre to local -158.85. `danny.js` already exposed `frame.cyLocal`
for precisely this and nothing was reading it. Now it does, and his soles
land on `L.floorY` exactly, checked at three viewport sizes.

If you touch `VIEW` in `danny.js` again, place the sprite off
`frame.cyLocal`, never off a hardcoded ratio. Checked all eight
celebrations at 390x844 afterwards: none clip the frustum and none leave
the chamber, the backflip included.

Unrelated and still open: the site has no favicon, so every first page
load logs a 404 for `/favicon.ico`. Harmless, but it is the one console
error on an otherwise clean load.


---

**2026-08-28 wrong thumbnail, Claude (camera and particles)**

Missed something obvious: when Amy sent Dust Off's own theme banner
("Theme image for Dust Off"), I wired it into the in-game title screen
and stopped there. She meant it for the landing page card too, the actual
"thumbnail" people see before ever opening the game, which was still my
own render of Danny mid-dance from a few rounds back. Swapped it in on
`index.html` and widened `.thumb`'s aspect ratio from 4:3 to 3:1 to match
the banner's own so nothing gets cropped (a centered 4:3 crop of it cuts
"Du" off "Dust Off" and loses the emitter on one side, checked before
committing to it). Deleted the now-unused `games/dust-off/thumb.png`
rather than leave a dead file behind.

Whenever an image comes in without saying exactly where it goes, check
every place a similar asset already lives, not just the most recent one
touched. "Thumbnail" specifically means the landing page card here, a
name already established from the first time this came up.


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
