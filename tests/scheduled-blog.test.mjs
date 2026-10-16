import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scheduledBlog,privateSourceResponse} from '../functions/_lib/scheduled-blog/publication.mjs';
import {posts} from '../functions/_lib/scheduled-blog/generated-posts.mjs';
const due=Date.parse('2026-10-16T18:00:00-05:00');
const ctx=(path,method='GET',xml='<rss version="2.0"><channel><title>SplatWorks Blog</title><item><title>Existing article</title><link>https://example.org/old</link></item></channel></rss>')=>({request:new Request('https://splatworks.org'+path,{method}),next:async()=>new Response(method==='HEAD'?null:xml,{headers:{'Content-Type':'application/rss+xml'}})});
test('the actual scheduled article uses 6 p.m. Central and is absent from every URL variant before then',async()=>{
 assert.equal(posts.length,1);assert.equal(Date.parse(posts[0].publishAt),due);
 for(const path of [posts[0].path,posts[0].path.slice(0,-1),posts[0].path.slice(0,-1)+'.html',posts[0].path+'?preview=1&now=9999999999999']){const response=await scheduledBlog(ctx(path),posts,due-1);assert.equal(response.status,404);assert.equal(await response.text(),'Not found');assert.match(response.headers.get('Cache-Control'),/no-store/);assert.equal(response.headers.get('X-Robots-Tag'),'noindex');}
});
test('the boundary releases the illustrated article, preserves canonical redirects and supports HEAD',async()=>{
 const response=await scheduledBlog(ctx(posts[0].path),posts,due);assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes(posts[0].title));assert.ok(html.includes('19-conflict-choice.webp'));assert.match(html,/rel="canonical" href="https:\/\/mguhlin.org\/blog\/plansplat-student-planner\/"/);assert.ok((html.match(/<img /g)||[]).length>=21);assert.match(response.headers.get('Content-Security-Policy'),/script-src 'self'/);
 const redirect=await scheduledBlog(ctx(posts[0].path.slice(0,-1)+'?from=blog'),posts,due);assert.equal(redirect.status,308);assert.equal(redirect.headers.get('Location'),posts[0].path+'?from=blog');
 const head=await scheduledBlog(ctx(posts[0].path,'HEAD'),posts,due);assert.equal(head.status,200);assert.equal(await head.text(),'');
});
test('the feed releases with the article and deduplicates its syndicated canonical copy',async()=>{
 const before=await scheduledBlog(ctx('/blog/drawsplat.rss'),posts,due-1);const hidden=await before.text();assert.ok(!hidden.includes(posts[0].title));assert.ok(hidden.includes('Existing article'));
 const xml='<rss><channel><title>SplatWorks Blog</title><item><title>Upstream copy</title><link>'+posts[0].canonical+'</link></item><item><title>Older article</title><link>https://example.org/old</link></item></channel></rss>';
 const after=await scheduledBlog(ctx('/blog/drawsplat.rss','GET',xml),posts,due);const feed=await after.text();assert.ok(feed.includes(posts[0].url));assert.ok(feed.includes('Older article'));assert.ok(!feed.includes('Upstream copy'));assert.equal((feed.match(/<item>/g)||[]).length,2);assert.match(feed,/Fri, 16 Oct 2026 18:00:00 -0500/);assert.match(after.headers.get('Cache-Control'),/no-store/);
});
test('the public schedule exposes the timestamp without future titles or content',async()=>{
 const before=await scheduledBlog(ctx('/blog/publication-schedule.json'),posts,due-1);assert.deepEqual(await before.json(),{version:1,nextPublishAt:'2026-10-16T23:00:00.000Z',published:[]});
 const after=await scheduledBlog(ctx('/blog/publication-schedule.json'),posts,due);assert.deepEqual(await after.json(),{version:1,nextPublishAt:null,published:[posts[0].path]});
});
test('the deployed function routes are limited to scheduled-blog endpoints',()=>{
 const routes=JSON.parse(readFileSync(new URL('../_routes.json',import.meta.url)));assert.equal(routes.version,1);assert.ok(routes.include.includes('/blog/drawsplat.rss'));assert.ok(routes.include.includes(posts[0].path));assert.ok(routes.include.every(p=>p.startsWith('/blog/')||['/server/blog/*','/functions/*'].includes(p)));assert.ok(!routes.include.includes('/*'));assert.ok(!routes.include.includes('/blog/*'));
});
test('unknown routes fall through and writes are rejected',async()=>{
 const other=await scheduledBlog(ctx('/blog/another-post/'),posts,due);assert.ok((await other.text()).includes('Existing article'));
 const write=await scheduledBlog(ctx(posts[0].path,'POST'),posts,due);assert.equal(write.status,405);assert.equal(write.headers.get('Allow'),'GET, HEAD');
});

test('conditional and partial asset requests cannot keep the pre-publication feed cached',async()=>{
 let observed;const context={request:new Request('https://splatworks.org/blog/drawsplat.rss',{headers:{'If-None-Match':'old-feed','If-Modified-Since':'Thu, 15 Oct 2026 12:00:00 GMT','Range':'bytes=0-99'}}),next:async request=>{observed=request;return request.headers.has('If-None-Match')?new Response(null,{status:304}):new Response('<rss><channel><title>Blog</title></channel></rss>');}};const response=await scheduledBlog(context,posts,due);assert.equal(observed.method,'GET');for(const name of ['If-None-Match','If-Modified-Since','Range'])assert.equal(observed.headers.has(name),false);assert.equal(response.status,200);assert.ok((await response.text()).includes(posts[0].title));
});

test('a middleware guard blocks private source URLs before static or cached assets can serve them',async()=>{
 for(const path of ['/server/blog/generated-posts.mjs','/server/blog/posts.json','/server/blog/plansplat-student-planner.md','/functions/_lib/scheduled-blog/generated-posts.mjs']){const response=privateSourceResponse(new Request('https://splatworks.org'+path));assert.equal(response.status,404);assert.equal(await response.text(),'Not found');assert.match(response.headers.get('Cache-Control'),/no-store/);}
 assert.equal(privateSourceResponse(new Request('https://splatworks.org/plansplat/')),null);assert.equal(privateSourceResponse(new Request('https://splatworks.org/blog/drawsplat.rss')),null);
});
