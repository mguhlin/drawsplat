#!/usr/bin/env python3
"""Bundle scheduled blog articles for time-gated Pages Functions, never static URLs."""
from pathlib import Path
from datetime import datetime
from email.utils import format_datetime
from zoneinfo import ZoneInfo
import html,json,re,sys
from markdown_it import MarkdownIt
from site_navigation import nav_html
ROOT=Path(__file__).resolve().parents[1]
renderer=MarkdownIt('commonmark',{'html':True}).enable('table')
dimensions=json.loads((ROOT/'functions/_lib/scheduled-blog/media.json').read_text())
posts=[];routes=['/blog/drawsplat.rss','/blog/publication-schedule.json']
for meta in json.loads((ROOT/'functions/_lib/scheduled-blog/posts.json').read_text()):
    slug=meta['slug'];stamp=datetime.fromisoformat(meta['publishAt'])
    if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) or stamp.tzinfo is None:raise ValueError('Use a safe slug and explicit publication offset')
    body=(ROOT/f'functions/_lib/scheduled-blog/{slug}.md').read_text();content=renderer.render(body)
    def size_image(match):
        tag=match.group(0);src=re.search(r'src="([^"]+)"',tag).group(1);size=dimensions[src]
        return tag.replace(' />',f' width="{size["width"]}" height="{size["height"]}" loading="lazy" decoding="async" />')
    content=re.sub(r'<img\b[^>]+>',size_image,content)
    for image in re.findall(r'<img[^>]+src="([^"]+)"',content)+[meta['image']]:
        if not image.startswith('/assets/plansplat-blog/') or not (ROOT/image.lstrip('/')).is_file():raise ValueError('Missing local screenshot: '+image)
    e=lambda value:html.escape(str(value),quote=True)
    path=f'/blog/{slug}/';url='https://splatworks.org'+path;date=stamp.astimezone(ZoneInfo('America/Chicago')).strftime('%B %d, %Y at %-I:%M %p Central')
    schema={'@context':'https://schema.org','@type':'BlogPosting','headline':meta['title'],'description':meta['description'],'datePublished':meta['publishAt'],'author':{'@type':'Person','name':meta['author']},'image':'https://splatworks.org'+meta['image'],'mainEntityOfPage':meta['canonical']}
    document='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'''
    document+=f'<title>{e(meta["title"])} | SplatWorks Blog</title><meta name="description" content="{e(meta["description"])}"><link rel="canonical" href="{e(meta["canonical"])}"><meta property="og:title" content="{e(meta["title"])}"><meta property="og:description" content="{e(meta["description"])}"><meta property="og:image" content="https://splatworks.org{e(meta["image"])}"><meta property="og:type" content="article"><meta property="og:url" content="{url}"><meta property="article:published_time" content="{e(meta["publishAt"])}">'
    document+='''<link rel="icon" href="/splatworks/plansplat/icon.svg?v=1.2.1"><meta name="theme-color" content="#7c3aed"><link rel="stylesheet" href="/assets/css/app.css"><link rel="stylesheet" href="/assets/css/site-navigation.css"><link rel="stylesheet" href="/assets/css/privacy-controls.css"><script src="/assets/js/privacy-controls.js"></script><style>
    body{margin:0;background:#faf8fe;color:#29213b;font:18px/1.75 'Segoe UI',Arial,sans-serif}.blog-header{background:white;border-bottom:1px solid #e6ddf2;padding:20px max(20px,calc((100vw - 1200px)/2));display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap}.blog-brand{font-size:1.3rem;font-weight:800;color:#5b21b6;text-decoration:none;display:flex;gap:12px;align-items:center}.blog-brand img{width:46px;height:46px}.post-shell{max-width:1000px;padding:42px 28px 70px;margin:auto}h1{font-size:clamp(2rem,4vw,3.2rem);line-height:1.15;letter-spacing:-.035em;margin:12px 0 20px}h2{font-size:1.65rem;line-height:1.3;margin:2.2em 0 .7em;color:#4c1d95}p{margin:0 0 1.2em}a{color:#5b21b6;text-underline-offset:3px;overflow-wrap:anywhere}.post-meta,.post-note{font-size:.9rem;color:#65566f}.post-eyebrow{font-size:.85rem;text-transform:uppercase;letter-spacing:.08em;color:#6d28d9;font-weight:700}.post-hero,article img{display:block;max-width:100%;height:auto;border:1px solid #e2d8ef;border-radius:10px;margin:24px auto}article p:has(>em:only-child){font-size:.88rem;color:#65566f}table{border-collapse:collapse;width:100%;font-size:.92rem;margin:28px 0}th,td{border:1px solid #d9cdea;padding:12px 14px;text-align:left;vertical-align:top}th{background:#eee7fa}td:first-child{font-weight:650;width:29%}li{margin:.45em 0}footer{border-top:1px solid #d9cdea;padding-top:28px;margin-top:48px}.post-skip{position:absolute;top:-100px}.post-skip:focus{top:0;background:white;padding:10px;z-index:20}:focus-visible{outline:3px solid #7c3aed;outline-offset:4px}@media(max-width:600px){body{font-size:17px}.post-shell{padding:26px 18px 45px}.blog-header{padding:16px 18px}table{font-size:.8rem}td,th{padding:8px}article img{max-height:none}}@media print{.blog-header,.privacy-controls,footer{display:none}.post-shell{max-width:none;padding:0}body{background:white;color:black}h2{break-after:avoid}img{break-inside:avoid}}
    </style>'''
    document+='<script type="application/ld+json">'+json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')+'</script></head><body><a class="post-skip" href="#article">Skip to article</a><header class="blog-header"><a class="blog-brand" href="/blog/"><img src="/assets/brand/SplatWorks_logo.png" alt="">SplatWorks Blog</a>'+nav_html(f'blog/{slug}/index.html')+'</header><main class="post-shell" id="article"><p class="post-eyebrow">Student planning · PlanSplat v1.2.1</p>'
    document+=f'<h1>{e(meta["title"])}</h1><p class="post-meta">By {e(meta["author"])} · <time datetime="{e(meta["publishAt"])}">{date}</time></p><p class="post-note">Also published on <a href="{e(meta["canonical"])}">MGuhlin.org</a>.</p><img class="post-hero" src="{e(meta["image"])}" alt="{e(meta["imageAlt"])}" width="{dimensions[meta["image"]]["width"]}" height="{dimensions[meta["image"]]["height"]}"><article>'+content+'</article><footer><a href="/blog/">More from the SplatWorks Blog</a> · <a href="/plansplat/">Open PlanSplat</a> · <a href="/legal/terms-privacy.html">Privacy and saved data</a></footer></main><script src="/assets/js/site-navigation.js" defer></script></body></html>'
    item=f'<item><title>{e(meta["title"])}</title><link>{url}</link><guid isPermaLink="true">{url}</guid><pubDate>{format_datetime(stamp)}</pubDate><description>{e(chr(60)+"img src="+chr(34)+"https://splatworks.org"+meta["image"]+chr(34)+" alt="+chr(34)+chr(34)+chr(62)+meta["description"])}</description><author>{e(meta["author"])}</author><source url="https://splatworks.org/">SplatWorks Updates</source></item>'
    posts.append({**meta,'path':path,'url':url,'html':document,'rssItem':item});routes.extend([path.rstrip('/'),path,path.rstrip('/')+'.html'])
if len({p['slug']for p in posts})!=len(posts):raise ValueError('Duplicate scheduled slug')
outputs={'functions/_lib/scheduled-blog/generated-posts.mjs':'// Generated by scripts/build-scheduled-blog.py; bundled server-side only.\nexport const posts='+json.dumps(posts,ensure_ascii=False,separators=(',',':'))+';\n','_routes.json':json.dumps({'version':1,'include':routes,'exclude':[]},indent=2)+'\n'}
for name,value in outputs.items():
    target=ROOT/name
    if '--check' in sys.argv:
        if not target.exists()or target.read_text()!=value:raise SystemExit('Stale scheduled blog output: '+name)
    else:target.write_text(value)
print('Scheduled blog bundle:',len(posts),'article; HTML and RSS publication gates share the same timestamp')
