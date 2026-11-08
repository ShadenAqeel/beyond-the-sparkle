import {CHAPTERS} from './chapters.js';

// Deterministic turn rules. Reading the guardian is rewarded:
//  - striking into an opening is a critical hit (3),
//  - guarding a real blow is a parry that charges the next strike,
//  - three good reads in a row arm a finisher (+2).
export const STRIKE=2, CRITICAL=3, FINISHER_BONUS=2, COMBO_FOR_FINISHER=3;

export function newBattle(id='form',completed=false) {
  const c=CHAPTERS[id];
  return {id,player:c.playerHealth,boss:completed?0:c.health,turn:0,guard:0,combo:0,phase:completed?'won':'battle',last:null};
}
export function nextMove(battle) {
  const c=CHAPTERS[battle.id];
  const pattern=c.secondPattern&&battle.boss<=c.health/2?c.secondPattern:c.pattern;
  return pattern[battle.turn%pattern.length];
}
export const incoming=battle=>nextMove(battle).damage;
export const enraged=battle=>{const c=CHAPTERS[battle.id];return !!c.secondPattern&&battle.boss<=c.health/2;};

// Outcomes commit once before visual playback. Closing a panel cannot repeat damage.
export function takeTurn(battle,action) {
  if(battle.phase!=='battle'||!['attack','defend'].includes(action))return battle;
  const move=nextMove(battle),next={...battle,turn:battle.turn+1};
  const last={action,move:move.name,kind:move.kind,dealt:0,taken:0,critical:false,parry:false,finisher:false,blocked:0,wasted:false,combo:0};
  if(action==='defend') {
    if(move.damage>0){last.parry=true;last.blocked=move.damage;next.guard=2;next.combo=battle.combo+1;}
    else{last.wasted=true;next.guard=battle.guard;next.combo=0;}
  } else {
    const opening=move.damage===0;
    let dealt=opening?CRITICAL:STRIKE;last.critical=opening;
    if(battle.combo>=COMBO_FOR_FINISHER){dealt+=FINISHER_BONUS;last.finisher=true;}
    const received=Math.max(0,move.damage-battle.guard);
    last.blocked=move.damage-received;
    next.boss=Math.max(0,battle.boss-dealt);next.player=Math.max(0,battle.player-received);next.guard=0;
    next.combo=last.finisher?0:opening?battle.combo+1:received?0:battle.combo;
    last.dealt=dealt;last.taken=received;
  }
  last.combo=next.combo;next.last=last;
  if(next.player===0)next.phase='lost';else if(next.boss===0)next.phase='won';
  return next;
}
