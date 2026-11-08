import * as T from 'three';
import {rand,damp,clamp01,canvasTexture,stoneTexture,createParticles,glowTexture,glowSprite} from './boss-kit.js';

// The Chamber of Form: a sunken tribunal of cracked stone under shafts of warm
// light, with falling dust and drifting golden scale-weights. A slam cracks
// the floor in a glowing ring. Original canvas and shader work only.
const shaftVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const shaftFragment=`uniform float uTime;uniform float uIntensity;uniform vec3 uColor;varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){float edge=pow(sin(vUv.x*3.14159),2.5);float fall=smoothstep(0.,.8,vUv.y)*(.35+.65*vUv.y);
  float motes=.7+.3*n(vec2(vUv.x*7.,vUv.y*4.+uTime*.12));gl_FragColor=vec4(uColor,edge*fall*motes*uIntensity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createTribunal(center,world){
  const group=new T.Group();group.name='Tribunal / the Chamber of Form';
  const env=world.gems[0].material.envMap,r=rand(23);
  // Sunken floor: concentric flagstones, radial joints and old cracks.
  const floorMap=canvasTexture((g,s)=>{
    const c=s/2;g.fillStyle='#2e2820';g.fillRect(0,0,s,s);
    for(let ring=0;ring<9;ring++){const r0=ring*s/17,r1=(ring+1)*s/17,count=6+ring*5;
      for(let k=0;k<count;k++){const a0=k/count*Math.PI*2,a1=(k+1)/count*Math.PI*2,v=Math.floor(r()*22);
        g.fillStyle=`rgb(${62+v},${54+v},${44+v})`;g.beginPath();g.arc(c,c,r1-2,a0+.006,a1-.006);g.arc(c,c,r0+2,a1-.006,a0+.006,true);g.closePath();g.fill();}}
    g.strokeStyle='#2a221a';g.lineWidth=1.5;
    for(let i=0;i<26;i++){let x=c+(r()-.5)*s*.8,y=c+(r()-.5)*s*.8;g.beginPath();g.moveTo(x,y);for(let k=0;k<7;k++){x+=(r()-.5)*60;y+=(r()-.5)*60;g.lineTo(x,y);}g.stroke();}
    g.strokeStyle='#c9a2564a';g.lineWidth=5;g.beginPath();g.arc(c,c,s*.27,0,Math.PI*2);g.stroke();
    g.lineWidth=2;for(let k=0;k<12;k++){const a=k/12*Math.PI*2;g.beginPath();g.moveTo(c+Math.cos(a)*s*.27,c+Math.sin(a)*s*.27);g.lineTo(c+Math.cos(a)*s*.31,c+Math.sin(a)*s*.31);g.stroke();}
  },1024);
  const floor=new T.Mesh(new T.CircleGeometry(7.6,72),new T.MeshStandardMaterial({map:floorMap,roughness:.86,metalness:.05,envMap:env,envMapIntensity:.25}));
  floor.rotation.x=-Math.PI/2;floor.position.set(center,0,-1);floor.receiveShadow=true;group.add(floor);
  // Stepped tiers rise around the back, like a gallery of silent judges.
  const tierMap=stoneTexture(9,'#7c6e5a',{cracks:18,repeat:[10,1]});
  const steps=[[7.6,0],[7.6,.5],[8.5,.5],[8.5,1],[9.4,1],[9.4,1.5],[10.3,1.5],[10.3,2],[11.4,2]].map(([x,y])=>new T.Vector2(x,y));
  const tiers=new T.Mesh(new T.LatheGeometry(steps,64,Math.PI*.36,Math.PI*1.28),new T.MeshStandardMaterial({map:tierMap,color:'#a49379',roughness:.92}));
  tiers.position.set(center,0,-1);tiers.receiveShadow=true;group.add(tiers);
  const brass=new T.MeshStandardMaterial({color:'#b78a3e',metalness:.9,roughness:.35,envMap:env});
  for(const [rad,y] of [[7.6,.5],[8.5,1],[9.4,1.5],[10.3,2]]){const lip=new T.Mesh(new T.TorusGeometry(rad,.03,5,90,Math.PI*1.28),brass);lip.rotation.set(Math.PI/2,0,Math.PI*.36-Math.PI/2+Math.PI);lip.position.set(center,y+.01,-1);group.add(lip);}
  // A curved back wall engraved with ledger lines and a vast balance glyph.
  const wallMap=canvasTexture((g,w,h)=>{
    g.fillStyle='#120d08';g.fillRect(0,0,w,h);
    for(let i=0;i<3000;i++){const v=r();g.fillStyle=`rgba(255,220,170,${v*.03})`;g.fillRect(r()*w,r()*h,2,2);}
    g.strokeStyle='#c99a4c22';g.lineWidth=1;for(let y=60;y<h;y+=26){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
    g.fillStyle='#e7c07a33';for(let y=70;y<h-20;y+=26)for(let x=10;x<w;x+=16+r()*40){if(r()<.55)g.fillRect(x,y,4+r()*10,6);}
    const cx=w/2,cy=h*.42;g.strokeStyle='#ffcf7a';g.shadowColor='#ffb347';g.shadowBlur=14;g.lineWidth=6;
    g.beginPath();g.moveTo(cx,cy-120);g.lineTo(cx,cy+170);g.moveTo(cx-230,cy-60);g.lineTo(cx+230,cy-60);g.stroke();
    for(const s of [-1,1]){g.beginPath();g.moveTo(cx+s*230,cy-60);g.lineTo(cx+s*290,cy+60);g.lineTo(cx+s*170,cy+60);g.closePath();g.stroke();g.beginPath();g.ellipse(cx+s*230,cy+64,70,14,0,0,Math.PI);g.stroke();}
    g.beginPath();g.moveTo(cx-60,cy+170);g.lineTo(cx+60,cy+170);g.stroke();g.beginPath();g.arc(cx,cy-128,10,0,Math.PI*2);g.stroke();
  },2048,1024);
  const wall=new T.Mesh(new T.CylinderGeometry(12.2,12.2,14,64,1,true,Math.PI*.62,Math.PI*.76),new T.MeshStandardMaterial({color:'#5a4a36',map:wallMap,emissive:'#ffffff',emissiveMap:wallMap,emissiveIntensity:.55,roughness:.95,side:T.BackSide}));
  wall.position.set(center,6,-1);group.add(wall);
  // Broken columns along the gallery.
  const colGeo=new T.CylinderGeometry(.42,.5,1,16),capGeo=new T.BoxGeometry(1.2,.32,1.2),stone=new T.MeshStandardMaterial({map:tierMap,color:'#b9a689',roughness:.9});
  const angles=[-1.15,-.72,-.32,.32,.72,1.15],columns=new T.InstancedMesh(colGeo,stone,angles.length),caps=new T.InstancedMesh(capGeo,stone,angles.length),o=new T.Object3D();
  angles.forEach((a,i)=>{const h=i===1||i===4?3.2+r():7.5,x=center+Math.sin(a)*10.7,z=-1-Math.cos(a)*10.7;
    o.position.set(x,2+h/2,z);o.rotation.set(0,0,i===1?.05:0);o.scale.set(1,h,1);o.updateMatrix();columns.setMatrixAt(i,o.matrix);
    o.position.set(x,2+h+.16,z);o.rotation.set(i===1||i===4?.3:0,a,i===4?-.25:0);o.scale.set(1,1,1);o.updateMatrix();caps.setMatrixAt(i,o.matrix);});
  group.add(columns,caps);
  // Shafts of warm light from an unseen oculus.
  const shaftMat=new T.ShaderMaterial({vertexShader:shaftVertex,fragmentShader:shaftFragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    uniforms:{uTime:{value:0},uIntensity:{value:.22},uColor:{value:new T.Color('#ffd08a')}}});
  for(const [x,z,w,tilt,yaw] of [[0,-1.4,2.6,.0,0],[-3.4,-3.2,1.5,.16,.4],[3.6,-3.6,1.7,-.18,-.5],[-1.6,-6.5,1.3,.1,.2],[2.2,-6.8,1.2,-.12,-.3]]){
    for(const k of [0,1]){const p=new T.Mesh(new T.PlaneGeometry(w,13),shaftMat);p.position.set(center+x,6.5,z);p.rotation.set(0,yaw+k*Math.PI/2,tilt);p.renderOrder=2;group.add(p);}
  }
  // Falling dust and drifting golden scale-weights.
  const dust=createParticles({count:300,min:[center-8,0,-10],max:[center+8,10,3.5],velocity:[0,-.14,0],wobble:.3,size:.04,color:'#f0cf9a',opacity:.75,twinkle:.35,seed:31});group.add(dust.points);
  const glints=createParticles({count:60,min:[center-4,.2,-5],max:[center+4,6,1.5],velocity:[0,.05,0],wobble:.4,size:.07,color:'#ffcf7a',opacity:.8,twinkle:.9,shape:'spark',seed:32});group.add(glints.points);
  // Weights drift only behind and beside the guardian, never between it and the camera.
  const WEIGHTS=26,weights=new T.InstancedMesh(new T.CylinderGeometry(.09,.13,.15,6),brass,WEIGHTS),weightSeeds=[];
  for(let i=0;i<WEIGHTS;i++){const a=(r()-.5)*2.6,rad=3.4+r()*5;weightSeeds.push({x:Math.sin(a)*rad,z:-2.4-Math.abs(Math.cos(a))*rad*.75,y:1.0+r()*5.2,phase:r()*6.28,speed:.3+r()*.5,scale:.55+r()*.8,fall:0});}
  weights.frustumCulled=false;group.add(weights);
  // The verdict ring: cracks that glow when the gavel falls.
  const crackMap=canvasTexture((g,s)=>{
    g.fillStyle='#000';g.fillRect(0,0,s,s);g.lineCap='round';const c=s/2;
    for(let i=0;i<18;i++){let a=i/18*Math.PI*2+r()*.25,x=c+Math.cos(a)*s*.05,y=c+Math.sin(a)*s*.05;g.beginPath();g.moveTo(x,y);
      for(let k=0;k<8;k++){a+=(r()-.5)*.8;const st=12+r()*20;x+=Math.cos(a)*st;y+=Math.sin(a)*st;g.lineTo(x,y);}g.strokeStyle='#ffb347';g.lineWidth=1.5+r()*2.5;g.shadowColor='#ff7a1a';g.shadowBlur=10;g.stroke();}
    g.shadowBlur=18;g.strokeStyle='#ffd27a';g.lineWidth=7;g.beginPath();g.arc(c,c,s*.36,0,Math.PI*2);g.stroke();
    g.lineWidth=2;g.beginPath();g.arc(c,c,s*.42,0,Math.PI*2);g.stroke();
    for(let k=0;k<24;k++){const a=k/24*Math.PI*2;g.beginPath();g.moveTo(c+Math.cos(a)*s*.36,c+Math.sin(a)*s*.36);g.lineTo(c+Math.cos(a)*s*.42,c+Math.sin(a)*s*.42);g.stroke();}
  },512);
  const crackMat=new T.MeshBasicMaterial({map:crackMap,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const crack=new T.Mesh(new T.CircleGeometry(2.6,48),crackMat);crack.rotation.x=-Math.PI/2;crack.position.set(center,.025,.7);group.add(crack);
  const shockMat=new T.MeshBasicMaterial({color:'#ffcf80',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const shock=new T.Mesh(new T.RingGeometry(.92,1,64),shockMat);shock.rotation.x=-Math.PI/2;shock.position.copy(crack.position).setY(.04);group.add(shock);
  const flash=glowSprite(glowTexture('#fff3d6','#ffb34788'),'#ffb347',4,0);flash.position.copy(crack.position).setY(.4);group.add(flash);
  // Lights: amber rim behind the guardian and a low warm fill.
  const rim=new T.PointLight('#ffb35a',70,15,1.6);rim.position.set(center,4.6,-5);group.add(rim);
  const fill=new T.PointLight('#ff9a4a',0,8,1.8);fill.position.set(center,.6,1.2);group.add(fill);
  let flare=0,scar=0,wasStrike=0,defeat=0;
  return {group,
    key:{color:'#ffd49a',intensity:140,position:[center-1.2,9.5,2.5],target:[center,1.8,-1.5]},
    atmosphere:{background:'#0d0805',fog:'#1a1209',density:.03},
    update(time,reduced,dt,fx={}){
      const t=reduced?4:time;shaftMat.uniforms.uTime.value=t;dust.update(time,reduced);glints.update(time,reduced);
      const slamming=fx.kind==='slam'||fx.kind==='double';
      if(fx.strike>.85&&wasStrike<=.85&&slamming){flare=1;scar=1;}wasStrike=fx.strike||0;
      flare=Math.max(0,flare-dt*1.6);scar=Math.max(0,scar-dt*.18);defeat=fx.defeated?Math.min(1,defeat+dt*.5):0;
      const warn=slamming&&!fx.strike?(reduced?.4:.28+.18*Math.sin(time*6)):0;
      crackMat.opacity=Math.min(1,Math.max(warn,scar*.55,flare)+(fx.kind==='recover'?.25:0));
      shockMat.opacity=reduced?0:flare*.9;shock.scale.setScalar(1+(1-flare)*3.2);
      flash.material.opacity=reduced?0:flare*.8;fill.intensity=flare*60+warn*10;
      shaftMat.uniforms.uIntensity.value=.2+defeat*.14;rim.intensity=70*(1-defeat*.4);
      for(let i=0;i<WEIGHTS;i++){
        const s=weightSeeds[i],a=reduced?s.phase:time*s.speed*.25+s.phase;
        s.fall=fx.defeated?Math.min(1,s.fall+dt*(.4+s.speed*.4)):0;
        const y=s.y+(reduced?0:Math.sin(time*s.speed+s.phase)*.25),fallen=.08;
        o.position.set(center+s.x+Math.sin(a)*.4,y+(fallen-y)*s.fall*s.fall,s.z+Math.cos(a)*.3);o.rotation.set(reduced?.3:Math.sin(a)*.6*(1-s.fall),reduced?s.phase:a*2,Math.cos(a)*.4*(1-s.fall));o.scale.setScalar(s.scale);o.updateMatrix();weights.setMatrixAt(i,o.matrix);
      }
      weights.instanceMatrix.needsUpdate=true;
    }
  };
}
