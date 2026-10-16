// Decode the bounded bitmap-only WMF subset used by the Publisher exporter.
// Other metafiles go through the ordinary media importer rather than losing
// drawing operations that this reader does not implement.
export function wmfDib(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<18||view.getUint16(2,true)!==9)return null;
 let at=18,dib;
 while(at+6<=bytes.length){
  const size=view.getUint32(at,true)*2,fn=view.getUint16(at+4,true);
  if(size<6||at+size>bytes.length)return null;
  if(fn===0x0f43){
   if(dib||size<68||view.getUint32(at+6,true)!==0x00cc0020||view.getUint16(at+10,true)!==0)return null;
   const start=at+28,n=view.getUint32(start,true),w=view.getInt32(start+4,true),h=view.getInt32(start+8,true);
   if(n!==40||w<1||h<1||w>16384||h>16384||w*h>8000000||view.getUint16(start+12,true)!==1||view.getUint16(start+14,true)!==24||view.getUint32(start+16,true)!==0)return null;
   if(view.getUint16(at+12,true)!==h||view.getUint16(at+14,true)!==w||view.getUint16(at+16,true)||view.getUint16(at+18,true)||view.getUint16(at+20,true)!==h||view.getUint16(at+22,true)!==w||view.getUint16(at+24,true)||view.getUint16(at+26,true))return null;
   const length=40+((w*3+3)&~3)*h;if(start+length>at+size)return null;dib=bytes.slice(start,start+length);
  }else if(![0,0x0103,0x020b,0x020c].includes(fn))return null;
  at+=size;if(fn===0)break;
 }
 if(!dib)return null;
 const bmp=new Uint8Array(14+dib.length),header=new DataView(bmp.buffer);bmp.set([0x42,0x4d]);header.setUint32(2,bmp.length,true);header.setUint32(10,54,true);bmp.set(dib,14);return bmp;
}
