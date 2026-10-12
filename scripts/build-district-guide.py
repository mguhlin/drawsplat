#!/usr/bin/env python3
"""Build the offline HTML guide from Markdown. Requires: pip install markdown-it-py"""
from pathlib import Path
import html
import json
import re
from site_navigation import nav_html
from markdown_it import MarkdownIt
root = Path(__file__).resolve().parents[1]
source = (root / 'docs/district-selfhost.md').read_text()
source = source.replace('[View HTML](district-selfhost.html) · [Download Markdown](district-selfhost.md)\n', '')
parser = MarkdownIt('commonmark', {'html': False}).enable('table')
tokens = parser.parse(source)
contents = []
for index, token in enumerate(tokens):
    if token.type == 'heading_open':
        title = tokens[index + 1].content
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        token.attrSet('id', slug)
        if token.tag == 'h2':
            contents.append(f'<li><a href="#{slug}">{html.escape(title)}</a></li>')
body = parser.renderer.render(tokens, parser.options, {})
heading = re.search(r'<h1[^>]*>.*?</h1>', body).group(0)
body = body.replace(heading, '', 1)
quickstart = (root / 'selfhost/district/quickstart.html').read_text()
registry = json.loads((root / 'data/drawsplat-tools.json').read_text())
components = [t for t in registry['tools'] if re.match(r'^/(app|splatworks|solutions|games)/', t['url'])]
(root / 'assets/js/district-components.js').write_text('window.DrawSplatInstallComponents = ' + json.dumps(components, ensure_ascii=False) + ';\n')
page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self'; img-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'">
<title>Ecosystem district installation guide · DrawSplat</title><meta name="description" content="Install the DrawSplat ecosystem: whiteboard, tools, widgets, games and SplatWorks, with optional district accounts, Google sign-in and classroom rosters.">
<link rel="stylesheet" href="../assets/css/district-guide.css"><link rel="stylesheet" href="../assets/css/site-navigation.css"></head><body>
<!-- Generated from district-selfhost.md by scripts/build-district-guide.py. -->
<a class="skip-link" href="#guide">Skip to installation guide</a>
<header class="guide-header"><a href="../">DrawSplat</a>''' + nav_html('docs/district-selfhost.html') + '''</header>
<div class="guide-layout"><aside><nav aria-label="Contents"><h2>In this guide</h2><ul><li><a href="#quick-start-hub">Quick Start checklist</a></li>''' + ''.join(contents) + '''</ul></nav></aside>
<main id="guide"><img class="guide-banner" src="../assets/brand/admin-headers/district-roster.png" alt="" width="2171" height="724">''' + heading + '<p class="guide-format-links"><a href="district-selfhost.md">View Markdown</a> · <a href="district-selfhost.md" download>Download Markdown</a></p>' + quickstart + body + '''</main></div>
<footer>DrawSplat district installation · <a href="district-selfhost.md">Markdown source</a></footer><script src="../assets/js/site-navigation.js" defer></script><script src="../assets/js/district-components.js"></script><script src="../assets/js/district-quickstart.js"></script></body></html>'''
(root / 'docs/district-selfhost.html').write_text(page)

start = page.replace('../assets/', 'assets/').replace('../pages/', 'pages/').replace('../wiki/', 'wiki/').replace('href="../"', 'href="index.html"').replace('href="district-selfhost.md"', 'href="docs/district-selfhost.md"')
start = start.replace('href="district-selfhost.html', 'href="docs/district-selfhost.html')
(root / 'START-HERE.html').write_text(start)
(root / '00-START-HERE.html').write_text(start)

(root / 'start-here.html').write_text(start)
