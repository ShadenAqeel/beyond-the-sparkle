import * as T from 'three';
import {rand,damp,clamp01,smooth,lerp,glowTexture,glowSprite,stoneTexture,canvasTexture,createParticles} from './boss-kit.js';

// The Hollow Scale: a floating executioner of stone slabs and brass plates with
// nothing inside but a burning weight. A great balance hangs from its back and
// it carries a stone gavel. Original procedural geometry; same interface as the
// Exile (root, weapon, home, pose, update, reset, win, enrage, laugh).
const POSES={
  idle:   {a:-.12, w:-.38, ay:0,    lean:0,   fwd:0,   eye:1,   spread:0,   tilt:0,   head:0},
  // Raised blows cock the gavel back over the shoulder so it stays below the HUD and clear of the mask.
  windup: {a:-1.15,w:-2.85,ay:.95,  lean:-.1, fwd:-.15,eye:1.6, spread:.06, tilt:.28, head:-.06},
  slam:   {a:-1.3, w:-2.75,ay:1.05, lean:-.17,fwd:-.25,eye:2.3, spread:.12, tilt:.42, head:-.1},
  double: {a:-1.3, w:-2.75,ay:1.05, lean:-.17,fwd:-.25,eye:2.3, spread:.12, tilt:.42, head:-.1},
  sweep:  {a:-.8,  w:-.85, ay:1.2,  lean:0,   fwd:0,   eye:1.6, spread:.04, tilt:-.3, head:.05},
  lunge:  {a:-1.25,w:-.3,  ay:0,    lean:-.08,fwd:-.35,eye:1.8, spread:.04, tilt:0,   head:0},
  feint:  {a:-1.1, w:-1.0, ay:.3,   lean:-.05,fwd:0,   eye:1.3, spread:.03, tilt:.12, head:0},
  recover:{a:-.3,  w:-.5,  ay:0,    lean:.26, fwd:.3,  eye:.28, spread:.34, tilt:-.32,head:.3},
};
const STRIKES={
  slam:{a:-.4,w:-.6,ay:0,lean:.26,fwd:.5,spread:.18},double:{a:-.4,w:-.6,ay:0,lean:.26,fwd:.5,spread:.18},
  windup:{a:-.4,w:-.6,ay:0,lean:.26,fwd:.5},sweep:{ay:-1.2,fwd:.45,a:-.85},lunge:{a:-1.4,w:-.18,fwd:1.5,lean:.1},
};
const KEYS=Object.keys(POSES.idle);

export function createHollowScale(environment){
  const root=new T.Group();root.name='Character / The Hollow Scale (floating executioner)';
  const body=new T.Group();root.add(body);
  const rnd=rand(41);
  const stoneMap=stoneTexture(5,'#9a917f',{cracks:14});
  const stone=new T.MeshStandardMaterial({color:'#6f675c',map:stoneMap,bumpMap:stoneMap,bumpScale:.025,roughness:.9,envMap:environment,envMapIntensity:.3});
  const pale=new T.MeshStandardMaterial({color:'#e8dcc2',map:stoneMap,roughness:.6,envMap:environment,envMapIntensity:.6});
  const brass=new T.MeshStandardMaterial({color:'#d9a548',metalness:.95,roughness:.26,envMap:environment,envMapIntensity:1.4});
  const bronze=new T.MeshStandardMaterial({color:'#5e4020',metalness:.85,roughness:.45,envMap:environment,side:T.DoubleSide});
  const ember=new T.MeshBasicMaterial({color:'#ffb347',toneMapped:false});
  const voidMat=new T.MeshBasicMaterial({color:'#060403'});
  const glowMap=glowTexture('#fff1c8','#ffb34799');
  const pieces=[];
  // Every floating plate is a "piece": it bobs, spreads apart when struck and
  // falls to the floor on defeat.
  function piece(mesh,parent,{parentY=0,bob=.025,dir=null,spread=1}={}){
    parent.add(mesh);mesh.castShadow=false;
    const base=mesh.position.clone(),d=dir?dir.clone():new T.Vector3(base.x,0,base.z);if(d.lengthSq()<1e-4)d.set(0,0,1);d.normalize();
    const flat=rnd()<.5?Math.PI/2:-Math.PI/2;
    pieces.push({mesh,base,rot:mesh.rotation.clone(),dir:d,spread,bob,phase:rnd()*6.28,delay:rnd()*.4,
      fallPos:new T.Vector3(base.x*1.1+d.x*(.5+rnd()*1.1),.1+rnd()*.12-parentY,base.z*1.1+d.z*(.5+rnd()*1.1)),
      fallRot:new T.Euler(flat+(rnd()-.5)*.4,rnd()*3,(rnd()-.5)*.5)});
    return mesh;
  }
  function slab(w,h,d,bevel=.025){
    const s=new T.Shape(),c=Math.min(w,h)*.16;
    s.moveTo(-w/2+c,-h/2);s.lineTo(w/2-c,-h/2);s.lineTo(w/2,-h/2+c);s.lineTo(w/2,h/2-c);s.lineTo(w/2-c,h/2);s.lineTo(-w/2+c,h/2);s.lineTo(-w/2,h/2-c);s.lineTo(-w/2,-h/2+c);s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});g.translate(0,0,-d/2);return g;
  }

  // Hood: a pointed executioner's hood of bronze plates around a pale stone mask.
  const head=new T.Group();head.position.y=3.05;body.add(head);
  for(let i=0;i<5;i++){
    const theta=(i+1)*Math.PI/3,plate=new T.Mesh(new T.ConeGeometry(.46,1.15,8,1,true,theta-.44,.88),bronze);
    plate.position.y=.5;plate.rotation.x=-.08;piece(plate,head,{parentY:3.05,dir:new T.Vector3(Math.sin(theta),0,Math.cos(theta)),bob:.015});
  }
  const hoodVoid=new T.Mesh(new T.SphereGeometry(.34,16,12),voidMat);hoodVoid.position.set(0,.3,0);hoodVoid.scale.set(1,1.3,1);head.add(hoodVoid);
  const maskShape=new T.Shape();maskShape.moveTo(-.27,-.36);maskShape.lineTo(-.31,.12);maskShape.quadraticCurveTo(-.27,.5,0,.66);maskShape.quadraticCurveTo(.27,.5,.31,.12);maskShape.lineTo(.27,-.36);maskShape.quadraticCurveTo(0,-.46,-.27,-.36);
  for(const side of [-1,1]){const eye=new T.Path();const x=side*.12;eye.moveTo(x-.075,.1+side*.0);eye.lineTo(x+.075,.1);eye.lineTo(x+side*.06,.055);eye.lineTo(x-side*.05,.06);eye.closePath();maskShape.holes.push(eye);}
  const mask=new T.Mesh(new T.ExtrudeGeometry(maskShape,{depth:.05,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:2,steps:1}),pale);
  mask.position.set(0,.25,.3);mask.rotation.x=-.06;piece(mask,head,{parentY:3.05,dir:new T.Vector3(0,0,1),bob:.01});
  const brow=new T.Mesh(new T.BoxGeometry(.5,.035,.05),brass);brow.position.set(0,.43,.36);piece(brow,head,{parentY:3.05,dir:new T.Vector3(0,.3,1),bob:.012});
  const eyes=[];for(const side of [-1,1]){
    const e=new T.Mesh(new T.PlaneGeometry(.15,.05),ember);e.position.set(side*.12,.335,.285);head.add(e);
    const g=glowSprite(glowMap,'#ffae3c',.42,.8);g.position.set(side*.12,.34,.42);head.add(g);eyes.push(g);
  }

  // Collar of floating stones, shoulders and a hollow brass ribcage.
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2,b=new T.Mesh(new T.BoxGeometry(.2,.14,.16),stone);b.position.set(Math.sin(a)*.42,2.98,Math.cos(a)*.34);b.rotation.y=a;piece(b,body,{bob:.02});}
  for(const side of [-1,1]){
    const p1=new T.Mesh(slab(.82,.62,.18),stone);p1.position.set(side*.82,3.0,-.02);p1.rotation.set(-Math.PI/2+.12,0,side*-.42);piece(p1,body,{bob:.03});
    const p2=new T.Mesh(slab(.66,.5,.14),stone);p2.position.set(side*1.0,2.74,0);p2.rotation.set(-Math.PI/2+.2,0,side*-.85);piece(p2,body,{bob:.035});
    const trim=new T.Mesh(new T.BoxGeometry(.8,.05,.07),brass);trim.position.set(side*.84,3.13,.29);trim.rotation.z=side*-.42;piece(trim,body,{bob:.03});
  }
  const ribs=[[2.86,.6],[2.62,.58],[2.38,.52],[2.14,.45],[1.92,.38]];
  // Each rib is open at the front so the empty chest and its burning weight show.
  for(const [y,r] of ribs){const g=new T.TorusGeometry(r,.045,6,28,Math.PI*1.5);g.rotateZ(Math.PI*.75);g.rotateX(Math.PI/2);g.scale(1,1,.78);const rib=new T.Mesh(g,brass);rib.position.y=y;piece(rib,body,{dir:new T.Vector3(0,0,-1),bob:.012,spread:.6});}
  for(let i=0;i<6;i++){const v=new T.Mesh(new T.BoxGeometry(.14,.13,.12),stone);v.position.set(0,1.85+i*.21,-.44);piece(v,body,{dir:new T.Vector3(0,0,-1),bob:.01});}
  // The heart: a burning weight inside the empty chest.
  const heart=new T.Group();heart.position.set(0,2.4,0);body.add(heart);
  const weight=new T.Mesh(new T.CylinderGeometry(.09,.15,.22,6),brass);heart.add(weight);
  const core=new T.Mesh(new T.OctahedronGeometry(.1),ember);core.position.y=.02;heart.add(core);
  const heartGlow=glowSprite(glowMap,'#ffa23a',1.3,.75);heart.add(heartGlow);
  const heartLight=new T.PointLight('#ffa040',6,3.4,2);heart.add(heartLight);
  const motes=createParticles({count:46,min:[-.4,1.6,-.35],max:[.4,3.3,.3],velocity:[0,.28,0],wobble:.06,size:.05,color:'#ffc46a',twinkle:.5,seed:7});body.add(motes.points);
  // A robe of hanging stone slabs, flaring to the floor.
  const belt=new T.Mesh(new T.TorusGeometry(.48,.05,6,32),brass);belt.rotation.x=Math.PI/2;belt.position.y=1.74;piece(belt,body,{bob:.01,spread:.3});
  // Long, uneven slabs with gaps between them: the robe is visibly empty.
  for(let i=0;i<15;i++){
    const a=(i/15)*Math.PI*2+.1,front=Math.cos(a)>.8,len=(front?1.0:1.25)+((i*7)%4)*.07,tilt=-.3;
    const s=new T.Mesh(slab(.21,len,.07,.015),i%4===1?pale:stone);s.position.set(Math.sin(a)*(.6+len*.12),1.68-len/2,Math.cos(a)*(.55+len*.12));s.rotation.set(tilt,a,0,'YXZ');piece(s,body,{bob:.035});
    const tip=new T.Mesh(new T.BoxGeometry(.22,.05,.09),brass);tip.position.set(Math.sin(a)*(.6+len*.27),1.7-len,Math.cos(a)*(.55+len*.27));tip.rotation.set(tilt,a,0,'YXZ');piece(tip,body,{bob:.035});
  }

  // Arms: floating bracers and stone gauntlets, both hands on the gavel.
  const arms=new T.Group();arms.position.y=2.85;body.add(arms);
  const hand=new T.Vector3(0,-.75,.9);
  for(const side of [-1,1]){
    const from=new T.Vector3(side*.82,0,0),to=new T.Vector3(side*.16,-.72,.84),dir=to.clone().sub(from).normalize(),up=new T.Vector3(0,1,0);
    const orient=m=>m.quaternion.setFromUnitVectors(up,dir.clone().negate());
    const ring=new T.Mesh(new T.TorusGeometry(.16,.04,6,18),brass);ring.position.copy(from).lerp(to,.3);ring.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),dir);piece(ring,arms,{parentY:2.85,bob:.02});
    const fore=new T.Mesh(slab(.24,.42,.2,.02),stone);fore.position.copy(from).lerp(to,.62);orient(fore);piece(fore,arms,{parentY:2.85,bob:.02});
    const fist=new T.Mesh(slab(.3,.3,.26,.04),stone);fist.position.copy(to);orient(fist);piece(fist,arms,{parentY:2.85,bob:.01,spread:.3});
    const knuckle=new T.Mesh(new T.BoxGeometry(.3,.07,.08),brass);knuckle.position.copy(to).add(new T.Vector3(0,-.02,.15));piece(knuckle,arms,{parentY:2.85,bob:.01,spread:.3});
  }
  // The gavel. Grip at the hands; haft points down to the stone head.
  const weapon=new T.Group();weapon.position.copy(hand);arms.add(weapon);
  const haft=new T.Mesh(new T.CylinderGeometry(.06,.07,2.0,10),bronze);haft.position.y=-.72;weapon.add(haft);
  for(const y of [.22,-.2,-1.0,-1.55]){const band=new T.Mesh(new T.CylinderGeometry(.085,.085,.07,10),brass);band.position.y=y;weapon.add(band);}
  const pommel=new T.Mesh(new T.OctahedronGeometry(.12),brass);pommel.position.y=.36;weapon.add(pommel);
  const gavelHead=new T.Group();gavelHead.position.y=-1.84;weapon.add(gavelHead);
  const block=new T.Mesh(new T.CylinderGeometry(.37,.37,1.2,18),stone);block.rotation.z=Math.PI/2;gavelHead.add(block);
  for(const x of [-.6,.6]){const cap=new T.Mesh(new T.CylinderGeometry(.41,.41,.1,18),brass);cap.rotation.z=Math.PI/2;cap.position.x=x;gavelHead.add(cap);
    const face=new T.Mesh(new T.CircleGeometry(.24,18),ember);face.position.x=x*1.09;face.rotation.y=x>0?Math.PI/2:-Math.PI/2;gavelHead.add(face);}
  const seal=new T.Mesh(new T.TorusGeometry(.385,.022,6,32),ember);seal.rotation.y=Math.PI/2;gavelHead.add(seal);
  const sealGlow=glowSprite(glowMap,'#ff9a2a',.0,0);gavelHead.add(sealGlow);

  // The balance on its back: a beam that tips and two pans that swing.
  const balance=new T.Group();balance.position.set(0,0,-.58);body.add(balance);
  const post=new T.Mesh(new T.CylinderGeometry(.05,.07,2.0,8),brass);post.position.y=3.42;balance.add(post);
  const finial=new T.Mesh(new T.ConeGeometry(.08,.3,6),brass);finial.position.y=4.62;balance.add(finial);
  const beam=new T.Group();beam.position.y=4.38;balance.add(beam);
  const bar=new T.Mesh(new T.CylinderGeometry(.045,.045,2.7,8),brass);bar.rotation.z=Math.PI/2;beam.add(bar);
  const needle=new T.Mesh(new T.ConeGeometry(.04,.36,5),brass);needle.position.y=-.2;needle.rotation.z=Math.PI;beam.add(needle);
  const pans=[];
  for(const side of [-1,1]){
    const end=new T.Mesh(new T.SphereGeometry(.07,10,8),brass);end.position.x=side*1.36;beam.add(end);
    const pivot=new T.Group();pivot.position.x=side*1.3;beam.add(pivot);
    for(let k=0;k<3;k++){const a=k/3*Math.PI*2,c=new T.Mesh(new T.CylinderGeometry(.008,.008,1.08,4),brass);c.position.set(Math.cos(a)*.15,-.54,Math.sin(a)*.15);c.rotation.set(Math.sin(a)*.14,0,-Math.cos(a)*.14);pivot.add(c);}
    const pan=new T.Mesh(new T.SphereGeometry(.38,20,8,0,Math.PI*2,Math.PI*.62,Math.PI*.38),bronze);pan.position.y=-.82;pivot.add(pan);
    const rim=new T.Mesh(new T.TorusGeometry(.33,.02,5,24),brass);rim.rotation.x=Math.PI/2;rim.position.y=-1.08;pivot.add(rim);
    if(side<0)for(let k=0;k<3;k++){const w=new T.Mesh(new T.CylinderGeometry(.08-k*.015,.1-k*.015,.1,6),brass);w.position.set((k-1)*.04,-1.1+k*.1,0);pivot.add(w);}
    else{const shard=new T.Mesh(new T.OctahedronGeometry(.09),ember);shard.scale.y=1.6;shard.position.y=-1.0;pivot.add(shard);const g=glowSprite(glowMap,'#ffcf80',.5,.7);g.position.y=-1.0;pivot.add(g);}
    pans.push({pivot,x:0,vx:0,z:0,vz:0});
  }
  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});

  const SCALE=1.04;root.scale.setScalar(SCALE);
  const state={...POSES.idle,defeat:0,recoil:0,strike:0,laugh:0,rage:0,float:.14};
  let telegraph=null,strikeKind=null,prevFwd=0,prevVel=0,prevAy=0,prevAyVel=0,lastRecoil=0;
  const tmp=new T.Vector3();
  function settlePans(){pans.forEach(p=>{p.x=p.vx=p.z=p.vz=0;});}
  return {root,weapon,role:'form',custom:true,keepOnReward:true,home:new T.Vector3(),defeated:false,hitHeight:2.55*SCALE,hitDepth:.9,contactScale:2,
    react(){},
    reset(){this.defeated=false;Object.assign(state,POSES.idle,{defeat:0,recoil:0,strike:0,laugh:0,rage:0,float:.14});telegraph=null;strikeKind=null;root.visible=true;root.scale.setScalar(SCALE);settlePans();weapon.position.copy(hand);},
    win(){this.defeated=true;},
    enrage(value){state.rage=value?1:0;},
    laugh(){state.laugh=1;pans.forEach((p,i)=>{p.vz+=i?2.6:-2.6;p.vx+=1.2;});},
    pose({telegraph:move=null,strike=0,recoil=0}={}){telegraph=move;state.strike=strike;state.recoil=Math.max(state.recoil*.5,recoil);strikeKind=move?.kind;},
    update(dt,reduced,time){
      if(!root.visible||dt<=0)return;
      const kind=telegraph?.kind,target={...(POSES[kind]||POSES.idle)};
      if(state.strike>0&&STRIKES[strikeKind]){const s=state.strike,blow=STRIKES[strikeKind];for(const k in blow)target[k]=lerp(target[k],blow[k],s);target.eye=2.6;}
      if(!kind&&!reduced){const tap=Math.pow(Math.max(0,Math.sin(time*.8)),14);target.a-=tap*.16;target.w+=tap*.12;}
      if(this.defeated){Object.assign(target,{a:0,w:-1.55,ay:0,lean:0,fwd:0,eye:0,spread:0,tilt:.85,head:0});state.defeat=Math.min(1,state.defeat+(reduced?1:dt*.75));}
      const speed=state.strike>0?18:reduced?60:4.2;
      for(const k of KEYS)state[k]=damp(state[k],target[k],k==='eye'?7:k==='spread'?6:speed,dt);
      state.recoil=damp(state.recoil,0,5,dt);state.laugh=damp(state.laugh,0,1.4,dt);
      const d=state.defeat,breathe=reduced?0:Math.sin(time*1.05);
      // Body: hovers, leans into blows, recoils from hits.
      state.float=damp(state.float,this.defeated?0:.14,3,dt);
      root.position.copy(this.home);root.position.z+=state.fwd-state.recoil*.4;
      body.position.y=state.float+(reduced||this.defeated?0:Math.sin(time*.9)*.05);
      body.rotation.x=state.lean-state.recoil*.16;body.rotation.y=state.ay*.22+(reduced?0:Math.sin(time*.31)*.04);
      arms.rotation.x=state.a+(reduced?0:breathe*.025);arms.rotation.y=state.ay;weapon.rotation.x=state.w;weapon.rotation.z=d*.35;weapon.position.y=hand.y-d*1.82;
      // The hood weighs the traveler: a slow judging tilt, a shake when it laughs.
      head.rotation.z=reduced?0:(kind?0:Math.sin(time*.45)*.09)+state.laugh*Math.sin(time*30)*.05;
      head.rotation.x=state.head-state.recoil*.25-state.laugh*.18;
      // Plates loosen when struck or exhausted, then fall on defeat.
      const spread=Math.min(.6,state.spread+state.recoil*.45);
      for(const p of pieces){
        const k=d>0?smooth(clamp01(d*1.7-p.delay)):0,bob=reduced?0:Math.sin(time*1.35+p.phase)*p.bob;
        tmp.copy(p.base).addScaledVector(p.dir,spread*.5*p.spread);tmp.y+=bob;
        if(k>0){tmp.x=lerp(tmp.x,p.fallPos.x,k);tmp.z=lerp(tmp.z,p.fallPos.z,k);tmp.y=lerp(tmp.y,p.fallPos.y,k*k);}
        p.mesh.position.copy(tmp);
        p.mesh.rotation.set(lerp(p.rot.x,p.fallRot.x,k),lerp(p.rot.y,p.fallRot.y,k),lerp(p.rot.z,p.fallRot.z,k));
      }
      // Eyes and heart.
      const pulse=reduced?1:.9+.1*Math.pow(Math.max(0,Math.sin(time*2.4)),8)+.08*Math.pow(Math.max(0,Math.sin(time*2.4-.5)),8);
      const eye=Math.max(0,state.eye*(1+state.rage*.4)+state.recoil*1.2)*(1-d);
      ember.color.setRGB(1,.62+Math.min(.3,eye*.08),.25).multiplyScalar(Math.min(1.6,.35+eye*.5));
      eyes.forEach(g=>{g.material.opacity=Math.min(1,eye*.42);g.scale.setScalar(.28+eye*.12);});
      heartGlow.material.opacity=(.45+eye*.22)*pulse;heartGlow.scale.setScalar((1+state.recoil*.8)*pulse*1.2);heartLight.intensity=(3+eye*3)*pulse;
      heart.rotation.y=reduced?.4:time*.6;heart.position.y=2.4-d*2.1;
      const blow=strikeKind==='slam'||strikeKind==='double'||strikeKind==='windup'?state.strike:0;
      sealGlow.material.opacity=Math.min(1,blow*1.4+(kind==='slam'||kind==='double'?.35:0))*(1-d);sealGlow.scale.setScalar(.9+blow*1.6);
      // The balance tips with each verdict; its pans swing with the body.
      beam.rotation.z=state.tilt+(reduced||this.defeated?0:Math.sin(time*.4)*.07);
      balance.position.y=-d*2.6;balance.rotation.x=-d*.5;
      if(reduced){settlePans();}
      else{
        const vel=(state.fwd-prevFwd)/dt,acc=T.MathUtils.clamp((vel-prevVel)/dt,-40,40);prevFwd=state.fwd;prevVel=vel;
        const ayVel=(state.ay-prevAy)/dt,ayAcc=T.MathUtils.clamp((ayVel-prevAyVel)/dt,-40,40);prevAy=state.ay;prevAyVel=ayVel;
        if(state.recoil>lastRecoil+.2){pans.forEach(p=>{p.vx-=3.2;});}lastRecoil=state.recoil;
        pans.forEach((p,i)=>{
          p.vx+=(-9*p.x-1.1*p.vx-acc*.5)*dt;p.x+=p.vx*dt;
          p.vz+=(-9*p.z-1.1*p.vz+ayAcc*.25*(i?1:-1)*.5)*dt;p.z+=p.vz*dt;
          p.x=T.MathUtils.clamp(p.x,-1,1);p.z=T.MathUtils.clamp(p.z,-1,1);
        });
      }
      pans.forEach(p=>{p.pivot.rotation.x=p.x;p.pivot.rotation.z=-beam.rotation.z+p.z;});
      motes.update(time,reduced);motes.material.uniforms.uOpacity.value=1-d;
    }
  };
}
