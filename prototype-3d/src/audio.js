export function createAudio() {
  let context,gain,muted=true;
  async function setMuted(value){
    if(!context&&!value){context=new AudioContext();gain=context.createGain();gain.gain.value=0;gain.connect(context.destination);[55,82.41,110.2].forEach((hz,i)=>{const oscillator=context.createOscillator(),level=context.createGain();oscillator.frequency.value=hz;level.gain.value=.04/(i+1);oscillator.connect(level);level.connect(gain);oscillator.start();});}
    muted=value;if(context){await context.resume();gain.gain.setTargetAtTime(muted?0:.45,context.currentTime,.5);}return muted;
  }
  let noiseBuffer;
  // Short filtered noise bursts give strikes, parries and hurts physical weight.
  function noise(t,{duration=.18,freq=900,q=.8,level=.22,type='lowpass'}={}){
    if(!noiseBuffer){noiseBuffer=context.createBuffer(1,context.sampleRate*.6,context.sampleRate);const d=noiseBuffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}
    const src=context.createBufferSource(),filter=context.createBiquadFilter(),g=context.createGain();src.buffer=noiseBuffer;filter.type=type;filter.frequency.value=freq;filter.Q.value=q;
    g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);src.connect(filter);filter.connect(g);g.connect(gain);src.start(t);src.stop(t+duration+.05);
  }
  function thump(t,hz=60,level=.35,duration=.35){const o=context.createOscillator(),g=context.createGain();o.frequency.setValueAtTime(hz*2.2,t);o.frequency.exponentialRampToValueAtTime(hz,t+.08);g.gain.setValueAtTime(level,t);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(gain);o.start(t);o.stop(t+duration+.05);}
  const percussion={
    attack:t=>noise(t,{duration:.12,freq:2600,type:'bandpass',q:1.2,level:.12}),
    impact:t=>{thump(t,70,.4);noise(t,{duration:.2,freq:1400,level:.3});},
    crit:t=>{thump(t,55,.5,.5);noise(t,{duration:.35,freq:3200,type:'highpass',level:.18});},
    finisher:t=>{thump(t,42,.6,.8);thump(t+.09,38,.5,.8);noise(t,{duration:.6,freq:700,level:.35});},
    hurt:t=>{thump(t,48,.55,.5);noise(t,{duration:.3,freq:500,level:.3});},
    parry:t=>{noise(t,{duration:.25,freq:4200,type:'bandpass',q:6,level:.3});thump(t,140,.2,.2);},
    guard:t=>noise(t,{duration:.15,freq:3000,type:'bandpass',q:4,level:.16}),
    engage:t=>{thump(t,45,.5,.9);thump(t+.32,45,.5,.9);},
    rage:t=>{thump(t,36,.6,1.4);noise(t,{duration:1.2,freq:300,level:.25});},
    enemy_exile:t=>{thump(t,40,.55,.6);noise(t,{duration:.4,freq:600,level:.28});}
  };
  function cue(kind='flame'){
    if(!context||muted)return;
    if(percussion[kind]){percussion[kind](context.currentTime);if(['parry','rage','engage','finisher'].includes(kind)===false&&kind!=='enemy_exile')return;}
    const tones={impact:[73.42,146.83],guard:[174.61,349.23],discovery:[293.66,440],recovery:[329.63,493.88,659.25],activation:[130.81,196,261.63],enemy_form:[36.71,55],enemy_division:[146.83,220],enemy_memory:[277.18,415.3],enemy_exile:[41.2,61.74,82.41],rage:[36.71,51.91,73.42],engage:[73.42,110],parry:[880,1318.5],finisher:[130.81,261.63,392],flame:[130.81,196],form:[220,330],division:[174.61,261.63],memory:[196,293.66],exile:[65.41,98],npc:[164.81,246.94],door:[55,82.41],gate:[36.71,55],codex:[392,523.25],victory:[261.63,392,523.25],attack:[110],defend:[164.81]}[kind]||[110];
    tones.forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.1;o.type=kind==='gate'?'triangle':'sine';o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(hz*.97,t+1.2);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+1.6);o.connect(g);g.connect(gain);o.start(t);o.stop(t+1.7);});
  }
  document.addEventListener('visibilitychange',()=>{if(context){if(document.hidden)context.suspend();else if(!muted)context.resume();}});
  return {setMuted,cue,isMuted:()=>muted};
}
