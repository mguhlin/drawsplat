import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {scheduledBlog,privateSourceResponse} from '../functions/_lib/scheduled-blog/publication.mjs';
import {posts} from '../functions/_lib/scheduled-blog/generated-posts.mjs';

const classroom=posts.filter(post=>post.series==='classroom-series');
const now=Date.parse('2026-11-06T16:00:00Z');
const context=(path,xml='<rss><channel><title>Blog</title></channel></rss>')=>({request:new Request('https://splatworks.org'+path),next:async()=>new Response(xml)});
const feed=()=>readFileSync(new URL('../blog/drawsplat.rss',import.meta.url),'utf8');

test('all 66 migrated lessons retain local images, native canonical URLs and their original publication times',()=>{
 assert.equal(classroom.length,66);
 assert.equal(classroom.filter(post=>Date.parse(post.publishAt)>now).length,47);
 assert.equal(classroom.filter(post=>Date.parse(post.publishAt)<=now).length,19);
 for(const post of classroom){
  assert.equal(post.canonical,post.url);
  assert.equal(post.sourceUrl,'https://mguhlin.org'+post.path);
  assert.ok(post.html.includes('rel="canonical" href="'+post.url+'"'));
  assert.ok(!post.html.includes('Also published on'));
  assert.ok(!post.html.includes('Student planning · PlanSplat'));
  assert.ok(post.html.includes(post.imageAlt.replaceAll('&','&amp;').replaceAll('"','&quot;')));
  for(const src of [post.image,...[...post.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(match=>match[1])]) assert.ok(existsSync(new URL('..'+src,import.meta.url)),src);
  const before=Date.parse(post.publishAt),date=new Date(before);
  assert.equal(new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',hour:'2-digit',minute:'2-digit',hour12:false}).format(date),'04:45');
 }
});

test('every migrated lesson is unavailable before its timestamp and released at the exact boundary',async()=>{
 for(const post of classroom){
  const due=Date.parse(post.publishAt);
  for(const alias of [post.path,post.path.slice(0,-1),post.path.slice(0,-1)+'.html']){
   const hidden=await scheduledBlog(context(alias+'?now=9999999999999'),posts,due-1);
   assert.equal(hidden.status,404,alias);assert.equal(await hidden.text(),'Not found');
   assert.match(hidden.headers.get('Cache-Control'),/no-store/);
  }
  const live=await scheduledBlog(context(post.path),posts,due);
  assert.equal(live.status,200);assert.equal(await live.text(),post.html);
 }
});

test('current feed and schedule show the 19 published lessons and hide the 47 future lessons',async()=>{
 const response=await scheduledBlog(context('/blog/drawsplat.rss',feed()),posts,now);
 const xml=await response.text();
 for(const post of classroom){
  assert.equal(xml.includes('<link>'+post.url+'</link>'),Date.parse(post.publishAt)<=now,post.slug);
  assert.ok(!xml.includes('<link>'+post.sourceUrl+'</link>'));
  if(Date.parse(post.publishAt)>now)assert.ok(!xml.includes(post.title));
 }
 const dates=[...xml.matchAll(/<pubDate>([^<]+)<\/pubDate>/g)].map(m=>Date.parse(m[1]));
 assert.deepEqual(dates,[...dates].sort((a,b)=>b-a));
 const schedule=await (await scheduledBlog(context('/blog/publication-schedule.json'),posts,now)).json();
 assert.equal(schedule.nextPublishAt,'2026-11-08T10:45:00.000Z');
 assert.equal(schedule.published.length,20); // Includes the existing PlanSplat walkthrough.
 assert.ok(!JSON.stringify(schedule).includes('Where Did the Salt Go'));
});

test('a stale imported copy cannot reveal a future lesson and becomes exactly one native entry when due',async()=>{
 const post=classroom.find(p=>p.slug.startsWith('2026-11-08-'));
 const xml='<rss><channel><title>Blog</title><item><title>'+post.title+'</title><link>'+post.sourceUrl+'</link></item></channel></rss>';
 const before=await (await scheduledBlog(context('/blog/drawsplat.rss',xml),posts,Date.parse(post.publishAt)-1)).text();
 assert.ok(!before.includes(post.title));
 const after=await (await scheduledBlog(context('/blog/drawsplat.rss',xml),posts,Date.parse(post.publishAt))).text();
 assert.equal(after.split('<link>'+post.url+'</link>').length-1,1);
 assert.ok(!after.includes(post.sourceUrl));
});

test('compact invocation routes cover every alias without routing the apps or exposing private source',()=>{
 const routes=JSON.parse(readFileSync(new URL('../_routes.json',import.meta.url)));
 assert.ok(routes.include.length+routes.exclude.length<=100);
 assert.ok(routes.include.every(route=>route.length<=100));
 assert.ok(!routes.include.includes('/*'));assert.ok(!routes.include.includes('/blog/*'));
 const matches=(route,path)=>route.endsWith('*')?path.startsWith(route.slice(0,-1)):path===route;
 for(const post of classroom)for(const alias of [post.path,post.path.slice(0,-1),post.path.slice(0,-1)+'.html'])assert.ok(routes.include.some(route=>matches(route,alias)),alias);
 for(const path of ['/app/whiteboard.html','/solutions/imagesplat/','/blog/index.html'])assert.ok(!routes.include.some(route=>matches(route,path)));
 for(const path of ['/functions/_lib/scheduled-blog/posts.json','/functions/_lib/scheduled-blog/generated-posts.mjs','/server/blog/posts.json'])assert.equal(privateSourceResponse(new Request('https://splatworks.org'+path)).status,404);
});
