# Milestones 0–1 implementation report

Prepared 7 November 2026. Scope: one complete playable Form chapter and the verified export foundation. No later chapter has been implemented or deployed.

## Functional

- Cinematic title screen with New Journey, conditional Continue, Presenter Mode, sound and motion controls.
- Forgotten Shrine with three portal anchors and three pedestal anchors. Form works; Division/Memory explain their Milestone 2 locks. The scholars’ stairway and lower seal explain their progression requirements.
- Hollow Scale encounter with 3/3 fictional HP, alternating telegraphed normal/heavy moves, Attack, Defend, a consumed guard advantage, battle history, defeat and retry.
- The exact six-input knowledge question. Incorrect answers give the approved hint and immediate retry without combat repetition.
- Diamond of Form reward/collection, saved victory and recovery checkpoints, shrine return, pedestal illumination, and Stonekeeper unlock.
- Restrained original English dialogue and a Reveal Knowledge transition into the light Research Codex.
- Two interactive Plotly histograms, defaulting to carat/depth. Both select any of the six features, switch original/standardized units, provide full-chart dialogs, hover/zoom/reset/export, and offer accessible bin-count tables. All chart series count the full 53,893 cleaned observations.
- Cleaning KPIs, feature summaries, standardization explanation, notebook download, JSON verification/provenance links, price-exclusion caveat, optional fictional lore, and return to shrine.
- Versioned localStorage, scene/progress restoration, confirmed story reset, invalid-save recovery, and an in-memory fallback if storage is unavailable.
- Independent Presenter Mode for all **implemented** scenes, instant boss resolution, Skip Animations, Show/Hide Narrative, and Return to Story. The story save stays unchanged.
- Original SVG illustration placeholders, the exact approved theme tokens, local Cinzel/Cormorant Garamond/Inter with licenses, system fallbacks, and muted-by-default original synthesized ambience.
- Static build and a manual GitHub Pages workflow; all runtime files use relative URLs. No required backend or external runtime asset dependency.

## Milestone 0 evidence

The original notebook, CSV, specification and grading PDF were inspected and retained unchanged in `reference/`. The exporter reproduces the notebook's selected baseline models and preprocessing; it does not change the methodology or rerun every parameter sweep.

| Baseline | Reproduced result |
| --- | --- |
| Records | 53,940 original; 47 removed; 53,893 clean |
| Features / scaling | carat, depth, table, x, y, z / StandardScaler |
| PCA variance | PC1 66.682508%; PC2 21.439554%; total 88.122061% |
| K-Means silhouette | Before 0.428807… → displayed 0.429; after 0.487157… → 0.487 |
| Original larger group | Raw 0; 22,800 records; median 1.11 ct and $6,055.50 |
| Original smaller group | Raw 1; 31,093 records; median 0.41 ct and $1,053 |
| DBSCAN before | 2 clusters; 804 noise; silhouette 0.485 |
| DBSCAN after | 1 cluster; 311 noise; silhouette 0.558 |
| Export validation | All 35 truth-lock checks passed |
| Repeatability | Two complete exports produced byte-identical copies of all five JSON files |

Raw K-Means IDs reverse their size meaning after PCA in the reproduced run. Exports map colors independently by median carat; this is ready for later scatter charts. Scatter sample: 1,804 unique positional rows, joint-label stratified with seed 42, separate from all population statistics. Source and exporter SHA-256 hashes are embedded; builds refuse changed sources until re-exported.

## Tests completed

**13 Node/Happy DOM tests passed.** They cover deterministic victory, reckless-attack defeat, retry, guard consumption, progression dependencies, idempotent placement, save/reload and malformed/future saves, histogram population totals, sample/semantic mapping, the full UI loop, wrong-answer hints, feature/scale controls, chart dialogs, reset confirmation/cancellation, data-load failure/retry, Presenter Mode save isolation, and late async completion after leaving Presenter Mode.

An accessibility DOM check confirms semantic buttons with names, named HP indicators, focus restoration after action re-rendering, and the reduced-motion setting. The page provides a skip link, live status announcements, labeled controls, native dialogs and accessible chart data tables. Palette contrast checks: Ivory on panel 13.78:1, Gold on kingdom background 7.90:1, Teal on panel 4.57:1, Codex text on Codex background 13.04:1. Garnet remains a danger accent; small warning text uses Ivory to avoid its lower contrast.

All JS modules passed `node --check`. The static build passed, with **33 relative asset/import references checked**, valid JSON and SVG XML, local font/Plotly files, `.nojekyll`, and no full CSV payload in the deployment artifact. Included source files retain the full input dataset for reproduction.

**Browser verification limit:** the attached managed environment (`ccarenv_b64_Y2NhcmVudl85YWQ2Nzk4YzJiYjQ4MTkxOTNiNGY2N2JkMGNjZTlhZQ`) reported remote desktop enabled with state `unknown`, but exposed no `cua_repl.js` or other shared-browser control tool. Following the Sites managed-preview instructions, no substitute browser or preview server was started. DOM tests use a chart-renderer stub and do not verify live Plotly, Web Audio playback, native dialog focus trapping, actual tab traversal, viewport layout, font rendering, or local HTTP behavior in a real browser. No screenshots or browser pass are claimed. Desktop 1920×1080, 1366×768, and mobile layouts are implemented in CSS and remain to be visually checked.

## Placeholder assets

All five original SVG files are placeholders: Forgotten Shrine background, Chamber of Form background, Hollow Scale character, Stonekeeper portrait, and Diamond of Form. The title currently reuses the shrine composition with a separate diamond overlay; it still needs its own final painted illustration. See `assets/README.md` for exact paths, dimensions, safe areas, and replacement instructions. Final painted artwork, music, voiceover and sound effects are not included. The original optional synthesized tones are functional ambience.

## Milestone 2

1. Extend the chapter/scene/state registries and shared encounter/reward/pedestal/dialogue components for Twin Warden → Divider and Veiled Mirror → Seer. Preserve Form and enable any-order completion of all three normal quests.
2. Add Division's original-6D K-Means projection and full-data median carat/price profiles. Render stable Gold/Blue semantic colors, with raw labels in tooltips. Keep price exclusion visible.
3. Add Memory's before/after comparison on the same PC1/PC2 axes, variance retained/lost chart, and silhouette bars with the different-feature-spaces caveat directly beside them. Label the 1,804-point scatter sample.
4. Update the HUD and unlock derivation for three returned stones **and** three viewed scholar revelations. Keep Exile/Archive unavailable until Milestone 3.
5. Test both new knowledge challenges, all six normal-chapter completion orders, save migration, repeat visits, color semantics, and truthful chart wording. Perform real-browser visual/keyboard/Plotly QA as soon as shared-browser controls are available, including the target desktop resolutions and mobile fallback.

Run locally by extracting the source package, entering `beyond-the-sparkle`, running `python -m http.server 8000`, and opening `http://localhost:8000`. No npm install or internet is required to play. `README.md` contains exporter, test, build, and future GitHub Pages steps.
