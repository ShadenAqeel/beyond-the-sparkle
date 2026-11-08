import {test,expect} from '@playwright/test';
import {start,enterBoss,settled,solveDiscovery} from './helpers.js';
import {nextMove} from '../src/combat.js';
import {CHAPTERS} from '../src/chapters.js';

test('Hollow Scale: discover a real invalid record, fight a responsive guardian, recover a contradiction',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await enterBoss(page,'form');
 await page.screenshot({path:'qa/overhaul-scale-introduction.png'});
 await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();
 await expect(page.locator('#panel-title')).toHaveText('A stone with no depth');
 await page.locator('.record-card').first().click();await expect(page.locator('.discovery-feedback')).toContainText('positive');
 await page.getByRole('button',{name:/Record 2208/}).click();await expect(page.locator('.discovery-feedback')).toContainText('z = 0');
 await page.screenshot({path:'qa/overhaul-scale-discovery.png'});
 await page.getByRole('button',{name:'Release the balance',exact:true}).click();await page.getByRole('button',{name:'Exploit the opening',exact:true}).click();
 await page.locator('#motion').click();
 await page.getByRole('button',{name:'Attack',exact:true}).click();await page.waitForTimeout(230);
 expect(await page.evaluate(()=>window.__game.stage().action)).toBe('attack');
 await page.screenshot({path:'qa/overhaul-scale-impact.png'});
 for(let i=0;i<15;i++){
  const b=await page.evaluate(()=>window.__game.battle());if(b.phase==='won')break;
  const action=nextMove(b).damage>=2?'Defend':'Attack';await page.getByRole('button',{name:action,exact:true}).click();
 }
 await page.getByRole('button',{name:'Recover Diamond of Form',exact:true}).click();await expect(page.locator('#panel-copy')).toContainText('royal seal is intact');
 await page.getByRole('button',{name:'Return to the shrine',exact:true}).click();await settled(page);await page.getByRole('button',{name:'Pedestal of Form',exact:true}).click();await page.getByRole('button',{name:'Restore Diamond of Form',exact:true}).click();await page.getByRole('button',{name:'Meet The Stonekeeper',exact:true}).click();await page.getByRole('button',{name:'Continue the conversation',exact:true}).click();await expect(page.locator('.scholar-evidence')).toContainText('53,893');
 await expect(page.locator('#panel')).not.toContainText('never stolen');expect(errors).toEqual([]);
});

test('closing during a strike returns locally and cannot repeat committed damage',async({page})=>{
 await start(page);await enterBoss(page,'form');await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();await solveDiscovery(page,'form');await page.locator('#motion').click();
 await page.evaluate(()=>{const attack=[...document.querySelectorAll('#panel-actions button')].find(b=>b.textContent==='Attack');attack.click();attack.click();});
 expect(await page.evaluate(()=>window.__game.battle().turn)).toBe(1);await page.keyboard.press('Escape');await settled(page);expect(await page.evaluate(()=>window.__game.scene())).toBe('arena:form');await page.getByRole('button',{name:'The Hollow Scale',exact:true}).click();await expect(page.locator('.attack-telegraph')).toBeVisible();expect(await page.evaluate(()=>window.__game.battle().boss)).toBe(CHAPTERS.form.health-3);await page.waitForTimeout(900);expect(await page.evaluate(()=>window.__game.battle().turn)).toBe(1);await expect(page.locator('#panel')).toBeVisible();
});

test('wrong grouping choices teach without resetting progress',async({page})=>{
 await start(page);await enterBoss(page,'division');await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();await solveDiscovery(page,'division',{wrong:true});expect(await page.evaluate(()=>window.__game.state().bosses.division.discovered)).toBe(true);
});

test('all four discoveries fit a laptop and expose distinct three-dimensional roles',async({page})=>{
 await page.setViewportSize({width:1366,height:768});await start(page);await page.locator('#journey-button').click();await page.getByRole('button',{name:'Presenter Mode',exact:true}).click();
 for(const id of ['form','division','memory','exile']){
  await page.getByRole('button',{name:'Face '+CHAPTERS[id].boss,exact:true}).click();await page.getByRole('button',{name:'Begin the encounter',exact:true}).click();await page.getByRole('button',{name:CHAPTERS[id].investigate,exact:true}).click();
  const ready={form:()=>page.getByRole('button',{name:/Record 2208/}),division:()=>page.getByRole('button',{name:/Lighter collection/}),memory:()=>page.getByRole('button',{name:'Activate PC1',exact:true}),exile:()=>page.getByRole('button',{name:'Isolated observation 1',exact:true})}[id];await ready().waitFor();
  const bounds=await page.locator('#panel').boundingBox();expect(bounds.y).toBeGreaterThan(70);expect(bounds.y+bounds.height).toBeLessThan(710);expect(await page.locator('#panel').evaluate(p=>p.scrollWidth<=p.clientWidth+1)).toBe(true);
  expect(await page.evaluate(()=>window.__game.stage().roles)).toEqual(id==='division'?['agile','heavy']:[id]);
  if(id==='exile'){
    await page.getByRole('button',{name:'Examine the dense gathering',exact:true}).click();await expect(page.locator('.discovery-feedback')).toContainText('many nearby');expect(await page.locator('.isolated-mark[aria-pressed="true"]').count()).toBe(0);
    for(let i=1;i<=3;i++)await page.getByRole('button',{name:'Isolated observation '+i,exact:true}).click();await expect(page.getByRole('button',{name:'Stand beyond the boundary',exact:true})).toBeVisible();
  }
  await page.screenshot({path:'qa/overhaul-discovery-'+id+'-1366.png'});await page.locator('#presenter-controls').click();
 }
});
