#!/usr/bin/env python3
"""Build LayoutSplat with its runtime dependencies, source, and notices."""
from pathlib import Path
import shutil, subprocess, sys, tempfile, zipfile
root=Path(__file__).resolve().parents[1]
version=sys.argv[1]
name=f'splatworks-layoutsplat-selfhost-{version}'
(root/'.tmp/package-stage').mkdir(parents=True,exist_ok=True)
with tempfile.TemporaryDirectory(dir=root/'.tmp/package-stage') as temporary:
 folder=Path(temporary)/name
 ignored=shutil.ignore_patterns('node_modules','.git','.codex','.agents','.tmp','test-results','playwright-report','dist','coverage','*.log')
 for relative in ['splatworks/layoutsplat','splatworks/shared','vendor','solutions/mediasplat/ffmpeg','assets/css','assets/js','assets/icons','assets/favicons']:
  shutil.copytree(root/relative,folder/relative,ignore=ignored)
 for relative in ['assets/brand/SplatWorks_logo.png','data/drawsplat-tools.json']+[f'docs/{s}.md' for s in ['layoutsplat','layoutsplat-labels','layoutsplat-import-accuracy']]+[f'wiki/{s}.html' for s in ['layoutsplat','layoutsplat-labels','layoutsplat-import-accuracy']]:
  (folder/relative).parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(root/relative,folder/relative)
 revision=subprocess.check_output(['git','rev-parse','--short','HEAD'],cwd=root,text=True).strip()
 (folder/'LAYOUTSPLAT-README.txt').write_text(f'''LayoutSplat / SplatWorks standalone publication editor\nVersion: {version}\nSource: {revision}\nExtract the entire ZIP and open START-HERE.html for the local launcher.\nFor static hosting, upload all folders unchanged and open /splatworks/layoutsplat/.\nIncludes source and notices, 305 templates, Avery labels/name badges, fonts,\nPublisher/legacy Pages import, EPS/AI/PDF artwork, merge, and print exports.\nNative INDD/QXP and modern Pages IWA require interchange exports.\nOther SplatWorks apps can be installed alongside this module.\nSee docs/layoutsplat.md and splatworks/layoutsplat/THIRD_PARTY_NOTICES.md.\n''')
 subprocess.run([sys.executable,str(root/'scripts/add-offline-launcher.py'),str(folder),'LayoutSplat','splatworks/layoutsplat/'],check=True)
 target=root/'dist'/f'{name}.zip';target.parent.mkdir(exist_ok=True)
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for path in sorted(folder.rglob('*')):
   if path.is_file():z.write(path,path.relative_to(folder.parent))
 print(target)
