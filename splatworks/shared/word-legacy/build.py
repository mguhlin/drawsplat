#!/usr/bin/env python3
"""Rebuild the browser decoder with Emscripten 4.0.22. Pass the emsdk directory."""
from pathlib import Path
import hashlib, json, os, re, subprocess, sys, tarfile, tempfile
root=Path(__file__).resolve().parent
sdk=Path(sys.argv[1]).resolve()
emcc=sdk/'upstream/emscripten/emcc'
assert '4.0.22' in subprocess.check_output([str(emcc),'--version'],text=True),'Use Emscripten 4.0.22'
manifest=json.loads((root/'SHA256.json').read_text())
for name in ['antiword-0.37-source.tar.gz','antiword-0.37-17-debian.tar.xz']:
 assert hashlib.sha256((root/name).read_bytes()).hexdigest()==manifest[name]
with tempfile.TemporaryDirectory(prefix='splatworks-word-build-') as folder:
 stage=Path(folder)
 with tarfile.open(root/'antiword-0.37-source.tar.gz') as source:source.extractall(stage,filter='data')
 tree=stage/'antiword-0.37'
 with tarfile.open(root/'antiword-0.37-17-debian.tar.xz') as source:source.extractall(tree,filter='data')
 for name in (tree/'debian/patches/series').read_text().splitlines():
  if name and not name.startswith('#'):subprocess.run(['patch','-p1','-i',str(tree/'debian/patches'/name)],cwd=tree,check=True)
 subprocess.run(['patch','-p1','-i',str(root/'browser-formatting.patch')],cwd=tree,check=True)
 objs=re.search(r'OBJS\s*=([\s\S]+?)\n\nPROGS',(tree/'Makefile.Linux').read_text())[1].replace('\\','').split()
 sources=[str(tree/name.replace('.o','.c')) for name in objs]
 env=os.environ.copy();env['EM_CONFIG']=str(sdk/'.emscripten')
 command=[str(emcc),'-O2','-DNDEBUG',*sources,'-o',str(root/'antiword-decoder.mjs'),'-sMODULARIZE=1','-sEXPORT_ES6=1','-sEXPORT_NAME=createAntiword','-sENVIRONMENT=worker','-sINVOKE_RUN=0','-sEXIT_RUNTIME=0','-sALLOW_MEMORY_GROWTH=1','-sMAXIMUM_MEMORY=268435456','-sEXPORTED_RUNTIME_METHODS=["FS","callMain","ENV"]','--embed-file',str(tree/'Resources')+'@/resources']
 subprocess.run(command,cwd=tree,env=env,check=True)
print('Built decoder; refresh SHA256.json after checking changed outputs.')
