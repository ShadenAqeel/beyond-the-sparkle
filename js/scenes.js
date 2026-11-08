import { icon } from './icons.js';
import { objective } from './state.js';
import { prologue, stonekeeper, question } from './dialogue.js';
import { telegraph } from './combat.js';

export const sceneRegistry = {
  landing: { title: 'Beyond the Sparkle', theme: 'kingdom' },
  shrine: { title: 'The Forgotten Shrine', theme: 'kingdom' },
  chamber: { title: 'Chamber of Form', theme: 'kingdom' },
  reward: { title: 'Diamond of Form', theme: 'kingdom' },
  stonekeeper: { title: 'The Stonekeeper', theme: 'kingdom' },
  codex: { title: 'Research Codex', theme: 'codex' },
};
const action = (name, text, kind = 'primary', extra = '') => `<button class="button ${kind}" data-action="${name}" ${extra}>${text}</button>`;
const hp = (label, value) => `<div class="hp"><span>${label}</span><div class="hp-pips" aria-label="${label}: ${value} of 3 HP">${[1, 2, 3].map(i => `<i class="${i <= value ? 'filled' : ''}"></i>`).join('')}</div><small>${value} / 3</small></div>`;

export function header(state, scene, presenter, hasSave) {
  const landing = scene === 'landing';
  return `<header class="topbar">
    <button class="brand" data-action="home" aria-label="Beyond the Sparkle, title screen">${icon('diamond')}<span>BEYOND THE SPARKLE<small>THE LOST LEGACY</small></span></button>
    ${landing ? '<span class="edition">A STORY TOLD THROUGH EVIDENCE</span>' : `<div class="progress"><span class="progress-gems" aria-hidden="true">${['form', 'division', 'memory'].map(ch => `<span class="${state.diamondsReturned[ch] ? 'restored' : ''}">◇</span>`).join('')}</span><span><b>${['form', 'division', 'memory'].filter(ch => state.diamondsCollected[ch]).length} / 3</b> recovered<small>${Object.values(state.diamondsReturned).filter(Boolean).length} returned · ${state.npcInsightsViewed.stonekeeper ? 1 : 0} / 3 revelations</small></span></div>`}
    <nav class="utilities" aria-label="Experience controls">
      ${presenter ? `<span class="presenter-badge">PRESENTER</span>${action('story', 'Return to Story', 'text')}` : !landing ? action('journal', `${icon('book')}<span>Journal</span>`, 'text') : ''}
      ${action('sound', icon(state.audioMuted ? 'muted' : 'sound'), 'icon-button', `aria-label="${state.audioMuted ? 'Enable' : 'Mute'} ambient sound" aria-pressed="${!state.audioMuted}"`)}
      ${action('motion', icon('motion'), 'icon-button', `aria-label="Reduce motion" aria-pressed="${state.reducedMotion}"`)}
    </nav>
  </header>
  ${presenter ? `<div class="presenter-bar"><label for="presenter-scene">Preview chapter I</label><select id="presenter-scene"><option value="">Jump to a scene…</option>${Object.entries(sceneRegistry).filter(([key]) => key !== 'landing').map(([key, value]) => `<option value="${key}">${value.title}</option>`).join('')}</select>${action('skip-motion', 'Skip animations', 'text')}${action('narrative', 'Show / hide narrative', 'text')}<span>Preview only · story save is untouched</span></div>` : ''}`;
}

export function landingScene(state, hasSave) {
  return `<main id="main-content" class="landing scene" tabindex="-1">
    <div class="scene-art landing-art" aria-hidden="true"></div><div class="landing-shade" aria-hidden="true"></div>
    <div class="landing-copy"><p class="eyebrow"><span></span> A RESEARCH ODYSSEY</p>
      <h1>Beyond<br>the Sparkle<span>The Lost Legacy</span></h1>
      <p class="lore">Some truths were never lost.<br>Only waiting to be unearthed.</p>
      <p class="landing-description">An abandoned sanctuary. Three missing stones.<br>A forgotten study, hidden in the patterns between them.</p>
      <div class="journey-actions">${action('new', `New Journey ${icon('arrow')}`)}${hasSave ? action('continue', 'Continue Journey', 'secondary') : ''}</div>
      ${action('presenter', 'Enter Presenter Mode', 'text presenter-link')}
    </div>
    <div class="title-stone" aria-hidden="true"><div class="stone-orbit orbit-one"></div><div class="stone-orbit orbit-two"></div><img src="assets/diamonds/form.svg" alt=""><span class="stone-label">THE FIRST FRAGMENT</span></div>
    <footer class="landing-footer"><span>CHAPTER I <i>—</i> THE SHAPE OF TRUTH</span><span>POINT & CLICK <i>·</i> PLAY AT YOUR OWN PACE</span><span>AN ORIGINAL FICTION · REAL RESEARCH</span></footer>
  </main>`;
}

export function shrineScene(state) {
  const placed = state.diamondsReturned.form;
  const [title, description] = objective(state);
  return `<main id="main-content" class="scene shrine" tabindex="-1">
    <div class="scene-art shrine-art" aria-hidden="true"></div><div class="scene-vignette" aria-hidden="true"></div>
    <div class="location-heading"><p class="eyebrow">THE SANCTUARY · CHAPTER I</p><h1>The Forgotten Shrine</h1><p class="lore">Even in silence, something here remembers.</p></div>
    <div class="hotspots" aria-label="Explore the sanctuary">
      <button class="hotspot portal form" data-action="enter-form"><span class="hotspot-symbol">${icon('diamond')}</span><b>Chamber of Form</b><small>${state.defeated.form ? 'Guardian quieted · revisit' : 'The Hollow Scale awaits'}</small></button>
      <button class="hotspot portal division locked" data-action="locked" data-chapter="Division"><span class="hotspot-symbol">${icon('lock')}</span><b>Hall of Division</b><small>Chapter II · coming in Milestone 2</small></button>
      <button class="hotspot portal memory locked" data-action="locked" data-chapter="Memory"><span class="hotspot-symbol">${icon('lock')}</span><b>Hall of Reflections</b><small>Chapter III · coming in Milestone 2</small></button>
      <button class="hotspot pedestal pedestal-form ${placed ? 'lit' : ''}" data-action="pedestal"><span class="pedestal-gem">${placed ? icon('diamond') : '+'}</span><b>${placed ? 'Form restored' : state.diamondsCollected.form ? 'Return Diamond of Form' : 'Pedestal of Form'}</b><small>${placed ? 'The Stonekeeper is free' : state.diamondsCollected.form ? 'Place the recovered stone' : 'An empty place remains'}</small></button>
      <button class="hotspot pedestal pedestal-division locked" data-action="locked" data-chapter="Division"><span class="pedestal-gem">◇</span><b>Division</b><small>Stone not yet recovered</small></button>
      <button class="hotspot pedestal pedestal-memory locked" data-action="locked" data-chapter="Memory"><span class="pedestal-gem">◇</span><b>Memory</b><small>Stone not yet recovered</small></button>
    </div>
    <aside class="quest-card narrative"><p class="eyebrow">${state.npcInsightsViewed.stonekeeper ? 'CHAPTER I COMPLETE' : 'YOUR PURPOSE'}</p><h2>${title}</h2><p>${description}</p>${!state.defeated.form ? `<details><summary>The shrine’s memory</summary><p class="lore">${prologue}</p></details>` : ''}</aside>
    <div class="shrine-bottom-actions">${placed ? action('stonekeeper', `${icon('book')} Speak to the Stonekeeper`, 'secondary') : action('scholars', `${icon('lock')} Scholars’ stairway`, 'text')}${action('seal', `${icon('lock')} The lower seal`, 'text')}</div>
    <p class="scene-caption">Choose a marked location to explore <span>·</span> Your journey saves automatically</p>
  </main>`;
}

export function chamberScene(state, battle, hint, presenter) {
  const move = telegraph(battle);
  let panel;
  if (state.diamondsCollected.form) {
    panel = `<p class="eyebrow">THE BALANCE IS STILL</p><h2>A guardian at rest</h2><p class="lore">The stone is yours. Its place in the shrine is waiting.</p>${action('shrine', `Back to Shrine ${icon('arrow')}`)}`;
  } else if (state.defeated.form) {
    panel = `<p class="eyebrow">A FRAGMENT RELEASED</p><h2>The trial is over</h2>${action('reward', `Recover the Diamond ${icon('arrow')}`)}`;
  } else if (battle.phase === 'lost') {
    panel = `<p class="eyebrow danger">THE WEIGHT WAS TOO GREAT</p><h2>Rise once more</h2><p>Nothing you recovered has been lost. Defend against the heavy blow, then attack with guard advantage.</p>${action('retry', 'Retry Encounter')}`;
  } else if (battle.phase === 'question') {
    panel = `<p class="eyebrow">THE FINAL MEASURE · KNOWLEDGE CHALLENGE</p><h2>Before the stone is yours…</h2><p id="knowledge-question">${question.text}</p><div class="answers" role="group" aria-labelledby="knowledge-question">${question.options.map((text, i) => `<button class="answer" data-action="answer" data-answer="${i}"><span>${String.fromCharCode(65 + i)}</span>${text}</button>`).join('')}</div>${hint ? `<p class="hint" role="status">${question.hint} Try again.</p>` : '<p class="fineprint">An incorrect answer offers a hint. Your battle will not restart.</p>'}`;
  } else {
    panel = `<div class="combat-title"><div><p class="eyebrow">GUARDIAN OF FORM</p><h2>The Hollow Scale</h2></div><span class="turn-number">TURN ${battle.turn + 1}</span></div>
      <div class="health-row">${hp('Traveler', battle.player)}${hp('Hollow Scale', battle.boss)}</div>
      <div class="telegraph ${move.kind}"><span>${icon(move.kind === 'heavy' ? 'sword' : 'shield')}</span><div><p class="eyebrow">NEXT MOVE · ${move.kind.toUpperCase()}</p><b>${move.name}</b><p>${move.description}</p></div></div>
      <p class="guard-status">${battle.guard ? `${icon('shield')} Guard ready: your next attack blocks up to 1 damage.` : 'Defend to block this move and protect your next attack.'}</p>
      <div class="combat-actions">${action('attack', `${icon('sword')}<span>Attack<small>Deal 1 · receive next move</small></span>`)}${action('defend', `${icon('shield')}<span>Defend<small>Block · gain guard advantage</small></span>`, 'secondary')}</div>
      <details class="battle-history" ${battle.turn ? 'open' : ''}><summary>Battle record</summary><ol>${battle.log.map(line => `<li>${line}</li>`).join('')}</ol></details>
      ${presenter ? action('resolve', 'Resolve encounter instantly', 'text') : ''}`;
  }
  return `<main id="main-content" class="scene chamber" tabindex="-1">
    <div class="scene-art chamber-art" aria-hidden="true"></div><div class="chamber-shade" aria-hidden="true"></div>
    <div class="location-heading"><p class="eyebrow">THE FIRST GUARDIAN</p><h1>Chamber of Form</h1></div>
    <img class="boss-illustration ${battle.phase !== 'battle' ? 'quieted' : ''}" src="assets/characters/hollow-scale.svg" alt="An empty hooded stone guardian holding a great balancing scale">
    <div class="boss-caption narrative"><span class="eyebrow">THE HOLLOW SCALE</span><p class="lore">“What has no measure<br>has no meaning.”</p></div>
    <section class="combat-panel" aria-label="Hollow Scale encounter">${panel}</section>
    <button class="scene-back button text" data-action="shrine">${icon('back')} Back to Shrine</button>
    <p class="combat-note">Turn-based encounter · no timing required · HP is fictional</p>
  </main>`;
}

export function rewardScene() {
  return `<main id="main-content" class="scene reward" tabindex="-1"><div class="scene-art chamber-art" aria-hidden="true"></div><div class="reward-shade" aria-hidden="true"></div>
    <div class="reward-content"><p class="eyebrow">THE FIRST FRAGMENT · RECOVERED IN BATTLE</p><div class="reward-stone"><div class="stone-orbit"></div><img src="assets/diamonds/form.svg" alt="The antique gold Diamond of Form"></div><p class="reward-overline">YOU HAVE FOUND</p><h1>Diamond of Form</h1><p class="lore narrative">A quiet weight settles in your hand.<br>Somewhere beneath the shrine, a scholar opens his eyes.</p><p class="fineprint">A symbolic story artifact, not a measured diamond in the dataset.</p>${action('collect', `Take the Diamond ${icon('arrow')}`)}</div></main>`;
}

export function keeperScene() {
  return `<main id="main-content" class="scene keeper" tabindex="-1"><div class="scene-art shrine-art" aria-hidden="true"></div><div class="keeper-shade" aria-hidden="true"></div>
    <div class="keeper-composition"><div class="keeper-portrait"><img src="assets/characters/stonekeeper.svg" alt="The Stonekeeper, an elderly scholar in a weathered hood"><p class="eyebrow">SCHOLAR OF PHYSICAL FORM</p></div><section class="dialogue-panel"><p class="eyebrow">AN OATH UNBOUND</p><h1>The Stonekeeper</h1><div class="dialogue-lines narrative">${stonekeeper.map(line => `<p class="lore">${line}</p>`).join('')}</div><div class="knowledge-preview"><span>${icon('book')}</span><p>His knowledge concerns the dataset, its physical measurements, and the care taken before clustering.</p></div>${action('reveal', `Reveal Knowledge ${icon('arrow')}`)}<button class="button text" data-action="shrine">${icon('back')} Return to Shrine</button></section></div></main>`;
}
