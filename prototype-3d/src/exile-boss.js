import * as T from 'three';

// The Nameless Exile: a towering hooded colossus. Original procedural geometry
// (no downloaded asset). Exposes the same small interface as createActor plus
// pose(), which encounters.js drives with telegraphs, strikes and recoils.
const rand=seed=>{let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};

function glowTexture(inner='#ffffff',outer='#ffffff00'){
  const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,inner);r.addColorStop(.25,inner+'cc');r.addColorStop(1,outer);g.fillStyle=r;g.fillRect(0,0,64,64);
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
function emberCracks(){
  const c=document.createElement('canvas');c.width=64;c.height=512;const g=c.getContext('2d'),r=rand(7);
  g.fillStyle='#000';g.fillRect(0,0,64,512);g.lineCap='round';
  for(let i=0;i<9;i++){
    let x=10+r()*44,y=r()*512;g.beginPath();g.moveTo(x,y);
    for(let k=0;k<7;k++){x=Math.min(60,Math.max(4,x+(r()-.5)*22));y+=12+r()*30;g.lineTo(x,y);}
    g.strokeStyle='#ff7a1a';g.lineWidth=1+r()*2.2;g.shadowColor='#ff3a00';g.shadowBlur=6;g.stroke();
  }
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
// Lathe cloth with a torn hem; wind is applied in the vertex shader.
function raggedLathe(profile,segments,seed,tear,{phiStart=0,phiLength=Math.PI*2}={}){
  const pts=new T.SplineCurve(profile.map(([r,y])=>new T.Vector2(r,y))).getPoints(28);
  const geo=new T.LatheGeometry(pts,segments,phiStart,phiLength),pos=geo.attributes.position,rows=pts.length,r=rand(seed);
  const tears=[];for(let s=0;s<=segments;s++)tears.push(s%2?r()*tear:r()*tear*.35);
  tears[segments]=tears[0];
  for(let s=0;s<=segments;s++)for(let k=Math.max(0,rows-5);k<rows;k++){
    const i=s*rows+k,w=(k-(rows-5))/4;pos.setY(i,pos.getY(i)+tears[s]*w*w);
  }
  geo.computeVertexNormals();return geo;
}
function windMaterial(params,uniforms,amount=.07,height=4.2){
  const m=new T.MeshStandardMaterial(params);
  m.onBeforeCompile=shader=>{
    shader.uniforms.uTime=uniforms.uTime;shader.uniforms.uGust=uniforms.uGust;
    shader.vertexShader='uniform float uTime;uniform float uGust;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float w=clamp(1.0-position.y/${height.toFixed(2)},0.0,1.0);w*=w;
      transformed.x+=sin(uTime*1.7+position.y*2.3+position.z*3.1)*${amount.toFixed(3)}*w*(1.0+uGust);
      transformed.z+=(cos(uTime*1.25+position.x*2.6)*${(amount*1.2).toFixed(3)}-uGust*.18)*w;`);
  };
  return m;
}

export function createExile(environment){
  const root=new T.Group();root.name='Character / The Nameless Exile (hooded colossus)';
  const body=new T.Group();root.add(body);
  const uniforms={uTime:{value:0},uGust:{value:0}};
  const cloth=windMaterial({color:'#0d0d11',roughness:1,side:T.DoubleSide},uniforms);
  const mantleCloth=windMaterial({color:'#17161b',roughness:.95,side:T.DoubleSide},uniforms,.05,4.4);
  const iron=new T.MeshStandardMaterial({color:'#1d1b1d',metalness:.75,roughness:.45,envMap:environment});
  const cracks=emberCracks();
  const bladeMat=new T.MeshStandardMaterial({color:'#2a2726',metalness:.85,roughness:.32,envMap:environment,emissive:'#ff5a14',emissiveMap:cracks,emissiveIntensity:1.6});
  const emberMat=new T.MeshBasicMaterial({color:'#ff6b21',toneMapped:false});
  const voidMat=new T.MeshBasicMaterial({color:'#000000',fog:false});

  // Robe, mantle and hood.
  const robe=new T.Mesh(raggedLathe([[.5,4.05],[1.0,3.86],[1.1,3.45],[.88,2.62],[.95,1.75],[1.18,.75],[1.38,.06]],72,11,.75),cloth);body.add(robe);
  const mantle=new T.Mesh(raggedLathe([[.55,4.18],[1.18,3.96],[1.45,3.55],[1.5,3.05],[1.48,2.75]],60,23,.6),mantleCloth);body.add(mantle);
  const hood=(()=>{
    const p=[],uv=[],idx=[],rows=26,cols=44;
    for(let r=0;r<=rows;r++)for(let c=0;c<=cols;c++){
      const v=r/rows,a=-2.55+c/cols*5.1,bulge=Math.sin(v*Math.PI*.88),fold=Math.sin(a*7+v*3)*.012;
      const rx=.04+bulge*.72+fold,rz=.08+bulge*.66,peak=(1-v)*(1-v)*.42;
      p.push(Math.sin(a)*rx,5.38-v*1.45,-Math.cos(a)*rz+peak+.05);uv.push(c/cols,v);
    }
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  })();
  const head=new T.Group();head.position.set(0,0,0);body.add(head);
  const hoodMesh=new T.Mesh(hood,windMaterial({color:'#0a0a0d',roughness:1,side:T.DoubleSide},uniforms,.025,6));head.add(hoodMesh);
  const voidFace=new T.Mesh(new T.SphereGeometry(.56,24,16),voidMat);voidFace.position.set(0,4.5,.12);voidFace.scale.set(1,1.15,.8);head.add(voidFace);
  // Burning slit eyes and their glow.
  const eyes=[],glows=[],glowMap=glowTexture('#ffb070');
  for(const side of [-1,1]){
    const eye=new T.Mesh(new T.SphereGeometry(.05,12,8),emberMat);eye.position.set(side*.17,4.52,.6);eye.scale.set(2.1,.62,1);eye.rotation.z=side*-.32;head.add(eye);eyes.push(eye);
    const glow=new T.Sprite(new T.SpriteMaterial({map:glowMap,color:'#ff5a14',transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false}));glow.position.set(side*.17,4.52,.66);glow.scale.setScalar(.3);head.add(glow);glows.push(glow);
  }
  // A broken iron crown floats over the hood: a king whose name was struck out.
  const crown=new T.Group();crown.position.set(0,5.22,.28);crown.rotation.x=-.18;head.add(crown);
  const band=new T.Mesh(new T.TorusGeometry(.5,.045,6,40),iron);band.rotation.x=Math.PI/2;crown.add(band);
  for(let i=0;i<9;i++){
    if(i===6)continue;const a=i/9*Math.PI*2,h=i%2?.28:.46;
    const spike=new T.Mesh(new T.ConeGeometry(.06,h,5),iron);spike.position.set(Math.cos(a)*.5,h/2,Math.sin(a)*.5);spike.rotation.z=Math.cos(a)*.12;spike.rotation.x=-Math.sin(a)*.12;crown.add(spike);
    const tip=new T.Mesh(new T.OctahedronGeometry(.028),emberMat);tip.position.set(Math.cos(a)*.5,h+.02,Math.sin(a)*.5);crown.add(tip);
  }
  // Belt and dragging chains.
  const belt=new T.Mesh(new T.TorusGeometry(1.13,.06,6,48),iron);belt.rotation.x=Math.PI/2;belt.position.y=2.55;belt.scale.set(1,1.02,1);body.add(belt);
  const chains=[];const link=new T.TorusGeometry(.07,.018,5,10);
  for(const [x,z] of [[-.9,.6],[.95,.5],[-.3,1.05]]){
    const chain=new T.Group();chain.position.set(x,2.5,z);body.add(chain);chains.push(chain);
    for(let i=0;i<10;i++){const l=new T.Mesh(link,iron);l.position.y=-i*.12;l.rotation.y=i%2?Math.PI/2:0;l.rotation.z=Math.PI/2;chain.add(l);}
  }
  // Arms pivot at the shoulders so sleeves, gauntlets and blade move together.
  const arms=new T.Group();arms.position.set(0,3.65,.15);body.add(arms);
  const sleeveMat=windMaterial({color:'#0f0f13',roughness:1,side:T.DoubleSide},uniforms,.03,3);
  for(const side of [-1,1]){
    const from=new T.Vector3(side*1.02,0,-.05),to=new T.Vector3(side*.2,-1.3,.95),len=from.distanceTo(to);
    const sleeve=new T.Mesh(new T.CylinderGeometry(.24,.42,len,16,3,true),sleeveMat);
    sleeve.position.copy(from).lerp(to,.5);sleeve.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),from.clone().sub(to).normalize());arms.add(sleeve);
    const hand=new T.Group();hand.position.copy(to);arms.add(hand);
    const fist=new T.Mesh(new T.SphereGeometry(.13,12,8),iron);fist.scale.set(1,.8,1.1);hand.add(fist);
    for(let f=0;f<4;f++){const claw=new T.Mesh(new T.ConeGeometry(.03,.2,5),iron);claw.position.set(-side*.12,.06-f*.06,.1);claw.rotation.z=side*Math.PI/2;hand.add(claw);}
  }
  // The broken greatsword, held point-down before it.
  const weapon=new T.Group();weapon.position.set(0,-1.28,1.0);arms.add(weapon);
  const shape=new T.Shape(),w=.2,L=2.9;
  shape.moveTo(-w,0);shape.lineTo(-w*.92,-L*.78);shape.lineTo(-w*.35,-L*.86);shape.lineTo(-w*.05,-L*.8);shape.lineTo(w*.3,-L*.97);shape.lineTo(w*.92,-L*.83);shape.lineTo(w,0);shape.closePath();
  const bladeGeo=new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.03,bevelThickness:.02,bevelSegments:1,steps:1});bladeGeo.translate(0,-.18,-.035);
  // Map UVs so the ember crack texture runs along the blade.
  {const p=bladeGeo.attributes.position,u=bladeGeo.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,(p.getX(i)+w)/(2*w),-(p.getY(i))/(L+.2));}
  const blade=new T.Mesh(bladeGeo,bladeMat);weapon.add(blade);
  const guard=new T.Mesh(new T.BoxGeometry(1.1,.12,.18),iron);guard.position.y=-.12;weapon.add(guard);
  for(const side of [-1,1]){const horn=new T.Mesh(new T.ConeGeometry(.06,.34,6),iron);horn.position.set(side*.6,-.03,0);horn.rotation.z=side*-1.1;weapon.add(horn);}
  const grip=new T.Mesh(new T.CylinderGeometry(.05,.05,.6,8),iron);grip.position.y=.2;weapon.add(grip);
  const pommel=new T.Mesh(new T.OctahedronGeometry(.1),emberMat);pommel.position.y=.56;weapon.add(pommel);
  // Embers shed from the cloak.
  const COUNT=90,emberPos=new Float32Array(COUNT*3),seeds=[],er=rand(91);
  for(let i=0;i<COUNT;i++){seeds.push([er()*Math.PI*2,er()*1.4+.4,er(),.4+er()*.9]);}
  const emberGeo=new T.BufferGeometry();emberGeo.setAttribute('position',new T.BufferAttribute(emberPos,3));
  const embers=new T.Points(emberGeo,new T.PointsMaterial({map:glowTexture('#ffd29a'),color:'#ff7a2a',size:.09,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));embers.frustumCulled=false;root.add(embers);

  root.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
  const SCALE=1.08;root.scale.setScalar(SCALE);
  const state={armsX:0,armsY:0,blade:0,lean:0,forward:0,eye:1,defeat:0,flare:0,recoil:0,strike:0,laugh:0,rage:0};
  const target={armsX:0,armsY:0,blade:0,lean:0,forward:0,eye:1};
  let telegraph=null,strikeKind=null;
  const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
  return {root,weapon,role:'exile',custom:true,home:new T.Vector3(),defeated:false,hitHeight:4.3*SCALE,
    react(){},
    reset(){this.defeated=false;Object.assign(state,{armsX:0,armsY:0,blade:0,lean:0,forward:0,eye:1,defeat:0,flare:0,recoil:0,strike:0,laugh:0,rage:0});telegraph=null;root.visible=true;root.scale.setScalar(SCALE);},
    win(){this.defeated=true;},
    enrage(value){state.rage=value?1:0;},
    laugh(){state.laugh=1;},
    // telegraph: next move; strike 0..1 while its blow lands; recoil 0..1 when hit.
    pose({telegraph:move=null,strike=0,recoil=0}={}){telegraph=move;state.strike=strike;state.recoil=Math.max(state.recoil*.5,recoil);strikeKind=move?.kind;},
    update(dt,reduced,time){
      if(!root.visible)return;
      uniforms.uTime.value=reduced?0:time;
      const k=telegraph?.kind;
      Object.assign(target,{armsX:0,armsY:0,blade:0,lean:0,forward:0,eye:1});
      // Raised poses keep the hands at chest height and tip the blade overhead,
      // so the hood and eyes stay visible.
      if(k==='windup'){target.armsX=-.42;target.armsY=-.5;target.blade=-2.75;target.lean=-.06;target.eye=1.3;}
      else if(k==='slam'||k==='double'){target.armsX=-.45;target.armsY=-.55;target.blade=-2.95;target.lean=-.1;target.eye=2.2;}
      else if(k==='sweep'){target.armsX=-.9;target.armsY=.95;target.blade=-1.1;target.eye=1.6;}
      else if(k==='lunge'){target.armsX=-.85;target.blade=-.95;target.forward=-.35;target.eye=1.8;}
      else if(k==='recover'){target.armsX=.3;target.lean=.17;target.eye=.35;}
      if(state.strike>0){
        const s=state.strike;
        if(strikeKind==='sweep'){target.armsY=.95-s*2.1;target.armsX=-.9+s*.2;target.blade=-1.1;}
        else if(strikeKind==='lunge'){target.armsX=-1.1;target.blade=-1.4;target.forward=s*1.4;}
        else{target.armsY=T.MathUtils.lerp(target.armsY,0,s);target.armsX=T.MathUtils.lerp(target.armsX,-.25,s);target.blade=T.MathUtils.lerp(target.blade,-1.35,s);target.forward=s*.7;target.lean=s*.16;}
        target.eye=2.4;
      }
      if(this.defeated){state.defeat=Math.min(1,state.defeat+(reduced?1:dt*.7));target.eye=0;target.armsX=.4;target.lean=.35;}
      const speed=state.strike>0?18:reduced?60:4.5;
      state.armsX=damp(state.armsX,target.armsX,speed,dt);state.blade=damp(state.blade,target.blade,speed,dt);state.armsY=damp(state.armsY,target.armsY,speed,dt);
      state.lean=damp(state.lean,target.lean,6,dt);state.forward=damp(state.forward,target.forward,state.strike>0?14:4,dt);
      state.eye=damp(state.eye,target.eye,8,dt);state.recoil=damp(state.recoil,0,5,dt);state.laugh=damp(state.laugh,0,1.6,dt);
      const breathe=reduced?0:Math.sin(time*1.1);
      root.position.copy(this.home);root.position.z+=state.forward-state.recoil*.45;
      root.position.y-=state.defeat*1.6;
      body.rotation.x=state.lean-state.recoil*.12+state.defeat*.25;
      body.rotation.y=reduced?0:Math.sin(time*.37)*.05;
      body.scale.set(1+breathe*.012,1+breathe*.018-state.defeat*.35,1+breathe*.012);
      arms.rotation.x=state.armsX+(reduced?0:breathe*.03);arms.rotation.y=state.armsY;weapon.rotation.x=state.blade;
      // The head watches the traveler, tilts curiously, and shakes when it laughs.
      head.rotation.z=(reduced?0:Math.sin(time*.53)*.06)+state.laugh*Math.sin(time*38)*.035;
      head.rotation.x=(reduced?0:Math.sin(time*.71)*.03)-state.recoil*.2+state.defeat*.3;
      crown.rotation.y=reduced?0:time*.25;
      uniforms.uGust.value=Math.max(state.strike,state.recoil*.8,state.rage*.4);
      const flicker=reduced?1:.85+Math.sin(time*13)*.08+Math.sin(time*7.3)*.07;
      const eye=Math.max(0,state.eye*flicker*(1+state.rage*.5));
      eyes.forEach(e=>{e.visible=eye>.05;e.scale.y=.62*Math.min(1.4,.6+eye*.4);});
      emberMat.color.setRGB(1,.42*Math.min(1.4,eye*.6+.3),.13);
      glows.forEach(g=>{g.material.opacity=Math.min(.85,eye*.35);g.scale.setScalar(.22+eye*.1);});
      bladeMat.emissiveIntensity=(1.1+eye*.7+state.rage)*(reduced?1:flicker);
      chains.forEach((c,i)=>{c.rotation.z=reduced?0:Math.sin(time*1.3+i)*.08;c.rotation.x=reduced?0:Math.cos(time*1.1+i)*.06+state.forward*.25;});
      for(let i=0;i<COUNT;i++){
        const [a,r,o,v]=seeds[i],life=((reduced?o:time*.18*v+o)%1);
        emberPos[i*3]=Math.cos(a+life*2)*r*(1+life*.5);emberPos[i*3+1]=.2+life*(5.2+state.defeat*3);emberPos[i*3+2]=Math.sin(a+life*2)*r*(1+life*.5)*.6;
      }
      emberGeo.attributes.position.needsUpdate=true;embers.material.opacity=.9-state.defeat*.3;
    }
  };
}
