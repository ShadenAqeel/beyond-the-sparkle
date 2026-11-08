import * as T from 'three';
import './style.css';
import './game.css';
import { createWorld } from './scene.js';
import { CHAPTERS, MAIN_CHAPTERS, FINALE, nextMystery, COMBAT_LINES } from './chapters.js';
import { initialState, copy, load, save, reduce, secretUnlocked, archiveUnlocked, objective } from './progress.js';
import { newBattle, takeTurn, nextMove, enraged, COMBO_FOR_FINISHER } from './combat.js';
import {mountDiscovery,mountScholarEvidence} from './discovery.js';
import { createNavigation } from './navigation.js';
import { createAudio } from './audio.js';
import { createCodex, loadResearch } from './codex.js';

const $ = id => document.getElementById(id), storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
const loaded=load(storage);let story=loaded.state,presenter=false,presentationState=null,storySettings=null,entered=false,ready=false,loading=false;
const preferences=matchMedia('(prefers-reduced-motion: reduce)');
let settings={muted:true,reduced:preferences.matches,quality:new URLSearchParams(location.search).get('quality')||'performance'};
try{const saved=JSON.parse(localStorage.getItem('beyond-the-sparkle.3d.settings.v1')||'null');if(saved)settings={muted:saved.muted!==false,reduced:typeof saved.reduced==='boolean'?saved.reduced:preferences.matches,quality:saved.quality==='quality'?'quality':'performance'};}catch{/* Optional settings never prevent play. */}
let world,saveWarning=false;
try{world=createWorld($('world'));}catch(error){$('load-status').textContent='WebGL 2 is required. Enable hardware acceleration and reload.';throw error;}
const audio=createAudio();let encounters,encounterPromise,currentBattle=null,toastTimer,titleTimer,sceneSerial=0;
let preparedCrypt='',panelSerial=0,actionLocked=false;
const getState=()=>presenter?presentationState:story,motionReduced=()=>settings.reduced,region=location=>location.startsWith('arena:')?'arena':location;
const names={shrine:'The Forgotten Shrine',crypt:'The Scholars’ Crypt',archive:'The Hidden Archive'};
function notify(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),4200);}
function hidePanel(){panelSerial++;actionLocked=false;encounters?.cancelAction();$('panel').hidden=true;$('panel').classList.remove('fighting','card','victory','defeat','enraged');document.body.classList.remove('inspecting','in-combat');}
function panel(kicker,title,text,actions=[],{portrait=false}={}){
  panelSerial++;$('panel').classList.remove('discovering','fighting','card','victory','defeat','enraged');
  const focused=document.activeElement?.textContent;
  $('panel-kicker').textContent=kicker;$('panel-title').textContent=title;$('panel-copy').textContent=text;
  $('portrait').hidden=!portrait;$('panel').classList.toggle('conversation',portrait);$('panel-extra').replaceChildren();$('panel-actions').replaceChildren();
  for(const [label,action] of actions){const button=document.createElement('button');button.textContent=label;button.onclick=action;$('panel-actions').append(button);}
  $('panel').hidden=false;document.body.classList.add('inspecting');
  const buttons=[...$('panel-actions').children];(buttons.find(button=>button.textContent===focused)||buttons[0])?.focus({preventScroll:true});
}
function locationChanged(location){
  const chapter=location.startsWith('arena:')?location.split(':')[1]:null;
  $('location').textContent=chapter?CHAPTERS[chapter].chamber:names[location];
  $('chapter').textContent=presenter?'PRESENTER MODE / NO STORY SAVES':chapter?`THE GUARDIAN OF ${CHAPTERS[chapter].name.toUpperCase()}`:location==='shrine'?'THE SANCTUARY':location==='crypt'?'BENEATH THE SANCTUARY':'THE COMPLETE EVIDENCE';
  $('location-sub').textContent=chapter?'One guardian. One fragment.':location==='archive'?'The stones were never truly lost.':location==='crypt'?'Each scholar remembers a different part.':'Even in silence, something here remembers.';
  const heading=document.querySelector('.location');heading.classList.remove('faded');clearTimeout(titleTimer);titleTimer=setTimeout(()=>heading.classList.add('faded'),4000);
  world.setRegion(region(location));encounters?.setRegion(region(location),getState());
}
const nav=createNavigation(world,{reduced:()=>presenter||motionReduced(),hidePanel,panelOpen:()=>!$('panel').hidden,onLocation:locationChanged,onSettled:()=>{if(entered){commit({type:'VISIT',location:nav.location()});$('back').hidden=nav.location()==='shrine';}}});
const codex=createCodex({getState,isPresenter:()=>presenter,notify});
function persistSettings(){if(!presenter)try{localStorage.setItem('beyond-the-sparkle.3d.settings.v1',JSON.stringify(settings));}catch{/* Optional preferences. */}}
function syncSettings(){world.setQuality(settings.quality);encounters?.setQuality();$('quality').textContent=settings.quality==='performance'?'Performance mode':'Quality mode';$('quality').setAttribute('aria-pressed',String(settings.quality==='performance'));$('motion').textContent=motionReduced()?'Motion reduced':'Reduce motion';$('motion').setAttribute('aria-pressed',String(motionReduced()));$('sound').textContent=settings.muted?'Sound off':'Sound on';$('sound').setAttribute('aria-pressed',String(!settings.muted));}
function synchronize(animateId){const state=getState();world.setProgress(state,animateId);encounters?.syncScholars(state);const placed=MAIN_CHAPTERS.filter(id=>state.bosses[id].placed).length;$('progress').textContent=`${placed} / 3 restored${state.bosses.exile.collected?' · Eclipse recovered':''}`;$('objective').textContent=objective(state);$('continue').hidden=!story.started;$('continue').disabled=!ready;$('presenter-bar').hidden=!presenter;}
function commit(action){if(presenter)presentationState=reduce(presentationState,action);else{story=reduce(story,action);if(story.started&&!save(storage,story)&&!saveWarning){saveWarning=true;notify('Saving is unavailable. This journey continues in memory; keep this tab open.');}}synchronize(action.type==='PLACE'?action.id:undefined);}

Object.assign(world.anchors,{
  divider:{label:'The Divider',point:[10.3,-2.1,-9.8],camera:[10.6,-2.4,-6.3],target:[10.6,-2.65,-9.8],location:'crypt'},
  seer:{label:'The Seer',point:[15.7,-2.1,-9.8],camera:[13.7,-2.4,-6.3],target:[15.9,-2.65,-9.8],location:'crypt'},
  boss:{label:'The guardian',point:[50,1.8,-1],camera:[51.2,2.2,5.6],target:[50.7,1.55,-1]},
  scholar:{label:'The Old Scholar',point:[50,1.8,-2],camera:[51,2.1,3],target:[50.7,1.6,-2],location:'archive'}
});
// Fight framing per guardian: each figure stays large between the boss bar and the action cue.
const BOSS_FRAMING={
  form:{boss:{point:[50,3.0,-1.5],camera:[50.25,2.55,8.2],target:[50,2.4,-1.5]},overview:{camera:[50,3.1,11],target:[50,2.4,-1.5]}},
  division:{boss:{point:[50,2.4,-1],camera:[50.2,2.2,7.0],target:[50,1.75,-1]},overview:{camera:[50,2.9,9.4],target:[50,1.75,-1]}},
  memory:{boss:{point:[50,2.6,-1],camera:[50.2,2.25,6.9],target:[50,1.95,-1]},overview:{camera:[50,2.9,9.2],target:[50,1.95,-1]}},
  exile:{boss:{point:[50,4.9,-1.4],camera:[50.5,1.45,7.4],target:[50,3.15,-2]},overview:{camera:[50,2.2,10.5],target:[50,3.2,-2]}}
};
world.anchors.stairs.location='crypt';world.anchors.npc.location='crypt';
world.anchors.stairs.camera=[12.8,-1.9,-3.6];world.anchors.stairs.target=[13,-2.7,-9.6];
const hitGeometry=new T.SphereGeometry(.75,8,6),hitMaterial=new T.MeshBasicMaterial({visible:false});
for(const id of ['divider','seer','boss','scholar']){const mesh=new T.Mesh(hitGeometry,hitMaterial);mesh.position.set(...world.anchors[id].point);mesh.userData.id=id;world.scene.add(mesh);world.interactables.push(mesh);}
const hotspots=new Map();let hover='';
for(const [id,anchor] of Object.entries(world.anchors)){
  const button=document.createElement('button');button.className='hotspot';button.setAttribute('aria-label',anchor.label);const label=document.createElement('span');label.textContent=anchor.label;button.append(label);
  button.onclick=()=>interact(id);button.onpointerenter=button.onfocus=()=>setHover(id);button.onpointerleave=button.onblur=()=>setHover('');$('hotspots').append(button);hotspots.set(id,button);
}
function setHover(id){hover=id;world.setHover(id);world.renderer.domElement.style.cursor=id?'pointer':'default';}
function canShow(id){
  if(!entered||loading||nav.isBusy()||!$('panel').hidden||codex.isOpen())return false;
  const location=nav.location(),state=getState();
  if(location==='shrine')return ['flame','form','division','memory','stairs','door'].includes(id);
  if(location==='crypt')return (id==='npc'&&(presenter||state.bosses.form.placed))||(id==='divider'&&(presenter||state.bosses.division.placed))||(id==='seer'&&(presenter||state.bosses.memory.placed));
  if(location==='archive')return id==='scholar';return id==='boss';
}
async function getEncounters(){if(!encounterPromise)encounterPromise=import('./encounters.js').then(async({createEncounters})=>{encounters=await createEncounters(world);encounters.syncScholars(getState());encounters.setQuality();return encounters;});return encounterPromise;}
async function prepareCrypt(){
  const signature=MAIN_CHAPTERS.filter(id=>getState().bosses[id].placed).join(',')+settings.quality;
  if(preparedCrypt===signature)return;
  loading=true;$('scene-fade').hidden=false;$('scene-fade').classList.add('visible');$('scene-loading').textContent='Preparing the scholars’ crypt…';
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{
    const stage=await getEncounters();world.setRegion('crypt');stage.setRegion('crypt',getState());
    await stage.prepare();
    // First bone-texture uploads and draw setup happen beneath the loading cover,
    // before the continuous stair camera starts moving.
    const position=world.camera.position.clone(),rotation=world.camera.quaternion.clone();
    world.camera.position.set(...world.anchors.stairs.camera);world.camera.lookAt(...world.anchors.stairs.target);world.camera.updateMatrixWorld();
    world.render();world.camera.position.copy(position);world.camera.quaternion.copy(rotation);world.camera.updateMatrixWorld();
    preparedCrypt=signature;
  }finally{
    world.setRegion(region(nav.location()));encounters?.setRegion(region(nav.location()),getState());
    loading=false;$('scene-fade').classList.remove('visible');$('scene-fade').hidden=true;
  }
}
async function relocate(location,view,prepare,after){
  if(loading)return;loading=true;const serial=++sceneSerial;hidePanel();setHover('');$('scene-fade').hidden=false;$('scene-fade').classList.add('visible');$('scene-loading').textContent=location==='archive'?'Opening the Hidden Archive…':'Opening the chamber…';
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{await prepare();nav.go(location,view,{instant:true});await encounters?.prepare();if(serial!==sceneSerial)return;after?.();}
  catch(error){notify(`The chamber could not open: ${error.message}`);nav.go('shrine',world.overview,{instant:true});}
  finally{loading=false;$('scene-fade').classList.remove('visible');setTimeout(()=>{if(serial===sceneSerial)$('scene-fade').hidden=true;},motionReduced()?0:220);}
}
function goShrine(){if(loading||nav.isBusy())return;if(codex.isOpen())codex.close();if(nav.location().startsWith('arena:')||nav.location()==='archive')relocate('shrine',world.overview,async()=>{encounters?.setRegion('shrine',getState());},()=>{});else nav.go('shrine',world.overview);}
async function enterEncounter(id){
  if(!presenter&&id==='exile'&&!secretUnlocked(getState())){notify('The seal requires three restored diamonds.');return;}
  const location=`arena:${id}`;world.anchors.boss.label=CHAPTERS[id].boss;
  const framing=BOSS_FRAMING[id];Object.assign(world.anchors.boss,framing.boss);
  const overview=framing.overview;
  await relocate(location,overview,async()=>{const stage=await getEncounters();stage.stage(id);stage.setQuality();currentBattle={id,battle:newBattle(id,!presenter&&getState().bosses[id].challenged),hint:'',rewardShown:false};},()=>nav.inspect('boss',()=>showBoss(id,true)));
}
async function enterArchive(){if(!presenter&&!archiveUnlocked(getState()))return;await relocate('archive',{camera:[50,2.8,7],target:[50,1.7,-1]},async()=>{const stage=await getEncounters();stage.stage('exile',true);stage.setQuality();},()=>nav.inspect('scholar',()=>scholarDialogue(0)));}
async function interact(id){
  if(loading||nav.isBusy()||!entered)return;setHover('');audio.cue(id);
  if(id==='stairs'&&!presenter&&!MAIN_CHAPTERS.some(key=>getState().bosses[key].placed)){nav.inspect('stairs',()=>panel('THE SCHOLARS’ OATH','A silence below','The scholars remain bound to their fragments. Restore any diamond to its pedestal and its keeper will awaken.'));return;}
  if(id==='stairs')try{await prepareCrypt();}catch{notify('The scholars could not prepare. Please try the stairs again.');return;}
  nav.inspect(id,()=>inspect(id));
}
function inspect(id){
  const state=getState();if(['form','division','memory','flame'].includes(id))world.respond(id);
  if(id==='flame'){
    commit({type:'FLAME'});
    const count=MAIN_CHAPTERS.filter(key=>state.bosses[key].placed).length;
    const voice=state.ended?'The flame asks nothing more. Its voice has become a quiet human breath.':count===3?'“You have brought them home. Do not go below.” For the first time, the voice sounds afraid. A fourth name shines beneath the altar.':count>=1?'“Bring the stones home,” the voice repeats. It offers no answer when you ask about the inscriptions.':'“Traveler… three diamonds were taken from this kingdom. Three corrupted guardians bar their return. Bring the stones home. Wake those who remember.” The voice fades before you can ask its name.';
    const actions=MAIN_CHAPTERS.map(key=>['Enter '+CHAPTERS[key].chamber,()=>enterEncounter(key)]);
    if(count>=2)actions.unshift(['Read the uncovered oath',()=>panel('BENEATH THE ROYAL ACCOUNT','An older inscription','“We bear separate windows. We witness one world.” The new oath-marks cross beneath the royal inventory, rather than beneath the guardians’ names.',[['Keep exploring',()=>nav.close()]])]);
    panel('THE LAST EMBER','A kingdom that remembers',voice,actions);
  }
  else if(MAIN_CHAPTERS.includes(id)){
    const c=CHAPTERS[id],b=state.bosses[id],actions=[];
    if(b.collected&&!b.placed)actions.push([`Restore Diamond of ${c.name}`,()=>restoreDiamond(id)]);
    else if(b.placed)actions.push([`Speak with ${c.scholar}`,()=>meetScholar(id)]);else actions.push([`Enter ${c.chamber}`,()=>enterEncounter(id)]);
    panel(`PEDESTAL / ${b.placed?'RESTORED':b.collected?'DIAMOND IN YOUR KEEPING':'AWAITING ITS DIAMOND'}`,`Diamond of ${c.name}`,c.lore,actions);
  }else if(id==='stairs')panel('THE SCHOLARS’ CRYPT','Someone is still waiting','Each awakened scholar holds a different fragment. Choose whose account to hear.',MAIN_CHAPTERS.filter(key=>presenter||state.bosses[key].placed).map(key=>[`Approach ${CHAPTERS[key].scholar}`,()=>speakTo(key)]));
  else if(['npc','divider','seer'].includes(id))speak(['npc','divider','seer'].indexOf(id));
  else if(id==='door'){
    const count=MAIN_CHAPTERS.filter(key=>state.bosses[key].placed).length,actions=[];
    if(presenter||secretUnlocked(state))actions.push(['Face the Nameless Exile',()=>enterEncounter('exile')]);if(presenter||archiveUnlocked(state))actions.push(['Enter the Hidden Archive',enterArchive]);
    panel('THE SEAL OF THREE TRUTHS',secretUnlocked(state)?'An oath fulfilled':'An oath still holds',secretUnlocked(state)?'The three restored stones have broken the seal. A fourth guardian waits below; its truth was left outside the boundary.':`${count} of 3 diamonds restored. The seal opens when all three return. The scholars’ records remain yours to explore at your own pace.`,actions);
  }else if(id==='boss')showBoss(currentBattle.id);else if(id==='scholar')scholarDialogue(0);
}
function restoreDiamond(id){
  const c=CHAPTERS[id];commit({type:'PLACE',id});const count=MAIN_CHAPTERS.filter(key=>getState().bosses[key].placed).length;
  audio.cue(count===3?'activation':'victory');
  const reveal=()=>{world.respond('flame');panel('A SCHOLAR UNBOUND',c.name+' restored',c.scholar+' awakens below. '+(count===2?'New oath-marks emerge along the sanctuary walls. ':count===3?'The central altar answers. Beneath the open seal, a knight speaks a name the voice never gave you. ':'')+nextMystery(getState(),id),[['Meet '+c.scholar,()=>meetScholar(id)],['Keep exploring',()=>nav.close()]]);};
  if(count===3)nav.inspect('flame',reveal);else reveal();
}
async function meetScholar(id){if(!presenter&&!getState().bosses[id].placed)return;await prepareCrypt();nav.go('crypt',world.anchors.stairs,{instant:true});speakTo(id);}
function speakTo(id){const anchor={form:'npc',division:'divider',memory:'seer'}[id];nav.inspect(anchor,()=>speak(MAIN_CHAPTERS.indexOf(id)));}
function speak(index,line=0){
  const id=MAIN_CHAPTERS[index],c=CHAPTERS[id];if(!presenter&&!getState().bosses[id].placed){notify('That scholar is still bound to its diamond.');return;}
  if(line===c.dialogue.length-1)commit({type:'REVEAL',id});
  const study=[c.investigate,()=>showDiscovery(id,()=>speak(index,1))];
  const actions=line<c.dialogue.length-1?[['Continue the conversation',()=>speak(index,line+1)],study]:[['Open the research fragment',()=>codex.open(id)],study,['Keep exploring',()=>nav.close()]];
  panel(`${c.scholar.toUpperCase()} / ${line+1} OF ${c.dialogue.length}`,c.takeaway,c.dialogue[line],actions,{portrait:id==='form'});
  if(line===c.dialogue.length-1)mountScholarEvidence($('panel-extra'),id);
}
function showBoss(id,introduction=false){
  const c=CHAPTERS[id],progress=getState().bosses[id];
  if(!presenter&&progress.defeated){
    if(progress.collected){panel('A GUARDIAN AT REST',c.boss,c.mystery,[['Return to the shrine',goShrine],...(id==='exile'?[['Enter the Hidden Archive',enterArchive]]:[])]);return;}
    showVictory(id);return;
  }
  if(currentBattle.battle.phase==='won'){commit({type:'DEFEAT',id});showVictory(id);return;}
  if(introduction){titleCard(id);return;}
  beginEncounter(id);
}
// A short cinematic card: name, epithet, one line. No lore during combat.
function titleCard(id){
  const c=CHAPTERS[id],lines=COMBAT_LINES[id];
  panel(lines.epithet.toUpperCase(),c.boss,lines.intro,[['Begin the encounter',()=>beginEncounter(id)],...(presenter?[['Presenter · resolve encounter',()=>resolvePresenter(id)]]:[])]);
  $('panel').classList.add('fighting','card');document.body.classList.add('in-combat');audio.cue('rage');encounters.shake(.35);encounters.taunt();
}
function beginEncounter(id){audio.cue('engage');renderBattle();}
function showDiscovery(id,after=showEnding){
  const c=CHAPTERS[id],progress=getState().bosses[id];
  const allowed=id==='exile'?progress.collected&&nav.location()==='archive':progress.placed&&nav.location()==='crypt';
  if(!allowed)return;
  panel('THE KEEPER’S RECORD',c.discoveryTitle,'');
  $('panel').classList.add('discovering');const serial=panelSerial;
  mountDiscovery(id,{container:$('panel-extra'),hint:c.hint,
    isLive:()=>serial===panelSerial&&!$('panel').hidden,
    onSolved:()=>{
      commit({type:'DISCOVER',id});commit({type:'REVEAL',id});audio.cue('discovery');
      panel('A RECORD UNDERSTOOD',c.discoveryTitle,c.result,[['Continue the conversation',after]]);
    }
  });
}
const fx=(()=>{const layer=document.createElement('div');layer.id='fx-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);return layer;})();
function popup(text,kind,{x=50,y=36}={}){
  if(motionReduced()&&kind!=='big')return;
  const el=document.createElement('div');el.className='popup '+kind;el.textContent=text;
  el.style.left=`${x+(Math.random()-.5)*8}%`;el.style.top=`${y+(Math.random()-.5)*5}%`;fx.append(el);setTimeout(()=>el.remove(),1300);
}
function flash(kind){if(motionReduced())return;const el=document.createElement('div');el.className='flash '+kind;fx.append(el);setTimeout(()=>el.remove(),600);}
function banner(text,kind=''){const el=document.createElement('div');el.className='banner '+kind;el.textContent=text;fx.append(el);setTimeout(()=>el.remove(),motionReduced()?900:1700);}
const cueText=move=>move.kind==='feint'?['FEINT','Strike']:move.damage>=2?['HEAVY','Guard']:move.damage===1?['LIGHT','Trade or guard']:['OPENING','Strike'];
function tauntFor(id,battle,move){
  const lines=COMBAT_LINES[id];
  if(battle.last?.taken)return lines.win;
  if(battle.last?.dealt&&battle.turn%2)return lines.hurt[(battle.turn>>1)%lines.hurt.length];
  if(move.damage>=2||battle.turn===0)return lines.taunts[battle.turn%lines.taunts.length];
  return '';
}
function quoted(text){return text?`“${text}”`:'';
}
function renderBattle(){
  const session=currentBattle,{id,battle}=session,c=CHAPTERS[id];actionLocked=false;
  document.body.classList.add('in-combat');
  if(battle.phase==='lost'){
    encounters.cancelAction();encounters.taunt();
    panel('THE TRIAL IS NOT OVER','You fell',quoted(COMBAT_LINES[id].win),[['Retry encounter',()=>{session.battle=newBattle(id);session.raged=false;encounters.stage(id);renderBattle();}],['Return to the shrine',goShrine]]);
    $('panel').classList.add('fighting','card','defeat');return;
  }
  if(battle.phase==='won'){showVictory(id);return;}
  const move=nextMove(battle);encounters.telegraph(move);
  if(enraged(battle)&&!session.raged){session.raged=true;encounters.rage(true);encounters.shake(.9);flash('rage');banner(COMBAT_LINES[id].rage||'ENRAGED','rage');audio.cue('rage');}
  panel('',c.boss,quoted(tauntFor(id,battle,move)),[['Attack',()=>turn('attack')],['Defend',()=>turn('defend')],...(presenter?[['Presenter · resolve encounter',()=>resolvePresenter(id)]]:[])]);
  $('panel').classList.add('fighting');$('panel').classList.toggle('enraged',!!session.raged);
  const [attack,defend]=$('panel-actions').children;
  attack.innerHTML='<span class="key">J</span>Strike';attack.setAttribute('aria-label','Attack');
  defend.innerHTML='<span class="key">K</span>Guard';defend.setAttribute('aria-label','Defend');
  const extra=$('panel-extra');
  // Boss bar (top).
  const bossBar=document.createElement('div');bossBar.className='boss-bar';
  const epithet=document.createElement('small');epithet.textContent=COMBAT_LINES[id].epithet;
  const track=document.createElement('div');track.className='track';
  const trail=document.createElement('i');trail.className='trail';const fill=document.createElement('b');fill.className='fill';
  const pct=v=>`${Math.max(0,v)/c.health*100}%`;trail.style.width=pct(session.shownBoss??battle.boss);fill.style.width=pct(battle.boss);
  track.append(trail,fill);if(c.secondPattern){const tick=document.createElement('em');track.append(tick);}
  const bossHealth=document.createElement('progress');bossHealth.className='sr-only';bossHealth.max=c.health;bossHealth.value=battle.boss;bossHealth.setAttribute('aria-label','Guardian health');
  bossBar.append(epithet,track,bossHealth);extra.append(bossBar);
  requestAnimationFrame(()=>{trail.style.width=pct(battle.boss);});session.shownBoss=battle.boss;
  // Telegraph cue (center).
  const [label,advice]=cueText(move),cue=document.createElement('div');cue.className='attack-telegraph';cue.dataset.kind=move.kind;cue.dataset.weight=move.damage>=2?'heavy':move.damage?'light':'open';
  const tag=document.createElement('span');tag.className='tag';tag.textContent=label;const name=document.createElement('strong');name.textContent=move.name;const tip=document.createElement('span');tip.className='advice';tip.textContent=advice;
  cue.append(tag,name,tip);extra.append(cue);
  // Player hearts and combo (bottom).
  const hud=document.createElement('div');hud.className='player-hud';
  const hearts=document.createElement('div');hearts.className='hearts';hearts.setAttribute('role','img');
  const drawHearts=()=>{hearts.replaceChildren();hearts.setAttribute('aria-label',`Traveler health ${session.battle.player} of ${c.playerHealth}`);for(let i=0;i<c.playerHealth;i++){const h=document.createElement('i');if(i>=session.battle.player)h.className='lost';hearts.append(h);}};drawHearts();
  const playerHealth=document.createElement('progress');playerHealth.className='sr-only';playerHealth.max=c.playerHealth;playerHealth.value=battle.player;playerHealth.setAttribute('aria-label','Traveler health');
  const combo=document.createElement('div');combo.className='combo';
  for(let i=0;i<COMBO_FOR_FINISHER;i++){const p=document.createElement('i');if(i<battle.combo)p.className='on';combo.append(p);}
  const comboLabel=document.createElement('span');comboLabel.textContent=battle.combo>=COMBO_FOR_FINISHER?'Finisher ready':battle.combo?`Combo ×${battle.combo}`:'Read the blow';combo.append(comboLabel);combo.classList.toggle('armed',battle.combo>=COMBO_FOR_FINISHER);
  hud.append(hearts,playerHealth,combo);extra.append(hud);
  function turn(action){
    if(actionLocked||currentBattle!==session||$('panel').hidden)return;actionLocked=true;
    session.battle=takeTurn(session.battle,action);const result=session.battle.last;
    if(session.battle.phase==='won'){commit({type:'TRIAL',id});commit({type:'DEFEAT',id});}
    $('panel-actions').querySelectorAll('button').forEach(b=>b.disabled=true);cue.classList.add('resolving');$('panel-copy').textContent='';
    const fired=new Set();
    const impact=kind=>{
      if(fired.has(kind))return;fired.add(kind);
      audio.cue(kind);
      if(kind==='impact'){
        fill.style.width=pct(session.battle.boss);bossHealth.value=session.battle.boss;setTimeout(()=>{trail.style.width=pct(session.battle.boss);},280);session.shownBoss=session.battle.boss;
        const big=result.finisher||result.critical;
        popup(`${result.dealt}`,result.finisher?'finisher':result.critical?'crit':'dmg');
        if(result.finisher){popup('FINISHER','big',{y:28});audio.cue('finisher');flash('white');}else if(result.critical){popup('CRITICAL','label',{y:29});audio.cue('crit');}
        encounters.shake(big?.55:.25);encounters.kick(big?1:.5);bossBar.classList.remove('hit');void bossBar.offsetWidth;bossBar.classList.add('hit');
      }
      if(kind.startsWith('enemy_')){
        if(result.taken){drawHearts();playerHealth.value=session.battle.player;popup(`−${result.taken}`,'hurt',{y:78});flash('red');encounters.shake(.75);audio.cue('hurt');encounters.taunt();hud.classList.remove('hit');void hud.offsetWidth;hud.classList.add('hit');}
        else if(result.parry){popup('PARRY','parry',{y:60});flash('blue');encounters.shake(.3);audio.cue('parry');}
        else if(result.blocked){popup('BLOCKED','parry',{y:62});encounters.shake(.2);}
      }
    };
    audio.cue(action);if(result.wasted)popup('WASTED','miss',{y:62});
    const serial=panelSerial,duration=encounters.play(action,move,{reduced:motionReduced(),onImpact:impact});
    setTimeout(()=>{
      if(serial!==panelSerial||currentBattle!==session)return;
      // Slow frames must never swallow feedback: settle any impact not yet shown.
      if(action==='attack')impact('impact');if(move.damage)impact(`enemy_${id}`);
      encounters.cancelAction();renderBattle();
    },duration+(motionReduced()?30:260));
  }
}
function resolvePresenter(id){if(!presenter)return;commit({type:'TRIAL',id});commit({type:'DEFEAT',id});currentBattle.battle.phase='won';showVictory(id);}
function showVictory(id){
  const session=currentBattle,c=CHAPTERS[id],label=id==='exile'?'Eclipse Diamond':`Diamond of ${c.name}`;encounters.win();encounters.rage(false);audio.cue('victory');
  if(!session.celebrated){session.celebrated=true;banner('Guardian felled','victory');encounters.shake(.6);flash('white');}
  const reveal=()=>{if(currentBattle===session&&!session.rewardShown&&nav.location()===`arena:${id}`){session.rewardShown=true;encounters.reward(id);}};setTimeout(reveal,motionReduced()?0:650);
  panel('THE OATH IS QUIET','Guardian felled',COMBAT_LINES[id].victory,[[`Recover ${label}`,()=>{reveal();document.body.classList.remove('in-combat');commit({type:'COLLECT',id});audio.cue('recovery');panel('A FRAGMENT RECOVERED',label,c.recovery+' '+nextMystery(getState(),id),id==='exile'?[['Enter the Hidden Archive',enterArchive],['Return to the shrine',goShrine]]:[['Return to the shrine',goShrine]]);}]]);
  $('panel').classList.add('fighting','card','victory');
}
function scholarDialogue(line){if(!presenter&&!archiveUnlocked(getState()))return;encounters.unite(line);panel(`THE OLD SCHOLAR / ${line+1} OF ${FINALE.length}`,'The stones were never lost',FINALE[line],line<FINALE.length-1?[['Continue the revelation',()=>scholarDialogue(line+1)]]:[['Unite the evidence',showEnding]]);}
async function showEnding(){
  try{const {summary:s}=await loadResearch();commit({type:'END'});audio.cue('victory');panel('THE LEGACY RESTORED','Let their names remain',`Six physical features became two components, retaining ${(s.pca.retained*100).toFixed(2)}% of variance. K-Means found two size-based groups. The higher two-dimensional silhouette alone does not prove improvement. DBSCAN offered a different boundary: one main cluster and ${s.dbscan.after.noise} noise observations.`,[['Explore the research',()=>codex.open('truth')],['Examine the Eclipse record',()=>showDiscovery('exile')],['Return to the shrine',goShrine],['Replay the final revelation',()=>scholarDialogue(0)]]);}
  catch(error){panel('THE ARCHIVE’S RECORDS','The evidence could not open',error.message,[['Try opening the records again',showEnding]]);}
}
function journal(){
  const dialog=$('journey-dialog'),s=getState();dialog.innerHTML='<button class="close" aria-label="Close journey menu">×</button><p class="eyebrow">THE TRAVELER’S JOURNAL</p><h2>Your journey</h2>';
  const list=document.createElement('ul');for(const id of [...MAIN_CHAPTERS,'exile']){const b=s.bosses[id],li=document.createElement('li');li.textContent=`${id==='exile'?'Eclipse':CHAPTERS[id].name}: ${b.placed?'restored':b.collected?'in your keeping':b.defeated?'awaiting recovery':'guardian waiting'}`;list.append(li);if(b.collected){const clue=document.createElement('p');clue.className='journal-clue';clue.textContent=CHAPTERS[id].recovery;li.append(clue);}}dialog.append(list);
  for(const [label,action] of [['Continue exploring',()=>{}],['Return to the shrine',goShrine],[presenter?'Return to Story':'Presenter Mode',presenter?leavePresenter:enterPresenter],['Restart journey',confirmRestart]]){const b=document.createElement('button');b.className='menu-action';b.textContent=label;b.onclick=()=>{dialog.close();action();};dialog.append(b);}dialog.querySelector('.close').onclick=()=>dialog.close();dialog.showModal();
}
function confirmRestart(){const d=$('confirm-dialog');d.showModal();$('cancel-restart').onclick=()=>d.close();$('confirm-restart').onclick=()=>{d.close();if(presenter){presenter=false;presentationState=null;}story=initialState();commit({type:'START'});entered=true;hideIntro();currentBattle=null;nav.go('shrine',world.overview,{instant:true});notify('A new journey begins.');};}
function hideIntro(){$('intro').hidden=true;entered=true;document.body.classList.add('playing');audio.setMuted(settings.muted);}
function startNew(){if(story.started){confirmRestart();return;}commit({type:'START'});hideIntro();nav.go('shrine',world.overview);}
function continueStory(){hideIntro();resumeLocation(story.lastLocation);}
async function resumeLocation(location){if(location==='archive')return enterArchive();if(location.startsWith('arena:'))return enterEncounter(location.split(':')[1]);if(location==='crypt'){await prepareCrypt();nav.go('crypt',world.anchors.stairs,{instant:true});}else nav.go('shrine',world.overview,{instant:true});}
function enterPresenter(){if(presenter){presenterMenu();return;}storySettings={...settings};presentationState=copy(story.started?story:{...initialState(),started:true});for(const id of [...MAIN_CHAPTERS,'exile'])presentationState.bosses[id]={discovered:true,challenged:true,defeated:true,collected:true,placed:id!=='exile',revealed:true};presenter=true;hideIntro();syncSettings();synchronize();presenterMenu();}
function leavePresenter(){
  if(!presenter)return;
  presenter=false;presentationState=null;settings=storySettings||settings;currentBattle=null;
  syncSettings();audio.setMuted(settings.muted);synchronize();
  if(story.started)resumeLocation(story.lastLocation);
  else{
    entered=false;$('intro').hidden=false;document.body.classList.remove('playing');
    nav.go('shrine',world.overview,{instant:true});
  }
  notify('Story restored. Presenter changes were not saved.');
}
function presenterMenu(){
  if(!presenter)return;const d=$('journey-dialog');d.innerHTML='<button class="close" aria-label="Close presenter controls">×</button><p class="eyebrow">PRESENTER MODE / STORY SAVE UNCHANGED</p><h2>Choose a chapter</h2><p>Transitions are skipped. Resolve battles instantly or open the evidence directly.</p>';
  for(const id of [...MAIN_CHAPTERS,'exile'])for(const [label,action] of [[`Face ${CHAPTERS[id].boss}`,()=>enterEncounter(id)],[`Research · ${CHAPTERS[id].name}`,()=>codex.open(id)]]){const b=document.createElement('button');b.className='menu-action';b.textContent=label;b.onclick=()=>{d.close();action();};d.append(b);}
  for(const [label,action] of [['Replay the final revelation',enterArchive],['Return to Story',leavePresenter]]){const b=document.createElement('button');b.className='menu-action';b.textContent=label;b.onclick=()=>{d.close();action();};d.append(b);}d.querySelector('.close').onclick=()=>d.close();d.showModal();
}
$('enter').onclick=startNew;$('continue').onclick=continueStory;$('presenter-start').onclick=enterPresenter;$('presenter-controls').onclick=presenterMenu;$('return-story').onclick=leavePresenter;$('journey-button').onclick=journal;
$('close-panel').onclick=()=>nav.close();$('back').onclick=goShrine;document.querySelector('.brand').onclick=e=>{e.preventDefault();if(entered)goShrine();};$('codex-button').onclick=()=>{audio.cue('codex');codex.open();};
$('quality').onclick=()=>{settings.quality=settings.quality==='quality'?'performance':'quality';syncSettings();persistSettings();};$('motion').onclick=()=>{settings.reduced=!settings.reduced;syncSettings();persistSettings();};$('sound').onclick=async()=>{settings.muted=!settings.muted;await audio.setMuted(settings.muted);syncSettings();persistSettings();};
preferences.addEventListener('change',event=>{settings.reduced=event.matches;syncSettings();});addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.querySelector('dialog[open]'))nav.close();
  if($('panel').hidden||!$('panel').classList.contains('fighting')||document.querySelector('dialog[open]')||event.repeat)return;
  const key=event.key.toLowerCase(),buttons=[...$('panel-actions').children];
  const pick=label=>buttons.find(b=>(b.getAttribute('aria-label')||b.textContent)===label&&!b.disabled);
  const target=['j','a','1','arrowleft'].includes(key)?pick('Attack'):['k','d','2','arrowright'].includes(key)?pick('Defend'):null;
  if(target){event.preventDefault();target.click();}
});
const raycaster=new T.Raycaster();addEventListener('pointermove',event=>{nav.mouse.set(event.clientX/innerWidth*2-1,-event.clientY/innerHeight*2+1);if(event.target!==world.renderer.domElement||loading||nav.isBusy()||!entered)return;raycaster.setFromCamera(nav.mouse,world.camera);const hit=raycaster.intersectObjects(world.interactables).find(h=>canShow(h.object.userData.id));setHover(hit?.object.userData.id||'');});world.renderer.domElement.onclick=()=>{if(hover)interact(hover);};
let last=performance.now(),elapsed=0;const projected=new T.Vector3();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;elapsed+=dt;nav.update(now);
  hotspots.forEach((button,id)=>{projected.set(...world.anchors[id].point).project(world.camera);const visible=canShow(id)&&projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.97&&Math.abs(projected.y)<.9;button.hidden=!visible;if(visible){button.style.left=`${(projected.x*.5+.5)*innerWidth}px`;button.style.top=`${(-projected.y*.5+.5)*innerHeight}px`;const label=id==='boss'&&currentBattle?CHAPTERS[currentBattle.id].boss:world.anchors[id].label;button.setAttribute('aria-label',label);button.firstElementChild.textContent=label;}});
  if(!codex.isOpen()&&!document.hidden){world.update(elapsed,motionReduced(),dt);encounters?.update(dt,motionReduced(),elapsed);world.render();}}
syncSettings();synchronize();$('enter').disabled=$('continue').disabled=$('presenter-start').disabled=true;
world.ready.then(()=>{ready=true;document.body.classList.add('ready');$('enter').disabled=$('presenter-start').disabled=false;$('continue').disabled=false;synchronize();$('load-status').textContent='A complete journey · About 6–8 minutes, with optional research';if(loaded.error)notify(loaded.error);}).catch(error=>{$('load-status').textContent=`The sanctuary could not load: ${error.message}. Reload to try again.`;});requestAnimationFrame(frame);
if(new URLSearchParams(location.search).has('profile')){window.__profileWorld=world;window.__navigation={isBusy:nav.isBusy,snapshot:nav.snapshot};window.__game={state:()=>copy(getState()),mode:()=>presenter?'presenter':'story',scene:nav.location,researchOpen:codex.isOpen,battle:()=>currentBattle?.battle,stage:()=>encounters?.inspect()};}
