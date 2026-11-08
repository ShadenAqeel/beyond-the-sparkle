# Research export contract · schema version 1

The exporter is `scripts/export_notebook_data.py`. It uses the original `reference/diamonds 2.csv` and `reference/project_PCA_1_(2).ipynb`. It also confirms anchors in the notebook's saved text/table outputs. It never edits either input. `reference/Mini Project Evaluating Clustering Before and After PCA.pdf` was inspected: preprocessing/scaling, clustering before/after 2D PCA, visualization, information loss, comparison, and final explanations are the grading requirements. Only the preprocessing revelation is exposed in this milestone; later chapters will address the rest.

## Pipeline

1. Read the original CSV; remove `Unnamed: 0`.
2. Exclude rows with any nonpositive x/y/z OR `abs(200*z/(x+y) - depth) > 5`. The zero denominator is replaced with NaN exactly as in the notebook. 20 rows have invalid dimensions, 40 have inconsistent depth, and 13 meet both criteria: 47 unique rows removed. Retain the 146 source duplicate records; no extra cleaning or outlier trimming.
3. Use features in this order: `carat, depth, table, x, y, z`. Fit StandardScaler on all 53,893 cleaned rows.
4. Fit K-Means with `n_clusters=2, random_state=42, n_init=10` in the standardized 6D space.
5. Fit `PCA(n_components=2)` as in the notebook. Fit a new K-Means with the same parameters in the 2D PC space.
6. DBSCAN: original standardized 6D `eps=0.5`, PCA 2D `eps=0.3`; both `min_samples=10`. Count `-1` as noise, exclude it from actual cluster count. Include it as a group in silhouette, matching the notebook.
7. Silhouette always uses `sample_size=3000, random_state=42`; each score is measured in its own fitting space. The 6D and 2D scores are not directly controlled performance comparisons.
8. Compute all statistics from the entire cleaned dataset. Draw the separate display sample by joint-label strata using seed 42, proportionally rounded with at least one row per stratum. Target 1,800 yields **1,804** actual points. Small strata are intentionally retained. The sample is never used for KPIs or profile medians.

## Files

| File | Fields and meaning |
| --- | --- |
| `summary.json` | `schema_version`, `verified`, source SHA-256 hashes, exporter hash, library versions, cleaning expression, feature order, model/silhouette settings, full-data `counts`, PCA variance, K-Means silhouettes, DBSCAN settings/counts/scores, interpretation caveats |
| `cluster_profiles.json` | `before` and `after` arrays: raw label, semantic group, approved color, full group count, median physical features and price. Price is observed after fitting. |
| `charts.json` | Full clean population, 40-bin original and standardized histograms for each feature (`edges` length 41, `counts` length 40), physical descriptive summaries, standardized population means/stds |
| `pca_sample.json` | Positional row arrays plus named `columns`, full population, actual sample count, seed, method, strata population/sample counts. Row columns: original zero-based CSV row index, PC1, PC2, before/after K-Means IDs, before/after DBSCAN IDs, carat. The original `Unnamed: 0` column is not an input or exported identifier. |
| `verification.json` | 35 named comparisons with actual, expected, tolerance, and pass flag; top-level `passed` |

All JSON disallows NaN. Files are replaced only after every truth-lock check passes. The source set is unchanged while exporting. A source revision requires rerunning the exporter; the static build checks the input/exporter hashes.

## Row alignment and semantic identity

The clean dataframe retains original noncontiguous row indices. PCA coordinates and label arrays remain positional NumPy arrays. Export rows use the same integer position for every coordinate, label, and source index. There is no index join with a new RangeIndex.

| Fit | Raw label | Meaning by median carat | Count | Display color |
| --- | --- | --- | ---: | --- |
| Before PCA | 0 | Larger, median 1.11 ct | 22,800 | Antique Gold `#C6A574` |
| Before PCA | 1 | Smaller, median 0.41 ct | 31,093 | Diamond Blue `#82B5C6` |
| After PCA | 0 | Smaller, median 0.41 ct | 31,090 | Diamond Blue `#82B5C6` |
| After PCA | 1 | Larger, median 1.11 ct | 22,803 | Antique Gold `#C6A574` |

These counts are computed results, not invented baseline anchors. The original notebook saves profile medians, not these group counts; the exporter verifies membership totals and the saved original-group medians. DBSCAN before PCA has 53,081 in main label 0, 8 in label 1, and 804 noise observations. After PCA it has 53,582 in its single dense cluster and 311 noise observations. Avoid hiding the tiny original second cluster or interpreting noise as defective diamonds in later charts.

## Source-to-scene mapping

| Scene / chapter | Notebook evidence | Implementation status |
| --- | --- | --- |
| Shrine | Three narrative fragments, not statistical clusters | Six portal/pedestal anchors; Form functional, later anchors explain locks |
| Hollow Scale / Stonekeeper / Form | Cells 2, 4, 6, 8, 11: original rows, missing/duplicate checks, cleaning, carat/depth histograms, six physical inputs, scaling | Playable and interactive Codex |
| Division | Cells 18, 26, 29: 6D K-Means labels, 2D projection, original group medians | Data exported; Milestone 2 |
| Memory | Cells 20–23, 27, 31: PCA variance, new K-Means, careful silhouette interpretation | Data exported; Milestone 2 |
| Exile | Cells 37, 41, 43–47: selected DBSCAN models, projections, noise and limitations | Data exported; Milestone 3 |
| Truth | Notebook final summary / combined evidence | Narrative and final visualization deferred to Milestone 3 |

Later scatter renderers must use PC1/PC2 as shared coordinates, choose the correct before/after model's labels, read semantic colors from profiles, expose raw IDs in tooltips, and label the scatter as a visualization sample. Form histograms use every clean row and are not sampled.
