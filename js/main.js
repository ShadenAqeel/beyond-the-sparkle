import { initialState, clone, reduce, readSave, writeSave, objective } from './state.js';
import { newBattle, takeTurn } from './combat.js';
import { question } from './dialogue.js';
import { sceneRegistry, header, landingScene, shrineScene, chamberScene, rewardScene, keeperScene } from './scenes.js';
import { codexScene, labels } from './codex.js';
import { loadData } from './data.js';
import { drawHistogram, histogramTable, purgeCharts } from './charts.js';
import { setAmbience } from './audio.js';
import { icon } from './icons.js';

export function createApp({ root, storage, fetchData = loadData, drawChart = drawHistogram }) {
  const saved = readSave(storage);
  let story = saved.state, preview = null, storyScene = 'landing', scene = 'landing';
  let battle = newBattle(), hint = false, data = null, scale = 'original';
  const chartFeatures = ['carat', 'depth'];
  let narrativeHidden = false, toastTimer, modalReturnFocus, navigationRevision = 0;
  const app = root.querySelector('#app');
  const dialog = root.querySelector('#modal');
  const announcer = root.querySelector('#announcer');
  const toastElement = root.querySelector('#toast');
  const state = () => preview || story;
  const notify = text => {
    announcer.textContent = '';
    queueMicrotask(() => { announcer.textContent = text; });
  };
  function toast(text) {
    toastElement.textContent = text;
    toastElement.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastElement.classList.remove('visible'), 6500);
  }
  function dispatch(action) {
    if (preview) preview = reduce(preview, action);
    else {
      story = reduce(story, action);
      if (!writeSave(storage, story)) toast('Progress is kept for this session. Browser storage is unavailable.');
    }
  }
  function closeModal() {
    purgeCharts(dialog);
    dialog.close();
    if (modalReturnFocus?.isConnected) modalReturnFocus.focus();
  }
  function modal(title, body, buttons = '') {
    if (dialog.open) closeModal();
    modalReturnFocus = root.activeElement;
    dialog.innerHTML = `<button class="button icon-button modal-close" data-action="close" aria-label="Close dialog">${icon('close')}</button><p class="eyebrow">BEYOND THE SPARKLE</p><h2 id="modal-title">${title}</h2>${body}<div class="modal-actions">${buttons || '<button class="button secondary" data-action="close">Return to journey</button>'}</div>`;
    dialog.showModal();
  }
  function render() {
    purgeCharts(app);
    const current = state();
    const reduced = current.reducedMotion || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    root.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
    root.documentElement.dataset.theme = sceneRegistry[scene].theme;
    root.body.classList.toggle('hide-narrative', narrativeHidden);
    root.body.classList.toggle('is-presenter', Boolean(preview));
    root.title = `${sceneRegistry[scene].title} — Beyond the Sparkle`;
    let view;
    switch (scene) {
      case 'landing': view = landingScene(current, story.started); break;
      case 'shrine': view = shrineScene(current); break;
      case 'chamber': view = chamberScene(current, battle, hint, Boolean(preview)); break;
      case 'reward': view = rewardScene(); break;
      case 'stonekeeper': view = keeperScene(); break;
      case 'codex': view = codexScene(data, scale, chartFeatures); break;
    }
    app.innerHTML = header(current, scene, Boolean(preview), story.started) + view;
    if (scene === 'codex') [0, 1].forEach(index => {
      root.querySelector(`#feature-${index}`).value = chartFeatures[index];
      updateChart(index);
    });
  }
  function updateChart(index) {
    const selector = root.querySelector(`#feature-${index}`);
    if (!selector || !data) return;
    const feature = selector.value;
    const element = root.querySelector(`#chart-${index}`);
    root.querySelector(`#chart-table-${index}`).innerHTML = histogramTable(data.charts, feature, scale);
    drawChart(element, data.charts, feature, scale);
  }
  function go(next) {
    const current = state();
    if (!sceneRegistry[next]) return;
    if (next === 'reward' && (!current.defeated.form || current.diamondsCollected.form)) return;
    if (next === 'stonekeeper' && !current.diamondsReturned.form) return;
    if (next === 'codex' && (!current.npcInsightsViewed.stonekeeper || !data)) return;
    navigationRevision++;
    if (next !== 'landing') dispatch({ type: 'SCENE', scene: next });
    scene = next;
    render();
    root.querySelector('#main-content')?.focus({ preventScroll: true });
    globalThis.scrollTo?.({ top: 0, behavior: 'instant' });
    notify(`${sceneRegistry[scene].title}. ${scene === 'shrine' ? objective(current)[1] : ''}`);
  }
  async function reveal() {
    const revision = navigationRevision;
    const presenterAtStart = preview;
    try {
      toast('Opening the verified research…');
      const loaded = await fetchData();
      if (revision !== navigationRevision || presenterAtStart !== preview) return;
      data = loaded;
      dispatch({ type: 'INSIGHT' });
      go('codex');
      toast('The first truth is restored. Explore the measurements below.');
    } catch (error) {
      if (revision !== navigationRevision || presenterAtStart !== preview) return;
      modal('The research could not be opened', `<p>${escapeHtml(error.message)}</p><p>Serve the project through a local HTTP server, then try Reveal Knowledge again. The original source files remain in reference/.</p>`);
    }
  }
  function startJourney() {
    if (dialog.open) closeModal();
    story = initialState(); preview = null; narrativeHidden = false;
    battle = newBattle(); hint = false;
    dispatch({ type: 'START' });
    setAmbience(false).catch(() => {});
    go('shrine');
  }
  function enterPresenter() {
    storyScene = scene;
    preview = reduce(clone(story), { type: 'START' });
    go('shrine');
  }
  async function presenterJump(next) {
    if (!preview || !sceneRegistry[next]) return;
    if (['reward', 'stonekeeper', 'codex'].includes(next)) dispatch({ type: 'DEFEAT', chapter: 'form' });
    if (['stonekeeper', 'codex'].includes(next)) {
      dispatch({ type: 'COLLECT' }); dispatch({ type: 'RETURN' });
    }
    if (next === 'reward') preview.diamondsCollected.form = preview.diamondsReturned.form = preview.npcInsightsViewed.stonekeeper = false;
    if (next === 'chamber') {
      preview = reduce(initialState(), { type: 'START' }); battle = newBattle(); hint = false;
    }
    if (next === 'codex') return reveal();
    go(next);
  }
  async function handleClick(event) {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    const current = state();
    switch (action) {
      case 'home': go('landing'); break;
      case 'new':
        if (story.started) modal('Begin a new journey?', '<p>This replaces your saved story progress. You can close this window to keep your current journey.</p>', '<button class="button secondary" data-action="close">Keep my journey</button><button class="button primary" data-action="new-confirm">Begin New Journey</button>');
        else startJourney();
        break;
      case 'new-confirm': startJourney(); break;
      case 'continue':
        if (story.started) {
          if (story.lastScene === 'codex') { data = await fetchData().catch(() => null); }
          go(story.lastScene === 'codex' && !data ? 'stonekeeper' : story.lastScene);
        }
        break;
      case 'shrine': go('shrine'); break;
      case 'enter-form': battle = newBattle(); hint = false; go('chamber'); break;
      case 'attack': case 'defend': {
        battle = takeTurn(battle, action);
        render();
        const target = battle.phase === 'lost' ? '[data-action="retry"]' : battle.phase === 'question' ? '.answer' : `[data-action="${action}"]`;
        root.querySelector(target)?.focus({ preventScroll: true });
        notify(`${battle.log.at(-1)} ${battle.phase === 'lost' ? 'You fell. Retry the encounter.' : battle.phase === 'question' ? question.text : `Traveler ${battle.player} HP. Guardian ${battle.boss} HP.`}`);
        break;
      }
      case 'retry': battle = newBattle(); hint = false; render(); root.querySelector('[data-action="attack"]')?.focus(); notify('Encounter reset. Both combatants have 3 HP.'); break;
      case 'answer':
        if (battle.phase !== 'question') break;
        if (Number(button.dataset.answer) === question.correct) {
          dispatch({ type: 'DEFEAT', chapter: 'form' }); go('reward');
        } else { hint = true; render(); root.querySelector('.answer')?.focus(); notify(question.hint); }
        break;
      case 'reward': go('reward'); break;
      case 'collect':
        if (!current.defeated.form) break;
        dispatch({ type: 'COLLECT' }); go('shrine'); toast('Diamond of Form recovered. Place it on the matching pedestal.'); break;
      case 'pedestal':
        if (current.diamondsReturned.form) go('stonekeeper');
        else if (current.diamondsCollected.form) {
          dispatch({ type: 'RETURN' }); render(); notify('Diamond of Form placed. The Stonekeeper is free.');
          modal('An oath unbound', '<p class="lore">The stone settles into its ancient place. A warm light reaches the chambers below.</p><p>The Stonekeeper is free. His first revelation is waiting.</p>', '<button class="button secondary" data-action="close">Stay at the shrine</button><button class="button primary" data-action="meet-keeper">Meet the Stonekeeper</button>');
        } else toast('This pedestal awaits the Diamond of Form. Find the Hollow Scale in the Chamber of Form.');
        break;
      case 'meet-keeper': closeModal(); go('stonekeeper'); break;
      case 'stonekeeper': go('stonekeeper'); break;
      case 'scholars': toast('The Stonekeeper is bound until you return the Diamond of Form.'); break;
      case 'reveal': await reveal(); break;
      case 'codex-form': break;
      case 'locked': case 'codex-locked':
        modal(`The ${button.dataset.chapter} chapter awaits`, '<p>This chapter is outside the Milestone 0–1 prototype. Complete Form to restore the first truth. Division and Memory are planned for Milestone 2; Exile and The Truth follow in Milestone 3.</p>'); break;
      case 'seal': modal('A seal of three truths', `<p>The way below requires three returned stones and all three scholars’ revelations.</p><p><b>${Object.values(current.diamondsReturned).filter(Boolean).length} / 3 stones returned</b> · <b>${current.npcInsightsViewed.stonekeeper ? 1 : 0} / 3 revelations viewed</b></p><p>The lower chamber opens in a later milestone.</p>`); break;
      case 'journal': {
        const [title, description] = objective(current);
        modal('The traveler’s journal', `<p class="eyebrow">${title}</p><p>${description}</p><ul class="journal-list"><li>Hollow Scale: ${current.defeated.form ? 'quieted' : 'waiting'}</li><li>Diamond of Form: ${current.diamondsReturned.form ? 'returned to shrine' : current.diamondsCollected.form ? 'in your inventory' : 'not yet collected'}</li><li>Stonekeeper’s revelation: ${current.npcInsightsViewed.stonekeeper ? 'recorded in the Codex' : 'not yet revealed'}</li></ul>`, current.npcInsightsViewed.stonekeeper ? '<button class="button secondary" data-action="close">Close journal</button><button class="button primary" data-action="open-codex">Open Research Codex</button>' : '');
        break;
      }
      case 'open-codex': closeModal(); if (current.npcInsightsViewed.stonekeeper) await reveal(); break;
      case 'scale-original': case 'scale-standardized': {
        scale = action.split('-')[1]; render();
        root.querySelector(`[data-action="${action}"]`)?.focus({ preventScroll: true });
        notify(`Charts now show ${scale === 'original' ? 'original measurement units' : 'standard deviations'}.`);
        break;
      }
      case 'chart-full': {
        const feature = root.querySelector(`#feature-${button.dataset.index}`).value;
        modal(`${labels[feature]} · full-data distribution`, '<div id="full-chart" class="research-chart full-chart" role="img"></div><div id="full-chart-table"></div>');
        dialog.classList.add('chart-modal');
        root.querySelector('#full-chart-table').innerHTML = histogramTable(data.charts, feature, scale);
        drawChart(root.querySelector('#full-chart'), data.charts, feature, scale);
        break;
      }
      case 'presenter': enterPresenter(); break;
      case 'story':
        preview = null; narrativeHidden = false;
        setAmbience(!story.audioMuted).catch(() => {});
        go(storyScene); break;
      case 'resolve': if (preview) { dispatch({ type: 'DEFEAT', chapter: 'form' }); go('reward'); } break;
      case 'narrative': narrativeHidden = !narrativeHidden; render(); break;
      case 'skip-motion': if (preview) { preview.reducedMotion = true; render(); toast('Animations skipped for this presentation.'); } break;
      case 'motion': dispatch({ type: 'MOTION' }); render(); root.querySelector('[data-action="motion"]')?.focus(); toast(state().reducedMotion ? 'Reduced motion enabled.' : 'Motion follows your device preference.'); break;
      case 'sound': {
        const enable = current.audioMuted;
        try { await setAmbience(enable); dispatch({ type: 'SOUND' }); render(); root.querySelector('[data-action="sound"]')?.focus(); toast(enable ? 'Original ambient tones enabled.' : 'Sound muted.'); }
        catch (error) { toast(error.message); }
        break;
      }
      case 'close': closeModal(); break;
    }
  }
  function change(event) {
    if (event.target.matches('.feature-select')) {
      const index = Number(event.target.dataset.index);
      chartFeatures[index] = event.target.value;
      updateChart(index);
    }
    if (event.target.id === 'presenter-scene') presenterJump(event.target.value);
  }
  function dialogClosed() { dialog.classList.remove('chart-modal'); purgeCharts(dialog); }
  root.addEventListener('click', handleClick);
  root.addEventListener('change', change);
  dialog.addEventListener('close', dialogClosed);
  render();
  if (saved.error) toast(saved.error);
  return {
    getState: () => clone(state()), getStory: () => clone(story),
    getScene: () => scene, isPresenter: () => Boolean(preview),
    destroy() { clearTimeout(toastTimer); root.removeEventListener('click', handleClick); root.removeEventListener('change', change); dialog.removeEventListener('close', dialogClosed); purgeCharts(app); },
  };
}
const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

if (globalThis.document?.querySelector('#app')) {
  let storage;
  try { storage = globalThis.localStorage; } catch { storage = null; }
  createApp({ root: document, storage });
}
