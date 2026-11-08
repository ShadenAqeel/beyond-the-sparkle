import * as T from 'three';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {rand,damp,canvasTexture,createParticles,glowTexture,glowSprite} from './boss-kit.js';

// The Hall of Reflections: a ring of arched mirrors that each seem to recede
// forever, a polished floor that truly reflects (rendered at reduced
// resolution), cold moonlight, fog and drifting glass motes.
const beamVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const beamFragment=`uniform float uIntensity;uniform vec3 uColor;varying vec2 vUv;
void main(){float edge=pow(sin(vUv.x*3.14159),3.);gl_FragColor=vec4(uColor,edge*smoothstep(0.,1.,vUv.y)*uIntensity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createMirrorHall(center,world){
  const group=new T.Group();group.name='Hall of Reflections / mirrored arches';
  const env=world.gems[0].material.envMap,r=rand(71),Z=-1.5;
  // Reflective floor plus a tiled, vignetted glaze that fades it into fog.
  const floor=new Reflector(new T.CircleGeometry(9.5,64),{textureWidth:512,textureHeight:288,color:'#8e88aa',clipBias:.003,multisample:0});
  floor.rotation.x=-Math.PI/2;floor.position.set(center,.001,Z);group.add(floor);
  const glaze=canvasTexture((g,s)=>{
    const c=s/2;g.clearRect(0,0,s,s);
    g.strokeStyle='#d8d2ff38';g.lineWidth=2;const step=s/19;for(let x=-c;x<=c;x+=step){g.beginPath();g.moveTo(c+x,0);g.lineTo(c+x,s);g.stroke();g.beginPath();g.moveTo(0,c+x);g.lineTo(s,c+x);g.stroke();}
    g.strokeStyle='#e9e4ff55';g.lineWidth=4;for(const rr of [.18,.33]){g.beginPath();g.arc(c,c,s*rr,0,Math.PI*2);g.stroke();}
    const v=g.createRadialGradient(c,c,s*.12,c,c,s*.5);v.addColorStop(0,'#0a081222');v.addColorStop(.7,'#0a0812aa');v.addColorStop(1,'#0a0812ff');g.fillStyle=v;g.fillRect(0,0,s,s);
  },1024);
  const glazeMesh=new T.Mesh(new T.CircleGeometry(9.52,64),new T.MeshBasicMaterial({map:glaze,transparent:true,depthWrite:false}));glazeMesh.rotation.x=-Math.PI/2;glazeMesh.position.set(center,.006,Z);group.add(glazeMesh);
  // Each arched mirror shows a corridor of frames receding to a point.
  const tunnel=canvasTexture((g,w,h)=>{
    const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#1b1630');bg.addColorStop(.6,'#2a2348');bg.addColorStop(1,'#120f20');g.fillStyle=bg;g.fillRect(0,0,w,h);
    const vx=w/2,vy=h*.56;
    for(let k=0;k<16;k++){const s=Math.pow(.8,k),aw=w*.46*s,top=vy-(vy-h*.05)*s,bottom=vy+(h*.98-vy)*s;
      g.beginPath();g.moveTo(vx-aw,bottom);g.lineTo(vx-aw,top+aw);g.arc(vx,top+aw,aw,Math.PI,0);g.lineTo(vx+aw,bottom);
      g.strokeStyle=`rgba(225,218,255,${.75*Math.pow(.84,k)})`;g.lineWidth=Math.max(1,7*s);g.stroke();
      if(k%2){g.fillStyle=`rgba(150,130,230,${.05*Math.pow(.9,k)})`;g.fill();}}
    const glow=g.createRadialGradient(vx,vy,0,vx,vy,w*.3);glow.addColorStop(0,'#e8e2ffaa');glow.addColorStop(1,'#e8e2ff00');g.fillStyle=glow;g.fillRect(0,0,w,h);
  },256,512);
  const archShape=(w,h)=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.absarc(0,h,w/2,0,Math.PI,false);s.lineTo(-w/2,0);return s;};
  const AW=1.9,AH=4.4,panelGeo=new T.ShapeGeometry(archShape(AW,AH),24);
  {const p=panelGeo.attributes.position,uv=panelGeo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,p.getX(i)/AW+.5,p.getY(i)/(AH+AW/2));}
  const frameShape=archShape(AW+.26,AH);frameShape.holes.push(archShape(AW,AH));
  const frameGeo=new T.ExtrudeGeometry(frameShape,{depth:.14,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:2,steps:1,curveSegments:24});
  const mirrorMat=new T.MeshStandardMaterial({color:'#ffffff',map:tunnel,metalness:.75,roughness:.1,envMap:env,envMapIntensity:.9,emissive:'#ffffff',emissiveMap:tunnel,emissiveIntensity:.6});
  const silver=new T.MeshStandardMaterial({color:'#c9c4dc',metalness:.95,roughness:.25,envMap:env,envMapIntensity:1.2});
  const COUNT=13,R=8.4,panels=new T.InstancedMesh(panelGeo,mirrorMat,COUNT),frames=new T.InstancedMesh(frameGeo,silver,COUNT),o=new T.Object3D();
  for(let i=0;i<COUNT;i++){const a=(i/(COUNT-1)-.5)*3.9;o.position.set(center+Math.sin(a)*R,.12,Z-Math.cos(a)*R);o.rotation.set(0,-a,0);o.scale.setScalar(1);o.updateMatrix();panels.setMatrixAt(i,o.matrix);o.translateZ(-.06);o.updateMatrix();frames.setMatrixAt(i,o.matrix);}
  group.add(panels,frames);
  const ring=new T.Mesh(new T.TorusGeometry(R,.05,6,96,3.9),silver);ring.rotation.set(Math.PI/2,0,-(Math.PI/2+1.95));ring.position.set(center,6.0,Z);group.add(ring);
  const baseRing=new T.Mesh(new T.TorusGeometry(R-.1,.06,6,96,3.9),silver);baseRing.rotation.copy(ring.rotation);baseRing.position.set(center,.08,Z);group.add(baseRing);
  // Cold moon high to the right, and its beam.
  const moonGlow=glowSprite(glowTexture('#f4f6ff','#b9c4ff66'),'#c9d2ff',6,.85);moonGlow.position.set(center+6.6,5.2,-12.5);group.add(moonGlow);
  const moon=new T.Mesh(new T.CircleGeometry(.62,40),new T.MeshBasicMaterial({color:'#f2f4ff',toneMapped:false,fog:false}));moon.position.copy(moonGlow.position).add(new T.Vector3(0,0,.05));moon.lookAt(center,2,6);group.add(moon);
  const beamMat=new T.ShaderMaterial({vertexShader:beamVertex,fragmentShader:beamFragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,uniforms:{uIntensity:{value:.12},uColor:{value:new T.Color('#c4ccff')}}});
  for(const k of [0,1]){const beam=new T.Mesh(new T.PlaneGeometry(3.2,12),beamMat);beam.position.set(center+2.8,5.6,-6);beam.rotation.set(0,k*Math.PI/2,.62);beam.renderOrder=2;group.add(beam);}
  const motes=createParticles({count:240,min:[center-8,0,-10],max:[center+8,7.5,4],velocity:[0,.06,0],wobble:.5,size:.06,color:'#ebe6ff',opacity:.9,twinkle:.95,shape:'diamond',seed:72});group.add(motes.points);
  const dust=createParticles({count:120,min:[center-6,0,-8],max:[center+6,6,3],velocity:[.03,.02,0],wobble:.3,size:.03,color:'#a99cff',opacity:.6,twinkle:.4,seed:73});group.add(dust.points);
  const moonLight=new T.SpotLight('#cfd7ff',190,22,.55,.8,1.4);moonLight.position.set(center+3.6,8.6,-6.5);moonLight.target.position.set(center,1.6,Z);group.add(moonLight,moonLight.target);
  const fill=new T.PointLight('#8a6cff',22,10,1.6);fill.position.set(center,1.4,1.6);group.add(fill);
  const size=new T.Vector2();let flare=0,wasStrike=0,calm=0;
  return {group,
    key:{color:'#bcb5ea',intensity:85,position:[center-2,8.5,4.5],target:[center,1.8,Z]},
    atmosphere:{background:'#0a0811',fog:'#141024',density:.03},
    setQuality(quality){world.renderer.getDrawingBufferSize(size);const k=quality==='quality'?.65:.5;floor.getRenderTarget().setSize(Math.max(256,Math.round(size.x*k)),Math.max(144,Math.round(size.y*k)));},
    update(time,reduced,dt,fx={}){
      motes.update(time,reduced);dust.update(time,reduced);
      if(fx.strike>.8&&wasStrike<=.8)flare=1;wasStrike=fx.strike||0;flare=Math.max(0,flare-dt*1.5);
      calm=fx.defeated?Math.min(1,calm+dt*.4):0;
      const shimmer=fx.kind==='feint'&&!reduced?Math.sin(time*11)*.12+Math.sin(time*17)*.08:0;
      mirrorMat.emissiveIntensity=(.6+shimmer+flare*.8)*(1-calm*.5);
      moonGlow.material.opacity=.85+calm*.15;moonLight.intensity=190+calm*60;beamMat.uniforms.uIntensity.value=.12+calm*.08;
      fill.intensity=22+flare*40+(fx.kind==='lunge'&&!fx.strike?8:0);
    }
  };
}
