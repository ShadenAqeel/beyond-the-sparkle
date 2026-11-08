import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const browser = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
await page.route('**/src/main.js', route => route.fulfill({ contentType: 'text/javascript', body: `
import * as T from '/node_modules/three/build/three.module.js'; import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
document.body.innerHTML='';const r=new T.WebGLRenderer({antialias:true});r.setSize(1000,1000);r.toneMapping=T.ACESFilmicToneMapping;document.body.append(r.domElement);
const s=new T.Scene();s.background=new T.Color('#243039');s.add(new T.HemisphereLight('#d4e2eb','#34312c',2));const l=new T.DirectionalLight('#ffe6c2',3);l.position.set(2,3,4);s.add(l);
const c=new T.PerspectiveCamera(38,1,.1,50);c.position.set(.9,1.3,2.8);c.lookAt(0,1,0);
const g=await new GLTFLoader().loadAsync('/models/stonekeeper-base.glb');s.add(g.scene);window.ready=true;window.nodes=[];g.scene.traverse(n=>{if(n.isBone)window.nodes.push({name:n.name,p:n.getWorldPosition(new T.Vector3()).toArray()})});function frame(){r.render(s,c);requestAnimationFrame(frame)}frame();` }));
await page.goto('http://127.0.0.1:5173/'); await page.waitForFunction(() => window.ready);
await mkdir('qa', { recursive: true }); await page.screenshot({ path: 'qa/character-base.png' }); console.log(JSON.stringify(await page.evaluate(() => window.nodes))); await browser.close();


