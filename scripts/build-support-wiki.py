#!/usr/bin/env python3
"""Build wiki navigation and full-text index from canonical pages.
Requires markdown-it-py (also used by build-district-guide.py).
Edit original HTML/Markdown articles, then rerun this script. No server required.
"""
from pathlib import Path
from html.parser import HTMLParser
from markdown_it import MarkdownIt
import html, json, re, os, hashlib, runpy
from urllib.parse import urlencode
from site_navigation import nav_html
from policy_content import refresh as refresh_policy, write_aliases as write_policy_aliases
ROOT=Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT/'scripts/build-splatworks-short-urls.py'))
refresh_policy(ROOT)
WIKI_CSS_VERSION=hashlib.sha256((ROOT/'assets/css/support-wiki.css').read_bytes()).hexdigest()[:10]
GROUPS={
 'Start here': [('wiki/index.html','SplatWorks Wiki','Find current setup, classroom, licensing, pricing, and privacy guidance.'),('docs/district-selfhost.html','District installation · Quick Start','Complete package, Docker or native, first-time setup, backup and recovery.'),('pages/download.html','Downloads and packages','Complete district suite and individual application downloads.'),('guides/teacher-options-quick-start.html','Teacher Quick Start','School sign-in, blank board, classroom access, and everyday saving.')],
 'For educators': [('wiki/for-educators.html','For educators','Teacher guides, classroom activities, backgrounds, features, and family resources.'),('pages/features.html','Features','Whiteboard capabilities and classroom uses.'),('pages/background-templates.html','Background template collection','Ready-to-use backgrounds and activity prompts.'),('parents/index.html','Family Access Tools','Configured Apps Script family requests and school privacy contacts.'),('wiki/district-classrooms.html','District classrooms and rosters','CSV imports, Google school accounts, assignments, turn-ins and teacher feedback.'),('guides/core-whiteboard-tools.html','Core whiteboard tools','Drawing, selection, pages, layers, notes, audio and video.'),('guides/saving-exporting.html','Saving and exporting','Device autosave, online boards, restore points, file backups and exports.'),('guides/collaboration-turn-ins.html','Collaboration and turn-ins','District assignments and the separate Apps Script shared-room workflow.'),('guides/templates-backgrounds.html','Templates and backgrounds','Plain white first launch, optional grids, templates and classroom prompts.'),('guides/images-stickers-coloring.html','Images, stickers and coloring','Media, stickers and coloring activities.'),('guides/classroom-widgets-tools.html','Classroom widgets and tools','Timers, classroom widgets and embedded tools.'),('guides/diagrams-maps-word-clouds.html','Diagrams, maps and word clouds','Visual thinking and diagrams.'),('guides/graphs-picture-graphs.html','Graphs and picture graphs','Data displays and graph makers.'),('guides/scratchart.html','Scratch art','Create and export scratch art.'),('guides/project-reference.html','Whiteboard feature reference','Current features, storage choices and shortcuts.')],
 'SplatWorks': [('pages/splatworks.html','SplatWorks overview','Choose an application, compare features, save work and install the suite.'),('pages/writesplat.html','WriteSplat · Writing','Document formatting, readability, templates, cloze passages, citations and ODT files.'),('pages/listsplat.html','ListSplat · Databases','Fields, records, forms, cards, labels, reports, search and CSV files.'),('pages/showsplat.html','ShowSplat · Presentations','Slide editing, media, speaker notes, Markdown, WebDeck, PDF, ODP and PPTX.'),('pages/gridsplat.html','GridSplat · Spreadsheets','Formulas, cell formatting, sorting, charts, picture graphs, templates and file interchange.')],
 'Connections and setup': [('guides/mysql-setup.html','MySQL / MariaDB setup','Bundled database, native hosting, first-time administrator, district saving and classrooms.'),('guides/google-setup.html','Apps Script setup','Optional Google Drive and Sheets storage, rooms, templates and turn-ins.'),('guides/apps-script-web-app-url.html','Apps Script Web App URL','Copy Code.gs, publish /exec and connect Teacher Admin.'),('wiki/setup-browser.html','Browser-only setup','Use the whiteboard without a server or accounts.'),('wiki/setup-mysql.html','Advanced database hosting','Separately hosted API, Railway, DigitalOcean, TLS and migrations.'),('wiki/setup-google-apps-script.html','Apps Script technical reference','Script properties, deployment updates and backend configuration.'),('wiki/modular-selfhost.html','Modular self-hosting','Independent apps, component bundles and static hosting.'),('wiki/mariadb-local.html','Local MariaDB development','Local developer database and service configuration.')],
 'Licensing and pricing': [('wiki/licensing.html','Licensing and software cost','AGPL, component GPL notices, content ownership, source and self-hosting.'),('pages/pricing.html','Pricing and optional services','Free software, operating costs and optional paid implementation or professional learning.')],
 'Privacy and district review': [('wiki/compliance.html','Compliance and district review','Storage-specific safeguards, operational evidence, NDPA/DPA and district approval.'),('guides/compliance-guide.html','Apps Script Compliance Console','Safety, family access, age bands, use limits, retention and privacy packets.'),('legal/terms-privacy.html','Terms and privacy','Formal terms, data handling and software license notices.'),('legal/ndpa-packet.html','District privacy review worksheet','NDPA/DPA exhibit preparation and deployment evidence.'),('legal/district-addendum.html','District Privacy Addendum','District agreement template and responsibilities.'),('legal/privacy-agreements.html','DPA Register','Recorded agreement execution and review status.'),('legal/google-oauth-disclosure.html','Google OAuth disclosure','School identity versus Drive permissions and Google data use.'),('legal/compliance-gaps.html','Compliance Gap List','Deployment limits and district controls still required.'),('legal/gdpr-compliance.html','GDPR reference','Privacy review for applicable deployments.'),('legal/texas-compliance.html','Texas compliance reference','Texas school privacy and operational review.'),('legal/widgets-security.html','Component data and network inventory','Local drafts, media permissions, exports, optional AI/cloud services and hosting metadata.'),('legal/accessibility.html','Accessibility statement','Accessibility support and known limits.'),('legal/privacy-builder.html','Privacy Notice Builder','Create a deployment-specific notice.'),('legal/combined-policy.html','Combined policy packet','Consolidated policy documents for district review.'),('wiki/COMPLIANCE.html','Compliance operations reference','Apps Script endpoints, configuration and operator procedures.')],
 'Technical and updates': [('wiki/support-wiki-maintenance.html','Maintaining the wiki','Canonical sources, generated search index, documentation checks and publishing.'),('wiki/tool-inventory.html','Component inventory','Whiteboard, SplatWorks, tools, widgets and games.'),('wiki/standalone-architecture.html','Standalone architecture','Static application and integration boundaries.'),('pages/release-notes.html','Release notes','Application and package changes.'),('blog/index.html','SplatWorks blog','Feature walkthroughs and release articles.'),('pages/contact.html','Contact and support','Report a problem or request implementation services.')]
}
GROUPS['Privacy and district review'].extend([('legal/protect-review.html','PROTECT controls and deployment review','Public/self-hosted report cards, public-site improvement roadmap, controls and evidence-based scoring.'),('legal/service-providers.html','Service providers and change notices','Provider roles, countries, processing boundaries, contract requirements and objections.')])
# Consolidate overlapping policy articles; retain specialized forms and records.
POLICY_ALIASES={row['path'] for row in json.loads((ROOT/'data/policy-legacy-links.json').read_text()) if row['path']!='legal/terms-privacy.html'}
GROUPS['Privacy and district review']=[row for row in GROUPS['Privacy and district review'] if row[0] not in POLICY_ALIASES]
GROUPS['Privacy and district review']=[('legal/terms-privacy.html','Security, privacy and terms','One policy: terms of service, security, retention, rights, providers, PROTECT report cards and district review.')]+[row for row in GROUPS['Privacy and district review'] if row[0]!='legal/terms-privacy.html']
def menu_rows(group, rows):
 return [row for row in rows if row[0]=='legal/terms-privacy.html'] if group=='Privacy and district review' else rows
# Keep the search index complete while presenting a short audience-based sidebar.
GROUPS['Start here'].insert(1,('wiki/faq.html','Frequently asked questions (FAQs)','Quick answers about accounts, saving, school setup, privacy, cost, and SplatWorks.'))
GROUPS['SplatWorks'].insert(1, ('wiki/plansplat.html','PlanSplat · Student planner','Assignments, exams, courses, study blocks, routines, focus sessions and Google Drive autoload/autosave.'))
GROUPS['SplatWorks'].append(('wiki/backdropsplat.html','BackdropSplat · Background removal','Local photo cutouts, white/color background removal, comparison, and PNG/JPEG/ZIP export.'))
GROUPS['SplatWorks'].insert(1, ('wiki/writesplat.html','WriteSplat · Document editing and import','Word/LibreOffice formatting, source numbering and spacing, local saving and current compatibility.'))
GROUPS['SplatWorks'].insert(1, ('wiki/layoutsplat.html','LayoutSplat · Publications','126 distinct compositions, Avery labels, native Publisher/Pages import, precise pages, rich text, masters, mail merge, media, and file exchange.'))
GROUPS['SplatWorks'].insert(2, ('wiki/layoutsplat-verification.html','LayoutSplat · Verification and limits','Source EPUB round trips, composition, desktop interoperability, performance and print evidence.'))
GROUPS['SplatWorks'].insert(2, ('wiki/layoutsplat-ebooks.html','LayoutSplat · Ebooks and EPUB','EPUB import/export, ebook starters, metadata, heading navigation, visual editing and reading preview.'))
GROUPS['SplatWorks'].insert(2, ('wiki/layoutsplat-features.html','LayoutSplat · Illustrated feature guide','Twenty-two sections with production screenshots: templates, workspace, typography, imports, labels, masters, merge and print limits.'))
GROUPS['SplatWorks'].extend([('wiki/layoutsplat-labels.html','LayoutSplat · Avery labels & name badges','All 29 Avery sheet layouts and 127 compatible product codes; physical dimensions and printer alignment.'),('wiki/layoutsplat-import-accuracy.html','LayoutSplat · Import accuracy','Private sample findings, source font differences, supported formats, and remaining compatibility work.')])
GROUPS['Technical and updates'].insert(2, ('wiki/splatworks-domain.html','SplatWorks.org domain setup','Serve the same deployment on both domains and preserve access to existing browser drafts.'))
GROUPS['Start here']=[row for row in GROUPS['Start here'] if row[0] not in ['docs/district-selfhost.html','guides/teacher-options-quick-start.html']]
GROUPS['For educators'].insert(1,('guides/teacher-options-quick-start.html','Teacher Quick Start','Open a board, sign in at school, and save your lesson.'))
GROUPS['For educators']=[row for row in GROUPS['For educators'] if row[0]!='parents/index.html']
GROUPS['For educators'][0]=('wiki/for-educators.html','For educators','Choose tools, support learners, collect work, and save a copy.')
GROUPS['For technology admins']=[('wiki/for-technology-admins.html','School setup and operations','Choose hosting, connect accounts, test classrooms, and protect saved work.'),('docs/district-selfhost.html','Install the district suite','Docker or native Quick Start, backup, recovery, and updates.')]+GROUPS.pop('Connections and setup')
console=next(row for row in GROUPS['Privacy and district review'] if row[0]=='guides/compliance-guide.html')
GROUPS['Privacy and district review'].remove(console)
GROUPS['For technology admins'].insert(4,console)
GROUPS['For parents and students']=[('wiki/for-parents-and-students.html','Learning, saving, and getting help','Start work, keep a copy, share safely, and ask the school for help.'),('parents/index.html','Family Access Tools','Request student records through a configured school Apps Script service.')]
GROUPS['About SplatWorks']=[('wiki/about-developer.html','About the Developer','J. M. Guhlin, classroom tools, multilingual learning, project support, and contact.')]
GROUPS={key:GROUPS[key] for key in ['Start here','For educators','For technology admins','For parents and students','SplatWorks','Licensing and pricing','Privacy and district review','Technical and updates','About SplatWorks']}
EDUCATOR_MENU={'wiki/for-educators.html','guides/teacher-options-quick-start.html','wiki/district-classrooms.html','guides/saving-exporting.html','guides/collaboration-turn-ins.html','pages/background-templates.html','guides/project-reference.html'}
runpy.run_path(str(ROOT/'scripts/build-tool-features.py'))
EDUCATOR_MENU.add('wiki/tools-widgets-features.html')
GROUPS['For educators'].insert(1, ('wiki/tools-widgets-features.html','Ecosystem tools, widgets and features','Features by category: Media, Play, Create, Data, Writing, Assessment, Classroom and Organize.'))
GROUPS['Start here'].insert(2, ('wiki/google-drive.html','Save to Google Drive','App-by-app actions and file formats, authorization, reopening files, troubleshooting and district OAuth setup.'))
RENDER=['backdropsplat','layoutsplat-verification','plansplat','google-drive','layoutsplat-features','writesplat','layoutsplat-labels','layoutsplat-import-accuracy','layoutsplat-ebooks','layoutsplat','splatworks-domain','tools-widgets-features','faq','for-educators','for-technology-admins','for-parents-and-students','support-wiki-maintenance','setup-browser','setup-mysql','setup-google-apps-script','modular-selfhost','mariadb-local','COMPLIANCE','tool-inventory','standalone-architecture']
parser=MarkdownIt('commonmark',{'html':False}).enable('table')
for name in RENDER:
 source=ROOT/'docs'/f'{name}.md'; body=parser.render(source.read_text())
 # Markdown links remain relative to their original docs/ location.
 def rel(m):
  url=m.group(2)
  if url.startswith(('#','http:','https:','mailto:','/')): return m.group(0)
  target=ROOT/'docs'/url.split('#')[0]
  if target.stem in RENDER and target.suffix=='.md': target=ROOT/'wiki'/(target.stem+'.html')
  frag=('#'+url.split('#',1)[1]) if '#' in url else ''
  return m.group(1)+'="'+os.path.relpath(target,ROOT/'wiki')+('/' if url.split('#')[0].endswith('/') else '')+frag+'"'
 body=re.sub(r'(href|src)="([^"]+)"',rel,body)
 (ROOT/'wiki'/f'{name}.html').write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+html.escape('Save to Google Drive' if name=='google-drive' else 'Frequently asked questions (FAQs)' if name=='faq' else 'LayoutSplat: illustrated feature guide' if name=='layoutsplat-features' else name)+' · SplatWorks Wiki</title><link rel="stylesheet" href="../assets/css/app.css"></head><body><main><article>'+body+'</article></main></body></html>')

def relative(path,current): return os.path.relpath(ROOT/path,(ROOT/current).parent)
FAQ_SECTIONS=[(re.sub(r'[^a-z0-9]+','-',title.lower()).strip('-'),title) for title in re.findall(r'^## (.+)$',(ROOT/'docs/faq.md').read_text(),re.M)]
def faq_links(current):
 return ''.join('<li><a href="'+('' if current=='wiki/faq.html' else relative('wiki/faq.html',current))+'#'+slug+'">'+html.escape(title)+'</a></li>' for slug,title in FAQ_SECTIONS)

WIKI_LANGUAGES=[('es','Español'),('ar','العربية'),('zh-CN','简体中文'),('zh-TW','繁體中文'),('fr','Français'),('pt','Português'),('vi','Tiếng Việt'),('uk','Українська'),('ru','Русский'),('ko','한국어'),('hi','हिन्दी'),('ur','اردو'),('bn','বাংলা'),('ne','नेपाली'),('so','Soomaali'),('am','አማርኛ'),('sw','Kiswahili'),('tl','Filipino')]
def language_html(current):
 source='https://drawsplat.org/'+current
 links='<li><a href="'+relative(current,current)+'" lang="en">English · Original</a></li>'
 for code,label in WIKI_LANGUAGES:
  url='https://translate.google.com/translate?'+urlencode({'sl':'en','tl':code,'u':source})
  links+='<li><a href="'+html.escape(url,quote=True)+'" lang="'+code+'" dir="auto" target="_blank" rel="noopener noreferrer">'+label+'</a></li>'
 return '<details class="wiki-language" name="drawsplat-site-menu"><summary>Read in your language</summary><div class="wiki-language-menu"><p>Google machine translation · Opens a new tab.</p><ul>'+links+'</ul><a class="wiki-language-help" href="https://support.google.com/translate/answer/2534559" target="_blank" rel="noopener noreferrer">Translation help</a></div></details>'

def directory(current):
 blocks=[]
 for group,items in GROUPS.items():
  if group=='For educators':items=[row for row in items if row[0] in EDUCATOR_MENU]
  items=menu_rows(group,items)
  rows=''.join('<li><a href="'+relative(p,current)+'">'+html.escape(t)+'</a><p>'+html.escape(d)+'</p></li>' for p,t,d in items if p!='wiki/index.html')
  blocks.append('<section class="wiki-directory-group"><h2>'+html.escape(group)+'</h2><ul>'+rows+'</ul></section>')
 return '<main><article><p class="landing-eyebrow">Official documentation · SplatWorks ecosystem</p><h1>SplatWorks Wiki</h1><p class="article-lede">The reference for the whole SplatWorks ecosystem: standalone tools, classroom widgets, games, the office suite, and the DrawSplat whiteboard. Find component features, complete-suite installation, teaching guidance, licensing, privacy, and technical setup.</p><div class="wiki-start"><h2>Choose where to begin</h2><ol><li><a href="'+relative('wiki/tools-widgets-features.html',current)+'">Explore tools, widgets, and features by category</a> — Media, Play, Create, Data, Writing, Assessment, Classroom, and Organize.</li><li><a href="'+relative('docs/district-selfhost.html',current)+'">Install the complete district suite</a> — Docker or native, with a rerunnable Quick Start checklist.</li><li><a href="'+relative('guides/teacher-options-quick-start.html',current)+'">Get started as a teacher</a> — use your school account and open your classrooms.</li><li><a href="'+relative('legal/terms-privacy.html',current)+'">Review privacy and district agreements</a> — match controls and documents to your deployment.</li></ol></div><p>Search every article using the sidebar. Existing guide links remain valid. Installation checklists also work in downloaded packages; use the online wiki when checking the current release.</p><p class="wiki-audiences">Start with <a href="'+relative('wiki/for-educators.html',current)+'">Educators</a>, <a href="'+relative('wiki/for-technology-admins.html',current)+'">Technology admins</a>, or <a href="'+relative('wiki/for-parents-and-students.html',current)+'">Parents and students</a>.</p><div class="wiki-directory">'+''.join(blocks)+'</div></article></main>'
for current in ['wiki/index.html','pages/support.html','guides/index.html']:
 (ROOT/current).write_text('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SplatWorks Wiki · Support and documentation</title><meta name="description" content="Explore SplatWorks ecosystem tools, widgets, games, office apps and DrawSplat whiteboard features, complete-suite installation, school classrooms, licensing and privacy."><link rel="canonical" href="https://splatworks.org/wiki/"><link rel="stylesheet" href="'+relative('assets/css/app.css',current)+'"></head><body>'+directory(current)+'</body></html>')


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
   link='<a href="../wiki/">SplatWorks Wiki</a>'
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
   s=s.replace('</head>','<link rel="stylesheet" href="'+relative('assets/css/support-wiki.css',path)+'?v='+WIKI_CSS_VERSION+'"></head>')
   s=re.sub(r'<body([^>]*)>',lambda m:'<body'+m.group(1)+' data-wiki="true">' if 'data-wiki' not in m.group(1) else m.group(0),s,count=1)
   match=re.search(r'<main\b.*?</main>',s,re.S)
   if not match:raise ValueError('Missing main '+path)
   main=match.group(0)
   # Regenerated decoration never becomes part of canonical article content.
   main=re.sub(r'<img[^>]*class="wiki-guide-hero"[^>]*>', '', main)
   if path.startswith(('wiki/', 'guides/')) and group not in ['Privacy and district review', 'Licensing and pricing'] and not re.search(r'<img\b', main):
    hero='<img class="wiki-guide-hero" src="'+relative('assets/brand/splatworks-school-guides.png',path)+'" alt="" decoding="async" width="1536" height="512">'
    main=re.sub(r'(<main\b[^>]*>)',lambda m:m.group(1)+hero,main,count=1)
   toc=[];used=set(re.findall(r'id="([^"]+)"',main))
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
   if path=='wiki/faq.html':
    jumps='<nav class="wiki-faq-jumps" aria-label="FAQ sections"><p>Jump to a topic</p><ul>'+faq_links(path)+'</ul></nav>'
    main=main.replace('<h2',jumps+'<h2',1).replace('<main','<main class="wiki-faq"',1)
   if 'id="wiki-content"' not in main:main=main.replace('<main','<main id="wiki-content"',1) if not re.match(r'<main[^>]*\bid=',main) else main
   main=re.sub(r' tabindex="-1"', '', main)
   main=main.replace('<main','<main tabindex="-1"',1)
   nav=[]
   for category,rows in GROUPS.items():
    rows=menu_rows(category,rows)
    if category=='For educators':rows=[row for row in rows if row[0] in EDUCATOR_MENU or row[0]==path]
    links=''
    for target,label,_ in rows:
     active=target==path or (target=='wiki/index.html' and path in ['guides/index.html','pages/support.html'])
     item='<li><a '+('aria-current="page" ' if active else '')+'href="'+relative(target,path)+'">'+html.escape(label)+'</a>'
     links+=item+'</li>'
    nav.append('<section><h2>'+html.escape(category)+'</h2><ul>'+links+'</ul></section>')
   source_path='docs/'+Path(path).stem+'.md' if path.startswith('wiki/') and Path(path).stem in RENDER else path
   header='<a class="wiki-skip" href="#wiki-content">Skip to article</a><header class="wiki-header"><a class="wiki-brand" href="'+relative('index.html',path)+'"><img src="'+relative('assets/brand/SplatWorks_logo.png',path)+'" alt="" width="44" height="44"><span>SplatWorks <strong>Wiki</strong></span></a>'+nav_html(path)+language_html(path)+'</header>'
   sidebar='<aside class="wiki-sidebar"><details class="wiki-topics" open><summary>Search and browse topics</summary><div><form class="wiki-search" role="search"><label for="wiki-query">Search the wiki</label><div><input id="wiki-query" name="q" type="search" placeholder="Try: roster, OAuth, DPA" autocomplete="off"><button type="submit">Search</button></div></form><nav aria-label="Wiki topics">'+''.join(nav)+'</nav></div></details></aside>'
   toolbar='<div class="wiki-article-bar"><span>'+html.escape(group)+'</span><div><a href="https://github.com/mguhlin/drawsplat/blob/main/'+source_path+'">Source</a><button class="wiki-print" type="button" hidden>Print</button></div></div><section class="wiki-results" hidden aria-label="Search results"><h2>Search results</h2><p class="wiki-result-status" role="status"></p><ol></ol><button class="wiki-clear" type="button">Back to article</button></section>'
   outline='<aside class="wiki-outline"><nav aria-label="On this page"><h2>On this page</h2><ul>'+''.join(toc)+'</ul></nav><p class="wiki-note">Current documentation<br>Updated 15 October 2026</p><a href="'+relative('pages/contact.html',path)+'">Report a documentation issue</a></aside>'
   shell='<!-- wiki:start -->'+header+'<div class="wiki-layout">'+sidebar+'<div class="wiki-reading">'+toolbar+'<!-- wiki:main -->'+main+'<!-- wiki:end-main --></div>'+outline+'</div><footer class="wiki-footer">SplatWorks Wiki · Official setup, support, and district reference · <a href="'+relative('wiki/licensing.html',path)+'">Licensing</a></footer><!-- wiki:end -->'
   s=s[:match.start()]+shell+s[match.end():]
   s=s.replace('</body>','<script src="'+relative('assets/js/support-index.js',path)+'" defer></script><script src="'+relative('assets/js/support-wiki.js',path)+'" defer></script></body>')
   s=re.sub(r'<script[^>]*src="[^\"]*wiki-language.js[^\"]*"[^>]*></script>','',s)
   s=s.replace('</body>','<script src="'+relative('assets/js/wiki-language.js',path)+'" defer></script></body>')
   p.write_text(s)
  main=re.search(r'<main\b.*?</main>',s,re.S).group(0);plain=Plain();plain.feed(main)
  entries.append({'path':path,'title':title,'category':group,'description':desc,'text':re.sub(r'\s+',' ',' '.join(plain.parts)).strip()})
(ROOT/'assets/js/support-index.js').write_text('/* Generated by scripts/build-support-wiki.py. */\nwindow.DrawSplatWikiIndex = '+json.dumps(entries,ensure_ascii=False)+';\n')
print('Built SplatWorks Wiki:',len(entries),'searchable articles')

# Compatibility copies support static/offline hosts; production redirects use the canonical URL.
write_policy_aliases(ROOT)

# Keep every public header aligned with this generated documentation.
import subprocess, sys
subprocess.run([sys.executable, str(ROOT/"scripts/build-site-navigation.py")], check=True)

# Reapply the shared controls after generated HTML has been rewritten.
subprocess.run([sys.executable, str(ROOT/"scripts/build-privacy-controls.py")], check=True)
