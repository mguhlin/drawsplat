"""Render policy data and compatibility copies from one canonical article."""
from pathlib import Path
import html
import json
import os
import re

CANONICAL = 'legal/terms-privacy.html'

def refresh(root):
    page = root / CANONICAL
    source = page.read_text()
    schedule = json.loads((root / 'data/privacy-retention.json').read_text())['schedule']
    rows = []
    for item in schedule:
        timing = html.escape(item['default'])
        if item.get('configured'):
            timing += '<br>' + html.escape(item['configured'])
        rows.append('<tr><th scope="row">' + html.escape(item['data']) + '</th><td>' + timing + '</td><td>' + html.escape(item['deletion']) + '</td></tr>')
    retention = '<table class="policy-retention"><caption>Retention by data type</caption><thead><tr><th scope="col">Data</th><th scope="col">Schedule</th><th scope="col">Deletion</th></tr></thead><tbody>' + ''.join(rows) + '</tbody></table>'
    providers = json.loads((root / 'data/privacy-providers.json').read_text())['providers']
    labels = {'companyCountry':'Company country','purpose':'Purpose','data':'Data processed','processing':'Processing location','enabled':'Enabled when','terms':'Terms / DPA','dataControls':'Provider data controls','transfer':'Transfer safeguards','scopes':'OAuth / access scopes'}
    blocks = []
    for provider in providers:
        fields = []
        for key, label in labels.items():
            if key not in provider:
                continue
            value = html.escape(provider[key])
            if provider[key].startswith('https://'):
                value = '<a href="' + html.escape(provider[key], quote=True) + '">' + label + '</a>'
            fields.append('<dt>' + label + '</dt><dd>' + value + '</dd>')
        blocks.append('<div class="policy-provider"><h3>' + html.escape(provider['name']) + '</h3><dl>' + ''.join(fields) + '</dl></div>')
    for key, content in [('retention',retention),('providers',''.join(blocks))]:
        pattern = r'<!-- policy-' + key + r':start -->.*?<!-- policy-' + key + r':end -->'
        source, count = re.subn(pattern, lambda _: '<!-- policy-' + key + ':start -->' + content + '<!-- policy-' + key + ':end -->', source, flags=re.S)
        if count != 1:
            raise ValueError('Expected one policy data marker: ' + key)
    # Old incoming fragments land at the relevant consolidated section. Keep
    # historical fragment names without retaining duplicate policy prose.
    source = re.sub(r'<!-- policy-legacy:start -->.*?<!-- policy-legacy:end -->', '', source, flags=re.S)
    used = set(re.findall(r'\bid="([^"]+)"', source))
    anchors = {}
    for item in json.loads((root / 'data/policy-legacy-links.json').read_text()):
        for fragment in item['fragments']:
            if fragment not in used:
                used.add(fragment)
                anchors.setdefault(item['section'], []).append(fragment)
    for target, fragments in anchors.items():
        marker = r'(<h[23]\b[^>]*\bid="' + re.escape(target) + r'"[^>]*>)'
        content = '<!-- policy-legacy:start -->' + ''.join('<span class="policy-legacy-anchor" aria-hidden="true" id="' + html.escape(fragment, quote=True) + '"></span>' for fragment in fragments) + '<!-- policy-legacy:end -->'
        source, count = re.subn(marker, lambda m: content + m.group(1), source, count=1)
        if count != 1:
            raise ValueError('Missing consolidated section: ' + target)
    page.write_text(source)

def write_aliases(root):
    source = (root / CANONICAL).read_text()
    for item in json.loads((root / 'data/policy-legacy-links.json').read_text()):
        if item['path'] == CANONICAL:
            continue
        current = root / item['path']
        def rebase(match):
            url = match.group(2)
            if url.startswith(('#','/','http:','https:','mailto:','data:')):
                return match.group(0)
            base, separator, fragment = url.partition('#')
            path, query_separator, query = base.partition('?')
            target = os.path.normpath(str((root / CANONICAL).parent / path))
            result = os.path.relpath(target, current.parent)
            if query_separator:
                result += '?' + query
            if separator:
                result += '#' + fragment
            return match.group(1) + '="' + result + '"'
        alias = re.sub(r'(href|src)="([^"]+)"', rebase, source)
        alias = alias.replace('</head>', '<meta name="robots" content="noindex,follow"></head>', 1)
        alias = '<!-- Generated compatibility copy; edit legal/terms-privacy.html. -->\n' + alias
        current.write_text(alias)
