#!/usr/bin/env python3
"""Build only the standalone PDFSplat package from maintained local sources."""
import argparse,hashlib,json,shutil,subprocess,tempfile,zipfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(description=__doc__);p.add_argument('--version',required=True);a=p.parse_args()
if not __import__('re').fullmatch(r'v\d+\.\d+\.\d+(?:-[a-zA-Z0-9.]+)?',a.version):p.error('Use a release version, without a maintenance date')
subprocess.run(['node','scripts/build-pdfsplat.mjs'],cwd=root,check=True)
ignore=shutil.ignore_patterns('node_modules','__pycache__','*.pyc','test-results','playwright-report','.git','.env','.env.*','*.log','dist')
name='pdfsplat-selfhost-'+a.version
with tempfile.TemporaryDirectory(prefix='pdfsplat-package-') as temporary:
 stage=Path(temporary)/name;stage.mkdir()
 def copy(rel):
  src=root/rel;dst=stage/rel;dst.parent.mkdir(parents=True,exist_ok=True)
  if src.is_dir():shutil.copytree(src,dst,ignore=ignore,dirs_exist_ok=True)
  else:shutil.copy2(src,dst)
 for rel in ['solutions/pdfsplat','splatworks/shared','assets/css','assets/js','assets/brand','assets/privacy','assets/icons','assets/favicons','privacy','legal','LICENSE','NOTICE.md','_headers','scripts/build-pdfsplat.mjs'] :copy(rel)
 for filename in ['pdf.min.js','pdf.worker.min.js','jszip.min.js']:copy('vendor/'+filename)
 for filename in ['drawsplat-tools.json','privacy-inventory.json','privacy-retention.json','privacy-providers.json']:copy('data/'+filename)
 for f in (root/'data').glob('privacy-network-*.json'):copy(f.relative_to(root).as_posix())
 for f in (root/'docs').glob('pdfsplat-*.md'):copy(f.relative_to(root).as_posix())
 with zipfile.ZipFile(root/'solutions/CipherSplat/downloads/CipherSplat-offline.zip') as z:
  for item in z.infolist():
   target=stage/'solutions'/item.filename
   if not target.resolve().is_relative_to((stage/'solutions').resolve()):raise SystemExit('Unsafe local companion archive path')
  z.extractall(stage/'solutions')
 (stage/'PDFSPLAT-SELFHOST-README.txt').write_text('PDFSplat standalone '+a.version+'\n\nOpen index.html or Open-PDFSplat.html after extracting the entire ZIP.\nFillable forms and standard PDF passwords work locally in Chrome/Firefox, including direct-file use. OCR needs the included local HTTP launcher (Python 3) or HTTPS. Keep every included folder.\n\nSee docs/pdfsplat-fillable-forms.md for limits, source comparison, security-engine notices and platform evidence.\n')
 subprocess.run(['python3',str(root/'scripts/add-offline-launcher.py'),str(stage),'PDFSplat','solutions/pdfsplat/'],check=True)
 output=root/'dist'/(name+'.zip');output.parent.mkdir(exist_ok=True)
 with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for f in sorted(stage.rglob('*')):
   if f.is_file():
    if f.is_symlink():raise SystemExit('Public symlinks are not supported')
    z.write(f,f.relative_to(stage.parent))
 digest=hashlib.file_digest(output.open('rb'),'sha256').hexdigest();(output.with_suffix('.zip.sha256')).write_text(digest+'  '+output.name+'\n')
 print(json.dumps({'package':str(output),'sha256':digest,'zip_bytes':output.stat().st_size,'unpacked_bytes':sum(f.stat().st_size for f in stage.rglob('*') if f.is_file())}))
