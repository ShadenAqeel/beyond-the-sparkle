import { labels, units, fmt } from './codex.js';
let library;
export async function loadPlotly() {
  if (globalThis.Plotly) return globalThis.Plotly;
  if (!library) library = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL('../assets/vendor/plotly-basic-2.35.2.min.js', import.meta.url).href;
    script.onload = () => resolve(globalThis.Plotly);
    script.onerror = () => { script.remove(); library = null; reject(new Error('The local chart library could not be loaded. The data table remains available.')); };
    document.head.append(script);
  });
  return library;
}
export function histogramSpec(charts, feature, scale) {
  const standardized = scale === 'standardized';
  const hist = charts[standardized ? 'standardized_distributions' : 'distributions'][feature];
  const x = hist.counts.map((_, i) => (hist.edges[i] + hist.edges[i + 1]) / 2);
  const label = `${labels[feature]} (${standardized ? 'standard deviations' : units[feature]})`;
  return { hist, label, trace: { type: 'bar', x, y: hist.counts,
    width: hist.counts.map((_, i) => (hist.edges[i + 1] - hist.edges[i]) * .93),
    marker: { color: feature === 'carat' ? '#C6A574' : '#82B5C6', line: { color: '#252B30', width: .6 } },
    customdata: hist.counts.map((_, i) => `${hist.edges[i].toFixed(3)}–${hist.edges[i + 1].toFixed(3)}`),
    hovertemplate: 'Range %{customdata}<br>%{y:,} observations<extra></extra>',
  } };
}
export function histogramTable(charts, feature, scale) {
  const { hist, label } = histogramSpec(charts, feature, scale);
  return `<details class="chart-table"><summary>View accessible data table</summary><div class="table-scroll"><table><caption>${label} · full-data histogram</caption><thead><tr><th>Bin start</th><th>Bin end</th><th>Count</th></tr></thead><tbody>${hist.counts.map((count, i) => `<tr><td>${fmt(hist.edges[i])}</td><td>${fmt(hist.edges[i + 1])}</td><td>${fmt(count)}</td></tr>`).join('')}</tbody></table></div></details>`;
}
export async function drawHistogram(element, charts, feature, scale) {
  const { trace, label } = histogramSpec(charts, feature, scale);
  element.setAttribute('aria-label', `${label}, full cleaned dataset distribution. Accessible bin counts are in the adjacent data table.`);
  try {
    const Plotly = await loadPlotly();
    if (!element.isConnected) return;
    await Plotly.newPlot(element, [trace], {
      paper_bgcolor: '#FFFFFF', plot_bgcolor: '#FFFFFF',
      font: { family: 'Inter, sans-serif', color: '#252B30', size: 11 },
      margin: { l: 57, r: 18, t: 22, b: 55 },
      xaxis: { title: { text: label, standoff: 16 }, gridcolor: '#E6E2DB', zeroline: false, fixedrange: false },
      yaxis: { title: { text: 'Observations', standoff: 8 }, gridcolor: '#E6E2DB', zeroline: false, rangemode: 'tozero', tickformat: ',d' },
      bargap: .05,
    }, { responsive: true, displaylogo: false, scrollZoom: false,
      modeBarButtonsToRemove: ['select2d', 'lasso2d', 'autoScale2d'],
      toImageButtonOptions: { format: 'svg', filename: `form-${feature}-${scale}` } });
  } catch (error) {
    if (element.isConnected) element.textContent = error.message;
  }
}
export function purgeCharts(root) {
  if (globalThis.Plotly) root.querySelectorAll('.research-chart').forEach(el => globalThis.Plotly.purge(el));
}
