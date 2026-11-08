import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, simplify, weld, textureCompress, resample } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('public/models', { recursive: true });
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const document = await io.read('art-source/models/old-man-original.glb');
for (const animation of document.getRoot().listAnimations()) if (animation.getName() !== 'Idle') animation.dispose();
await document.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: .3, error: .001 }), resample(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }));
await io.write('public/models/stonekeeper-base.glb', document);
const triangles = document.getRoot().listMeshes().reduce((sum, mesh) => sum + mesh.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0), 0);
console.log(`Character base: ${triangles} triangles, idle retained.`);
// These are format/size conversions, not edits to the character artwork.
await sharp('art-source/retired-illustrations/weathered-limestone.png').resize({ width: 1024 }).webp({ quality: 88 }).toFile('public/art/weathered-limestone.webp');
await writeFile('public/models/LICENSE.txt', '“Old Man” by Bake3D (https://bake3d.ai), CC BY 4.0. Source: https://bake3d.ai/free-3d-models\nLicense: https://creativecommons.org/licenses/by/4.0/\nChanges: simplified mesh, resized/compressed textures, removed unused animations; additional original scholar clothing and palette adaptation in the runtime. No endorsement implied.\n');
