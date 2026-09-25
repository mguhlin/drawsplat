#!/usr/bin/env python3
"""Measure release ZIPs and update approximate download/unpacked sizes on the page."""
import argparse
from pathlib import Path
import re
import zipfile

parser = argparse.ArgumentParser()
parser.add_argument('version')
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
page = root / 'pages/download.html'
html = page.read_text()
count = 0

def replace(match):
    global count
    filename = match.group(1)
    if filename != 'CipherSplat-offline.zip' and not filename.endswith(f'-{args.version}.zip'):
        raise ValueError(f'Unexpected package version: {filename}')
    archive = root / 'solutions/CipherSplat/downloads' / filename if filename == 'CipherSplat-offline.zip' else root / 'dist' / filename
    with zipfile.ZipFile(archive) as package:
        unpacked = sum(item.file_size for item in package.infolist())
    count += 1
    label = f'ZIP: {archive.stat().st_size / 1_000_000:.1f} MB · Unpacked: {unpacked / 1_000_000:.1f} MB'
    return f'<small class="download-size" data-package="{filename}">{label}</small>'

updated = re.sub(r'<small class="download-size" data-package="([^"]+)">[^<]*</small>', replace, html)
if count != 14:
    raise ValueError(f'Expected 14 package sizes, found {count}')
if args.check:
    if updated != html:
        raise SystemExit('Download sizes differ from the measured packages; regenerate them.')
    print('All 14 displayed ZIP and unpacked sizes match the measured packages.')
else:
    page.write_text(updated)
    print('Updated all 14 package sizes (decimal MB, rounded to one decimal place).')
