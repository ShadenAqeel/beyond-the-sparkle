"""Original vector stage art; production swap-in slots are documented in assets/README.md."""
from pathlib import Path
import random
R=Path(__file__).resolve().parents[1]/'assets'
random.seed(42)
G='#C6A574'; T='#738F89'; I='#F2EEE7'; B='#101519'; P='#1B2328'; S='#2C3337'
DEFS=f'''<defs>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="{S}"/><stop offset="1" stop-color="{B}"/></linearGradient>
<linearGradient id="stone" x2=".8" y2="1"><stop stop-color="{S}"/><stop offset="1" stop-color="{P}"/></linearGradient>
<radialGradient id="mist"><stop stop-color="{T}" stop-opacity=".27"/><stop offset="1" stop-color="{T}" stop-opacity="0"/></radialGradient>
<radialGradient id="gold"><stop stop-color="{G}" stop-opacity=".4"/><stop offset="1" stop-color="{G}" stop-opacity="0"/></radialGradient>
<filter id="paper"><feTurbulence baseFrequency=".42" numOctaves="3" seed="42" type="fractalNoise"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light"/></filter>
<filter id="glow"><feGaussianBlur stdDeviation="5"/></filter>
<g id="pillar"><path d="M-48 0H48L37 38L30 350L50 366V388H-50V366L-30 350L-37 38Z" fill="url(#stone)" stroke="{T}" stroke-opacity=".23"/><path d="M-25 48V344M-12 48V344M4 48V344M19 48V344" stroke="{B}" stroke-width="3"/><path d="M-44 16H44M-40 26H40M-38 363H38M-45 377H45" stroke="{G}" stroke-opacity=".22"/></g>
<g id="lamp"><path d="M-3 4V72M-17 72H17L11 92H-11Z" fill="{P}" stroke="{G}" stroke-opacity=".7"/><ellipse cy="83" rx="50" ry="55" fill="url(#gold)"/><path d="M0 72Q-9 85 0 88Q8 82 0 72" fill="{G}"/></g>
</defs>'''
def svg(content,w=1600,h=1000):
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{DEFS}{content}</svg>'
def write(path,content): (R/path).write_text(content)
# Ruined circular sanctuary, six deliberately separated interaction anchors.
a=[f'<rect width="1600" height="1000" fill="url(#sky)"/>']
a += [f'<path d="M{c} 600V{170+abs(c-800)*.13:.0f}Q{c+50} 90 {c+95} 210V600Z" fill="{B}" opacity=".7"/>' for c in range(-80,1700,170)]
a.append(f'<circle cx="800" cy="220" r="150" fill="none" stroke="{T}" stroke-width="36" opacity=".16"/><circle cx="800" cy="220" r="120" fill="none" stroke="{G}" stroke-opacity=".13"/><path d="M640 230L450 900H1170L950 240Z" fill="{T}" opacity=".055"/>')
# Broken roof and distant masonry.
a.append(f'<path d="M0 0H1600V140L1510 116L1450 188L1370 143L1285 235L1220 203L1144 104L1080 153L1030 88L980 120L930 22L845 80L800 28L750 88L694 48L650 145L560 95L505 178L440 132L350 237L310 181L240 212L194 112L140 170L75 98L0 148Z" fill="{B}"/>')
for x,y,scale in [(380,270,1.05),(800,192,1.28),(1220,270,1.05)]:
 a.append(f'<g transform="translate({x} {y}) scale({scale})"><path d="M-137 350V80Q-137-80 0-120Q137-80 137 80V350" fill="{B}" stroke="{S}" stroke-width="29"/><path d="M-119 350V80Q-119-60 0-98Q119-60 119 80V350" fill="none" stroke="{T}" stroke-opacity=".25" stroke-width="3"/><path d="M-94 350V85Q-94-32 0-69Q94-32 94 85V350" fill="none" stroke="{G}" stroke-opacity=".12"/><use href="#pillar" transform="translate(-160 -3)"/><use href="#pillar" transform="translate(160 -3)"/></g>')
# Center shrine stair steps and engraved radial floor.
a.append(f'<path d="M0 650Q800 550 1600 650V1000H0Z" fill="{P}"/><path d="M0 730Q800 495 1600 730M0 814Q800 500 1600 814M0 955Q800 505 1600 955" fill="none" stroke="{T}" stroke-opacity=".15" stroke-width="2"/>')
for x in range(-600,2400,210):
 a.append(f'<path d="M800 585L{x} 1000" stroke="{T}" stroke-opacity=".11"/>')
for j in range(4):
 a.append(f'<path d="M{440-j*55} {670+j*27}H{1160+j*55}V{688+j*27}H{440-j*55}Z" fill="{S}" stroke="{B}" stroke-width="3"/>')
for x,y in [(515,705),(800,744),(1085,705)]:
 a.append(f'<g transform="translate({x} {y})"><ellipse cy="45" rx="120" ry="20" fill="{B}" opacity=".6"/><path d="M-61-2H61L46 19L39 74H-39L-46 19Z" fill="url(#stone)" stroke="{T}" stroke-opacity=".35"/><path d="M-75-22H75V-4H-75Z" fill="{S}" stroke="{G}" stroke-opacity=".45"/><path d="M-22 17L0 48L22 17L0 4Z" fill="none" stroke="{G}" stroke-opacity=".35"/></g>')
for x,y in [(182,510),(570,490),(1030,490),(1418,510)]:
 a.append(f'<use href="#lamp" transform="translate({x} {y})"/>')
# Scattered cracked slabs and vegetation.
for _ in range(60):
 x=random.randrange(1600); y=random.randrange(760,1000); size=random.randrange(4,25)
 a.append(f'<path d="M{x} {y}l{size} -8l{size} 5l-4 9Z" fill="{S}" opacity=".65"/>')
for x in [80,150,280,1300,1400,1530]:
 a.append(f'<path d="M{x} 850q-30-130 -12-260m12 260q-3-120 29-197m-29 197q-58-90-57-164" fill="none" stroke="{T}" stroke-opacity=".22" stroke-width="3"/>')
a.append('<ellipse cx="810" cy="795" rx="800" ry="170" fill="url(#mist)"/>')
a.append(f'<path d="M0 0H1600V1000H0Z" fill="none" filter="url(#paper)"/>')
write('scenes/forgotten-shrine.svg',svg(''.join(a)))
# Chamber: monumental measured form, etched circles and two empty scales.
a=[f'<rect width="1600" height="1000" fill="url(#sky)"/>']
for x in [120,390,1210,1480]:
 a.append(f'<use href="#pillar" transform="translate({x} 40) scale(1.5 1.8)"/>')
a.append(f'<path d="M430 700V180Q430-80 800-140Q1170-80 1170 180V700" fill="{B}" stroke="{S}" stroke-width="55"/><path d="M470 700V185Q470-32 800-90Q1130-32 1130 185V700" fill="none" stroke="{T}" stroke-opacity=".25" stroke-width="3"/>')
for radius in [180,205,230]:
 a.append(f'<circle cx="800" cy="395" r="{radius}" fill="none" stroke="{G}" stroke-opacity=".17"/>')
for angle in range(0,360,15):
 import math
 x=800+215*math.cos(math.radians(angle));y=395+215*math.sin(math.radians(angle))
 xx=800+230*math.cos(math.radians(angle));yy=395+230*math.sin(math.radians(angle))
 a.append(f'<path d="M{x} {y}L{xx} {yy}" stroke="{G}" stroke-opacity=".3"/>')
a.append(f'<path d="M0 710L800 625L1600 710V1000H0Z" fill="{P}"/><ellipse cx="800" cy="810" rx="520" ry="120" fill="none" stroke="{T}" stroke-opacity=".18" stroke-width="5"/><ellipse cx="800" cy="810" rx="470" ry="100" fill="none" stroke="{G}" stroke-opacity=".2"/>')
for x in range(-400,2000,220):a.append(f'<path d="M800 650L{x} 1000" stroke="{T}" stroke-opacity=".1"/>')
for x in [310,1290]:
 a.append(f'<use href="#lamp" transform="translate({x} 475) scale(1.5)"/>')
a.append('<ellipse cx="800" cy="780" rx="750" ry="170" fill="url(#mist)"/>')
write('scenes/chamber-of-form.svg',svg(''.join(a)))
# Original guardian, separate transparent layer; no borrowed character design.
a=[f'<ellipse cx="400" cy="736" rx="210" ry="27" fill="{B}" opacity=".65"/>',
 f'<path d="M275 655L260 730L345 744L388 675L430 744L535 730L506 654Z" fill="{S}" stroke="{T}" stroke-opacity=".4"/>',
 f'<path d="M310 223L267 338L219 669L362 706L400 634L444 710L583 669L534 344L480 227Z" fill="url(#stone)" stroke="{T}" stroke-opacity=".6" stroke-width="2"/>',
 f'<path d="M310 237L370 344L308 655M480 237L426 343L503 657M400 351V635M277 373L245 643M518 373L552 643M338 400L321 580M462 400L478 580" fill="none" stroke="{B}" stroke-width="8"/>',
 f'<path d="M310 237L370 344L308 655M480 237L426 343L503 657M400 351V635" fill="none" stroke="{T}" stroke-opacity=".3" stroke-width="2"/>',
 f'<path d="M313 240Q282 116 362 76L400 44L443 77Q520 124 483 241L439 300L367 294Z" fill="{S}" stroke="{T}" stroke-opacity=".5" stroke-width="2"/>',
 f'<path d="M340 224Q320 142 400 103Q480 142 457 224L400 263Z" fill="{B}"/>',
 f'<path d="M355 184L388 191M415 191L444 181" stroke="{G}" stroke-opacity=".7" stroke-width="3"/>',
 f'<path d="M315 239L400 318L483 239L508 298L400 365L291 300Z" fill="{P}" stroke="{G}" stroke-opacity=".5"/>',
 f'<circle cx="400" cy="322" r="19" fill="{B}" stroke="{G}"/><path d="M400 304V339M385 322H415" stroke="{G}"/>',
 f'<path d="M273 335L201 433L158 406L218 295L310 242M526 335L599 433L642 406L582 295L480 242" fill="{S}" stroke="{T}" stroke-opacity=".5"/>',
 f'<path d="M161 389Q175 367 196 389L204 416L184 436L163 419Z M638 389Q623 367 602 389L594 416L615 436L636 419Z" fill="{T}"/>',
 f'<path d="M400 218V629M179 397L400 355L622 397" stroke="{G}" stroke-width="8"/><path d="M400 207L386 227L400 248L414 227Z" fill="{G}"/>',
 f'<g fill="none" stroke="{G}" stroke-opacity=".75" stroke-width="2"><path d="M179 397L100 538H252ZM622 397L546 538H698Z"/><path d="M100 538Q176 609 252 538M546 538Q622 609 698 538" fill="{P}" stroke-width="4"/></g>',
 f'<path d="M350 130L367 157L354 175M460 119L447 154M312 477L290 500L306 514M469 567L490 589L478 616" fill="none" stroke="{B}" stroke-width="3"/>']
write('characters/hollow-scale.svg',svg(''.join(a),800,800))
# Keeper: restrained illustrated cameo.
a=[f'<circle cx="200" cy="200" r="188" fill="{B}" stroke="{G}" stroke-opacity=".45"/>',
 f'<circle cx="200" cy="200" r="165" fill="none" stroke="{T}" stroke-opacity=".2"/>',
 f'<path d="M68 375L91 259L141 222H259L310 259L334 375Z" fill="{S}" stroke="{T}" stroke-opacity=".5"/>',
 f'<path d="M126 214L106 146Q111 60 200 52Q290 60 294 146L274 214L247 196H155Z" fill="{P}" stroke="{G}" stroke-opacity=".5"/>',
 f'<path d="M145 137Q200 107 254 137L246 215L199 256L151 215Z" fill="{G}" opacity=".7"/>',
 f'<path d="M149 172L175 166M224 166L249 172M198 170L185 204L204 209" fill="none" stroke="{B}" stroke-width="4"/>',
 f'<path d="M152 193L175 218L200 205L225 218L248 193L241 252L200 303L158 252Z" fill="{T}"/>',
 f'<path d="M165 226L184 251L177 267M200 224V281M231 226L216 251L222 267" fill="none" stroke="{P}" stroke-width="3"/>',
 f'<path d="M109 139Q199 94 290 139L275 107Q196 66 122 108Z" fill="{S}" stroke="{G}" stroke-opacity=".4"/>',
 f'<path d="M126 260L200 334L274 260M200 334V393" fill="none" stroke="{G}" stroke-opacity=".5" stroke-width="4"/>']
write('characters/stonekeeper.svg',svg(''.join(a),400,400))
a=f'<path d="M100 14L175 73L100 186L25 73Z" fill="{P}" stroke="{G}" stroke-width="3"/><path d="M100 14L70 73L100 186L130 73ZM25 73H175M70 73L100 14L130 73" fill="none" stroke="{G}" stroke-width="2"/><path d="M70 73L100 96L130 73L100 14Z" fill="{G}" opacity=".3"/>'
write('diamonds/form.svg',svg(a,200,200))
print('Created 5 original SVG illustration placeholders.')
