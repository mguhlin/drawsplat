#!/usr/bin/env python3
"""Keep branded app shortcuts pointed at registry apps on Pages/static hosts."""
from pathlib import Path
import html,json,re
ROOT=Path(__file__).resolve().parents[1]
registry=json.loads((ROOT/'data/drawsplat-tools.json').read_text())
shortcuts=[]
for tool in registry['tools']:
    if 'splat' not in tool['name'].lower() or tool['url'].startswith('/wiki/'):continue
    slug=tool['name'].split()[0].replace('™','').lower()
    if not re.fullmatch(r'[a-z][a-z-]*',slug):raise ValueError(slug)
    target=tool['url']
    entry=ROOT/target.lstrip('/')
    if target.endswith('/'):entry=entry/'index.html'
    if not entry.is_file():raise ValueError('Missing app: '+target)
    shortcuts.append({'id':tool['id'],'name':tool['name'],'path':'/'+slug,'target':target})
shortcuts.sort(key=lambda s:s['path'])
if len({s['path'] for s in shortcuts})!=len(shortcuts):raise ValueError('Duplicate shortcut')
manifest=ROOT/'data/splatworks-short-urls.json';manifest.write_text(json.dumps(shortcuts,ensure_ascii=False,indent=2)+'\n')
redirects=ROOT/'_redirects';text=redirects.read_text();start='# splatworks-short-urls:start';end='# splatworks-short-urls:end'
text=re.sub(re.escape(start)+r'.*?'+re.escape(end)+r'\n?', '', text, flags=re.S)
old={s['path']+suffix for s in shortcuts for suffix in ['', '/', '/*']}
text='\n'.join(line for line in text.splitlines() if not line.split() or line.split()[0] not in old)+'\n'
rules=[];dynamic_rules=[]
for s in shortcuts:
    path,target=s['path'],s['target']
    rules.extend(f'{path+suffix}  {target}  301' for suffix in ['', '/'])
    (dynamic_rules if target.endswith('/') else rules).append(f'{path}/*  {target}:splat  301' if target.endswith('/') else f'{path}/index.html  {target}  301')
    folder=ROOT/path.lstrip('/');folder.mkdir(exist_ok=True)
    name=html.escape(s['name']);href=html.escape('..'+target,quote=True)
    (folder/'index.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open '+name+'</title><link rel="canonical" href="https://splatworks.org'+html.escape(target,quote=True)+'"></head><body><p><a id="splatworksAppTarget" href="'+href+'">Open '+name+'</a></p><script src="../assets/js/splatworks-short-url.js"></script></body></html>\n')
legacy=[line for line in text.splitlines() if line.startswith('/')]
is_dynamic=lambda line:'*' in line.split()[0] or ':' in line.split()[0]
legacy_static=[line for line in legacy if not is_dynamic(line)];legacy_dynamic=[line for line in legacy if is_dynamic(line)]
# Pages counts every rule following the first dynamic rule against its dynamic limit.
# Keep all exact routes first, including compatibility/policy routes.
redirects.write_text('# Cloudflare Pages redirects: exact routes precede wildcard routes.\n'+'\n'.join(legacy_static)+'\n\n'+start+'\n# App names open tools; guides keep their explicit /wiki/ and /pages/ addresses.\n'+'\n'.join(rules+dynamic_rules)+'\n'+end+'\n\n# Existing wildcard compatibility routes.\n'+'\n'.join(legacy_dynamic)+'\n')
doc=ROOT/'docs/splatworks-domain.md';text=doc.read_text();a=text.index('## Short app links');b=text.index('## Google Drive authorization',a)
section='''## Short app links

On both SplatWorks.org and DrawSplat.org, branded app names open the actual tools.
Use `/plansplat` or `/plansplat/`, for example. The SplatWorks navigation menu
also opens the six office/planner apps directly. Guides remain available at their
explicit `/wiki/` addresses and in the wiki sidebar.

Cloudflare `_redirects` supplies HTTP 301 rules. Matching root folders provide
static-host fallbacks that preserve query parameters and fragments. Redirects
stay on the current domain, preserving that domain's browser workspace.
`scripts/build-splatworks-short-urls.py` derives these targets from the component
registry and updates the rules, static fallbacks and shortcut manifest.

| App | Short path | Tool target |
| --- | --- | --- |
'''
section+='\n'.join(f"| {s['name']} | [{s['path']}](..{s['path']}/) | `{s['target']}` |" for s in shortcuts)+'\n\n'
doc.write_text(text[:a]+section+text[b:]);print('Generated',len(shortcuts),'app shortcuts')
