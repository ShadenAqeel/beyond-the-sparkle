import { MAIN_CHAPTERS } from './chapters.js';
export const SAVE_KEY = 'beyond-the-sparkle.3d.story.v2';
const ids = [...MAIN_CHAPTERS, 'exile'];
export const copy = value => JSON.parse(JSON.stringify(value));
export function initialState() {
  return { version: 2, started: false, flame: false, ended: false, lastLocation: 'shrine', bosses: Object.fromEntries(ids.map(id => [id, { discovered:false,challenged: false, defeated: false, collected: false, placed: false, revealed: false }])) };
}
export const secretUnlocked = state => MAIN_CHAPTERS.every(id => state.bosses[id].placed);
export const archiveUnlocked = state => state.bosses.exile.collected;
export function normalize(input) {
  const out = initialState(); if (!input || input.version !== 2) return out;
  out.started = input.started === true; out.flame = input.flame === true && out.started;
  for (const id of ids) {
    const src = input.bosses?.[id], dst = out.bosses[id];
    const allowed = out.started && (id !== 'exile' || secretUnlocked(out));
    dst.discovered = allowed && (src?.discovered === true || src?.challenged === true || src?.defeated === true);
    dst.challenged = allowed && (src?.challenged === true || src?.defeated === true);
    dst.defeated = dst.challenged && src?.defeated === true;
    dst.collected = dst.defeated && src?.collected === true;
    dst.placed = id !== 'exile' && dst.collected && src?.placed === true;
    dst.revealed = (id === 'exile' ? dst.collected : dst.placed) && src?.revealed === true;
  }
  out.ended = archiveUnlocked(out) && input.ended === true;
  const locations = ['shrine', ...MAIN_CHAPTERS.map(id => `arena:${id}`)];
  if (MAIN_CHAPTERS.some(id => out.bosses[id].placed)) locations.push('crypt');
  if (secretUnlocked(out)) locations.push('arena:exile');
  if (archiveUnlocked(out)) locations.push('archive');
  out.lastLocation = locations.includes(input.lastLocation) ? input.lastLocation : 'shrine'; return out;
}
export function reduce(state, action) {
  const next = copy(state), boss = next.bosses[action.id];
  switch (action.type) {
    case 'START': next.started = true; break;
    case 'FLAME': next.flame = true; break;
    case 'DISCOVER': if(boss&&(action.id!=='exile'||secretUnlocked(next)))boss.discovered=true;break;
    case 'TRIAL': if (boss && (action.id !== 'exile' || secretUnlocked(next))) boss.challenged = true; break;
    case 'DEFEAT': if (boss?.challenged) boss.defeated = true; break;
    case 'COLLECT': if (boss?.defeated) boss.collected = true; break;
    case 'PLACE': if (boss?.collected && action.id !== 'exile') boss.placed = true; break;
    case 'REVEAL': if (boss && (action.id === 'exile' ? boss.collected : boss.placed)) boss.revealed = true; break;
    case 'VISIT': next.lastLocation = action.location; break;
    case 'END': if (archiveUnlocked(next)) next.ended = true; break;
    default: return state;
  }
  return normalize(next);
}
export function load(storage) {
  try { const raw = storage.getItem(SAVE_KEY); if (!raw) return { state: initialState() }; const parsed = JSON.parse(raw); if (parsed.version !== 2) throw new Error('Unsupported save'); return { state: normalize(parsed) }; }
  catch { return { state: initialState(), error: 'The saved journey could not be read. You can start a new journey; progress will be kept in memory if storage is unavailable.' }; }
}
export function save(storage, state) { try { storage.setItem(SAVE_KEY, JSON.stringify(normalize(state))); return true; } catch { return false; } }
export function objective(state) {
  if (state.ended) return 'The legacy is restored. Revisit the scholars or explore the evidence.';
  if (archiveUnlocked(state)) return 'Carry Eclipse into the Hidden Archive. Hear the whole truth.';
  if (state.bosses.exile.defeated && !state.bosses.exile.collected) return 'Recover the Eclipse Diamond from the Exile’s chamber.';
  if (secretUnlocked(state)) return 'The lower seal has opened. Face the Nameless Exile.';
  const inventory = MAIN_CHAPTERS.find(id => state.bosses[id].collected && !state.bosses[id].placed);
  if (inventory) return `Restore the Diamond of ${inventory[0].toUpperCase() + inventory.slice(1)} to its pedestal.`;
  const reward = MAIN_CHAPTERS.find(id => state.bosses[id].defeated && !state.bosses[id].collected);
  if (reward) return `Return to ${reward[0].toUpperCase() + reward.slice(1)} and recover its diamond.`;
  return 'The voice named three stolen stones. Choose whose account to follow.';
}
