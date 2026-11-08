import * as T from 'three';

// A brilliant-inspired cut: table, crown, thin girdle, pavilion and culet.
// Independent triangles keep true facet normals instead of smoothing away the cut.
export function createGemGeometry() {
  const count = 16, rings = [[.20, .29], [.32, .17], [.44, .035], [.445, .005], [.24, -.29], [.018, -.53]];
  const positions = [];
  const point = (ring, i) => { const [r, y] = rings[ring], a = (i + (ring === 1 || ring === 4 ? .5 : 0)) * Math.PI * 2 / count; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const triangle = (a, b, c) => positions.push(...a, ...b, ...c);
  for (let i = 0; i < count; i++) {
    const j = (i + 1) % count;
    triangle([0, rings[0][1], 0], point(0, j), point(0, i));
    for (let ring = 0; ring < rings.length - 1; ring++) {
      triangle(point(ring, i), point(ring, j), point(ring + 1, i));
      triangle(point(ring, j), point(ring + 1, j), point(ring + 1, i));
    }
    triangle(point(5, i), point(5, j), [0, -.54, 0]);
  }
  const geometry = new T.BufferGeometry(); geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3)); geometry.computeVertexNormals();
  geometry.name = 'Brilliant cut: crown, girdle, pavilion and culet';
  return geometry;
}

export function createGemMaterial(environment, tint = '#ede5cf') {
  return new T.MeshPhysicalMaterial({ color: tint, roughness: .008, metalness: 0, envMap: environment, envMapIntensity: 2.6, clearcoat: 1, clearcoatRoughness: .008, reflectivity: 1, ior: 2.417, transmission: .92, thickness: .7, attenuationColor: new T.Color(tint), attenuationDistance: 3, emissive: '#000000', flatShading: true });
}

export function createReflectionEnvironment(renderer) {
  // A small static studio-like cubemap: no per-frame cube-camera captures or ray tracing.
  const envScene = new T.Scene(); envScene.background = new T.Color('#0d1720');
  const cards = [ [2, 3, 2, '#fff0c5'], [-3, 1, -2, '#87b8d5'], [0, 4, -3, '#fff8ed'], [3, -.3, -2, '#ad7741'] ];
  for (const [x, y, z, color] of cards) {
    const card = new T.Mesh(new T.PlaneGeometry(1.4, 3), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(4), side: T.DoubleSide }));
    card.position.set(x, y, z); card.lookAt(0, 0, 0); envScene.add(card);
  }
  const pmrem = new T.PMREMGenerator(renderer), result = pmrem.fromScene(envScene, .05, .1, 20, { size: 128 });
  pmrem.dispose(); envScene.traverse(o => { o.geometry?.dispose(); o.material?.dispose(); });
  return result;
}
