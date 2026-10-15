#!/usr/bin/env python3
"""Build LayoutSplat with its runtime dependencies, source, and notices."""
from pathlib import Path
import shutil, subprocess, sys, tempfile, zipfile
root=Path(__file__).resolve().parents[1]
version=sys.argv[1]
name=f'splatworks-layoutsplat-selfhost-{version}'
with tempfile.TemporaryDirectory(prefix='layoutsplat-package-') as temporary:
 folder=Path(temporary)/name
 ignored=shutil.ignore_patterns('node_modules','.git','.codex','.agents','.tmp','test-results','playwright-report','dist','coverage','*.log','originals')
 for relative in ['privacy','legal','splatworks/layoutsplat','splatworks/shared','splatworks/gridsplat/src','splatworks/listsplat/src','vendor','solutions/mediasplat/ffmpeg','assets/brand','assets/privacy','assets/css','assets/js','assets/icons','assets/favicons','assets/backgrounds','assets/coloring-book','assets/smithsonian-animals','assets/scratch-art']:
  shutil.copytree(root/relative,folder/relative,ignore=ignored)
 for relative in ['scripts/build-layoutsplat-suite-data.mjs','scripts/build-layoutsplat-rich.mjs','splatworks/gridsplat/package.json','splatworks/gridsplat/package-lock.json','splatworks/writesplat/package.json','splatworks/writesplat/package-lock.json','assets/brand/SplatWorks_logo.png','assets/brand/splatworks-school-guides.png','data/drawsplat-tools.json','data/privacy-inventory.json','data/privacy-retention.json','data/privacy-providers.json','_headers']+[str(p.relative_to(root)) for p in sorted((root/'data').glob('privacy-network-*.json'))]+[f'docs/{s}.md' for s in ['layoutsplat','layoutsplat-labels','layoutsplat-import-accuracy']]+[f'wiki/{s}.html' for s in ['layoutsplat','layoutsplat-labels','layoutsplat-import-accuracy']]:
  (folder/relative).parent.mkdir(parents=True,exist_ok=True)
  shutil.copy2(root/relative,folder/relative)
 revision=subprocess.check_output(['git','rev-parse','--short','HEAD'],cwd=root,text=True).strip()
 (folder/'LAYOUTSPLAT-README.txt').write_text(f'''LayoutSplat / SplatWorks standalone publication editor\nVersion: {version}\nSource: {revision}\nExtract the entire ZIP and open START-HERE.html for the local launcher.\nFor static hosting, upload all folders unchanged and open /splatworks/layoutsplat/.\nIncludes source and notices, 123 original compositions and 96 whiteboard images, Avery labels/name badges, fonts,\nPublisher/legacy Pages and QuarkXPress 3.1–4.1 import, browser-native DOC and formatted DOCX/ODT text, EPS/AI/PDF artwork, merge, and print exports.\nNative INDD/newer QXP and modern Pages IWA require interchange exports.\nOther SplatWorks apps can be installed alongside this module.\nSee docs/layoutsplat.md and splatworks/layoutsplat/THIRD_PARTY_NOTICES.md.\n''')
 subprocess.run([sys.executable,str(root/'scripts/add-offline-launcher.py'),str(folder),'LayoutSplat','splatworks/layoutsplat/'],check=True)
 target=root/'dist'/f'{name}.zip';target.parent.mkdir(exist_ok=True)
 with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for path in sorted(folder.rglob('*')):
   if path.is_file():z.write(path,path.relative_to(folder.parent))
 print(target)
