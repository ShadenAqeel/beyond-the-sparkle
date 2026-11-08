# Gameplay and storytelling overhaul: performance review

Production measurements on Intel UHD Graphics (0x4628), Edge/ANGLE D3D11, headless, 1440 × 1000 viewport. Runs were sequential on localhost without concurrent browser tests. OS/driver caches were not cleared. Raw reports contain UTC timestamps. This is one integrated GPU, not a compatibility survey.

## Final measurements

**Performance Mode, default, 1036 × 720 drawing buffer:** approximately **60 FPS average in all 13 phases**, including a player strike/hit reaction and the coordinated Twin Warden attack/block. The worst sampled frame was **29.3 ms** in the crypt, equivalent to **34.1 instantaneous FPS**; this was an isolated frame, not a sustained minimum. Phase p95 frame times were at most **17.6 ms**.

- Restored shrine: 59.9 average FPS; 116 draw calls / 47,900 submitted triangles; p95 17.4 ms.
- Moving three-scholar descent: about 60 FPS; p95 17.4 ms, worst 17.6 ms. First interaction took 3.32 seconds including preparation and the nominal 2.8-second camera path.
- Three-scholar crypt: 60.0 average; 58 calls / 170,110 triangles.
- Hollow Scale: 60.0 average; 31 calls / 50,842 triangles.
- Twin Warden: 60.0 average; 35 calls / 98,044 triangles. Strike window: 60.0 average, worst 18.6 ms; coordinated attack/block: 60.0 average, worst 20.2 ms.
- Veiled Mirror with two genuine 3D reflections: 60.0 average; 47 calls / 159,526 triangles; worst 20.5 ms.
- Exile: 60.0 average; 29 calls / 51,033 triangles. Eclipse recovery: 60.0 average, worst 20.9 ms.
- Archive: 60.0 average; approximately 53 calls / 59,106 triangles; worst 23.2 ms.
- Phase mean GPU query times: approximately 2.6–6.3 ms. CPU render-submission means: approximately 1.8–4.4 ms, including possible GPU waits.

**Quality Mode, 1440 × 1000:** phase averages ranged **29.5–50.2 FPS**. Shrine: 30.4; crypt: 37.2; Twin Warden: 45.6; Mirror: 43.1; Archive: 39.0. The strike window averaged 37.7 FPS with an 88.4 ms worst frame. The slowest sampled frame was **118 ms during descent**. GPU phase means were approximately 15.5–26.9 ms. Quality remains variable and is **not recommended for ordinary integrated-graphics laptops**. Performance Mode is the intended baseline.

Minimum FPS means 1000 / worst sampled frame, not a 1% low. Calls and triangles accumulate all rendering passes. Camera rows filter actual moving frames; action windows include a short settled tail. The crypt's manually prepared frame can slightly affect the transition average, hence “about 60.” GPU timer queries are asynchronous and disjoint-checked. Preparation is excluded from steady FPS and remains real loading work.

## What kept the expanded presentation affordable

The overhaul keeps the existing shrine, renderer, 45,000-triangle licensed human, textures, gemstone cut and precomputed reflection environment. No additional character model or dependency was downloaded.

Fitted armor and costume surfaces batch by material. The weapon pivot and genuine skinned body remain separate. The Twins use fewer active calls than the prior robe variants despite their more distinct silhouettes. Only active characters animate. Mirror images share source geometry/textures and use limited transparent rigs; no realtime reflection capture is involved. Contact shadows, the strike arc, blade and eight impact motes use small reusable resources. Action geometry is hidden outside playback.

Progress markings use one instanced mesh; altar rings reuse existing materials. Existing firelight changes with progress instead of adding more lights. There are seven light objects after staging, including hemisphere ambience and an arena spotlight hidden outside its area. Performance has one cached 512px architectural shadow map, 90 dust points, no bloom and no gemstone transmission. Quality retains its more costly shadow/post-processing/transmission passes.

The previous first-use crypt/reward preparation is preserved. Models, shaders and transmission setup warm behind a loading cover before travel or recovery. This relocates the cost rather than eliminating it. The archive uses the same room staging, instanced books and shared faceted gemstones.

Discovery widgets use native controls and small SVG/DOM graphics. The PCA teaching view uses 301 actual sample points. Full Plotly charts remain lazy. Both profiles recorded **zero 3D render calls during a 700 ms Codex-open observation**. No model fitting runs in the browser. Presenter travel is instant, but its character/combat animations now remain available; these profiles use full motion rather than freezing the fights.

## Loading and memory

Static build: **9.22 MB uncompressed**, including the optional 0.93 MB original notebook. Observed profile transfers: approximately **6.82 MB**, including the opened chart library, excluding the notebook download. The profile skips teaching widgets through Presenter Mode, so its transfer list excludes the tiny source-record JSON. One 3.64 MB GLB supplies every character role. These are local compressed transfers, not internet-load predictions.

After all roles were cached: **349 mesh objects / 209 geometry objects**, mostly hidden. Allocated renderer texture objects reached **27 Performance / 43 Quality**. Source RGBA8-with-mips estimate: **56.19 MiB**. The summed geometry attribute/index array views total **61.62 MiB**; **this is an upper estimate, not unique allocated CPU RAM**, because interleaved/shared array views can overlap. Facial geometry adaptations and cached costume variants also add source storage. These numbers are not active draw counts.

Initial ready-to-enter: **2.07 seconds Performance / 4.01 seconds Quality**. First optional chart: **231 / 436 ms**. These local measurements include preparation and depend on cache/driver state.

**Total VRAM, process peak RAM, GPU utilization and thermal behavior were not measured.** Source estimates exclude render targets, shadow storage, driver overhead and actual residency. Compressed downloads do not imply GPU block compression.

## Validation and scaling

**20 browser checks pass**, including the entire normal story, all six main-boss orders, discoveries and wrong-choice feedback, loss/retry, every scholar, save/reload checkpoints, Presenter isolation, inaccessible storage, X/Escape returns, interrupted/duplicate strike input, reduced motion, genuine rigs, presets, optional charts and laptop layouts. Most final checks used the production URL; two title/storage cases explicitly exercise the dev URL with identical source. **10 domain/data checks pass**, including source-record tracing, different boss patterns, old-save compatibility, spoiler boundaries, and byte-for-byte equality of all five research exports and the original notebook. Both production profiles reported zero page errors.

The complete fixed-size presentation is practical on the tested GPU **in Performance Mode**. Quality is optional. The update preserves smooth measured interaction while adding story, discovery, armor, reflections and combat feedback. This does not establish player curiosity or comprehension: those still need human playtesting.

For a larger game, pool/dispose assets between independently loaded areas rather than retaining an unlimited cast. Use roughly 150 active calls and 200,000 submitted triangles as initial Performance budgets, then verify each area on target devices. Crypt traversal already approaches that triangle budget. Test the deployed public URL on classmate laptops before presenting; other GPUs/browsers and long-session memory behavior remain unverified.

## Evidence

- [Final Performance, 13 phases](profiling/complete-performance-production.json)
- [Final Quality, 13 phases](profiling/complete-quality-production.json)
- [Previous complete-game Performance](profiling/before-overhaul-performance-production.json)
- [Previous complete-game Quality](profiling/before-overhaul-quality-production.json)
- [Historical architectural baseline](profiling/baseline-initial.json) and [shadow/post-processing ablation](profiling/baseline-ablation-development.json)

Previous runs have different content and motion settings; they are not controlled FPS comparisons. Reproduce sequentially using the [README commands](../README.md). Raw phase and resource values, including unfavorable Quality results, are preserved.
