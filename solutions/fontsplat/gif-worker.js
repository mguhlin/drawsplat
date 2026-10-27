self.window=self;
importScripts('../../assets/js/gif-encoder.js');
self.onmessage=({data:{frames,delayMs}})=>{try{const canvases=frames.map(f=>({width:f.width,height:f.height,getContext:()=>({getImageData:()=>f})}));self.postMessage({blob:DrawSplatGifEncoder.encode(canvases,{delayMs,loopCount:0,mode:'best',dither:true,transparent:true})});}catch(e){self.postMessage({error:e.message});}};
