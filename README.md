# dannys_birthday

Danny Hillis's patents, built as things you can play.

## Games

| | Patent | What it is |
|---|---|---|
| [Dust Off](games/dust-off/) | [US 9,134,205 B2](https://patents.google.com/patent/US9134205B2/en) | The airport puffer booth, with the air jets replaced by lasers. Ablate particles off a subject and steer them into the intake before they escape. |
| [Lumen](games/lumen/) | [US 7,857,767 B2](https://patents.google.com/patent/US7857767B2/en) | Drive the lumen traveling device through a branching vessel bed, find the plaque by sensor bearing, anchor against the flow and burn it out. |
| [Separator](games/separator/) | [US 9,480,991 B2](https://patents.google.com/patent/US9480991B2/en) | Tune a radiofrequency field to the grain size in a flowing slurry, float the ore to the skimmer and leave the rock in the tailings. |

Each game is one self contained HTML file plus the shared chrome. No build, no
dependencies, no CDN. Canvas 2D for the game, WebAudio for the blips.

They work on a phone as well as a laptop: under 900px the side panels become
bars over the play field, and the controls that needed a keyboard get a button
big enough for a thumb. Nothing on screen is smaller than 12px.

The page chrome and the landing page cards come from
[scifi-ui](https://amyleesterling.github.io/scifi-ui), vendored unmodified into
`vendor/scifi-ui/`.

## Running it locally

```
python -m http.server 8000
```

Then open `http://localhost:8000`.

## What these are, and are not

All three games take the arrangement of parts described in the patent claims and
turn it into something you operate. None of them simulates the physics the patents
rely on. Dust Off swaps the fluid jets for lasers deliberately, which is a change
to the invention and not a reading of it. Separator's frequencies are invented
numbers, but the relation they obey, skin depth falling with the square root of
frequency so a larger grain tunes lower, is taken from the patent.

Every claim in the copy about what a patent says was read off the patent text.
The full citation sits in a strip along the bottom of each game.

## Agents working here

See [BOARD.md](BOARD.md).
