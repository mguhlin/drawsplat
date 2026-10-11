#!/usr/bin/env python3
"""Build wiki navigation and full-text index from canonical pages.
Requires markdown-it-py (also used by build-district-guide.py).
Edit original HTML/Markdown articles, then rerun this script. No server required.
"""
from pathlib import Path
from html.parser import HTMLParser
from markdown_it import MarkdownIt
import html, json, re, os
from site_navigation import nav_html
ROOT=Path(__file__).resolve().parents[1]
GROUPS={
 'Start here': [('wiki/index.html','DrawSplat Wiki','Find current setup, classroom, licensing, pricing, and privacy guidance.'),('docs/district-selfhost.html','District installation · Quick Start','Complete package, Docker or native, first-time setup, backup and recovery.'),('pages/download.html','Downloads and packages','Complete district suite and individual application downloads.'),('guides/teacher-options-quick-start.html','Teacher Quick Start','School sign-in, blank board, classroom access, and everyday saving.')],
 'For educators': [('wiki/for-educators.html','For educators','Teacher guides, classroom activities, backgrounds, features, and family resources.'),('pages/features.html','Features','Whiteboard capabilities and classroom uses.'),('pages/background-templates.html','Background template collection','Ready-to-use backgrounds and activity prompts.'),('parents/index.html','Family Access Tools','Configured Apps Script family requests and school privacy contacts.'),('wiki/district-classrooms.html','District classrooms and rosters','CSV imports, Google school accounts, assignments, turn-ins and teacher feedback.'),('guides/core-whiteboard-tools.html','Core whiteboard tools','Drawing, selection, pages, layers, notes, audio and video.'),('guides/saving-exporting.html','Saving and exporting','Device autosave, online boards, restore points, file backups and exports.'),('guides/collaboration-turn-ins.html','Collaboration and turn-ins','District assignments and the separate Apps Script shared-room workflow.'),('guides/templates-backgrounds.html','Templates and backgrounds','Plain white first launch, optional grids, templates and classroom prompts.'),('guides/images-stickers-coloring.html','Images, stickers and coloring','Media, stickers and coloring activities.'),('guides/classroom-widgets-tools.html','Classroom widgets and tools','Timers, classroom widgets and embedded tools.'),('guides/diagrams-maps-word-clouds.html','Diagrams, maps and word clouds','Visual thinking and diagrams.'),('guides/graphs-picture-graphs.html','Graphs and picture graphs','Data displays and graph makers.'),('guides/scratchart.html','Scratch art','Create and export scratch art.'),('guides/project-reference.html','Whiteboard feature reference','Current features, storage choices and shortcuts.')],
 'SplatWorks': [('pages/splatworks.html','SplatWorks overview','Choose an application, compare features, save work and install the suite.'),('pages/writesplat.html','WriteSplat · Writing','Document formatting, readability, templates, cloze passages, citations and ODT files.'),('pages/listsplat.html','ListSplat · Databases','Fields, records, forms, cards, labels, reports, search and CSV files.'),('pages/showsplat.html','ShowSplat · Presentations','Slide editing, media, speaker notes, Markdown, WebDeck, PDF, ODP and PPTX.'),('pages/gridsplat.html','GridSplat · Spreadsheets','Formulas, cell formatting, sorting, charts, picture graphs, templates and file interchange.')],
 'Connections and setup': [('guides/mysql-setup.html','MySQL / MariaDB setup','Bundled database, native hosting, first-time administrator, district saving and classrooms.'),('guides/google-setup.html','Apps Script setup','Optional Google Drive and Sheets storage, rooms, templates and turn-ins.'),('guides/apps-script-web-app-url.html','Apps Script Web App URL','Copy Code.gs, publish /exec and connect Teacher Admin.'),('wiki/setup-browser.html','Browser-only setup','Use the whiteboard without a server or accounts.'),('wiki/setup-mysql.html','Advanced database hosting','Separately hosted API, Railway, DigitalOcean, TLS and migrations.'),('wiki/setup-google-apps-script.html','Apps Script technical reference','Script properties, deployment updates and backend configuration.'),('wiki/modular-selfhost.html','Modular self-hosting','Independent apps, component bundles and static hosting.'),('wiki/mariadb-local.html','Local MariaDB development','Local developer database and service configuration.')],
 'Licensing and pricing': [('wiki/licensing.html','Licensing and software cost','AGPL, component GPL notices, content ownership, source and self-hosting.'),('pages/pricing.html','Pricing and optional services','Free software, operating costs and optional paid implementation or professional learning.')],
 'Privacy and district review': [('wiki/compliance.html','Compliance and district review','Storage-specific safeguards, operational evidence, NDPA/DPA and district approval.'),('guides/compliance-guide.html','Apps Script Compliance Console','Safety, family access, age bands, use limits, retention and privacy packets.'),('legal/terms-privacy.html','Terms and privacy','Formal terms, data handling and software license notices.'),('legal/ndpa-packet.html','NDPA / DPA Review Packet','Data flow, review exhibits, controls and district evidence.'),('legal/district-addendum.html','District Privacy Addendum','District agreement template and responsibilities.'),('legal/privacy-agreements.html','DPA Register','Recorded agreement execution and review status.'),('legal/google-oauth-disclosure.html','Google OAuth disclosure','School identity versus Drive permissions and Google data use.'),('legal/compliance-gaps.html','Compliance Gap List','Deployment limits and district controls still required.'),('legal/gdpr-compliance.html','GDPR reference','Privacy review for applicable deployments.'),('legal/texas-compliance.html','Texas compliance reference','Texas school privacy and operational review.'),('legal/widgets-security.html','Widget security boundary','Embedded content, external services and isolation.'),('legal/accessibility.html','Accessibility statement','Accessibility support and known limits.'),('legal/privacy-builder.html','Privacy Notice Builder','Create a deployment-specific notice.'),('legal/combined-policy.html','Combined policy packet','Consolidated policy documents for district review.'),('wiki/COMPLIANCE.html','Compliance operations reference','Apps Script endpoints, configuration and operator procedures.')],
 'Technical and updates': [('wiki/support-wiki-maintenance.html','Maintaining the wiki','Canonical sources, generated search index, documentation checks and publishing.'),('wiki/tool-inventory.html','Component inventory','Whiteboard, SplatWorks, tools, widgets and games.'),('wiki/standalone-architecture.html','Standalone architecture','Static application and integration boundaries.'),('pages/release-notes.html','Release notes','Application and package changes.'),('blog/index.html','DrawSplat blog','Feature walkthroughs and release articles.'),('pages/contact.html','Contact and support','Report a problem or request implementation services.')]
}
# Keep the search index complete while presenting a short audience-based sidebar.
GROUPS['Start here'].insert(1,('wiki/faq.html','Frequently asked questions (FAQs)','Quick answers about accounts, saving, school setup, privacy, cost, and SplatWorks.'))
GROUPS['Start here']=[row for row in GROUPS['Start here'] if row[0] not in ['docs/district-selfhost.html','guides/teacher-options-quick-start.html']]
GROUPS['For educators'].insert(1,('guides/teacher-options-quick-start.html','Teacher Quick Start','Open a board, sign in at school, and save your lesson.'))
GROUPS['For educators']=[row for row in GROUPS['For educators'] if row[0]!='parents/index.html']
GROUPS['For educators'][0]=('wiki/for-educators.html','For educators','Choose tools, support learners, collect work, and save a copy.')
GROUPS['For technology admins']=[('wiki/for-technology-admins.html','School setup and operations','Choose hosting, connect accounts, test classrooms, and protect saved work.'),('docs/district-selfhost.html','Install the district suite','Docker or native Quick Start, backup, recovery, and updates.')]+GROUPS.pop('Connections and setup')
console=next(row for row in GROUPS['Privacy and district review'] if row[0]=='guides/compliance-guide.html')
GROUPS['Privacy and district review'].remove(console)
GROUPS['For technology admins'].insert(4,console)
GROUPS['For parents and students']=[('wiki/for-parents-and-students.html','Learning, saving, and getting help','Start work, keep a copy, share safely, and ask the school for help.'),('parents/index.html','Family Access Tools','Request student records through a configured school Apps Script service.')]
GROUPS={key:GROUPS[key] for key in ['Start here','For educators','For technology admins','For parents and students','SplatWorks','Licensing and pricing','Privacy and district review','Technical and updates']}
EDUCATOR_MENU={'wiki/for-educators.html','guides/teacher-options-quick-start.html','wiki/district-classrooms.html','guides/saving-exporting.html','guides/collaboration-turn-ins.html','pages/background-templates.html','guides/project-reference.html'}
RENDER=['faq','for-educators','for-technology-admins','for-parents-and-students','support-wiki-maintenance','setup-browser','setup-mysql','setup-google-apps-script','modular-selfhost','mariadb-local','COMPLIANCE','tool-inventory','standalone-architecture']
parser=MarkdownIt('commonmark',{'html':False}).enable('table')
for name in RENDER:
 source=ROOT/'docs'/f'{name}.md'; body=parser.render(source.read_text())
 # Markdown links remain relative to their original docs/ location.
 def rel(m):
  url=m.group(2)
  if url.startswith(('#','http:','https:','mailto:','/')): return m.group(0)
  target=ROOT/'docs'/url.split('#')[0]; frag=('#'+url.split('#',1)[1]) if '#' in url else ''
  return m.group(1)+'="'+os.path.relpath(target,ROOT/'wiki')+frag+'"'
 body=re.sub(r'(href|src)="([^"]+)"',rel,body)
 (ROOT/'wiki'/f'{name}.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape('Frequently asked questions (FAQs)' if name=='faq' else name)+' · DrawSplat Wiki</title><link rel="stylesheet" href="../assets/css/app.css"></head><body><main><article>'+body+'</article></main></body></html>')

def relative(path,current): return os.path.relpath(ROOT/path,(ROOT/current).parent)
def directory(current):
 blocks=[]
 for group,items in GROUPS.items():
  if group=='For educators':items=[row for row in items if row[0] in EDUCATOR_MENU]
  rows=''.join('<li><a href="'+relative(p,current)+'">'+html.escape(t)+'</a><p>'+html.escape(d)+'</p></li>' for p,t,d in items if p!='wiki/index.html')
  blocks.append('<section class="wiki-directory-group"><h2>'+html.escape(group)+'</h2><ul>'+rows+'</ul></section>')
 return '<main><article><p class="landing-eyebrow">Official documentation · DrawSplat + SplatWorks</p><h1>DrawSplat Wiki</h1><p class="article-lede">The current reference for teaching, district installation, software licensing, pricing, privacy, and technical setup.</p><div class="wiki-start"><h2>Choose where to begin</h2><ol><li><a href="'+relative('docs/district-selfhost.html',current)+'">Install the complete district suite</a> — Docker or native, with a rerunnable Quick Start checklist.</li><li><a href="'+relative('guides/teacher-options-quick-start.html',current)+'">Get started as a teacher</a> — use your school account and open your classrooms.</li><li><a href="'+relative('wiki/compliance.html',current)+'">Review privacy and district agreements</a> — match controls and documents to your deployment.</li></ol></div><p>Search every article using the sidebar. Existing guide links remain valid. Installation checklists also work in downloaded packages; use the online wiki when checking the current release.</p><p class="wiki-audiences">Start with <a href="'+relative('wiki/for-educators.html',current)+'">Educators</a>, <a href="'+relative('wiki/for-technology-admins.html',current)+'">Technology admins</a>, or <a href="'+relative('wiki/for-parents-and-students.html',current)+'">Parents and students</a>.</p><div class="wiki-directory">'+''.join(blocks)+'</div></article></main>'
for current in ['wiki/index.html','pages/support.html','guides/index.html']:
 (ROOT/current).write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>DrawSplat Wiki · Support and documentation</title><meta name="description" content="Search DrawSplat setup, school classrooms, MariaDB/MySQL, Apps Script, licensing, pricing, OAuth, NDPA/DPA and privacy documentation."><link rel="canonical" href="https://drawsplat.org/wiki/"><link rel="stylesheet" href="'+relative('assets/css/app.css',current)+'"></head><body>'+directory(current)+'</body></html>')

# Rebuild the combined packet from canonical policy articles before indexing it.
packet=[]
for name in ['terms-privacy','texas-compliance','district-addendum','gdpr-compliance','google-oauth-disclosure','ndpa-packet','accessibility','widgets-security','compliance-gaps']:
    document=(ROOT/'legal'/f'{name}.html').read_text()
    content=re.search(r'<main\b[^>]*>(.*?)</main>',document,re.S).group(1)
    content=re.sub(r'<h1([^>]*)>(.*?)</h1>',r'<h2\1>\2</h2>',content,flags=re.S)
    content=re.sub(r'id="([^"]+)"',lambda m:'id="'+name+'-'+m.group(1)+'"',content)
    content=re.sub(r'href="#([^"]+)"',lambda m:'href="#'+name+'-'+m.group(1)+'"',content)
    packet.append('<section class="wiki-packet-section"><p><a href="'+name+'.html">Open '+name.replace('-',' ')+' separately</a></p>'+content+'</section>')
(ROOT/'legal/combined-policy.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Combined policy packet · DrawSplat Wiki</title><link rel="stylesheet" href="../assets/css/app.css"></head><body><main><h1>Combined policy packet</h1><p>Current policy and district review documents, assembled from their individual wiki articles. Review the applicable deployment scope and signed agreement status.</p>'+''.join(packet)+'</main></body></html>')

entries=[]
class Plain(HTMLParser):
 def __init__(self): super().__init__();self.parts=[];self.ignore=0
 def handle_starttag(self,tag,attrs):
  if tag in ['script','style']: self.ignore+=1
 def handle_endtag(self,tag):
  if tag in ['script','style']:self.ignore=max(0,self.ignore-1)
 def handle_data(self,d):
  if not self.ignore:self.parts.append(d)
for group,items in GROUPS.items():
 for path,title,desc in items:
  p=ROOT/path;s=p.read_text()
  if path=='docs/district-selfhost.html':
   # Its own full Quick Start sidebar and form stay intact.
   link='<a href="../wiki/">DrawSplat Wiki</a>'
   if link not in s:s=s.replace('<nav aria-label="Guide formats">','<nav aria-label="Guide formats">'+link)
   p.write_text(s)
  elif path!='blog/index.html':
   # Preserve article URLs/content, including original assets and interactive forms.
   s=re.sub(r'<!-- wiki:start -->.*?<!-- wiki:main -->','',s,flags=re.S)
   s=re.sub(r'<!-- wiki:end-main -->.*?<!-- wiki:end -->','',s,flags=re.S)
   s=re.sub(r'<header\b.*?</header>','',s,flags=re.S)
   s=re.sub(r'<footer\b.*?</footer>','',s,flags=re.S)
   s=re.sub(r'<link[^>]*href="[^\"]*support-wiki.css[^\"]*"[^>]*>','',s)
   s=re.sub(r'<script[^>]*src="[^\"]*support-(?:wiki|index).js[^\"]*"[^>]*></script>','',s)
   s=s.replace('</head>','<link rel="stylesheet" href="'+relative('assets/css/support-wiki.css',path)+'"></head>')
   s=re.sub(r'<body([^>]*)>',lambda m:'<body'+m.group(1)+' data-wiki="true">' if 'data-wiki' not in m.group(1) else m.group(0),s,count=1)
   match=re.search(r'<main\b.*?</main>',s,re.S)
   if not match:raise ValueError('Missing main '+path)
   main=match.group(0);toc=[];used=set(re.findall(r'id="([^"]+)"',main))
   def heading(m):
    tag,attrs,label=m.groups();plain=Plain();plain.feed(label);text=' '.join(plain.parts)
    existing=re.search(r'id="([^"]+)"',attrs)
    if existing:slug=existing.group(1)
    else:
     slug=re.sub(r'[^a-z0-9]+','-',text.lower()).strip('-') or 'section';base=slug;n=2
     while slug in used:slug=base+'-'+str(n);n+=1
     used.add(slug);attrs+=' id="'+slug+'"'
    if tag=='h2':toc.append('<li><a href="#'+slug+'">'+html.escape(text)+'</a></li>')
    return '<'+tag+attrs+'>'+label+'</'+tag+'>'
   main=re.sub(r'<(h[123])([^>]*)>(.*?)</h[123]>' if path=='wiki/faq.html' else r'<(h[12])([^>]*)>(.*?)</h[12]>',heading,main,flags=re.S)
   if 'id="wiki-content"' not in main:main=main.replace('<main','<main id="wiki-content"',1) if not re.match(r'<main[^>]*\bid=',main) else main
   main=re.sub(r' tabindex="-1"', '', main)
   main=main.replace('<main','<main tabindex="-1"',1)
   nav=[]
   for category,rows in GROUPS.items():
    if category=='For educators':rows=[row for row in rows if row[0] in EDUCATOR_MENU or row[0]==path]
    links=''.join('<li><a '+('aria-current="page" ' if target==path or (target=='wiki/index.html' and path in ['guides/index.html','pages/support.html']) else '')+'href="'+relative(target,path)+'">'+html.escape(label)+'</a></li>' for target,label,_ in rows)
    nav.append('<section><h2>'+html.escape(category)+'</h2><ul>'+links+'</ul></section>')
   source_path='docs/'+Path(path).stem+'.md' if path.startswith('wiki/') and Path(path).stem in RENDER else path
   header='<a class="wiki-skip" href="#wiki-content">Skip to article</a><header class="wiki-header"><a class="wiki-brand" href="'+relative('index.html',path)+'"><img src="'+relative('assets/brand/DrawSplat_logo.png',path)+'" alt="" width="44" height="44"><span>DrawSplat <strong>Wiki</strong></span></a>'+nav_html(path)+'</header>'
   sidebar='<aside class="wiki-sidebar"><details class="wiki-topics" open><summary>Search and browse topics</summary><div><form class="wiki-search" role="search"><label for="wiki-query">Search the wiki</label><div><input id="wiki-query" name="q" type="search" placeholder="Try: roster, OAuth, DPA" autocomplete="off"><button type="submit">Search</button></div></form><nav aria-label="Wiki topics">'+''.join(nav)+'</nav></div></details></aside>'
   toolbar='<div class="wiki-article-bar"><span>'+html.escape(group)+'</span><div><a href="https://github.com/mguhlin/drawsplat/blob/main/'+source_path+'">Source</a><button class="wiki-print" type="button" hidden>Print</button></div></div><section class="wiki-results" hidden aria-label="Search results"><h2>Search results</h2><p class="wiki-result-status" role="status"></p><ol></ol><button class="wiki-clear" type="button">Back to article</button></section>'
   outline='<aside class="wiki-outline"><nav aria-label="On this page"><h2>On this page</h2><ul>'+''.join(toc)+'</ul></nav><p class="wiki-note">Current documentation<br>Updated 11 October 2026</p><a href="'+relative('pages/contact.html',path)+'">Report a documentation issue</a></aside>'
   shell='<!-- wiki:start -->'+header+'<div class="wiki-layout">'+sidebar+'<div class="wiki-reading">'+toolbar+'<!-- wiki:main -->'+main+'<!-- wiki:end-main --></div>'+outline+'</div><footer class="wiki-footer">DrawSplat Wiki · Official setup, support, and district reference · <a href="'+relative('wiki/licensing.html',path)+'">Licensing</a></footer><!-- wiki:end -->'
   s=s[:match.start()]+shell+s[match.end():]
   s=s.replace('</body>','<script src="'+relative('assets/js/support-index.js',path)+'" defer></script><script src="'+relative('assets/js/support-wiki.js',path)+'" defer></script></body>')
   p.write_text(s)
  main=re.search(r'<main\b.*?</main>',s,re.S).group(0);plain=Plain();plain.feed(main)
  entries.append({'path':path,'title':title,'category':group,'description':desc,'text':re.sub(r'\s+',' ',' '.join(plain.parts)).strip()})
(ROOT/'assets/js/support-index.js').write_text('/* Generated by scripts/build-support-wiki.py. */\nwindow.DrawSplatWikiIndex = '+json.dumps(entries,ensure_ascii=False)+';\n')
print('Built DrawSplat Wiki:',len(entries),'searchable articles')

# Keep every public header aligned with this generated documentation.
import subprocess, sys
subprocess.run([sys.executable, str(ROOT/"scripts/build-site-navigation.py")], check=True)
