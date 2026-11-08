import * as T from 'three';

// The Exile's arena: walls of procedural fire, burning floor cracks and drifting
// embers. All original shader/canvas work; one shared fire material per layer.
const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`;
const fragment=`
uniform float uTime;uniform float uSeed;uniform float uIntensity;uniform float uScale;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=vUv;
  vec2 q=vec2(uv.x*uScale+uSeed,uv.y*1.6-uTime*1.15);
  float warp=fbm(q*1.3+vec2(0.,uTime*.35));
  float n=fbm(q+vec2(warp*.9,0.));
  float tongues=fbm(vec2(uv.x*uScale*1.4+uSeed*3.,uTime*.45))*.75+.35;
  float base=1.-uv.y;
  float f=n*1.75*base*tongues+base*base*.55-uv.y*.42;
  f=smoothstep(.12,.95,f);
  f*=smoothstep(0.,.07,uv.x)*smoothstep(1.,.93,uv.x);
  vec3 col=mix(vec3(.22,.015,0.),vec3(1.,.28,.03),smoothstep(.05,.45,f));
  col=mix(col,vec3(1.,.6,.18),smoothstep(.5,.85,f));
  col=mix(col,vec3(1.,.85,.5),smoothstep(.92,1.,f));
  gl_FragColor=vec4(col*f*uIntensity,f);
}`;
function fireMaterial(seed,scale){
  return new T.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
    uniforms:{uTime:{value:0},uSeed:{value:seed},uIntensity:{value:1.25},uScale:{value:scale}}});
}
function canvasTexture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}

export function createInferno(center){
  const group=new T.Group();group.name='Inferno / the Exile\'s burning threshold';
  const layers=[];
  const add=(w,h,x,y,z,ry,seed,scale,intensity=1.25)=>{
    const m=fireMaterial(seed,scale);m.uniforms.uIntensity.value=intensity;
    const mesh=new T.Mesh(new T.PlaneGeometry(w,h),m);mesh.position.set(center+x,y,z);mesh.rotation.y=ry;mesh.renderOrder=-1;group.add(mesh);layers.push(m);return mesh;
  };
  add(17,8.5,0,3.9,-5.35,0,1.3,7,.95);         // great wall of fire behind the boss
  add(13,5,0,2.3,-4.55,0,7.1,5.5,.75);         // nearer, lower tongues for depth
  add(12,7,-6.5,3.2,-.5,Math.PI/2,3.7,6,.7);   // left wall
  add(12,7,6.5,3.2,-.5,-Math.PI/2,5.9,6,.7);   // right wall
  // Molten cracks radiating from beneath the boss.
  const crackMap=canvasTexture((g,s)=>{
    g.fillStyle='#000';g.fillRect(0,0,s,s);g.lineCap='round';let seed=3;const r=()=>(seed=(seed*16807)%2147483647)/2147483647;
    for(let i=0;i<14;i++){
      let a=i/14*Math.PI*2+r()*.3,x=s/2,y=s/2;g.beginPath();g.moveTo(x,y);
      for(let k=0;k<9;k++){a+=(r()-.5)*.7;const step=14+r()*22;x+=Math.cos(a)*step;y+=Math.sin(a)*step;g.lineTo(x,y);}
      g.strokeStyle='#ff6a1a';g.lineWidth=2+r()*3;g.shadowColor='#ff2a00';g.shadowBlur=14;g.stroke();
    }
    const glow=g.createRadialGradient(s/2,s/2,0,s/2,s/2,s*.32);glow.addColorStop(0,'#ff4a0a99');glow.addColorStop(1,'#00000000');g.fillStyle=glow;g.fillRect(0,0,s,s);
  });
  const cracks=new T.Mesh(new T.CircleGeometry(5.2,48),new T.MeshBasicMaterial({map:crackMap,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
  cracks.rotation.x=-Math.PI/2;cracks.position.set(center,.03,-1.6);group.add(cracks);
  // Embers drift through the whole chamber.
  const COUNT=260,pos=new Float32Array(COUNT*3),seeds=[];let s=17;const r=()=>(s=(s*16807)%2147483647)/2147483647;
  for(let i=0;i<COUNT;i++)seeds.push([(r()-.5)*15,(r()-.5)*11-1.5,r(),.35+r()*.9,r()*6]);
  const emberGeo=new T.BufferGeometry();emberGeo.setAttribute('position',new T.BufferAttribute(pos,3));
  const dot=canvasTexture((g,n)=>{const gr=g.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);gr.addColorStop(0,'#fff2d0');gr.addColorStop(.3,'#ffb060cc');gr.addColorStop(1,'#ff400000');g.fillStyle=gr;g.fillRect(0,0,n,n);},64);
  const embers=new T.Points(emberGeo,new T.PointsMaterial({map:dot,color:'#ff8a3a',size:.075,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));embers.frustumCulled=false;group.add(embers);
  // Fire light from behind (rim) and below (uplight), flickering.
  const rim=new T.PointLight('#ff5a1a',160,18,1.6);rim.position.set(center,3.4,-4.6);group.add(rim);
  const under=new T.PointLight('#ff3c0a',25,9,1.8);under.position.set(center,.4,1.6);group.add(under);
  const sides=[-1,1].map(x=>{const l=new T.PointLight('#ff7a2a',70,12,1.8);l.position.set(center+x*5.6,2.4,-.5);group.add(l);return l;});
  let rage=0;
  return {group,
    setRage(value){rage=value;},
    update(time,reduced){
      const t=reduced?3:time;
      for(const m of layers){m.uniforms.uTime.value=t;}
      layers[0].uniforms.uIntensity.value=.95+rage*.45;layers[1].uniforms.uIntensity.value=.75+rage*.4;
      const flick=reduced?0:Math.sin(time*9.1)*.12+Math.sin(time*4.3)*.1+Math.sin(time*17)*.05;
      rim.intensity=(160+rage*90)*(1+flick);under.intensity=(22+rage*30)*(1+flick*1.4);sides.forEach((l,i)=>l.intensity=70*(1+(reduced?0:Math.sin(time*7+i*2)*.15)));
      cracks.material.opacity=.75+rage*.25+(reduced?0:Math.sin(time*2.1)*.12);
      for(let i=0;i<COUNT;i++){
        const [x,z,o,v,ph]=seeds[i],life=reduced?o:(time*.09*v+o)%1;
        pos[i*3]=center+x+Math.sin(time*.8+ph)*.4*life;pos[i*3+1]=life*7.5;pos[i*3+2]=z+Math.cos(time*.6+ph)*.3;
      }
      emberGeo.attributes.position.needsUpdate=true;
    }
  };
}
