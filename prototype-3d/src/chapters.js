export const MAIN_CHAPTERS = ['form', 'division', 'memory'];
export const COMBAT_LINES={
  form:{intro:'“The seal does not make you worthy.”',victory:'The balance falls silent.',epithet:'Executioner of the Royal Ledger',
    taunts:['Weighed.','Found wanting.','The scale never lies.','Kneel.'],hurt:['Impossible…','The balance tips.'],win:'Another false measure.'},
  division:{intro:'“One oath. Two blades.”',victory:'The oath-chain breaks.',epithet:'Two Blades, One Oath',
    taunts:['Choose a side.','Together.','You cannot face us both.','Divided, you fall.'],hurt:['Brother!','Hold the line!'],win:'Divided, as foretold.'},
  memory:{intro:'“Which of us do you trust?”',victory:'The reflections fall still.',epithet:'She Who Remembers Twice',
    taunts:['Am I here?','Look closer.','Which of me is real?','Forget.'],hurt:['You saw me…','The glass cracks.'],win:'You will not remember this.'},
  exile:{intro:'“Some doors should remain closed.”',victory:'The last guardian lowers its blade.',epithet:'The Fire Beneath the Seal',
    taunts:['Burn.','You opened the seal.','I was erased. You will be too.','Kneel before the fire.'],hurt:['…','You remember my name?'],rage:'ENOUGH. BURN WITH ME.',win:'Ash, like the rest.'}
};

// Fictional testimony is deliberately separate from the verified research exports.
export const CHAPTERS = {
  form: {
    name: 'Form', boss: 'The Hollow Scale', chamber: 'Chamber of Form', scholar: 'The Stonekeeper', color: '#C6A574',
    intro: '“Another bearer of the royal seal. They still send you here with the same story.” The executioner lowers an enormous balance. A ledger lies beneath its unbroken chain.',
    clue: 'The scale rises slowly. When it falls, hold your ground. The ledger may explain what keeps its armor sealed.',
    investigate: 'Examine the chained ledger', discoveryTitle: 'A stone with no depth',
    victory: 'The balance strikes the floor. “Read the date beneath the seal. Then ask your king when his treasure vanished.” The guardian turns away from the stone.',
    recovery: 'The royal seal is intact. Beneath it: a date later than the alleged theft. Someone inspected this stone after it supposedly disappeared.',
    mystery: 'Why does a stolen diamond carry an unbroken royal seal?',
    lore: 'A royal inventory names this stone the first of three stolen treasures. The empty socket bears the same seal as the guardian’s ledger.',
    dialogue: [
      '“I wrote those inventories. Forty years counting stones, and I never questioned the date. Let me see what you found.” The Stonekeeper’s hand stops over the unbroken seal.',
      '“The depth cannot be zero. We rejected 47 inconsistent records; 53,893 remained. We brought six physical measurements onto one scale. Price and grades stayed outside it. But this seal… I cannot account for it.”'
    ],
    takeaway: 'The keeper of the royal inventories',
    scholarVisual: '47 marks fade from the ledger. Six measurement columns remain; price is set aside.',
    result: 'A zero physical dimension cannot describe a real stone. The verified study removed 47 records and standardized carat, depth, table, x, y and z. Price and grades were excluded.',
    hint: 'A solid diamond needs positive length, width and depth. Look for a zero in x, y or z.',
    health: 14, playerHealth: 4,
    pattern: [
      {name:'The balance rises',damage:0,kind:'windup',hint:'Its weapon is high. Strike before the weight falls.'},
      {name:'Sentence of iron',damage:3,kind:'slam',hint:'The whole balance is falling. Defend.'},
      {name:'Weight in the stone',damage:0,kind:'recover',hint:'The weapon is embedded. An opening.'},
      {name:'Chain sweep',damage:1,kind:'sweep',hint:'A short sweep. A guarded strike can pass through.'}
    ]
  },
  division: {
    name:'Division',boss:'The Twin Warden',chamber:'Hall of Division',scholar:'The Divider',color:'#82B5C6',
    intro:'“Name your allegiance.” The plated knight bars the way. Beside it, a slender blade answers: “He has already been given one.” Their weapons are joined by the same oath-chain.',
    clue:'One advances while the other waits. Their paired collection may reveal how to sever the chain.',
    investigate:'Study the paired collection',discoveryTitle:'Which stones belong together?',
    victory:'The chain loosens. The smaller knight says, “We swore the same words.” The larger answers, “But they carved us as enemies.” Both weapons lower.',
    recovery:'Two names are engraved inside the stone’s setting. The official history calls them rivals; the inscription records one shared oath.',
    mystery:'Why do enemies share the same oath?',
    lore:'Two figures face away from one another in the carving. Below their feet, an older line joins their hands.',
    dialogue:[
      '“Order needs boundaries.” The Divider straightens two overlapping pages. “I separated the collections. I did not write that the keepers hated one another. Who added that sentence?”',
      '“Our method found two size-based groups: median weights 1.11 and 0.41 carats. Median prices differed too, but price never formed the groups. I described a difference. The court made it a hierarchy.”'
    ],
    takeaway:'The researcher who drew the boundary',scholarVisual:'Two overlapping trays separate by physical profile; their oath-chain remains a single line.',
    result:'You compared physical profiles before naming a method. K-Means found two size-based groups in six standardized measurements. Price was observed afterward, not used to assign groups.',
    hint:'Compare carat and x/y/z together. A similar physical profile matters more than price or a single color.',
    health:14,playerHealth:5,
    pattern:[
      {name:'The light blade advances',damage:1,kind:'lunge',hint:'Only the agile knight is moving.'},
      {name:'Two weapons, one oath',damage:3,kind:'double',hint:'Both prepare to strike. Defend the coordinated attack.'},
      {name:'The chain falls slack',damage:0,kind:'recover',hint:'They are changing places. Strike now.'}
    ]
  },
  memory:{
    name:'Memory',boss:'The Veiled Mirror',chamber:'Hall of Reflections',scholar:'The Seer',color:'#A56E75',
    intro:'“I remember the doors opening.” A second reflection whispers, “I remember them closing.” Six shards turn around a figure whose feet never touch the floor.',
    clue:'Not every movement is a blow. Find a simpler view before trusting a reflection.',
    investigate:'Align the six reflections',discoveryTitle:'Six voices, two windows',
    victory:'The reflections settle into two clear planes. “A memory may be faithful and still leave something out.” A figure in the mirror wears the scholars’ seal; its face has been scratched away.',
    recovery:'The stone holds two memories of the same door: one witness sees it opening, another sees it closing. Neither memory shows who stood on the other side.',
    mystery:'What did both memories leave outside the frame?',
    lore:'Six narrow grooves converge into two polished windows. The missing parts have not been erased; there is simply no room for them here.',
    dialogue:[
      '“I saw the door close. The Stonekeeper says it opened. I called him a liar.” The Seer touches a silver ornament. “Perhaps I mistook the edge of my view for the edge of the world.”',
      '“Two components carried 88.12% of the variation in six measurements. Not everything survived. The silhouette changed from 0.429 to 0.487 in different spaces; a clearer reflection alone cannot prove a better answer.”'
    ],
    takeaway:'The witness who remembered a fragment',scholarVisual:'Six measurements fold into a real PC1/PC2 projection. An unfilled portion remains: 11.88%.',
    result:'PCA creates new axes from all six standardized inputs; it does not simply select two original features. PC1 and PC2 retain 88.12% of variance. The rest is not retained in this view.',
    hint:'Activate both component windows. Each combines all six measurements. Then compare the simplified projection with what it leaves behind.',
    health:13,playerHealth:3,
    pattern:[
      {name:'A reflection draws its blade',damage:0,kind:'feint',hint:'Its feet cast no shadow. This movement is a feint.'},
      {name:'The true edge brightens',damage:2,kind:'lunge',hint:'The central figure moves. Defend the real strike.'},
      {name:'The mirror clouds',damage:0,kind:'recover',hint:'The false images fade. Strike the true figure.'}
    ]
  },
  exile:{
    name:'Exile',boss:'The Nameless Exile',chamber:'Chamber Beneath the Shrine',scholar:'The Nameless Exile',color:'#738F89',
    intro:'“Three names returned. Mine is still missing.” The knight draws a broken greatsword across the threshold. “Before you pass, look at those your scholars left beyond the circle.”',
    clue:'The broken blade changes its rhythm when the armor cracks. Read each movement; the opening comes after the heaviest strike.',
    investigate:'Look beyond the circle',discoveryTitle:'Who stands outside?',
    victory:'The knight kneels without surrendering the blade. “They removed our names from the account. Not because we were false. Because we did not fit.” A fourth seal opens on the Eclipse Diamond.',
    recovery:'An erased signature returns beneath the scholars’ seals. The Eclipse bears a key-shaped fracture. “Ask the last scholar what he chose not to tell you.”',
    mystery:'What did the order deliberately leave out?',
    dialogue:[],takeaway:'A name restored to the account',
    result:'DBSCAN labels noise relative to density settings, not worth or defects. In the verified two-component fit: 53,582 observations in one cluster and 311 noise observations. K-Means instead partitions into two groups.',
    hint:'Look outside the dense gathering. This teaching diagram illustrates isolation; the actual model used the full dataset and its chosen density settings.',
    health:22,playerHealth:7,
    pattern:[
      {name:'The oathblade turns',damage:2,kind:'sweep',hint:'The blade crosses the threshold. Defend.'},
      {name:'The knight gathers its weight',damage:0,kind:'windup',hint:'The broken blade is still. A brief opening.'},
      {name:'Judgment without a name',damage:3,kind:'slam',hint:'A full descending blow. Brace behind your guard.'},
      {name:'An oath catches on the floor',damage:0,kind:'recover',hint:'The blade is caught. Strike.'}
    ],
    secondPattern:[
      {name:'The forgotten oath',damage:3,kind:'double',hint:'The cracked armor exposes an opening—but both hands raise the blade. Defend first.'},
      {name:'A name almost spoken',damage:0,kind:'recover',hint:'The knight falters. Strike the opening.'},
      {name:'The last boundary',damage:2,kind:'lunge',hint:'One final forward thrust. Keep your guard.'},
      {name:'The empty hand',damage:0,kind:'recover',hint:'The sword lowers. An opening remains.'}
    ]
  }
};

export const FINALE = [
  '“I recorded the voice that sent you here.” The Old Scholar removes the royal seal from his robe. “The diamonds were never stolen. We set the guardians to protect our unfinished records. Then I let a simpler legend take our place.”',
  '“One of us trusted measurements. One drew divisions. One preserved reflections. We concealed the account that would not fit. Each discovery was real; none was the whole picture. You returned what we could no longer bring ourselves to connect.”',
  '“Six measurements. Two windows. Much retained; something always left outside. We searched the stones for certainty. You listened to what connected them.” He places the last seal beside the Eclipse. “Let their names remain.”'
];

export function nextMystery(state, id) {
  if(id==='exile')return 'The erased account leads to the Hidden Archive.';
  const next=MAIN_CHAPTERS.find(key=>key!==id&&!state.bosses[key].collected);
  return next ? `${CHAPTERS[id].mystery} An unanswered account waits in ${CHAPTERS[next].chamber}.` : 'The three accounts do not agree. Beneath the seal, a fourth name has begun to appear.';
}
