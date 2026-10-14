const {test,expect}=require('@playwright/test');
const vm=require('node:vm');
test('whiteboard offline worker refreshes LayoutSplat modules and keeps offline fallback',async({request})=>{
 let handleFetch,online=true,network=0;const cached=new Response('old module');
 vm.runInNewContext(await(await request.get('/sw.js')).text(),{URL,Response,self:{location:{origin:'https://audit.test'},addEventListener:(name,fn)=>{if(name==='fetch')handleFetch=fn}},caches:{match:async()=>cached.clone(),open:async()=>({put:async()=>{}})},fetch:async()=>{network++;if(!online)throw Error('offline');return new Response('updated module')}});
 for(const path of ['/splatworks/layoutsplat/publishing-ui.mjs','/splatworks/layoutsplat/styles.css','/assets/css/support-wiki.css']){
  const fetch=()=>new Promise(resolve=>handleFetch({request:{url:'https://audit.test'+path,method:'GET',mode:'cors',destination:'script',headers:new Headers()},respondWith:resolve}));
  online=true;expect(await(await fetch()).text()).toBe('updated module');online=false;expect(await(await fetch()).text()).toBe('old module');
 }
 expect(network).toBe(6);
});
