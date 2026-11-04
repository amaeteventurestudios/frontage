# Credits

Frontage is open source under the MIT licence (see `LICENSE`). It is built on other people's work, listed here with where each piece came from and the terms it is used under. Every site keeps its own credits in its footer as well.

## Design skill

**Hallmark**, the design skill that chose and checked every page here.
- Source: https://github.com/Nutlope/hallmark (made by Together AI)
- Licence: MIT, copyright (c) 2026 Hallmark contributors
- Used for: each site's theme, page shape, the `tokens.css` and `base.css` its scaffold writes, and the `sloplint` checks. Each site's stylesheet opens with the Hallmark stamp that records its picks.
- Frontage is an independent project. It is not made or endorsed by Hallmark or Together AI.

The Hallmark licence notice, as its terms require for copied portions:

> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

## Code

**three.js** r160, vendored in `vendor/three/`.
- Source: https://github.com/mrdoob/three.js
- Licence: MIT, copyright (c) 2010-2023 three.js authors (full text in `vendor/three/LICENSE`)

**GSAP** 3.15.1 with ScrollTrigger, SplitText, DrawSVGPlugin and CustomEase, vendored in `vendor/gsap/` (unchanged minified builds from the `gsap` npm package).
- Source: https://gsap.com and https://github.com/greensock/GSAP
- Licence: GreenSock standard no-charge licence, commercial use included: https://gsap.com/standard-license. Not covered by Frontage's MIT licence.
- Approach: the official GSAP agent skills (MIT), https://github.com/greensock/gsap-skills, and the Animate skill's timing rules, https://github.com/delphi-ai/animate-skill

## Fonts

Loaded from Google Fonts, all under the SIL Open Font License 1.1.
- **Instrument Serif** and **Instrument Sans** (the Frontage shell): https://fonts.google.com/specimen/Instrument+Serif, https://fonts.google.com/specimen/Instrument+Sans
- Each site's own faces are listed in its section below.

## Photographs

Stand-in photographs come from Hallmark's photo library, which draws only on Wikimedia Commons files that are CC0, public domain, CC BY or CC BY-SA. Each one is credited below and in its site's footer with the author, the licence and a link to its page. Files re-uploaded from stock sites are never used.

## Per site

Filled in as each site is built: its fonts, its photographs (author, licence, link) and anything else it borrows.

### 1. Harmattan Orbital
- Fonts: Chakra Petch, IBM Plex Sans, IBM Plex Mono (SIL OFL 1.1, Google Fonts).
- Photograph: Namib-Naukluft sand dunes by Yathin S Krishnappa, CC BY-SA 3.0, https://commons.wikimedia.org/wiki/File:Namib-Naukluft_Sand_Dunes_(2011).jpg
- Photograph: a person under the Milky Way during the Perseids by Giles Laurent, CC BY-SA 4.0, https://commons.wikimedia.org/wiki/File:018_Human_looking_at_the_stars_during_Perseids_with_the_Milky_Way_in_the_background_Photo_by_Giles_Laurent.jpg
- Code: three.js r160 (MIT) for the globe. The orbit is a two-body propagation with J2 drift written for the page.

### 2. Silica Coast
- Fonts: Funnel Display, Funnel Sans (SIL OFL 1.1, Google Fonts).

### 17. Rig and Bone
- Fonts: Bowlby One SC, Sofia Sans (SIL OFL 1.1, Google Fonts). Blender is named as the tool taught; Frontage is not affiliated with the Blender Foundation.

### 21. Squeeze Drum
- Fonts: Ultra, Chivo (SIL OFL 1.1, Google Fonts). The sound is synthesised with the Web Audio API; no samples are used.

### 28. Circle
- Fonts: General Sans by the Indian Type Foundry, ITF Free Font License, from Fontshare (https://www.fontshare.com/fonts/general-sans); Geist Mono (SIL OFL 1.1, Google Fonts).
- Textures: cotton.svg and felt.svg are generated SVG noise written for the page.

<!-- sites -->
