#!/usr/bin/env python3
"""Build the student planner with its local launcher, shared UI and notices."""
from pathlib import Path
import shutil,subprocess,sys,tempfile,zipfile,json,hashlib,re
root=Path(__file__).resolve().parents[1]
version=sys.argv[1] if len(sys.argv)>1 else 'v1.1.1'
name='splatworks-plansplat-selfhost-'+version
with tempfile.TemporaryDirectory(prefix='plansplat-package-') as temporary:
 folder=Path(temporary)/name
 for relative in ['splatworks/plansplat','privacy','legal','assets/css','assets/js','assets/privacy','assets/plansplat-guide']:
  shutil.copytree(root/relative,folder/relative,ignore=shutil.ignore_patterns('node_modules','test-results','*.log','__pycache__'))
 for relative in ['splatworks/shared/google-drive-auth.js','splatworks/shared/LICENSE.txt','LICENSE','data/drawsplat-tools.json','data/privacy-inventory.json','data/privacy-retention.json','data/privacy-providers.json','docs/plansplat.md','docs/google-drive.md','wiki/plansplat.html','wiki/google-drive.html','_headers']+[str(p.relative_to(root)) for p in (root/'data').glob('privacy-network-*.json')]:
  (folder/relative).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/relative,folder/relative)
 for page in list(folder.rglob('*.html')):
  for resource in re.findall(r'assets/brand/[^\"\'<>? ]+',page.read_text()):
   original=root/resource
   if original.is_file():(folder/resource).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(original,folder/resource)
 (folder/'PLANSPLAT-README.txt').write_text('PlanSplat student planner '+version+'\nExtract all files and open START-HERE.html. Includes local/offline planning, courses, tasks, study schedules, routines, focus timer and exports. Optional Google Calendar updates need Calendar API enablement and separate app-created-calendar consent. Sync runs while the app is open. Google Drive needs an internet connection and a configured OAuth client for this exact origin. The public site uses its existing client. Reconnect when Google authorization expires. Planner and recovery files remain in your Google Drive. Interface: English. License: AGPL-3.0-or-later; shared utilities retain MIT.\n')
 subprocess.run([sys.executable,str(root/'scripts/add-offline-launcher.py'),str(folder),'PlanSplat','splatworks/plansplat/'],check=True)
 registry=json.loads((folder/'data/drawsplat-tools.json').read_text());ids={t['id'] for t in registry['tools']};inventory=json.loads((folder/'data/privacy-inventory.json').read_text());inventory['components']=[c for c in inventory['components'] if c['id'] in ids]
 for c in inventory['components']:c['entrySha256']=hashlib.sha256((folder/c['entry']).read_bytes()).hexdigest()
 (folder/'data/privacy-inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')
 target=root/'dist'/(name+'.zip');target.parent.mkdir(exist_ok=True)
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
  for file in sorted(folder.rglob('*')):
   if file.is_file():archive.write(file,file.relative_to(folder.parent))
 print(target)
