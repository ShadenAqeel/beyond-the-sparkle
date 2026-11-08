# Beyond the Sparkle: The Lost Legacy

A complete browser game and interactive research presentation built on the Forgotten Shrine. The existing sanctuary, crypt, faceted gemstones, genuine rigged Stonekeeper, lighting, typography and Three.js implementation are preserved. One encounter stage swaps in a distinct arena for each of the four guardians; the Hidden Archive reuses its stone chamber. The original game in the parent folder remains separate.

## Run

Requires Node.js 22.12+ (Node 24 recommended) and a browser with WebGL 2 and hardware acceleration.

```sh
cd prototype-3d
npm install
npm run dev
```

Open the printed URL, normally **http://127.0.0.1:5173/**. In Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`. The application serves all models, fonts, sounds and charts locally; no runtime model host or API is required. A loading indicator covers initial model/shader preparation and chamber changes.

## Play the whole story

Choose **New Journey**, or **Continue Journey** to resume a saved chapter. Approach the living flame for the premise, then enter any of the three chambers from it. An empty pedestal also offers its own chamber. (Presenter Mode can open any guardian directly.)

- **Hollow Scale / Form:** preprocessing, cleaning and six standardized physical inputs. Restore Form to awaken the Stonekeeper.
- **Twin Warden / Division:** two K-Means groups and their characteristics. Restore Division to awaken the Divider.
- **Veiled Mirror / Memory:** two principal components and 88.12% retained variance. Restore Memory to awaken the Seer.

All six main-boss orders work. The opening voice gives you the kingdom's account; each recovered diamond leaves a contradiction in that account. The scholars have different motives and incomplete memories. Read recovered clues again in **Journey**. The final resolution waits in the Hidden Archive.

Each encounter begins with a discovery that exposes an opening, without requiring statistical vocabulary:

- **Form:** find an impossible physical dimension among three actual CSV records. Record 2208 has z = 0 mm. The fictional royal seal is a story clue, not a field in the research dataset.
- **Division:** explore two real sample profiles, then pair the smaller group's full-data median profile with the lighter collection. The median profile is explicitly not an invented individual stone.
- **Memory:** activate both component windows and watch six measurement ribbons fold into a real PC1/PC2 projection. The display uses 301 rows from the verified visualization sample. Each PC combines all six inputs; it does not select one original feature.
- **Exile:** investigate the dense gathering and isolated marks. This is a labeled teaching diagram with three selectable isolated marks, not a simulation of the actual DBSCAN fit or its noise count.

Optional hints and wrong selections give feedback without resetting progress. The full verified result follows the interaction.

Fights use a full-screen HUD with no lore text: the guardian's name and health bar at the top, a one-line move cue (HEAVY / LIGHT / OPENING / FEINT), short taunts, your health diamonds and a combo meter. Story and research are revealed when you collect a diamond and speak with its keeper, not during combat. Each encounter opens with a title card.

**Strike** (J / A / ←) deals 2, or a **critical 3** into an opening. **Guard** (K / D / →) against a real blow is a **parry**: it blocks fully and carries 2 guard into your next strike. Three good reads in a row arm a **finisher** (+2). Guarding an opening wastes the turn and resets the combo. Blindly striking loses every fight. Hits shake the camera and flash the screen, and damage numbers pop up. Reduced motion turns these effects off.

The same rules drive different patterns, and each guardian has its own body, arena, idle personality, telegraph poses, hit reaction and defeat:

- **The Hollow Scale** (Chamber of Form, gold and amber) is a floating executioner of stone slabs and brass plates. Inside its open brass ribcage there is no body, only a burning weight. A pale stone mask sits under a pointed bronze hood, a great balance hangs from its back, and it carries a stone gavel. At rest it tilts its hood as if weighing you, and the balance rocks. It cocks the gavel over its shoulder to wind up, slams it down hard enough to crack a glowing ring into the floor, and leaves it embedded while its plates hang loose (the opening). The pans swing with every move. When struck, its plates burst apart and drift back. Defeated, it collapses into a pile of slabs. Its arena is a sunken tribunal with stepped galleries, a wall engraved with a balance, shafts of warm light, falling dust and drifting golden scale-weights.
- **The Twin Warden** (Hall of Division, frost blue and ember red) is two knights joined by a glowing oath-chain. The heavy knight has a horned helm, tower shield and flanged mace; the agile one fights with two long curved blades. Each wears its twin's colour on the side that faces it. The heavy one stands still and keeps glancing at its twin, while the agile one cannot keep still. The agile knight drops into a fencer's stance before it lunges. For the coordinated blow both raise their weapons, the chain pulls taut and sparks, and the line of light dividing the hall flares as they strike. When they falter the chain goes slack. Defeated, both kneel and the chain breaks. The hall is split down the middle: snow falls on the frost side and sparks rise on the ember side.
- **The Veiled Mirror** (Hall of Reflections, violet and silver) is a floating, legless figure. She has a glass bodice, a shard gown, a veiled head and a crown of shards, mirror fragments orbit her, and three translucent reflections flicker around her. On a feint, one reflection becomes vivid, draws a glass blade and lunges while she stays still. Before a real strike her shards gather into a ring of blades around her raised hand, then fly at you. Defeated, her reflections shatter into motes and she sinks into the floor. Her hall has a truly reflective floor, a ring of arched mirrors that each seem to recede forever, cold moonlight, fog and twinkling glass motes.
- **The Nameless Exile** is a towering hooded colossus with burning eyes, a broken crown and an ember-cracked greatsword, fought in a chamber walled with fire. Below half health it enrages: the fire surges and its pattern changes.

A simultaneous knockout is a loss; immediate retries are free. With Reduced motion on, the guardians hold still poses, particles freeze and nothing flickers or shakes.

The keepers are visibly different people: the Stonekeeper (spectacles, original scan), the Divider (darker skin, black beard, square scholar's cap and monocle), the Seer (pale, silver hair, glowing silk blindfold, floating jewels) and the Old Scholar (deep cowl, great white beard, staff).

## Navigation and saves

Click a marker or its scene object to approach. **X and Escape close the inspection and smoothly restore the preceding exploration camera in one action.** Scholar conversations return to the crypt; guardians return to their arena; the Old Scholar returns to the Archive. Closing the stair-arrival panel returns to where descent began. Closing a native dialog first closes that dialog, preserving the underlying interaction. Repeated Escape safely reverses an interrupted approach once. Tab/Enter operate controls. **Return to the shrine** explicitly changes location.

The **Journey** menu shows diamond inventory and recovered clues and offers Continue, Restart and Presenter Mode. Restart requires confirmation. Autosaves preserve discoveries, completed fights, rewards, collected/restored stones, scholar revelations, ending and location. A mid-combat reload starts that short battle again while preserving its discovery. Victory is saved before its animation. Mid-conversation reload starts that conversation again. Existing v2 saves remain compatible, including the previous combat-completed checkpoint. Malformed saves recover safely. If storage is blocked, play continues in memory and the game explains that closing the tab loses progress.

The 3D story uses `beyond-the-sparkle.3d.story.v2`; graphics/audio preferences use `beyond-the-sparkle.3d.settings.v1`. The original game's save key is untouched. Saves belong to the browser and host, so a localhost save does not automatically transfer to a public URL. Old session-only prototype progress has no migration.

## Presenter Mode

Available from the title or Journey menu. **Choose chapter** opens any guardian, research chapter or final revelation directly. **Presenter · resolve encounter** skips a battle; the investigation action opens its discovery. Camera travel is immediate while character and combat animation remain available. The final revelation can be replayed. Normal story progress and settings are restored on **Return to Story**. Presenter changes never write the story save; entering without a save returns to the title.

## Research Codex

Uses unchanged verified exports from the supplied notebook: 53,940 original / 53,893 cleaned diamonds, six physical inputs, two K-Means groups, two PCs retaining 88.12%, silhouettes 0.429 / 0.487 and DBSCAN's one main cluster / 311 noise observations after PCA.

Optional panels include carat/depth distributions, full-data group medians, variance, K-Means before/after PCA and DBSCAN before/after PCA. Stable colors track larger/smaller groups even when raw IDs reverse. The scatter displays a reproducible **1,804-row sample**, clearly distinguished from full-population figures. Hover exposes raw labels and source rows. The browser does not fit analytical models. Plotly loads only when a chart is opened, and 3D rendering pauses while the Codex is visible.

The conclusion explicitly states that silhouettes computed in different spaces do **not** prove overall clustering improvement. DBSCAN settings differ between fits; noise is not a diamond defect. Source files and the original notebook are available within the Codex. Story gemstones are fictional chapters, not four statistical clusters.

## Graphics and accessibility

**Performance Mode is the default:** reduced rendering resolution, one cached 512px architectural shadow map, fewer dust particles, no bloom and reflective gemstones without transmission. **Quality Mode** enables restrained bloom, higher resolution and half-resolution gemstone transmission. These options preserve gameplay. Static environment reflections avoid per-frame cube captures. Assets/materials are shared among character variants; only active characters animate. No additional character model downloads are required.

Sound starts muted; original synthesized ambience and cues can be enabled. Reduced motion follows the OS and has a toggle; it freezes idle movement and skips camera travel without changing progression. The prototype targets desktop/laptop mouse and keyboard use; it has responsive desktop panels, not a fully designed mobile control scheme.

## Validate and profile

With the dev server running, in a second terminal:

```sh
npm run test:unit
npm test -- --workers=1
```

A quick combat smoke test plays real fights through the UI (loss/retry, Escape mid-fight, keyboard controls, the Exile's enrage, victory and recovery): `node tools/smoke-combat.mjs` (set `BROWSER_PATH` to a Chrome/Edge executable). `node tools/shots.mjs <folder>` captures a screenshot tour of every guardian and keeper. Browser checks use installed Windows Edge; set `BROWSER_PATH` for another browser. Tests cover all six boss orders, the complete ending, every scholar, discovery feedback, loss/retry, save/reload checkpoints, restart, Presenter isolation, inaccessible storage, X/Escape navigation, interrupted actions/transitions, real skinned geometry, idle/reduced motion, gemstone depth, presets, optional charts and desktop layouts. Captured screenshots are in ignored `qa/`. Working source/build-input archives at major phases are kept locally in ignored `.checkpoints/`; these are not shipped in the public build.

For a production build:

```sh
npm run build
npm run preview -- --port 4173
```

Run performance profiling **alone**, after stopping browser tests. In PowerShell:

```powershell
$env:SHRINE_URL = 'http://127.0.0.1:4173/'
npm.cmd run profile:performance
npm.cmd run profile
```

Optional `EDGE_PATH` overrides the profiler's Edge executable. Profiles record average/minimum FPS, frame times during actual camera motion, draw calls/triangles, GPU timers where supported, approximate source memory, resource transfers, loading and Codex rendering pause. Results are in `docs/profiling/`; see [performance findings and limits](docs/PERFORMANCE.md). A one-machine headless check is not a guarantee for every laptop. [Static deployment instructions](docs/DEPLOYMENT.md) describe how to share the build publicly.

## Maintain and credit

- `src/main.js`: UI coordination, story/presenter modes, actions and hot spots.
- `src/chapters.js`: character testimony, clues, combat patterns and final revelation.
- `src/discovery.js`: interactive source records, grouping, PCA windows, density teaching diagram and scholar evidence.
- `src/characters.js`: adapted rigged characters, fitted armor, distinct silhouettes, weapons and costume batching.
- `src/progress.js`: validated state, unlocks and autosaves.
- `src/combat.js`: shared deterministic turn rules (criticals, parries, combo finishers).
- `src/hollow-scale.js`, `src/tribunal.js`: the Hollow Scale and its sunken tribunal.
- `src/twin-warden.js`, `src/division-hall.js`: the linked Twin Warden knights and their split hall.
- `src/veiled-mirror.js`, `src/mirror-hall.js`: the Veiled Mirror with her reflections, and the hall of mirrors with its reflective floor.
- `src/exile-boss.js`, `src/inferno.js`: the hooded final boss and its fire-walled arena.
- `src/boss-kit.js`: shared helpers for the guardians and arenas: canvas textures, mesh batching, GPU particle fields, fresnel and wind materials.
- `src/navigation.js`, `src/audio.js`: reused camera paths and synthesized sound.
- `src/encounters.js`: encounter staging. It picks each guardian's actor and arena backdrop and handles combat effects, the reward and the Archive.

All guardians and arenas are original procedural geometry, canvas textures and shaders; no assets are downloaded. Every guardian module exposes the same interface (`root`, `weapon`, `home`, `defeated`, `custom`, `hitHeight`, `pose({telegraph, strike, recoil})`, `update`, `reset`, `win`, optional `enrage`/`laugh`). Every arena module exposes `group`, `key` light, `atmosphere` (fog and background) and `update`. Particles are single-material GPU point fields with no shadows. The reflective floor renders at half resolution in Performance Mode.
- `src/codex.js`: verified research and lazy local charts.
- `src/scene.js`, `src/materials.js`, `src/batching.js`: existing sanctuary and rendering presets.
- `src/gemstone.js`, `src/stonekeeper.js`: faceted cut and licensed rig/costume.

The keepers and the Old Scholar derive from the genuine rigged **Old Man by Bake3D**, CC BY 4.0. The four guardians are original procedural figures and use no part of that rig. Scholar costume, posture and small facial-proportion adaptations distinguish their roles. They still share source anatomy and texture identity; these are economical adaptations, not separately commissioned realistic humans. Credits ship in `public/models/LICENSE.txt` and the Codex. The Stonekeeper portrait is rendered from the preserved scholar model. [Asset provenance and license details](art-source/PROVENANCE.md) document adaptations. Fonts retain their SIL OFL files; the local Plotly distribution retains its license files. No endorsement is implied.

This is a complete short interactive presentation, with simple combat and limited staging. It is not an open world or a full commercial RPG.
