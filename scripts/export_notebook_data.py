#!/usr/bin/env python3
"""Reproduce the supplied notebook's selected models. No browser-side training.

Run from any directory. A failed truth-lock leaves existing exports untouched.
The original notebook and its methodological choices are never modified.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path

# Limit parallelism, not model behavior; avoids oversubscription in live demos.
os.environ.setdefault('OMP_NUM_THREADS', '1')
os.environ.setdefault('OPENBLAS_NUM_THREADS', '1')
os.environ.setdefault('MKL_NUM_THREADS', '1')

import numpy as np
import pandas as pd
import scipy
import sklearn
from sklearn.cluster import DBSCAN, KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
FEATURES = ['carat', 'depth', 'table', 'x', 'y', 'z']


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def score(x, labels):
    return float(silhouette_score(x, labels, sample_size=3000, random_state=42))


def profiles(frame, labels):
    result = []
    grouped = frame.assign(raw_label=np.asarray(labels)).groupby('raw_label')
    larger = int(grouped['carat'].median().idxmax())
    for raw, group in grouped:
        semantic = 'larger' if raw == larger else 'smaller'
        result.append({
            'raw_label': int(raw), 'semantic': semantic,
            'color': '#C6A574' if semantic == 'larger' else '#82B5C6',
            'count': len(group),
            'medians': {key: float(value) for key, value in
                        group[FEATURES + ['price']].median().round(2).items()},
        })
    return result


def histogram(values):
    counts, edges = np.histogram(values, bins=40)
    return {'edges': edges.tolist(), 'counts': counts.tolist()}


def run(args):
    notebook = json.loads(args.notebook.read_text())
    saved_text = '\n'.join(''.join(o.get('text', o.get('data', {}).get('text/plain', [])))
                           for c in notebook['cells'] for o in c.get('outputs', []))
    anchors = ['Rows removed: 47', 'Rows after: 53893',
               'Silhouette Score Before PCA: 0.429', 'Silhouette Score After PCA: 0.487',
               'Noise points: 804', 'Noise points: 311', '0.881220613841964', '6055.5', '1053.0']
    for anchor in anchors:
        if anchor not in saved_text:
            raise ValueError(f'Notebook truth-lock anchor missing: {anchor!r}; review source before exporting.')

    df = pd.read_csv(args.csv).drop(columns=['Unnamed: 0'])
    invalid_dimensions = (df[['x', 'y', 'z']] <= 0).any(axis=1)
    calculated_depth = 200 * df['z'] / (df['x'] + df['y']).replace(0, np.nan)
    invalid_depth = abs(calculated_depth - df['depth']) > 5
    invalid_rows = invalid_dimensions | invalid_depth
    clean = df.loc[~invalid_rows].copy()
    print(f'Cleaning: {len(df):,} → {len(clean):,}; removed {int(invalid_rows.sum())}', flush=True)
    scaler = StandardScaler()
    scaled = scaler.fit_transform(clean[FEATURES])
    params = {'n_clusters': 2, 'random_state': 42, 'n_init': 10}
    before = KMeans(**params).fit_predict(scaled)
    pca = PCA(n_components=2)
    points = pca.fit_transform(scaled)
    after = KMeans(**params).fit_predict(points)
    km_scores = {'before': score(scaled, before), 'after': score(points, after)}
    print(f'K-Means silhouettes: {km_scores}', flush=True)
    db_labels, db_summary = {}, {}
    for key, values, eps in [('before', scaled, .5), ('after', points, .3)]:
        labels = DBSCAN(eps=eps, min_samples=10).fit_predict(values)
        db_labels[key] = labels
        db_summary[key] = {'eps': eps, 'min_samples': 10,
                           'clusters': len(set(labels)) - int(-1 in labels),
                           'noise': int((labels == -1).sum()),
                           'silhouette': score(values, labels),
                           'label_counts': {str(int(k)): int(v) for k, v in
                                            zip(*np.unique(labels, return_counts=True))}}
        print(f'DBSCAN {key}: {db_summary[key]}', flush=True)

    cluster_profiles = {'schema_version': 1, 'before': profiles(clean, before),
                        'after': profiles(clean, after)}
    checks = []

    def check(name, actual, expected, tolerance=0):
        passed = abs(actual - expected) <= tolerance
        checks.append({'name': name, 'actual': actual, 'expected': expected,
                       'tolerance': tolerance, 'passed': bool(passed)})

    check('Original rows', len(df), 53940)
    check('Removed rows', int(invalid_rows.sum()), 47)
    check('Clean rows', len(clean), 53893)
    check('Nonpositive dimension rows', int(invalid_dimensions.sum()), 20)
    check('Missing values (source)', int(df.isna().sum().sum()), 0)
    check('Source duplicates (retained, as in notebook)', int(df.duplicated().sum()), 146)
    for key, expected in [('before', .429), ('after', .487)]:
        check(f'K-Means {key} silhouette (3 decimals)', round(km_scores[key], 3), expected)
    for i, expected in enumerate([.66682508, .21439554]):
        check(f'PC{i + 1} explained variance', float(pca.explained_variance_ratio_[i]), expected, 1e-8)
    check('Total retained variance', float(pca.explained_variance_ratio_.sum()), .881220613841964, 1e-8)
    for raw, carat, price in [(0, 1.11, 6055.5), (1, .41, 1053)]:
        group = next(g for g in cluster_profiles['before'] if g['raw_label'] == raw)
        check(f'Original raw label {raw} median carat', group['medians']['carat'], carat)
        check(f'Original raw label {raw} median price', group['medians']['price'], price)
    for key, clusters, noise, silhouette in [('before', 2, 804, .485), ('after', 1, 311, .558)]:
        for metric, expected in [('clusters', clusters), ('noise', noise), ('silhouette', silhouette)]:
            actual = db_summary[key][metric]
            check(f'DBSCAN {key} {metric}', round(actual, 3) if metric == 'silhouette' else actual, expected)
    for key in ['before', 'after']:
        check(f'{key} profile membership total', sum(g['count'] for g in cluster_profiles[key]), len(clean))
    for i, feature in enumerate(FEATURES):
        check(f'{feature} standardized mean', float(scaled[:, i].mean()), 0, 1e-10)
        check(f'{feature} standardized population std', float(scaled[:, i].std()), 1, 1e-10)
    failed = [c for c in checks if not c['passed']]
    if failed:
        raise ValueError('TRUTH LOCK FAILED; no data written:\n' + json.dumps(failed, indent=2))

    # Joint-label stratification preserves small DBSCAN groups. Each point is
    # selected by POSITION, never by joining the cleaned non-contiguous index.
    rng = np.random.RandomState(42)
    strata = np.column_stack([before, after, db_labels['before'], db_labels['after']])
    unique, inverse = np.unique(strata, axis=0, return_inverse=True)
    selected = []
    strata_meta = []
    for i, labels in enumerate(unique):
        positions = np.flatnonzero(inverse == i)
        take = min(len(positions), max(1, round(len(positions) / len(clean) * args.sample_size)))
        chosen = rng.choice(positions, take, replace=False)
        selected.extend(chosen.tolist())
        strata_meta.append({'labels': labels.tolist(), 'population': len(positions), 'sample': take})
    selected = np.asarray(sorted(selected))
    source_index = clean.index.to_numpy()
    rows = [[int(source_index[i]), *np.round(points[i], 6).tolist(),
             int(before[i]), int(after[i]), int(db_labels['before'][i]), int(db_labels['after'][i]),
             float(clean['carat'].iloc[i])] for i in selected]
    sample = {'schema_version': 1,
              'columns': ['source_row_index', 'pc1', 'pc2', 'kmeans_before', 'kmeans_after',
                          'dbscan_before', 'dbscan_after', 'carat'],
              'population': len(clean), 'count': len(rows), 'random_state': 42,
              'method': 'proportional joint-label stratification; at least one per nonempty stratum',
              'strata': strata_meta, 'rows': rows}
    summary = {
        'schema_version': 1, 'verified': True,
        'source': {'csv': args.csv.name, 'csv_sha256': digest(args.csv),
                   'notebook': args.notebook.name, 'notebook_sha256': digest(args.notebook),
                   'exporter_sha256': digest(Path(__file__))},
        'metadata': {'features': FEATURES, 'excluded_from_model': ['price', 'cut', 'color', 'clarity'],
                     'scaler': 'StandardScaler', 'pca_components': 2,
                     'kmeans': params, 'silhouette': {'sample_size': 3000, 'random_state': 42},
                     'cleaning': 'Remove nonpositive x/y/z OR abs(200*z/(x+y)-depth)>5. Retain duplicate records.',
                     'versions': {'numpy': np.__version__, 'pandas': pd.__version__,
                                  'scipy': scipy.__version__, 'scikit-learn': sklearn.__version__}},
        'counts': {'original': len(df), 'removed': int(invalid_rows.sum()), 'clean': len(clean),
                   'nonpositive_dimensions': int(invalid_dimensions.sum()),
                   'depth_inconsistencies': int(invalid_depth.sum()),
                   'both_invalid': int((invalid_depth & invalid_dimensions).sum()),
                   'missing': int(df.isna().sum().sum()), 'source_duplicates_retained': int(df.duplicated().sum())},
        'pca': {'explained_variance_ratio': pca.explained_variance_ratio_.tolist(),
                'retained': float(pca.explained_variance_ratio_.sum()),
                'not_retained': float(1 - pca.explained_variance_ratio_.sum())},
        'kmeans': {'n_clusters': 2, 'silhouette': km_scores}, 'dbscan': db_summary,
        'caveats': {
            'silhouette': 'The 2D score is higher, but the scores are measured in different feature spaces and do not establish an overall improvement.',
            'dbscan': 'Noise (-1) is relative to density settings, not a defect classification. Silhouette includes noise as a group.',
            'price': 'Price was excluded from modeling. Price differences are associations observed after clustering, not evidence of causality or quality grades.'}}
    charts = {'schema_version': 1, 'population': len(clean), 'bins': 40,
              'distributions': {f: histogram(clean[f].to_numpy()) for f in FEATURES},
              'standardized_distributions': {f: histogram(scaled[:, i]) for i, f in enumerate(FEATURES)},
              'physical_summary': {f: {k: float(v) for k, v in clean[f].describe().items()} for f in FEATURES},
              'standardization': {f: {'mean': float(scaled[:, i].mean()),
                                      'population_std': float(scaled[:, i].std())} for i, f in enumerate(FEATURES)}}
    outputs = {'summary.json': summary, 'cluster_profiles.json': cluster_profiles,
               'charts.json': charts, 'pca_sample.json': sample,
               'verification.json': {'schema_version': 1, 'passed': True, 'checks': checks}}
    args.out.mkdir(parents=True, exist_ok=True)
    for filename, content in outputs.items():
        target = args.out / filename
        temporary = target.with_suffix('.tmp')
        temporary.write_text(json.dumps(content, indent=2, allow_nan=False) + '\n')
        temporary.replace(target)
    print(f'TRUTH LOCK PASSED: {len(checks)} checks. Exported {len(rows)} sampled points to {args.out}', flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--csv', type=Path, default=ROOT / 'reference/diamonds 2.csv')
    parser.add_argument('--notebook', type=Path, default=ROOT / 'reference/project_PCA_1_(2).ipynb')
    parser.add_argument('--out', type=Path, default=ROOT / 'data')
    parser.add_argument('--sample-size', type=int, default=1800)
    arguments = parser.parse_args()
    if arguments.sample_size < 1:
        parser.error('--sample-size must be positive')
    run(arguments)
