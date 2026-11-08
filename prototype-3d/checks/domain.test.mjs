import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initialState, reduce, normalize, load, save, SAVE_KEY, secretUnlocked, archiveUnlocked } from '../src/progress.js';
import { MAIN_CHAPTERS,CHAPTERS,FINALE,nextMystery } from '../src/chapters.js';
import { newBattle, takeTurn,nextMove } from '../src/combat.js';
import { scatterTraces } from '../src/codex.js';

const orders=[['form','division','memory'],['form','memory','division'],['division','form','memory'],['division','memory','form'],['memory','form','division'],['memory','division','form']];
for(const order of orders)test(`all checkpoints and ending in order ${order.join(' → ')}`,()=>{
  let state=reduce(initialState(),{type:'START'});const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  for(const [index,id] of order.entries()){
    for(const type of ['TRIAL','DEFEAT','COLLECT','PLACE']){state=reduce(state,{type,id});assert.ok(save(storage,state));assert.deepEqual(load(storage).state,state);}
    assert.equal(secretUnlocked(state),index===2);assert.equal(state.bosses[id].revealed,false);
  }
  state=reduce(state,{type:'TRIAL',id:'exile'});state=reduce(state,{type:'DEFEAT',id:'exile'});assert.equal(archiveUnlocked(state),false);assert.equal(reduce(state,{type:'END'}).ended,false);
  state=reduce(state,{type:'COLLECT',id:'exile'});assert.equal(archiveUnlocked(state),true);state=reduce(state,{type:'END'});assert.equal(state.ended,true);save(storage,state);assert.equal(JSON.parse(values.get(SAVE_KEY)).ended,true);
});
test('malformed saves and impossible progress do not bypass locks',()=>{
  const forged={...initialState(),started:true,lastLocation:'archive',ended:true,bosses:Object.fromEntries([...MAIN_CHAPTERS,'exile'].map(id=>[id,{collected:true,placed:true,revealed:true}]))};
  const normalized=normalize(forged);assert.equal(secretUnlocked(normalized),false);assert.equal(archiveUnlocked(normalized),false);assert.equal(normalized.ended,false);assert.equal(normalized.lastLocation,'shrine');
  assert.ok(load({getItem:()=>'{broken'}).error);assert.equal(save({setItem:()=>{throw Error('blocked');}},normalized),false);
});
test('different configured encounters reward reading telegraphs; blind attacks can lose',()=>{
  for(const id of [...MAIN_CHAPTERS,'exile']){
    let b=newBattle(id);for(let i=0;i<25&&b.phase==='battle';i++)b=takeTurn(b,nextMove(b).damage>=2?'defend':'attack');assert.equal(b.phase,'won',id);assert.ok(b.player>0);assert.equal(takeTurn(b,'attack'),b);
    let lost=newBattle(id);for(let i=0;i<15&&lost.phase==='battle';i++)lost=takeTurn(lost,'attack');assert.equal(lost.phase,'lost',id);assert.equal(takeTurn(lost,'defend'),lost);
  }
  const b={...newBattle('exile'),boss:4};assert.equal(nextMove(b).name,'The forgotten oath');assert.equal(newBattle('form',true).phase,'won');
});

test('the Archive alone resolves the theft; saved discoveries preserve old checkpoint compatibility',()=>{
  for(const c of Object.values(CHAPTERS))assert.doesNotMatch([c.intro,c.victory,c.recovery,c.lore,...c.dialogue].join(' '),/never (stolen|lost)/i);
  assert.match(FINALE[0],/never stolen/);
  let s=reduce(initialState(),{type:'START'});s=reduce(s,{type:'DISCOVER',id:'form'});assert.equal(s.bosses.form.discovered,true);
  assert.equal(normalize({...s,bosses:{...s.bosses,form:{challenged:true}}}).bosses.form.discovered,true);
  assert.match(nextMystery(s,'form'),/Hall of Division/);
  const source=JSON.parse(fs.readFileSync(new URL('../public/data/challenge-records.json',import.meta.url)));
  const raw=fs.readFileSync(new URL('../../reference/diamonds 2.csv',import.meta.url),'utf8').trim().split(/\r?\n/);
  for(const r of source.records){const values=raw[r.record].split(',');assert.equal(+values[1],r.carat);assert.equal(+values[10],r.z);}
  assert.equal(source.records.find(r=>r.record===2208).z,0);
});
test('verified exports and semantic scatter labels agree with the supplied full-data findings',()=>{
  const read=name=>JSON.parse(fs.readFileSync(new URL(`../../data/${name}.json`,import.meta.url),'utf8'));
  const summary=read('summary'),profiles=read('cluster_profiles'),sample=read('pca_sample'),verification=read('verification');
  for(const name of ['summary','cluster_profiles','charts','pca_sample','verification'])assert.deepEqual(fs.readFileSync(new URL(`../public/data/${name}.json`,import.meta.url)),fs.readFileSync(new URL(`../../data/${name}.json`,import.meta.url)),`${name} must ship unchanged`);
  assert.deepEqual(fs.readFileSync(new URL('../public/research/project.ipynb',import.meta.url)),fs.readFileSync(new URL('../../reference/project_PCA_1_(2).ipynb',import.meta.url)));
  assert.ok(verification.passed&&verification.checks.every(c=>c.passed));assert.equal(summary.counts.clean,53893);assert.equal(summary.dbscan.after.label_counts[0]+summary.dbscan.after.noise,53893);assert.equal(summary.dbscan.after.noise,311);assert.ok(Math.abs(summary.pca.retained-.8812206138419638)<1e-12);assert.equal(sample.count,sample.rows.length);
  for(const fit of ['before','after']){
    const traces=scatterTraces({summary,profiles,sample},'kmeans',fit);assert.equal(traces.reduce((n,t)=>n+t.x.length,0),sample.count);
    assert.equal(traces.find(t=>t.name==='Larger diamonds').marker.color,'#C6A574');assert.equal(traces.find(t=>t.name==='Smaller diamonds').marker.color,'#82B5C6');
  }
  assert.equal(profiles.before.find(p=>p.semantic==='larger').raw_label,0);assert.equal(profiles.after.find(p=>p.semantic==='larger').raw_label,1);
  for(const fit of ['before','after'])assert.equal(scatterTraces({summary,profiles,sample},'dbscan',fit).reduce((n,t)=>n+t.x.length,0),sample.count);
});
