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
# Some Publisher gradients carry an empty complex array but valid endpoint colors.
parser = MSPUB/'src/lib/MSPUBParser.cpp'
parserText = parser.read_text()
parserText = parserText.replace('if (ptr_fillGrad)\n    {', 'if (ptr_fillGrad && foptValues[FIELDID_FILL_SHADE_COMPLEX].size() > 6)\n    {')
parser.write_text(parserText)
# Preserve OfficeArt crop fractions (MS-ODRAW properties 0x0100..0x0103).
shapeInfo = MSPUB/'src/lib/ShapeInfo.h'
shapeText = shapeInfo.read_text()
if 'm_pictureCrop' not in shapeText:
    shapeText = shapeText.replace('  boost::optional<unsigned> m_imgIndex;', '  boost::optional<unsigned> m_imgIndex;\n  std::vector<double> m_pictureCrop;')
    shapeInfo.write_text(shapeText)
collectorHeader = MSPUB/'src/lib/MSPUBCollector.h'
headerText = collectorHeader.read_text()
if 'setShapePictureCrop' not in headerText:
    headerText = headerText.replace('  void setShapeImgIndex(', '  void setShapePictureCrop(unsigned seqNum, const std::vector<double> &crop);\n  void setShapeImgIndex(')
    collectorHeader.write_text(headerText)
collectorText = collector.read_text()
if 'MSPUBCollector::setShapePictureCrop' not in collectorText:
    collectorText = collectorText.replace('void MSPUBCollector::setShapeImgIndex(', 'void MSPUBCollector::setShapePictureCrop(unsigned seqNum, const std::vector<double> &crop)\n{\n  m_shapeInfosBySeqNum[seqNum].m_pictureCrop = crop;\n}\n\nvoid MSPUBCollector::setShapeImgIndex(')
    collectorText = collectorText.replace('  bool hasStroke = false;', '  if (info.m_pictureCrop.size() == 4)\n  {\n    const char *keys[] = {"layoutsplat:crop-top", "layoutsplat:crop-bottom", "layoutsplat:crop-left", "layoutsplat:crop-right"};\n    for (int i=0; i<4; ++i) graphicsProps.insert(keys[i], info.m_pictureCrop[i], librevenge::RVNG_GENERIC);\n  }\n  bool hasStroke = false;')
    collector.write_text(collectorText)
parserText = parser.read_text()
if 'setShapePictureCrop' not in parserText:
    parserText = parserText.replace('          unsigned *pxId = getIfExists', '          std::vector<double> crop;\n          for (unsigned short field=0x0100; field<=0x0103; ++field)\n          {\n            const unsigned *fraction = getIfExists_const(foptValues.m_scalarValues, field);\n            crop.push_back(fraction ? static_cast<int>(*fraction) / 65536.0 : 0.0);\n          }\n          m_collector->setShapePictureCrop(*shapeSeqNum, crop);\n          unsigned *pxId = getIfExists')
    parser.write_text(parserText)
# Retain reusable masters and source text identity instead of painting master copies.
collectorText = collector.read_text()
if 'layoutsplat:master-id' not in collectorText:
    start = collectorText.index('void MSPUBCollector::writePage(unsigned pageSeqNum) const')
    end = collectorText.index('void MSPUBCollector::writePageShapes', start)
    collectorText = collectorText[:start] + r'''void MSPUBCollector::writePage(unsigned pageSeqNum) const
{
  librevenge::RVNGPropertyList props;
  if (m_widthSet) props.insert("svg:width", m_width);
  if (m_heightSet) props.insert("svg:height", m_height);
  boost::optional<unsigned> master = getMasterPageSeqNum(pageSeqNum);
  if (master) props.insert("layoutsplat:master-id", static_cast<int>(*master));
  m_painter->startPage(props);
  writePageBackground(pageSeqNum);
  writePageShapes(pageSeqNum);
  m_painter->endPage();
}

''' + collectorText[end:]
    collectorText = collectorText.replace('  if (m_pageSeqNumsOrdered.empty())', r'''  for (unsigned master : m_masterPages)
  {
    if (!hasPage(master)) continue;
    librevenge::RVNGPropertyList props;
    props.insert("layoutsplat:master-id", static_cast<int>(master));
    props.insert("svg:width", m_width);
    props.insert("svg:height", m_height);
    m_painter->startMasterPage(props);
    writePageBackground(master);
    writePageShapes(master);
    m_painter->endMasterPage();
  }
  if (m_pageSeqNumsOrdered.empty())''', 1)
    collectorText = collectorText.replace('      m_painter->startTextObject(props);', r'''      if (info.m_textId) props.insert("layoutsplat:text-id", static_cast<int>(*info.m_textId));
      m_painter->startTextObject(props);''')
    collector.write_text(collectorText)
print('Building libmspub + librevenge + ICU + zlib for the browser…', flush=True)
subprocess.run(command, check=True, cwd=ROOT, env=env)
print('Publisher WebAssembly built:', output, flush=True)
