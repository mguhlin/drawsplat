#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 - "${1:-$ROOT_DIR/solutions/CipherSplat}" "${2:-${1:-$ROOT_DIR/solutions/CipherSplat}/integrity.json}" <<'PYCODE'
import hashlib,json,sys
from pathlib import Path
root=Path(sys.argv[1]);files=set()
for pattern in ['*.html','*.js','*.css','*.webmanifest','port-source.json','LICENSE','COPYING','NOTICE.md','README.md','OFFLINE-README.txt','assets/**/*','vendor/**/*','shared/**/*']:
 files.update(p for p in root.glob(pattern) if p.is_file() and p.name != 'playwright.config.js')
if not (root/'shared').exists():
 for rel in ['css/privacy-controls.css','js/privacy-controls.js','css/app-language.css','js/app-language.js','css/action-cards.css','js/action-cards.js','css/action-icons.css']:
  files.add(root/'../../assets'/rel)
import os
result={'schema':'drawsplat-ciphersplat-integrity-v1','application':'CipherSplat','applicationVersion':'1.1.0','openpgpVersion':'6.3.1','argon2Version':'hash-wasm 4.12.0','jszipVersion':'3.10.1','hashAlgorithm':'SHA-256','files':{os.path.relpath(p,root):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(files)}}
Path(sys.argv[2]).write_text(json.dumps(result,indent=2)+'\n')
print('Generated '+sys.argv[2])
PYCODE
