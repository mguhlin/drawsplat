// Contain the complete image in the largest card region that leaves room for
// optional captions and chosen border artwork. No subject detection or cropping.
export function imageCardLayout(width, height, imageWidth, imageHeight, {illustrated=false, framed=false, title=false, creator=false}={}) {
  const margin = framed ? .08 : .02;
  const left = illustrated ? .26 : margin;
  const right = illustrated ? .74 : 1-margin;
  const top = illustrated ? .17 : margin;
  const bottom = illustrated ? (title ? .60 : creator ? .69 : .76) : title ? (framed ? .72 : .76) : creator ? (framed ? .84 : .88) : 1-margin;
  const scale = Math.min((right-left)*width/imageWidth, (bottom-top)*height/imageHeight);
  const w=imageWidth*scale, h=imageHeight*scale;
  return {x:(left+right)*width/2-w/2,y:(top+bottom)*height/2-h/2,width:w,height:h};
}
