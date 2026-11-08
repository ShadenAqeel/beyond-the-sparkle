import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import * as T from 'three';
import {Document,NodeIO} from '@gltf-transform/core';

// Offline adaptation of CC0 MakeHuman graphical assets, not MakeHuman code.
const source=new URL('../art-source/makehuman/',import.meta.url),output=new URL('../public/models/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,source),'utf8');
function obj(text){
  const vertices=[],uv=[],faces=[];let group='';
  for(const line of text.split(/\r?\n/)){
    const p=line.trim().split(/\s+/);
    if(p[0]==='v')vertices.push(p.slice(1,4).map(Number));
    if(p[0]==='vt')uv.push(p.slice(1,3).map(Number));
    if(p[0]==='g')group=p[1];
    if(p[0]==='f')faces.push({group,points:p.slice(1).map(v=>v.split('/').map(n=>Number(n)-1))});
  }
  return{vertices,uv,faces};
}
const body=obj(read('base.obj')),eyes=obj(read('low-poly.obj'));
function morph(targets){
  const vertices=body.vertices.map(v=>[...v]);
  for(const [file,weight] of targets)for(const line of read(file+'.target').split(/\r?\n/)){
    if(!/^\d+\s/.test(line))continue;const [i,x,y,z]=line.trim().split(/\s+/).map(Number);
    vertices[i][0]+=x*weight;vertices[i][1]+=y*weight;vertices[i][2]+=z*weight;
  }
  return vertices;
}
function fitProxy(text,vertices,count){
  const lines=text.split(/\r?\n/),positions=[];let reading=false;
  const scale=[1,1,1];
  for(const line of lines){
    const p=line.trim().split(/\s+/);
    if(/^[xyz]_scale$/.test(p[0])){const axis='xyz'.indexOf(p[0][0]);scale[axis]=Math.abs(vertices[+p[1]][axis]-vertices[+p[2]][axis])/Number(p[3]);}
    if(p[0]==='verts'){reading=true;continue;}
    if(!reading||!/^\d/.test(p[0]))continue;
    const n=p.map(Number);
    if(n.length===1)positions.push([...vertices[n[0]]]);
    else if(n.length>=9)positions.push([0,1,2].map(axis=>vertices[n[0]][axis]*n[3]+vertices[n[1]][axis]*n[4]+vertices[n[2]][axis]*n[5]+n[6+axis]*scale[axis]));
    else if(positions.length)break;
    if(positions.length===count)break;
  }
  return positions;
}
const find=name=>fs.readdirSync(source).find(f=>f.endsWith(name));
const roles={
  divider:{height:.36,skin:'middleage_lightskinned_male_diffuse2.png',hair:'short04',hairColor:[.12,.085,.06,1],targets:[['caucasian-male-young',.8],['head-rectangular',.55],['chin-prominent-incr',.3],['eyebrows-angle-down',.25]]},
  seer:{height:.35,skin:'young_lightskinned_female_diffuse2.png',hair:'long01',hairColor:[.72,.76,.82,1],targets:[['asian-female-young',1],['head-oval',.4],['chin-width-decr',.25],['nose-width1-decr',.2]]},
  old:{height:.37,skin:'old_lightskinned_male_diffuse2.png',hair:'short04',hairColor:[.82,.81,.76,1],targets:[['caucasian-male-old',1],['head-age-incr',.5],['head-invertedtriangular',.35],['nose-width1-incr',.2]]}
};
const doc=new Document();Object.assign(doc.getRoot().getAsset(),{version:'2.0',generator:'Beyond the Sparkle / CC0 keeper adaptation',copyright:'MakeHuman core graphical assets CC0-1.0; original character combinations and adaptations for Beyond the Sparkle.'});
const buffer=doc.createBuffer(),scene=doc.createScene('Distinct keeper heads');
function texture(name,bytes,mime='image/png'){return doc.createTexture(name).setImage(bytes).setMimeType(mime);}
function mesh(name,data,vertices,transform,material,uvTransform=v=>[v[0],1-v[1]]){
  const positions=[],uvs=[],index=[],seen=new Map();
  for(const face of data.faces){
    const faceIndex=face.points.map(([vi,ti])=>{
      const key=vi+'/'+ti;if(seen.has(key))return seen.get(key);
      const id=positions.length/3;positions.push(...transform(vertices[vi]));uvs.push(...uvTransform(data.uv[ti]||[0,0]));seen.set(key,id);return id;
    });
    for(let i=1;i<faceIndex.length-1;i++)index.push(faceIndex[0],faceIndex[i],faceIndex[i+1]);
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(index);geometry.computeVertexNormals();
  const accessor=(type,array)=>doc.createAccessor().setType(type).setArray(array).setBuffer(buffer);
  const primitive=doc.createPrimitive().setAttribute('POSITION',accessor('VEC3',new Float32Array(positions))).setAttribute('NORMAL',accessor('VEC3',geometry.attributes.normal.array)).setAttribute('TEXCOORD_0',accessor('VEC2',new Float32Array(uvs))).setIndices(accessor('SCALAR',new Uint16Array(index))).setMaterial(material);
  return doc.createNode(name).setMesh(doc.createMesh(name).addPrimitive(primitive));
}
const eyeMap=texture('CC0 grey iris',await sharp(new URL(find('grey_eye.png'),source).pathname.replace(/^\/([A-Z]:)/,'$1')).resize(512).jpeg({quality:90}).toBuffer(),'image/jpeg');
const eyeMaterial=doc.createMaterial('Natural eyes').setBaseColorTexture(eyeMap).setRoughnessFactor(.23).setMetallicFactor(0);
for(const [role,config] of Object.entries(roles)){
  const vertices=morph(config.targets),head={...body,faces:body.faces.filter(f=>f.group==='body'&&f.points.every(([i])=>body.vertices[i][1]>5.6))};
  const ids=[...new Set(head.faces.flatMap(f=>f.points.map(p=>p[0])))];
  const minY=Math.min(...ids.map(i=>vertices[i][1])),maxY=Math.max(...ids.map(i=>vertices[i][1]));
  const neck=ids.filter(i=>vertices[i][1]<minY+.25),neckZ=neck.reduce((n,i)=>n+vertices[i][2],0)/neck.length,scale=config.height/(maxY-minY);
  const transform=p=>[p[0]*scale,1.46+(p[1]-minY)*scale,(p[2]-neckZ)*scale+.015];
  const uvIds=head.faces.flatMap(f=>f.points.map(p=>p[1])),minU=Math.min(...uvIds.map(i=>body.uv[i][0])),maxU=Math.max(...uvIds.map(i=>body.uv[i][0])),minV=Math.min(...uvIds.map(i=>body.uv[i][1])),maxV=Math.max(...uvIds.map(i=>body.uv[i][1]));
  const input=fs.readFileSync(new URL(find(config.skin),source)),meta=await sharp(input).metadata();
  const left=Math.max(0,Math.floor(minU*meta.width)-2),top=Math.max(0,Math.floor((1-maxV)*meta.height)-2),width=Math.min(meta.width-left,Math.ceil((maxU-minU)*meta.width)+4),height=Math.min(meta.height-top,Math.ceil((maxV-minV)*meta.height)+4);
  const skin=texture(role+' face',await sharp(input).extract({left,top,width,height}).resize({width:1024,height:1024,fit:'inside'}).jpeg({quality:91}).toBuffer(),'image/jpeg');
  const material=doc.createMaterial(role+' skin').setBaseColorTexture(skin).setRoughnessFactor(.78).setMetallicFactor(0);
  const root=doc.createNode(role);scene.addChild(root);
  root.addChild(mesh(role+' / anatomical face',head,vertices,transform,material,v=>[(v[0]*meta.width-left)/width,((1-v[1])*meta.height-top)/height]));
  const fittedEyes=fitProxy(read('low-poly.mhclo'),vertices,eyes.vertices.length);if(fittedEyes.length!==eyes.vertices.length)throw Error('Eye fit mismatch');root.addChild(mesh(role+' / eyes',eyes,fittedEyes,transform,eyeMaterial));
  const prefix='hair__'+config.hair+'__'+config.hair;
  const hair=obj(read(prefix+'.obj')),fittedHair=fitProxy(read(prefix+'.mhclo'),vertices,hair.vertices.length);
  if(fittedHair.length!==hair.vertices.length)throw Error('Hair fit mismatch');
  const {data,info}=await sharp(fs.readFileSync(new URL(prefix+'_diffuse.png',source))).resize(512,512,{fit:'inside'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Convert the source groom into a neutral color+alpha material; preserve its
  // licensed strand mask while allowing distinct brown and silver hair colors.
  for(let i=0;i<data.length;i+=4){const value=150+Math.round(data[i]*.4);data[i]=data[i+1]=data[i+2]=value;}
  const hairMap=texture(role+' groom',await sharp(data,{raw:info}).png().toBuffer());
  const hairMaterial=doc.createMaterial(role+' hair').setBaseColorTexture(hairMap).setBaseColorFactor(config.hairColor).setAlphaMode('MASK').setAlphaCutoff(.35).setDoubleSided(true).setRoughnessFactor(.85).setMetallicFactor(0);
  root.addChild(mesh(role+' / fitted hair',hair,fittedHair,transform,hairMaterial));
  console.log(role,head.faces.length,'head faces; height',config.height,'hair vertices',hair.vertices.length);
}
await new NodeIO().write(path.join(output.pathname.replace(/^\/([A-Z]:)/,'$1'),'keeper-heads.glb'),doc);
console.log('Wrote keeper-heads.glb');
