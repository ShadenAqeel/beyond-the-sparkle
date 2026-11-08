#!/usr/bin/env python3
"""Check the deployment tree without a network connection or running a server."""
import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'
errors = []
checked = 0


def reference(source, value):
    global checked
    value = unquote(value)
    if '${' in value or value.startswith(('#', 'data:', 'mailto:')):
        return
    parsed = urlsplit(value)
    if parsed.scheme or value.startswith('//'):
        errors.append(f'Unexpected runtime external resource: {source}: {value}')
        return
    if value.startswith('/'):
        errors.append(f'Root-absolute path breaks repository Pages hosting: {source}: {value}')
        return
    target = (source.parent / parsed.path).resolve()
    if not target.is_relative_to(DIST.resolve()) or not target.is_file():
        errors.append(f'Missing or outside deployment: {source}: {value}')
    checked += 1


for file in DIST.rglob('*'):
    if not file.is_file():
        continue
    if file.suffix == '.svg':
        ET.parse(file)
    if file.suffix == '.json':
        json.loads(file.read_text())
    if file.suffix == '.html':
        for value in re.findall(r'(?:src|href)="([^"]+)"', file.read_text()):
            reference(file, value)
    if file.suffix == '.css':
        for value in re.findall(r'url\([\'"]?([^\)\'\"]+)', file.read_text()):
            reference(file, value)
    if file.suffix == '.js' and file.parent.name == 'js':
        source = file.read_text()
        for value in re.findall(r"(?:from\s+|import\s*)['\"]([^'\"]+)['\"]", source):
            reference(file, value)
        for value in re.findall(r"new URL\(['\"]([^'\"]+)['\"]", source):
            reference(file, value)
        for value in re.findall(r'(?:src|href)=\\?"([^"\\]+)', source):
            if '${' not in value:
                # Template markup resolves URLs relative to index.html, not js/.
                reference(DIST / 'index.html', value)

required = ['summary', 'charts', 'verification', 'pca_sample', 'cluster_profiles']
for name in required:
    if not (DIST / f'data/{name}.json').is_file():
        errors.append(f'Missing data/{name}.json')
if (DIST / 'reference/diamonds 2.csv').exists():
    errors.append('Full source CSV should not be in the public artifact.')
if not (DIST / '.nojekyll').is_file():
    errors.append('Missing .nojekyll')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'STATIC CHECK PASSED: {checked} relative references; JSON and original SVG files parse; no full CSV payload.')
