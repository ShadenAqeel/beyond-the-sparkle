import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {initialState,reduce,SAVE_KEY} from '../src/progress.js';

// Run alone against dev or production. Uses a reachable save fixture, never a gameplay shortcut.
const mode=process.argv.includes('--performance')?'performance':'quality';
const url=process.env.SHRINE_URL||'http://127.0.0.1:5173/';
let fixture=reduce(initialState(),{type:'START'});
for(const id of ['form','division','memory'])for(const type of ['TRIAL','DEFEAT','COLLECT','PLACE','REVEAL'])fixture=reduce(fixture,{type,id});
for(const type of ['TRIAL','DEFEAT','COLLECT'])fixture=reduce(fixture,{type,id:'exile'});
const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 await page.addInitScript(({key,state,mode})=>{localStorage.setItem(key,JSON.stringify(state));localStorage.setItem('beyond-the-sparkle.3d.settings.v1',JSON.stringify({muted:true,reduced:false,quality:mode}));},{key:SAVE_KEY,state:fixture,mode});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const start=Date.now();await page.goto(`${url}?profile=1&quality=${mode}`);await page.waitForFunction(()=>!document.getElementById('continue').disabled);const readyToEnterMs=Date.now()-start;
 await page.getByRole('button',{name:'Continue Journey',exact:true}).click();await page.waitForTimeout(1200);
 const hardware=await page.evaluate(()=>{
  const w=window.__profileWorld,r=w.renderer,gl=r.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info'),ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
  const original=w.render.bind(w);r.info.autoReset=false;let previous=performance.now(),frame=0;const queries=[];
  window.__samples=[];window.__gpu=[];window.__phase=0;window.__renderCount=0;
  w.render=()=>{
   r.info.reset();const begin=performance.now(),transition=window.__navigation.isBusy(),q=ext&&frame++%8===0?gl.createQuery():null;
   if(q)gl.beginQuery(ext.TIME_ELAPSED_EXT,q);original();if(q){gl.endQuery(ext.TIME_ELAPSED_EXT);queries.push({q,transition,phase:window.__phase});}
   const end=performance.now();window.__renderCount++;
   if(ext&&queries.length&&gl.getQueryParameter(queries[0].q,gl.QUERY_RESULT_AVAILABLE)){const entry=queries.shift();if(entry.phase===window.__phase&&!gl.getParameter(ext.GPU_DISJOINT_EXT))window.__gpu.push({ms:gl.getQueryParameter(entry.q,gl.QUERY_RESULT)/1e6,transition:entry.transition});gl.deleteQuery(entry.q);}
   window.__samples.push({ms:begin-previous,submitMs:end-begin,calls:r.info.render.calls,triangles:r.info.render.triangles,textures:r.info.memory.textures,transition});previous=begin;
  };
  return{gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),gpuTimingSupported:!!ext,viewport:[innerWidth,innerHeight],drawingBuffer:[r.domElement.width,r.domElement.height],pixelRatio:r.getPixelRatio()};
 });
 const phases=[];
 async function record(name,action,duration=3500){
  await page.evaluate(()=>{window.__phase++;window.__samples=[];window.__gpu=[];});const interactionStart=Date.now();if(action)await action();
  const moving=/transition|descent/.test(name);
  if(moving)await page.locator('#panel').waitFor({state:'visible'});else await page.waitForTimeout(duration);
  const interactionReadyMs=moving?Date.now()-interactionStart:undefined;
  const {samples,gpu}=await page.evaluate(moving=>({samples:moving?window.__samples.filter(s=>s.transition):window.__samples.slice(2),gpu:window.__gpu.filter(s=>!moving||s.transition)}),moving);
  if(!samples.length)throw new Error(`No measured frames for ${name}`);
  const frames=samples.map(s=>s.ms).sort((a,b)=>a-b),mean=key=>samples.reduce((n,s)=>n+s[key],0)/samples.length,average=mean('ms');
  const result={name,cameraMotionOnly:moving,interactionReadyMs,samples:samples.length,averageFPS:1000/average,minimumInstantaneousFPS:1000/frames.at(-1),meanFrameMs:average,p95FrameMs:frames[Math.floor(frames.length*.95)],worstFrameMs:frames.at(-1),meanRenderSubmitMs:mean('submitMs'),meanDrawCalls:mean('calls'),meanTriangles:mean('triangles'),textureObjects:samples.at(-1).textures,meanGpuMs:gpu.length?gpu.reduce((n,s)=>n+s.ms,0)/gpu.length:null,gpuSamples:gpu.length};
  phases.push(result);console.log(JSON.stringify(result));
 }
 const button=name=>page.getByRole('button',{name,exact:true});
 const settle=()=>page.waitForFunction(()=>!window.__navigation.isBusy()&&document.getElementById('scene-fade').hidden);
 await record('restored-shrine-idle');
 await record('flame-transition',()=>button('The living flame').click(),1800);await page.keyboard.press('Escape');await settle();
 await record('three-scholar-crypt-descent',()=>button('Descend to the scholars').click(),3100);
 await record('three-scholar-crypt-idle');await page.keyboard.press('Escape');await settle();
 // Presenter runs the same rendering/encounter engine with instant scene changes.
 await page.locator('#journey-button').click();await button('Presenter Mode').click();
 await button('Face The Hollow Scale').click();await button('Begin the encounter').click();await settle();await record('hollow-scale-battle');await page.locator('#presenter-controls').click();
 await button('Face The Twin Warden').click();await button('Begin the encounter').click();await settle();await page.waitForTimeout(500);
 await record('twin-warden-battle');
 await record('player-strike-and-hit-reaction',()=>button('Attack').click(),1200);
 await record('coordinated-boss-attack-and-block',()=>button('Defend').click(),1200);
 await record('diamond-recovery',()=>button('Presenter · resolve encounter').click(),2500);
 await page.locator('#presenter-controls').click();await button('Face The Veiled Mirror').click();await button('Begin the encounter').click();await settle();await record('pca-boss-battle');
 await page.locator('#presenter-controls').click();await button('Face The Nameless Exile').click();await button('Begin the encounter').click();await settle();await record('exile-battle');
 await record('eclipse-recovery',()=>button('Presenter · resolve encounter').click(),2500);
 await page.locator('#presenter-controls').click();await button('Replay the final revelation').click();await expectPanel();await settle();await record('archive-old-scholar');
 await page.screenshot({path:`qa/profile-archive-${mode}.png`});
 await page.locator('#presenter-controls').click();const chartStart=Date.now();await button('Research · Memory').click();await page.locator('#research-chart .main-svg').first().waitFor();const chartReadyMs=Date.now()-chartStart;
 const rendersBefore=await page.evaluate(()=>window.__renderCount);await page.waitForTimeout(700);const codexRenderCallsDuring700Ms=await page.evaluate(n=>window.__renderCount-n,rendersBefore);
 const inventory=await page.evaluate(()=>{
  const w=window.__profileWorld,geometries=new Set(),textures=new Set(),lights=[];let meshes=0,geometryBytes=0,textureBytes=0;
  w.scene.traverse(o=>{if(o.isMesh)meshes++;if(o.geometry&&!geometries.has(o.geometry)){geometries.add(o.geometry);geometryBytes+=Object.values(o.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)+(o.geometry.index?.array.byteLength||0);}if(o.isLight)lights.push({type:o.type,shadow:o.castShadow,map:o.shadow?.mapSize.toArray()});for(const m of o.material?Array.isArray(o.material)?o.material:[o.material]:[])for(const t of Object.values(m))if(t?.isTexture&&!textures.has(t)){textures.add(t);textureBytes+=(t.image?.width||0)*(t.image?.height||0)*4*4/3;}});
  return{meshes,geometries:geometries.size,geometryBufferMiB:geometryBytes/1048576,sourceTextureEstimateMiB:textureBytes/1048576,lights};
 });
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/^http/.test(r.name)).map(r=>({name:r.name.split('/').slice(-2).join('/'),transferBytes:r.transferSize,decodedBytes:r.decodedBodySize,durationMs:r.duration})));
 const report={date:new Date().toISOString(),mode,url,readyToEnterMs,hardware,inventory,phases,chartReadyMs,codexRenderCallsDuring700Ms,resourceTransferBytes:resources.reduce((n,r)=>n+r.transferBytes,0),resources,errors,limits:'One Intel UHD-class local machine, Edge headless, loopback, unthrottled. Minimum FPS is 1000 / worst sampled frame, not sustained minimum. GPU query samples are asynchronous and disjoint-checked. Geometry bytes sum attribute/index array views and may count interleaved/shared arrays more than once. Source texture and geometry bytes are estimates, not total VRAM; exclude render targets, shadows, driver storage and residency. Loading times include local shader preparation, not internet latency. Encounter phases warm shaders behind the scene fade; camera rows filter moving frames.'};
 await mkdir('docs/profiling',{recursive:true});const file=`docs/profiling/complete-${mode}-${process.env.SHRINE_URL?'production':'development'}.json`;await writeFile(file,JSON.stringify(report,null,2));console.log(`Saved ${file}`);
 async function expectPanel(){await page.locator('#panel-title').filter({hasText:'The stones were never lost'}).waitFor();}
}finally{await browser.close();}
