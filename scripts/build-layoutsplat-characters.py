#!/usr/bin/env python3
"""Reproduce LayoutSplat's original transparent CC0 comic characters."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'splatworks/layoutsplat/characters'
ROOT.mkdir(exist_ok=True)
people={'maya':('#ba815f','#392742','#22a99c','long'),'kai':('#e3b584','#252338','#e4a532','short'),'nia':('#87563f','#322239','#f17f76','curly'),'sam':('#f1c7ac','#b7633c','#8553c1','glasses')}
def arms(pose,color,skin):
    right={'wave':'M203 214Q244 225 247 153','think':'M203 216Q250 259 201 164','explain':'M203 216Q235 226 268 201'}[pose]
    hand={'wave':(247,147),'think':(201,160),'explain':(274,198)}[pose]
    x,y=hand
    return f'<path d="M117 214Q86 225 77 265 {right}" fill="none" stroke="{color}" stroke-width="23" stroke-linecap="round"/><circle cx="77" cy="271" r="12" fill="{skin}"/><circle cx="{x}" cy="{y}" r="13" fill="{skin}"/>'+(f'<path d="M{x-9} {y-6}v-12m9 8v-14m8 17v-12" fill="none" stroke="{skin}" stroke-width="7" stroke-linecap="round"/>' if pose=='wave' else '')
def eyes(x=160,y=132,glasses=False):
    out=f'<ellipse cx="{x-19}" cy="{y}" rx="10" ry="12" fill="#fff"/><ellipse cx="{x+19}" cy="{y}" rx="10" ry="12" fill="#fff"/><circle cx="{x-17}" cy="{y+1}" r="5" fill="#342446"/><circle cx="{x+21}" cy="{y+1}" r="5" fill="#342446"/><path d="M{x-13} {y+29}q13 12 27 0" fill="none" stroke="#724750" stroke-width="4" stroke-linecap="round"/>'
    if glasses:out+=f'<rect x="{x-36}" y="{y-17}" width="34" height="31" rx="10" fill="none" stroke="#49334d" stroke-width="4"/><rect x="{x+2}" y="{y-17}" width="34" height="31" rx="10" fill="none" stroke="#49334d" stroke-width="4"/><path d="M{x-2} {y-5}h4" stroke="#49334d" stroke-width="4"/>'
    return out
def person(id,pose):
    skin,hair,shirt,style=people[id]
    back=(f'<path d="M104 111Q105 55 162 58Q224 61 218 127L226 212H98Z" fill="{hair}"/>' if style=='long' else '')
    curls=(''.join(f'<circle cx="{x}" cy="{y}" r="23" fill="{hair}"/>' for x,y in [(111,112),(116,84),(145,65),(178,65),(207,85),(214,114)]) if style=='curly' else '')
    haircap=f'<path d="M106 114Q102 53 160 61Q216 49 216 117Q197 115 182 90Q153 121 106 114Z" fill="{hair}"/>'
    return back+curls+f'<path d="M136 298l-8 69m58-69 10 69" stroke="#3b3a63" stroke-width="31" stroke-linecap="round"/><rect x="102" y="363" width="43" height="20" rx="9" fill="#322842"/><rect x="182" y="363" width="43" height="20" rx="9" fill="#322842"/>'+arms(pose,shirt,skin)+f'<rect x="110" y="192" width="102" height="121" rx="25" fill="{shirt}"/><path d="m139 194 21 23 22-23" fill="#fff0d8"/><path d="M160 218v65" stroke="#ffffff66" stroke-width="4"/><rect x="146" y="166" width="28" height="39" rx="9" fill="{skin}"/><circle cx="106" cy="133" r="11" fill="{skin}"/><circle cx="214" cy="133" r="11" fill="{skin}"/><ellipse cx="160" cy="129" rx="54" ry="61" fill="{skin}"/>'+haircap+eyes(glasses=style=='glasses')+(f'<circle cx="133" cy="151" r="2" fill="{hair}"/><circle cx="127" cy="147" r="2" fill="{hair}"/><circle cx="191" cy="151" r="2" fill="{hair}"/>' if id=='sam' else '')
def dot(pose):
    return '<path d="M137 300v56m47-56v56" stroke="#5a378c" stroke-width="27" stroke-linecap="round"/><rect x="112" y="350" width="43" height="25" rx="9" fill="#452573"/><rect x="166" y="350" width="43" height="25" rx="9" fill="#452573"/>'+arms(pose,'#7950bb','#ae88e0')+'<rect x="111" y="204" width="103" height="108" rx="20" fill="#7c3aed"/><rect x="130" y="229" width="65" height="45" rx="8" fill="#f1eaff"/><circle cx="145" cy="251" r="8" fill="#35b9ab"/><circle cx="178" cy="251" r="8" fill="#ffc65a"/><path d="M160 90V58" stroke="#7945ba" stroke-width="8"/><circle cx="160" cy="47" r="13" fill="#ffc65a"/><rect x="98" y="87" width="124" height="108" rx="29" fill="#7c3aed"/><rect x="113" y="112" width="94" height="42" rx="16" fill="#f7efff"/><circle cx="138" cy="133" r="9" fill="#34205c"/><circle cx="181" cy="133" r="9" fill="#34205c"/><path d="M148 175q12 9 25 0" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
def pip(pose):
    wing={'wave':'M116 228Q55 221 76 139','think':'M112 235Q77 190 118 176','explain':'M112 237Q68 244 44 208'}[pose]
    return '<path d="M138 322v46m45-46v46" stroke="#704f86" stroke-width="12" stroke-linecap="round"/><path d="M117 371h34m20 0h34" stroke="#704f86" stroke-width="12" stroke-linecap="round"/><ellipse cx="160" cy="239" rx="72" ry="100" fill="#ffa947"/>'+f'<path d="{wing}" fill="none" stroke="#ffc65a" stroke-width="32" stroke-linecap="round"/>'+'<ellipse cx="180" cy="266" rx="32" ry="53" fill="#ffce73"/><path d="m213 159 47 22-47 20" fill="#ed7c69"/><circle cx="184" cy="150" r="19" fill="#fff"/><circle cx="190" cy="150" r="8" fill="#34205c"/><path d="M129 146q7-29 23-38" stroke="#ffa947" stroke-width="15" fill="none" stroke-linecap="round"/>'
def tess(pose):
    return '<path d="M126 315l-16 48m71-48 21 48" stroke="#54ae8e" stroke-width="28" stroke-linecap="round"/>'+arms(pose,'#54ae8e','#83c8a4')+'<ellipse cx="160" cy="253" rx="78" ry="91" fill="#216f69"/><path d="m160 192 41 24v51l-41 25-42-25v-51Z" fill="#43a58d" stroke="#8bd0aa" stroke-width="5"/><path d="m118 216-27-17m110 17 26-18m-67 94v42m-42-67-30 20m113-20 29 19" stroke="#8bd0aa" stroke-width="5"/><path d="M158 180v24" stroke="#83c8a4" stroke-width="30"/><ellipse cx="160" cy="125" rx="54" ry="60" fill="#83c8a4"/>'+eyes()
def orbit(pose):
    return '<path d="M211 308Q291 310 266 225" stroke="#a380d3" stroke-width="29" fill="none" stroke-linecap="round"/><path d="M132 320v44m53-44v44" stroke="#8a62bc" stroke-width="29" stroke-linecap="round"/>'+arms(pose,'#a380d3','#c1a1e6')+'<ellipse cx="160" cy="263" rx="66" ry="89" fill="#a380d3"/><ellipse cx="160" cy="270" rx="35" ry="56" fill="#f3e9ff"/><path d="M108 102 105 41 150 79m62 23 3-61-45 38" fill="#a380d3"/><path d="m115 83 2-23 19 20m69 3-2-23-19 20" fill="#edb5cc"/><circle cx="160" cy="127" r="59" fill="#c1a1e6"/><ellipse cx="160" cy="153" rx="31" ry="23" fill="#f3e9ff"/>'+eyes(y=126)+'<path d="m152 147 16 0-8 9Z" fill="#70456f"/><path d="m126 151-35-5m35 14-35 7m103-16 35-5m-35 14 35 7" stroke="#7c5d9b" stroke-width="3" stroke-linecap="round"/>'
for id in list(people)+['pip','dot','tess','orbit']:
 for pose in ['wave','think','explain']:
  body=person(id,pose) if id in people else {'pip':pip,'dot':dot,'tess':tess,'orbit':orbit}[id](pose)
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400" role="img" aria-labelledby="title"><title id="title">{id.title()} — {pose} pose. Original LayoutSplat character.</title><ellipse cx="160" cy="384" rx="79" ry="9" fill="#9d8ab7" opacity=".16"/>{body}</svg>'
  (ROOT/f'{id}-{pose}.svg').write_text(svg)
print('Built 24 original transparent character poses.')
