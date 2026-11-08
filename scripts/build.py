#!/usr/bin/env python3
"""Assemble a buildless, relative-path GitHub Pages artifact using stdlib only."""
import json
import hashlib
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'dist'
summary = json.loads((ROOT / 'data/summary.json').read_text())
verification = json.loads((ROOT / 'data/verification.json').read_text())
if not summary.get('verified') or not verification.get('passed') or not all(c['passed'] for c in verification['checks']):
    raise SystemExit('Build refused: run and repair the verified data export first.')
for path, key in [('reference/diamonds 2.csv', 'csv_sha256'),
                  ('reference/project_PCA_1_(2).ipynb', 'notebook_sha256'),
                  ('scripts/export_notebook_data.py', 'exporter_sha256')]:
    if hashlib.sha256((ROOT / path).read_bytes()).hexdigest() != summary['source'][key]:
        raise SystemExit(f'Build refused: {path} changed since verification. Rerun the exporter.')
if TARGET.exists():
    shutil.rmtree(TARGET)
TARGET.mkdir()
for directory in ['css', 'js', 'data', 'assets']:
    shutil.copytree(ROOT / directory, TARGET / directory)
shutil.copy2(ROOT / 'index.html', TARGET / 'index.html')
(TARGET / '.nojekyll').touch()
(TARGET / 'reference').mkdir()
shutil.copy2(ROOT / 'reference/project_PCA_1_(2).ipynb', TARGET / 'reference/project_PCA_1_(2).ipynb')
print(f'Static artifact: {TARGET} (no runtime dependency, no full CSV payload)')
