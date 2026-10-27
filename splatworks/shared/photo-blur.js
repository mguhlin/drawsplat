/* Local, baked-pixel photo blur. MIT; see LICENSE.txt in this directory. */
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
function path(ctx,selection){ctx.beginPath();if(selection.type==='rect')ctx.rect(selection.x,selection.y,selection.w,selection.h);else{selection.points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}}
export async function renderPhotoBlur(source,{radius=10,selection=null}={}){
 const w=source.width||source.naturalWidth,h=source.height||source.naturalHeight;if(!w||!h||w*h>16000000)throw Error('The working photo must be under 16 megapixels.');
 radius=Math.max(0,Math.min(60,Number(radius)||0));
 if(selection&&(selection.type!=='rect'&&selection.type!=='lasso'||selection.type==='lasso'&&(!Array.isArray(selection.points)||selection.points.length<3||selection.points.length>2048)))throw Error('Draw a rectangle or closed lasso first.');
 const out=makeCanvas(w,h),ctx=out.getContext('2d');ctx.drawImage(source,0,0,w,h);if(radius===0)return out;
 const pad=Math.ceil(radius*3),padded=makeCanvas(w+pad*2,h+pad*2),p=padded.getContext('2d'),blurred=makeCanvas(w,h),b=blurred.getContext('2d');
 try{
  p.drawImage(source,pad,pad,w,h);
  // Extend edge pixels, so a full-photo blur does not fade to transparency.
  p.drawImage(source,0,0,w,1,pad,0,w,pad);p.drawImage(source,0,h-1,w,1,pad,h+pad,w,pad);
  p.drawImage(source,0,0,1,h,0,pad,pad,h);p.drawImage(source,w-1,0,1,h,w+pad,pad,pad,h);
  for(const [sx,sy,dx,dy]of [[0,0,0,0],[w-1,0,w+pad,0],[0,h-1,0,h+pad],[w-1,h-1,w+pad,h+pad]])p.drawImage(source,sx,sy,1,1,dx,dy,pad,pad);
  if('filter'in b){b.filter=`blur(${radius}px)`;b.drawImage(padded,-pad,-pad);b.filter='none';}
  else{
   const src=padded.toDataURL('image/png'),svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}"><defs><filter id="blur" x="-${pad}" y="-${pad}" width="${w+pad*2}" height="${h+pad*2}" filterUnits="userSpaceOnUse"><feGaussianBlur stdDeviation="${radius}"/></filter></defs><image x="-${pad}" y="-${pad}" width="${padded.width}" height="${padded.height}" xlink:href="${src}" filter="url(#blur)"/></svg>`,url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),image=new Image();
   try{image.src=url;await image.decode();b.drawImage(image,0,0);}finally{URL.revokeObjectURL(url);}
  }
  if(selection){b.globalCompositeOperation='destination-in';path(b,selection);b.fill();b.globalCompositeOperation='source-over';}
  ctx.clearRect(0,0,w,h);if(selection){ctx.drawImage(source,0,0,w,h);ctx.save();ctx.globalCompositeOperation='destination-out';path(ctx,selection);ctx.fill();ctx.restore();}ctx.drawImage(blurred,0,0);return out;
 }catch(error){out.width=out.height=1;throw error;}
 finally{padded.width=padded.height=blurred.width=blurred.height=1;}
}
export async function openPhotoBlur(source,{onApply,name='Blurred photo'}={}){
 if(document.getElementById('photoBlurDialog'))return;
 let image=source;
 if(typeof source==='string'){
  if(source.length>90000000||!/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(source))throw Error('Choose an embedded photo before opening blur.');
  image=new Image();image.src=source;await image.decode();
 }
 if(document.getElementById('photoBlurDialog'))return;
 const sw=image.naturalWidth||image.width,sh=image.naturalHeight||image.height,ratio=Math.min(1,Math.sqrt(16000000/(sw*sh)),16384/sw,16384/sh);
 if(!sw||!sh)throw Error('The photo could not be opened.');
 const width=Math.max(1,Math.floor(sw*ratio)),height=Math.max(1,Math.floor(sh*ratio)),base=makeCanvas(width,height);base.getContext('2d').drawImage(image,0,0,width,height);
 const dialog=document.createElement('dialog');dialog.id='photoBlurDialog';dialog.setAttribute('aria-labelledby','photoBlurTitle');
 dialog.style.cssText='width:min(1050px,96vw);max-width:96vw;max-height:94dvh;overflow:auto;padding:20px;border:1px solid #d4c4e8;border-radius:13px;background:#fff;color:#34205c;box-sizing:border-box;font:14px/1.5 Arial,sans-serif';
 dialog.innerHTML=`<div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><h2 id="photoBlurTitle" style="margin:0;font-size:22px">Blur photo</h2><button type="button" id="blurClose">Cancel</button></div><p style="color:#756487;font-size:12px">Blur the whole photo, or draw a rectangle or freehand lasso. The selection outline moves; the saved picture contains only the edited pixels.</p><div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:14px"><label>Area <select id="blurMode"><option value="whole">Whole photo</option><option value="rect">Rectangle</option><option value="lasso">Freehand lasso</option></select></label><label>Blur strength <input id="blurRadius" type="range" min="1" max="60" value="12" style="accent-color:#7c3aed"><output id="blurRadiusValue">12 px</output></label><label><input id="blurOriginal" type="checkbox">Show original</label><button id="blurClear" type="button">Clear selection</button></div><div id="blurStage" style="position:relative;margin:0 auto;background:repeating-conic-gradient(#ece6f4 0 25%,#fff 0 50%) 0/20px 20px;overflow:hidden;border:1px solid #d4c4e8"><canvas id="blurPreview" style="display:block;width:100%;height:100%"></canvas><canvas id="blurSelection" tabindex="0" aria-label="Photo selection canvas. Draw a rectangle or lasso. Arrow keys move a selection; Delete clears it." style="position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:crosshair"></canvas></div><p id="blurStatus" role="status" style="font-size:12px;color:#756487;min-height:20px"></p><div style="display:flex;justify-content:flex-end;gap:10px"><button id="blurDownload" type="button">Download PNG</button><button id="blurApply" type="button" style="background:#7c3aed;color:#fff;border:0;border-radius:7px;padding:10px 16px">Apply blur</button></div>`;
 document.body.append(dialog);const $=id=>dialog.querySelector('#'+id),preview=$('blurPreview'),overlay=$('blurSelection'),stage=$('blurStage');preview.width=overlay.width=width;preview.height=overlay.height=height;
 const overlayContext=overlay.getContext('2d');let selection=null,drag=null,revision=0,animation,closed=false,timer,busy=false;
 function size(){const scale=Math.min(1,(dialog.clientWidth-44)/width,(innerHeight*.53)/height);stage.style.width=Math.max(1,width*scale)+'px';stage.style.height=Math.max(1,height*scale)+'px';}
 function usable(){return $('blurMode').value==='whole'||selection&&(selection.type==='rect'?selection.w>1&&selection.h>1:selection.points.length>=3);}
 function controls(){const disabled=busy||!usable();$('blurApply').disabled=$('blurDownload').disabled=disabled;$('blurClear').disabled=!selection;}
 function note(){return `${width} × ${height}${ratio<1?' · large photo resized to a 16-megapixel working image':''}. `+($('blurMode').value==='whole'?'Whole-photo blur.':selection?'Selection ready. Drag to draw another; arrow keys move it.':'Draw a selection on the photo.');}
 async function update(){const ticket=++revision;busy=true;controls();$('blurRadiusValue').value=$('blurRadius').value+' px';const options={radius:Number($('blurRadius').value),selection:$('blurMode').value==='whole'?null:structuredClone(selection)};
  try{const result=$('blurOriginal').checked||!usable()?base:await renderPhotoBlur(base,options);if(closed||ticket!==revision){if(result!==base)result.width=result.height=1;return;}preview.getContext('2d').clearRect(0,0,width,height);preview.getContext('2d').drawImage(result,0,0);if(result!==base)result.width=result.height=1;$('blurStatus').textContent=note();}
  catch(error){$('blurStatus').textContent=error.message;}
  finally{if(ticket===revision){busy=false;controls();}}
 }
 function queue(){clearTimeout(timer);timer=setTimeout(update,70);}
 const point=event=>{const r=overlay.getBoundingClientRect();return [Math.max(0,Math.min(width,(event.clientX-r.left)/r.width*width)),Math.max(0,Math.min(height,(event.clientY-r.top)/r.height*height))];};
 overlay.onpointerdown=event=>{if($('blurMode').value==='whole')return;event.preventDefault();overlay.setPointerCapture(event.pointerId);overlay.focus();const p=point(event);drag={start:p};selection=$('blurMode').value==='rect'?{type:'rect',x:p[0],y:p[1],w:0,h:0}:{type:'lasso',points:[p]};controls();};
 overlay.onpointermove=event=>{if(!drag)return;const p=point(event);if(selection.type==='rect'){selection.x=Math.min(p[0],drag.start[0]);selection.y=Math.min(p[1],drag.start[1]);selection.w=Math.abs(p[0]-drag.start[0]);selection.h=Math.abs(p[1]-drag.start[1]);}else if(selection.points.length<2048){const last=selection.points.at(-1);if(Math.hypot(p[0]-last[0],p[1]-last[1])>1)selection.points.push(p);}};
 overlay.onpointerup=event=>{if(!drag)return;drag=null;if(overlay.hasPointerCapture(event.pointerId))overlay.releasePointerCapture(event.pointerId);update();};overlay.onpointercancel=()=>{drag=null;selection=null;update();};
 overlay.onkeydown=event=>{if(!selection)return;if(['Delete','Backspace'].includes(event.key)){event.preventDefault();selection=null;update();return;}const vector={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(!vector)return;event.preventDefault();const step=event.shiftKey?10:1,dx=vector[0]*step,dy=vector[1]*step;if(selection.type==='rect'){selection.x=Math.max(0,Math.min(width-selection.w,selection.x+dx));selection.y=Math.max(0,Math.min(height-selection.h,selection.y+dy));}else{const xs=selection.points.map(p=>p[0]),ys=selection.points.map(p=>p[1]),mx=Math.max(-Math.min(...xs),Math.min(width-Math.max(...xs),dx)),my=Math.max(-Math.min(...ys),Math.min(height-Math.max(...ys),dy));selection.points=selection.points.map(([x,y])=>[x+mx,y+my]);}queue();};
 function ants(time){if(closed)return;overlayContext.clearRect(0,0,width,height);if(selection){const scale=overlay.getBoundingClientRect().width/width;path(overlayContext,selection);overlayContext.setLineDash([]);overlayContext.strokeStyle='white';overlayContext.lineWidth=3/scale;overlayContext.stroke();overlayContext.setLineDash([7/scale,7/scale]);overlayContext.lineDashOffset=-time/90/scale;overlayContext.strokeStyle='#34205c';overlayContext.lineWidth=1.5/scale;overlayContext.stroke();}animation=requestAnimationFrame(ants);}
 $('blurMode').onchange=()=>{selection=null;drag=null;update();};$('blurRadius').oninput=queue;$('blurOriginal').onchange=update;$('blurClear').onclick=()=>{selection=null;update();};$('blurClose').onclick=()=>dialog.close();
 async function finish(download){if(!usable()||busy)return;busy=true;controls();let result;try{result=await renderPhotoBlur(base,{radius:Number($('blurRadius').value),selection:$('blurMode').value==='whole'?null:selection});if(download){const blob=await new Promise(resolve=>result.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG export failed.');const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='Blurred-photo.png';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('blurStatus').textContent='Blurred PNG downloaded.';}else{await onApply?.(result);dialog.close();}}catch(error){$('blurStatus').textContent=error.message;}finally{if(result)result.width=result.height=1;busy=false;if(!closed)controls();}}
 $('blurApply').onclick=()=>finish(false);$('blurDownload').onclick=()=>finish(true);
 const previous=document.activeElement;dialog.addEventListener('close',()=>{closed=true;revision++;clearTimeout(timer);cancelAnimationFrame(animation);window.removeEventListener('resize',size);base.width=base.height=preview.width=preview.height=overlay.width=overlay.height=1;dialog.remove();previous?.focus?.();},{once:true});window.addEventListener('resize',size);dialog.showModal();size();update();animation=requestAnimationFrame(ants);return dialog;
}
