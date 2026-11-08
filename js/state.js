export const SAVE_KEY = 'beyond-the-sparkle.story.v1';
export const clone = value => JSON.parse(JSON.stringify(value));
export function initialState() {
  return {
    version: 1, mode: 'story', started: false,
    defeated: { form: false, division: false, memory: false, exile: false },
    diamondsCollected: { form: false, division: false, memory: false, eclipse: false },
    diamondsReturned: { form: false, division: false, memory: false },
    npcInsightsViewed: { stonekeeper: false, divider: false, seer: false, exile: false },
    secretBossUnlocked: false, archiveUnlocked: false, endingCompleted: false,
    audioMuted: true, reducedMotion: false, lastScene: 'shrine',
  };
}

export function normalize(input) {
  if (!input || input.version !== 1) return initialState();
  const state = initialState();
  state.started = input.started === true;
  state.audioMuted = input.audioMuted !== false;
  state.reducedMotion = input.reducedMotion === true;
  // M0–1 accepts only the implemented chapter. Impossible dependent flags
  // are discarded so stale or edited saves cannot bypass narrative locks.
  state.defeated.form = input.defeated?.form === true && state.started;
  state.diamondsCollected.form = input.diamondsCollected?.form === true && state.defeated.form;
  state.diamondsReturned.form = input.diamondsReturned?.form === true && state.diamondsCollected.form;
  state.npcInsightsViewed.stonekeeper = input.npcInsightsViewed?.stonekeeper === true && state.diamondsReturned.form;
  const available = ['shrine', 'chamber'];
  if (state.defeated.form && !state.diamondsCollected.form) available.push('reward');
  if (state.diamondsReturned.form) available.push('stonekeeper');
  if (state.npcInsightsViewed.stonekeeper) available.push('codex');
  state.lastScene = available.includes(input.lastScene) ? input.lastScene : 'shrine';
  return state;
}

export function reduce(state, action) {
  const next = clone(state);
  switch (action.type) {
    case 'START': next.started = true; next.lastScene = 'shrine'; break;
    case 'DEFEAT': if (next.started && action.chapter === 'form') next.defeated.form = true; break;
    case 'COLLECT': if (next.defeated.form) next.diamondsCollected.form = true; break;
    case 'RETURN': if (next.diamondsCollected.form) next.diamondsReturned.form = true; break;
    case 'INSIGHT': if (next.diamondsReturned.form) next.npcInsightsViewed.stonekeeper = true; break;
    case 'SCENE': next.lastScene = action.scene; break;
    case 'MOTION': next.reducedMotion = !next.reducedMotion; break;
    case 'SOUND': next.audioMuted = !next.audioMuted; break;
    default: return state;
  }
  return normalize(next);
}

export function readSave(storage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return { state: initialState(), exists: false, error: null };
    const input = JSON.parse(raw);
    if (input?.version !== 1) return { state: initialState(), exists: false, error: 'This save version cannot be loaded.' };
    const state = normalize(input);
    return { state, exists: state.started, error: null };
  } catch { return { state: initialState(), exists: false, error: 'Saving is unavailable or the save is unreadable. This journey can still be played in this session.' }; }
}

export function writeSave(storage, state) {
  try { storage.setItem(SAVE_KEY, JSON.stringify(normalize(state))); return true; }
  catch { return false; }
}

export function objective(state) {
  if (!state.defeated.form) return ['The first fragment', 'Enter the Chamber of Form and face the Hollow Scale.'];
  if (!state.diamondsCollected.form) return ['A stone remembers', 'Recover the Diamond of Form.'];
  if (!state.diamondsReturned.form) return ['Bring it home', 'Place the Diamond of Form on its shrine pedestal.'];
  if (!state.npcInsightsViewed.stonekeeper) return ['An oath unbound', 'Speak with the Stonekeeper and reveal his knowledge.'];
  return ['The first truth restored', 'Explore the Research Codex. Two chapters still await their telling.'];
}
