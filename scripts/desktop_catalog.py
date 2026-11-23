"""Canonical user-facing desktop catalogue; versions live in one small data file."""
from pathlib import Path
import json,os,re
from html import escape
ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'data/desktop-apps.json').read_text())
def rel(path,current):return os.path.relpath(ROOT/path,(ROOT/current).parent)
def choices(current):
 return '<div class="use-choices"><a href="'+rel('studio/index.html',current)+'"><strong>Use browser apps</strong><span>Open an app now. No installation.</span></a><a href="'+rel('pages/download.html',current)+'#desktop-apps"><strong>Download desktop apps</strong><span>Install tools for Windows, Mac or Linux.</span></a></div>'
def platform_links(binary,version,tag):
 base=DATA['repository']+'/releases/download/'+tag+'/'+binary+'-'+version
 return '<div class="platform-downloads">'+''.join('<a href="'+base+suffix+'" aria-label="Download '+escape(binary)+' for '+name+'">'+name+'</a>' for name,suffix in [('Windows','-windows-amd64-setup.exe'),('Mac','-macos-universal.dmg'),('Linux','-linux-amd64.deb')])+'</div>'
def content():
 core=DATA['coreVersion'];tools=DATA['toolsVersion'];current='pages/download.html'
 apps=''.join('<article class="desktop-small-app"><h3>'+escape(a['name'])+'</h3><p>'+escape(a['description'])+'</p>'+platform_links(a['binary'],tools,'tools-v'+tools)+'</article>' for a in DATA['apps'])
 return '''<main class="download-start"><h1>Get SplatWorks</h1><p class="article-lede">Use browser apps or install desktop tools.</p>'''+choices(current)+'''
<section id="desktop-apps" class="desktop-main" aria-labelledby="desktop-heading"><span id="desktop-previews"></span><h2 id="desktop-heading">Download desktop apps</h2><article class="desktop-suite"><h3>SplatWorks Desktop</h3><div class="suite-description"><p>Edit PDFs and protect files with CipherSplat in one application. Works locally after installation; no account required.</p><p class="desktop-preview">Preview release. Windows and Mac may show publisher warnings.</p></div><div class="platform-panel"><p class="platform-label">Choose your computer</p>'''+platform_links('SplatWorks-Desktop',core,'v'+core)+'''<p class="desktop-more"><a href="../wiki/desktop-apps.html">Installation help</a> · <a href="'''+DATA['repository']+'/releases/tag/v'+core+'''">Other formats and checksums</a></p></div></article>
<details class="individual-desktop"><summary>Download one app instead</summary><div class="desktop-small-grid">'''+apps+'''</div></details>
<p class="desktop-note">Office apps such as ListSplat, GridSplat and WriteSplat are available in your browser. <a href="../studio/index.html">Browse browser apps</a>.</p></section>
<section class="download-quick-help"><h2>What happens next?</h2><p>Download the version for your computer, install it, then open an app and choose a file. Use Save to keep your work.</p><p><a href="../wiki/desktop-apps.html">Read the short desktop guide</a> · <a href="../wiki/">Get help</a></p></section>
<details id="advanced-downloads" class="package-reference"><summary>Browser app packages and school installation</summary><p>These ZIPs are for running browser apps locally or hosting them for a school. <a href="../wiki/for-technology-admins.html">Technology admin guide</a>.</p>'''+(ROOT/'templates/download-packages.html').read_text()+'''</details></main>'''
def build():
 p=ROOT/'pages/download.html';s=p.read_text();s=re.sub(r'<main\b.*?</main>',lambda _:content(),s,count=1,flags=re.S)
 s=re.sub(r'<title>.*?</title>','<title>Browser apps and desktop downloads · SplatWorks</title>',s,count=1)
 s=re.sub(r'<meta name="description" content="[^"]*"','<meta name="description" content="Use SplatWorks in your browser, or download desktop apps for Windows, Mac and Linux. Simple choices and installation help."',s,count=1)
 s=s.replace('https://drawsplat.org/pages/download.html','https://splatworks.org/pages/download.html')
 if 'get-started.css' not in s:s=s.replace('</head>','<link rel="stylesheet" href="../assets/css/get-started.css"></head>')
 if 'download-navigation.js' not in s:s=s.replace('</body>','<script src="../assets/js/download-navigation.js" defer></script></body>')
 p.write_text(s)
