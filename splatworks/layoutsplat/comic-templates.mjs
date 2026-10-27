import {newPublication,uid,frame,shape,textStyle,validatePublication} from './engine.mjs';
import {loremCopy} from './template-copy.mjs';
const layouts = [
  ['comic-six','Six-panel adventure',[[0,0,1,1],[1,0,1,1],[0,1,1,1],[1,1,1,1],[0,2,1,1],[1,2,1,1]],2,3],
  ['comic-nine','Nine-panel rhythm',Array.from({length:9},(_,i)=>[i%3,Math.floor(i/3),1,1]),3,3],
  ['comic-splash','Hero splash & two panels',[[0,0,2,2],[0,2,1,1],[1,2,1,1]],2,3],
  ['comic-four','Four-panel story',[[0,0,1,1],[1,0,1,1],[0,1,1,1],[1,1,1,1]],2,2],
  ['comic-strip','Four-beat comic strip',Array.from({length:4},(_,i)=>[i,0,1,1]),4,1],
  ['comic-vertical','Vertical scrolling story',Array.from({length:3},(_,i)=>[0,i,1,1]),1,3],
];
export const COMIC_TEMPLATES = [
  {id:'comic-missing-color',name:'The Missing Color · complete sample comic',description:'Two pages · six illustrated panels · editable captions and dialogue',sample:true},
  {id:'comic-library-signal',name:'Signal from the Library · complete sample comic',description:'Two pages · six illustrated panels · editable captions and dialogue',sample:true},
  ...layouts.map(([id,name])=>({id,name,description:'Blank editable panels · placeholder captions · ready for your artwork'})),
].map(e=>({...e,type:'comic',sector:'arts',industries:['arts','education','library','community'],designName:e.name,orientation:e.id==='comic-strip'?'landscape':'portrait'}));
const tales={
 'comic-missing-color':{title:'THE MISSING COLOR',chapters:['An unusual morning','A color worth sharing'],lines:[
  ['The studio had every color. Except one.', 'Pip: Where did our purple go?', 'Dot: Let’s follow the blank pages!'],
  ['A tiny trail led past the ink shelf.', 'Pip: These shapes look like clues.', 'Dot: Or the start of a new idea.'],
  ['At the bridge, a page began to glow.', 'Pip: Someone is drawing with light!', 'Dot: We can help finish the picture.'],
  ['They found a reader with an unfinished book.', 'Reader: I borrowed a little purple.', 'Pip: Then let’s make enough for everyone.'],
  ['A page, a pattern, a splash of imagination.', 'Dot: Mix your idea with mine.', 'Pip: Look! The whole story is coming alive.'],
  ['The studio had every color. And a new friend.', 'Pip: The best color is one we share.', 'Dot: Tomorrow, let’s try a new chapter.'],
 ]},
 'comic-library-signal':{title:'SIGNAL FROM THE LIBRARY',chapters:['A message in the margins','The story finds a reader'],lines:[
  ['A soft beep interrupted a quiet afternoon.', 'Dot: That signal came from a book!', 'Pip: Then someone must have a story to tell.'],
  ['The message was made of shapes and patterns.', 'Pip: Three circles, then a little star.', 'Dot: It’s a map. Let’s read it together.'],
  ['At the bridge, the map folded into an arrow.', 'Pip: Which way do we go?', 'Dot: Toward the question nobody has asked.'],
  ['Behind a shelf, an old drawing waited.', 'Pip: This invention needs one last part.', 'Dot: A reader with a little imagination!'],
  ['They added a page, a voice, and a moving picture.', 'Pip: A story can be more than words.', 'Dot: Now everyone can find a way in.'],
  ['The signal became an invitation.', 'Pip: Your turn. What happens next?', 'Dot: There’s always room for another story.'],
 ]},
};
export function comicPublication(id,{theme,language='en'}={}){
 const entry=COMIC_TEMPLATES.find(e=>e.id===id);if(!entry)throw Error('Unknown comic template.');
 const d=newPublication(true),ink=theme?.ink||'#34205c',accent=theme?.accent||'#7c3aed';
 d.pages=[];d.width=id==='comic-strip'?1008:612;d.height=id==='comic-strip'?432:792;d.margin=30;d.guides.columns=1;d.language=language;d.title=tales[id]?.title||entry.name;d.templateId=id;d.publicationType='comic';d.ebookMetadata={author:'Your name',language:language==='uh'?'hi':language,rights:'CC0 1.0 — original LayoutSplat sample story and artwork; reuse and adapt.'};
 const text=(p,value,x,y,w,h,size=12,heading=0)=>{const sid=uid(),f=frame(sid,x,y,w,h);f.padding=0;if(heading)f.readingHeading=heading;d.stories[sid]={text:value,frames:[f.id],marks:[],style:{...textStyle(),font:'Arial',color:ink,size,lineHeight:1.2,direction:language==='ar'?'rtl':'ltr',align:language==='ar'?'right':'left',weight:heading?'bold':'normal'}};p.objects.push(f);return f;};
 const page=(label,n)=>{const p={id:uid(),objects:[]};d.pages.push(p);text(p,d.title,30,20,d.width-60,32,21,1);text(p,label,30,59,d.width-60,23,10);text(p,'LayoutSplat · '+n,30,d.height-27,d.width-60,18,9);return p;};
 const panel=(p,x,y,w,h)=>{const b=shape(x,y,w,h,'#ffffff');b.stroke=ink;b.strokeWidth=1.5;p.objects.push(b);};
 if(tales[id]){
  const tale=tales[id];
  for(let pi=0;pi<2;pi++){
   const p=page(tale.chapters[pi],pi+1);
   for(let row=0;row<3;row++){
    const i=pi*3+row,x=30,y=92+row*214,w=552,h=200,reverse=id==='comic-library-signal',artX=reverse?x+281:x+1,copyX=reverse?x+14:x+285;panel(p,x,y,w,h);
    const aid='comic-scene-'+(i+1);d.assets[aid]={src:`comic-art-${i+1}.svg`,sample:true,name:'Original LayoutSplat comic scene '+(i+1),alt:tale.lines[i][0],width:600,height:300};
    p.objects.push({id:uid(),type:'image',assetId:aid,x:artX,y:y+1,w:270,h:h-2,rotation:0,fit:'contain',locked:false});
    text(p,tale.lines[i][0],copyX,y+13,253,42,12);
    for(let k=1;k<=2;k++){const by=y+62+(k-1)*66,b=shape(copyX-2,by,255,58,k===1?'#f0e9ff':'#fff2d6');b.strokeWidth=.5;b.stroke=accent;p.objects.push(b);text(p,tale.lines[i][k],copyX+9,by+10,232,43,12);}
   }
  }
 }else{
  const recipe=layouts.find(e=>e[0]===id),[, ,boxes,cols,rows]=recipe,p=page('Replace the panels with your own story and artwork',1),gap=12,usableW=d.width-60,usableH=d.height-136,cw=(usableW-gap*(cols-1))/cols,ch=(usableH-gap*(rows-1))/rows;
  boxes.forEach(([col,row,sw,sh],i)=>{const x=30+col*(cw+gap),y=92+row*(ch+gap),w=sw*cw+(sw-1)*gap,h=sh*ch+(sh-1)*gap;panel(p,x,y,w,h);const accentBar=shape(x+1,y+1,w-2,5,accent);p.objects.push(accentBar);text(p,'PANEL '+(i+1),x+12,y+14,w-24,24,10,2);text(p,loremCopy(Math.min(75,Math.floor(w*.35))),x+12,y+h-65,w-24,52,11);});
 }
 return validatePublication(d);
}
