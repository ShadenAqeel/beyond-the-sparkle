# Beyond the Sparkle: The Lost Legacy
## Final Codex Implementation Specification (v2.0)

**Project type:** Browser-based interactive, cinematic academic presentation  
**Language:** English only (interface, dialogue, captions, charts, and lore)  
**Visual style:** Original hand-painted / cinematic 2D illustrated dark-fantasy environments and characters  
**Interaction:** Point-and-click exploration; reusable light combat (Attack, Defend, one knowledge question)  
**Target:** Desktop-first; a complete live demonstration in approximately 6–8 minutes  
**Primary deliverable:** Playable static website for GitHub Pages  
**Secondary integration:** A separately built Streamlit dashboard may reuse the same light research theme and source data.

## 1. Mission and design principles

Build an original dark-fantasy mystery in which a traveler visits an abandoned sanctuary to recover three symbolic diamonds from three guardians. Returning each diamond to its pedestal frees a scholar who explains a genuine discovery from the diamond clustering/PCA notebook. Restoring all three stones unlocks a secret guardian and the fourth, largest **Eclipse Diamond**. This unlocks the Hidden Archive and an old scholar who reveals that the guardians were protecting fragmented knowledge, not stealing gemstones. The ending unites the evidence and answers the project's research question.

The experience must feel like **a playable story first and a rigorous scientific presentation second**, without losing scientific accuracy. Its visual atmosphere may evoke classic Soulslike games but must use **original artwork, names, locations, audio, and UI**; do not copy Dark Souls assets or distinctive copyrighted character designs. The Florentine Diamond disappearance/reappearance is **structural inspiration for a mystery and reveal**, not a claim that our CSV contains the historical stone or evidence about it. Do not imply the fictional lore is historical fact.

**Non-negotiable design rules:**
- Keep the game 2D, illustrated, point-and-click. No free-roaming 3D world, physics system, or full real-time action engine.
- Make every major encounter correspond to actual notebook findings.
- Three quest diamonds are **three story chapters**, not three statistical clusters; K-Means finds **two** groups.
- The fourth Eclipse Diamond is a **symbolic narrative reward**, not a measured largest diamond in the dataset.
- Keep lore concise; put optional detail in expandable Research Codex entries.
- Prioritize a fully working playthrough over decorative animation.

## 2. Authoritative project inputs

Place the following materials in `/reference/` or clearly document their actual paths:
- `project_PCA_1_(2).ipynb` — authoritative notebook containing analysis code and saved results.
- `diamonds 2.csv` — the original dataset; do not replace it with invented diamond data.
- `Mini Project Evaluating Clustering Before and After PCA.pdf` — grading requirements.
- Approved storyboard/illustration references and dashboard mockups, if available. **Mockup statistics are illustrative, not authoritative.**

If a file is unavailable, build the website shell with a clear placeholder and documented replacement step, but **do not fabricate analytical values**. The existing notebook output values below may serve as initial reference and must be verified by the exporter.

### Verified notebook findings

| Metric | Notebook result |
|---|---:|
| Original observations | 53,940 |
| Removed invalid/inconsistent dimension records | 47 |
| Clean observations | 53,893 |
| Clustering inputs | `carat`, `depth`, `table`, `x`, `y`, `z` |
| Inputs excluded from clustering | `price`, `cut`, `color`, `clarity` |
| Scaling | `StandardScaler` |
| K-Means `n_clusters` | 2 |
| PCA components | 2 |
| PCA explained variance ratio | PC1 66.682508%, PC2 21.439554% |
| Total PCA variance retained | 88.122061%, display as 88.12% |
| K-Means silhouette, original 6D space | 0.429 |
| K-Means silhouette, PCA 2D space | 0.487 |
| **Before-PCA Cluster 0** | Larger group: median **1.11 ct**, median **$6,055.50** |
| **Before-PCA Cluster 1** | Smaller group: median **0.41 ct**, median **$1,053** |
| DBSCAN, original 6D space (`eps=0.5`, `min_samples=10`) | 2 clusters, 804 noise observations, silhouette 0.485 |
| DBSCAN, PCA 2D (`eps=0.3`, `min_samples=10`) | 1 cluster, 311 noise observations, silhouette 0.558 |

**Analysis rules:**
- Replicate the notebook's preprocessing, including excluding nonpositive `x`, `y`, `z`, and excluding rows where calculated depth percentage differs from `depth` by more than 5: `calculated_depth = 200*z/(x+y)`.
- Remove the `Unnamed: 0` index column.
- Set reproducibility settings consistent with the notebook: K-Means `random_state=42, n_init=10`; sample-size-3000 silhouette calculations with `random_state=42`.
- For dashboard plots, show original-feature K-Means labels on the same PC1/PC2 axes as after-PCA K-Means labels. The first chart's labels come from 6D clustering; its coordinates are a 2D projection for visualization.
- Cluster labels are arbitrary identifiers. Preserve **semantic** group identity using median carat, and do not assume that after-PCA `label=0` necessarily means the same thing as before-PCA `label=0`. Align the display colors and friendly group names accordingly, while keeping raw labels accessible.
- Silhouette scores computed in different spaces are **not a controlled apples-to-apples evaluation**. Present 0.429 and 0.487 with a note: “The 2D score is higher, but the scores are measured in different feature spaces and do not establish an overall improvement.” Do **not** put a “+13.5% performance improvement” callout on this chart.
- DBSCAN noise label `-1` denotes points outside identified dense clusters, **not defective diamonds**. Its silhouette calculation includes the noise label as a group; 0.558 does not mean DBSCAN found a more meaningful set of diamond types.
- Neither model established diamond quality grades or causality for price. We may describe the group price differences as associations observed **after clustering**; do not claim cut, color, clarity, or price were features used to form clusters.
- Do not add metrics, clusters, quality claims, or actual historic diamond details that are absent from the notebook.

## 3. Narrative locations and scene-to-analysis mapping

### Prologue: The Forgotten Shrine
**Visual:** An atmospheric ruined circular stone sanctuary, dim lanterns, three empty pedestals, a locked lower stairway, and an enigmatic doorway that is initially sealed. **Interaction:** Clickable pedestal slots, a map/portal menu to three boss areas, a journal/inventory icon, and a staircase to the scholars' lower chambers. **Opening hook:** “Three stones were entrusted to three guardians. For ages, the kingdom believed them stolen. Return them to the shrine, and discover why the scholars still wait below.” Keep under ~75 spoken words.

### Boss I: The Hollow Scale — Chamber of Form
- **Scene:** Stone statues, rulers, a balancing scale, worn inscriptions.
- **Reward:** **Diamond of Form**.
- **NPC freed after pedestal return:** **The Stonekeeper**.
- **Research revelation:** 53,940 records; 47 removed as inconsistent/invalid physical measurements; six numerical inputs; standardization before distance-based clustering.
- **Knowledge question:** “Which set of characteristics formed our clustering inputs?” Correct: **carat, depth, table, x, y, z**. Wrong option examples: “price, cut, color, clarity” / “price and color only”. Hint: “We examined physical form, not market price or quality grades.”

### Boss II: The Twin Warden — Hall of Division
- **Scene:** Two armored mirrored guardians, one compact and one towering, divided by a stone line.
- **Reward:** **Diamond of Division**.
- **NPC freed:** **The Divider**.
- **Research revelation:** K-Means in original six-dimensional standardized space; two groups; cluster 0 is larger (median 1.11 ct, $6,055.50) and cluster 1 smaller (median 0.41 ct, $1,053); price was *not* an input.
- **Knowledge question:** “How many broad groups did K-Means identify?” Correct: **2**. Hint: “The two wardens mirror the two groups.”

### Boss III: The Veiled Mirror — Hall of Reflections
- **Scene:** Broken mirrors, a hovering prism, fragmented reflections of six measurements resolving into two beams.
- **Reward:** **Diamond of Memory**.
- **NPC freed:** **The Seer**.
- **Research revelation:** PCA reduces six standardized physical features to PC1 and PC2 and retains **88.12%** variance; 11.88% is not retained; before/after K-Means silhouette **0.429 / 0.487**, with fair interpretation caveat.
- **Knowledge question:** “How much variance do the first two principal components retain?” Correct: **88.12%**. Hint: “Most, but not all, of the original information survives.”

### Secret Boss: The Nameless Exile — Chamber Beneath the Shrine
- Unlock **only** when the three regular diamonds have been returned and the related NPC revelations have been viewed (make both conditions clear in the HUD).
- **Scene:** Underground crypt, fragmented stones, pale teal fog, a solitary armored exile.
- **Reward:** **Eclipse Diamond** (largest *fictional* symbolic stone).
- **Research revelation:** DBSCAN before PCA: two clusters and 804 noise points; after PCA: one dense cluster and 311 noise points. Density/noise is a different perspective from K-Means. Avoid presenting “one cluster + noise” as four groups or as evidence of defects.
- **Knowledge question:** “What does DBSCAN's `-1` label mean?” Correct: **Noise relative to the chosen density settings**. Hint: “It does not certify that a diamond is defective.”

### Finale: The Hidden Archive — The Old Scholar
- Only unlock after obtaining the Eclipse Diamond. Present a large illustrated library/cathedral archive, weathered manuscripts, and the elderly surviving scholar.
- **Truth:** The guardians did not steal the stones; the ancient order concealed fragments of knowledge to prevent partial findings from being mistaken for the complete truth. The NPCs were bound to their incomplete interpretations until all evidence was brought together.
- **Final reveal:** Four diamond symbols resolve into the real 2D PCA scatter, followed by three concise cards:
  1. **Simplification:** 6 physical features → 2 PCs, retaining 88.12% of variance.
  2. **Meaningful groups:** Two size-based K-Means groups have different median prices, even though price was excluded from modeling.
  3. **Measured conclusion:** PCA enables clearer 2D visualization; a higher 2D silhouette score is not by itself proof of a better model. DBSCAN gives a density/noise perspective rather than better-established diamond quality.
- **Final line (original fictional dialogue):** “We searched the stones for answers. But what we failed to see were the patterns connecting them.”
- End with **The Legacy Restored**, then offer **Explore the Research**, **Replay Story**, and **See Notebook** actions. Links must point to existing project resources; if external URLs are unknown, use clearly labeled local placeholders rather than invented links.

### Dialogue tone
- All dialogue in English, short, atmospheric, and comprehensible.
- Lore voice: ancient, restrained, mysterious; no copied Dark Souls dialogue.
- Research explanations: plain language, factual, no theatrical exaggeration of numbers.
- Approximate limit: 2–4 short lines per NPC reveal before the expandable Research Codex.

## 4. Concrete interaction design

### Navigation
- Landing screen: **New Journey**, **Continue** (only when a save exists), **Presenter Mode**, settings for sound/motion.
- Hub: six major clickable anchors (three regular portals, three pedestals), stairs to scholars, fourth locked portal, journal/inventory, accessible location title.
- Boss chamber: **Attack**, **Defend**, HP bars, a small battle text log, **Back to Shrine** after completion.
- Research Codex: progress tabs **Form**, **Division**, **Memory**, **Exile**, **The Truth**; locked tabs explain requirements.
- No WASD movement or 3D camera.

### Lightweight combat (reusable for all four bosses)
- Boss HP: **3**; player HP: **3**. These are fictional gameplay values, not dataset metrics.
- Each boss uses a short **scripted repeating two-move pattern** with a readable telegraph: normal attack (1 HP damage) and heavy attack (2 HP damage).
- **Attack:** deal 1 HP damage to the boss and receive the telegraphed attack damage that turn.
- **Defend:** block the telegraphed attack; boss HP unchanged; on the next Attack, the player's guard advantage blocks up to 1 damage. Guard advantage is consumed by Attack. This creates a small tactical choice without timing/physics complexity.
- Boss reaches zero HP → pause combat, ask the chapter's one multiple-choice research question. Correct answer → win; incorrect answer → show hint and allow retry immediately. Never require a complete combat replay for a wrong knowledge answer.
- If player HP reaches zero, offer **Retry Encounter** restoring battle HP, without deleting saved progress.
- Normal battles should be finishable in ~20–40 seconds. Animations must not block controls.
- Accessibility: every action is a proper keyboard-operable button; no rapid clicking required.

### Progress state
Use a single versioned object in `localStorage`. Suggested shape:

```json
{
  "version": 1,
  "mode": "story",
  "defeated": {"form": false, "division": false, "memory": false, "exile": false},
  "diamondsCollected": {"form": false, "division": false, "memory": false, "eclipse": false},
  "diamondsReturned": {"form": false, "division": false, "memory": false},
  "npcInsightsViewed": {"stonekeeper": false, "divider": false, "seer": false, "exile": false},
  "secretBossUnlocked": false,
  "archiveUnlocked": false,
  "endingCompleted": false,
  "audioMuted": true
}
```

- The first three bosses can be completed **in any order**.
- Regular diamond return action consumes/marks the diamond as placed, lights its pedestal, and frees the corresponding NPC.
- Secret boss unlock condition: all three pedestal returns **and** all three scholar research revelations viewed. Update this flag consistently rather than trusting a standalone saved Boolean.
- Archive unlock condition: secret boss defeated and Eclipse Diamond collected.
- Never let normal story-mode navigation bypass locks; clearly communicate the unlock requirements.
- **New Journey** clears story save after a confirmation. **Continue** restores the last available scene/progress.
- **Presenter Mode** is an independent non-destructive state: allows jumping to any scene, instant boss resolution, replaying NPC dialogue, and revealing all charts without mutating normal story progress. Include a visible **Return to Story** option.

## 5. Story UX and research charts

- Use an illustrated full-viewport scene with a cinematic, readable interface overlay; content must work at 1920×1080 and 1366×768 and degrade gracefully on mobile.
- Maintain a subtle top HUD showing **0/3**, **1/3**, etc. recovered shrine diamonds and current quest objective; show Eclipse separately after it unlocks.
- Clicking an NPC opens a dark illustrated dialogue panel. Selecting **Reveal Knowledge** transitions to the light Research Codex. This dark-to-light change is a signature moment.
- Codex can reveal content in sequence or via accessible tabs once unlocked; large charts should open in a responsive modal or full card.
- Primary required charts:
  1. Original-feature data exploration: carat/depth distributions and basic physical feature summary.
  2. K-Means before PCA: PC1/PC2 projection colored by **original 6D K-Means labels**.
  3. K-Means after PCA: PC1/PC2 projection colored by **2D K-Means labels**.
  4. PCA variance retained: PC1, PC2, total, and information not captured.
  5. Before/after silhouette bar comparison with the different-spaces note directly visible.
  6. Median carat and median price for the original 6D K-Means groups.
  7. DBSCAN before/after projected scatter with noise `-1` distinguishable from actual clusters.
  8. Final concise scientific takeaway; no unsupported price causation or quality claims.
- On all cluster plots, **group identity and semantic color must be stable even if numeric K-Means label IDs change**. Keep raw algorithm IDs in tooltips if needed.
- Do not attempt to display all 53,893 dots if performance suffers: export a **reproducible, stratified sample** for scatter visualization. All quantitative KPIs and group statistics must be computed from the entire cleaned dataset. Label the scatter as a visualization sample.

## 6. Fixed color palettes and uses

### Kingdom (dark game scenes)
| Token | Hex | Usage |
|---|---|---|
| `--kingdom-bg` | `#101519` | Fullscreen backdrops; dim overlays |
| `--kingdom-panel` | `#1B2328` | Dialogues, inventory, menus |
| `--kingdom-stone` | `#2C3337` | Secondary panel surfaces, ruins |
| `--gold` | `#C6A574` | Sacred diamonds, active links, quest highlights |
| `--ivory` | `#F2EEE7` | Headings and dialogue |
| `--teal` | `#738F89` | Ancient knowledge, spell glow, research transitions |
| `--garnet` | `#A56E75` | Boss danger, damage, warnings |

### Research Codex and future Streamlit theme
| Token | Hex | Usage |
|---|---|---|
| `--codex-bg` | `#F7F4EE` | Page backgrounds |
| `--card-bg` | `#FFFFFF` | KPI, table, charts |
| `--text` | `#252B30` | Main headings and chart text |
| `--gold` | `#C6A574` | Highlights, active filters |
| `--blue` | `#82B5C6` | Smaller-diamond group |
| `--jade` | `#8DAE9B` | Density-based supporting group |
| `--garnet` | `#A56E75` | DBSCAN noise / caveats |
| `--gridline` | `#E6E2DB` | Dividers and plot gridlines |

**Cluster color semantic mapping:**
- **Larger diamonds (before-PCA raw Cluster 0): Antique Gold `#C6A574`.**
- **Smaller diamonds (before-PCA raw Cluster 1): Diamond Blue `#82B5C6`.**
- **DBSCAN dense/main group: Soft Jade `#8DAE9B`.**
- **DBSCAN noise (`-1`): Muted Garnet `#A56E75`.**
- Align after-PCA K-Means labels by median-carat semantics; do not blindly use label IDs.
- Dark charts may use the same data hues against panel charcoal with light plot labels, but the **primary Research Codex should be light** for clarity.
- Keep backgrounds relatively flat and matte; subtle gold only. No neon, excessive glass blur, heavy gradients, or fake 3D.
- Typography: **Cinzel** for game headings, **Cormorant Garamond** for lore, **Inter** for navigation and charts; provide tasteful local/system font fallbacks and do not redistribute unauthorized font files.
- For future Streamlit parity, centralize tokens in `css/theme.css` and optionally a `design-tokens.json` file.

## 7. Illustration and animation specification

**Target art:** original painterly 2D fantasy concept art, ruined stone architecture, sparse light rays and mist, antique gold or cool teal focal points. Avoid photoreal UI chrome and copied in-game screenshots.

Required art slots:
1. Main title/landing artwork.
2. Shrine background with visibly separate clickable anchors.
3. Chamber of Form, Hall of Division, Hall of Reflections.
4. Crypt/secret boss chamber and Hidden Archive.
5. Four boss portraits/full-body illustrations.
6. Three NPC portraits plus the old scholar.
7. Three regular diamond reward icons plus one larger Eclipse Diamond.

Prefer optimized WebP/PNG scene art, separate transparent character layers, and SVG icons. Design a reusable 16:9 safe composition; keep interactable areas away from text. Use CSS-only slow fades, lightweight parallax (optional), pedestal light changes, and short reward sequences. Respect `prefers-reduced-motion`. Do not rely on background videos or third-party audio. If original assets are not available at implementation time, create cohesive CSS/SVG placeholders with clear swap-in filenames; **do not stall functionality**.

## 8. Technical architecture

- **Frontend:** semantic HTML, modular vanilla JS (ES modules), responsive CSS, Plotly.js for interactive scientific charts.
- **Data workflow:** a Python exporter (`scripts/export_notebook_data.py`) loads the dataset using the notebook's exact pipeline and writes versioned JSON (summary, profiles, chart series, sampled PCA points). The website loads these files; the browser does not train sklearn models.
- **Hosting:** GitHub Pages. Relative links/assets; no required server-side runtime.
- **Offline demo:** serve locally with `python -m http.server 8000`; ideally vendor the necessary Plotly library rather than depending exclusively on a CDN.
- **State:** versioned localStorage for story progress; separate nonpersistent Presenter Mode preview state.
- **Responsive:** desktop-first; visible focus states, `aria-live` for battle and progress updates, contrast-checked text, large click targets, motion and audio toggles.
- **Performance:** lazy-load nonessential art/chart bundles when entering a scene; use lightweight chart samples.
- **Code quality:** no single giant script. Clear scene registry, state reducer/actions, combat engine, dialogue data, chart renderer and data validation.

Suggested repository structure:

```text
beyond-the-sparkle/
├── index.html
├── css/
│   ├── theme.css
│   ├── layout.css
│   └── animations.css
├── js/
│   ├── main.js
│   ├── state.js
│   ├── scenes.js
│   ├── combat.js
│   ├── dialogue.js
│   ├── codex.js
│   ├── charts.js
│   └── data.js
├── data/
│   ├── summary.json
│   ├── cluster_profiles.json
│   ├── charts.json
│   └── pca_sample.json
├── assets/
│   ├── scenes/
│   ├── characters/
│   ├── diamonds/
│   ├── icons/
│   └── audio/               # only original/licensed optional audio
├── scripts/
│   └── export_notebook_data.py
├── reference/              # input data/notebook for exporter; optional in public deploy
├── README.md
└── tests/                   # smoke tests/validation if available
```

### Data export safeguards
- Compute summary values from full clean dataset, not from the scatter sample.
- Preserve positional row alignment between `df_clean`, transformed PCA coordinates and before/after label arrays. The notebook's `df_clean` has original row indices while `X_pca` may have a new RangeIndex; use `to_numpy()` and positional assignment when exporting to avoid wrong cluster labels.
- Include a metadata field documenting feature order, PCA components, cleaning counts, K-Means params, and silhouette sample settings.
- Check that the profile medians, counts and noise totals reproduce the notebook's saved outputs; fail loudly if an input or export is inconsistent.
- Keep data files public-safe, free of personal information, and avoid unnecessary full CSV payload in deployed site.

## 9. Presenter Mode and presentation flow

**Presenter Mode rules:**
- A visible button activates it from title or in-game menu.
- Presenter can select any location regardless of progression, complete boss instantly, reopen all research pages, and replay the finale.
- All presenter navigation is non-destructive to the player's saved Story Mode progress.
- Provide **Skip Animation**, **Show/Hide Narrative**, and **Open Full Chart** options.
- Ensure every reveal is comprehensible without sound and works on a projector.

**Suggested 6–8-minute run-of-show:**
1. **0:00–0:45:** Landing, Forgotten Shrine, mission and mystery.
2. **0:45–1:30:** Hollow Scale → Stonekeeper (dataset and cleaning).
3. **1:30–2:30:** Twin Warden → Divider (K-Means groups and price profiles).
4. **2:30–3:45:** Veiled Mirror → Seer (PCA, 88.12% retained, careful silhouette reading).
5. **3:45–4:30:** Secret boss → DBSCAN/noise discovery.
6. **4:30–5:45:** Hidden Archive plot twist and integrated scientific conclusion.
7. **5:45–7:00:** Optional chart exploration, audience questions, links to notebook/dashboard.

These are **presentation targets**, not required screen timers. Keep optional lore hidden behind expandable panels.

## 10. Execution plan and milestones

### Milestone 0 — Preflight / truth lock
- Inspect input notebook + CSV and the grading PDF.
- Build and run the exporter; verify all baseline values above.
- Confirm exact cluster semantic mapping and clean dataset length.
- Create an authoritative `data/summary.json` and chart-data contract.
- Output: documented data schema and source-to-scene mapping.

### Milestone 1 — Playable vertical slice (highest priority)
Build **one complete loop**: Landing → Shrine → Hollow Scale combat → Diamond of Form reward → return pedestal → Stonekeeper dialogue → real preprocessing Codex chart → return to shrine. Include save/load and one accessibility check. **Do not start three other bosses before this complete loop works.**

### Milestone 2 — Shared gameplay and remaining normal chapters
Generalize boss engine, reward UI, pedestal logic, character dialogue, and Codex chart template. Add Twin Warden and Veiled Mirror, with all three quests in any order. Check cluster color mapping and data wording.

### Milestone 3 — Secret boss and final story
Implement the triple-return + revelation unlock; Nameless Exile battle and Eclipse reward; Hidden Archive and final scholar/plot twist; final result cards, ending navigation.

### Milestone 4 — Art and presentation polish
Insert optimized original illustrations, tune dark/light transitions and dialogue pacing, add optional sound/mute, build Presenter Mode, ensure chart legibility on presentation displays.

### Milestone 5 — QA, documentation, deployment
Run checks for data consistency, save/continue, any-order completion, secret unlocks, failing/retrying combat, chart sampling, restart, Presenter Mode, browser refresh, keyboard access and responsive layouts. Provide GitHub Pages instructions and an offline demo fallback.

**At every milestone:** keep the app runnable, leave an updated README, and report what was built/tested, what is still placeholder, and what remains.

## 11. Acceptance tests (must pass)

- [ ] Start a new game, read prologue and open the three boss areas.
- [ ] Finish each boss by attacking/defending and answering the correct question.
- [ ] Retry after player HP reaches zero without corrupting progress.
- [ ] Collect and return each of the three regular diamonds in arbitrary order.
- [ ] NPCs unlock only when the matching diamond is returned.
- [ ] Charts and explanations reflect verified notebook values.
- [ ] All three revelations viewed and stones returned → secret boss unlocks exactly once.
- [ ] Defeat Exile → Eclipse Diamond obtained → Hidden Archive unlocks.
- [ ] Finale explains original-size groups, PCA retained variance, silhouette comparison caveat, and DBSCAN limitations.
- [ ] Cluster display colors stay semantically consistent despite numeric label permutations.
- [ ] Browser refresh restores normal progress.
- [ ] Presenter Mode can enter every location and replay every reveal without editing normal progress.
- [ ] New Game clears story save with confirmation; Continue behaves correctly.
- [ ] Site works at 1920×1080 and 1366×768; no unreadable or clipped chart dialogs.
- [ ] Keyboard navigation, readable contrast and reduced-motion settings work.
- [ ] Site runs through a local static server and can be deployed to GitHub Pages.
- [ ] No artwork or data values copied blindly from reference dashboard mockups.

## 12. First instruction to Codex

**Implement Milestone 0, then Milestone 1 first.** Inspect the source files, establish the export schema, and build the complete first playable loop using the approved palette. Do not attempt to generate the entire game in one untested pass. Use original illustrative placeholders for missing art, preserve all functional requirements, keep the build runnable, and only proceed to subsequent chapters after the first loop's tests pass. When finished, give a short implementation report, local run steps, and a checklist of exact assets still needed.
