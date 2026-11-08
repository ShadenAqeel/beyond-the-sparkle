import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {rand,damp,clamp01,smooth,lerp,glowTexture,glowSprite,ghostMaterial,windMaterial,bake} from './boss-kit.js';

// The Veiled Mirror: a floating veiled woman of glass shards with no legs.
// Mirror fragments orbit her and three translucent reflections flicker around
// her. On a feint a reflection draws a blade and lunges while she stays still;
// on a real strike her orbiting shards fly forward. Defeated, the reflections
// shatter into motes and she sinks into the mirrored floor.
const BASE={float:.28,lean:0,turn:0,sway:0,headX:0,headZ:0,lX:-.5,lZ:-.2,lE:-1.55,rX:-.5,rZ:-.2,rE:-1.55,fwd:0,glow:1,blade:0,gather:0,orbit:1,still:0};
const POSES={
  idle:   {},
  feint:  {still:1,glow:.8},
  lunge:  {rX:-1.5,rZ:.15,rE:-.08,lX:.35,lZ:.35,lE:-.3,lean:-.06,glow:1.8,gather:1,turn:-.1},
  double: {rX:-1.4,rZ:.3,rE:-.1,lX:-1.4,lZ:.3,lE:-.1,glow:1.7,gather:1},
  windup: {rX:-2.6,rZ:.4,rE:-.3,lX:-2.6,lZ:.4,lE:-.3,glow:1.5,lean:-.1,gather:.5},
  slam:   {rX:-2.7,rZ:.3,rE:-.2,lX:-2.7,lZ:.3,lE:-.2,glow:1.8,lean:-.12,gather:1},
  sweep:  {rX:-1.2,rZ:1.2,rE:-.1,lX:.2,lZ:.3,lE:-.4,glow:1.5,turn:.3,gather:.6},
  recover:{float:-.05,lean:.18,headX:.45,lX:.12,lZ:.12,lE:-.25,rX:.12,rZ:.12,rE:-.25,glow:.3,orbit:.35},
};
const STRIKES={lunge:{fwd:1.0,lean:.28,rX:-1.6},double:{fwd:.8,lean:.2},slam:{rX:-1.0,lX:-1.0,fwd:.7,lean:.25},windup:{fwd:.4},sweep:{rZ:-.4,turn:-.4,fwd:.4}};
const GHOST_FEINT={rX:-2.5,rZ:.3,rE:-.45,lX:.3,lZ:.4,lE:-.4,lean:-.12,blade:1,glow:1.6};
const KEYS=Object.keys(BASE);

function geometries(){
  const r=rand(91);
  const shard=new T.OctahedronGeometry(.1,0);
  const gown=[];const o=new T.Object3D();
  for(let i=0;i<104;i++){
    const u=i/104,y=2.0-Math.pow(u,.85)*1.78,rad=.19+(2.0-y)*.42+u*u*(r()-.3)*.3,a=i*2.39996+r()*.3;
    o.position.set(Math.sin(a)*rad,y+(r()-.5)*.08*u,Math.cos(a)*rad*.92);o.rotation.set(-.42+(r()-.5)*u*.8,a,(r()-.5)*.25*(1+u*2),'YXZ');
    const s=(1-u*.45)*(.8+r()*.4);o.scale.set(.55*s,2.5*s,.22*s);o.updateMatrix();gown.push(o.matrix.clone());
  }
  const halo=[];for(let i=0;i<7;i++){const a=(i/6-.5)*2.5;o.position.set(Math.sin(a)*.3,.08+Math.cos(a)*.3,-.1);o.rotation.set(0,0,-a,'XYZ');o.scale.set(.18,1.3+(i%2)*.6,.12);o.updateMatrix();halo.push(o.matrix.clone());}
  const bodice=new T.LatheGeometry([[.0,1.93],[.2,1.97],[.23,2.1],[.185,2.3],[.215,2.47],[.285,2.62],[.2,2.73],[.06,2.79]].map(([x,y])=>new T.Vector2(x,y)),20);bodice.scale(1,1,.74);
  // A veil over the head and face, and a drape that falls only down her back,
  // leaving the glass bodice and arms visible from the front.
  const headPts=[[.02,1.17],[.14,1.12],[.185,1.0],[.19,.86],[.2,.74],[.25,.62]].map(([x,y])=>new T.Vector2(x,y));
  const backPts=[[.24,.66],[.3,.45],[.4,.18],[.48,0]].map(([x,y])=>new T.Vector2(x,y));
  const veil=mergeGeometries([new T.LatheGeometry(headPts,28),new T.LatheGeometry(backPts,22,Math.PI-1.75,3.5)]);veil.scale(1,1,.92);
  const tail=new T.PlaneGeometry(.5,2.5,3,10);tail.translate(0,1.25,0);
  const sleeve=new T.ConeGeometry(.17,.62,12,1,true);sleeve.translate(0,-.31,0);
  const finger=new T.ConeGeometry(.012,.17,4);finger.translate(0,-.085,0);
  const blade=new T.OctahedronGeometry(.1,0);blade.scale(.4,8,.12);blade.translate(0,.75,0);
  const aura=new T.ConeGeometry(.95,1.85,24,1,true);aura.translate(0,1.1,0);
  return {shard,gown,halo,bodice,veil,tail,sleeve,finger,blade,aura,
    upper:new T.CylinderGeometry(.036,.03,.36,8),fore:new T.CylinderGeometry(.03,.022,.33,8),palm:new T.BoxGeometry(.06,.08,.02),head:new T.SphereGeometry(.13,18,14),neck:new T.CylinderGeometry(.045,.05,.12,8)};
}

function figure(g,m){
  const fig=new T.Group(),body=new T.Group();fig.add(body);
  const gown=new T.InstancedMesh(g.shard,m.glass,g.gown.length);g.gown.forEach((mat,i)=>gown.setMatrixAt(i,mat));body.add(gown);
  const aura=new T.Mesh(g.aura,m.aura);body.add(aura);
  body.add(new T.Mesh(g.bodice,m.glass));
  const neck=new T.Mesh(g.neck,m.glass);neck.position.y=2.83;body.add(neck);
  const head=new T.Group();head.position.y=2.95;body.add(head);
  const face=new T.Mesh(g.head,m.face);face.scale.set(1,1.18,1.05);head.add(face);
  const veil=new T.Mesh(g.veil,m.veil);veil.position.y=-.92;head.add(veil);
  const halo=new T.InstancedMesh(g.shard,m.glass,g.halo.length);g.halo.forEach((mat,i)=>halo.setMatrixAt(i,mat));halo.position.y=.12;head.add(halo);
  const tail=new T.Mesh(g.tail,m.veil);tail.position.set(0,-2.65,-.22);tail.rotation.x=.18;head.add(tail);
  const shoulders=[],elbows=[],hands=[];
  for(const side of [-1,1]){
    const sh=new T.Group();sh.position.set(side*.27,2.62,0);body.add(sh);
    const up=new T.Mesh(g.upper,m.glass);up.position.y=-.18;sh.add(up);const sl=new T.Mesh(g.sleeve,m.veil);sl.position.y=-.05;sh.add(sl);
    const el=new T.Group();el.position.y=-.37;sh.add(el);const fo=new T.Mesh(g.fore,m.glass);fo.position.y=-.16;el.add(fo);
    const hand=new T.Group();hand.position.y=-.34;el.add(hand);hand.add(new T.Mesh(g.palm,m.glass));
    for(let f=0;f<4;f++){const fi=new T.Mesh(g.finger,m.glass);fi.position.set((f-1.5)*.016,-.04,0);fi.rotation.z=(f-1.5)*.08;hand.add(fi);}
    bake(hand);shoulders.push(sh);elbows.push(el);hands.push(hand);
  }
  const blade=new T.Mesh(g.blade,m.blade||m.glass);blade.rotation.x=Math.PI/2;blade.position.y=-.04;blade.scale.setScalar(.001);hands[1].add(blade);
  fig.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=!o.isInstancedMesh;}});
  return {fig,body,head,veil,shoulders,elbows,hands,blade,state:{...BASE}};
}
function applyPose(f,s,time,reduced){
  const idle=reduced?0:1-s.still;
  f.body.position.y=s.float+Math.sin(time*.9)*.08*idle;
  f.body.rotation.x=s.lean;f.body.rotation.z=s.sway+Math.sin(time*.55)*.035*idle;f.fig.rotation.y=s.turn+Math.sin(time*.3)*.12*idle;
  f.head.rotation.x=s.headX+Math.sin(time*.7)*.05*idle;f.head.rotation.z=s.headZ+Math.sin(time*.45+1)*.12*idle;
  for(const [i,p] of [[0,'l'],[1,'r']]){const side=i?1:-1;f.shoulders[i].rotation.set(s[p+'X']+Math.sin(time*.8+i)*.06*idle,0,side*s[p+'Z']);f.elbows[i].rotation.x=s[p+'E'];}
  f.blade.scale.setScalar(Math.max(.001,s.blade));
}

export function createVeiledMirror(environment){
  const root=new T.Group();root.name='Character / The Veiled Mirror (glass revenant)';
  const uniforms={uTime:{value:0},uGust:{value:0}};
  const glass=new T.MeshStandardMaterial({color:'#d9d2f4',metalness:.88,roughness:.1,envMap:environment,envMapIntensity:1.7,emissive:'#6b56c9',emissiveIntensity:.45});
  const veil=windMaterial({color:'#e9e3ff',roughness:.5,transparent:true,opacity:.62,depthWrite:false,side:T.DoubleSide,emissive:'#6a58c0',emissiveIntensity:.3},uniforms,{amount:.055,height:2.6});
  const face=new T.MeshStandardMaterial({color:'#8f88b8',roughness:.25,metalness:.6,emissive:'#7c70d8',emissiveIntensity:.3,envMap:environment});
  const aura=ghostMaterial('#5b45c0','#d9d2ff',.38);
  const geos=geometries(),real=figure(geos,{glass,veil,face,aura});root.add(real.fig);
  // Reflections: same silhouette, one translucent fresnel material each.
  const ghostSpots=[[-2.35,-.7,.42],[2.35,-.7,-.42],[1.15,-3.0,-.18]];
  const ghosts=ghostSpots.map(([x,z,yaw],i)=>{
    const mat=ghostMaterial('#6a58d8','#e6dcff',.3),f=figure(geos,{glass:mat,veil:mat,face:mat,aura:mat,blade:mat});
    // A lunging reflection comes at the traveler on its own side, never across her.
    f.fig.position.set(x,0,z);f.home=new T.Vector3(x,0,z);f.toward=new T.Vector3(-x*.18,0,2.4).normalize();f.yaw=yaw;f.mat=mat;f.phase=i*1.7+.4;f.alpha=.3;root.add(f.fig);return f;
  });
  // Orbiting mirror fragments.
  const SHARDS=11,fragShape=new T.Shape();fragShape.moveTo(0,.36);fragShape.lineTo(.12,.04);fragShape.lineTo(.03,-.3);fragShape.lineTo(-.1,-.02);fragShape.closePath();
  const fragGeo=new T.ExtrudeGeometry(fragShape,{depth:.014,bevelEnabled:true,bevelSize:.006,bevelThickness:.004,bevelSegments:1,steps:1});fragGeo.translate(0,0,-.007);
  const mirror=new T.MeshStandardMaterial({color:'#f2eeff',metalness:.85,roughness:.05,envMap:environment,envMapIntensity:2.2,emissive:'#9c8aff',emissiveIntensity:.8,side:T.DoubleSide});
  const frags=new T.InstancedMesh(fragGeo,mirror,SHARDS);frags.frustumCulled=false;root.add(frags);
  // Gathered, the shards form a ring of blades around her raised right hand.
  const fr=rand(13),fragSeeds=Array.from({length:SHARDS},(_,i)=>{const t=i/SHARDS*Math.PI*2;return {a:i/SHARDS*Math.PI*2,rad:1.25+fr()*.5,y:1.3+fr()*1.7,speed:.35+fr()*.25,tilt:fr()*6,size:.75+fr()*.5,
    ring:t,form:new T.Vector3(.62+Math.cos(t)*.62,2.75+Math.sin(t)*.62,.75),out:new T.Vector3(Math.cos(t),Math.sin(t)*.6,0)};});
  const o=new T.Object3D(),orbitPos=new T.Vector3(),formPos=new T.Vector3();
  // A soft halo of cold light behind her, and motes for the shattering.
  const glowMap=glowTexture('#ffffff','#c9bcff88');
  const halo=glowSprite(glowMap,'#a89bff',3.4,.35);halo.position.set(0,2.2,-.4);root.add(halo);
  const BURST=240,burstPos=new Float32Array(BURST*3),burstSeed=[];const br=rand(5);
  for(let i=0;i<BURST;i++){const gi=Math.floor(i/80);burstSeed.push({g:gi,o:new T.Vector3((br()-.5)*.7,.4+br()*2.9,(br()-.5)*.5),v:new T.Vector3((br()-.5)*3.2,br()*1.8-.2,(br()-.5)*2.4)});}
  const burstGeo=new T.BufferGeometry();burstGeo.setAttribute('position',new T.BufferAttribute(burstPos,3));
  const burst=new T.Points(burstGeo,new T.PointsMaterial({map:glowMap,color:'#e1d9ff',size:.12,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0}));burst.frustumCulled=false;root.add(burst);
  root.traverse(x=>{if(x.isMesh){x.castShadow=false;x.receiveShadow=false;}});
  const SCALE=1.05;root.scale.setScalar(SCALE);
  const state=real.state,extra={defeat:0,recoil:0,strike:0,laugh:0,rage:0,progress:-1,feintGhost:0,gather:0,fly:0,burstTime:0};
  let telegraph=null,strikeKind=null,lastKind=null;
  const ghostAlpha=(i,time,reduced)=>{
    const f=ghosts[i];if(reduced)return f.alpha;
    // Irregular flicker: a slow shimmer plus brief dropouts.
    const n=Math.sin(time*2.3+f.phase)*.5+Math.sin(time*5.7+f.phase*2.1)*.3,drop=Math.sin(time*1.13+f.phase*3)>.93?.15:1;
    return f.alpha*(.75+n*.35)*drop;
  };
  return {root,weapon:frags,role:'memory',custom:true,keepOnReward:true,home:new T.Vector3(),defeated:false,hitHeight:2.45*SCALE,hitDepth:.65,contactScale:1.5,
    react(){},
    reset(){this.defeated=false;Object.assign(state,BASE);Object.assign(extra,{defeat:0,recoil:0,strike:0,laugh:0,rage:0,progress:-1,gather:0,fly:0,burstTime:0});telegraph=null;strikeKind=null;lastKind=null;root.visible=true;root.scale.setScalar(SCALE);
      ghosts.forEach(f=>{Object.assign(f.state,BASE);f.fig.visible=true;f.alpha=.3;f.fig.position.copy(f.home);});burst.material.opacity=0;real.fig.position.set(0,0,0);},
    win(){this.defeated=true;},
    enrage(value){extra.rage=value?1:0;},
    laugh(){extra.laugh=1;},
    pose({telegraph:move=null,strike=0,recoil=0,progress}={}){telegraph=move;extra.strike=strike;extra.recoil=Math.max(extra.recoil*.5,recoil);strikeKind=move?.kind;extra.progress=progress??-1;},
    update(dt,reduced,time){
      if(!root.visible||dt<=0)return;
      const kind=telegraph?.kind;
      if(kind==='feint'&&lastKind!=='feint')extra.feintGhost=(extra.feintGhost+1)%2;lastKind=kind;
      const target={...BASE,...(POSES[kind]||POSES.idle)};
      if(extra.strike>0&&STRIKES[strikeKind]){const b=STRIKES[strikeKind];for(const k in b)target[k]=lerp(target[k],b[k],extra.strike);target.glow=2.4;}
      if(extra.laugh>.05){target.headZ+=.3*extra.laugh;target.headX-=.15*extra.laugh;}
      if(this.defeated){Object.assign(target,{float:-1.6,lean:.1,headX:.55,lX:.3,lZ:.2,lE:-.1,rX:.3,rZ:.2,rE:-.1,glow:0,gather:0,orbit:0,fwd:0,still:1});extra.defeat=Math.min(1,extra.defeat+(reduced?1:dt*.55));}
      const speed=extra.strike>0?16:reduced?60:4;
      for(const k of KEYS)state[k]=damp(state[k],target[k],k==='float'&&this.defeated?1.4:speed,dt);
      extra.recoil=damp(extra.recoil,0,5,dt);extra.laugh=damp(extra.laugh,0,1.4,dt);
      const rec=extra.recoil,d=extra.defeat;
      root.position.copy(this.home);real.fig.position.set(0,0,state.fwd-rec*.5);
      state.lean-=rec*.3;applyPose(real,state,time,reduced);state.lean+=rec*.3;real.head.rotation.x-=rec*.35;
      uniforms.uTime.value=reduced?0:time;uniforms.uGust.value=Math.max(extra.strike,rec);
      const glow=Math.max(0,state.glow+rec*1.6+extra.rage*.4);
      glass.emissiveIntensity=.25+glow*.32;face.emissiveIntensity=.12+glow*.22;mirror.emissiveIntensity=(.35+glow*.25)*(1-d*.6);
      aura.uniforms.uOpacity.value=(.22+glow*.12)*(1-d);halo.material.opacity=(.16+glow*.12)*(1-d*.7);halo.scale.setScalar(3.2+glow*.5);
      veil.opacity=.62*(1-d*.6);
      // Reflections echo her with their own lag; one becomes vivid to feint.
      ghosts.forEach((f,i)=>{
        const feinting=kind==='feint'&&i===extra.feintGhost&&!this.defeated;
        const gt={...BASE,...(feinting?GHOST_FEINT:POSES[kind]&&kind!=='feint'&&kind!=='lunge'?POSES[kind]:POSES.idle)};
        let lunge=0,alpha=kind==='recover'?0:kind==='lunge'?.08:feinting?1.7:kind==='feint'?.14:.3;
        if(feinting){
          if(extra.progress>=0){lunge=smooth(extra.progress/.55)*2.0;if(extra.progress>.72)alpha*=1-smooth((extra.progress-.72)/.25);}
          else if(reduced)lunge=.6;
          else{const p=(time*.55+i*.3)%1;lunge=p<.35?-smooth(p/.35)*.35:p<.55?-.35+smooth((p-.35)/.2)*1.35:1.0-smooth((p-.55)/.45);}
          gt.lean+=lunge*.06;
        }
        if(extra.laugh>.2)alpha=Math.max(alpha,.7*extra.laugh);
        if(rec>.2)alpha=Math.max(alpha,.55*rec);
        f.alpha=damp(f.alpha,alpha,reduced?60:6,dt);
        for(const k of KEYS)f.state[k]=damp(f.state[k],gt[k],reduced?60:feinting?7:2.2,dt);
        f.fig.position.copy(f.home).addScaledVector(f.toward,lunge);
        applyPose(f,f.state,time+f.phase,reduced);f.fig.rotation.y+=f.yaw;
        const flicker=d>0?Math.max(0,1-d*3):1;
        f.mat.uniforms.uOpacity.value=ghostAlpha(i,time,reduced)*flicker;f.fig.visible=f.mat.uniforms.uOpacity.value>.005;
      });
      // Shards: orbit, gather into a spearhead, fly at the traveler.
      extra.gather=damp(extra.gather,state.gather,reduced?60:5,dt);
      const fly=strikeKind==='lunge'||strikeKind==='double'||strikeKind==='slam'||strikeKind==='sweep'?extra.strike:0;
      for(let i=0;i<SHARDS;i++){
        const s=fragSeeds[i],a=s.a+(reduced?0:time*s.speed*state.orbit),spread=1+rec*.6;
        orbitPos.set(Math.cos(a)*s.rad*spread,s.y+(reduced?0:Math.sin(time*.8+s.tilt)*.15)+(state.float-.28),Math.sin(a)*s.rad*.8*spread);
        // In flight the ring opens outward as it rushes forward, so the blades pass the frame's edges.
        formPos.copy(s.form);formPos.z+=state.fwd+fly*2.6;formPos.addScaledVector(s.out,fly*1.5);
        o.position.lerpVectors(orbitPos,formPos,extra.gather);
        if(d>0){const k=smooth(clamp01(d*1.6-i*.04));o.position.set(lerp(o.position.x,orbitPos.x*1.2,k),lerp(o.position.y,.03,k*k),lerp(o.position.z,orbitPos.z*1.2,k));}
        // Gathered shards point outward from the ring, tipped toward the traveler.
        const gathered=Math.max(extra.gather,d);
        if(gathered>.5&&d===0){o.rotation.set(.75+fly*.5,0,s.ring-Math.PI/2);}
        else o.rotation.set(lerp(s.tilt+(reduced?0:time*.6),Math.PI/2,d),a+s.tilt,s.tilt*.5);
        o.scale.setScalar(s.size*(gathered>.5&&d===0?.8:1));o.updateMatrix();frags.setMatrixAt(i,o.matrix);
      }
      frags.instanceMatrix.needsUpdate=true;
      // Defeat: the reflections burst into motes.
      if(this.defeated&&!reduced){
        extra.burstTime+=dt;const t=extra.burstTime;
        for(let i=0;i<BURST;i++){const b=burstSeed[i],g=ghosts[b.g].home;burstPos[i*3]=g.x+b.o.x+b.v.x*t;burstPos[i*3+1]=Math.max(.02,b.o.y+b.v.y*t-.6*t*t);burstPos[i*3+2]=g.z+b.o.z+b.v.z*t;}
        burstGeo.attributes.position.needsUpdate=true;burst.material.opacity=Math.max(0,1-t/1.8);
      }else burst.material.opacity=0;
    }
  };
}
