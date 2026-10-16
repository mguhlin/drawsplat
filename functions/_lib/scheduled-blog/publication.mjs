// Server-clock publication gates; no query parameter or browser clock can reveal a future post.
const noCache={'Cache-Control':'no-store, no-transform','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
const policy="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self'";
const respond=(body,type,status=200,extra={})=>new Response(body,{status,headers:{...noCache,'Content-Type':type,...extra}});
export function privateSourceResponse(request){
 const path=new URL(request.url).pathname;
 return path.startsWith('/server/blog/')||path.startsWith('/functions/')?respond('Not found','text/plain; charset=utf-8',404,{'X-Robots-Tag':'noindex'}):null;
}
export async function scheduledBlog(context,posts,now=Date.now()){
 const url=new URL(context.request.url),path=url.pathname,live=posts.filter(p=>Number.isFinite(Date.parse(p.publishAt))&&Date.parse(p.publishAt)<=now);
 if(!['GET','HEAD'].includes(context.request.method))return respond('Method not allowed','text/plain; charset=utf-8',405,{'Allow':'GET, HEAD'});
 let response;
 if(path==='/blog/publication-schedule.json'){
  const future=posts.map(p=>Date.parse(p.publishAt)).filter(t=>Number.isFinite(t)&&t>now).sort((a,b)=>a-b);
  response=respond(JSON.stringify({version:1,nextPublishAt:future.length?new Date(future[0]).toISOString():null,published:live.map(p=>p.path)}),'application/json; charset=utf-8');
 }else if(path==='/blog/drawsplat.rss'){
  const headers=new Headers(context.request.headers);for(const key of ['if-none-match','if-modified-since','range','if-range'])headers.delete(key);
  const original=await context.next(new Request(context.request,{method:'GET',headers}));if(!original.ok)return original;let xml=await original.text();
  if(!xml.includes('</channel>'))return respond('Feed unavailable','text/plain; charset=utf-8',502);
  for(const post of live){xml=xml.replace(/<item\b[^>]*>[\s\S]*?<\/item>/g,item=>[post.url,post.canonical].some(link=>item.includes('<link>'+link+'</link>'))?'':item);}
  const sorted=[...live].sort((a,b)=>Date.parse(b.publishAt)-Date.parse(a.publishAt));xml=xml.replace(/(<channel\b[^>]*>)/,'$1'+sorted.map(p=>p.rssItem).join(''));
  response=respond(xml,'application/rss+xml; charset=utf-8');
 }else{
  const post=posts.find(p=>[p.path,p.path.slice(0,-1),p.path.slice(0,-1)+'.html'].includes(path));
  if(!post)return context.next();
  if(!live.includes(post))response=respond('Not found','text/plain; charset=utf-8',404,{'X-Robots-Tag':'noindex'});
  else if(path!==post.path)response=respond(null,'text/plain',308,{'Location':post.path+url.search});
  else response=respond(post.html,'text/html; charset=utf-8',200,{'Content-Security-Policy':policy,'Strict-Transport-Security':'max-age=31536000','Permissions-Policy':'geolocation=(), payment=(), usb=()'});
 }
 return context.request.method==='HEAD'?new Response(null,{status:response.status,headers:response.headers}):response;
}
