import * as T from 'three';
import {clone as cloneRig} from 'three/addons/utils/SkeletonUtils.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {installKeeperHead,beardGeometry} from './keeper-heads.js';

const armorRoles=['form','heavy','agile','exile'];
const palettes={form:'#4f5559',heavy:'#3b6473',agile:'#8f9fa7',memory:'#a7acbf',exile:'#15191f',divider:'#23324a',seer:'#c9bfe0',old:'#5b4630'};
const visorGlow={form:'#ffb347',heavy:'#5fd3ff',agile:'#bff1ff'};
// Each keeper reads as a different person: skin, hair, face shape and a
// signature silhouette (square scholar's cap, silk blindfold, deep cowl).
function keeperLook(role){
  const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.85,side:T.DoubleSide,...extra});
  const at=(geometry,x,y,z,{rx=0,ry=0,rz=0,s=[1,1,1]}={})=>{const o=new T.Object3D();o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.scale.set(...s);o.updateMatrix();return geometry.applyMatrix4(o.matrix);};
  if(role==='divider')return{skin:'#7f6a64',hair:'#17110d',faceScale:[.93,1.06,.98],accessories:()=>[
    [beardGeometry({top:1.6,length:.085,width:.12,taper:.35,z:.112,curve:.03,lean:.01}),mat('#1a120d',{roughness:1}),'Divider / trimmed black beard'],
    [at(new T.CylinderGeometry(.118,.112,.085,24),0,1.815,-.005,{rx:-.12}),mat('#0e1118'),'Divider / scholar cap crown'],
    [at(new T.BoxGeometry(.36,.018,.36),0,1.865,-.012,{rx:-.12,ry:Math.PI/4}),mat('#0e1118'),'Divider / square mortarboard'],
    [at(new T.CylinderGeometry(.006,.006,.16,6),.15,1.79,.07,{rz:.15}),mat('#c6a574',{metalness:.6,roughness:.4}),'Divider / gold tassel'],
    [at(new T.TorusGeometry(.024,.004,6,18),.03,1.688,.158,{}),mat('#c6a574',{metalness:.7,roughness:.3}),'Divider / monocle']]};
  if(role==='seer')return{skin:'#f3e3ea',hair:'#e9edf5',faceScale:[.95,1.03,1],accessories:()=>[
    [at(new T.CylinderGeometry(.108,.11,.042,40,1,true),0,1.68,.035,{rx:-.06,s:[1.04,1,1.34]}),new T.MeshStandardMaterial({color:'#dfe9ff',emissive:'#7fb6ff',emissiveIntensity:.9,roughness:.6,side:T.DoubleSide}),'Seer / glowing silk blindfold'],
    [at(new T.PlaneGeometry(.05,.34),-.03,1.55,-.12,{rz:.12,rx:.25}),new T.MeshStandardMaterial({color:'#dfe9ff',emissive:'#7fb6ff',emissiveIntensity:.6,side:T.DoubleSide}),'Seer / blindfold ribbon'],
    [at(new T.PlaneGeometry(.05,.3),.04,1.56,-.12,{rz:-.18,rx:.25}),new T.MeshStandardMaterial({color:'#dfe9ff',emissive:'#7fb6ff',emissiveIntensity:.6,side:T.DoubleSide}),'Seer / blindfold ribbon 2']]};
  if(role==='old')return{skin:'#b39a90',hair:'#f1efe8',faceScale:[1.06,.97,1.02],skipBeard:true,accessories:()=>[
    [beardGeometry({top:1.625,length:.42,width:.2,taper:.7,z:.1,curve:.04,lean:.07,strands:60}),mat('#ecebe4',{roughness:1}),'Old Scholar / great white beard'],
    [beardGeometry({top:1.638,length:.05,width:.14,taper:-.4,z:.13,curve:.015,lean:.01}),mat('#ecebe4',{roughness:1}),'Old Scholar / moustache'],
    [at(new T.SphereGeometry(.2,28,18,Math.PI*.8,Math.PI*1.4,0,Math.PI*.7),0,1.66,.0,{s:[1.12,1.14,1.12]}),mat('#3e2c1c',{roughness:1}),'Old Scholar / deep travelling cowl']]};
  return null;
}
let wear;
function armorWear(){
  if(wear)return wear;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#8d8d8d';c.fillRect(0,0,256,256);
  for(let i=0;i<700;i++){const x=(i*73)%256,y=(i*131)%256;c.strokeStyle=i%3?'#969696':'#707070';c.beginPath();c.moveTo(x,y);c.lineTo(x+2+i%9,y+1);c.stroke();}
  wear=new T.CanvasTexture(canvas);wear.wrapS=wear.wrapT=T.RepeatWrapping;return wear;
}

// Adapt the licensed anatomical mesh. Armor is fitted over that mesh, never a
// replacement humanoid assembled from primitive heads, limbs or faceless robes.
export function createActor(template,role,environment,heads) {
  const root=cloneRig(template);root.position.set(0,0,0);root.rotation.set(0,0,0);root.visible=true;
  root.name=`Character / ${role}`;
  let clips=[],skeleton,base;
  const armored=armorRoles.includes(role),color=palettes[role];
  root.traverse(o=>{
    if(o.animations?.length)clips=o.animations;
    if(o.isSkinnedMesh){if(!skeleton)skeleton=o.skeleton;else o.skeleton=skeleton;if(o.name==='model')base=o;}
    if(!o.material)return;
    if(o.isMesh&&!o.isSkinnedMesh)o.visible=role==='old';
    o.material=o.material.clone();o.castShadow=false;
    if(o.isSkinnedMesh&&o.name!=='model'){
      o.material.color.set(color);if(armored)o.visible=role==='exile'&&!/stole|collar/i.test(o.name);
      if(role==='divider'&&/mantle|stole/i.test(o.name))o.visible=false;
    }
    if(/staff|Carved|Ember/i.test(o.name)&&role!=='old')o.visible=false;
  });
  if(base){
    base.material.color.set(armored?'#b0b8b8':'#ffffff');
    if(heads?.[role])installKeeperHead(base,heads[role],keeperLook(role)||{});
  }
  const costume=new T.Group();root.add(costume);
  const iron=new T.MeshStandardMaterial({color,metalness:.58,roughness:.56,envMap:environment,bumpMap:armorWear(),bumpScale:.012});
  const edge=new T.MeshStandardMaterial({color:role==='exile'?'#93b5b0':'#c6a574',metalness:.65,roughness:.38,envMap:environment});
  const cloth=new T.MeshStandardMaterial({color,roughness:.94,side:T.DoubleSide});
  const dark=new T.MeshStandardMaterial({color:'#111b21',roughness:.86});
  function part(geometry,material,x,y,z,parent=costume){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=false;parent.add(m);return m;}
  function plate(x,y,z,w,h,d,material=iron){
    const shape=new T.Shape(),cut=Math.min(w,h)*.17;
    shape.moveTo(-w/2+cut,-h/2);shape.lineTo(w/2-cut,-h/2);shape.lineTo(w/2,-h/2+cut);shape.lineTo(w/2,h/2-cut);shape.lineTo(w/2-cut,h/2);shape.lineTo(-w/2+cut,h/2);shape.lineTo(-w/2,h/2-cut);shape.lineTo(-w/2,-h/2+cut);shape.closePath();
    const geo=new T.ExtrudeGeometry(shape,{depth:d,bevelEnabled:true,bevelThickness:Math.min(.018,d*.25),bevelSize:Math.min(.02,cut*.6),bevelSegments:2,steps:1});geo.translate(0,0,-d/2);
    return part(geo,material,x,y,z);
  }
  const weapon=new T.Group();weapon.position.set(-.43,.93,.18);costume.add(weapon);
  function blade(length,width,material=edge){
    const shape=new T.Shape();shape.moveTo(-width/2,0);shape.lineTo(-width/2,length*.82);
    if(role==='exile'){shape.lineTo(-width*.18,length*.72);shape.lineTo(width*.1,length*.9);shape.lineTo(width*.28,length*.79);}
    else shape.lineTo(0,length);
    shape.lineTo(width/2,length*.82);shape.lineTo(width/2,0);shape.closePath();
    return part(new T.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:1,steps:1}),material,0,0,0,weapon);
  }
  if(armored){
    const torso=part(new T.LatheGeometry([new T.Vector2(.19,.7),new T.Vector2(.25,.9),new T.Vector2(.32,1.3),new T.Vector2(.22,1.46)],12),iron,0,0,0);torso.scale.z=.72;
    plate(0,1.2,.23,.1,.27,.025,edge);plate(0,.79,.16,.43,.1,.07);
    for(const side of [-1,1]){
      const shoulder=part(new T.SphereGeometry(role==='agile'?.14:.22,12,8,0,Math.PI*2,0,Math.PI*.62),iron,side*.3,1.38,0);shoulder.scale.set(1,.65,1.15);
      const greave=part(new T.CylinderGeometry(.105,.075,.44,12),iron,side*.14,.36,.035);greave.scale.z=.85;
      const bracer=part(new T.CylinderGeometry(.075,.06,.3,12),iron,side*.34,1.09,.04);bracer.rotation.z=side*-.12;
      const knee=part(new T.SphereGeometry(.11,12,8),iron,side*.14,.61,.07);knee.scale.set(1,.8,.8);
      const boot=part(new T.SphereGeometry(.12,12,8),iron,side*.14,.08,.11);boot.scale.set(1,.65,1.65);
      const skirt=plate(side*.18,.65,.12,.2,.24,.12);skirt.rotation.z=side*.15;
    }
    const helmet=part(new T.SphereGeometry(.148,20,14,0,Math.PI*2,0,Math.PI*.78),iron,0,1.66,-.01);helmet.scale.set(role==='agile'?.9:1.13,1.15,1.18);helmet.visible=role!=='exile';
    const visor=plate(0,1.64,.145,.25,.14,.045,dark);
    plate(0,1.68,.175,.21,.018,.012,edge).visible=role!=='exile';
    if(visorGlow[role]){const glow=new T.MeshBasicMaterial({color:visorGlow[role],toneMapped:false});plate(0,1.645,.17,.19,.02,.012,glow);}
    if(role==='form'){
      plate(0,1.85,-.02,.3,.1,.18);plate(0,1.03,.3,.09,.48,.04,edge);
      part(new T.CylinderGeometry(.022,.025,1.8,8),edge,0,.1,0,weapon);
      const beam=part(new T.BoxGeometry(1.4,.11,.09),iron,0,.95,0,weapon);
      for(const x of [-.56,.56]){part(new T.CylinderGeometry(.012,.012,.42,6),edge,x,.69,0,weapon);part(new T.CylinderGeometry(.24,.16,.08,12),iron,x,.46,0,weapon);}
      beam.name='Executioner balance weapon';
    }else{
      blade(role==='exile'?.98:role==='heavy'?.95:.72,role==='agile'?.075:.17);
      part(new T.BoxGeometry(.38,.045,.08),edge,0,.04,0,weapon);
      part(new T.CylinderGeometry(.027,.027,.24,8),dark,0,-.12,0,weapon);
      if(role==='heavy'){
        const shield=part(new T.CylinderGeometry(.25,.25,.07,6),iron,.43,1.05,.2);shield.rotation.x=Math.PI/2;shield.scale.y=1.3;
      }
      if(role==='exile'){
        // Fracture and asymmetric plates distinguish the damaged ancient knight.
        for(let i=0;i<4;i++){const scar=plate(-.12+i*.045,1.34-i*.08,.269,.018,.17,.015,dark);scar.rotation.z=-.5;}
        plate(.38,1.39,.03,.34,.19,.34);visor.visible=false;
        // A fitted peaked cowl and folded mantle replace the generic knight head.
        const positions=[],uvs=[],indices=[],rows=24,columns=40;
        for(let r=0;r<=rows;r++)for(let c=0;c<=columns;c++){
          const v=r/rows,a=-2.35+c/columns*4.7,fold=Math.sin(a*8)*.009;
          const rx=.025+Math.sin(v*Math.PI*.83)*.29+fold,rz=.06+Math.sin(v*Math.PI*.83)*.25;
          positions.push(Math.sin(a)*rx,1.98-v*.57,-Math.cos(a)*rz-.015);uvs.push(c/columns,v);
        }
        for(let r=0;r<rows;r++)for(let c=0;c<columns;c++){const a=r*(columns+1)+c,b=a+columns+1;indices.push(a,b,a+1,b,b+1,a+1);}
        const hood=new T.BufferGeometry();hood.setAttribute('position',new T.Float32BufferAttribute(positions,3));hood.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));hood.setIndex(indices);hood.computeVertexNormals();
        const wool=cloth.clone();wool.color.set('#101216');wool.roughness=1;part(hood,wool,0,0,0);
        const mantle=part(new T.LatheGeometry([new T.Vector2(.25,1.42),new T.Vector2(.49,1.3),new T.Vector2(.58,1.03),new T.Vector2(.47,.88)],32,Math.PI*.18,Math.PI*1.64),wool,0,0,-.035);mantle.rotation.y=Math.PI;
        const eyeMat=new T.MeshStandardMaterial({color:'#b9c4c9',emissive:'#6e8898',emissiveIntensity:.3,roughness:.45});
        for(const x of [-.045,.045])part(new T.SphereGeometry(.009,8,6),eyeMat,x,1.665,.156);
      }
    }
  }else if(role==='memory'){
    part(new T.SphereGeometry(.22,20,12,Math.PI,Math.PI,0,Math.PI*.8),cloth,0,1.7,-.035);
    for(let i=0;i<6;i++){const shard=part(new T.OctahedronGeometry(.13,0),edge,Math.cos(i*Math.PI/3)*.6,1.15+Math.sin(i*Math.PI/3)*.65,-.1);shard.scale.set(.38,1.5,.25);}
    const veil=part(new T.ConeGeometry(.43,1.35,32,1,true),cloth,0,.85,-.04);veil.scale.z=.67;
  }else if(role==='divider'){
    const coat=plate(0,1.06,.24,.32,.65,.04,cloth);coat.rotation.z=.045;
    plate(.13,1.1,.275,.035,.57,.015,edge);
    const compass=part(new T.TorusGeometry(.13,.009,6,24),edge,.27,.87,.22);compass.rotation.y=.3;
    plate(-.28,.8,.17,.19,.26,.07,dark);
  }else if(role==='seer'){
    for(let i=0;i<3;i++){const jewel=part(new T.OctahedronGeometry(.04),edge,Math.cos(i*2.1)*.32,1.95+Math.sin(i*2.1)*.06,-.12);jewel.scale.y=2;}
    const mantle=part(new T.ConeGeometry(.34,.39,24,1,true),cloth,0,1.26,-.02);mantle.scale.z=.7;
  }else{
    const collar=part(new T.TorusGeometry(.22,.06,8,32),edge,0,1.44,0);collar.rotation.x=Math.PI/2;

    for(const side of [-1,1])plate(side*.22,1.05,.23,.11,.71,.03,edge);
    plate(0,1.38,.26,.15,.15,.03,edge);
  }
  const proportions={form:[1.53,1.55,1.4],heavy:[1.25,1.3,1.2],agile:[.9,1.2,.9],memory:[1.05,1.3,1.05],exile:[1.7,2.22,1.6],divider:[.95,1.16,.95],seer:[1.05,1.13,1.05],old:[1.06,1.18,1.06]}[role];
  // Static fitted surfaces batch by material. The weapon remains independent.
  const batches=new Map();
  for(const mesh of [...costume.children])if(mesh.isMesh){
    if(!mesh.visible){costume.remove(mesh);mesh.geometry.dispose();continue;}
    mesh.updateMatrix();let geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix);if(geometry.index)geometry=geometry.toNonIndexed();
    if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(geometry);costume.remove(mesh);mesh.geometry.dispose();
  }
  for(const [material,geometries] of batches){const merged=mergeGeometries(geometries);const mesh=new T.Mesh(merged,material);costume.add(mesh);geometries.forEach(g=>g.dispose());}
  root.scale.set(...proportions);
  const mixer=new T.AnimationMixer(root);const idle=clips.find(c=>/idle/i.test(c.name));if(idle)mixer.clipAction(idle).setEffectiveTimeScale(role==='agile'?.7:.32).play();
  let defeat=0;
  const reactiveBones=skeleton.bones.filter(b=>['chest','forearmL'].includes(b.name));
  let neutral=reactiveBones.map(b=>b.quaternion.clone());
  return {root,weapon,role,home:new T.Vector3(),defeated:false,
    react(amount){const chest=skeleton.bones.find(b=>b.name==='chest'),arm=skeleton.bones.find(b=>b.name==='forearmL');if(chest)chest.rotation.x-=amount*.08;if(arm)arm.rotation.z-=amount*.3;},
    reset(){this.defeated=false;defeat=0;root.visible=true;root.scale.set(...proportions);root.rotation.set(0,.06,0);weapon.rotation.set(0,0,0);},
    win(){this.defeated=true;},
    update(dt,reduced,time){
      if(!root.visible)return;
      reactiveBones.forEach((b,i)=>b.quaternion.copy(neutral[i]));
      if(!reduced)mixer.update(dt);else mixer.setTime(0);
      neutral=reactiveBones.map(b=>b.quaternion.clone());
      root.position.copy(this.home);
      if(role==='memory')root.position.y+=reduced?.22:.22+Math.sin(time*.9)*.08;
      root.rotation.z=role==='divider'?-.025:role==='seer'?.02:0;
      if(!reduced&&role==='agile')root.rotation.y=.06+Math.sin(time*.7)*.07;
      if(this.defeated){defeat=Math.min(1,defeat+(reduced?1:dt*1.8));root.rotation.z-=defeat*.18;root.position.y-=defeat*.12;}
    }
  };
}
