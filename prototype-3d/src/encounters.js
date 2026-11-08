import * as T from 'three';
import {createActor} from './characters.js';
import { CHAPTERS } from './chapters.js';
import {loadKeeperHeads} from './keeper-heads.js';
import {createExile} from './exile-boss.js';
import {createInferno} from './inferno.js';
import {createHollowScale} from './hollow-scale.js';
import {createTribunal} from './tribunal.js';
import {createTwinWarden} from './twin-warden.js';
import {createDivisionHall} from './division-hall.js';
import {createVeiledMirror} from './veiled-mirror.js';
import {createMirrorHall} from './mirror-hall.js';

export async function createEncounters(world) {
  const heads=await loadKeeperHeads();
  const {scene,materials:m}=world, center=50, arena=new T.Group(), decor=new T.Group(), archive=new T.Group(), room=new T.Group();
  arena.name='Reusable encounter chamber';arena.visible=false;scene.add(arena);arena.add(decor,archive);
  // The plain stone room serves the Exile and the Archive; the first three
  // guardians each bring their own arena backdrop instead.
  room.name='Shared stone chamber (Exile, Archive)';decor.add(room);
  function box(x,y,z,w,h,d,material=m.stone,parent=room){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),material);mesh.position.set(center+x,y,z);mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  const floor=new T.Mesh(new T.CylinderGeometry(7,7.3,.35,48),m.floor);floor.position.set(center,-.2,0);floor.receiveShadow=true;room.add(floor);
  box(0,3.2,-6,16,7,1,m.darkStone);box(-7,2.8,0,.7,6,12,m.darkStone);box(7,2.8,0,.7,6,12,m.darkStone);
  for(const x of [-5,-2.8,2.8,5]){const pillar=new T.Mesh(new T.CylinderGeometry(.25,.36,5.7,16),m.column);pillar.position.set(center+x,2.8,-4.8);room.add(pillar);for(const y of [.2,5.5])box(x,y,-4.8,.9,.25,.9,m.trim);}
  const rim=new T.Mesh(new T.TorusGeometry(4.6,.025,6,64),m.gold.clone());rim.rotation.x=-Math.PI/2;rim.position.set(center,.015,0);room.add(rim);
  const light=new T.SpotLight('#c6a574',100,25,.9,.7,1.6);light.position.set(center-2,6,4);light.target.position.set(center,1,-1);arena.add(light,light.target);
  const lightHome=light.position.clone();
  const backdropFactories={form:createTribunal,division:createDivisionHall,memory:createMirrorHall},backdrops=new Map();let backdrop=null;
  function backdropFor(id){
    if(!backdropFactories[id])return null;
    if(!backdrops.has(id)){const b=backdropFactories[id](center,world);b.group.visible=false;decor.add(b.group);backdrops.set(id,b);}
    return backdrops.get(id);
  }
  const finalBackdrop=new T.Group();finalBackdrop.name='The Exile / firelit threshold';finalBackdrop.visible=false;decor.add(finalBackdrop);
  const bowls=new T.InstancedMesh(new T.CylinderGeometry(.62,.35,.35,20),m.iron,2);
  const plinths=new T.InstancedMesh(new T.CylinderGeometry(.4,.55,.75,12),m.darkStone,2),firePose=new T.Object3D();
  for(let i=0;i<2;i++){const x=center+(i?3.5:-3.5);firePose.position.set(x,.38,-3.8);firePose.updateMatrix();plinths.setMatrixAt(i,firePose.matrix);firePose.position.y=.93;firePose.updateMatrix();bowls.setMatrixAt(i,firePose.matrix);}finalBackdrop.add(bowls,plinths);
  const fireMaterial=new T.MeshBasicMaterial({map:world.flameMap,color:'#ffb35d',transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});
  const finalFlames=new T.InstancedMesh(new T.PlaneGeometry(1,1),fireMaterial,16);finalBackdrop.add(finalFlames);
  const fireSpill=new T.PointLight('#ef913e',100,13,2);fireSpill.position.set(center,2.6,-3.5);finalBackdrop.add(fireSpill);
  const inferno=createInferno(center);finalBackdrop.add(inferno.group);
  // The Archive is another staging of this same room, with reused shelf/book materials.
  for(const x of [-4,4]){for(const y of [.4,1.5,2.6,3.7])box(x,y,-4.3,2.4,.12,1,m.wood,archive);for(const dx of [-1.2,1.2])box(x+dx,2,-4.3,.12,4.2,1,m.wood,archive);}
  const books=new T.InstancedMesh(new T.BoxGeometry(.13,.55,.38),m.wood,80),dummy=new T.Object3D();
  for(let i=0;i<80;i++){const side=i<40?-4:4,j=i%40;dummy.position.set(center+side-1+(j%10)*.21,.75+Math.floor(j/10)*1.1,-4.05);dummy.rotation.z=(j%3-1)*.06;dummy.updateMatrix();books.setMatrixAt(i,dummy.matrix);books.setColorAt(i,new T.Color(['#738F89','#a56e75','#c6a574','#49463c'][i%4]));}archive.add(books);
  box(-1.65,.55,-.7,2,.95,1.2,m.wood,archive);box(-1.65,1.08,-.7,2.15,.12,1.3,m.trim,archive);
  const archiveGem=new T.Mesh(world.gems[0].geometry,world.gems[0].material.clone());archiveGem.material.color.set('#b6b0d1');archiveGem.scale.setScalar(1.65);archiveGem.position.set(center-1.65,2,-.7);archive.add(archiveGem);
  const reward=new T.Mesh(world.gems[0].geometry,world.gems[0].material.clone());reward.position.set(center,2.1,-.3);arena.add(reward);reward.visible=false;
  const effects=new T.Group();arena.add(effects);
  const contactCanvas=document.createElement('canvas');contactCanvas.width=contactCanvas.height=64;
  const contactContext=contactCanvas.getContext('2d'),gradient=contactContext.createRadialGradient(32,32,2,32,32,31);gradient.addColorStop(0,'#00000088');gradient.addColorStop(1,'#00000000');contactContext.fillStyle=gradient;contactContext.fillRect(0,0,64,64);
  const contacts=new T.InstancedMesh(new T.PlaneGeometry(1.3,1.1),new T.MeshBasicMaterial({map:new T.CanvasTexture(contactCanvas),transparent:true,depthWrite:false}),2);decor.add(contacts);
  const impactMaterial=new T.MeshBasicMaterial({color:'#e3c88f',transparent:true,opacity:0,depthWrite:false});
  const impact=new T.Mesh(new T.TorusGeometry(.3,.025,5,24),impactMaterial);impact.position.set(center,1.5,-.25);effects.add(impact);
  const slash=new T.Mesh(new T.TorusGeometry(.8,.018,4,24,Math.PI*.85),impactMaterial);slash.position.set(center,1.45,.2);slash.rotation.z=-.6;effects.add(slash);
  const guardMaterial=new T.MeshBasicMaterial({color:'#82B5C6',transparent:true,opacity:0,depthWrite:false});
  const guard=new T.Mesh(new T.RingGeometry(.45,.5,24),guardMaterial);guard.position.set(center,1.6,2.4);effects.add(guard);
  const motes=new T.InstancedMesh(new T.OctahedronGeometry(.025),impactMaterial,8);effects.add(motes);
  const playerWeapon=new T.Group();effects.add(playerWeapon);
  const bladeShape=new T.Shape();bladeShape.moveTo(-.045,0);bladeShape.lineTo(-.045,.7);bladeShape.lineTo(0,.91);bladeShape.lineTo(.045,.7);bladeShape.lineTo(.045,0);bladeShape.closePath();
  playerWeapon.add(new T.Mesh(new T.ExtrudeGeometry(bladeShape,{depth:.018,bevelEnabled:true,bevelSize:.008,bevelThickness:.006,bevelSegments:1,steps:1}),m.iron));
  const hilt=new T.Mesh(new T.BoxGeometry(.25,.035,.04),m.gold);playerWeapon.add(hilt);
  let action=null,telegraph=null,exposed=false,endingStep=-1,attackSequence=0,trauma=0,kick=0,rage=0;
  const sparkMaterial=new T.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
  const sparks=new T.InstancedMesh(new T.OctahedronGeometry(.045),sparkMaterial,24);sparks.frustumCulled=false;effects.add(sparks);
  const sparkDirs=Array.from({length:24},(_,i)=>new T.Vector3(Math.cos(i*2.4)*(.6+(i%5)*.15),Math.sin(i*1.7)*.8+.4,(i%3-1)*.4));
  const joined=new T.Group();archive.add(joined);
  for(let i=0;i<3;i++){
    const gem=new T.Mesh(world.gems[0].geometry,world.gems[0].material.clone());gem.scale.setScalar(.36);gem.position.set(center-1.65+Math.cos(i*Math.PI*2/3)*.8,1.6,-.7+Math.sin(i*Math.PI*2/3)*.6);gem.material.transmission=0;joined.add(gem);
  }
  joined.visible=false;
  const actors=new Map(), scholars=new Map();let active=[],chapter='form',region='shrine',recovering=false,recoveryTime=0,twins=null;
  // Every guardian is a custom procedural actor; only the Archive's Old Scholar uses the shared rig.
  function createGuardian(role){
    const env=world.gems[0].material.envMap;
    if(role==='exile')return createExile(env);
    if(role==='form')return createHollowScale(env);
    if(role==='memory')return createVeiledMirror(env);
    if(role==='agile'||role==='heavy'){twins??=createTwinWarden(env);return twins[role];}
    return createActor(world.npc,role,env,heads);
  }
  function actor(role,key=role){if(!actors.has(key))actors.set(key,createGuardian(role));return actors.get(key);}
  function clearActors(){for(const a of active)a.root.visible=false;active=[];}
  const homes={form:-1.5,exile:-2.3};
  function stage(id,isArchive=false){
    clearActors();chapter=id;arena.visible=true;archive.visible=isArchive;reward.visible=false;recovering=false;action=null;telegraph=null;exposed=false;joined.visible=false;endingStep=-1;
    finalBackdrop.visible=id==='exile'&&!isArchive;
    for(const b of backdrops.values())b.group.visible=false;
    backdrop=isArchive?null:backdropFor(id);if(backdrop)backdrop.group.visible=true;room.visible=!backdrop;
    light.position.copy(lightHome);
    light.color.set(isArchive?'#e4d2aa':CHAPTERS[id].color);light.intensity=isArchive?100:120;
    if(finalBackdrop.visible){light.color.set('#8a9bc0');light.intensity=70;light.target.position.set(center,3,-2.3);inferno.setRage(0);}
    else if(backdrop){light.color.set(backdrop.key.color);light.intensity=backdrop.key.intensity;light.position.set(...backdrop.key.position);light.target.position.set(...backdrop.key.target);}
    else light.target.position.set(center,1,-1);
    rim.material.color.set(id==='exile'&&!isArchive?'#738f89':'#c6a574');
    const roles=id==='division'&&!isArchive?[['agile','warden-agile',1.45],['heavy','warden-heavy',-1.45]]:[[isArchive?'old':id,isArchive?'old':id,0]];
    const homeZ=isArchive?-2:homes[id]??-1;
    for(const [role,key,x] of roles){const a=actor(role,key);a.reset();a.home.set(center+x,0,homeZ);a.root.position.copy(a.home);arena.add(a.root);active.push(a);}
    contacts.count=roles.length;
    active.forEach((a,i)=>{dummy.position.set(a.home.x,.022,homeZ);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(a.contactScale??(id==='exile'&&!isArchive?3.4:1));dummy.updateMatrix();contacts.setMatrixAt(i,dummy.matrix);});contacts.instanceMatrix.needsUpdate=true;
    backdrop?.setQuality?.(world.getQuality());
    world.renderer.shadowMap.needsUpdate=true;
  }
  function syncScholars(state){
    for(const [id,key,p] of [['division','divider',[10.3,-4.05,-9.8]],['memory','seer',[15.7,-4.05,-9.8]]]){
      if(!state.bosses[id].placed){if(scholars.has(id))scholars.get(id).root.visible=false;continue;}
      if(!scholars.has(id)){const a=createActor(world.npc,key,world.gems[0].material.envMap,heads);a.home.set(...p);a.root.position.copy(a.home);a.root.rotation.y=id==='division'?-.1:-.6;scene.add(a.root);scholars.set(id,a);}
      scholars.get(id).root.visible=region==='crypt';
    }
  }
  return { stage, syncScholars, arena,
    telegraph(move){telegraph=move;},
    shake(amount){trauma=Math.min(1,trauma+amount);},
    kick(amount){kick=amount;},
    rage(value){rage=value?1:0;inferno.setRage(rage);active.forEach(a=>a.enrage?.(value));},
    taunt(){active.forEach(a=>a.laugh?.());},
    expose(){exposed=true;},
    play(kind,move,{reduced=false,onImpact=()=>{}}={}){
      action={kind,move,time:0,start:performance.now(),duration:reduced?.18:.82,playerSound:false,enemySound:false,onImpact,reduced,target:active.length>1?attackSequence++%2:0};
      return action.duration*1000;
    },
    cancelAction(){action=null;effects.visible=false;impactMaterial.opacity=guardMaterial.opacity=0;},
    unite(step){endingStep=step;joined.visible=true;light.color.set('#e4d2aa');},
    inspect:()=>({chapter,roles:active.map(a=>a.role),action:action?.kind||null,exposed,endingStep}),
    setRegion(value,state){
      region=value;arena.visible=['arena','archive'].includes(value);const climax=value==='arena'&&chapter==='exile';
      const own=value==='arena'&&!climax&&backdrop?backdrop.atmosphere:null;
      scene.background.set(own?own.background:climax?'#140604':'#101a22');scene.fog.color.set(own?own.fog:climax?'#1c0805':'#18242b');scene.fog.density=own?own.density:climax?.022:.027;
      for(const a of scholars.values())a.root.visible=value==='crypt';syncScholars(state);
    },
    win(){active.forEach(a=>a.win());},
    reward(id){chapter=id;recovering=true;recoveryTime=0;reward.visible=true;reward.material.color.set(id==='exile'?'#bdb5d2':CHAPTERS[id].color);reward.material.attenuationColor.copy(reward.material.color);active.forEach(a=>{if(!a.keepOnReward)a.root.visible=false;});},
    setQuality(){for(const gem of [reward,archiveGem]){gem.material.transmission=world.getQuality()==='performance'?0:.92;gem.material.needsUpdate=true;}backdrop?.setQuality?.(world.getQuality());},
    async prepare(){
      const visible=reward.visible;
      try{
        // Include the future reward in shader and transmission-pass preparation.
        // First-use work belongs behind the chamber loader, before victory.
        if(arena.visible)reward.visible=true;
        await world.renderer.compileAsync(scene,world.camera);
        if(arena.visible)world.renderer.render(scene,world.camera);
      }finally{reward.visible=visible;}
    },
    update(dt,reduced,time){
      if(arena.visible){
        if(finalBackdrop.visible){
          for(let i=0;i<16;i++){
            const side=i<8?-1:1,j=i%8,phase=reduced?1:time*3+j;
            firePose.position.set(center+side*3.5+Math.sin(j*2.3)*.24,1.45+(j%3)*.18,-3.8+Math.cos(j)*.17);
            firePose.rotation.set(0,Math.sin(j)*.15,Math.sin(j*3)*.1);firePose.scale.set(.6+(j%2)*.15,1.3+Math.sin(phase)*.13+(j%3)*.28,1);firePose.updateMatrix();finalFlames.setMatrixAt(i,firePose.matrix);
          }
          finalFlames.instanceMatrix.needsUpdate=true;fireSpill.intensity=100+(reduced?0:Math.sin(time*6)*6);inferno.update(time,reduced);
        }
        let blow=0,struck=0;
        active.forEach((a,i)=>{
          if(a.custom){if(!action)a.pose({telegraph:a.defeated?null:telegraph});a.update(dt,reduced,time);return;}
          a.update(dt,reduced,time);a.weapon.rotation.z=0;
          if(telegraph&&!action&&!a.defeated&&!reduced){
            const warning=telegraph.damage>1?.16:telegraph.kind==='feint'?.09:.025;
            a.weapon.rotation.z=Math.sin(time*2+i)*warning;
            a.weapon.rotation.x=telegraph.kind==='windup'?-.4:0;
          }
        });
        effects.visible=!!action;impactMaterial.opacity=guardMaterial.opacity=0;
        if(action){
          action.time=(performance.now()-action.start)/1000;const t=Math.min(1,action.time/action.duration);
          if(t>=.22&&!action.playerSound){action.playerSound=true;if(action.kind==='attack')action.onImpact('impact');}
          if(t>=.65&&!action.enemySound){action.enemySound=true;if(action.move.damage){action.onImpact(`enemy_${chapter}`);if(action.kind==='defend')action.onImpact('guard');}}
          const hit=action.kind==='attack'?Math.max(0,1-Math.abs(t-.28)*8):0;
          const victim=active[action.target];impact.position.x=slash.position.x=victim?.home.x||center;impact.position.y=victim?.hitHeight||(victim?.root.scale.y||1.2)*1.16;impact.position.z=slash.position.z=(victim?.home.z??-1)+.75+(victim?.custom?victim.hitDepth??1.2:0);
          playerWeapon.visible=action.kind==='attack'&&!reduced;playerWeapon.position.set(center+.5-Math.sin(t*Math.PI)*.7,.9,2.8);playerWeapon.rotation.z=-1+t*2.4;
          const strike=action.move.damage?Math.max(0,Math.sin(Math.max(0,(t-.45)/.55)*Math.PI)):0;
          if(!reduced){
            blow=strike;struck=hit;
            active.forEach((a,i)=>{const recoil=i===action.target?hit:0;const attack=(active.length===1||action.move.kind==='double'||i===0)?strike:0;if(a.custom){a.pose({telegraph:action.move,strike:attack,recoil,progress:t});return;}a.react(recoil+attack);a.root.position.z-=recoil*.2;a.root.rotation.z+=recoil*.09;a.root.position.z+=attack*(action.move.kind==='double'?1:.65);a.weapon.rotation.z=(i%2?-1:1)*attack*1.5;});
          }
          impactMaterial.opacity=reduced?0:hit*.9;impact.scale.setScalar((.6+hit*1.4)*(victim?.custom?2:1));
          sparkMaterial.opacity=reduced?0:hit;const burst=Math.min(1,Math.max(0,(t-.22)*4));
          for(let i=0;i<24;i++){const d=sparkDirs[i];dummy.position.set(impact.position.x+d.x*burst*1.3,impact.position.y+d.y*burst*1.1-burst*burst*.5,impact.position.z+d.z*burst);dummy.rotation.set(i,i*2,0);dummy.scale.setScalar(hit*(.6+(i%4)*.25));dummy.updateMatrix();sparks.setMatrixAt(i,dummy.matrix);}sparks.instanceMatrix.needsUpdate=true;slash.rotation.z=-.8+t*1.9;
          guardMaterial.opacity=action.kind==='defend'?(reduced?.25:strike*.6):0;
          for(let i=0;i<8;i++){dummy.position.set(impact.position.x+Math.cos(i)*hit*.7,impact.position.y+Math.sin(i)*hit*.6,.1);dummy.scale.setScalar(hit);dummy.updateMatrix();motes.setMatrixAt(i,dummy.matrix);}motes.instanceMatrix.needsUpdate=true;
          if(t===1)action=null;
        }
        backdrop?.update(time,reduced,dt,{kind:(action?.move||telegraph)?.kind,strike:blow,hit:struck,defeated:active.length>0&&active.every(a=>a.defeated)});
        if(recovering){recoveryTime=Math.min(1,recoveryTime+(reduced?1:dt));reward.position.y=1.5+recoveryTime*.7;reward.scale.setScalar((chapter==='exile'?1.65:1)*(.3+.7*recoveryTime));reward.rotation.y=reduced?.4:time*.35+recoveryTime*Math.PI;}
        archiveGem.rotation.y=reduced?.3:time*.22;
        if(!reduced&&(trauma>0||kick>0)){
          const amount=trauma*trauma,cam=world.camera;
          cam.position.x+=(Math.sin(time*71)+Math.sin(time*113)*.5)*amount*.09;cam.position.y+=(Math.cos(time*83)+Math.sin(time*57)*.5)*amount*.07;
          cam.rotateZ(Math.sin(time*67)*amount*.025);cam.translateZ(-kick*.35);cam.updateMatrixWorld();
        }
        trauma=Math.max(0,trauma-dt*1.8);kick=Math.max(0,kick-dt*3.2);
        if(endingStep>=0){joined.children.forEach((gem,i)=>{const angle=i*Math.PI*2/3+(reduced?0:time*.12);gem.position.set(center-1.65+Math.cos(angle)*(.9-endingStep*.12),1.65+endingStep*.12,-.7+Math.sin(angle)*.6);});light.intensity=100+endingStep*15;}
      }
      if(region==='crypt')for(const a of scholars.values())a.update(dt,reduced,time);
    }
  };
}
