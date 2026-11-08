// Original optional synthesized ambience; begins only after explicit interaction.
let context, master, sources = [];
export async function setAmbience(enabled) {
  if (!enabled) { if (context) await context.suspend(); return; }
  const Audio = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Audio) throw new Error('Audio is unavailable in this browser.');
  if (!context) {
    context = new Audio();
    master = context.createGain(); master.gain.value = .025; master.connect(context.destination);
    for (const hz of [98, 146.83]) {
      const tone = context.createOscillator(); tone.type = 'sine'; tone.frequency.value = hz;
      tone.connect(master); tone.start(); sources.push(tone);
    }
  }
  await context.resume();
}
