import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function clothMap(embroidered = false) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 512;
  const c = canvas.getContext('2d'); c.fillStyle = embroidered ? '#807154' : '#64736f'; c.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 2) { c.strokeStyle = y % 4 ? '#ffffff0d' : '#00000018'; c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
  for (let x = 0; x < 256; x += 3) { c.strokeStyle = '#ffffff0a'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); }
  if (embroidered) {
    c.strokeStyle = '#dac08a'; c.lineWidth = 3; c.strokeRect(18, 0, 220, 512);
    for (let y = 0; y < 600; y += 96) { c.beginPath(); c.moveTo(128, y); c.lineTo(202, y + 45); c.lineTo(128, y + 90); c.lineTo(54, y + 45); c.closePath(); c.stroke(); c.beginPath(); c.arc(128, y + 45, 23, 0, Math.PI * 2); c.stroke(); }
  }
  const t = new T.CanvasTexture(canvas); t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; return t;
}

function tailoredSurface(rows, columns, positionAt) {
  const positions = [], uvs = [], indices = [];
  for (let r = 0; r <= rows; r++) for (let c = 0; c <= columns; c++) {
    positions.push(...positionAt(r / rows, c / columns)); uvs.push(c / columns, r / rows);
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) { const a = r * (columns + 1) + c, b = a + columns + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals(); return g;
}

export async function loadStonekeeper(parent) {
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/stonekeeper-base.glb`);
  const model = gltf.scene; model.animations = gltf.animations; model.name = 'Stonekeeper · licensed rigged 3D human with original scholar garments';
  parent.add(model); parent.scale.setScalar(1.12);
  let base;
  model.traverse(o => { if (o.isSkinnedMesh) base = o; });
  if (!base) throw new Error('Stonekeeper asset is missing its skinned human mesh.');
  // Preserve the source face/hands and surface maps; retint only the clothed regions.
  const vertices = base.geometry.attributes.position, colors = [];
  for (let i = 0; i < vertices.count; i++) {
    const y = vertices.getY(i), x = Math.abs(vertices.getX(i));
    const clothed = y < 1.47 && y > .14 && !(x > .285 && y < .96);
    const color = new T.Color(clothed ? '#526762' : '#ffffff'); colors.push(color.r, color.g, color.b);
  }
  base.geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3)); base.material.vertexColors = true; base.material.roughness = .92; base.castShadow = false; base.receiveShadow = true;
  const fabric = clothMap(), embroidery = clothMap(true);
  const robeMat = new T.MeshStandardMaterial({ color: '#4b5f5b', map: fabric, roughness: .96, side: T.DoubleSide });
  const mantleMat = new T.MeshStandardMaterial({ color: '#424b4b', map: fabric, roughness: .98, side: T.DoubleSide });
  const stoleMat = new T.MeshStandardMaterial({ color: '#c6a574', map: embroidery, roughness: .8, side: T.DoubleSide });
  const joints = base.skeleton.bones, hips = joints.findIndex(b => b.name === 'hips'), chest = joints.findIndex(b => b.name === 'chest');
  function garment(geometry, material, name) {
    const indices = [], weights = [];
    for (let i = 0; i < geometry.attributes.position.count; i++) {
      const y = geometry.attributes.position.getY(i), upper = T.MathUtils.smoothstep(y, .85, 1.4);
      indices.push(hips, chest, 0, 0); weights.push(1 - upper, upper, 0, 0);
    }
    geometry.setAttribute('skinIndex', new T.Uint16BufferAttribute(indices, 4)); geometry.setAttribute('skinWeight', new T.Float32BufferAttribute(weights, 4));
    const mesh = new T.SkinnedMesh(geometry, material); mesh.name = name; model.add(mesh); mesh.bind(base.skeleton, base.bindMatrix); mesh.frustumCulled = false; mesh.receiveShadow = true; return mesh;
  }
  garment(tailoredSurface(28, 64, (v, u) => {
    const a = u * Math.PI * 2, y = 1.43 - v * 1.30;
    const rx = .265 + v * .125, rz = .21 + v * .055;
    const folds = Math.sin(a * 14 + v * .4) * (.006 + v * .014) + Math.sin(a * 7 + v * 2) * .007;
    return [Math.sin(a) * (rx + folds), y + Math.sin(a * 7) * .014 * v, Math.cos(a) * (rz + folds)];
  }), robeMat, 'Tailored folded ankle-length scholar tunic');
  garment(tailoredSurface(16, 48, (v, u) => {
    const a = .5 + u * (Math.PI * 2 - 1), rx = .28 + v * .10, rz = .20 + v * .055;
    const pleat = Math.sin(a * 12) * .009;
    return [Math.sin(a) * (rx + pleat), 1.43 - v * .37 - Math.sin(u * Math.PI) * .025, Math.cos(a) * (rz + pleat) - .02];
  }), mantleMat, 'Open-front layered wool shoulder mantle');
  for (const side of [-1, 1]) garment(tailoredSurface(28, 4, (v, u) => {
    const y = 1.42 - v * 1.1, spread = .13 + v * .035;
    const radiusX = .265 + v * .106, radiusZ = .21 + v * .047;
    return [side * spread + (u - .5) * .065, y, radiusZ * Math.sqrt(1 - (spread / radiusX) ** 2) + .015 + Math.sin(v * Math.PI * 3) * .006];
  }), stoleMat, 'Gold embroidered scholar stole');
  garment(tailoredSurface(8, 48, (v, u) => {
    const a = u * Math.PI * 2, radius = .10 + v * .045;
    return [Math.sin(a) * radius, 1.505 - v * .095 + Math.sin(a * 4) * .005, Math.cos(a) * (radius + .018)];
  }), robeMat, 'Layered high linen collar');
  const staffPath = new T.CatmullRomCurve3([new T.Vector3(-.36, .02, .09), new T.Vector3(-.365, .65, .085), new T.Vector3(-.37, 1.25, .10), new T.Vector3(-.35, 1.70, .10)]);
  const staff = new T.Mesh(new T.TubeGeometry(staffPath, 32, .016, 8, false), new T.MeshStandardMaterial({ color: '#4a3527', roughness: .82 })); staff.name = 'Carved scholar staff'; model.add(staff);
  for (const y of [.14, 1.46, 1.65]) { const collar = new T.Mesh(new T.TorusGeometry(.022, .005, 6, 16), new T.MeshStandardMaterial({ color: '#c6a574', metalness: .75, roughness: .4 })); collar.rotation.x = Math.PI / 2; collar.position.set(-.36, y, .1); model.add(collar); }
  const staffSeal = new T.Mesh(new T.TorusGeometry(.055, .009, 8, 24), new T.MeshStandardMaterial({ color: '#c6a574', metalness: .6, roughness: .4 })); staffSeal.position.set(-.35, 1.74, .10); model.add(staffSeal);
  const ember = new T.Mesh(new T.SphereGeometry(.023, 12, 8), new T.MeshStandardMaterial({ color: '#d4e2cc', emissive: '#9bb7a6', emissiveIntensity: .7, roughness: .4 })); ember.position.copy(staffSeal.position); model.add(ember);
  model.userData.dynamic = true;
  const mixer = new T.AnimationMixer(model), idle = gltf.animations.find(a => /idle/i.test(a.name));
  if (idle) mixer.clipAction(idle).setEffectiveTimeScale(.55).play();
  let lastReduced = false;
  return { model, base, update(dt, reduced) {
    if (reduced) { if (!lastReduced) { mixer.setTime(0); } }
    else mixer.update(dt);
    lastReduced = reduced;
  } };
}
