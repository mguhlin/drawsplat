#!/usr/bin/env python3
"""Validate browser-exported books with pinned upstream EPUBCheck, not our importer."""
from pathlib import Path
import argparse, hashlib, subprocess, tempfile, urllib.request, zipfile

parser=argparse.ArgumentParser()
parser.add_argument('--results',default='test-results')
parser.add_argument('--jar',type=Path)
args=parser.parse_args()
books=[p for p in Path(args.results).rglob('*.epub') if p.name in ('reflowable.epub','fixed.epub','illustrated.epub')]
if {p.name for p in books}!={'reflowable.epub','fixed.epub','illustrated.epub'}:
 raise SystemExit('Missing reflowable, fixed-layout or illustrated EPUB browser proof.')

def check(jar):
 for book in sorted(books):
  subprocess.run(['java','-jar',str(jar),str(book)],check=True)
 print(f'Validated {len(books)} EPUB books with upstream EPUBCheck 5.4.0.')

if args.jar:
 check(args.jar)
else:
 with tempfile.TemporaryDirectory(prefix='layoutsplat-epubcheck-') as temporary:
  root=Path(temporary)
  url='https://github.com/w3c/epubcheck/releases/download/v5.4.0/epubcheck-5.4.0.zip'
  with urllib.request.urlopen(url,timeout=60) as response:
   data=response.read(40_000_001)
  if len(data)>40_000_000 or hashlib.sha256(data).hexdigest()!='33350c61038e71dfb3d45a76aed04bf5481e6d5500cb780f6e98db8bbd15a28c':
   raise SystemExit('EPUBCheck download did not match the pinned upstream SHA-256.')
  archive=root/'epubcheck.zip';archive.write_bytes(data)
  with zipfile.ZipFile(archive) as z:
   for entry in z.infolist():
    if Path(entry.filename).is_absolute() or '..' in Path(entry.filename).parts:
     raise SystemExit('Unsafe EPUBCheck archive path.')
   z.extractall(root)
  check(root/'epubcheck-5.4.0/epubcheck.jar')
