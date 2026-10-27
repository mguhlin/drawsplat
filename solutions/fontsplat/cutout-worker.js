// Original FontSplat plain-background cutout. GPL-3.0-only. No network or models.
self.onmessage=({data})=>{
 try{
 const {width:w,height:h,mode='auto',color='#ffffff',tolerance=24}=data,rgba=new Uint8ClampedArray(data.pixels),count=w*h;
 if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||count>4200000||rgba.length!==count*4)throw Error('Use a picture up to 4.2 megapixels.');
 const bins=new Map();let votes=0;
 const vote=(pixel,weight)=>{const at=pixel*4;if(rgba[at+3]<220)return;const neutral=Math.min(rgba[at],rgba[at+1],rgba[at+2])>=205&&Math.max(rgba[at],rgba[at+1],rgba[at+2])-Math.min(rgba[at],rgba[at+1],rgba[at+2])<40,key=neutral?4095:(rgba[at]>>4)*256+(rgba[at+1]>>4)*16+(rgba[at+2]>>4),bin=bins.get(key)||{n:0,r:0,g:0,b:0};bin.n+=weight;bin.r+=rgba[at]*weight;bin.g+=rgba[at+1]*weight;bin.b+=rgba[at+2]*weight;votes+=weight;bins.set(key,bin);};
 for(let x=0;x<w;x+=2){vote(x,8);vote((h-1)*w+x,8);}for(let y=0;y<h;y+=2){vote(y*w,8);vote(y*w+w-1,8);}
 const edgeVotes=votes;
 // A transparent outer canvas can surround a second, opaque white rectangle.
 for(let y=1;y<h-1;y+=2)for(let x=1;x<w-1;x+=2){const p=y*w+x;if(rgba[p*4+3]>220&&[p-1,p+1,p-w,p+w].some(n=>rgba[n*4+3]<16))vote(p,1);}
 const dominant=[...bins.values()].sort((a,b)=>b.n-a.n)[0];
 if(mode==='auto'&&(!dominant||dominant.n/Math.max(1,votes)<.28)){self.postMessage({changed:false,note:'No plain backdrop detected. Choose White, Black or a background color, then remove it.'});return;}
 const detectedWhite=dominant&&Math.min(dominant.r,dominant.g,dominant.b)/dominant.n>205;const autoTolerance=mode==='auto'&&detectedWhite?Math.min(60,255-Math.min(dominant.r,dominant.g,dominant.b)/dominant.n+Number(tolerance)):Number(tolerance);
 const target=mode==='auto'&&detectedWhite?[255,255,255]:mode==='white'?[255,255,255]:mode==='black'?[0,0,0]:mode==='color'?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)):['r','g','b'].map(k=>dominant[k]/dominant.n);
 if(mode==='auto'&&edgeVotes===0&&Math.min(...target)<230){self.postMessage({changed:false,note:'Existing transparency was preserved. Choose a background color for further removal.'});return;}
 if(target.some(n=>!Number.isFinite(n)))throw Error('Choose a valid background color.');
 const threshold=Math.max(0,Math.min(90,autoTolerance||0)),soft=20,seen=new Uint8Array(count),pending=new Int32Array(count);let start=0,end=0,removed=0;
 const distance=at=>Math.max(Math.abs(rgba[at]-target[0]),Math.abs(rgba[at+1]-target[1]),Math.abs(rgba[at+2]-target[2]));
 const enqueue=p=>{if(seen[p])return;seen[p]=1;const at=p*4;if(rgba[at+3]<16||distance(at)<=threshold+soft)pending[end++]=p;};
 for(let x=0;x<w;x++){enqueue(x);enqueue((h-1)*w+x);}for(let y=0;y<h;y++){enqueue(y*w);enqueue(y*w+w-1);}
 while(start<end){const p=pending[start++],at=p*4,alpha=rgba[at+3];if(alpha){const keep=Math.max(0,Math.min(1,(distance(at)-threshold)/soft));rgba[at+3]=Math.round(alpha*keep);if(alpha>32&&rgba[at+3]<16)removed++;}const x=p%w;if(x>0)enqueue(p-1);if(x<w-1)enqueue(p+1);if(p>=w)enqueue(p-w);if(p<count-w)enqueue(p+w);}
 let left=w,top=h,right=-1,bottom=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(rgba[(y*w+x)*4+3]>12){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 if(right<left||removed<4){self.postMessage({changed:false,note:'No removable edge background found. The original picture was kept.'});return;}
 const pad=2;left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(w-1,right+pad);bottom=Math.min(h-1,bottom+pad);
 self.postMessage({changed:true,pixels:rgba.buffer,width:w,height:h,crop:{x:left,y:top,w:right-left+1,h:bottom-top+1},removed,note:'Plain background removed; enclosed details were preserved.'},[rgba.buffer]);
 }catch(e){self.postMessage({error:e.message});}
};
