// Dev-only screenshot tour: node tools/shots.mjs <outdir> [only]
import {chromium} from 'playwright';
const out=process.argv[2]||'/tmp/shots',only=process.argv[3]||'';
const browser=await chromium.launch({executablePath:process.env.BROWSER_PATH||process.env.CHROME||'/usr/bin/google-chrome',args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
page.on('pageerror',e=>console.log('PAGEERROR',e.message));
await page.emulateMedia({reducedMotion:process.env.REDUCED?'reduce':'no-preference'});
await page.goto('http://127.0.0.1:5173/?profile=1');
await page.waitForFunction(()=>!document.getElementById('presenter-start').disabled,null,{timeout:120000});
await page.click('#presenter-start');
const settled=()=>page.waitForFunction(()=>window.__navigation&&!window.__navigation.isBusy()&&document.getElementById('scene-fade').hidden,null,{timeout:120000});
const choose=async label=>{if(!(await page.locator('#journey-dialog[open]').count()))await page.click('#presenter-controls');await page.getByRole('button',{name:label,exact:true}).click();await settled();await page.waitForTimeout(800);};
for(const [id,boss] of [['form','The Hollow Scale'],['division','The Twin Warden'],['memory','The Veiled Mirror'],['exile','The Nameless Exile']]){
  if(only&&!only.split(',').includes(id))continue;
  await choose('Face '+boss);
  await page.screenshot({path:`${out}/${id}-intro.png`});
  const b=page.getByRole('button',{name:'Begin the encounter',exact:true});if(await b.count()){await b.click();await page.waitForTimeout(900);await page.screenshot({path:`${out}/${id}-fight.png`});
   for(let i=0;i<3;i++){const st=await page.evaluate(()=>window.__game.battle());if(st.phase!=='battle')break;const {nextMove}=await import('../src/combat.js');const mv=nextMove(st);
     const btn=page.getByRole('button',{name:mv.damage>=2?'Defend':'Attack',exact:true});await btn.click();await page.waitForTimeout(mv.damage>=2?650:330);await page.screenshot({path:`${out}/${id}-turn${i}.png`});await page.waitForFunction(()=>!document.querySelector('#panel-actions button:disabled'),null,{timeout:20000}).catch(()=>{});await page.waitForTimeout(300);}
   await page.screenshot({path:`${out}/${id}-after.png`});}
}
if(!only||only.includes('crypt')){
  await page.keyboard.press('Escape');await page.waitForTimeout(400);
  if(await page.locator('#back').isVisible())await page.click('#back');await settled();
  const down=async()=>{await page.getByRole('button',{name:'Descend to the scholars',exact:true}).click();await settled();await page.waitForTimeout(1200);};
  await down();await page.screenshot({path:`${out}/crypt.png`});
  for(const s of ['The Stonekeeper','The Divider','The Seer']){const btn=page.getByRole('button',{name:'Approach '+s,exact:true});if(await btn.count()){await btn.click();await settled();await page.waitForTimeout(900);await page.screenshot({path:`${out}/scholar-${s.split(' ')[1]}.png`});await page.keyboard.press('Escape');await settled();await page.click('#back');await settled();await down();}}
}
if(!only||only.includes('archive')){await choose('Replay the final revelation');await page.screenshot({path:`${out}/archive.png`});}
await browser.close();
