import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { Window } from 'happy-dom';
import { createApp } from '../js/main.js';
import { SAVE_KEY } from '../js/state.js';

const data = Object.fromEntries(['summary', 'charts', 'verification'].map(name => [name, JSON.parse(fs.readFileSync(new URL(`../data/${name}.json`, import.meta.url)))]));

function harness({ storage, fetchData } = {}) {
  const window = new Window({ url: 'http://localhost/beyond-the-sparkle/' });
  const document = window.document;
  document.body.innerHTML = '<div id="app"></div><div id="announcer"></div><div id="toast"></div><dialog id="modal"></dialog>';
  const dialog = document.querySelector('dialog');
  // Happy DOM does not implement native modal focus trapping. Browser-level
  // dialog/keyboard/layout behavior is explicitly outside this test's claim.
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new window.Event('close')); };
  const entries = new Map();
  storage ||= { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value) };
  const chartCalls = [];
  const options = { root: document, storage, fetchData: fetchData || (async () => structuredClone(data)),
    drawChart: (element, charts, feature, scale) => { chartCalls.push({ feature, scale }); element.textContent = `${feature} ${scale} plot`; } };
  let app = createApp(options);
  const click = action => {
    const element = document.querySelector(`[data-action="${action}"]`);
    assert.ok(element, `Missing ${action} button in ${app.getScene()}`);
    element.click();
  };
  const tick = async () => { await new Promise(resolve => setTimeout(resolve, 0)); };
  const winBattle = () => { for (const action of ['attack', 'defend', 'attack', 'defend', 'attack']) click(action); };
  const reload = () => { app.destroy(); app = createApp(options); return app; };
  return { document, window, storage, chartCalls, click, tick, winBattle, reload, get app() { return app; },
    cleanup: () => { app.destroy(); window.happyDOM.abort(); } };
}

test('Complete first loop: lose/retry, wrong answer/hint, collect/reload, return, revelation, interactive Codex, shrine', async () => {
  const h = harness();
  try {
    assert.equal(h.app.getScene(), 'landing');
    assert.equal(h.document.querySelector('[data-action="continue"]'), null);
    h.click('new');
    assert.equal(h.app.getScene(), 'shrine');
    h.click('scholars');
    assert.equal(h.app.getState().diamondsReturned.form, false);
    h.click('enter-form');
    h.click('attack'); h.click('attack');
    assert.match(h.document.querySelector('.combat-panel').textContent, /Rise once more/);
    h.click('retry');
    h.winBattle();
    assert.match(h.document.querySelector('.combat-panel').textContent, /clustering inputs/);
    h.document.querySelector('[data-answer="0"]').click();
    assert.ok(h.document.querySelector('.hint'));
    assert.equal(h.app.getState().defeated.form, false);
    h.document.querySelector('[data-answer="1"]').click();
    assert.equal(h.app.getScene(), 'reward');
    h.click('collect');
    assert.equal(h.app.getScene(), 'shrine');
    assert.equal(h.app.getState().diamondsCollected.form, true);
    h.reload(); h.click('continue');
    assert.equal(h.app.getState().diamondsCollected.form, true);
    h.click('pedestal');
    assert.equal(h.app.getState().diamondsReturned.form, true);
    assert.ok(h.document.querySelector('.pedestal-form.lit'));
    h.click('meet-keeper');
    assert.equal(h.app.getScene(), 'stonekeeper');
    h.click('reveal'); await h.tick();
    assert.equal(h.app.getScene(), 'codex');
    assert.equal(h.app.getState().npcInsightsViewed.stonekeeper, true);
    assert.equal(h.document.documentElement.dataset.theme, 'codex');
    assert.match(h.document.querySelector('.metrics').textContent, /53,893/);
    assert.equal(h.chartCalls.length, 2);
    const selector = h.document.querySelector('#feature-0');
    selector.value = 'x'; selector.dispatchEvent(new h.window.Event('change', { bubbles: true }));
    h.click('scale-standardized');
    assert.equal(h.document.querySelector('#feature-0').value, 'x');
    assert.deepEqual(h.chartCalls.at(-2), { feature: 'x', scale: 'standardized' });
    h.click('chart-full');
    assert.ok(h.document.querySelector('#full-chart'));
    h.click('close');
    h.click('shrine');
    assert.match(h.document.querySelector('.quest-card').textContent, /first truth restored/);
    h.click('seal');
    assert.match(h.document.querySelector('#modal').textContent, /1 \/ 3 stones returned/);
    assert.equal(h.app.getState().secretBossUnlocked, false);
  } finally { h.cleanup(); }
});

test('Presenter can jump and resolve implemented scenes; normal save remains byte-for-byte unchanged', async () => {
  const h = harness();
  try {
    h.click('new'); h.click('home');
    const before = h.storage.getItem(SAVE_KEY);
    h.click('presenter');
    assert.equal(h.app.isPresenter(), true);
    h.click('enter-form'); h.click('resolve'); h.click('collect');
    h.click('pedestal'); h.click('meet-keeper'); h.click('reveal'); await h.tick();
    assert.equal(h.app.getScene(), 'codex');
    assert.equal(h.storage.getItem(SAVE_KEY), before);
    const selector = h.document.querySelector('#presenter-scene');
    selector.value = 'chamber'; selector.dispatchEvent(new h.window.Event('change', { bubbles: true }));
    assert.match(h.document.querySelector('.combat-panel').textContent, /TURN 1/);
    h.click('story');
    assert.equal(h.app.getScene(), 'landing');
    assert.equal(h.app.isPresenter(), false);
    assert.equal(h.storage.getItem(SAVE_KEY), before);
    h.click('continue');
    assert.equal(h.app.getState().defeated.form, false);
  } finally { h.cleanup(); }
});

test('New Journey requires explicit replacement and permits cancellation', () => {
  const h = harness();
  try {
    h.click('new'); h.click('enter-form'); h.winBattle();
    h.document.querySelector('[data-answer="1"]').click(); h.click('collect'); h.click('home');
    h.click('new');
    assert.equal(h.app.getState().diamondsCollected.form, true);
    h.click('close');
    assert.equal(h.app.getScene(), 'landing');
    h.click('new'); h.click('new-confirm');
    assert.equal(h.app.getScene(), 'shrine');
    assert.equal(h.app.getState().diamondsCollected.form, false);
  } finally { h.cleanup(); }
});

test('Data load failure keeps the scholar and progress intact, explains recovery, and permits retry', async () => {
  let attempts = 0;
  const h = harness({ fetchData: async () => { if (!attempts++) throw new Error('Missing summary.json'); return structuredClone(data); } });
  try {
    h.click('presenter');
    const selector = h.document.querySelector('#presenter-scene');
    selector.value = 'stonekeeper'; selector.dispatchEvent(new h.window.Event('change', { bubbles: true }));
    h.click('reveal'); await h.tick();
    assert.equal(h.app.getScene(), 'stonekeeper');
    assert.equal(h.app.getState().npcInsightsViewed.stonekeeper, false);
    assert.match(h.document.querySelector('dialog').textContent, /Missing summary.json/);
    h.click('close'); h.click('reveal'); await h.tick();
    assert.equal(h.app.getScene(), 'codex');
  } finally { h.cleanup(); }
});

test('Accessibility DOM check: semantic buttons, action focus, live status, motion toggle, chart table', () => {
  const h = harness();
  try {
    h.click('motion');
    assert.equal(h.document.documentElement.dataset.motion, 'reduced');
    assert.equal(h.document.activeElement.dataset.action, 'motion');
    h.click('new'); h.click('enter-form'); h.click('defend');
    assert.equal(h.document.activeElement.dataset.action, 'defend');
    for (const button of h.document.querySelectorAll('[data-action]')) {
      assert.equal(button.tagName, 'BUTTON');
      assert.ok(button.textContent.trim() || button.getAttribute('aria-label'));
    }
    assert.ok(h.document.querySelector('.hp-pips[aria-label]'));
  } finally { h.cleanup(); }
});

test('A research request completing after leaving Presenter Mode cannot change the normal journey', async () => {
  let finish;
  const h = harness({ fetchData: () => new Promise(resolve => { finish = resolve; }) });
  try {
    h.click('new'); h.click('home');
    const before = h.storage.getItem(SAVE_KEY);
    h.click('presenter');
    const selector = h.document.querySelector('#presenter-scene');
    selector.value = 'stonekeeper'; selector.dispatchEvent(new h.window.Event('change', { bubbles: true }));
    h.click('reveal');
    h.click('story');
    finish(structuredClone(data)); await h.tick();
    assert.equal(h.app.getScene(), 'landing');
    assert.equal(h.storage.getItem(SAVE_KEY), before);
    assert.equal(h.app.getStory().npcInsightsViewed.stonekeeper, false);
  } finally { h.cleanup(); }
});
