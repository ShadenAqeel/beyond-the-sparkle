import { CHAPTERS } from './chapters.js';
let dataPromise, plotlyPromise;
const base = import.meta.env?.BASE_URL || './';
export function loadResearch() {
  if (!dataPromise) dataPromise = Promise.all(['summary', 'cluster_profiles', 'charts', 'pca_sample', 'verification'].map(async name => {
    const response = await fetch(`${base}data/${name}.json`); if (!response.ok) throw new Error('The verified research files could not be loaded.'); return response.json();
  })).then(([summary, profiles, charts, sample, verification]) => {
    if (!summary.verified || !verification.passed || sample.rows.length !== sample.count || sample.population !== summary.counts.clean) throw new Error('Research verification failed. No unverified figures will be shown.');
    return { summary, profiles, charts, sample };
  }).catch(error => { dataPromise = null; throw error; });
  return dataPromise;
}
function loadPlotly() {
  if (globalThis.Plotly) return Promise.resolve(globalThis.Plotly);
  if (!plotlyPromise) plotlyPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script'); script.src = `${base}vendor/plotly-basic-2.35.2.min.js`;
    script.onload = () => resolve(globalThis.Plotly); script.onerror = () => { script.remove(); plotlyPromise = null; reject(new Error('The local chart library could not load. The verified text and source files remain available.')); }; document.head.append(script);
  }); return plotlyPromise;
}
const fmt = n => n.toLocaleString('en-US'), percent = n => `${(n * 100).toFixed(2)}%`;
export function scatterTraces(data, method, fit) {
  const { sample, profiles } = data, column = sample.columns.indexOf(`${method}_${fit}`), pc1 = sample.columns.indexOf('pc1'), pc2 = sample.columns.indexOf('pc2');
  const groups = method === 'kmeans' ? profiles[fit].map(p => ({ id: p.raw_label, label: `${p.semantic === 'larger' ? 'Larger' : 'Smaller'} diamonds`, color: p.color })) : [...new Set(sample.rows.map(r => r[column]))].sort((a,b) => a-b).map(id => ({ id, label: id === -1 ? 'Noise (−1)' : id === 0 ? 'Main dense cluster' : 'Small dense cluster', color: id === -1 ? '#A56E75' : id === 0 ? '#8DAE9B' : '#C6A574' }));
  return groups.map(group => {
    const rows = sample.rows.filter(r => r[column] === group.id);
    return { type: 'scatter', mode: 'markers', name: group.label, x: rows.map(r => r[pc1]), y: rows.map(r => r[pc2]), customdata: rows.map(r => [r[0], group.id, r[7]]), marker: { color: group.color, size: group.id === -1 ? 5 : 4, opacity: .68, symbol: group.id === -1 ? 'x' : 'circle' }, hovertemplate: `${group.label}<br>PC1 %{x:.2f} · PC2 %{y:.2f}<br>Raw label %{customdata[1]}<br>Source row %{customdata[0]} · %{customdata[2]} ct<extra></extra>` };
  });
}
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const metric = (value, label) => `<span>${escape(value)}<small>${escape(label)}</small></span>`;
function sourceLinks() { return `<details class="research-details"><summary>Sources and method details</summary><p>All values come from the supplied notebook’s verified export. Scatter points are a reproducible visualization sample; counts and medians use all cleaned records. No model is fitted in this browser.</p><a href="${base}research/project.ipynb" download>Download the original notebook</a> · <a href="${base}data/summary.json" target="_blank" rel="noopener">Verified summary</a> · <a href="${base}data/pca_sample.json" target="_blank" rel="noopener">Projection sample</a></details>`; }

export function createCodex({ getState, isPresenter, notify }) {
  const dialog = document.getElementById('codex'); let selected = 'form', ticket = 0;
  function available(id) { const s = getState(); return isPresenter() || s.ended || (id === 'truth' ? false : id === 'exile' ? s.bosses.exile.collected : s.bosses[id]?.revealed); }
  function purge() { if (globalThis.Plotly) dialog.querySelectorAll('.research-chart').forEach(el => globalThis.Plotly.purge(el)); }
  async function open(requested) {
    selected = requested || ['form','division','memory','exile','truth'].find(available) || 'index';
    if (selected !== 'index' && !available(selected)) { notify('That research fragment is waiting for its scholar’s revelation.'); return; }
    if (!dialog.open) dialog.showModal(); await render();
  }
  async function render() {
    const current = ++ticket; purge();
    dialog.innerHTML = `<button class="close" id="close-codex" aria-label="Close Research Codex">×</button><p class="eyebrow">THE RESEARCH CODEX / THE ORDER’S FIELD NOTES</p><nav class="codex-tabs" aria-label="Research chapters">${['form','division','memory','exile','truth'].map(id => `<button data-tab="${id}" aria-current="${selected === id ? 'page' : 'false'}" aria-disabled="${!available(id)}">${id === 'truth' ? 'The Truth' : CHAPTERS[id].name}${available(id) ? '' : ' · locked'}</button>`).join('')}</nav><div id="codex-body" aria-live="polite"><p>Opening the verified records…</p></div>`;
    dialog.querySelector('#close-codex').onclick = () => dialog.close();
    dialog.querySelectorAll('[data-tab]').forEach(button => button.onclick = () => open(button.dataset.tab));
    let d; try { d = await loadResearch(); } catch (error) { if (current === ticket) dialog.querySelector('#codex-body').textContent = error.message; return; }
    if (ticket !== current || !dialog.open) return;
    const { summary:s, profiles, charts, sample } = d, body = dialog.querySelector('#codex-body');
    if (selected === 'index') { body.innerHTML = '<h2>Fragments still wait.</h2><p>Restore a diamond, speak with its scholar, and record the discovery here. You can finish the story without opening every chart.</p>'; return; }
    const heading = { form:['Before a pattern, a measurement.', 'The Stonekeeper’s revelation'], division:['A division is not a judgment.', 'The Divider’s revelation'], memory:['What the mirror preserves.', 'The Seer’s revelation'], exile:['Outside a chosen boundary.', 'The Exile’s revelation'], truth:['The legacy was a question.', 'The Hidden Archive / the complete evidence'] }[selected];
    let content = '';
    if (selected === 'form') content = `<p>The study began with physical form. Invalid or inconsistent dimensions were removed, then six numerical measurements were standardized.</p><div class="research-line">${metric(fmt(s.counts.original),'Original records')}${metric(fmt(s.counts.removed),'Removed')}${metric(fmt(s.counts.clean),'Clean records')}${metric(s.metadata.features.length,'Physical inputs')}</div><p><b>Inputs:</b> ${s.metadata.features.join(', ')}. <b>Excluded:</b> ${s.metadata.excluded_from_model.join(', ')}.</p><div class="chart-controls"><button data-plot="carat">Carat distribution</button><button data-plot="depth">Depth distribution</button></div><div class="research-chart" id="research-chart"></div><div id="chart-caption"></div><details class="research-details"><summary>What was cleaned and scaled?</summary><p>Remove nonpositive x/y/z or depth discrepancies greater than five percentage points. The 47 removed records overlap: 20 nonpositive dimensions and 40 depth inconsistencies, with 13 in both sets. Duplicate records were retained. StandardScaler puts each feature on a common scale before distance-based clustering.</p></details>`;
    if (selected === 'division') content = `<p>K-Means partitioned the six standardized physical measurements into two groups. The scatter uses PC1/PC2 coordinates to display the labels fitted in six dimensions.</p><div class="research-line">${profiles.before.map(p => metric(`${p.medians.carat.toFixed(2)} ct`,`${p.semantic} group median weight`)).join('')}</div><div class="profile-comparison">${profiles.before.map(p => `<p><strong style="color:${p.color}">${p.semantic === 'larger' ? 'Larger' : 'Smaller'} diamonds · raw label ${p.raw_label}</strong><br>${fmt(p.count)} records · median price $${p.medians.price.toLocaleString('en-US',{minimumFractionDigits:2})}</p>`).join('')}</div><p class="research-caveat">Price was excluded from fitting. These price differences are associations observed afterward, not causality or quality grades.</p><div class="chart-controls"><button data-plot="before">Projected K-Means groups</button><button data-plot="medians">Median weights and prices</button></div><div class="research-chart" id="research-chart"></div><div id="chart-caption"></div>`;
    if (selected === 'memory') content = `<p>Two principal components summarize six standardized physical inputs, retaining <strong>${percent(s.pca.retained)} of variance</strong>. ${percent(s.pca.not_retained)} is not retained; this is not a percentage of certainty or prediction accuracy.</p><div class="research-line">${metric(percent(s.pca.explained_variance_ratio[0]),'PC1')}${metric(percent(s.pca.explained_variance_ratio[1]),'PC2')}${metric(percent(s.pca.retained),'Together')}</div><div class="chart-controls"><button data-plot="variance">Variance retained</button><button data-plot="before">K-Means before PCA</button><button data-plot="after">K-Means after PCA</button><button data-plot="silhouette">Silhouette comparison</button></div><p class="research-caveat">${escape(s.caveats.silhouette)} Raw cluster IDs reverse between the fits; colors follow larger/smaller median-carat identity.</p><div class="research-chart" id="research-chart"></div><div id="chart-caption"></div>`;
    if (selected === 'exile') content = `<p>DBSCAN asks where dense regions lie rather than forcing a partition into two groups.</p><div class="research-line">${metric(fmt(s.dbscan.after.label_counts['0']),'Main cluster after PCA')}${metric(fmt(s.dbscan.after.noise),'Noise after PCA')}${metric(s.dbscan.after.clusters,'Dense cluster')}</div><p>Before PCA: ${fmt(s.dbscan.before.label_counts['0'])} in the main cluster, ${fmt(s.dbscan.before.label_counts['1'])} in a small second cluster, and ${fmt(s.dbscan.before.noise)} noise observations. After PCA: ${fmt(s.dbscan.after.label_counts['0'])} in one cluster and ${fmt(s.dbscan.after.noise)} noise observations.</p><div class="chart-controls"><button data-plot="before">DBSCAN before PCA</button><button data-plot="after">DBSCAN after PCA</button></div><p class="research-caveat">Noise is relative to density settings, not a defect classification. eps changed from ${s.dbscan.before.eps} to ${s.dbscan.after.eps}; both used min_samples=${s.dbscan.after.min_samples}. These are not a controlled comparison with fixed settings. Silhouette includes noise as a group.</p><div class="research-chart" id="research-chart"></div><div id="chart-caption"></div>`;
    if (selected === 'truth') content = `<div class="truth-summary"><p><b>Simplification.</b> Six physical measurements → two principal components, retaining ${percent(s.pca.retained)} of variance.</p><p><b>Patterns, not worth.</b> K-Means found two size-based groups. Price differed afterward, although price was not an input.</p><p><b>A measured conclusion.</b> PCA makes a two-dimensional view possible. Silhouettes of ${s.kmeans.silhouette.before.toFixed(3)} and ${s.kmeans.silhouette.after.toFixed(3)} use different spaces and do not prove overall improvement. DBSCAN’s one main cluster and ${fmt(s.dbscan.after.noise)} noise points offer a different perspective.</p></div><div class="research-chart" id="research-chart"></div><div id="chart-caption"></div><p>The diamonds represent story chapters; they are not four statistical clusters or historical stones from this dataset.</p>`;
    body.innerHTML = `<h2 tabindex="-1">${heading[0]}</h2><p class="codex-lead">${heading[1]}</p>${content}${sourceLinks()}<p class="asset-credit">Stonekeeper and character variants adapted from <a href="https://bake3d.ai/free-3d-models" target="_blank" rel="noopener">Old Man by Bake3D</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Costumes, presentation, geometry and textures adapted for this game.</p>`;
    const chapter = selected;
    async function plot(kind) {
      const element = body.querySelector('#research-chart'); if (!element) return;
      body.querySelectorAll('[data-plot]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.plot === kind)));
      let traces, title, xTitle = 'PC1', yTitle = 'PC2', layout = {}, caption = '';
      if (chapter === 'form') {
        const hist = charts.distributions[kind], units = kind === 'carat' ? 'carats' : 'percent';
        traces = [{ type:'bar',x:hist.counts.map((_,i)=>(hist.edges[i]+hist.edges[i+1])/2), y:hist.counts, marker:{color:'#C6A574'}, hovertemplate:'%{x:.2f}<br>%{y:,} observations<extra></extra>' }]; title = `${kind === 'carat' ? 'Carat' : 'Depth'} · full cleaned dataset`; xTitle = `${kind} (${units})`; yTitle = 'Observations';
        caption = `<details><summary>Accessible histogram counts</summary><div class="research-table"><table><thead><tr><th>Bin start</th><th>Bin end</th><th>Count</th></tr></thead><tbody>${hist.counts.map((n,i)=>`<tr><td>${hist.edges[i].toFixed(3)}</td><td>${hist.edges[i+1].toFixed(3)}</td><td>${fmt(n)}</td></tr>`).join('')}</tbody></table></div></details>`;
      } else if (kind === 'variance') { traces = [{type:'bar',x:['PC1','PC2','Not retained'],y:[...s.pca.explained_variance_ratio,s.pca.not_retained].map(n=>n*100),marker:{color:['#C6A574','#82B5C6','#A56E75']}}]; title='Variance retained by the PCA representation';xTitle='Component';yTitle='Variance (%)'; }
      else if (kind === 'silhouette') { traces = [{type:'bar',x:['Standardized 6D','PCA 2D'],y:[s.kmeans.silhouette.before,s.kmeans.silhouette.after],marker:{color:['#C6A574','#82B5C6']}}];title='K-Means silhouette in each fitting space';xTitle='Different feature spaces';yTitle='Silhouette';caption=escape(s.caveats.silhouette);layout.yaxis={range:[0,1]}; }
      else if (kind === 'medians') {
        traces = [{type:'bar',name:'Median carat',x:profiles.before.map(p=>p.semantic),y:profiles.before.map(p=>p.medians.carat),marker:{color:profiles.before.map(p=>p.color)}},{type:'bar',name:'Median price (USD)',x:profiles.before.map(p=>p.semantic),y:profiles.before.map(p=>p.medians.price),yaxis:'y2',xaxis:'x2',marker:{color:profiles.before.map(p=>p.color)}}];title='Full-data original-space group medians';xTitle='Group';yTitle='Median carat';layout.grid={rows:1,columns:2,pattern:'independent'};layout.xaxis2={title:'Group'};layout.yaxis2={title:'Median price (USD)'};caption='Price is an observed association, not a clustering input.';
      } else { const method=chapter==='exile'?'dbscan':'kmeans',fit=kind==='after'?'after':'before';traces=scatterTraces(d,method,fit);title=`${method==='dbscan'?'DBSCAN':'K-Means'} ${fit==='before'?'before':'after'} PCA · shared PC coordinates`;caption=`Visualization sample: ${fmt(sample.count)} of ${fmt(sample.population)} cleaned observations. Labels come from the ${fit==='before'?'standardized six-dimensional':'two-dimensional PCA'} fit. KPIs use the full population.`; }
      body.querySelector('#chart-caption').innerHTML = caption;
      element.textContent='Drawing the verified evidence…'; element.setAttribute('aria-label', title);
      try { const Plotly = await loadPlotly(); if (ticket !== current || !element.isConnected || chapter !== selected || !dialog.open) return;
        element.textContent=''; await Plotly.newPlot(element,traces,{paper_bgcolor:'#FFFFFF',plot_bgcolor:'#FFFFFF',font:{family:'Inter, sans-serif',color:'#252B30',size:11},title:{text:title,font:{size:13}},margin:{l:60,r:25,t:45,b:55},xaxis:{title:xTitle,gridcolor:'#E6E2DB'},yaxis:{title:yTitle,gridcolor:'#E6E2DB'},legend:{orientation:'h'},...layout},{responsive:true,displaylogo:false,scrollZoom:false,toImageButtonOptions:{format:'svg',filename:`research-${chapter}-${kind}`}});
      } catch(error) { if(element.isConnected) element.textContent=error.message; }
    }
    body.querySelectorAll('[data-plot]').forEach(button=>button.onclick=()=>plot(button.dataset.plot));
    await plot({form:'carat',division:'before',memory:'variance',exile:'after',truth:'after'}[selected]);
  }
  dialog.addEventListener('close', () => { ticket++; purge(); });
  return { open, isOpen: () => dialog.open, close: () => dialog.close() };
}
