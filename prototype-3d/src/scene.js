import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createMaterials } from './materials.js';
import { batchArchitecture } from './batching.js';
import { createGemGeometry, createGemMaterial, createReflectionEnvironment } from './gemstone.js';
import { loadStonekeeper } from './stonekeeper.js';

// Static architecture is spatially batched; character, door and gems stay independent.
export function createWorld(container) {
  const renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.transmissionResolutionScale = .5;
  container.append(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color('#101a22');
  scene.fog = new T.FogExp2('#18242b', .027);
  const camera = new T.PerspectiveCamera(56, 1, .12, 150);
  let composer;
  function createComposer() {
    const value = new EffectComposer(renderer); value.addPass(new RenderPass(scene, camera));
    value.addPass(new UnrealBloomPass(new T.Vector2(innerWidth, innerHeight), .24, .65, 1.15)); value.addPass(new OutputPass()); return value;
  }
  const interactables = [], flames = [], candlePositions = [];
  const geometryCache = new Map();
  const cached = (key, create) => { if (!geometryCache.has(key)) geometryCache.set(key, create()); return geometryCache.get(key); };
  const random = (() => { let seed = 71; return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; })();
  const { stone, darkStone, trim, column, floor, gold, iron, wood } = createMaterials(renderer);
  const map = stone.map;
  const wax = new T.MeshStandardMaterial({ color: '#c2b894', roughness: .85 });
  const flameCanvas = document.createElement('canvas'); flameCanvas.width = flameCanvas.height = 128;
  const flameContext = flameCanvas.getContext('2d'), flameGradient = flameContext.createRadialGradient(64, 76, 2, 64, 64, 59);
  flameGradient.addColorStop(0, '#fff9dcff'); flameGradient.addColorStop(.2, '#ffe1a1ed'); flameGradient.addColorStop(.5, '#ffa84788'); flameGradient.addColorStop(1, '#ec511000');
  flameContext.fillStyle = flameGradient; flameContext.fillRect(0, 0, 128, 128);
  const flameMap = new T.CanvasTexture(flameCanvas); flameMap.colorSpace = T.SRGBColorSpace;
  function mesh(geo, mat, x, y, z, parent = scene) {
    const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function box(x, y, z, w, h, d, mat = stone, parent = scene) { return mesh(cached(`b/${w}/${h}/${d}`, () => new T.BoxGeometry(w, h, d)), mat, x, y, z, parent); }
  function cylinder(x, y, z, top, bottom, height, mat = stone, n = 12, parent = scene) { return mesh(cached(`c/${top}/${bottom}/${height}/${n}`, () => new T.CylinderGeometry(top, bottom, height, n)), mat, x, y, z, parent); }
  function ring(x, y, z, radius, tube, mat = gold, parent = scene) { const m = mesh(new T.TorusGeometry(radius, tube, 6, 64), mat, x, y, z, parent); m.rotation.x = -Math.PI / 2; return m; }
  function pointedArch(x, y, z, width, height, depth, mat = stone, rotation = 0) {
    const shape = new T.Shape(), half = width / 2, spring = height * .55, thickness = .38;
    shape.moveTo(-half, 0); shape.lineTo(-half, spring);
    shape.quadraticCurveTo(-half, height * .83, 0, height);
    shape.quadraticCurveTo(half, height * .83, half, spring); shape.lineTo(half, 0);
    shape.lineTo(half - thickness, 0); shape.lineTo(half - thickness, spring);
    shape.quadraticCurveTo(half - thickness, height * .79, 0, height - thickness * 1.4);
    shape.quadraticCurveTo(-half + thickness, height * .79, -half + thickness, spring);
    shape.lineTo(-half + thickness, 0); shape.closePath();
    const m = mesh(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .06, bevelThickness: .06, bevelSegments: 1, steps: 1, curveSegments: 16 }), mat, x, y, z);
    m.rotation.y = rotation; return m;
  }
  scene.add(new T.HemisphereLight('#8aa6bb', '#171816', .72));
  const moonShaft = new T.SpotLight('#93b9da', 240, 35, .47, .8, 1.7);
  moonShaft.position.set(-5.5, 10, -9); moonShaft.target.position.set(1, 0, 2); scene.add(moonShaft, moonShaft.target);
  moonShaft.castShadow = true; moonShaft.shadow.mapSize.set(1024, 1024); moonShaft.shadow.bias = -.001;
  const moon = new T.DirectionalLight('#9fbed7', 2.5); moon.position.set(-9, 18, -6);
  moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -24, right: 24, top: 22, bottom: -22, near: 1, far: 60 }); moon.shadow.bias = -.0005; scene.add(moon);
  box(0, -.55, -1, 18, 1, 85, darkStone);
  box(-27, -.55, -1, 36, 1, 85, darkStone);
  box(31, -.55, -1, 26, 1, 85, darkStone);
  box(10.5, -.55, 22, 7, 1, 30, darkStone);
  box(10.5, -.55, -30, 7, 1, 32, darkStone);
  box(0, -.01, -1, 18, .12, 39, floor);
  // Back wall: courses of masonry, recessed buttresses and a monumental sealed arch.
  for (const side of [-1, 1]) {
    for (let row = 0; row < 9; row++) for (let col = 0; col < 3; col++) {
      box(side * (3.8 + col * 2), row * .82 + .4, -12, 1.93, .76, .85, row % 3 ? stone : darkStone);
    }
    if (side === -1) box(-9, 5.5, -3, 1, 11, 37, stone);
    else { box(9, 5.5, -7, 1, 11, 18, stone); box(9, 5.5, 12, 1, 11, 12, stone); box(9, 7.7, 4, 1, 6.6, 4); }
    for (const z of [-16, -10, -4, 2, 8, 14]) {
      cylinder(side * 8.4, .25, z, .72, .85, .5, darkStone);
      const ruined = z === -16;
      cylinder(side * 8.4, ruined ? 1.45 : 3.4, z, .39, .48, ruined ? 2.2 : 6.1, column, 24);
      for (const offset of [-.2, .2]) cylinder(side * 8.4 + offset, ruined ? 1.4 : 3.3, z + .28, .1, .13, ruined ? 2 : 5.8, column, 12);
      for (const y of ruined ? [.65, 2.5] : [.65, 5.9, 6.4]) cylinder(side * 8.4, y, z, .65, .65, .22, trim);
      const arch = pointedArch(side * 8.4, .4, z, 16.8, 10.4, .35, trim);
      // Transverse ribs sit across the nave, with one base at each side.
      arch.position.x = 0;
      if (side === 1 || ruined) scene.remove(arch);
      box(side * 8.65, ruined ? .6 : 1.5, z, 1.1, ruined ? 1.2 : 3, 1.3, darkStone);
    }
    for (const z of side === -1 ? [-13, -7, -1, 5, 11] : [-13, -7, 11]) {
      pointedArch(side * 8.65, .3, z, 4.6, 6, .4, trim, Math.PI / 2);
      pointedArch(side * 8.6, .3, z, 3.9, 5.6, .2, darkStone, Math.PI / 2);
    }
  }
  // A continuous sanctuary surrounds the camera; the viewer never sees platform edges.
  box(0, 6, 18, 19, 12, 1, darkStone);
  for (const x of [-6.7, -3.5, 3.5, 6.7]) {
    box(x, 8.6, -12, 2.6, 5, 1, stone);
    pointedArch(x, 6.2, -11.35, 2.2, 4.5, .25, trim);
    const glass = new T.MeshStandardMaterial({ color: '#4a686d', emissive: '#6b9ba2', emissiveIntensity: .35, roughness: .5 });
    box(x, 8.1, -11.65, 1.45, 3.1, .08, glass);
    for (const offset of [-.42, 0, .42]) box(x + offset, 8.1, -11.5, .055, 3.15, .1, iron);
  }
  box(0, 12.3, -2, 20, .6, 30, darkStone);
  pointedArch(8.65, 0, 4, 3.9, 4.8, .65, trim, Math.PI / 2);
  // Recessed votive niches, funerary tablets and decayed pews give human scale.
  for (const z of [-8, -2, 5, 11]) {
    pointedArch(-8.35, .5, z, 2.2, 3.4, .25, trim, Math.PI / 2);
    box(-8.15, 1.15, z, .75, .25, 1.9, darkStone);
    for (let j = 0; j < 5; j++) candle(-7.95, 1.3, z - .65 + j * .3);
    for (const side of [-1, 1]) {
      if (side === 1 && z === 5) continue;
      box(side * 6.6, .62, z, 1.9, .16, .9, wood);
      box(side * 6.6, 1.05, z - .4, 1.9, .85, .1, wood);
      for (const dx of [-.7, .7]) box(side * 6.6 + dx, .3, z, .12, .6, .65, wood);
    }
  }
  // Broken ribs and a rose-window tracery against the sky.
  pointedArch(0, 0, -11.4, 5.5, 8.2, .65, trim);
  pointedArch(0, .1, -11.1, 4.6, 7.4, .3, darkStone);
  const rose = mesh(new T.TorusGeometry(1.35, .13, 8, 48), trim, 0, 9.4, -11.7);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const r = mesh(new T.TorusGeometry(.48, .065, 6, 32), trim, Math.sin(a) * .75, 9.4 + Math.cos(a) * .75, -11.7); r.scale.y = 1.3; }
  box(0, 7.9, -12, 6, .5, 1, darkStone);
  const door = new T.Group(); door.userData.dynamic = true; scene.add(door);
  const leafGeo = new T.BoxGeometry(1.8, 5.6, .38);
  const doorMat = new T.MeshStandardMaterial({ color: '#263331', metalness: .65, roughness: .7, map });
  const leftHinge = new T.Group(), rightHinge = new T.Group(); leftHinge.position.set(-1.8, 0, -11.25); rightHinge.position.set(1.8, 0, -11.25); door.add(leftHinge, rightHinge);
  mesh(leafGeo, doorMat, .9, 2.8, 0, leftHinge); mesh(leafGeo, doorMat, -.9, 2.8, 0, rightHinge);
  for (const [hinge, sign] of [[leftHinge, 1], [rightHinge, -1]]) {
    for (const y of [.5, 1.8, 3.6, 5.1]) box(sign * .9, y, .24, 1.7, .075, .08, gold, hinge);
    for (const x of [.25, .9, 1.55]) box(sign * x, 2.8, .24, .035, 5.4, .06, gold, hinge);
  }
  const sealMat = new T.MeshStandardMaterial({ color: '#c6a574', emissive: '#c6a574', emissiveIntensity: .55, metalness: .7, roughness: .3 });
  const seal = mesh(new T.TorusGeometry(.65, .045, 8, 64), sealMat, 0, 2.9, -10.95);
  seal.userData.dynamic = true;
  for (let i = 0; i < 3; i++) mesh(new T.OctahedronGeometry(.12), sealMat, Math.sin(i * Math.PI * 2 / 3) * .65, 2.9 + Math.cos(i * Math.PI * 2 / 3) * .65, -10.92);
  const voidLight = new T.PointLight('#88c5c3', 0, 15); voidLight.position.set(0, 3, -13); scene.add(voidLight);
  // Central dais, radial stonework and ornamental brazier.
  cylinder(0, .08, 0, 3.6, 3.8, .28, darkStone, 64);
  cylinder(0, .25, 0, 3.35, 3.55, .2, stone, 64);
  ring(0, .365, 0, 3.05, .025); ring(0, .37, 0, 2.8, .015);
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; const m = box(Math.sin(a) * 3.15, .38, Math.cos(a) * 3.15, .025, .015, .25, gold); m.rotation.y = a; }
  cylinder(0, .52, 0, 1.2, 1.45, .4, darkStone, 12);
  cylinder(0, .85, 0, .62, .85, .35, trim, 12);
  cylinder(0, 1.07, 0, 1.05, .6, .24, iron, 16); ring(0, 1.2, 0, 1.03, .07);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const log = cylinder(Math.sin(a) * .25, 1.24, Math.cos(a) * .25, .09, .12, 1.2, darkStone, 6); log.rotation.z = .9; log.rotation.y = a; }
  const fireLight = new T.PointLight('#ffad50', 110, 23, 2); fireLight.position.set(0, 2.1, 0); fireLight.castShadow = true; fireLight.shadow.mapSize.set(512, 512); fireLight.shadow.bias = -.002; scene.add(fireLight);
  function flame(x, y, z, scale = 1) {
    const group = new T.Group(); group.userData.dynamic = true; group.position.set(x, y, z); group.scale.setScalar(scale); scene.add(group);
    for (let i = 0; i < 7; i++) {
      const mat = new T.MeshBasicMaterial({ color: i < 3 ? '#ed701e' : '#ffc867', transparent: true, opacity: .48, blending: T.AdditiveBlending, depthWrite: false, map: flameMap });
      const m = mesh(new T.PlaneGeometry(.72, .72), mat, (random() - .5) * .4, .5 + random() * .4, (random() - .5) * .4, group);
      m.castShadow = false;
      m.scale.set(.65, 2.2 + random() * 2, .65); m.userData.phase = random() * 10; flames.push(m);
    }
    return group;
  }
  flame(0, 1.25, 0);
  function candle(x, y, z) {
    cylinder(x, y + .18, z, .055, .065, .36, wax, 8);
    candlePositions.push(x, y + .43, z);
  }
  for (let i = 0; i < 32; i++) { const side = i % 2 ? -1 : 1; candle(side * (6.9 + random()), .05, -10 + random() * 19); }
  const pedestalPositions = [[-4.3, 0, 2.8], [0, 0, -5], [4.3, 0, 2.8]];
  const pedestalMats = [], pedestalRings = [], gems = [];
  const reflectionTarget = createReflectionEnvironment(renderer), gemGeometry = createGemGeometry();
  pedestalPositions.forEach(([x, y, z], i) => {
    const group = new T.Group(); group.position.set(x, y, z); scene.add(group);
    box(0, .15, 0, 1.65, .3, 1.65, darkStone, group);
    cylinder(0, .4, 0, .75, .9, .25, trim, 8, group);
    cylinder(0, 1, 0, .45, .6, 1.05, column, 24, group);
    for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; const m = box(Math.sin(a) * .47, 1.02, Math.cos(a) * .47, .06, .72, .06, darkStone, group); m.rotation.y = a; }
    cylinder(0, 1.62, 0, .84, .55, .25, trim, 8, group);
    cylinder(0, 1.79, 0, .75, .83, .1, darkStone, 8, group);
    const inlay = new T.MeshStandardMaterial({ color: '#c6a574', metalness: .65, roughness: .35, emissive: '#c6a574', emissiveIntensity: .12 });
    pedestalRings.push(inlay); ring(0, 1.85, 0, .45, .025, inlay, group);
    const mat = createGemMaterial(reflectionTarget.texture, ['#ede5cf', '#b1d4ca', '#d2b8c1'][i]);
    pedestalMats.push(mat);
    const gem = mesh(gemGeometry, mat, 0, 2.5, 0, group); gem.userData.dynamic = true; gem.castShadow = false; gem.visible = false; gems.push(gem);
    for (let j = 0; j <= i; j++) box((j - i / 2) * .16, 1.17, .54, .04, .26, .04, gold, group);
    candle(x - .8, .05, z + .8); candle(x + .8, .05, z + .8);
  });
  // Side stair: an open, continuous run into a physically lower crypt.
  for (let i = 0; i < 17; i++) {
    const z = 5 - i * .62, y = -i * .25;
    box(10.2, y - .16, z, 3.2, .32, .66, stone);
    for (const x of [8.6, 11.8]) box(x, y + .35, z, .28, .85, .64, darkStone);
    if (i % 4 === 0) candle(11.65, y + .85, z);
  }
  box(12.7, -4.5, -8.8, 10, .6, 9, darkStone);
  const cryptFloor = floor.clone(); cryptFloor.map = floor.map.clone(); cryptFloor.bumpMap = floor.bumpMap.clone(); cryptFloor.map.repeat.set(2.5, 2.5); cryptFloor.bumpMap.repeat.set(2.5, 2.5);
  box(13, -4.15, -9, 10, .15, 9, cryptFloor);
  box(13, -2.2, -13, 10, 4.2, .7, darkStone); box(17.3, -2.2, -9, .7, 4.2, 8, darkStone);
  box(13, .5, -9.2, 10, .5, 9.4, darkStone);
  box(8, -2.1, -9, .55, 4.3, 8, stone);
  for (const x of [9, 13, 17]) { pointedArch(x, -4.1, -12.4, 3.5, 4.3, .3, trim); cylinder(x - 1.7, -2.3, -12, .2, .28, 3.6, column); }
  for (const x of [12.3, 14.5]) box(x, -3.55, -10, .18, 1, 1.5, wood);
  box(13.4, -3.03, -10, 3, .18, 1.8, wood);
  for (let i = 0; i < 9; i++) candle(12.1 + random() * 2.7, -2.92, -10.7 + random());
  const cryptLight = new T.PointLight('#eebc7c', 48, 12, 2); cryptLight.position.set(12, -1.3, -8.5); scene.add(cryptLight);
  // The full human, clothing and idle rig are three-dimensional.
  const npc = new T.Group(); npc.userData.dynamic = true; npc.position.set(13.4, -4.05, -7.8); npc.rotation.y = -.58; scene.add(npc);
  let character;
  const ready = loadStonekeeper(npc).then(value => { character = value; return value; });
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const sc = shadowCanvas.getContext('2d'), sg = sc.createRadialGradient(64, 64, 5, 64, 64, 64);
  sg.addColorStop(0, '#030606c0'); sg.addColorStop(.45, '#03060666'); sg.addColorStop(1, '#03060600'); sc.fillStyle = sg; sc.fillRect(0, 0, 128, 128);
  const contact = mesh(new T.PlaneGeometry(1.7, 1.1), new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }), 13.4, -4.066, -7.75); contact.rotation.x = -Math.PI / 2; contact.castShadow = false;
  // Scholars' workbench: stacked bindings, parchment and brass measuring instruments.
  const parchment = new T.MeshStandardMaterial({ color: '#b9a886', roughness: .95 });
  for (let i = 0; i < 8; i++) {
    const b = box(12.4 + (i % 3) * .34, -2.85 + Math.floor(i / 3) * .12, -9.8, .5, .1, .7, i % 2 ? wood : darkStone); b.rotation.y = i * .28;
  }
  const folio = box(13.7, -2.92, -9.5, .8, .025, .6, parchment); folio.rotation.y = -.2;
  for (let i = 0; i < 10; i++) box(13.7, -2.9, -9.72 + i * .045, .52 - (i % 3) * .05, .003, .004, darkStone);
  ring(14.25, -2.89, -10.2, .17, .012, gold);
  for (const x of [15.3, 16.4]) {
    box(x, -2.7, -12.2, .8, 2.6, .65, wood);
    for (let i = 0; i < 13; i++) { const book = box(x - .3 + (i % 5) * .14, -3.65 + Math.floor(i / 5) * .78, -11.8, .11, .55 + random() * .15, .27, i % 3 ? wood : darkStone); book.rotation.z = (random() - .5) * .12; }
    for (const y of [-4, -3.2, -2.4, -1.5]) box(x, y, -12, .88, .07, .85, wood);
  }
  // Rubble has irregular polyhedral silhouettes rather than placeholder blocks.
  for (let i = 0; i < 85; i++) {
    const side = i % 2 ? -1 : 1, s = .1 + random() * .43;
    const rock = mesh(new T.DodecahedronGeometry(s, 0), i % 3 ? stone : darkStone, side * (5.8 + random() * 2.5), s * .4, random() * 22 - 11);
    rock.rotation.set(random() * 3, random() * 3, random() * 3); rock.scale.set(1.4, .65, 1);
  }
  // Soft additive shafts: stylized light scattering, not expensive volumetric rendering.
  const beamMat = new T.MeshBasicMaterial({ color: '#9ac3c9', map: flameMap, transparent: true, opacity: .035, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const beam = mesh(new T.PlaneGeometry(3, 14), beamMat, -4 + i * 2.5, 7, -4 - i * 1.6); beam.rotation.z = -.4; beam.castShadow = false;
  }
  const candleGeo = new T.BufferGeometry(); candleGeo.setAttribute('position', new T.Float32BufferAttribute(candlePositions, 3));
  const candleFire = new T.Points(candleGeo, new T.PointsMaterial({ color: '#ffc46c', map: flameMap, size: .19, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); candleFire.name = 'All candle flames · one draw call'; scene.add(candleFire);
  const dustPositions = new Float32Array(270 * 3), dustOrigins = [];
  for (let i = 0; i < 270; i++) { const p = [random() * 22 - 9, random() * 10, random() * 22 - 12]; dustPositions.set(p, i * 3); dustOrigins.push(p); }
  const dustGeo = new T.BufferGeometry(); dustGeo.setAttribute('position', new T.BufferAttribute(dustPositions, 3));
  const dust = new T.Points(dustGeo, new T.PointsMaterial({ color: '#e1c695', size: .035, transparent: true, opacity: .55, depthWrite: false, blending: T.AdditiveBlending })); scene.add(dust);
  const emberGeo = new T.BufferGeometry(), emberData = new Float32Array(70 * 3); emberGeo.setAttribute('position', new T.BufferAttribute(emberData, 3));
  scene.add(new T.Points(emberGeo, new T.PointsMaterial({ color: '#ffbf6b', size: .045, transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false })));
  const anchors = {
    flame: { label: 'The living flame', point: [0, 2.2, 0], camera: [2.4, 2.5, 5.4], target: [.9, 1.65, 0] },
    form: { label: 'Pedestal of Form', point: [-4.3, 2.15, 2.8], camera: [-3.1, 2.5, 6.6], target: [-3.5, 1.65, 2.8] },
    division: { label: 'Pedestal of Division', point: [0, 2.15, -5], camera: [1.6, 2.5, -.8], target: [.8, 1.65, -5] },
    memory: { label: 'Pedestal of Memory', point: [4.3, 2.15, 2.8], camera: [5.5, 2.5, 6.6], target: [5.1, 1.65, 2.8] },
    stairs: { label: 'Descend to the scholars', point: [7.3, 1.7, 1.9], camera: [10.5, -2.2, -4.5], target: [13.4, -2.8, -8.8] },
    npc: { label: 'The Stonekeeper', point: [13.4, -2, -7.8], camera: [11.7, -2.3, -5.1], target: [13.6, -2.6, -7.8] },
    door: { label: 'The seal of three truths', point: [0, 3, -10.8], camera: [1.8, 2.5, -5.6], target: [.6, 2.9, -11] }
  };
  for (const [id, a] of Object.entries(anchors)) {
    const hit = mesh(new T.SphereGeometry(id === 'stairs' ? 1.2 : .8, 8, 6), new T.MeshBasicMaterial({ visible: false }), ...a.point);
    hit.userData.id = id; interactables.push(hit);
  }
  function resize() { renderer.setSize(innerWidth, innerHeight); composer?.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  resize(); addEventListener('resize', resize);
  let placed = [false,false,false], placement = [1,1,1], opening = 0, hovered = '', response = 0, region = 'shrine', gateOpen = false;
  const responseRing = ring(0, .4, 0, .7, .014, new T.MeshBasicMaterial({ color: '#d6b47e', transparent: true, opacity: 0, depthWrite: false }));
  responseRing.userData.dynamic = true;
  const batching = batchArchitecture(scene); geometryCache.clear();
  // Progress reveals existing architectural history without new lights or a new room.
  const inscriptions=new T.Group();inscriptions.name='Revealed oath markings';scene.add(inscriptions);inscriptions.visible=false;
  const inscriptionMaterial=new T.MeshStandardMaterial({color:'#91b8b6',emissive:'#738f89',emissiveIntensity:.7,metalness:.45,roughness:.55});
  const script=new T.InstancedMesh(new T.BoxGeometry(.025,.12,.018),inscriptionMaterial,72),glyph=new T.Object3D();
  for(let i=0;i<72;i++){const side=i<36?-1:1,j=i%36;glyph.position.set(side*6.35,1.8+Math.floor(j/12)*.3,-7.8+(j%12)*.17);glyph.rotation.z=(j%3-1)*.45;glyph.updateMatrix();script.setMatrixAt(i,glyph.matrix);}inscriptions.add(script);
  const altarAwake=new T.Group();altarAwake.name='Awakened central altar';scene.add(altarAwake);altarAwake.visible=false;
  for(let i=0;i<3;i++){const halo=new T.Mesh(new T.TorusGeometry(1.3+i*.3,.018,5,48),inscriptionMaterial);halo.rotation.x=-Math.PI/2;halo.position.y=.39;altarAwake.add(halo);}
  let quality = 'quality', shadowClock = 0, recovery = -1, recoveryElapsed = 0;
  function setQuality(mode) {
    quality = mode === 'performance' ? 'performance' : 'quality';
    for (const light of [moon, moonShaft, fireLight]) {
      light.castShadow = quality === 'quality' || light === moon;
      const size = quality === 'performance' ? 512 : light === moon ? 1024 : 512;
      if (light.shadow.mapSize.x !== size) { light.shadow.mapSize.set(size, size); light.shadow.map?.dispose(); light.shadow.map = null; }
    }
    for (const mat of pedestalMats) { mat.transmission = quality === 'performance' ? 0 : .92; mat.needsUpdate = true; }
    dustGeo.setDrawRange(0, quality === 'performance' ? 90 : 270);
    const scale = quality === 'performance' ? .72 : 1;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1) * scale);
    if (quality === 'quality' && !composer) composer = createComposer();
    if (quality === 'performance' && composer) { composer.passes.forEach(pass => pass.dispose?.()); composer.dispose(); composer = null; }
    composer?.setPixelRatio(renderer.getPixelRatio());
    renderer.shadowMap.needsUpdate = true; resize();
  }
  function update(time, reduced, dt) {
    const t = reduced ? 1 : time;

    response = Math.max(0, response - dt * .65);
    responseRing.material.opacity = response * .55; responseRing.scale.setScalar(1 + (1 - response) * .8);
    sealMat.emissiveIntensity = hovered === 'door' ? 1.3 : .55;
    if(region === 'crypt' && npc.visible) character?.update(dt, reduced);
    flames.forEach((f, i) => { f.quaternion.copy(camera.quaternion); f.scale.y = 1.4 + Math.sin(t * 4 + f.userData.phase) * .3; f.rotation.z += Math.sin(t * 2 + i) * .1; });
    fireLight.intensity = 110 + placed.filter(Boolean).length*9 + Math.sin(t * 7) * 9 + (hovered === 'flame' ? 22 : 0);
    for (let i = 0; i < 270; i++) { dustPositions[i * 3] = dustOrigins[i][0] + Math.sin(t * .12 + i) * .3; dustPositions[i * 3 + 1] = dustOrigins[i][1] + Math.sin(t * .2 + i) * .15; }
    dustGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < 70; i++) { const age = (t * .24 + i / 70) % 1; emberData[i * 3] = Math.sin(i * 17 + age * 3) * age * .8; emberData[i * 3 + 1] = 1.4 + age * 3.7; emberData[i * 3 + 2] = Math.cos(i * 13) * age * .8; }
    emberGeo.attributes.position.needsUpdate = true;
    gems.forEach((g, i) => {
      g.rotation.y = t * .35; g.position.y = 2.5 + Math.sin(t * 1.3) * .07;
      const active = hovered === ['form', 'division', 'memory'][i];
      pedestalMats[i].emissiveIntensity = 0;
      pedestalRings[i].emissiveIntensity = T.MathUtils.damp(pedestalRings[i].emissiveIntensity, active ? 2.4 : placed[i] ? 1 : .12, 6, dt);
    });
    if (recovery >= 0) {
      recoveryElapsed = Math.min(1, recoveryElapsed + (reduced ? 1 : dt / 1.35));
      const ease = T.MathUtils.smoothstep(recoveryElapsed, 0, 1), gem = gems[recovery];
      gem.position.y = 2.15 + ease * .65; gem.scale.setScalar(.2 + ease * .8); gem.rotation.y = ease * Math.PI * 1.5 + t * .2;
    }
    gems.forEach((gem,i)=>{if(placed[i]){placement[i]=Math.min(1,placement[i]+(reduced?1:dt*.8));const reveal=T.MathUtils.smoothstep(placement[i],0,1);gem.scale.setScalar(.8+reveal*.2);gem.position.y=2.8-reveal*.3+Math.sin(t*1.3)*.035*reveal;}});
    if (opening && opening < 1) { opening = Math.min(1, opening + (reduced ? 1 : dt * .5)); const angle = T.MathUtils.smoothstep(opening, 0, 1) * 1.1; leftHinge.rotation.y = -angle; rightHinge.rotation.y = angle; seal.scale.setScalar(Math.max(.01, 1 - opening)); voidLight.intensity = opening * 65;
      shadowClock += dt; if (shadowClock > .15 || opening === 1) { renderer.shadowMap.needsUpdate = true; shadowClock = 0; }
    }
  }
  setQuality(new URLSearchParams(location.search).get('quality') || 'performance');
  const prepared = ready.then(async () => {
    const textures = new Set();
    scene.traverse(o => { for (const mat of o.material ? Array.isArray(o.material) ? o.material : [o.material] : []) for (const value of Object.values(mat)) if (value?.isTexture && value.image) textures.add(value); });
    for (const texture of textures) renderer.initTexture(texture);
    gems.forEach(gem => { gem.visible = true; }); await renderer.compileAsync(scene, camera); gems.forEach(gem => { gem.visible = false; });
    renderer.shadowMap.needsUpdate = true;
  });
  function setGate(open,animate=false){if(open===gateOpen)return;gateOpen=open;opening=open?(animate?.001:1):0;if(!animate||!open){leftHinge.rotation.y=open?-1.1:0;rightHinge.rotation.y=open?1.1:0;seal.scale.setScalar(open?.01:1);voidLight.intensity=open?65:0;}renderer.shadowMap.needsUpdate=true;}
  return { scene, camera, renderer, anchors, interactables, update, ready: prepared, batching, setQuality, getQuality: () => quality, npc, gems, flameMap, materials:{stone,darkStone,trim,column,floor,gold,iron,wood},
    setRegion(value){region=value;npc.visible=region==='crypt'&&placed[0];},
    setProgress(progress,animateId){['form','division','memory'].forEach((id,i)=>{const next=progress.bosses[id].placed;if(next!==placed[i])placement[i]=id===animateId?0:1;placed[i]=next;gems[i].visible=next;});const count=placed.filter(Boolean).length;inscriptions.visible=count>=2;altarAwake.visible=count===3;npc.visible=region==='crypt'&&placed[0];setGate(count===3,!!animateId);},
    render: () => { if (quality === 'performance') renderer.render(scene, camera); else composer.render(); }, recoverGem: () => { recovery = 0; recoveryElapsed = 0; gems[0].visible = true; }, respond: id => {
    response = 1;
    responseRing.position.set(anchors[id].point[0], id === 'flame' ? .4 : 1.87, anchors[id].point[2]);
    responseRing.visible = ['flame', 'form', 'division', 'memory'].includes(id);
  }, setHover: id => { hovered = id; }, placeGem: (i=0) => { recovery = -1; placed[i] = true; placement[i]=0; gems[i].visible = true; }, openDoor: () => { setGate(true,true); }, overview: { camera: [1, 3.25, 13.5], target: [0, 2.5, -3.5] } };
}




