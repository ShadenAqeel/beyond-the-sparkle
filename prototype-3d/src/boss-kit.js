import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Shared helpers for the procedural guardians and their arenas. Everything here
// is original canvas/shader work; nothing is downloaded.
export const rand=seed=>{let s=seed>>>0;return()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};};
export const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
export const clamp01=v=>Math.min(1,Math.max(0,v));
export const smooth=v=>{v=clamp01(v);return v*v*(3-2*v);};
export const lerp=(a,b,t)=>a+(b-a)*t;

export function canvasTexture(draw,width=256,height=width,{srgb=true,repeat=null}={}){
  const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
  const t=new T.CanvasTexture(c);if(srgb)t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;
  if(repeat){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(...repeat);}
  return t;
}
export function glowTexture(inner='#ffffff',mid='#ffffffaa',size=64){
  return canvasTexture((g,s)=>{const r=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);r.addColorStop(0,inner);r.addColorStop(.28,mid);r.addColorStop(1,'#00000000');g.fillStyle=r;g.fillRect(0,0,s,s);},size);
}
export function glowSprite(map,color,scale,opacity=1){
  const s=new T.Sprite(new T.SpriteMaterial({map,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending,fog:false}));s.scale.setScalar(scale);return s;
}
// Noise-and-crack stone used by the Scale and the tribunal.
export function stoneTexture(seed,base,{size=256,cracks=10,veins='#00000055',repeat=null}={}){
  return canvasTexture((g,s)=>{
    const r=rand(seed);g.fillStyle=base;g.fillRect(0,0,s,s);
    for(let i=0;i<1400;i++){const v=Math.floor(r()*60-30);g.fillStyle=`rgba(${v>0?255:0},${v>0?240:0},${v>0?220:0},${Math.abs(v)/600})`;const w=1+r()*3;g.fillRect(r()*s,r()*s,w,w);}
    g.strokeStyle=veins;g.lineCap='round';
    for(let i=0;i<cracks;i++){let x=r()*s,y=r()*s;g.lineWidth=.6+r()*1.4;g.beginPath();g.moveTo(x,y);for(let k=0;k<6;k++){x+=(r()-.5)*40;y+=(r()-.5)*40;g.lineTo(x,y);}g.stroke();}
  },size,size,{repeat});
}
// Merge the direct static mesh children of a group per material (fewer draw calls).
export function bake(group){
  const batches=new Map();
  for(const mesh of [...group.children]){
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.userData.keep)continue;
    mesh.updateMatrix();let geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix);if(geometry.index)geometry=geometry.toNonIndexed();
    for(const name of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(name))geometry.deleteAttribute(name);
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(geometry.attributes.position.count*2),2));
    if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(geometry);group.remove(mesh);
  }
  for(const [material,list] of batches){const merged=new T.Mesh(mergeGeometries(list),material);merged.castShadow=merged.receiveShadow=false;group.add(merged);list.forEach(g=>g.dispose());}
  return group;
}

// A GPU particle field: positions advance and wrap inside a box in the vertex
// shader, so there is no per-frame CPU work. One material per layer; frozen
// when motion is reduced.
const particleVertex=`
attribute vec4 aData;uniform float uTime;uniform float uSize;uniform float uScale;uniform vec3 uMin;uniform vec3 uBox;uniform vec3 uVel;uniform float uWobble;uniform float uTwinkle;uniform float uNear;uniform float uFar;
varying float vAlpha;
void main(){
  vec3 p=mod(position-uMin+uVel*uTime*aData.y,uBox);vec3 f=p/uBox;p+=uMin;
  p.x+=sin(uTime*.7*aData.y+aData.x)*uWobble;p.z+=cos(uTime*.6*aData.y+aData.w)*uWobble;
  vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
  float edge=(uVel.y!=0.?smoothstep(0.,.1,f.y)*smoothstep(1.,.9,f.y):1.)*(uVel.x!=0.?smoothstep(0.,.08,f.x)*smoothstep(1.,.92,f.x):1.);
  float tw=1.-uTwinkle*(.5+.5*sin(uTime*(1.5+aData.y*2.5)+aData.x*7.));
  vAlpha=edge*tw*smoothstep(uFar,uNear,-mv.z);
  gl_PointSize=uSize*(.55+aData.z*.9)*uScale/-mv.z;
}`;
const particleFragment=`
uniform vec3 uColor;uniform float uOpacity;varying float vAlpha;
void main(){
  vec2 c=gl_PointCoord-.5;float d=length(c)*2.;
#if SHAPE==1
  float a=pow(max(0.,1.-d),2.)*.55+max(0.,1.-abs(c.x)*9.)*max(0.,1.-abs(c.y)*2.4)+max(0.,1.-abs(c.y)*9.)*max(0.,1.-abs(c.x)*2.4);
#elif SHAPE==2
  float a=step(abs(c.x)+abs(c.y),.42)*(1.-d*.5);
#else
  float a=smoothstep(1.,0.,d);a*=a;
#endif
  gl_FragColor=vec4(uColor,min(1.,a)*vAlpha*uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export function createParticles({count,min,max,velocity=[0,0,0],wobble=0,size=.05,color='#ffffff',opacity=1,twinkle=0,shape='soft',seed=1,blending=T.AdditiveBlending,near=2,far=40}){
  const r=rand(seed),positions=new Float32Array(count*3),data=new Float32Array(count*4);
  for(let i=0;i<count;i++){for(let k=0;k<3;k++)positions[i*3+k]=min[k]+r()*(max[k]-min[k]);data.set([r()*6.283,.55+r()*.9,r(),r()*6.283],i*4);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3));geometry.setAttribute('aData',new T.BufferAttribute(data,4));
  const material=new T.ShaderMaterial({vertexShader:particleVertex,fragmentShader:particleFragment,transparent:true,depthWrite:false,blending,
    defines:{SHAPE:shape==='spark'?1:shape==='diamond'?2:0},
    uniforms:{uTime:{value:0},uSize:{value:size},uScale:{value:400},uMin:{value:new T.Vector3(...min)},uBox:{value:new T.Vector3(max[0]-min[0],max[1]-min[1],max[2]-min[2])},uVel:{value:new T.Vector3(...velocity)},uWobble:{value:wobble},uTwinkle:{value:twinkle},uColor:{value:new T.Color(color)},uOpacity:{value:opacity},uNear:{value:near},uFar:{value:far}}});
  const points=new T.Points(geometry,material);points.frustumCulled=false;
  const buffer=new T.Vector2();points.onBeforeRender=renderer=>{renderer.getDrawingBufferSize(buffer);material.uniforms.uScale.value=buffer.y*.5;};
  const frozen=3+r()*5;
  return {points,material,update(time,reduced){material.uniforms.uTime.value=reduced?frozen:time;}};
}

// Translucent fresnel "ghost" material (instancing-aware) for reflections and light curtains.
export function ghostMaterial(core,rim,opacity=.4){
  return new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    uniforms:{uCore:{value:new T.Color(core)},uRim:{value:new T.Color(rim)},uOpacity:{value:opacity}},
    vertexShader:`varying vec3 vN;varying vec3 vV;void main(){vec4 p=vec4(position,1.);vec3 n=normal;
      #ifdef USE_INSTANCING
      p=instanceMatrix*p;n=mat3(instanceMatrix)*n;
      #endif
      vec4 mv=modelViewMatrix*p;vN=normalize(normalMatrix*n);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`uniform vec3 uCore;uniform vec3 uRim;uniform float uOpacity;varying vec3 vN;varying vec3 vV;
      void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.2);vec3 c=mix(uCore*.35,uRim,f);gl_FragColor=vec4(c,(f*.9+.12)*uOpacity);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
}
// Vertex wind for cloth (veils, banners, plumes).
export function windMaterial(params,uniforms,{amount=.06,height=3,axis='y',Base=T.MeshStandardMaterial}={}){
  const m=new Base(params);
  m.onBeforeCompile=shader=>{
    shader.uniforms.uTime=uniforms.uTime;shader.uniforms.uGust=uniforms.uGust;
    const w=axis==='y'?`clamp(1.0-position.y/${height.toFixed(2)},0.0,1.0)`:`clamp(-position.z/${height.toFixed(2)},0.0,1.0)`;
    shader.vertexShader='uniform float uTime;uniform float uGust;\n'+shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      float w=${w};w*=w;
      transformed.x+=sin(uTime*1.6+position.y*2.7+position.z*3.1)*${amount.toFixed(3)}*w*(1.0+uGust);
      transformed.z+=(cos(uTime*1.2+position.x*2.4+position.y*1.3)*${(amount*1.2).toFixed(3)}-uGust*.12)*w;`);
  };
  m.customProgramCacheKey=()=>`wind:${amount}:${height}:${axis}`;
  return m;
}
