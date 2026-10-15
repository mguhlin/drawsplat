#!/usr/bin/env python3
"""Install shared privacy controls and publish a reproducible component inventory.
Run after app/wiki builds. --check verifies generated output without changing files.
"""
from pathlib import Path
import subprocess, re, json, os, sys, hashlib
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
check='--check' in sys.argv
changed=[]
def write(path,content):
 p=ROOT/path
 if not p.exists() or p.read_text()!=content:
  changed.append(str(path))
  if not check: p.parent.mkdir(parents=True,exist_ok=True);p.write_text(content)
# Walk only public roots, pruning dependencies/build artifacts. This also works
# in extracted modules without a Git checkout and includes newly added routes.
pages=[]
public=['app','solutions','splatworks','games','studio','parents','admin','hub','legal','pages','guides','wiki','languages','community','privacy']
for folder in public:
 for directory,dirs,files in os.walk(ROOT/folder):
  dirs[:]=[d for d in dirs if d not in ['node_modules','dist','tests','test','vendor','webdeck','.tmp','src']]
  pages.extend(str((Path(directory)/f).relative_to(ROOT)) for f in files if f.endswith('.html'))
pages+=['index.html']
for name in sorted(set(pages)):
 p=ROOT/name
 if not p.is_file():continue
 s=p.read_text()
 if '</head>' not in s.lower() or '</body>' not in s.lower():continue
 s=re.sub(r'<!-- splat-privacy:start -->.*?<!-- splat-privacy:end -->','',s,flags=re.S)
 prefix=os.path.relpath(ROOT/'assets',p.parent)
 # Synchronous placement before app scripts also covers legacy inline bootstraps.
 code='<!-- splat-privacy:start --><link rel="stylesheet" href="'+prefix+'/css/privacy-controls.css"><script src="'+prefix+'/js/privacy-controls.js"></script><!-- splat-privacy:end -->'
 s=re.sub(r'(<meta\b[^>]*charset[^>]*>)',lambda m:m.group(1)+code,s,count=1,flags=re.I)
 if '<!-- splat-privacy:start -->' not in s:s=s.replace('</head>',code+'</head>',1)
 write(name,s)
registry=json.loads((ROOT/'data/drawsplat-tools.json').read_text())
components=[]
for tool in registry['tools']:
 url=tool['url'].split('?')[0].split('#')[0]
 if not url.startswith('/'):continue
 entry=ROOT/url.lstrip('/')
 if entry.is_dir():entry/='index.html'
 if not entry.exists():continue
 folder=entry.parent
 files=[entry]
 # Scan first-party runtime scripts, exclude vendor/minified libraries and sources not shipped.
 for p in folder.rglob('*'):
  if p.suffix not in ['.js','.html'] or p==entry:continue
  if any(v in p.parts for v in ['vendor','node_modules','tests','test','src','webdeck']):continue
  if p.stat().st_size>2500000:continue
  files.append(p)
 text='\n'.join(p.read_text(errors='replace') for p in files)
 literals=sorted(set(re.findall(r'(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*[\'\"]([^\'\"]+)',text)))
 constants=sorted(set(re.findall(r'\b(?:const|let|var)\s+(\w*(?:KEY|STORAGE|DB_NAME|DBNAME)\w*)\s*=\s*[\'\"]([^\'\"]+)',text,re.I)))
 hosts=sorted(set(re.findall(r'https?://([a-zA-Z0-9][a-zA-Z0-9.:-]+)',text)))
 components.append({'id':tool['id'],'name':tool['name'],'path':url,'entry':str(entry.relative_to(ROOT)),
 'storage':{'localStorage':'localStorage' in text,'sessionStorage':'sessionStorage' in text,'indexedDB':'indexedDB' in text or 'indexeddb' in text.lower(),'literalKeys':literals,'namedConstants':[{'name':k,'value':v} for k,v in constants]},
 'literalRemoteHosts':hosts,'remoteHostCaveat':'Static references include help links and dormant code, not proof of requests. Dynamic user URLs are not enumerable; review enabled connections.',
 'data':'User-entered content, selected files/media, settings and app-specific saved state; may contain student personal information.',
 'retention':'Browser data: preserved until user clearing unless explicit 1-, 7-, or 30-day expiry is enabled; clear on next visit after enabled expiry. Native exports and connected copies follow the separate retention schedule.',
 'rights':'/privacy/ for origin-local inspection/export/clear; school privacy contact for server, cloud and exported records.',
 'security':'Device/profile protections apply to browser storage; this is not application-level encryption at rest.',
 'reviewed':'2026-10-15','entrySha256':hashlib.sha256((ROOT/entry).read_bytes()).hexdigest()})
inventory={'version':1,'reviewed':'2026-10-15','scope':'All locally shipped destinations in data/drawsplat-tools.json. Alternate HTML routes receive the same shared controls.',
 'method':'Reproducible static source inventory plus runtime privacy-control tests. Storage literals and constants are evidence, not an exhaustive dynamic-key guarantee.',
 'publicHost':{'provider':'Cloudflare, Inc.','companyCountry':'United States','processingLocation':'Global edge network; no country-only residency commitment. Content editing remains local unless a connection is used.','data':'IP address, user agent, request URL and operational request metadata; no project-upload backend is supplied by the public site.'},
 'components':components}
write('data/privacy-inventory.json',json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
if changed:print(('Stale: ' if check else 'Updated: ')+str(len(changed))+' privacy files')
else:print('Privacy controls and inventory are current')
if check and changed:print('\n'.join(changed[:20]));sys.exit(1)
