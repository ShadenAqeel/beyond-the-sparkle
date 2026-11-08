import * as T from 'three';
import {damp,clamp01,smooth,lerp,glowTexture,bake,windMaterial,createParticles} from './boss-kit.js';

// The Twin Warden: two linked knights. The heavy one (cold steel blue) carries
// a tower shield and a flanged mace; the agile one (ember red) fights with two
// curved blades. Each wears its twin's colour on the side that faces it, and a
// glowing oath-chain joins their inner wrists: taut when they coordinate,
// slack when they falter, broken on defeat. Original procedural geometry.
//
// Poses use world-space intent: arm angles (0 down, -PI/2 forward, -PI up),
// weapon direction D (0 up, PI/2 forward, PI down), "toward" = the twin's side.
const BASE={oX:0,oZ:.12,oE:-.3,oD:2.6,iX:0,iZ:.12,iE:-.3,iD:2.6,lean:0,crouch:.04,stride:0,twist:0,headX:0,headZ:0,fwd:0,slide:0,yaw:0,spin:0,shY:0,shZ:0,shR:0};
const POSES={
  heavy:{
    idle:   {oX:-.45,oZ:.3,oE:-.9,oD:0,iX:-.15,iZ:.14,iE:-.75,iD:.45,crouch:.06},
    lunge:  {oX:-.5,oZ:.3,oE:-1.0,oD:0,iX:-.2,iZ:.2,iE:-.9,iD:.6,crouch:.16,lean:.1,yaw:.15,stride:.12,shZ:.12,shY:.05},
    double: {oX:-.7,oZ:.3,oE:-.9,oD:0,iX:-2.75,iZ:.2,iE:-.55,iD:-.75,lean:-.1,twist:.18,crouch:.1,stride:.15,shY:.22,shZ:.2,shR:-.15},
    sweep:  {oX:-.5,oZ:.3,oE:-1.0,oD:0,iX:-1.2,iZ:1.0,iE:-.3,iD:1.4,twist:-.3,crouch:.12},
    recover:{oX:-.05,oZ:.25,oE:-.45,oD:0,iX:.05,iZ:.14,iE:-.15,iD:2.7,lean:.22,headX:.35,crouch:.12,slide:.22,yaw:.25,shY:-.28,shR:.35},
  },
  agile:{
    idle:   {oX:-.6,oZ:.32,oE:-.95,oD:1.05,iX:-.6,iZ:.32,iE:-.95,iD:1.05,crouch:.18,lean:.12},
    // Ready to lunge: low and side-on, the inner blade levelled at the traveler, the outer cocked high behind.
    lunge:  {iX:-1.35,iZ:.1,iE:-.15,iD:1.5,oX:-.3,oZ:1.25,oE:-1.3,oD:-.7,crouch:.42,lean:.32,twist:-.55,fwd:-.2,stride:.4,headZ:.12},
    double: {oX:-2.75,oZ:.08,oE:-.5,oD:-.55,iX:-2.75,iZ:.08,iE:-.5,iD:-.55,lean:-.08,crouch:.12,twist:.15,stride:.15},
    sweep:  {oX:-1.3,oZ:1.1,oE:-.2,oD:1.5,iX:-.6,iZ:.5,iE:-.9,iD:1.2,twist:.35,crouch:.25},
    recover:{oX:.05,oZ:.2,oE:-.2,oD:2.8,iX:.05,iZ:.2,iE:-.2,iD:2.8,lean:.25,headX:.4,crouch:.1,slide:.22,yaw:.25},
  }
};
POSES.heavy.windup=POSES.heavy.slam=POSES.heavy.double;POSES.agile.windup=POSES.agile.slam=POSES.agile.double;
POSES.heavy.feint=POSES.heavy.lunge;POSES.agile.feint={...POSES.agile.lunge,crouch:.28,lean:.25,fwd:0};
const STRIKES={
  heavy:{double:{iX:-1.05,iE:-.25,iD:1.9,oX:-.55,oE:-1.2,lean:.3,fwd:1.0,crouch:.22,twist:0,shZ:.6,shY:.05,shR:0},sweep:{iZ:.1,iX:-1.2,twist:.4,fwd:.4},
    lunge:{oX:-.5,oE:-1.2,fwd:.3}},
  agile:{lunge:{oX:-1.5,oZ:.3,oE:-.1,oD:1.57,iX:-1.55,iZ:.05,iE:-.05,iD:1.57,fwd:2.1,lean:.45,crouch:.3,stride:.5,twist:-.15},
    double:{oX:-1.0,oZ:.4,oE:-.2,oD:2.0,iX:-1.0,iZ:.4,iE:-.2,iD:2.0,fwd:1.1,lean:.32,crouch:.26,twist:0},
    sweep:{oZ:.2,oX:-1.3,twist:-.4,fwd:.5},feint:{fwd:.5,lean:.3}}
};
STRIKES.heavy.slam=STRIKES.heavy.windup=STRIKES.heavy.double;STRIKES.agile.slam=STRIKES.agile.windup=STRIKES.agile.double;
const KEYS=Object.keys(BASE);
const L1=.47,L2=.47;

function knight(heavy,mats,uniforms){
  const own=heavy?mats.blue:mats.red,other=heavy?mats.red:mats.blue,inner=heavy?1:-1;
  const sideMat=side=>side===inner?other:own;
  const root=new T.Group(),hips=new T.Group(),torso=new T.Group(),head=new T.Group();
  root.name=`Character / Twin Warden (${heavy?'heavy shield-knight':'agile twin blades'})`;
  hips.position.y=1;root.add(hips);hips.add(torso);head.position.y=.68;torso.add(head);
  const W=heavy?1.25:1;
  function part(geo,mat,x,y,z,parent,{rx=0,ry=0,rz=0,s=null}={}){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);if(s)m.scale.set(...s);parent.add(m);return m;}
  // Torso: a breastplate split down the middle in the twins' two colours.
  const profile=[[.17,-.02],[.2,.08],[.26,.28],[.28,.42],[.23,.55],[.11,.63]].map(([r,y])=>new T.Vector2(r*W,y));
  for(const side of [-1,1])part(new T.LatheGeometry(profile,10,side>0?0:Math.PI,Math.PI),sideMat(side),0,0,0,torso,{s:[1,1,.74]});
  part(new T.CylinderGeometry(.13*W,.16*W,.1,12),mats.silver,0,.61,0,torso);
  for(const y of [.04,.13])part(new T.TorusGeometry(.19*W,.025,5,20),mats.dark,0,y,0,torso,{rx:Math.PI/2,s:[1,.74,1]});
  part(new T.BoxGeometry(.035,.5,.03),mats.silver,0,.3,.215*W,torso);
  // Belt, faulds and a split tabard.
  part(new T.TorusGeometry(.2*W,.03,5,22),mats.silver,0,-.02,0,hips,{rx:Math.PI/2,s:[1,.76,1]});
  for(let i=0;i<7;i++){const a=(i/7-.5)*Math.PI*1.3+Math.PI,x=Math.sin(a)*.21*W,z=Math.cos(a)*.16*W;part(new T.BoxGeometry(.13,.2,.025),sideMat(Math.sign(x)||1),x,-.12,z,hips,{ry:a,rx:.15});}
  for(const side of [-1,1]){const tab=part(new T.PlaneGeometry(.15*W,.62),side===inner?mats.clothOther[heavy?1:0]:mats.clothOwn[heavy?1:0],side*.075*W,-.34,.19*W,hips,{rx:.05});tab.userData.keep=true;}
  // Head.
  const glow=heavy?mats.glowRed:mats.glowBlue;
  if(heavy){
    part(new T.CylinderGeometry(.155,.15,.3,18),own,0,.1,0,head);part(new T.SphereGeometry(.155,18,8,0,Math.PI*2,0,Math.PI/2),own,0,.25,0,head,{s:[1,.6,1]});
    part(new T.BoxGeometry(.22,.025,.02),glow,0,.12,.152,head);part(new T.BoxGeometry(.025,.12,.02),mats.silver,0,.04,.155,head);
    for(const side of [-1,1]){part(new T.BoxGeometry(.03,.17,.4),sideMat(side),side*.018,.37,-.02,head);
      part(new T.ConeGeometry(.045,.42,8),sideMat(side),side*.24,.36,.02,head,{rz:-side*.95});part(new T.TorusGeometry(.05,.018,5,12),mats.silver,side*.16,.27,.02,head,{ry:Math.PI/2});}
  }else{
    part(new T.SphereGeometry(.15,18,12),own,0,.1,-.02,head,{s:[.92,1.05,1.22]});part(new T.ConeGeometry(.1,.22,10),own,0,.08,-.22,head,{rx:-1.9});
    part(new T.BoxGeometry(.2,.022,.02),glow,0,.1,.165,head,{ry:0});
    for(const side of [-1,1])part(new T.ConeGeometry(.025,.2,6),sideMat(side),side*.11,.25,-.02,head,{rz:-side*.5});
  }
  // A cape (heavy) or a long scarf (agile), stirred by the hall's draught.
  const cloth=heavy?.82:1.25,capeGeo=new T.PlaneGeometry(heavy?.62:.14,cloth,6,10);capeGeo.translate(0,cloth/2,0);
  const cape=part(capeGeo,mats.clothOwn[heavy?1:0],0,.62-cloth,-.2*W,torso,{rx:.12});cape.userData.keep=true;
  if(!heavy){const tail=part(capeGeo.clone(),mats.clothOther[0],.1,.62-cloth,-.22,torso,{rx:.2,rz:.15});tail.userData.keep=true;}
  // Arms (index 0 is local -x).
  const shoulders=[],elbows=[],hands=[],weapons=[];let anchor=null;
  for(const side of [-1,1]){
    const sh=new T.Group();sh.position.set(side*(.27*W+.04),.5,0);torso.add(sh);
    const pr=heavy?.2:.13;part(new T.SphereGeometry(pr,14,10,0,Math.PI*2,0,Math.PI*.6),sideMat(side),side*.04,.04,0,sh,{s:[1.15,.8,1.1]});
    if(heavy)part(new T.SphereGeometry(pr*.82,12,8,0,Math.PI*2,0,Math.PI*.5),mats.silver,side*.06,-.04,0,sh,{s:[1.2,.6,1.15]});
    part(new T.CylinderGeometry(.065,.06,.3,10),mats.dark,0,-.16,0,sh);
    const el=new T.Group();el.position.y=-.32;sh.add(el);part(new T.SphereGeometry(.07,10,8),mats.silver,0,0,0,el);
    part(new T.CylinderGeometry(.075*W,.058,.27,10),sideMat(side),0,-.14,0,el);
    const hand=new T.Group();hand.position.y=-.3;el.add(hand);part(new T.BoxGeometry(.1,.12,.1),mats.dark,0,-.03,0,hand);
    if(side===inner){part(new T.TorusGeometry(.075,.022,6,14),mats.silver,0,.04,0,hand,{rx:Math.PI/2});anchor=new T.Object3D();anchor.position.set(0,.04,0);hand.add(anchor);}
    const weapon=new T.Group();hand.add(weapon);weapons.push(weapon);
    shoulders.push(sh);elbows.push(el);hands.push(hand);
  }
  // Weapons.
  const outer=inner>0?0:1,innerIndex=1-outer;let shieldMount=null;
  if(heavy){
    // Tower shield on the outer forearm, a flanged mace in the inner hand.
    // The tower shield rides on the outer side of the torso so the knight
    // behind it stays visible; it has its own block / bash animation.
    const shieldSide=-inner;shieldMount=new T.Group();shieldMount.position.set(shieldSide*.5,.12,.32);shieldMount.rotation.y=shieldSide*.28;torso.add(shieldMount);
    const shield=new T.Group();shieldMount.add(shield);
    const sw=.72,shh=1.2,shape=new T.Shape();shape.moveTo(-sw/2,-shh/2+.15);shape.lineTo(-sw/2,shh/2-.08);shape.quadraticCurveTo(0,shh/2+.1,sw/2,shh/2-.08);shape.lineTo(sw/2,-shh/2+.15);shape.quadraticCurveTo(0,-shh/2-.12,-sw/2,-shh/2+.15);
    const board=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelSize:.03,bevelThickness:.02,bevelSegments:1,steps:1}),own);shield.add(board);
    const half=new T.Shape();half.moveTo(0,-.34);half.lineTo(0,.34);half.absarc(0,0,.34,Math.PI/2,-Math.PI/2,inner<0);const emblem=new T.Mesh(new T.ShapeGeometry(half,16),other);emblem.position.z=.085;shield.add(emblem);
    const ring=new T.Mesh(new T.TorusGeometry(.34,.022,6,40),mats.silver);ring.position.z=.085;shield.add(ring);
    const spine=new T.Mesh(new T.BoxGeometry(.04,1.05,.03),mats.silver);spine.position.z=.09;shield.add(spine);
    const rimTop=new T.Mesh(new T.BoxGeometry(.7,.04,.04),mats.silver);rimTop.position.set(0,.5,.07);shield.add(rimTop);
    bake(shield);
    const mace=weapons[innerIndex];
    mace.add(new T.Mesh(new T.CylinderGeometry(.028,.03,.82,8),mats.dark));mace.children[0].position.y=.28;
    const headBall=new T.Mesh(new T.SphereGeometry(.09,12,8),mats.silver);headBall.position.y=.72;mace.add(headBall);
    for(let i=0;i<6;i++){const f=new T.Mesh(new T.BoxGeometry(.02,.2,.1),own);f.position.set(Math.sin(i/6*Math.PI*2)*.07,.72,Math.cos(i/6*Math.PI*2)*.07);f.rotation.y=i/6*Math.PI*2;mace.add(f);}
    const tip=new T.Mesh(new T.ConeGeometry(.03,.12,6),mats.silver);tip.position.y=.86;mace.add(tip);
    bake(mace);mace.scale.setScalar(1.15);
  }else{
    for(const [i,weapon] of weapons.entries()){
      const s=new T.Shape();s.moveTo(-.03,0);s.lineTo(-.04,.7);s.quadraticCurveTo(-.03,1.12,.1,1.32);s.lineTo(.05,.84);s.quadraticCurveTo(.05,.4,.034,0);s.closePath();
      const blade=new T.Mesh(new T.ExtrudeGeometry(s,{depth:.012,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:1,steps:1}),i===innerIndex?mats.bladeOther:mats.bladeOwn);blade.position.set(0,.06,-.006);blade.rotation.y=Math.PI/2;weapon.add(blade);
      const guard=new T.Mesh(new T.BoxGeometry(.06,.025,.18),mats.silver);guard.position.y=.05;weapon.add(guard);
      const grip=new T.Mesh(new T.CylinderGeometry(.02,.02,.15,6),mats.dark);grip.position.y=-.03;weapon.add(grip);
      bake(weapon);weapon.scale.setScalar(1.1);
    }
  }
  // Legs.
  const thighs=[],knees=[];
  for(const side of [-1,1]){
    const th=new T.Group();th.position.set(side*.11*W,-.02,0);hips.add(th);
    part(new T.CylinderGeometry(.1*W,.085,.46,10),mats.dark,0,-.23,0,th);part(new T.CylinderGeometry(.105*W,.09,.3,10,1,true,-Math.PI*.6,Math.PI*1.2),sideMat(side),0,-.2,.0,th);
    const kn=new T.Group();kn.position.y=-L1;th.add(kn);part(new T.SphereGeometry(.085,10,8),mats.silver,0,0,.03,kn);
    part(new T.CylinderGeometry(.088,.07,.42,10),sideMat(side),0,-.22,0,kn);part(new T.BoxGeometry(.12,.08,.27),mats.dark,0,-.45,.06,kn);
    thighs.push(th);knees.push(kn);
  }
  for(const g of [torso,head,hips,...shoulders,...elbows,...hands,...thighs,...knees])bake(g);
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
  return {root,hips,torso,head,shoulders,elbows,hands,weapons,thighs,knees,anchor,inner,outer,innerIndex,glow,cape,shieldMount,shieldHome:shieldMount?.position.clone()};
}

export function createTwinWarden(environment){
  const uniforms={uTime:{value:0},uGust:{value:0}};
  const metal=(color,extra={})=>new T.MeshStandardMaterial({color,metalness:.78,roughness:.34,envMap:environment,envMapIntensity:1.2,...extra});
  const clothOf=color=>windMaterial({color,roughness:.92,side:T.DoubleSide},uniforms,{amount:.07,height:1.3});
  const blueCloth=clothOf('#2b5b80'),redCloth=clothOf('#7c201c');
  const mats={blue:metal('#5a8db0'),red:metal('#a8413a'),dark:metal('#1d2128',{metalness:.55,roughness:.6}),silver:metal('#d9e0e7',{metalness:.95,roughness:.2}),
    clothOwn:[redCloth,blueCloth],clothOther:[blueCloth,redCloth],
    glowBlue:new T.MeshBasicMaterial({color:'#9fe4ff',toneMapped:false}),glowRed:new T.MeshBasicMaterial({color:'#ff7a52',toneMapped:false}),
    bladeOwn:metal('#e2e6ea',{metalness:.95,roughness:.15,emissive:'#ff4a2a',emissiveIntensity:.35}),bladeOther:metal('#e2e6ea',{metalness:.95,roughness:.15,emissive:'#3ab6ff',emissiveIntensity:.35})};
  const heavy=knight(true,mats,uniforms),agile=knight(false,mats,uniforms);
  // The oath-chain: instanced links on a sagging curve, coloured blue to red.
  const LINKS=30,chain=new T.Group();chain.name='Twin Warden / oath-chain';
  const linkMat=new T.MeshBasicMaterial({color:'#ffffff',toneMapped:false});
  const links=new T.InstancedMesh(new T.TorusGeometry(.06,.016,5,10),linkMat,LINKS);links.frustumCulled=false;chain.add(links);
  const glowGeo=new T.BufferGeometry(),glowPos=new Float32Array(LINKS*3),glowCol=new Float32Array(LINKS*3);
  glowGeo.setAttribute('position',new T.BufferAttribute(glowPos,3));glowGeo.setAttribute('color',new T.BufferAttribute(glowCol,3));
  const glowMat=new T.PointsMaterial({map:glowTexture('#ffffff','#ffffff66'),size:.32,vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.8});
  const glowPoints=new T.Points(glowGeo,glowMat);glowPoints.frustumCulled=false;chain.add(glowPoints);
  const blue=new T.Color('#5fc8ff'),red=new T.Color('#ff5a3a'),c=new T.Color();
  for(let i=0;i<LINKS;i++){c.copy(blue).lerp(red,i/(LINKS-1));links.setColorAt(i,c);glowCol.set([c.r,c.g,c.b],i*3);}
  const A=new T.Vector3(),B=new T.Vector3(),P=new T.Vector3(),Q=new T.Vector3(),dir=new T.Vector3(),o=new T.Object3D(),up=new T.Vector3(0,1,0);
  const chainState={tension:.35,glow:.5,broken:0};
  // Sparks flying where the chain is pulled taut.
  const sparks=createParticles({count:40,min:[-1.2,-.25,-.3],max:[1.2,.7,.3],velocity:[0,.6,0],wobble:.15,size:.06,color:'#fff0d8',opacity:0,twinkle:.8,shape:'spark',seed:77});chain.add(sparks.points);

  function actorFor(k,role,scale){
    const state={...BASE,defeat:0,recoil:0,strike:0,laugh:0,rage:0};let telegraph=null,strikeKind=null,strikeOwn=0;const toward=k.inner;
    const actor={root:k.root,weapon:k.weapons[k.innerIndex],role,custom:true,keepOnReward:true,home:new T.Vector3(),defeated:false,hitHeight:(role==='heavy'?1.38:1.3)*scale,hitDepth:.7,contactScale:1.25,
      react(){},
      reset(){this.defeated=false;Object.assign(state,BASE,POSES[role].idle,{defeat:0,recoil:0,strike:0,laugh:0,rage:0});telegraph=null;strikeKind=null;k.root.visible=true;k.root.scale.setScalar(scale);chainState.broken=0;},
      win(){this.defeated=true;},
      enrage(value){state.rage=value?1:0;},
      laugh(){state.laugh=1;},
      pose({telegraph:move=null,strike=0,recoil=0}={}){telegraph=move;strikeOwn=strike;state.recoil=Math.max(state.recoil*.5,recoil);strikeKind=move?.kind;},
      update(dt,reduced,time){
        if(!k.root.visible||dt<=0)return;
        const kind=telegraph?.kind,target={...BASE,...(POSES[role][kind]||POSES[role].idle)};
        state.strike=strikeOwn;
        if(state.strike>0&&STRIKES[role][strikeKind]){const blow=STRIKES[role][strikeKind];for(const key in blow)target[key]=lerp(target[key],blow[key],state.strike);}
        // Personality: the heavy one stands like a wall and keeps an eye on its
        // twin; the agile one cannot keep still.
        if(!reduced&&!this.defeated){
          if(role==='agile'){target.crouch+=Math.sin(time*5.2)*.025;if(!kind){target.slide+=Math.sin(time*.9)*.18;target.headZ=Math.sin(time*.7)*.18;}target.spin=Math.sin(time*2.2)*.6;}
          else{target.twist+=Math.max(0,Math.sin(time*.35))*.35;target.headZ=Math.sin(time*.3)*.04;}
        }
        if(state.laugh>.05&&!reduced){if(role==='heavy'){target.iX-=Math.abs(Math.sin(time*9))*.6*state.laugh;target.headX-=.2*state.laugh;}else{target.spin+=state.laugh*Math.sin(time*14)*3;target.headZ+=.25*state.laugh;}}
        if(this.defeated){Object.assign(target,{oX:.08,oZ:.15,oE:-.1,oD:3.0,iX:.08,iZ:.15,iE:-.1,iD:3.0,lean:.28,headX:.5,headZ:0,twist:0,fwd:0,slide:0,yaw:.2,spin:0,stride:0,crouch:0});state.defeat=Math.min(1,state.defeat+(reduced?1:dt*1.1));}
        const speed=state.strike>0?20:reduced?60:5.5;
        for(const key of KEYS)state[key]=damp(state[key],target[key],speed,dt);
        state.recoil=damp(state.recoil,0,5,dt);state.laugh=damp(state.laugh,0,1.5,dt);
        const r=state.recoil,d=smooth(state.defeat);
        // Root, hips and legs: crouch keeps the feet planted; defeat kneels.
        k.root.position.copy(this.home);k.root.position.x+=state.slide*toward;k.root.position.z+=state.fwd-r*.45;k.root.rotation.y=state.yaw*toward;
        const crouch=Math.min(.6,state.crouch+r*.08),drop=crouch*.42,theta=Math.acos(1-drop/(L1+L2));
        const legs=[[-theta-state.stride,2*theta],[-theta+state.stride*.6,2*theta+state.stride*.3]];
        const kneel=[[-1.45,1.5],[.05,1.62]];
        legs.forEach(([th,kn],i)=>{const j=k.inner>0?i:1-i;k.thighs[j].rotation.x=lerp(th,kneel[i][0],d);k.knees[j].rotation.x=lerp(kn,kneel[i][1],d);});
        k.hips.position.y=1-lerp(drop,.48,d)+(reduced?0:Math.sin(time*1.2+(role==='heavy'?0:1))*.008);
        k.torso.rotation.x=state.lean-r*.32;k.torso.rotation.y=state.twist*toward;k.torso.rotation.z=d*.06*toward;
        const breathe=reduced?0:Math.sin(time*(role==='heavy'?1.1:1.9))*.012;k.torso.scale.set(1+breathe,1+breathe*.5,1+breathe);
        k.head.rotation.x=state.headX-r*.4;k.head.rotation.y=(role==='heavy'?state.twist*.6:0)*toward;k.head.rotation.z=state.headZ*toward;
        // Arms and weapons: weapon direction is solved from the arm chain.
        for(const [index,prefix] of [[k.outer,'o'],[k.innerIndex,'i']]){
          const side=index?1:-1,sx=state[prefix+'X'],ex=state[prefix+'E'];
          k.shoulders[index].rotation.set(sx,0,side*state[prefix+'Z']);k.elbows[index].rotation.x=ex;
          const weapon=k.weapons[index];
          if(role==='agile'||index===k.innerIndex){weapon.rotation.x=state[prefix+'D']-sx-ex;weapon.rotation.y=role==='agile'?state.spin*(index?1:-1):0;}
        }
        if(k.shieldMount){k.shieldMount.position.copy(k.shieldHome);k.shieldMount.position.y+=state.shY-d*.55;k.shieldMount.position.z+=state.shZ;k.shieldMount.rotation.x=state.shR+d*.7;}
        uniforms.uTime.value=reduced?0:time;uniforms.uGust.value=Math.max(state.strike,r*.8);
        // Chain: computed once both twins have moved this frame.
        stamps[role]=time;if(stamps.heavy===stamps.agile)updateChain(dt,reduced,time);
      }
    };
    stateOf[role]={state,get telegraph(){return telegraph;},actor};
    return actor;
  }
  const stamps={heavy:-1,agile:-2},stateOf={};
  function updateChain(dt,reduced,time){
    const hs=stateOf.heavy,as=stateOf.agile,kind=hs.telegraph?.kind,defeated=hs.actor.defeated&&as.actor.defeated;
    const strike=Math.max(hs.state.strike,as.state.strike);
    let tension=kind==='double'||kind==='windup'||kind==='slam'?1:kind==='lunge'||kind==='sweep'?.55:kind==='recover'?0:.32;
    if(strike>0)tension=1;tension=Math.max(0,tension-Math.max(hs.state.recoil,as.state.recoil)*.5);
    chainState.tension=damp(chainState.tension,tension,reduced?60:4,dt);
    chainState.glow=damp(chainState.glow,(kind==='recover'?.35:.75)+chainState.tension*.6+strike*.9,reduced?60:6,dt);
    chainState.broken=defeated?Math.min(1,chainState.broken+(reduced?1:dt*.9)):0;
    heavy.root.updateMatrixWorld(true);agile.root.updateMatrixWorld(true);
    heavy.anchor.getWorldPosition(A);agile.anchor.getWorldPosition(B);chain.parent?.updateMatrixWorld(true);chain.worldToLocal(A);chain.worldToLocal(B);
    const span=A.distanceTo(B),slack=Math.max(0,4.4-span),sag=lerp(.25+slack*.45,.02,chainState.tension)+(reduced?0:Math.sin(time*1.7)*.03*(1-chainState.tension));
    const br=smooth(chainState.broken),floor=-chain.position.y+.04;
    for(let i=0;i<LINKS;i++){
      const t=i/(LINKS-1);
      P.lerpVectors(A,B,t);P.y-=4*sag*t*(1-t);
      if(br>0){const half=t<.5,end=half?A:B,u=half?t:1-t,len=u*span;Q.set(end.x+(half?1:-1)*Math.max(0,len-(end.y-floor))*.6,Math.max(floor,end.y-len),end.z+.1);P.lerp(Q,br);}
      const t2=Math.min(1,t+.02),t1=Math.max(0,t-.02);
      Q.lerpVectors(A,B,t2);Q.y-=4*sag*t2*(1-t2);dir.lerpVectors(A,B,t1);dir.y-=4*sag*t1*(1-t1);dir.subVectors(Q,dir).normalize();
      if(br>.5)dir.set(0,1,0);
      o.position.copy(P);o.quaternion.setFromUnitVectors(up,dir);o.rotateY(i%2?Math.PI/2:0);o.updateMatrix();links.setMatrixAt(i,o.matrix);glowPos.set([P.x,P.y,P.z],i*3);
    }
    links.instanceMatrix.needsUpdate=true;glowGeo.attributes.position.needsUpdate=true;
    const g=chainState.glow*(1-br*.8);linkMat.color.setScalar(Math.min(1.6,.45+g*.6));glowMat.opacity=Math.min(1,g*.55);glowMat.size=.22+chainState.tension*.16+strike*.2;
    sparks.update(time,reduced);sparks.material.uniforms.uOpacity.value=reduced?0:Math.max(0,chainState.tension-.6)*2*(1-br);
    sparks.points.position.lerpVectors(A,B,.5);
  }
  const H=1.72,G=1.5;
  heavy.root.scale.setScalar(H);agile.root.scale.setScalar(G);
  // The chain lives under the heavy knight but is counter-scaled to world units.
  heavy.root.add(chain);chain.scale.setScalar(1/H);
  return {heavy:actorFor(heavy,'heavy',H),agile:actorFor(agile,'agile',G)};
}
