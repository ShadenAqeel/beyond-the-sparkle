import * as T from 'three';

// The prototype's constrained camera paths, with one saved exploration origin per inspection.
export function createNavigation(world, { reduced, hidePanel, panelOpen, onLocation, onSettled }) {
  const base = new T.Vector3(...world.overview.camera), target = new T.Vector3(...world.overview.target), mouse = new T.Vector2();
  let exploration = pose('shrine', world.overview), origin = null, route = null, travel = null, returning = false;
  function pose(location, view) { return { location, camera: [...view.camera], target: [...view.target] }; }
  function transition(destination, waypoints=[], done=()=>{}, duration) {
    hidePanel();const points=[base.clone(),...waypoints.map(p=>new T.Vector3(...p)),new T.Vector3(...destination.camera)];
    const curve=points.length===2?new T.LineCurve3(points[0],points[1]):new T.CatmullRomCurve3(points,false,'centripetal');
    travel={curve,from:target.clone(),to:new T.Vector3(...destination.target),end:new T.Vector3(...destination.camera),progress:0,start:performance.now(),duration:reduced()?1:duration||(waypoints.length?2800:1100),done};return curve;
  }
  function go(location,view,{instant=false,done=()=>{}}={}) {
    const crypt=exploration.location==='crypt'&&location==='shrine';origin=null;route=null;returning=false;exploration=pose(location,view);onLocation(location);
    if(instant){travel=null;hidePanel();base.set(...view.camera);target.set(...view.target);onSettled();done();}
    else transition(view,crypt?[[10.2,-1.3,-1],[10.2,1.8,4.7],[7,2.8,5.8]]:[],()=>{onSettled();done();});
  }
  function inspect(id,done) {
    if(travel)return;
    const anchor=world.anchors[id];if(!anchor)return;
    origin=pose(exploration.location,exploration);const location=anchor.location||exploration.location;
    const down=location==='crypt'&&exploration.location==='shrine';
    onLocation(location);
    route=transition(anchor,down?[[7,2.6,5.1],[10.2,1.8,4.5],[10.2,-.9,-.6]]:[],()=>{
      if(id==='stairs')exploration=pose('crypt',anchor);
      onSettled();done();
    });
  }
  function close() {
    if(!origin||returning)return;
    const destination=origin,curve=travel?.curve||route,progress=travel?.progress??1;
    const waypoints=curve?.points?.length>2?[.8,.6,.4,.2].map(f=>curve.getPointAt(progress*f).toArray()):[];
    origin=null;route=null;returning=true;exploration=destination;onLocation(destination.location);
    transition(destination,waypoints,()=>{returning=false;onSettled();},waypoints.length?2200:850);
  }
  function update(now) {
    if(travel){const u=T.MathUtils.clamp((now-travel.start)/travel.duration,0,1),e=u*u*(3-2*u);travel.progress=e;base.copy(travel.curve.getPointAt(e));target.lerpVectors(travel.from,travel.to,e);
      if(u===1){base.copy(travel.end);target.copy(travel.to);const done=travel.done;travel=null;done();}}
    world.camera.position.copy(base);if(!reduced()&&!travel&&!panelOpen()){world.camera.position.x+=mouse.x*.12;world.camera.position.y+=mouse.y*.07;}
    world.camera.lookAt(target);world.camera.updateMatrixWorld();
  }
  return {go,inspect,close,update,mouse,isBusy:()=>!!travel,snapshot:()=>({location:exploration.location,camera:base.toArray(),target:target.toArray(),busy:!!travel,returning,hasOrigin:!!origin}),location:()=>exploration.location};
}
