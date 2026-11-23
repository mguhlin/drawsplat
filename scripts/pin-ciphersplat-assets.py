#!/usr/bin/env python3
"""Pin local CipherSplat runtime assets; shared ecosystem controls evolve independently."""
import base64,hashlib,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'solutions/CipherSplat'
for page in root.glob('*.html'):
 def pin(match):
  tag=match.group();url=re.search(r'(?:src|href)="([^"]+)"',tag).group(1)
  tag=re.sub(r' integrity="[^"]*"','',tag)
  path=root/url.split('?')[0]
  if url.startswith('../') or not path.is_file() or path.suffix not in ['.js','.css']:return tag
  return tag[:-1]+' integrity="sha384-'+base64.b64encode(hashlib.sha384(path.read_bytes()).digest()).decode()+'">'
 text=re.sub(r'<(?:script|link)\b[^>]*(?:src|href)="[^"]+"[^>]*>',pin,page.read_text())
 page.write_text(text)
