import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initialState, reduce, readSave, writeSave, SAVE_KEY, normalize } from '../js/state.js';
import { newBattle, takeTurn, telegraph } from '../js/combat.js';
import { validateData } from '../js/data.js';
import { histogramSpec } from '../js/charts.js';

const json = name => JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`, import.meta.url)));
const memory = () => {
  const entries = new Map();
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
};

test('Heavy defense followed by guarded attacks wins; no timed input is needed', () => {
  let battle = newBattle();
  assert.equal(telegraph(battle).damage, 1);
  battle = takeTurn(battle, 'attack');
  assert.equal(battle.player, 2);
  assert.equal(telegraph(battle).damage, 2);
  battle = takeTurn(battle, 'defend');
  assert.equal(battle.player, 2);
  assert.equal(battle.guard, 1);
  battle = takeTurn(battle, 'attack');
  assert.equal(battle.guard, 0);
  assert.equal(battle.player, 2);
  battle = takeTurn(battle, 'defend');
  battle = takeTurn(battle, 'attack');
  assert.equal(battle.phase, 'question');
  assert.equal(battle.boss, 0);
  assert.equal(battle.player, 2);
  assert.deepEqual(takeTurn(battle, 'attack'), battle);
});

test('Reckless attacks lose; retry returns fresh HP without touching progress', () => {
  const state = reduce(initialState(), { type: 'START' });
  const stateSnapshot = structuredClone(state);
  let battle = newBattle();
  battle = takeTurn(takeTurn(battle, 'attack'), 'attack');
  assert.equal(battle.phase, 'lost');
  assert.equal(battle.player, 0);
  assert.deepEqual(newBattle(), { player: 3, boss: 3, turn: 0, guard: 0, phase: 'battle', log: ['The Hollow Scale stirs. Read its next move before you act.'] });
  assert.deepEqual(state, stateSnapshot);
});

test('Guard blocks at most one point on the next attack, including heavy moves', () => {
  let battle = takeTurn(newBattle(), 'defend');
  battle = takeTurn(battle, 'attack');
  assert.equal(battle.player, 2);
  assert.equal(battle.guard, 0);
  assert.equal(battle.boss, 2);
});

test('Progress requires victory → collection → return → revelation; repeated return is idempotent', () => {
  let state = reduce(initialState(), { type: 'START' });
  for (const type of ['INSIGHT', 'RETURN', 'COLLECT']) state = reduce(state, { type });
  assert.equal(state.npcInsightsViewed.stonekeeper, false);
  assert.equal(state.diamondsReturned.form, false);
  state = reduce(state, { type: 'DEFEAT', chapter: 'form' });
  state = reduce(state, { type: 'SCENE', scene: 'reward' });
  assert.equal(state.lastScene, 'reward');
  state = reduce(state, { type: 'COLLECT' });
  assert.equal(state.diamondsReturned.form, false);
  state = reduce(state, { type: 'RETURN' });
  assert.deepEqual(reduce(state, { type: 'RETURN' }), state);
  state = reduce(state, { type: 'INSIGHT' });
  assert.equal(state.npcInsightsViewed.stonekeeper, true);
  assert.equal(state.secretBossUnlocked, false);
});

test('Reload preserves a valid checkpoint; invalid/future saves cannot bypass locks', () => {
  const storage = memory();
  let state = reduce(initialState(), { type: 'START' });
  state = reduce(state, { type: 'DEFEAT', chapter: 'form' });
  state = reduce(state, { type: 'COLLECT' });
  assert.equal(writeSave(storage, state), true);
  assert.deepEqual(readSave(storage).state, state);
  assert.equal(readSave(storage).exists, true);
  storage.setItem(SAVE_KEY, '{broken json');
  assert.equal(readSave(storage).exists, false);
  storage.setItem(SAVE_KEY, JSON.stringify({ version: 999, started: true }));
  assert.equal(readSave(storage).exists, false);
  const illegal = normalize({ ...initialState(), started: true, lastScene: 'codex',
    npcInsightsViewed: { stonekeeper: true }, diamondsReturned: { form: true }, secretBossUnlocked: true });
  assert.equal(illegal.npcInsightsViewed.stonekeeper, false);
  assert.equal(illegal.lastScene, 'shrine');
  assert.equal(illegal.secretBossUnlocked, false);
  const unavailable = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  assert.equal(readSave(unavailable).exists, false);
  assert.equal(writeSave(unavailable, state), false);
});

test('Data contract and every histogram use the full clean population', () => {
  const data = { summary: json('summary'), charts: json('charts'), verification: json('verification') };
  validateData(data);
  for (const f of data.summary.metadata.features) {
    for (const scale of ['original', 'standardized']) {
      const spec = histogramSpec(data.charts, f, scale);
      assert.equal(spec.trace.y.reduce((a, b) => a + b, 0), 53893);
      assert.equal(spec.trace.x.length, 40);
    }
  }
  const bad = structuredClone(data);
  bad.charts.distributions.carat.counts[0]++;
  assert.throws(() => validateData(bad), /Invalid full-data histogram/);
});

test('Sample positions are unique original rows; joint strata and semantic colors are consistent', () => {
  const sample = json('pca_sample'), profiles = json('cluster_profiles');
  const columns = Object.fromEntries(sample.columns.map((c, i) => [c, i]));
  assert.equal(new Set(sample.rows.map(row => row[0])).size, sample.count);
  assert.equal(sample.strata.reduce((a, s) => a + s.population, 0), 53893);
  assert.equal(sample.strata.reduce((a, s) => a + s.sample, 0), sample.count);
  for (const space of ['before', 'after']) {
    const groups = profiles[space];
    const large = groups.find(g => g.semantic === 'larger');
    const small = groups.find(g => g.semantic === 'smaller');
    assert.ok(large.medians.carat > small.medians.carat);
    assert.equal(large.color, '#C6A574'); assert.equal(small.color, '#82B5C6');
    assert.ok(sample.rows.every(row => groups.some(g => g.raw_label === row[columns[`kmeans_${space}`]])));
  }
});
