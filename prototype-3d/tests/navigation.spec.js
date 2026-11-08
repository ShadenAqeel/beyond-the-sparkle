import {test,expect} from '@playwright/test';
import {start,settled,seed,checkpoint} from './helpers.js';
import {CHAPTERS} from '../src/chapters.js';
const snapshot=page=>page.evaluate(()=>window.__navigation.snapshot());
async function close(page,key){if(key==='Escape')await page.keyboard.press(key);else await page.getByRole('button',{name:'Close inspection'}).click();await settled(page);}

test('X and Escape restore every shrine inspection to its exact exploration pose',async({page})=>{
 await start(page);
 for(const name of ['The living flame','Pedestal of Form','Pedestal of Division','Pedestal of Memory','The seal of three truths','Descend to the scholars']){
  for(const key of ['X','Escape']){const origin=await snapshot(page);await page.getByRole('button',{name,exact:true}).click();await expect(page.locator('#panel')).toBeVisible();await close(page,key);const restored=await snapshot(page);expect(restored.camera).toEqual(origin.camera);expect(restored.target).toEqual(origin.target);expect(restored.location).toBe('shrine');expect(restored.hasOrigin).toBe(false);await expect(page.locator('#panel')).toBeHidden();}
 }
});
test('all three scholars close into the crypt, and each boss and the Old Scholar into its own room',async({page})=>{
 await seed(page,checkpoint({exile:true}));await start(page,true);
 await page.getByRole('button',{name:'Descend to the scholars',exact:true}).click();await expect(page.locator('#panel-title')).toHaveText('Someone is still waiting');
 const crypt=await snapshot(page);await page.getByRole('button',{name:'Approach The Stonekeeper',exact:true}).click();await close(page,'X');
 expect((await snapshot(page)).camera).toEqual(crypt.camera);
 for(const name of ['The Stonekeeper','The Divider','The Seer'])for(const key of ['X','Escape']){await page.getByRole('button',{name,exact:true}).click();await close(page,key);expect((await snapshot(page)).location).toBe('crypt');expect((await snapshot(page)).camera).toEqual(crypt.camera);}
 await page.locator('#back').click();await settled(page);
 for(const id of ['form','division','memory','exile']){
  if(id==='exile'){await page.getByRole('button',{name:'The seal of three truths',exact:true}).click();await page.getByRole('button',{name:'Face the Nameless Exile',exact:true}).click();}
  else{await page.getByRole('button',{name:'The living flame',exact:true}).click();await page.getByRole('button',{name:`Enter ${CHAPTERS[id].chamber}`,exact:true}).click();}
  await expect(page.locator('#panel')).toBeVisible();await close(page,'X');const origin=await snapshot(page);expect(origin.location).toBe(`arena:${id}`);
  await page.getByRole('button',{name:CHAPTERS[id].boss,exact:true}).click();await close(page,'Escape');expect((await snapshot(page)).camera).toEqual(origin.camera);await page.locator('#back').click();await settled(page);
 }
 await page.getByRole('button',{name:'The seal of three truths',exact:true}).click();await page.getByRole('button',{name:'Enter the Hidden Archive',exact:true}).click();await expect(page.locator('#panel')).toBeVisible();await close(page,'X');const archive=await snapshot(page);expect(archive.location).toBe('archive');await page.getByRole('button',{name:'The Old Scholar',exact:true}).click();await close(page,'Escape');expect((await snapshot(page)).camera).toEqual(archive.camera);
});
test('repeated Escape safely interrupts a moving stair descent',async({page})=>{
 await start(page);await page.getByRole('button',{name:'Motion reduced',exact:true}).click();const origin=await snapshot(page);
 await page.getByRole('button',{name:'Descend to the scholars',exact:true}).click();await page.waitForTimeout(500);for(let i=0;i<4;i++)await page.keyboard.press('Escape');await settled(page);await page.waitForTimeout(700);const result=await snapshot(page);expect(result.camera).toEqual(origin.camera);expect(result.target).toEqual(origin.target);expect(result.hasOrigin).toBe(false);await expect(page.locator('#panel')).toBeHidden();
});
