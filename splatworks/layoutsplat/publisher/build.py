#!/usr/bin/env python3
"""Build browser-contained libmspub from prepared, pinned upstream sources.
See splatworks/layoutsplat/publisher/BUILD.md. Build artifacts stay in .tmp/.
"""
from pathlib import Path
import os
import subprocess
ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT/'.tmp/layoutsplat-publisher-wasm'
SDK = BASE/'emsdk/upstream/emscripten'
REVENGE = BASE/'librevenge-0.0.5'
MSPUB = BASE/'libmspub-master'
core = ['RVNGBinaryData', 'RVNGMemoryStream', 'RVNGProperty', 'RVNGPropertyList', 'RVNGPropertyListVector', 'RVNGString', 'RVNGStringVector']
streams = ['RVNGStreamImplementation', 'RVNGDirectoryStream', 'RVNGOLEStream', 'RVNGZipStream']
sources = [str(ROOT/'splatworks/layoutsplat/publisher/adapter.cpp')]
sources += [str(REVENGE/'src/lib'/f'{name}.cpp') for name in core+streams]
sources += [str(file) for file in sorted((MSPUB/'src/lib').glob('*.cpp'))]
output = ROOT/'splatworks/layoutsplat/publisher/publisher-decoder.mjs'
env = dict(os.environ, EMCC_CORES='4')
command = [str(SDK/'em++'), '-std=c++17', '-O2', '-DLIBMSPUB_BUILD=1', '-DLIBREVENGE_BUILD=1', '-DLIBREVENGE_STREAM_BUILD=1', '-DBOOST_ERROR_CODE_HEADER_ONLY', '-I'+str(REVENGE/'inc'), '-I'+str(MSPUB/'inc'), *sources, '--no-entry', '-sUSE_ZLIB=1', '-sUSE_ICU=1', '-sUSE_BOOST_HEADERS=1', '-sMODULARIZE=1', '-sEXPORT_ES6=1', '-sEXPORT_NAME=createPublisher', '-sENVIRONMENT=worker', '-sALLOW_MEMORY_GROWTH=1', '-sINITIAL_MEMORY=33554432', '-sMAXIMUM_MEMORY=536870912', '-sDYNAMIC_EXECUTION=0', '-sDISABLE_EXCEPTION_CATCHING=0', '-sEXPORTED_FUNCTIONS=["_parse_pub","_set_pub_encoding","_set_unicode_data","_load_unicode_data","_malloc","_free"]', '-sEXPORTED_RUNTIME_METHODS=["ccall","UTF8ToString","FS"]', '-o', str(output)]
collector = MSPUB/'src/lib/MSPUBCollector.cpp'
text = collector.read_text()
if 'layoutsplat_pub_encoding' not in text:
    text = 'extern \"C\" const char* layoutsplat_pub_encoding();\n' + text
    text = text.replace('const char *MSPUBCollector::getCalculatedEncoding() const\n{', 'const char *MSPUBCollector::getCalculatedEncoding() const\n{\n  if (const char* override = layoutsplat_pub_encoding()) return override;')
    collector.write_text(text)
print('Building libmspub + librevenge + ICU + zlib for the browser…', flush=True)
subprocess.run(command, check=True, cwd=ROOT, env=env)
print('Publisher WebAssembly built:', output, flush=True)
