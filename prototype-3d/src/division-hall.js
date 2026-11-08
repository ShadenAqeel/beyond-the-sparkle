import * as T from 'three';
import {rand,damp,canvasTexture,createParticles,windMaterial} from './boss-kit.js';

// The Hall of Division: one hall split down the middle by a line of light.
// The left half is frost-blue with falling snow, the right half dim red with
// rising sparks. Coordinated ("double") blows make the line flare.
const bandVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const bandFragment=`uniform float uGlow;uniform float uTime;varying vec2 vUv;
void main(){float x=abs(vUv.x-.5)*2.;float core=exp(-x*x*90.);float halo=exp(-x*x*6.)*.35;
  float shimmer=.85+.15*sin(vUv.y*40.-uTime*3.);float fade=smoothstep(0.,.08,vUv.y)*smoothstep(1.,.55,vUv.y);
  vec3 col=mix(vec3(.75,.88,1.),vec3(1.,.8,.7),step(.5,vUv.x));col=mix(col,vec3(1.,.97,.9),core);
  gl_FragColor=vec4(col,(core+halo)*fade*shimmer*uGlow);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createDivisionHall(center,world){
  const group=new T.Group();group.name='Hall of Division / frost and ember';
  const env=world.gems[0].material.envMap,r=rand(57);
  const frostMap=canvasTexture((g,w,h)=>{
    g.fillStyle='#8da3b5';g.fillRect(0,0,w,h);
    for(let ty=0;ty<8;ty++)for(let tx=0;tx<4;tx++){const v=Math.floor(r()*24);g.fillStyle=`rgb(${126+v},${150+v},${170+v})`;g.fillRect(tx*w/4+3,ty*h/8+3,w/4-6,h/8-6);}
    g.strokeStyle='#ffffffaa';g.lineCap='round';
    for(let i=0;i<70;i++){const x=r()*w,y=r()*h,arms=5+Math.floor(r()*3),len=6+r()*22;g.lineWidth=.8+r();for(let k=0;k<arms;k++){const a=k/arms*Math.PI*2+r();g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);g.stroke();}}
    const fade=g.createLinearGradient(w,0,0,0);fade.addColorStop(0,'#ffffff40');fade.addColorStop(.2,'#ffffff00');g.fillStyle=fade;g.fillRect(0,0,w,h);
  },512,1024);
  const emberBase=canvasTexture((g,w,h)=>{g.fillStyle='#3a1d19';g.fillRect(0,0,w,h);
    for(let ty=0;ty<8;ty++)for(let tx=0;tx<4;tx++){const v=Math.floor(r()*14);g.fillStyle=`rgb(${52+v},${28+v/2},${24+v/2})`;g.fillRect(tx*w/4+3,ty*h/8+3,w/4-6,h/8-6);}},512,1024);
  const emberGlow=canvasTexture((g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.lineCap='round';
    for(let i=0;i<34;i++){let x=r()*w,y=r()*h;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*50;y+=(r()-.5)*50;g.lineTo(x,y);}g.strokeStyle='#ff5a1e';g.lineWidth=1+r()*2;g.shadowColor='#ff2a00';g.shadowBlur=8;g.stroke();}},512,1024);
  const frostFloor=new T.Mesh(new T.PlaneGeometry(8,17),new T.MeshStandardMaterial({map:frostMap,color:'#6c7f90',roughness:.3,metalness:.2,envMap:env,envMapIntensity:.35}));
  const emberFloor=new T.Mesh(new T.PlaneGeometry(8,17),new T.MeshStandardMaterial({map:emberBase,emissive:'#ff6a2a',emissiveMap:emberGlow,emissiveIntensity:.55,roughness:.8,envMap:env,envMapIntensity:.25}));
  for(const [mesh,x] of [[frostFloor,-4],[emberFloor,4]]){mesh.rotation.x=-Math.PI/2;mesh.position.set(center+x,0,-2);mesh.receiveShadow=true;group.add(mesh);}
  // The dividing line: a seam of light along the floor and up the far wall.
  const seamMat=new T.MeshBasicMaterial({color:'#fff6e6',toneMapped:false});
  const seam=new T.Mesh(new T.PlaneGeometry(.07,17),seamMat);seam.rotation.x=-Math.PI/2;seam.position.set(center,.012,-2);group.add(seam);
  const band=()=>new T.ShaderMaterial({vertexShader:bandVertex,fragmentShader:bandFragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uGlow:{value:1},uTime:{value:0}}});
  const floorBand=band();const floorGlow=new T.Mesh(new T.PlaneGeometry(1.4,17),floorBand);floorGlow.rotation.x=-Math.PI/2;floorGlow.position.set(center,.02,-2);group.add(floorGlow);
  const wallBand=band();const wallGlow=new T.Mesh(new T.PlaneGeometry(2.4,13),wallBand);wallGlow.position.set(center,6.3,-10.3);group.add(wallGlow);
  const pillarBand=band();const pillar=new T.Mesh(new T.PlaneGeometry(1.1,12),pillarBand);pillar.position.set(center,5.8,-6.5);group.add(pillar);
  // Split walls with banners.
  const wallMat=(color,emissive)=>new T.MeshStandardMaterial({color,roughness:.85,emissive,emissiveIntensity:.25});
  const iceStone=wallMat('#3c4c5a','#10263a'),fireStone=wallMat('#3a2220','#3a0e08');
  for(const [mat,s] of [[iceStone,-1],[fireStone,1]]){
    const back=new T.Mesh(new T.PlaneGeometry(8.2,13),mat);back.position.set(center+s*4.1,6.3,-10.5);group.add(back);
    const side=new T.Mesh(new T.PlaneGeometry(17,13),mat);side.rotation.y=-s*Math.PI/2;side.position.set(center+s*8.2,6.3,-2);group.add(side);
  }
  const uniforms={uTime:{value:0},uGust:{value:0}};
  const bannerTex=(fill,mark,flip)=>canvasTexture((g,w,h)=>{g.fillStyle=fill;g.fillRect(0,0,w,h);g.fillStyle='#00000033';g.fillRect(0,0,w,14);g.fillStyle=mark;g.beginPath();g.arc(w/2,h*.33,w*.28,flip?Math.PI/2:-Math.PI/2,flip?Math.PI*1.5:Math.PI/2);g.fill();g.strokeStyle=mark;g.lineWidth=5;g.beginPath();g.arc(w/2,h*.33,w*.3,0,Math.PI*2);g.stroke();
    g.beginPath();g.moveTo(0,h*.86);g.lineTo(w/2,h);g.lineTo(w,h*.86);g.lineTo(w,h);g.lineTo(0,h);g.closePath();g.globalCompositeOperation='destination-out';g.fill();},128,384);
  const bannerGeo=new T.PlaneGeometry(1.2,4.2,4,12);bannerGeo.translate(0,2.1,0);
  for(const [s,fill,mark] of [[-1,'#244e72','#d7ecff'],[1,'#6d1b17','#ffd4c4']]){
    const mat=windMaterial({map:bannerTex(fill,mark,s>0),transparent:true,alphaTest:.5,side:T.DoubleSide,roughness:.9},uniforms,{amount:.08,height:4.2});
    for(const x of [2.2,5.6]){const b=new T.Mesh(bannerGeo,mat);b.position.set(center+s*x,3.4,-10.35);group.add(b);}
  }
  // Columns: frosted with icicles on the left, scorched on the right.
  const colGeo=new T.CylinderGeometry(.38,.44,9,14),icicleGeo=new T.ConeGeometry(.06,.5,6);
  const zs=[-8.4,-5.2,-2.0,1.2];
  for(const [s,mat] of [[-1,new T.MeshStandardMaterial({color:'#6f8496',roughness:.4,metalness:.15,envMap:env,envMapIntensity:.5})],[1,new T.MeshStandardMaterial({color:'#4a2a24',roughness:.85,emissive:'#ff4a1a',emissiveMap:emberGlow,emissiveIntensity:.6})]]){
    const cols=new T.InstancedMesh(colGeo,mat,zs.length),o=new T.Object3D();zs.forEach((z,i)=>{o.position.set(center+s*6.3,4.5,z);o.updateMatrix();cols.setMatrixAt(i,o.matrix);});group.add(cols);
    if(s<0){const ice=new T.InstancedMesh(icicleGeo,mat,zs.length*6);let n=0;zs.forEach(z=>{for(let k=0;k<6;k++){const a=k/6*Math.PI*2;o.position.set(center-6.3+Math.cos(a)*.42,3.6+r()*.4,z+Math.sin(a)*.42);o.rotation.set(Math.PI,0,0);o.scale.set(1,.6+r()*1.2,1);o.updateMatrix();ice.setMatrixAt(n++,o.matrix);}});group.add(ice);}
  }
  // Snow and sparks, each confined to its half.
  const snow=createParticles({count:320,min:[center-8,0,-10.5],max:[center-.15,9,5],velocity:[0,-.38,0],wobble:.35,size:.055,color:'#e8f4ff',opacity:.85,twinkle:.2,seed:58});
  const sparks=createParticles({count:200,min:[center+.15,0,-10.5],max:[center+8,8,5],velocity:[0,.6,0],wobble:.28,size:.06,color:'#ff8a3a',opacity:.95,twinkle:.8,shape:'spark',seed:59});
  group.add(snow.points,sparks.points);
  // Lights: frost left, ember right, and the seam.
  const frost=new T.PointLight('#7fc4ff',40,16,1.5);frost.position.set(center-4.5,4.2,-1);
  const ember=new T.PointLight('#ff5a2a',50,16,1.5);ember.position.set(center+4.5,4.2,-1);
  const seamLight=new T.PointLight('#fff1dc',18,12,1.6);seamLight.position.set(center,5,-6);
  group.add(frost,ember,seamLight);
  const blue=new T.Color('#7fc4ff'),red=new T.Color('#ff5a2a'),peace=new T.Color('#c9b8e8');
  let glow=1,flare=0,wasStrike=0,merge=0;
  return {group,
    key:{color:'#d6e2f0',intensity:80,position:[center,9,4.5],target:[center,1.6,-1]},
    atmosphere:{background:'#0a0d13',fog:'#121823',density:.028},
    update(time,reduced,dt,fx={}){
      snow.update(time,reduced);sparks.update(time,reduced);uniforms.uTime.value=reduced?0:time;
      const kind=fx.kind,coordinated=kind==='double'||kind==='windup'||kind==='slam';
      if(fx.strike>.8&&wasStrike<=.8&&coordinated)flare=1;wasStrike=fx.strike||0;flare=Math.max(0,flare-dt*1.4);
      merge=fx.defeated?Math.min(1,merge+dt*.4):0;
      const target=(kind==='recover'?.45:coordinated?(reduced?1.3:1.1+Math.sin(time*7)*.25):.8)*(1-merge*.8);
      glow=damp(glow,target,reduced?60:5,dt);const g=glow+flare*2.2;
      for(const m of [floorBand,wallBand,pillarBand]){m.uniforms.uGlow.value=g;m.uniforms.uTime.value=reduced?0:time;}
      seamMat.color.setScalar(Math.min(1.6,.5+g*.6));seamLight.intensity=12+g*14+flare*80;
      frost.color.copy(blue).lerp(peace,merge);ember.color.copy(red).lerp(peace,merge);
      frost.intensity=40+flare*30;ember.intensity=50+flare*30;
    }
  };
}
