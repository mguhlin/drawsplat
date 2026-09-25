#!/usr/bin/env python3
"""Add a loopback-only offline launcher to a staged self-host package."""
import json
from pathlib import Path
import shutil
import sys
from html import escape

folder, name, entry = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
names = ['DrawSplat', 'GridSplat', 'ShowSplat', 'WriteSplat', 'ListSplat', 'SplatWorks', 'Tools', 'Widgets', 'Games', 'AudioSplat', 'VideoSplat', 'MediaSplat', 'PDFSplat', 'CipherSplat']
port = 8765 + names.index(name)
source = Path(__file__).resolve().parent / 'offline-launcher'
for path in source.iterdir():
    if path.is_file():
        shutil.copy2(path, folder / path.name)
(folder / 'offline-app.json').write_text(json.dumps({'name': name, 'entry': entry, 'port': port}) + '\n')
(folder / 'START-HERE.html').write_text('''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Open ''' + escape(name) + ''' offline</title><style>body{font:18px/1.6 system-ui,sans-serif;max-width:760px;margin:48px auto;padding:0 24px;color:#18233b}h1{line-height:1.2}li{margin:14px 0}code{background:#f1edff;padding:3px 7px;border-radius:5px}</style>
<h1>Open ''' + escape(name) + ''' offline</h1><p>Extract the entire ZIP and keep its folders together. Use the launcher below to open the app in your browser.</p>
<ul><li><strong>Windows:</strong> double-click <code>START-WINDOWS.bat</code>.</li><li><strong>macOS:</strong> open <code>START-MAC.command</code>. If macOS blocks it, open Terminal in this folder and run <code>sh start-local.sh</code>.</li><li><strong>Linux:</strong> open a terminal in this folder and run <code>sh start-local.sh</code>.</li></ul>
<p>The launchers require <strong>Python 3</strong>, installed once before going offline. No extra Python packages are needed. You can also run <code>python3 offline-server.py</code> (Windows: <code>py -3 offline-server.py</code>).</p>
<p>The app opens at an address beginning with <code>http://127.0.0.1:</code>. It runs only on your computer. No internet connection, hosting account, or remote server is needed for local editing. Keep the terminal window open while working; press Ctrl+C to stop.</p>
<p>Browsers restrict some app features when index.html is opened directly from disk. This launcher supports the scripts, workers, and browser storage the apps need. PDFSplat and the dedicated CipherSplat offline edition also support direct file opening in tested desktop Chrome and Firefox.</p>
<p>Online sharing and external links require internet access. Speech models must be downloaded before offline use. Browser/device permissions still apply to recording and screen capture.</p></html>''', encoding='utf-8')

# Direct-file startup must explain the supported path instead of appearing broken.
if name not in ('PDFSplat', 'CipherSplat'):
    import os
    entry_path = entry.split('#')[0].split('?')[0]
    target = folder / entry_path
    if entry_path.endswith('/'):
        target /= 'index.html'
    if target.is_file():
        relative = os.path.relpath(folder / 'offline-help.js', target.parent).replace(os.sep, '/')
        content = target.read_text(encoding='utf-8')
        marker = '<script src="' + relative + '"></script>'
        content = content.replace('</head>', marker + '\n</head>', 1)
        target.write_text(content, encoding='utf-8')
        (folder / 'offline-help.js').write_text('''if(location.protocol==='file:'){
 const instructions=new URL('START-HERE.html',document.currentScript.src).href;
 document.addEventListener('DOMContentLoaded',()=>{
 const dialog=document.createElement('dialog');dialog.style.cssText='max-width:600px;padding:30px;border:2px solid #7c3aed;border-radius:16px;font:18px/1.6 system-ui;color:#18233b';
 const title=document.createElement('h2');title.textContent='Open this app with its local launcher';
 const text=document.createElement('p');text.textContent='Extract the whole ZIP. Run START-WINDOWS.bat on Windows, START-MAC.command on macOS, or sh start-local.sh on Linux. The app opens in your browser and runs on this computer without an internet connection. Python 3 is required.';
 const link=document.createElement('a');link.href=instructions;link.textContent='Read the offline setup instructions';
 dialog.append(title,text,link);document.body.append(dialog);dialog.showModal();
 });
}''', encoding='utf-8')

# A module catalog must only advertise apps actually included in this ZIP.
from urllib.parse import urlsplit, unquote
import re

def local_target(url, page):
    parts = urlsplit(url)
    if parts.scheme or parts.netloc or not parts.path:
        return None
    target = folder / unquote(parts.path.lstrip('/')) if parts.path.startswith('/') else page.parent / unquote(parts.path)
    return target / 'index.html' if target.is_dir() else target

registry = folder / 'data/drawsplat-tools.json'
if registry.exists():
    data = json.loads(registry.read_text())
    data['tools'] = [tool for tool in data['tools'] if (local_target(tool['url'], folder / 'index.html') or folder).is_file()]
    ids = {tool['id'] for tool in data['tools']}
    for tool in data['tools']:
        tool['related'] = [key for key in tool.get('related', []) if key in ids]
    registry.write_text(json.dumps(data, indent=2) + '\n')

for relative in (['index.html'] if name == 'DrawSplat' else []) + ['pages/tools.html', 'pages/splatworks.html', 'games/index.html']:
    page = folder / relative
    if not page.exists():
        continue
    def revise_link(match):
        anchor = match.group(0)
        href = re.search(r'href="([^"]+)"', anchor)
        if not href:
            return anchor
        target = local_target(href[1], page)
        if target is None or target.exists():
            return anchor
        if re.search(r'class="[^"]*(?:standalone-tool-card|workspace-card|studio-nav-icon-card)', anchor):
            return ''
        path = '/' + str(target.resolve().relative_to(folder.resolve()))
        return anchor.replace(href[0], 'href="https://drawsplat.org' + path + '" title="Opens the online website; internet required"')
    content = re.sub(r'<a\b[^>]*>.*?</a>', revise_link, page.read_text(), flags=re.S)
    page.write_text(content)

launcher = folder / 'assets/js/tool-launcher.js'
if launcher.exists() and not (folder / 'studio/index.html').exists():
    launcher.write_text(launcher.read_text().replace('href="/studio/"', 'href="https://drawsplat.org/studio/"').replace('View all DrawSplat tools →', 'View all DrawSplat tools online →'))

cards = folder / 'assets/js/action-cards.js'
if cards.exists():
    content = cards.read_text()
    def filter_card_routes(match):
        routes = json.loads(match[1])
        routes = [route for route in routes if (local_target(route['url'], folder / 'index.html') or folder).is_file()]
        return 'const toolRoutes=' + json.dumps(routes) + ';'
    cards.write_text(re.sub(r'const toolRoutes=(\[.*?\]);', filter_card_routes, content))
