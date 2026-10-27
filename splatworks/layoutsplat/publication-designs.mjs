import {templateBodyCopy} from './template-copy.mjs';
// Original publication compositions. Industry and color customize a composition;
// neither is counted as another design. All artwork is editable local geometry.
import { newPublication, uid, frame, shape, textStyle, validatePublication } from './engine.mjs';
import { addBrandMark } from './brand-mark.mjs';
export const DESIGN_FAMILIES = {
 flyer: ['Oversized headline announcement','Geometric corner event','Image-led announcement','Three-event bulletin','Illustrated celebration','Minimal serif invitation','Tear-off community notice','Tear-off image & services'],
 brochure: ['Image cover trifold','Editorial trifold','Circular portrait trifold','Geometric trifold','Full image bifold','Magazine bifold','Program grid bifold','Split cover bifold'],
 newsletter: ['Front-page newspaper','Magazine feature','Community bulletin','Sidebar digest','Image essay','Minimal journal'],
 'business-card': ['Classic horizontal','Bold color band','Logo & contact columns','Centered logo','Color block sidebar','Elegant framed card'],
 catalog: ['Six-product showcase','Large feature & product rail','Two-column shopping guide','Image-led collection'],
 'greeting-card': ['Illustrated front & center fold','Serif message & side frame','Geometric celebration card','Image cover & inset message'],
 postcard: ['Image strip & address reverse','Bold split announcement','Framed serif correspondence','Image mosaic postcard'],
 poster: ['Oversized type & image strip','Geometric event poster','Circular image spotlight','Editorial landscape poster'],
 letterhead: ['Logo & ruled correspondence','Vertical identity rail','Centered serif stationery','Geometric corner stationery'],
 'rack-card': ['Image cover & service cards','Tall typographic announcement','Circular image & contact rail','Framed editorial guide'],
 datasheet: ['Specifications & image columns','Feature image & metric strip','Comparison table & sidebar','Technical diagram & details'],
 invitation: ['Centered serif formal invitation','Diagonal event invitation','Illustrated border invitation','Image-led celebration invitation'],
 certificate: ['Classic double-rule award','Ribbon sidebar achievement','Geometric corner recognition','Laurel & seal recognition'],
 resume: ['Single-column professional resume','Contact sidebar resume','Editorial two-column resume','Image profile & timeline resume','Bold nameplate resume','Minimal serif curriculum vitae'],
 'photo-collage': ['Six-image memory grid','Large image & filmstrip','Pinned photo scrapbook','Asymmetric gallery wall','Circular image collection','Landscape contact sheet'],
 document: ['Image-cover project proposal','Editorial report & columns','Meeting agenda & notes','Classroom lesson plan','Project brief & milestones','Portfolio cover & case study'],
};
export function designPublication(entry,{sector,theme,language='en',words}) {
 const palette=theme||sector,rtl=language==='ar',d=newPublication(true);d.pages=[];d.guides.columns=1;d.title=entry.name;d.templateId=entry.id;d.publicationType=entry.type;d.language=language;d.margin=36;d.bleed=9;d.safeArea=12;d.brand={...palette};d.masters=[];
 const v=entry.variant,ink=palette.ink,accent=palette.accent,pale=palette.pale;
 const headline=language==='en'?sector.headline:words[0],intro=language==='en'?sector.overview:words[1],topics=language==='en'?sector.topics:[words[0],words[2],words[11]],site=`${sector.id}.example`;
 const pg=()=>{const p={id:uid(),objects:[]};d.pages.push(p);return p;};
 const tx=(p,value,x,y,w,h,size=12,opt={})=>{const id=uid(),o=frame(id,x,y,w,h);o.padding=0;d.stories[id]={text:value,frames:[o.id],marks:[],style:{...textStyle(),size,color:ink,font:v%3===1?'Georgia':'Arial',lineHeight:1.25,direction:rtl?'rtl':'ltr',align:rtl?'right':'left',autoFit:'shrink',minSize:Math.max(8,Math.min(size,size-4)),...opt}};p.objects.push(o);return o;};
 const bx=(p,x,y,w,h,fill=accent,kind='rect')=>{const o=shape(x,y,w,h,fill,kind);p.objects.push(o);return o;};
 const rule=(p,x,y,w,color=accent,dash=false)=>{const o=bx(p,x,y,w,1,color);if(dash){o.kind='line';o.strokeWidth=.7;o.noFill=true;o.strokeDash='3 3';}return o;};
 const border=(p,x,y,w,h,color=accent)=>{const o=bx(p,x,y,w,h,color);o.noFill=true;o.strokeWidth=1.5;return o;};
 let pictureId;
 const im=(p,x,y,w,h,{round=false,rotation=0}={})=>{pictureId||=(uid());d.assets[pictureId]||={name:'Example illustration — replace with your own picture',alt:'LayoutSplat publishing studio with an open book, page layouts and colorful creative tools',width:1080,height:420,src:'sample-art.svg',sample:true};const o={id:uid(),type:'image',assetId:pictureId,x,y,w,h,rotation,fit:'cover',locked:false};if(round){o.path=`M${w/2} 0A${w/2} ${h/2} 0 1 1 ${w/2} ${h}A${w/2} ${h/2} 0 1 1 ${w/2} 0Z`;o.pathViewBox=[0,0,w,h];}p.objects.push(o);return o;};
 const foot=(p)=>{addBrandMark(d,p,36,d.height-52,18);tx(p,`${words[11]} · ${site}`,62,d.height-49,d.width-98,20,9,{color:accent});};
 const title=(p,value,x,y,w,h,size=30,opt={})=>tx(p,value,x,y,w,h,size,{weight:'bold',lineHeight:1.06,...opt});
 const body=(p,x,y,w,h,size=12,value=intro)=>tx(p,value,x,y,w,h,size);
 const note=(p,x,y,w,h=64)=>tx(p,'{{Date}} · {{Time}}\n{{Location}}',x,y,w,h,14,{weight:'bold'});
 const corner=(p,x,y,w,h)=>{const o=bx(p,x,y,w,h,accent,'triangle');return o;};
 const leaves=(p,x,y,count=5)=>{for(let i=0;i<count;i++){const a=bx(p,x+i*34,y+(i%2)*16,25,45,accent,'ellipse');a.rotation=i%2?25:-25;}};
 const link=(source,p,x,y,w,h)=>{const o=frame(source.storyId,x,y,w,h);o.padding=0;d.stories[source.storyId].frames.push(o.id);p.objects.push(o);return o;};
 if(entry.type==='flyer'){
  const p=pg();
  if(v===0){bx(p,0,0,612,310,pale);title(p,headline,36,70,540,180,51);rule(p,36,332,540);body(p,36,370,310,170,17);note(p,384,374,192,150);bx(p,36,597,540,101,accent);tx(p,words[2],54,625,504,42,26,{color:'#ffffff',weight:'bold'});}
  if(v===1){corner(p,356,0,256,256);border(p,24,24,564,744);tx(p,words[3],48,54,420,25,12,{tracking:1});title(p,headline,48,140,300,180,41);im(p,48,360,312,230);body(p,384,370,168,215,13);note(p,48,642,504);}
  if(v===2){im(p,0,0,612,335);bx(p,36,280,160,90,accent);tx(p,'{{Date}}',48,303,136,48,24,{color:'#ffffff',weight:'bold'});title(p,headline,36,400,540,130,37);body(p,36,554,340,130,15);note(p,410,556,166,108);}
  if(v===3){title(p,headline,36,45,540,110,36);topics.forEach((topic,i)=>{const y=188+i*160;bx(p,36,y,540,138,i%2?pale:'#f5f6fa');bx(p,52,y+20,62,62,accent,'ellipse');tx(p,`{{Date${i+1}}}`,58,y+38,50,32,10,{color:'#ffffff',align:'center'});title(p,topic,138,y+18,418,45,23);body(p,138,y+69,410,55,12);});}
  if(v===4){bx(p,0,0,612,792,pale);leaves(p,38,40,7);leaves(p,332,664,6);border(p,26,24,560,738);title(p,headline,80,184,452,160,40,{align:'center',font:'Georgia'});body(p,85,380,442,108,16);note(p,92,529,428,82);bx(p,478,68,64,64,accent,'star');}
  if(v===5){rule(p,40,70,532);title(p,headline,40,118,370,195,43,{font:'Georgia'});bx(p,451,128,119,119,pale,'ellipse');im(p,40,348,530,133);body(p,40,523,325,141,15);note(p,404,526,166,114);rule(p,40,712,530);}
  if(v>=6){d.bleed=0;d.tearOff={tabs:10,fields:['Name','Phone'],perforationY:654};if(v===6){title(p,headline,40,70,532,155,44);rule(p,40,247,532,ink);body(p,40,290,532,130,17);tx(p,'{{Name}}\n{{Phone}}',40,469,532,111,27,{weight:'bold'});}else{bx(p,0,0,612,112,pale);title(p,headline,36,27,540,70,29);im(p,36,151,238,285);title(p,topics[0],310,161,266,93,27);body(p,310,277,266,154,14);tx(p,'{{Name}} · {{Phone}}',36,503,540,60,22,{weight:'bold'});}
   tx(p,words[2],36,609,540,24,12);rule(p,36,654,540,ink,true);for(let i=0;i<10;i++){if(i){const o=bx(p,36+i*54,655,1,101,ink);o.kind='path';o.path='M0 0V101';o.pathViewBox=[0,0,1,101];o.strokeWidth=.6;o.noFill=true;o.strokeDash='3 3';}const f=tx(p,'{{Name}}\n{{Phone}}',36+i*54+27-45,685,90,36,9,{align:'center'});f.rotation=-90;f.tearOffTab=i;}addBrandMark(d,p,548,594,22);}
  if(v<6)foot(p);
 }
 if(entry.type==='brochure'){
  d.width=792;d.height=612;d.margin=24;const count=v<4?3:2;d.guides.columns=count;d.guides.gap=24;
  const widths=count===2?[396,396]:v%2?[258,267,267]:[264,264,264],starts=widths.map((_,i)=>widths.slice(0,i).reduce((a,b)=>a+b,0));d.foldGuides=starts.slice(1);d.foldType=count===2?'bifold':v%2?'roll-fold':'z-fold';d.foldInstructions=count===2?'Bifold: outside has back/contact on the left and front cover on the right. Inside is a two-panel spread. Print at actual size and test duplex orientation.':v%2?'Roll trifold: outside has the narrower fold-in flap on the left, back/contact in the middle, and front cover on the right. Fold the narrow flap inward first. Test duplex orientation and folds at actual size.':'Equal-panel Z-fold trifold: outside has fold-in, back/contact, and front cover from left to right. Fold as an accordion; test duplex orientation at actual size.';
  for(let side=0;side<2;side++){const p=pg();
   if(v===4){if(!side){im(p,396,0,396,612);bx(p,416,353,348,213,pale);title(p,headline,438,379,304,125,30);title(p,words[11],30,62,330,74,28);body(p,30,176,330,180,14);tx(p,site,30,489,330,32,14);}else{im(p,24,45,310,485);title(p,topics[0],368,62,388,91,30);body(p,368,185,388,278,15);rule(p,368,492,388);tx(p,words[2],368,516,388,40,18);}}
   else if(v===5){if(!side){bx(p,0,0,396,612,pale);title(p,words[11],28,88,334,76,28);body(p,28,203,334,159,15);im(p,420,32,344,225);title(p,headline,420,295,344,169,37,{font:'Georgia'});tx(p,site,28,506,334,40,12);}else{title(p,topics[0],24,42,744,78,32,{font:'Georgia'});im(p,24,154,450,204);body(p,24,391,450,151,13);title(p,topics[1],506,154,262,82,23);body(p,506,265,262,233,13);}}
   else if(v===6){if(!side){bx(p,396,0,396,612,accent);title(p,headline,428,94,326,174,37,{color:'#ffffff'});im(p,428,327,326,172);title(p,words[11],28,57,336,73,26);body(p,28,166,336,187,14);tx(p,site,28,512,336,35,12);}else{title(p,words[0],28,35,736,87,31);for(let i=0;i<4;i++){const x=28+(i%2)*382,y=154+Math.floor(i/2)*205;bx(p,x,y,354,179,pale);title(p,topics[i%3],x+16,y+16,322,62,23);body(p,x+16,y+88,322,71,12);}}}
   else if(v===7){if(!side){im(p,396,0,396,292);bx(p,396,292,396,320,pale);title(p,headline,424,339,340,143,34);title(p,words[11],28,58,336,86,29);im(p,28,183,336,115);body(p,28,344,336,159,13);}else{im(p,24,45,250,218);title(p,topics[0],300,45,468,111,29);body(p,300,187,468,76,14);title(p,topics[1],24,315,340,70,24);body(p,24,412,340,123,13);bx(p,400,315,368,227,pale);title(p,topics[2],420,336,328,67,24);body(p,420,427,328,94,13);}}
   else for(let col=0;col<count;col++){const x=starts[col],w=widths[col],content=side?topics[col]:col===2?headline:col===1?words[11]:topics[1];
    if(v===0){if(!side&&col===2){im(p,x,0,w,318);bx(p,x,318,w,294,pale);title(p,content,x+22,361,w-44,132,32);}else{title(p,content,x+22,52,w-44,91,25);im(p,x+22,178,w-44,129);body(p,x+22,345,w-44,190,12);}}
    if(v===1){rule(p,x+22,40,w-44,ink);title(p,content,x+22,65,w-44,114,28,{font:'Georgia'});if(col!==1)im(p,x+22,222,w-44,136);body(p,x+22,col===1?218:391,w-44,col===1?285:155,12);}
    if(v===2){bx(p,x,0,w,612,col===1?accent:pale);im(p,x+38,48,w-76,w-76,{round:true});title(p,content,x+24,270,w-48,108,27,{align:'center',color:col===1?'#ffffff':ink});body(p,x+24,413,w-48,144,12);if(col===1)for(const o of p.objects.filter(o=>o.type==='text'&&o.x>=x&&o.x<x+w))d.stories[o.storyId].style.color='#ffffff';}
    if(v===3){if(col!==1)corner(p,x,0,w,168);title(p,content,x+22,210,w-44,114,27);if(col===1){im(p,x+22,35,w-44,138);body(p,x+22,356,w-44,183,12);}else{body(p,x+22,354,w-44,91,12);im(p,x+22,475,w-44,89);}}
   }
   addBrandMark(d,p,starts.at(-1)+24,568,18);tx(p,site,starts.at(-1)+48,568,widths.at(-1)-72,22,9,{color:v===6&&!side?'#ffffff':accent});
  }
 }
 if(entry.type==='newsletter'){
  for(let side=0;side<2;side++){const p=pg(),name=side?topics[2]:`${words[3]}\n${headline}`;
   if(v===0){rule(p,36,40,540,ink);title(p,name,36,57,540,105,32,{font:'Georgia'});rule(p,36,182,540,ink);im(p,36,206,350,189);title(p,topics[0],36,419,350,66,24);body(p,36,517,166,195,11);body(p,220,517,166,195,11,words[1]);bx(p,412,206,164,506,pale);title(p,topics[1],428,230,132,80,22);body(p,428,348,132,289,11);}
   if(v===1){im(p,0,0,612,321);bx(p,36,241,540,147,pale);title(p,name,52,258,508,114,32,{font:'Georgia'});title(p,topics[0],36,423,320,76,25);body(p,36,527,320,175,12);im(p,387,423,189,175);tx(p,topics[1],387,629,189,60,15,{weight:'bold'});}
   if(v===2){bx(p,0,0,612,144,pale);title(p,name,36,30,540,96,29);for(let i=0;i<4;i++){const x=36+i%2*279,y=180+Math.floor(i/2)*259;bx(p,x,y,261,235,i%2===0?pale:'#f4f5fa');title(p,topics[i%3],x+14,y+17,233,62,22);body(p,x+14,y+99,233,107,12);}tx(p,'{{Date}} · {{Issue}}',36,715,540,28,10);}
   if(v===3){bx(p,0,0,170,792,accent);title(p,words[3],22,64,126,112,27,{color:'#ffffff'});tx(p,topics.join('\n\n'),22,246,126,265,14,{color:'#ffffff'});title(p,name,200,43,376,118,30);im(p,200,190,376,173);title(p,topics[0],200,401,376,76,25);body(p,200,505,376,200,13);}
   if(v===4){title(p,name,36,41,540,112,34);im(p,36,183,335,332);im(p,392,183,184,151);im(p,392,358,184,157);title(p,topics[0],36,549,540,58,25);body(p,36,635,335,71,12);body(p,392,635,184,71,10,words[1]);}
   if(v===5){tx(p,'{{Date}} · {{Issue}}',36,40,540,22,10,{tracking:1});title(p,name,36,103,510,126,34,{font:'Georgia'});rule(p,36,253,540,ink);body(p,36,293,258,271,13);body(p,318,293,258,271,13,words[1]);im(p,36,603,178,110);tx(p,topics[2],246,620,330,85,19,{italic:true,font:'Georgia'});}
   foot(p);
  }
  // A separate full story demonstrates continuous flow across the two pages.
  const first=d.pages[0].objects.find(o=>o.type==='text'&&d.stories[o.storyId].text===intro),second=d.pages[1].objects.find(o=>o.type==='text'&&d.stories[o.storyId].text===intro);
  if(first&&second){delete d.stories[second.storyId];second.storyId=first.storyId;const size=d.stories[first.storyId].style.size, charsPerLine=first.w/(size*(language==='zh'?1:.56)), paragraphLines=Math.ceil(intro.length/charsPerLine)+2;d.stories[first.storyId].text=(intro+'\n\n').repeat(Math.max(2,Math.ceil(first.h/(size*1.25)*1.15/paragraphLines)));d.stories[first.storyId].frames.push(second.id);}
 }
 if(entry.type==='catalog'){
  for(let side=0;side<2;side++){const p=pg();
   if(v===0){title(p,words[10],36,43,540,91,33);for(let i=0;i<6;i++){const x=36+i%2*279,y=164+Math.floor(i/2)*183;im(p,x,y,261,105);title(p,topics[i%3],x,y+119,261,30,16);tx(p,'{{Price}}',x,y+151,261,23,12,{color:accent});}}
   if(v===1){im(p,36,39,361,311);title(p,words[10],36,383,361,107,32);body(p,36,526,361,135,15);for(let i=0;i<3;i++){const y=39+i*222;im(p,426,y,150,119);title(p,topics[i],426,y+139,150,55,18);}}
   if(v===2){bx(p,0,0,612,134,pale);title(p,words[10],36,37,540,70,35);for(let i=0;i<4;i++){const x=36+i%2*279,y=175+Math.floor(i/2)*252;im(p,x,y,90,152);title(p,topics[i%3],x+111,y,150,57,20);body(p,x+111,y+80,150,72,11);tx(p,'{{Price}}',x,y+174,261,31,17,{weight:'bold'});}}
   if(v===3){im(p,0,0,612,379);bx(p,36,300,540,143,pale);title(p,words[10],54,322,504,100,33);for(let i=0;i<3;i++){const x=36+i*186;im(p,x,487,168,118);title(p,topics[i],x,628,168,65,19);}}
   foot(p);
  }
 }
 if(entry.type==='greeting-card'){
  d.width=720;d.height=504;d.margin=24;d.guides.columns=2;d.foldGuides=[360];d.foldType='bifold';d.foldInstructions='Center fold. Outside: back on the left, front cover on the right. Inside: two reading panels. Test duplex orientation at actual size.';
  for(let side=0;side<2;side++){const p=pg();
   if(!side){if(v===0){bx(p,360,0,360,504,pale);leaves(p,400,48,6);title(p,words[5],392,164,296,156,31,{align:'center'});bx(p,503,368,65,65,accent,'star');}
    if(v===1){border(p,377,17,326,470);title(p,words[5],398,141,284,162,32,{font:'Georgia',align:'center'});rule(p,438,356,204);}
    if(v===2){corner(p,360,0,360,250);bx(p,495,338,108,108,pale,'ellipse');title(p,words[5],392,264,296,68,26);}
    if(v===3){im(p,360,0,360,504);bx(p,390,152,300,205,pale);title(p,words[5],413,180,254,156,30,{align:'center'});}
    tx(p,words[6],30,385,298,62,15,{align:'center'});addBrandMark(d,p,150,287,40);
   }else{if(v===0)leaves(p,47,52,7);if(v===1)rule(p,395,100,288);if(v===2)bx(p,40,360,110,110,pale,'ellipse');if(v===3)im(p,32,40,288,157);tx(p,'{{Message}}',396,v===3?103:143,288,228,23,{align:v===1?'left':'center'});tx(p,'{{Signature}}',396,405,288,41,17,{align:'center'});}
  }
 }
 if(entry.type==='postcard'){
  d.width=432;d.height=288;d.margin=18;d.guides.columns=1;
  for(let side=0;side<2;side++){const p=pg();if(!side){
   if(v===0){im(p,0,0,432,135);title(p,headline,18,157,396,88,27);}
   if(v===1){bx(p,0,0,166,288,accent);title(p,words[3],18,40,131,142,23,{color:'#ffffff'});title(p,headline,188,33,225,115,28);body(p,188,174,225,65,11);}
   if(v===2){border(p,12,12,408,264);rule(p,62,74,308);title(p,headline,42,98,348,103,27,{align:'center',font:'Georgia'});}
   if(v===3){im(p,18,18,116,126);im(p,152,18,116,126);im(p,286,18,128,126);title(p,headline,18,171,396,81,25);}
  }else{body(p,18,26,183,166,11);rule(p,218,26,196,pale);tx(p,'{{Name}}\n{{Address}}\n{{City}}, {{Region}} {{PostalCode}}',238,96,176,130,11);border(p,354,24,60,56,pale);tx(p,site,18,244,396,26,9,{color:accent});}addBrandMark(d,p,18,247,16);}
 }
 if(entry.type==='poster'){
  d.width=864;d.height=v===3?648:1296;d.margin=48;const p=pg();
  if(v===0){title(p,headline,48,77,768,328,89);im(p,48,468,768,402);body(p,48,917,497,183,23);note(p,584,925,232,160);}
  if(v===1){corner(p,448,0,416,393);bx(p,0,900,864,396,pale);title(p,headline,48,430,750,240,78);bx(p,48,730,120,120,accent,'star');tx(p,'{{Date}}',206,755,600,84,41,{weight:'bold'});body(p,48,967,768,191,25);}
  if(v===2){bx(p,0,0,864,1296,pale);im(p,168,47,528,528,{round:true});title(p,headline,64,651,736,210,70,{align:'center'});body(p,121,927,622,145,21);note(p,128,1141,608,83);}
  if(v===3){im(p,0,0,407,648);title(p,headline,455,67,361,240,55,{font:'Georgia'});body(p,455,368,361,116,18);note(p,455,524,361,65);}
  foot(p);
 }
 if(entry.type==='letterhead'){
  const p=pg();if(v===0){addBrandMark(d,p,36,33,45);title(p,words[3],103,43,473,47,26);rule(p,36,111,540);}
  if(v===1){bx(p,0,0,124,792,pale);addBrandMark(d,p,39,40,46);tx(p,site,18,300,88,227,12,{color:accent});title(p,words[3],157,44,419,76,27);}
  if(v===2){addBrandMark(d,p,287,28,38);title(p,words[3],60,92,492,62,27,{font:'Georgia',align:'center'});tx(p,site,60,172,492,27,10,{align:'center'});rule(p,94,219,424,ink);}
  if(v===3){corner(p,400,0,212,180);title(p,words[3],36,50,379,75,27);rule(p,36,155,243);}
  const x=v===1?157:36,y=v===2?260:198,w=576-x;tx(p,`{{Date}}\n\n{{Name}}\n\n${words[1]}\n\n${intro}\n\n{{Signature}}`,x,y,w,792-y-110,13);if(v!==1)foot(p);else tx(p,'{{Phone}} · {{Email}}',157,726,419,30,10,{color:accent});
 }
 if(entry.type==='rack-card'){
  d.width=288;d.height=648;d.margin=18;d.guides.columns=1;for(let side=0;side<2;side++){const p=pg();
   if(v===0){im(p,0,0,288,230);title(p,side?topics[1]:headline,18,258,252,125,32);body(p,18,420,252,110,13);}
   if(v===1){bx(p,0,0,88,648,accent);title(p,side?topics[2]:headline,107,45,163,187,32);im(p,108,275,162,153);body(p,108,469,162,114,11);}
   if(v===2){im(p,56,30,176,176,{round:true});title(p,side?topics[0]:headline,18,254,252,112,29,{align:'center'});bx(p,18,414,252,138,pale);body(p,33,433,222,100,12);}
   if(v===3){border(p,11,11,266,626);title(p,side?topics[1]:headline,29,53,230,134,29,{font:'Georgia'});rule(p,29,219,230,ink);body(p,29,252,230,190,13);im(p,29,483,230,93);}
   addBrandMark(d,p,18,605,18);tx(p,site,46,607,224,23,9,{color:accent});
  }
 }
 if(entry.type==='datasheet'){
  const p=pg();const table=(x,y,w,h)=>p.objects.push({id:uid(),type:'table',x,y,w,h,rotation:0,locked:false,header:true,fontSize:11,cells:[['Item','Details'],...topics.map(topic=>[topic,'{{Specification}}'])]});
  if(v===0){title(p,topics[0],36,40,540,104,33);im(p,36,177,246,242);body(p,318,177,258,208,14);table(36,476,540,207);}
  if(v===1){im(p,36,36,540,235);title(p,topics[0],36,303,540,88,31);for(let i=0;i<3;i++){bx(p,36+i*186,429,168,81,pale);tx(p,`{{Metric${i+1}}}`,48+i*186,449,144,41,23,{weight:'bold',align:'center'});}body(p,36,562,540,128,13);}
  if(v===2){bx(p,0,0,168,792,pale);title(p,topics[1],24,44,120,175,25);body(p,24,281,120,303,11);title(p,topics[0],201,44,375,106,29);table(201,194,375,312);body(p,201,553,375,133,12);}
  if(v===3){title(p,topics[0],36,48,540,111,32);for(let i=0;i<3;i++){bx(p,61+i*178,203,112,112,pale,'hexagon');tx(p,`{{Item${i+1}}}`,66+i*178,245,102,45,13,{weight:'bold',align:'center'});if(i<2)bx(p,188+i*178,247,38,24,accent,'arrow');}body(p,36,370,540,111,14);table(36,529,540,178);}
  foot(p);
 }
 if(entry.type==='invitation'){
  d.width=360;d.height=504;d.margin=24;d.guides.columns=1;const p=pg();
  if(v===0){border(p,16,16,328,472);title(p,words[4],36,53,288,71,26,{align:'center',font:'Georgia'});title(p,headline,36,157,288,144,29,{align:'center',font:'Georgia'});rule(p,90,330,180);note(p,36,362,288,77);}
  if(v===1){corner(p,130,0,230,171);title(p,headline,28,189,304,133,31);note(p,28,363,304,83);}
  if(v===2){bx(p,0,0,360,504,pale);leaves(p,24,28,7);leaves(p,84,425,7);title(p,headline,42,139,276,151,30,{align:'center'});note(p,42,328,276,81);}
  if(v===3){im(p,0,0,360,201);title(p,headline,28,236,304,128,29);tx(p,'{{Date}} · {{Time}}\n{{Location}}\n{{RSVP}}',28,407,304,61,12);}
  addBrandMark(d,p,167,466,19);
 }
 if(entry.type==='certificate'){
  d.width=792;d.height=612;d.margin=36;d.guides.columns=1;const p=pg();
  if(v===0){border(p,16,16,760,580);border(p,27,27,738,558);rule(p,196,381,400);}
  if(v===1){bx(p,0,0,148,612,accent);bx(p,43,153,62,114,pale);bx(p,33,129,82,82,pale,'star');rule(p,196,411,548);}
  if(v===2){corner(p,0,0,174,174);const right=corner(p,618,438,174,174);right.rotation=180;rule(p,223,333,346);}
  if(v===3){leaves(p,72,100,4);leaves(p,582,100,4);bx(p,350,454,92,92,pale,'star');bx(p,365,469,62,62,accent,'ellipse');}
  const x=v===1?185:92,w=v===1?550:608;title(p,words[7],x,v===3?73:93,w,91,v===1?33:36,{font:v===0?'Georgia':'Arial',align:'center'});tx(p,words[8],x,215,w,37,15,{align:'center'});title(p,'{{Name}}',x,277,w,79,40,{align:'center',font:'Georgia'});tx(p,words[9],x,386,w,62,16,{align:'center'});tx(p,'{{Date}}',x,492,w/3,39,12,{align:'center'});tx(p,'{{Signature}}',x+w*2/3,492,w/3,39,12,{align:'center'});addBrandMark(d,p,v===1?47:42,v===1?328:47,30);
 }
 if(entry.type==='resume'){
  d.bleed=0;const p=pg(),labels=({en:['Profile','Experience','Education','Skills'],es:['Perfil','Experiencia','Educación','Competencias'],vi:['Hồ sơ','Kinh nghiệm','Học vấn','Kỹ năng'],ar:['الملف الشخصي','الخبرة','التعليم','المهارات'],zh:['简介','工作经历','教育','技能'],uh:['परिचय','अनुभव','शिक्षा','कौशल']})[language]||['Profile','Experience','Education','Skills'];
  const name=(x,y,w,h=66,size=35)=>title(p,'{{Name}}',x,y,w,h,size);
  const contact=(x,y,w,h=66)=>tx(p,'{{Email}}\n{{Phone}} · {{Website}}',x,y,w,h,11);
  const section=(label,value,x,y,w,h=105)=>{title(p,label,x,y,w,33,18);tx(p,value,x,y+48,w,h-48,11);};
  if(v===0){name(36,35,540);tx(p,'{{Role}}',36,110,540,34,15,{color:accent});contact(36,156,540,47);rule(p,36,225,540,ink);section(labels[0],'{{Summary}}',36,255,540,91);section(labels[1],'{{Role}} · {{Organization}} · {{Dates}}\n{{Achievements}}',36,383,540,151);section(labels[2],'{{Qualification}} · {{Institution}} · {{Dates}}',36,573,540,78);section(labels[3],'{{Skills}}',36,681,540,69);}
  if(v===1){bx(p,0,0,174,792,pale);addBrandMark(d,p,60,36,48);contact(20,144,134,146);section(labels[3],'{{Skills}}',20,351,134,168);section(labels[2],'{{Qualification}}\n{{Institution}}',20,567,134,135);name(206,43,370,104,38);tx(p,'{{Role}}',206,174,370,34,15,{color:accent});section(labels[0],'{{Summary}}',206,248,370,132);section(labels[1],'{{Organization}} · {{Dates}}\n{{Achievements}}\n\n{{PreviousExperience}}',206,429,370,263);}
  if(v===2){name(36,41,366,96,38);contact(420,43,156,103);rule(p,36,177,540,ink);section(labels[0],'{{Summary}}',36,212,258,126);section(labels[3],'{{Skills}}',318,212,258,126);section(labels[1],'{{Organization}} · {{Dates}}\n{{Achievements}}\n\n{{PreviousExperience}}',36,390,258,319);section(labels[2],'{{Qualification}}\n{{Institution}}\n{{Dates}}',318,390,258,202);}
  if(v===3){im(p,36,32,105,105,{round:true});name(174,42,402,71,34);tx(p,'{{Role}}',174,133,402,31,15);contact(36,196,540,52);rule(p,36,282,540);const o=bx(p,51,329,2,358,pale);for(let i=0;i<3;i++){bx(p,43,348+i*112,18,18,accent,'ellipse');section(i===0?labels[0]:i===1?labels[1]:labels[2],i===0?'{{Summary}}':i===1?'{{Organization}} · {{Dates}}\n{{Achievements}}':'{{Qualification}} · {{Institution}}',84,324+i*112,492,96);}section(labels[3],'{{Skills}}',84,681,492,72);}
  if(v===4){bx(p,0,0,612,180,accent);name(36,33,540,99,43);d.stories[p.objects.find(o=>o.type==='text').storyId].style.color='#ffffff';tx(p,'{{Role}}',36,136,540,30,16,{color:'#ffffff'});contact(36,218,540,53);section(labels[0],'{{Summary}}',36,317,340,110);section(labels[1],'{{Organization}} · {{Dates}}\n{{Achievements}}\n\n{{PreviousExperience}}',36,469,340,220);bx(p,402,317,174,396,pale);section(labels[3],'{{Skills}}',418,337,142,138);section(labels[2],'{{Qualification}}\n{{Institution}}',418,536,142,144);}
  if(v===5){name(36,58,540,89,40);tx(p,'{{Role}}',36,164,540,37,17,{font:'Georgia',italic:true});contact(36,228,540,55);rule(p,36,310,540,ink);tx(p,labels.join('\n\n\n'),36,363,117,296,13,{font:'Georgia',weight:'bold'});tx(p,'{{Summary}}\n\n{{Organization}} · {{Dates}}\n{{Achievements}}\n\n{{Qualification}} · {{Institution}}\n\n{{Skills}}',182,363,394,341,12,{font:'Georgia'});}
 }
 if(entry.type==='photo-collage'){
  const p=pg();if(v===5){d.width=792;d.height=612;}d.margin=24;d.bleed=v===1?9:0;
  title(p,'{{AlbumTitle}}',24,24,d.width-48,64,v===2?32:29,{font:v===3?'Georgia':'Arial'});
  const frames=v===0?[[24,126,174,235],[219,126,174,235],[414,126,174,235],[24,400,174,235],[219,400,174,235],[414,400,174,235]]:v===1?[[0,109,418,470],[439,109,149,145],[439,271,149,145],[439,433,149,145],[24,627,174,96],[217,627,175,96],[412,627,176,96]]:v===2?[[45,147,226,224],[318,140,224,172],[43,424,220,170],[310,391,234,269]]:v===3?[[24,139,291,301],[338,139,250,154],[338,316,250,210],[24,465,291,252],[338,551,250,166]]:v===4?[[40,140,236,236],[335,154,204,204],[100,401,179,179],[321,411,244,244]]:[[24,134,232,188],[280,134,232,188],[536,134,232,188],[24,350,232,188],[280,350,232,188],[536,350,232,188]];
  if(v===2){bx(p,0,104,612,646,pale);frames.forEach(([x,y,w,h],i)=>{const angle=i%2?5:-5,back=bx(p,x-9,y-10,w+18,h+46,'#ffffff');back.rotation=angle;im(p,x,y,w,h,{rotation:angle});tx(p,`{{Caption${i+1}}}`,x+7,y+h+9,w-14,22,10);bx(p,x+w*.4,y-18,w*.2,26,accent);});}
  else frames.forEach(([x,y,w,h],i)=>{im(p,x,y,w,h,{round:v===4});if(v===0||v===5)tx(p,`{{Caption${i+1}}}`,x,y+h+8,w,23,9);});
  if(v===1)bx(p,422,109,8,470,accent);if(v===3)rule(p,24,105,564,ink);tx(p,'{{AlbumDescription}}',24,d.height-57,d.width-99,35,11);addBrandMark(d,p,d.width-57,d.height-55,24);
 }
 if(entry.type==='document'){
  const p=pg();
  if(v===0){im(p,0,0,612,395);bx(p,36,317,540,169,pale);title(p,'{{ProjectTitle}}',54,342,504,123,38);tx(p,'{{PreparedFor}}\n{{PreparedBy}} · {{Date}}',36,540,540,100,16);const q=pg();title(q,topics[0],36,46,540,87,32);body(q,36,173,540,142,14);title(q,topics[1],36,361,540,75,26);body(q,36,478,540,208,13,words[1]);foot(q);}
  if(v===1){title(p,'{{ReportTitle}}',36,48,540,105,34,{font:'Georgia'});tx(p,'{{Author}} · {{Date}}',36,187,540,27,11);rule(p,36,244,540,ink);body(p,36,282,259,317,13);body(p,317,282,259,317,13,words[1]);im(p,36,636,540,77);}
  if(v===2){bx(p,0,0,612,133,pale);title(p,'{{MeetingTitle}}',36,34,540, 70,32);tx(p,'{{Date}} · {{Time}} · {{Location}}',36,163,540,58,12);for(let i=0;i<4;i++){const y=255+i*108;title(p,`{{Agenda${i+1}}}`,36,y,258,41,20);tx(p,`{{Notes${i+1}}}`,318,y,258,58,12);rule(p,36,y+78,540,pale);}}
  if(v===3){title(p,'{{LessonTitle}}',36,42,540,89,33);tx(p,'{{Subject}} · {{Grade}} · {{Duration}}',36,160,540,49,13);const labels=['{{LearningGoals}}','{{Materials}}','{{Activities}}','{{Assessment}}'];labels.forEach((label,i)=>{const x=36+i%2*279,y=257+Math.floor(i/2)*220;bx(p,x,y,261,194,pale);tx(p,label,x+16,y+20,229,151,14);});}
  if(v===4){bx(p,0,0,130,792,pale);tx(p,'{{ProjectOwner}}\n\n{{DueDate}}\n\n{{Budget}}',20,53, 90,291,13);title(p,'{{ProjectTitle}}',164,48,412,111,33);body(p,164,201,412,128,14);for(let i=0;i<3;i++){bx(p,164,384+i*93,27,27,accent,'ellipse');tx(p,`{{Milestone${i+1}}}`,214,377+i*93,362,68,14);}}
  if(v===5){title(p,'{{PortfolioTitle}}',36,41,540,97,35);im(p,36,176,340,393);im(p,402,176,174,173);tx(p,'{{Role}}\n{{Specialty}}\n{{Website}}',402,399,174,137,13);body(p,36,616,540,89,13);const q=pg();title(q,'{{CaseStudyTitle}}',36,42,540,111,32);im(q,36,190,540,214);tx(q,'{{Challenge}}\n\n{{Approach}}\n\n{{Outcome}}',36,447,540,247,13);foot(q);}
  foot(p);
 }
 return validatePublication(templateBodyCopy(d));
}
