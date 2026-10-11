#!/usr/bin/env python3
"""Apply shared navigation to public site headers; preserve application controls."""
from pathlib import Path
import os,re
from site_navigation import ROOT,nav_html
count=0
for p in ROOT.rglob('*.html'):
    if any(part in p.relative_to(ROOT).parts for part in ['node_modules','.git','.tmp','dist','test-results','android']):continue
    s=p.read_text();old=s;current=str(p.relative_to(ROOT))
    def header(m):
        tag,body=m.groups()
        if not re.search(r'class="[^"]*(?:landing-header|home-header|ds-header|wiki-header|guide-header)',tag):
            if current == 'app/whiteboard.html' or current.startswith(('admin/','languages/','hub/')):
                body=re.sub(r'<!-- site-app-nav:start -->.*?<!-- site-app-nav:end -->', '', body, flags=re.S)
                body='<!-- site-app-nav:start --><div class="site-app-navigation">'+nav_html(current)+'</div><!-- site-app-nav:end -->'+body
                return '<header'+tag+'>'+body+'</header>'
            return m.group(0)
        body=re.sub(r'<nav\b.*?</nav>',nav_html(current),body,count=1,flags=re.S)
        body=re.sub(r'<a\b[^>]*class="landing-signin"[^>]*>.*?</a>','',body,flags=re.S)
        return '<header'+tag+'>'+body+'</header>'
    s=re.sub(r'<header([^>]*)>(.*?)</header>',header,s,flags=re.S)
    if 'class="site-nav"' in s:
        prefix=os.path.relpath(ROOT/'assets',p.parent)
        css='<link rel="stylesheet" href="'+prefix+'/css/site-navigation.css">'
        js='<script src="'+prefix+'/js/site-navigation.js" defer></script>'
        if css not in s:s=s.replace('</head>',css+'</head>',1)
        if js not in s:s=s.replace('</body>',js+'</body>',1)
    if s!=old:p.write_text('\n'.join(line.rstrip() for line in s.splitlines())+'\n');count+=1
print('Updated navigation on',count,'pages')
