#!/usr/bin/env python3
"""Build bundled libqxp/librevenge with Emscripten 4.0.22: build.py /path/to/emsdk."""
from pathlib import Path
import hashlib,json,os,subprocess,sys,tarfile,tempfile
HERE=Path(__file__).resolve().parent
sdk=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else HERE.parents[2]/'.tmp/layoutsplat-publisher-wasm/emsdk'
compiler=sdk/'upstream/emscripten/em++';env={**os.environ,'EM_CONFIG':str(sdk/'.emscripten'),'EMCC_CORES':'4'}
version=subprocess.check_output([str(compiler),'--version'],env=env,text=True)
if '4.0.22' not in version:raise SystemExit('Use Emscripten 4.0.22 for the pinned build.')
manifest=json.loads((HERE/'SHA256.json').read_text())
for name in ['source/libqxp-0.0.3.tar.xz','source/librevenge-0.0.5.tar.xz']:
 if hashlib.sha256((HERE/name).read_bytes()).hexdigest()!=manifest[name]:raise SystemExit('Source hash mismatch: '+name)
staging=HERE.parents[2]/'.tmp';staging.mkdir(exist_ok=True)
with tempfile.TemporaryDirectory(prefix='quark-build-',dir=staging) as temp:
 folder=Path(temp)
 for name in ['libqxp-0.0.3.tar.xz','librevenge-0.0.5.tar.xz']:
  with tarfile.open(HERE/'source'/name) as archive:archive.extractall(folder,filter='data')
 q=folder/'libqxp-0.0.3';rv=folder/'librevenge-0.0.5'
 core=['RVNGBinaryData','RVNGMemoryStream','RVNGProperty','RVNGPropertyList','RVNGPropertyListVector','RVNGString','RVNGStringVector','RVNGStreamImplementation','RVNGDirectoryStream','RVNGOLEStream','RVNGZipStream']
 sources=[str(HERE/'adapter.cpp')]+[str(rv/'src/lib'/f'{n}.cpp') for n in core]+[str(f) for f in sorted((q/'src/lib').glob('*.cpp'))]
 cmd=[str(compiler),'-std=c++17','-O2','-DLIBQXP_BUILD=1','-DLIBREVENGE_BUILD=1','-DLIBREVENGE_STREAM_BUILD=1','-DBOOST_ERROR_CODE_HEADER_ONLY','-ffile-prefix-map='+str(folder)+'=source','-ffile-prefix-map='+str(HERE)+'=quark','-ffile-prefix-map='+str(sdk)+'=emsdk','-I'+str(rv/'inc'),'-I'+str(q/'inc'),*sources,'--no-entry','-sUSE_ZLIB=1','-sUSE_ICU=1','-sUSE_BOOST_HEADERS=1','-sMODULARIZE=1','-sEXPORT_ES6=1','-sEXPORT_NAME=createQuark','-sENVIRONMENT=worker','-sALLOW_MEMORY_GROWTH=1','-sINITIAL_MEMORY=33554432','-sMAXIMUM_MEMORY=536870912','-sDYNAMIC_EXECUTION=0','-sDISABLE_EXCEPTION_CATCHING=0','-sEXPORTED_FUNCTIONS=["_parse_qxp","_load_unicode_data","_malloc","_free"]','-sEXPORTED_RUNTIME_METHODS=["ccall","UTF8ToString","FS"]','-o',str(HERE/'quark-decoder.mjs')]
 subprocess.run(cmd,env=env,check=True)
 print('Built QuarkXPress decoder; review browser checks before refreshing SHA256.json.')
