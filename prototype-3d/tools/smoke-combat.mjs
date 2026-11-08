// Dev smoke test for the combat overhaul: node tools/smoke-combat.mjs
// Plays real fights through the UI (story + presenter), including a loss/retry,
// Escape mid-fight, keyboard controls, the Exile's enrage and victory/recovery.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {nextMove} from '../src/combat.js';
import {CHAPTERS} from '../src/chapters.js';
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1366,height:768}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('favicon.ico'))errors.push(r.status()+' '+r.url());});page.on('console',m=>{if(m.type()==='error'&&!m.text().startsWith('Failed to load resource'))errors.push(m.text());});
await page.emulateMedia({reducedMotion:'reduce'});
await page.goto((process.env.GAME_URL||'http://127.0.0.1:5173/')+'?profile=1');
await page.waitForFunction(()=>!document.getElementById('enter').disabled,null,{timeout:180000});
const settled=()=>page.waitForFunction(()=>window.__navigation&&!window.__navigation.isBusy()&&document.getElementById('scene-fade').hidden,null,{timeout:180000});
const ready=()=>page.waitForFunction(()=>!document.querySelector('#panel-actions button:disabled'),null,{timeout:60000});
const battle=()=>page.evaluate(()=>window.__game.battle());
const step=(name,ok=true)=>console.log(ok?'✓':'✗',name);
async function fight({blind=false,keyboard=false}={}){
  for(let i=0;i<40;i++){const b=await battle();if(b.phase!=='battle')return b;
    const defend=!blind&&nextMove(b).damage>=2;
    if(keyboard)await page.keyboard.press(defend?'k':'j');else await page.getByRole('button',{name:defend?'Defend':'Attack',exact:true}).click();
    await page.waitForFunction(t=>window.__game.battle().turn>t,b.turn);await ready().catch(()=>{});
  }
  return battle();
}
// Story mode: the Hollow Scale.
await page.click('#enter');await settled();
// The chamber hotspots were removed: bosses are reached from the living flame and the pedestals.
assert.equal(await page.getByRole('button',{name:'Chamber of Form',exact:true}).count(),0);
for(const id of ['form','division','memory']){
  await page.getByRole('button',{name:`Pedestal of ${CHAPTERS[id].name}`,exact:true}).click();
  await page.getByRole('button',{name:`Enter ${CHAPTERS[id].chamber}`,exact:true}).waitFor({timeout:30000});
  await page.keyboard.press('Escape');await settled();
}
step('each pedestal offers its own chamber');
await page.getByRole('button',{name:'The living flame',exact:true}).click();
for(const id of ['form','division','memory'])await page.getByRole('button',{name:`Enter ${CHAPTERS[id].chamber}`,exact:true}).waitFor({timeout:30000});
step('the living flame offers all three chambers');
await page.getByRole('button',{name:'Enter Chamber of Form',exact:true}).click();
await page.getByRole('button',{name:'Begin the encounter',exact:true}).waitFor({timeout:180000});
assert.equal(await page.locator('#panel-title').textContent(),'The Hollow Scale');
assert.ok(await page.locator('#panel.fighting.card').isVisible());step('title card shows name + epithet, no lore');
await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();
await page.locator('.boss-bar').waitFor();assert.ok(await page.locator('.attack-telegraph .tag').isVisible());
const words=(await page.locator('#panel').innerText()).split(/\s+/).length;assert.ok(words<40,`HUD text should be minimal, got ${words} words`);step(`combat HUD is minimal (${words} words on screen)`);
let b=await fight({blind:true});assert.equal(b.phase,'lost');assert.equal(await page.locator('#panel-title').textContent(),'You fell');step('blind striking loses → "You fell" card');
await page.getByRole('button',{name:'Retry encounter',exact:true}).click();b=await battle();assert.equal(b.boss,CHAPTERS.form.health);assert.equal(b.player,CHAPTERS.form.playerHealth);step('retry restores both health pools');
// One keyboard turn, then Escape mid-fight and resume from the hotspot.
await page.keyboard.press('j');await page.waitForFunction(()=>window.__game.battle().turn===1);await ready();
b=await battle();assert.equal(b.boss,CHAPTERS.form.health-3);assert.ok(b.last.critical);step('keyboard J strikes; striking an opening is a critical (3)');
await page.keyboard.press('Escape');await settled();assert.ok(await page.locator('#panel').isHidden());
await page.getByRole('button',{name:'The Hollow Scale',exact:true}).click();await page.locator('.boss-bar').waitFor();assert.equal((await battle()).turn,1);step('Escape leaves the fight; returning resumes without repeating damage');
b=await fight({keyboard:true});assert.equal(b.phase,'won');assert.ok(b.player>0);step(`reading the guardian wins (${b.player}/${CHAPTERS.form.playerHealth} health left)`);
await page.getByRole('button',{name:'Recover Diamond of Form',exact:true}).click();
assert.match(await page.locator('#panel-copy').textContent(),/royal seal is intact/);assert.ok(await page.locator('#panel.fighting').count()===0);step('recovery reveals the story clue after the fight');
assert.ok((await page.evaluate(()=>window.__game.state().bosses.form.collected)));
await page.getByRole('button',{name:'Return to the shrine',exact:true}).click();await settled();
await page.getByRole('button',{name:'Pedestal of Form',exact:true}).click();await page.getByRole('button',{name:'Restore Diamond of Form',exact:true}).click();
await page.getByRole('button',{name:'Meet The Stonekeeper',exact:true}).click();await page.locator('#panel.conversation').waitFor({timeout:180000});step('restoring the diamond leads to the keeper conversation');
// Presenter: the Exile, including enrage and victory.
await page.keyboard.press('Escape');await settled();await page.click('#journey-button');await page.getByRole('button',{name:'Presenter Mode',exact:true}).click();
// Presenter reaches every guardian, each staged as its own procedural actor.
for(const [id,roles] of [['form',['form']],['division',['agile','heavy']],['memory',['memory']]]){
  if(!(await page.locator('#journey-dialog[open]').count()))await page.click('#presenter-controls');
  await page.getByRole('button',{name:`Face ${CHAPTERS[id].boss}`,exact:true}).click();await settled();
  await page.getByRole('button',{name:'Begin the encounter',exact:true}).waitFor({timeout:180000});
  assert.deepEqual((await page.evaluate(()=>window.__game.stage())).roles,roles);
}
step('Presenter Mode reaches all three guardians');
await page.click('#presenter-controls');
await page.getByRole('button',{name:'Face The Nameless Exile',exact:true}).click();await settled();
await page.getByRole('button',{name:'Begin the encounter',exact:true}).waitFor({timeout:180000});
const stage=await page.evaluate(()=>window.__game.stage());assert.deepEqual(stage.roles,['exile']);
await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();
let sawRage=false;for(let i=0;i<40;i++){b=await battle();if(b.phase!=='battle')break;if(await page.locator('#panel.enraged').count())sawRage=true;
  await page.getByRole('button',{name:nextMove(b).damage>=2?'Defend':'Attack',exact:true}).click();await page.waitForFunction(t=>window.__game.battle().turn>t,b.turn);await ready().catch(()=>{});}
b=await battle();assert.equal(b.phase,'won');assert.ok(sawRage);step('the Exile enrages below half health and can be beaten');
assert.equal(await page.locator('#panel-title').textContent(),'Guardian felled');step('victory card');
await page.getByRole('button',{name:'Return to Story',exact:true}).first().click().catch(()=>{});
assert.deepEqual(errors,[]);step('no page errors');
await browser.close();
