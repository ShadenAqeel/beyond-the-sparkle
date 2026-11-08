import { expect } from '@playwright/test';
import {nextMove} from '../src/combat.js';
import { CHAPTERS } from '../src/chapters.js';
import { SAVE_KEY,initialState,reduce } from '../src/progress.js';
export function checkpoint({placed=true,exile=false,ended=false,location='shrine'}={}){
 let s=reduce(initialState(),{type:'START'});
 if(placed)for(const id of ['form','division','memory'])for(const type of ['TRIAL','DEFEAT','COLLECT','PLACE','REVEAL'])s=reduce(s,{type,id});
 if(exile)for(const type of ['TRIAL','DEFEAT','COLLECT'])s=reduce(s,{type,id:'exile'});
 if(ended)s=reduce(s,{type:'END'});return reduce(s,{type:'VISIT',location});
}
export async function seed(page,state=checkpoint()){
 await page.addInitScript(({key,state})=>{if(!sessionStorage.getItem('test-seeded')){localStorage.setItem(key,JSON.stringify(state));sessionStorage.setItem('test-seeded','yes');}}, {key:SAVE_KEY,state});
}
export async function start(page,continueSave=false){await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`${process.env.GAME_URL||'http://127.0.0.1:5173/'}?profile=1`);await page.getByRole('button',{name:continueSave?'Continue Journey':'New Journey',exact:true}).click();await settled(page);}
export async function settled(page){await page.waitForFunction(()=>window.__navigation&&!window.__navigation.isBusy());await page.locator('#scene-fade').waitFor({state:'hidden'});}
export async function closePanel(page){await page.getByRole('button',{name:'Close inspection'}).click();await settled(page);}
// Every chamber is entered through the living flame (pedestals also offer an unrecovered guardian).
export async function enterBoss(page,id){await page.getByRole('button',{name:'The living flame',exact:true}).click();await page.getByRole('button',{name:`Enter ${CHAPTERS[id].chamber}`,exact:true}).click();await page.getByRole('button',{name:'Begin the encounter',exact:true}).waitFor();}
export async function solveDiscovery(page,id,{wrong=false}={}){
 if(id==='form'){
  if(wrong){await page.locator('.record-card').first().click();await expect(page.locator('.discovery-feedback')).toContainText('positive');}
  await page.getByRole('button',{name:/Record 2208/}).click();await page.getByRole('button',{name:'Release the balance',exact:true}).click();
 }else if(id==='division'){
  await page.getByRole('button',{name:/Lighter collection/}).click();await page.getByRole('button',{name:/Heavier collection/}).click();
  if(wrong){await page.getByRole('button',{name:'Pair with heavier collection',exact:true}).click();await expect(page.locator('.discovery-feedback')).toContainText('Try the other');}
  await page.getByRole('button',{name:'Pair with lighter collection',exact:true}).click();await page.getByRole('button',{name:'Break the connection',exact:true}).click();
 }else if(id==='memory'){
  await page.getByRole('button',{name:'Activate PC1',exact:true}).click();await page.getByRole('button',{name:'Activate PC2',exact:true}).click();await expect(page.locator('.discovery-result')).toContainText('88.12%');await page.getByRole('button',{name:'See through the veil',exact:true}).click();
 }else{
  for(let i=1;i<=3;i++)await page.getByRole('button',{name:'Isolated observation '+i,exact:true}).click();await page.getByRole('button',{name:'Stand beyond the boundary',exact:true}).click();
 }
 await page.getByRole('button',{name:'Exploit the opening',exact:true}).click();
}
export async function fight(page,{lose=false}={}){
 for(let i=0;i<25;i++){
  const b=await page.evaluate(()=>window.__game.battle());if(b.phase!=='battle')break;
  const action=lose?'Attack':nextMove(b).damage>=2?'Defend':'Attack';await page.getByRole('button',{name:action,exact:true}).click();
  await page.waitForFunction(()=>!document.querySelector('#panel-actions button:disabled'));
 }
}
export async function winBoss(page,id,{wrong=false,lose=false}={}){
 await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();
 if(!(await page.evaluate(id=>window.__game.state().bosses[id].discovered,id)))await solveDiscovery(page,id,{wrong});
 if(lose){await fight(page,{lose:true});await expect(page.locator('#panel-title')).toHaveText('You fell');await page.getByRole('button',{name:'Retry encounter',exact:true}).click();}
 await fight(page);await page.getByRole('button',{name:'Recover '+(id==='exile'?'Eclipse Diamond':'Diamond of '+CHAPTERS[id].name),exact:true}).click();
}
export async function restore(page,id,{research=true}={}){await page.getByRole('button',{name:'Return to the shrine',exact:true}).click();await settled(page);await page.getByRole('button',{name:`Pedestal of ${CHAPTERS[id].name}`,exact:true}).click();await page.getByRole('button',{name:`Restore Diamond of ${CHAPTERS[id].name}`,exact:true}).click();if(!research){await page.getByRole('button',{name:'Keep exploring',exact:true}).click();await settled(page);return;}await page.getByRole('button',{name:`Meet ${CHAPTERS[id].scholar}`,exact:true}).click();await page.getByRole('button',{name:'Continue the conversation',exact:true}).click();await page.getByRole('button',{name:'Open the research fragment',exact:true}).click();await expect(page.locator('#codex-body h2')).toBeVisible();await expect(page.locator('.research-chart .main-svg').first()).toBeVisible({timeout:20000});await page.getByRole('button',{name:'Close Research Codex'}).click();await closePanel(page);expect(await page.evaluate(()=>window.__game.scene())).toBe('crypt');await page.locator('#back').click();await settled(page);}
