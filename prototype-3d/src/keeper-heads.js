import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function loadKeeperHeads(){
  const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/keeper-heads.glb`);
  return Object.fromEntries(['divider','seer','old'].map(role=>[role,gltf.scene.getObjectByName(role)]));
}

// Retain the established body and animations, replacing the complete head,
// eyes and groom with a separately modeled CC0 anatomical character.
export function installKeeperHead(base,asset,look={}){
  const original=base.geometry,positions=original.attributes.position,index=original.index?.array;
  const kept=[];
  for(let i=0;i<(index?.length||positions.count);i+=3){
    const a=index?index[i]:i,b=index?index[i+1]:i+1,c=index?index[i+2]:i+2;
    if([a,b,c].every(v=>positions.getY(v)>1.475))continue;kept.push(a,b,c);
  }
  const body=new T.BufferGeometry();
  for(const [name,attribute] of Object.entries(original.attributes))body.setAttribute(name,attribute);
  body.setIndex(kept);body.computeBoundingSphere();base.geometry=body;
  const headIndex=base.skeleton.bones.findIndex(b=>b.name==='head');
  const attach=(geometry,material,name)=>{
    const joints=[],weights=[];
    for(let i=0;i<geometry.attributes.position.count;i++){joints.push(headIndex,0,0,0);weights.push(1,0,0,0);}
    geometry.setAttribute('skinIndex',new T.Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
    const mesh=new T.SkinnedMesh(geometry,material);mesh.name=name;mesh.frustumCulled=false;mesh.receiveShadow=true;base.parent.add(mesh);mesh.bind(base.skeleton,base.bindMatrix);return mesh;
  };
  // Per-keeper identity: skin tone, hair color and face proportions.
  const [sx,sy,sz]=look.faceScale||[1,1,1],pivot=new T.Vector3(0,1.64,0);
  asset.traverse(o=>{
    if(!o.isMesh)return;let material=o.material;
    if(look.skin&&/face/i.test(o.name)){material=material.clone();material.color.set(look.skin);}
    if(look.hair&&/hair/i.test(o.name)){material=material.clone();material.color.set(look.hair);}
    const g=o.geometry.clone();g.translate(-pivot.x,-pivot.y,-pivot.z);g.scale(sx,sy,sz);g.translate(pivot.x,pivot.y,pivot.z);
    attach(g,material,o.name);
  });
  for(const [geometry,material,name] of look.accessories?.()||[])attach(geometry,material,name);
  if(asset.name==='old'&&!look.skipBeard){
    const p=[],uv=[],indices=[],rows=20,columns=32;
    for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){
      const v=r/rows,u=c/columns,width=.15*(1-v*.8),strand=Math.sin(u*Math.PI*40)*.003;
      p.push((u-.5)*width,1.615-v*.265-Math.sin(u*Math.PI)*.012,.105+Math.sin(u*Math.PI)*.025+v*.03+strand);uv.push(u,v);
    }
    for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const a=r*(columns+1)+c,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
    const beard=new T.BufferGeometry();beard.setAttribute('position',new T.Float32BufferAttribute(p,3));beard.setAttribute('uv',new T.Float32BufferAttribute(uv,2));beard.setIndex(indices);beard.computeVertexNormals();
    attach(beard,new T.MeshStandardMaterial({color:'#bcb9ad',roughness:.95,side:T.DoubleSide}),'Old Scholar / long silver beard');
  }
  return attach;
}

// A layered strand sheet used for beards and moustaches.
export function beardGeometry({top=1.615,length=.265,width=.15,taper=.8,z=.105,curve=.025,lean=.03,strands=40}={}){
  const p=[],uv=[],indices=[],rows=20,columns=32;
  for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){
    const v=r/rows,u=c/columns,w=width*(1-v*taper),strand=Math.sin(u*Math.PI*strands)*.003;
    p.push((u-.5)*w,top-v*length-Math.sin(u*Math.PI)*.012,z+Math.sin(u*Math.PI)*curve+v*lean+strand);uv.push(u,v);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const a=r*(columns+1)+c,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
