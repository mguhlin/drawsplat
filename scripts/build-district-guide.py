#!/usr/bin/env python3
"""Build the offline HTML guide from Markdown. Requires: pip install markdown-it-py"""
from pathlib import Path
import html
import re
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
page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self'; img-src 'self'; script-src 'none'; object-src 'none'; base-uri 'none'">
<title>District installation guide · DrawSplat</title><meta name="description" content="Install DrawSplat with MariaDB or MySQL, create your district administrator, configure Google sign-in, and import classroom rosters.">
<link rel="stylesheet" href="../assets/css/district-guide.css"></head><body>
<!-- Generated from district-selfhost.md by scripts/build-district-guide.py. -->
<a class="skip-link" href="#guide">Skip to installation guide</a>
<header class="guide-header"><a href="../">DrawSplat</a><nav aria-label="Guide formats"><a href="district-selfhost.md">View Markdown</a><a href="district-selfhost.md" download>Download Markdown</a><a href="../pages/download.html">Downloads</a></nav></header>
<div class="guide-layout"><aside><nav aria-label="Contents"><h2>In this guide</h2><ul>''' + ''.join(contents) + '''</ul></nav></aside>
<main id="guide"><img class="guide-banner" src="../assets/brand/admin-headers/district-roster.png" alt="" width="2171" height="724">''' + body + '''</main></div>
<footer>DrawSplat district installation · <a href="district-selfhost.md">Markdown source</a></footer></body></html>'''
(root / 'docs/district-selfhost.html').write_text(page)
