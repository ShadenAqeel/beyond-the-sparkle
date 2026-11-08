# Beyond the Sparkle: The Lost Legacy

Milestone 0 (data truth lock) and Milestone 1 (one playable chapter). English-only, buildless, modular HTML/CSS/JavaScript. All research values come from the supplied notebook's pipeline. No model is fitted in the browser.

## Run locally

From this directory:

```sh
python -m http.server 8000
```

Open **http://localhost:8000**. No npm installation or internet connection is needed to play. Open through HTTP; browsers restrict ES modules and JSON fetches under `file://`.

Select **New Journey**, visit the **Chamber of Form**, face the **Hollow Scale**, answer its question, take the diamond, return it to the **Form** pedestal, meet the **Stonekeeper**, and choose **Reveal Knowledge**. Return to the shrine from the Codex to complete the loop.

Combat is turn-based. Attack deals 1 damage and receives the announced move. Defend blocks the current move and protects the next attack from up to 1 damage. The pattern repeats normal (1), heavy (2). One winning sequence is **Attack → Defend → Attack → Defend → Attack**. There are no timing requirements. Wrong knowledge answers give a hint without repeating combat. Retry restores both HP values; simultaneous zero HP counts as a loss.

Story saves use `beyond-the-sparkle.story.v1` in this origin's localStorage. Progress is checkpointed at victory, collection, pedestal return, revelation, and scene changes. An interrupted battle restarts when re-entered. Reload and **Continue Journey** restore progress. New Journey asks before replacing an existing story. If browser storage is unavailable, the game continues in memory and explains the limitation.

**Presenter Mode** previews only the implemented chapter: scene jumps, instant encounter resolution, skip animations, narrative visibility, and full chart views. It never writes its progress or settings to the normal story save. **Return to Story** restores the prior scene. Later chapter buttons explain their milestone locks.

Sound starts muted. The sound button opts into two quiet original synthesized ambient tones; there are no downloaded audio tracks. Motion respects the device preference and has a persistent toggle. Information and progression work without either.

## Reproduce the research export

The original files are unchanged in `reference/`. The CSV is the original user-supplied data, not a replacement.

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python scripts/export_notebook_data.py
```

The pinned environment uses Python 3.11 or later. It reproduces cleaning, StandardScaler, selected two-group K-Means before/after two-component PCA, and the notebook's selected DBSCAN settings. Silhouettes use the notebook's 3,000-row sample and seed. The 35 checks compare against saved notebook anchors and published baseline results; failure prevents export. The notebook's parameter sweeps are not rerun or altered.

Verified results: **53,940 → 53,893 rows**, **47 removed**, **88.122061% variance retained**, K-Means silhouettes **0.429 / 0.487**, DBSCAN noise **804 / 311**. Original-space K-Means raw label 0 is larger (median 1.11 ct, $6,055.50), and raw label 1 is smaller (median 0.41 ct, $1,053). In this verified after-PCA fit, the raw labels reverse. Color/semantic mapping uses median carat independently in each fit.

Duplicates are retained, as in the notebook. Price, cut, color and clarity are excluded from clustering. The two silhouette scores use different feature spaces and do not establish an overall model improvement. DBSCAN noise is relative to density settings and is not a defect classification. Its silhouette includes noise as a group.

See [the data contract](docs/DATA_CONTRACT.md), [implementation report](docs/IMPLEMENTATION_REPORT.md), and [asset checklist](assets/README.md).

## Checks and static build

The only Node dependencies are for DOM tests; they are not needed at runtime.

```sh
npm ci
npm test
python scripts/build.py
python scripts/check_static.py
```

The `dist/` artifact contains relative-path HTML, ES modules, CSS, JSON, local fonts, Plotly, and the downloadable original notebook. It omits the full CSV, reference PDF, implementation spec, exporter, tests, and Node packages. After building, `python -m http.server 8000 --directory dist` serves the deployment artifact locally.

Plotly Basic 2.35.2 is vendored for offline interactive histogram hover, zoom, reset, and SVG export. Each chart also has an accessible bin-count table. Fonts are vendored with their SIL OFL licenses. No external asset request is required.

## GitHub Pages

No deployment was performed. To deploy later, put this source in a GitHub repository, choose **Settings → Pages → Source: GitHub Actions**, and manually run the included **Deploy static prototype** workflow. It builds the already-verified JSON into `dist/`, checks its local asset references, and uploads that directory. It does not rerun the models on GitHub.

Alternatively, use the supplied static-site zip as the contents of a Pages branch and select that branch/root in Pages settings. Preserve the directory tree and `.nojekyll`. Relative paths work under a repository subpath; there is no SPA router or server dependency.

## Scope of this delivery

Only Form is playable. Division/Memory, Exile, Eclipse Diamond, Hidden Archive, and the ending remain locked. Their data is exported for future chapters, but no later boss or chart page is implemented. The shrine's three stone slots are story chapters, not three statistical clusters. All narrative and symbols are original fiction, with no claim about a historical diamond.

Original SVG artwork is a cohesive functional placeholder set. Replace the five art files listed in `assets/README.md` with final illustrated work in the same composition slots. Browser visual QA remains outstanding because the supplied cloud environment exposed no shared-browser control tool; automated checks do not establish actual viewport layout, native focus trapping, Web Audio playback, or Plotly rendering in a browser.
