# Art and library inventory

All five SVG illustrations were created specifically for this prototype with original geometry in `scripts/create_placeholder_art.py`. They are **illustrated vector placeholders**, not final hand-painted production art. No game screenshots, borrowed character designs, stock scene images, or historical diamond imagery are used.

## Exact final artwork still needed for Milestone 1

- [ ] **Main title illustration**: a separate painterly title composition, dark left-side text safe area and right-side symbolic diamond. The prototype currently reuses `scenes/forgotten-shrine.svg` with a title overlay; create `scenes/title.webp` and update `.landing-art` when ready.
- [ ] **Forgotten Shrine**: replace `scenes/forgotten-shrine.svg` with a final 1600×1000-safe illustration; preserve three portals near x 24/50/76% and three separated foreground pedestal anchors. The CSS has responsive anchor positions; review them when swapping art.
- [ ] **Chamber of Form**: replace `scenes/chamber-of-form.svg` with a final chamber illustration, keeping guardian space left and readable combat panel space right.
- [ ] **The Hollow Scale**: replace `characters/hollow-scale.svg` with an original transparent character illustration retaining the balancing-scale motif, empty hood, and upright silhouette. Maintain the 800×800 composition or tune `.boss-illustration`.
- [ ] **The Stonekeeper**: replace `characters/stonekeeper.svg` with a final transparent illustrated cameo (400×400 composition).
- [ ] **Diamond of Form**: replace `diamonds/form.svg` with a polished original reward illustration/icon. The existing geometric diamond is also the favicon and can remain as a small icon if desired.

WebP/PNG replacements require updating CSS or the corresponding `<img>` source in `js/scenes.js`. Keep filenames stable for later replacement. All scenes remain functional with the SVG set. Use restrained gold/teal and the exact tokens in `css/theme.css`. Dark kingdom / light research contrast is intentional. Future locations/characters/rewards are not represented by fabricated finished assets in this delivery.

## Local fonts and library licenses

- `fonts/Cinzel.ttf`, `fonts/CormorantGaramond.ttf`, `fonts/Inter.ttf`: obtained from the Google Fonts repository; accompanying `*-OFL.txt` files contain the SIL Open Font License. Local system fallbacks are configured.
- `vendor/plotly-basic-2.35.2.min.js`: original Plotly CDN distribution, MIT-licensed; `Plotly-LICENSE.txt` is included. Basic supports the required histogram bars; later DBSCAN/K-Means plots can use its standard scatter traces. Any move to WebGL would require a matching Plotly bundle.
- `js/audio.js`: original two-tone synthesized ambience, muted by default. There is no final score, character voiceover, or battle sound effect track; these are optional future polish.

All visual resources and fonts load locally. There are no remote scene, font, or chart dependencies at runtime.
