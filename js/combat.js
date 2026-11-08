// Fictional HP values. Deterministic, turn-based, no timers or rapid clicks.
export function newBattle() {
  return { player: 3, boss: 3, turn: 0, guard: 0, phase: 'battle', log: ['The Hollow Scale stirs. Read its next move before you act.'] };
}
export function telegraph(battle) {
  return battle.turn % 2 === 0
    ? { name: 'Measured strike', damage: 1, kind: 'normal', description: 'A slow sweep of the balance. Incoming damage: 1.' }
    : { name: 'Weight of stone', damage: 2, kind: 'heavy', description: 'Both pans rise. A heavy blow is coming. Incoming damage: 2.' };
}
export function takeTurn(battle, action) {
  if (battle.phase !== 'battle' || !['attack', 'defend'].includes(action)) return battle;
  const next = { ...battle, log: [...battle.log] };
  const move = telegraph(battle);
  if (action === 'defend') {
    next.guard = 1;
    next.log.push(`You defend. ${move.name} is blocked. Your next attack will block up to 1 damage.`);
  } else {
    next.boss = Math.max(0, next.boss - 1);
    const damage = Math.max(0, move.damage - next.guard);
    next.player = Math.max(0, next.player - damage);
    next.log.push(`You strike for 1. ${next.guard ? 'Your guard absorbs 1. ' : ''}${move.name} deals ${damage} damage.`);
    next.guard = 0;
  }
  next.turn++;
  // A simultaneous zero is a loss: the traveler must survive the final blow.
  if (next.player === 0) next.phase = 'lost';
  else if (next.boss === 0) next.phase = 'question';
  next.log = next.log.slice(-4);
  return next;
}
