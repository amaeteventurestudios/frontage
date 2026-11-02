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

## Testing
Serve the root (`python3 -m http.server 8800`) and screenshot with Playwright at 1440x900, 1280x800 and 390x844. No console errors. Run Hallmark's `sloplint --render` on each site before it goes live.
