import {loadResearch} from './codex.js';

const base=import.meta.env.BASE_URL;
const svgNS='http://www.w3.org/2000/svg';
function button(parent,text,action,className='') {
  const el=document.createElement('button');el.type='button';el.textContent=text;el.className=className;el.onclick=action;parent.append(el);return el;
}
function paragraph(parent,text,className='') {
  const el=document.createElement('p');el.textContent=text;el.className=className;parent.append(el);return el;
}
function svg(parent,label) {
  const el=document.createElementNS(svgNS,'svg');el.setAttribute('viewBox','0 0 440 190');el.setAttribute('role','img');el.setAttribute('aria-label',label);parent.append(el);return el;
}
function dot(plot,x,y,color,r=3) {
  const el=document.createElementNS(svgNS,'circle');for(const [key,value] of Object.entries({cx:x,cy:y,r,fill:color}))el.setAttribute(key,value);plot.append(el);return el;
}

// Discovery widgets teach first, then ask the player to act. No technical quiz gate.
export async function mountDiscovery(id,{container,isLive,onSolved,hint}) {
  const root=document.createElement('div');root.className=`discovery discovery-${id}`;container.append(root);
  const feedback=document.createElement('p');feedback.className='discovery-feedback';feedback.setAttribute('role','status');
  const controls=document.createElement('div');controls.className='discovery-controls';
  let solved=false;
  function finish(){if(!isLive()||solved)return;solved=true;onSolved();}
  function wrong(text){feedback.textContent=text;}
  button(controls,'A hint',()=>wrong(hint));
  function complete(label='Use this discovery'){button(controls,label,finish,'discovery-complete');}
  try {
    if(id==='form') {
      paragraph(root,'The executioner balances these records. A solid stone cannot have zero length, width or depth. Touch the record that cannot describe a real diamond.');
      const response=await fetch(`${base}data/challenge-records.json`);if(!response.ok)throw Error('The ledger could not load.');const source=await response.json();if(!isLive())return;
      const cards=document.createElement('div');cards.className='record-cards';root.append(cards);
      source.records.forEach(record=>{
        const b=button(cards,`Record ${record.record}`,()=>{
          if([record.x,record.y,record.z].some(n=>n<=0)){
            b.classList.add('found');feedback.textContent=`Record ${record.record}: z = 0 mm. The balance releases its chain. Physical dimensions must be positive.`;if(!root.querySelector('.discovery-complete'))complete('Release the balance');
          }else wrong('These dimensions are positive. The impossible record has no physical depth. You can try again.');
        },'record-card');
        const icon=document.createElement('span');icon.className='record-gem';icon.textContent='◇';b.append(icon);
        const measurements=document.createElement('span');measurements.textContent=`${record.carat} ct · x ${record.x} · y ${record.y} · z ${record.z} mm`;b.append(measurements);
      });
      paragraph(root,'Actual CSV records. The story’s royal ledger and seal are fictional.','discovery-source');
    } else if(id==='division') {
      paragraph(root,'Look at weight and physical dimensions together. Tap the two collections to see how their stones compare, then pair the unassigned stone with a similar profile.');
      const data=await loadResearch();if(!isLive())return;
      const columns=data.sample.columns,idx=name=>columns.indexOf(name);
      const small=data.sample.rows.find(r=>r[idx('kmeans_before')]===1&&r[idx('carat')]>=.4&&r[idx('carat')]<=.5);
      const large=data.sample.rows.find(r=>r[idx('kmeans_before')]===0&&r[idx('carat')]>=1.1&&r[idx('carat')]<=1.2);
      const profiles=document.createElement('div');profiles.className='collection-trays';root.append(profiles);const viewed=new Set();
      for(const [name,row,key] of [['Lighter collection',small,'small'],['Heavier collection',large,'large']]){
        const b=button(profiles,`${name} · ${row[idx('carat')]} ct`,()=>{viewed.add(key);b.classList.add('found');feedback.textContent=`Source row ${row[0]}: ${row[idx('carat')]} carats. Compare this with the collection medians: 0.41 and 1.11 carats.`;});
        const glyph=document.createElement('span');glyph.className=`tray-gem ${key}`;glyph.textContent='◇';b.prepend(glyph);
      }
      paragraph(root,'Unassigned profile: median of the smaller fitted group — 0.41 ct; the physical dimensions are shown below.');
      const profile=data.profiles.before.find(p=>p.semantic==='smaller');
      paragraph(root,`x ${profile.medians.x} · y ${profile.medians.y} · z ${profile.medians.z} mm. These are full-group medians, not a synthetic individual diamond.`,'discovery-source');
      for(const [label,key] of [['Pair with lighter collection','small'],['Pair with heavier collection','large']])button(controls,label,()=>{
        if(viewed.size<2){wrong('Explore both collections first. No method name is needed—compare their physical profiles.');return;}
        if(key==='small'){feedback.textContent='The lighter profiles belong together. The oath-chain separates into two strands.';if(!root.querySelector('.discovery-complete'))complete('Break the connection');}
        else wrong('Compare the 0.41 ct profile with the lighter collection. Try the other pairing.');
      });
    } else if(id==='memory') {
      paragraph(root,'Six physical measurements speak at once. Each principal-component window combines all six into a new axis. Open both windows to see the same observations in two dimensions.');
      const source=await loadResearch();if(!isLive())return;
      const axes=document.createElement('div');axes.className='measurement-ribbons';root.append(axes);
      ['carat','depth','table','x','y','z'].forEach((name,i)=>{const p=paragraph(axes,name);p.style.setProperty('--ribbon',`${30+i*11}%`);});
      const plot=svg(root,'Six-feature representation awaiting two principal components'),active=new Set();
      const result=paragraph(root,'Two windows closed.','discovery-result');
      for(const component of ['PC1','PC2']){const b=button(controls,`Activate ${component}`,()=>{
        active.add(component);b.disabled=true;b.setAttribute('aria-pressed','true');result.textContent=active.size===1?'One new axis is open. Open the second to reveal the plane.':'Six features → two components. 88.12% retained; 11.88% not retained.';
        axes.classList.add('folded');
        if(active.size===2){plot.setAttribute('aria-label','Actual PC1 PC2 projection, 88.12 percent variance retained');for(const row of source.sample.rows.filter((_,i)=>i%6===0)){dot(plot,35+(row[1]+3.5)*32,95-row[2]*11,row[4]===0?'#82B5C6':'#C6A574',2.4);}complete('See through the veil');}
      });b.setAttribute('aria-pressed','false');}
      paragraph(root,'Actual notebook projection; a 301-point display subset of the verified 1,804-row visualization sample. PCA is a new representation, not a selection of two original features.','discovery-source');
    } else {
      paragraph(root,'Density asks who has enough neighbors. Touch the isolated marks beyond the gathering. A position outside this circle does not make a stone defective.');
      const field=document.createElement('div');field.className='density-field';field.setAttribute('aria-label','Illustrative density diagram');root.append(field);
      const gathering=button(field,'Examine the dense gathering',()=>wrong('These observations have many nearby neighbors. Look beyond the gathering for the isolated marks.'),'dense-gathering');
      for(let i=0;i<24;i++){const p=document.createElement('span');p.className='density-dot';p.style.left=`${38+Math.sin(i*2.4)*13}%`;p.style.top=`${48+Math.cos(i*1.7)*25}%`;field.append(p);}
      const selected=new Set();
      for(const [i,x,y] of [[0,9,15],[1,86,80],[2,90,19]]){const label=`Isolated observation ${i+1}`;const b=button(field,label,()=>{selected.add(i);b.classList.add('found');b.setAttribute('aria-pressed','true');feedback.textContent=`${selected.size} of 3 isolated marks examined. Noise describes a density rule, not a flaw.`;if(selected.size===3&&!root.querySelector('.discovery-complete'))complete('Stand beyond the boundary');},'isolated-mark');b.style.left=`${x}%`;b.style.top=`${y}%`;b.setAttribute('aria-label',label);b.setAttribute('aria-pressed','false');}
      paragraph(root,'Illustrative teaching diagram: three selectable marks do NOT represent the study’s noise count. The real two-component DBSCAN fit had 311 noise observations.','discovery-source');
    }
    if(!isLive())return;root.append(feedback,controls);
  } catch(error) {
    if(!isLive())return;paragraph(root,error.message);button(root,'Try the discovery again',()=>{root.remove();mountDiscovery(id,{container,isLive,onSolved,hint});});
  }
}

export function mountScholarEvidence(container,id){
  const visual=document.createElement('div');visual.className=`scholar-evidence scholar-${id}`;
  const marks=id==='form'?['53,940','−47','53,893','carat · depth · table · x · y · z']:id==='division'?['◇ 1.11 ct','◇ 0.41 ct','Two physical profiles · price observed afterward']:['6 measurements','PC1 + PC2','88.12% retained','11.88% not retained'];
  marks.forEach(text=>paragraph(visual,text));container.append(visual);
}
