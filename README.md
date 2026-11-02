# Frontage

**Thirty websites, one skill.** Thirty sites for invented brands, from satellite ground stations, chip foundries and AI firewalls to a talking-drum synth, a flipbook studio and a savings circle. Every page was designed with the [Hallmark](https://github.com/Nutlope/hallmark) design skill, and all thirty run live in one browser tab with one left-hand pane.

- 15 deep tech sites, 10 creative sites and 5 in formats nobody expects from a landing-page skill.
- Each site has its own Hallmark theme and page shape, and a signature moment you can touch.
- Every brand is invented. No metric, quote or logo on any page is made up.

## Run it

Serve the repo root and open it:

```
python3 -m http.server 8800
```

Then go to `http://localhost:8800/`. Pick a site in the pane, or open one on its own at `/<slug>/`, for example `/harmattan-orbital/`.

## Layout

- `index.html`, `shell.css`, `shell.js`: the pane, the stage, the device frames and the picks drawer.
- `catalog.js`: all thirty sites by group. Start here to add one.
- `<slug>/`: one folder per site, each a standalone page.
- `vendor/three/`: three.js, vendored.

## Open source

MIT licensed (see `LICENSE`). Everything borrowed, from Hallmark to fonts and photographs, is listed with its source and licence in [`CREDITS.md`](CREDITS.md).
