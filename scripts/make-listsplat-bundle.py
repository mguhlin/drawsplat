#!/usr/bin/env python3
"""Build the independently versioned ListSplat classroom database module."""
from pathlib import Path
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
version = sys.argv[1] if len(sys.argv) > 1 else 'v' + json.loads((root / 'splatworks/listsplat/package.json').read_text())['version']
if not re.fullmatch(r'v\d+\.\d+\.\d+', version):
    raise SystemExit('Use a version such as v0.2.0')
name = f'splatworks-listsplat-selfhost-{version}'
ignored = shutil.ignore_patterns('node_modules', '.git', 'dist', 'test-results', 'coverage', '*.log', '*.tsbuildinfo', '__pycache__', '*.pyc')
with tempfile.TemporaryDirectory(prefix='listsplat-package-') as temporary:
    folder = Path(temporary) / name
    for relative in ['splatworks/listsplat', 'splatworks/shared', 'privacy', 'legal', 'assets/css', 'assets/js', 'assets/brand', 'assets/icons', 'assets/favicons', 'assets/privacy']:
        shutil.copytree(root / relative, folder / relative, ignore=ignored)
    # Keep the runtime referenced by the production entry point; omit old build hashes.
    entry = (folder / 'splatworks/listsplat/index.html').read_text()
    referenced = {Path(path).name for path in re.findall(r'(?:src|href)="([^"]*assets/[^"]+)"', entry)}
    for asset in (folder / 'splatworks/listsplat/assets').iterdir():
        if asset.name not in referenced and asset.suffix in ('.js', '.css'):
            asset.unlink()
    for relative in ['LICENSE', '_headers', 'data/drawsplat-tools.json', 'data/privacy-inventory.json', 'data/privacy-retention.json', 'data/privacy-providers.json', 'pages/listsplat.html', 'blog/listsplat-classroom-databases.html', 'docs/release-notes/LISTSPLAT_v0.2.0.md'] + [str(path.relative_to(root)) for path in sorted((root / 'data').glob('privacy-network-*.json'))]:
        target = folder / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(root / relative, target)
    revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
    (folder / 'LISTSPLAT-README.txt').write_text(f'''ListSplat {version} classroom database module
Source revision: {revision}
Extract every folder and open START-HERE.html. The local launcher requires Python 3.
For static hosting upload all included folders and open /splatworks/listsplat/.
To update a prior SplatWorks suite installation, copy the included folders over it.
15 starters contain 17 tables and 204 practice records: 12 records in every table.
Includes connected library loans and science trials, validated primary/foreign keys,
Markdown paste/file import, nine views, teacher questions, and native project backups.
People, books and measurements are fictional. Verify/source factual research claims.
Local editing and examples work offline. Optional Google Drive needs internet and
an OAuth client configured for the installation origin. No real student data is included.
Existing saved projects are not replaced by expanded examples. Save .listsplat.json
backups regularly; browser storage is local to the browser profile and origin.
App code: GPL-3.0-only; shared utilities retain their own notices. See app COPYING
and LICENSE.md, splatworks/shared/LICENSE.txt and repository LICENSE.
''')
    subprocess.run([sys.executable, str(root / 'scripts/add-offline-launcher.py'), str(folder), 'ListSplat', 'splatworks/listsplat/'], check=True)
    registry = json.loads((folder / 'data/drawsplat-tools.json').read_text())
    ids = {tool['id'] for tool in registry['tools']}
    inventory = json.loads((folder / 'data/privacy-inventory.json').read_text())
    inventory['components'] = [component for component in inventory['components'] if component['id'] in ids]
    for component in inventory['components']:
        component['entrySha256'] = hashlib.sha256((folder / component['entry']).read_bytes()).hexdigest()
    (folder / 'data/privacy-inventory.json').write_text(json.dumps(inventory, ensure_ascii=False, indent=2) + '\n')
    target = root / 'dist' / (name + '.zip')
    target.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in sorted(folder.rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(folder.parent))
    checksum = root / 'dist' / f'ListSplat-SHA256SUMS-{version}.txt'
    checksum.write_text(hashlib.sha256(target.read_bytes()).hexdigest() + '  ' + target.name + '\n')
    print(target)
    print(checksum)
