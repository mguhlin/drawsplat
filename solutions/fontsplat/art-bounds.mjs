// Expand the SVG viewport around transformed layers without changing their
// original coordinate system (and therefore their saved handle positions).
export function rotatedRect(x,y,width,height,rotation=0,scale=1,dx=0,dy=0,cx=x+width/2,cy=y+height/2){
 const a=rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 return [[x,y],[x+width,y],[x,y+height],[x+width,y+height]].map(([px,py])=>({x:cx+dx+scale*((px-cx)*c-(py-cy)*s),y:cy+dy+scale*((px-cx)*s+(py-cy)*c)}));
}
export function pictureBounds(images,box){
 return images.flatMap(im=>{const w=box.width*im.width/100,h=w/im.aspect,x=box.x+box.width*im.x/100,y=box.y+box.height*im.y/100;return rotatedRect(x-w/2,y-h/2,w,h,im.rotation);});
}
export function containArtwork(art,points,p){
 const x=Math.floor(Math.min(0,...points.map(p=>p.x))),y=Math.floor(Math.min(0,...points.map(p=>p.y))),right=Math.ceil(Math.max(art.width,...points.map(p=>p.x))),bottom=Math.ceil(Math.max(art.height,...points.map(p=>p.y)));
 if(x===0&&y===0&&right===art.width&&bottom===art.height)return art;
 const width=right-x,height=bottom-y;
 const start=art.svg.indexOf('>')+1,inner=art.svg.slice(start,art.svg.lastIndexOf('</svg>'));
 const opening=art.svg.slice(0,start).replace(/width="[^"]+" height="[^"]+"/,`width="${width}" height="${height}"`).replace(/viewBox="[^"]+"/,`viewBox="0 0 ${width} ${height}"`);
 return {...art,width,height,cropTop:0,cropBottom:0,svg:opening+(p.transparent?'':`<rect width="${width}" height="${height}" fill="${p.background}"/>`)+`<g transform="translate(${-x} ${-y})">${inner}</g></svg>`};
}
