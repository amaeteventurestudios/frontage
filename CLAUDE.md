# Frontage: working notes for Claude Code

Frontage is thirty websites for invented brands, each designed with the Hallmark skill, shown in one shell with a left pane (like Afrorama). The plan is in the doc "Hallmark Thirty: 30 showcase sites"; `catalog.js` holds the list.

## The recipe (Amaete's own mix, set 2 November 2026)
Hallmark is one ingredient, not the whole method. Every site combines:
- **Hallmark** (anthropic-skills:hallmark): the floor, the dealt theme and shape, sloplint and the reviewer pass.
- **Tasteskill** (anthropic-skills:design-taste-frontend): art direction and its screenshot look-and-fix loop.
- **Hairline** (anthropic-skills:hairline-create / hairline-adopt): isometric line figures that answer the pointer.
- **Three.js**: procedural 3D in the spirit of Afrorama and Cutaways (terrain, water, exploded parts, X-ray).
- **Dataviz** (dataviz skill): honest charts on the deep tech pages.
Where they disagree, Hallmark's floor wins. Record the ingredients used in the site's `picks.made` in `catalog.js`.

## Conventions
- Static site, no build step, deployed by Vercel from `main` (frontage.amaete.com, not set up yet).
- One folder per site: `<slug>/index.html` plus its own `tokens.css`, `base.css` and stylesheet from the Hallmark scaffold. Set `live: true` and `picks` in `catalog.js` once the site passes its sweep.
- Build every site with the Hallmark skill. The floor is not waivable: no invented metrics, quotes or logos; tokens for every colour and font; `:focus-visible` everywhere; reduced-motion fallbacks.
- Deep tech pages prove themselves with things computed in the page (orbits, physics, simulations). Sample data is labelled as sample.
- Three.js r160 is vendored in `vendor/three/`; import maps point at `../vendor/three/...`. Never load it from a CDN. 3D is procedural: no model files.
- Brands are invented. Real place names from across Africa are fine. No real companies, people or logos, and no Umanah Systems Group company names.
- Open source: every borrowed font, photograph and library goes in `CREDITS.md` and the site's footer, with source and licence.
- The shell itself follows the Hallmark floor: no tracked capitals, no eyebrows, no middle-dot meta strings.

## Alignment (Amaete's rule, 2 November 2026)
Every page must look symmetrical and deliberate at every size, from a 32 inch monitor (2560 wide) down to a 360 wide phone. Never leave everything left-aligned on a phone by default.
- Centre, once the layout stacks (60rem and below): the hero's headline, sentence and actions; each section's intro (heading plus its one line); short standalone cards (a number or icon, a title, one line); closing bands and their actions; footer wordmarks, statements and sign-offs; icon rows and button groups that sit under a centred heading.
- Keep left-aligned: running text longer than about three lines, forms and their labels, tables, FAQ rows, lists of rows, code, and anything read down a column.
- A group is aligned as one: if the heading is centred, its sentence, buttons and icons are centred too. Never a centred heading over a left-aligned paragraph.
- Desktop keeps the theme's composition, but spacing must mirror: equal gutters, the visual's centre level with the text block's, no lopsided empty bands.
- Big screens: at 2200px and wider each page scales up with `zoom` (1.2, then 1.33 at 2500px) so a 32 inch screen shows the 1920 layout larger, not a small island in a sea of background. Canvases multiply their pixel ratio by that zoom.
- Check alignment at 2560x1440, 1920x1080, 1440x900, 1280x800, 1194x834, 834x1194, 390x844 and 360x780 before a site goes live.

## Testing
Serve the root (`python3 -m http.server 8800`) and screenshot with Playwright at 1440x900, 1280x800 and 390x844. No console errors. Run Hallmark's `sloplint --render` on each site before it goes live.
