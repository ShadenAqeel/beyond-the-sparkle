import * as T from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export function batchArchitecture(scene) {
  scene.updateMatrixWorld(true);
  const buckets = new Map(), originals = [];
  scene.traverse(object => {
    if (!object.isMesh || object.isSkinnedMesh || Array.isArray(object.material) || object.material.transparent || !object.material.visible) return;
    for (let parent = object; parent; parent = parent.parent) if (parent.userData.dynamic) return;
    const p = object.getWorldPosition(new T.Vector3());
    // Small spatial batches retain useful frustum culling in the nave and crypt.
    const key = `${object.material.uuid}/${p.y < -1 ? 'crypt' : 'nave'}/${Math.floor(p.x / 10)}/${Math.floor(p.z / 12)}`;
    if (!buckets.has(key)) buckets.set(key, { material: object.material, geometries: [] });
    let geometry = object.geometry.clone(); if (geometry.index) { const indexed = geometry; geometry = geometry.toNonIndexed(); indexed.dispose(); }
    for (const key of Object.keys(geometry.attributes)) if (!['position', 'normal', 'uv'].includes(key)) geometry.deleteAttribute(key);
    if (!geometry.attributes.uv) geometry.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count * 2), 2));
    geometry.applyMatrix4(object.matrixWorld); buckets.get(key).geometries.push(geometry); originals.push(object);
  });
  for (const { material, geometries } of buckets.values()) {
    const joined = mergeGeometries(geometries), geometry = mergeVertices(joined); joined.dispose(); geometry.computeBoundingSphere();
    const batch = new T.Mesh(geometry, material); batch.castShadow = true; batch.receiveShadow = true; batch.name = 'Static architectural batch'; scene.add(batch);
    geometries.forEach(g => g.dispose());
  }
  for (const object of originals) { object.removeFromParent(); object.geometry.dispose(); }
  return { sourceMeshes: originals.length, batches: buckets.size };
}
