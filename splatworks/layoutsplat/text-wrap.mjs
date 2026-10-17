// Local alpha sampling. A band envelope keeps every opaque pixel outside text.
export async function pictureContour(asset, object) {
 const image=new Image();image.src=asset.src;await image.decode();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.scale(128/object.w,128/object.h);
 if(object.path&&object.pathViewBox){const [x,y,w,h]=object.pathViewBox;ctx.save();ctx.scale(object.w/w,object.h/h);ctx.translate(-x,-y);ctx.clip(new Path2D(object.path));ctx.translate(x,y);ctx.scale(w/object.w,h/object.h);}
 let x=0,y=0,w=object.w,h=object.h;
 if(object.crop){({x,y,w,h}={x:object.crop.x*w,y:object.crop.y*h,w:object.crop.w*w,h:object.crop.h*h});}
 else if(object.fit!=='stretch'){const scale=(object.fit==='cover'?Math.max:Math.min)(w/image.naturalWidth,h/image.naturalHeight);w=image.naturalWidth*scale;h=image.naturalHeight*scale;x=(object.w-w)/2;y=(object.h-h)/2;}
 ctx.drawImage(image,x,y,w,h);const pixels=ctx.getImageData(0,0,128,128).data,left=[],right=[];
 for(let band=0;band<16;band++){
  let lo=128,hi=-1;for(let row=band*8;row<(band+1)*8;row++)for(let col=0;col<128;col++)if(pixels[(row*128+col)*4+3]>=8){lo=Math.min(lo,col);hi=Math.max(hi,col);}
  if(hi<0){lo=64;hi=63;}left.push([lo/128,band/16],[lo/128,(band+1)/16]);right.push([(hi+1)/128,band/16],[(hi+1)/128,(band+1)/16]);
 }
 canvas.width=canvas.height=1;return [...left,...right.reverse()];
}
function vertices(image){
 const points=image.wrap==='contour'&&image.wrapContour||[[0,0],[1,0],[1,1],[0,1]],angle=(image.rotation||0)*Math.PI/180,c=Math.cos(angle),s=Math.sin(angle);
 return points.map(([x,y])=>{const dx=(x-.5)*image.w,dy=(y-.5)*image.h;return [image.x+image.w/2+dx*c-dy*s,image.y+image.h/2+dx*s+dy*c];});
}
export function wrapBounds(image){const points=vertices(image);return {left:Math.min(...points.map(p=>p[0]))-6,right:Math.max(...points.map(p=>p[0]))+6,top:Math.min(...points.map(p=>p[1]))-6,bottom:Math.max(...points.map(p=>p[1]))+6};}
export function wrapExtent(image,top,bottom){
 const points=vertices(image),xs=[];top-=6;bottom+=6;
 for(let i=0;i<points.length;i++){
  const [x,y]=points[i],[nx,ny]=points[(i+1)%points.length];if(y>=top&&y<=bottom)xs.push(x);
  for(const boundary of [top,bottom])if((y<boundary&&ny>=boundary)||(ny<boundary&&y>=boundary))xs.push(x+(nx-x)*(boundary-y)/(ny-y));
 }
 return xs.length?[Math.min(...xs)-6,Math.max(...xs)+6]:null;
}
