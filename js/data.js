let cached;
export function validateData(data) {
  const { summary: s, charts: c, verification: v } = data;
  if (s?.schema_version !== 1 || c?.schema_version !== 1 || v?.schema_version !== 1 ||
      !s.verified || !v.passed || !v.checks?.every(check => check.passed) ||
      s.counts.original !== s.counts.clean + s.counts.removed || c.population !== s.counts.clean ||
      s.metadata.features.join(',') !== 'carat,depth,table,x,y,z') {
    throw new Error('The research export did not pass its data contract. Run the Python exporter.');
  }
  for (const feature of s.metadata.features) {
    for (const group of ['distributions', 'standardized_distributions']) {
      const hist = c[group]?.[feature];
      if (!hist || hist.edges.length !== hist.counts.length + 1 ||
          hist.counts.reduce((sum, n) => sum + n, 0) !== s.counts.clean) {
        throw new Error(`Invalid full-data histogram: ${feature}`);
      }
    }
  }
  return data;
}
export async function loadData() {
  if (!cached) cached = Promise.all(['summary', 'charts', 'verification'].map(async name => {
    const response = await fetch(new URL(`../data/${name}.json`, import.meta.url));
    if (!response.ok) throw new Error(`Research file unavailable: ${name}.json (${response.status})`);
    return [name, await response.json()];
  })).then(entries => validateData(Object.fromEntries(entries))).catch(error => { cached = null; throw error; });
  return cached;
}
