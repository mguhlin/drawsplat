#!/usr/bin/env python3
"""Independently decode the browser's office/GIF export fixtures (Pillow + stdlib).

Optional LibreOffice-rendered PDFs can be supplied for target-application checks.
Generate inputs with tests/layoutsplat-exports.spec.js before running this script.
"""
import argparse
import io
import posixpath
from pathlib import Path
from zipfile import ZipFile, ZIP_STORED
from xml.etree import ElementTree as ET
from PIL import Image

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--results', type=Path, default=Path('test-results'))
parser.add_argument('--pptx-pdf', type=Path)
parser.add_argument('--odp-pdf', type=Path)
args = parser.parse_args()
colors = [(255, 0, 0), (0, 0, 255), (255, 153, 0)]


def color_check(image, expected):
    image.load()  # Decode all pixels, including GIF's LZW stream.
    rgb = image.convert('RGB').getpixel((image.width // 2, image.height // 2))
    assert all(abs(a - b) <= 5 for a, b in zip(rgb, expected)), (rgb, expected)


for kind in ['pptx', 'odp']:
    paths = list(args.results.glob(f'layoutsplat-exports-*/page-sequence.{kind}'))
    assert len(paths) == 1, (kind, paths)
    with ZipFile(paths[0]) as archive:
        assert archive.testzip() is None
        names = archive.namelist()
        for name in names:
            if name.endswith(('.xml', '.rels')):
                root = ET.fromstring(archive.read(name))
                if name.endswith('.rels'):
                    for rel in root:
                        assert rel.get('TargetMode') != 'External', rel.attrib
                        target = posixpath.normpath(posixpath.join(posixpath.dirname(posixpath.dirname(name)), rel.get('Target')))
                        assert target in names, (name, target)
        prefix = 'ppt/media' if kind == 'pptx' else 'Pictures'
        for index, color in enumerate(colors, 1):
            image = Image.open(io.BytesIO(archive.read(f'{prefix}/page{index}.png')))
            assert image.size == (750, 450), image.size
            color_check(image, color)
        if kind == 'odp':
            first = archive.infolist()[0]
            assert first.filename == 'mimetype' and first.compress_type == ZIP_STORED and not first.extra
            assert archive.read(first) == b'application/vnd.oasis.opendocument.presentation'
            root = ET.fromstring(archive.read('content.xml'))
            assert len(root.findall('.//{urn:oasis:names:tc:opendocument:xmlns:drawing:1.0}page')) == 3
        else:
            for part in ['ppt/slideMasters/slideMaster1.xml', 'ppt/slideLayouts/slideLayout1.xml', 'ppt/theme/theme1.xml']:
                assert part in names, part
            root = ET.fromstring(archive.read('ppt/presentation.xml'))
            ns = '{http://schemas.openxmlformats.org/presentationml/2006/main}'
            assert len(root.findall(f'{ns}sldIdLst/{ns}sldId')) == 3
            size = root.find(f'{ns}sldSz')
            assert (int(size.get('cx')), int(size.get('cy'))) == (4572000, 2743200)
    print(f'{kind.upper()}: valid XML, internal relationships, three physical slides and correctly ordered artwork')

paths = list(args.results.glob('layoutsplat-exports-*/page-sequence.gif'))
assert len(paths) == 1, paths
with Image.open(paths[0]) as image:
    assert image.size == (480, 288) and image.n_frames == 3 and image.info['loop'] == 0
    for index, color in enumerate(colors):
        image.seek(index)
        assert image.info['duration'] == 700
        color_check(image, color)
print('GIF: three decoded 480 × 288 frames, correct colors/order, 700 ms timing, infinite loop')

for kind in ['pptx', 'odp']:
    path = getattr(args, f'{kind}_pdf')
    if path:
        from pypdf import PdfReader
        from pypdf.generic import ContentStream
        pdf = PdfReader(path)
        assert len(pdf.pages) == 3
        for page, color in zip(pdf.pages, colors):
            assert abs(float(page.mediabox.width) - 360) < .1 and abs(float(page.mediabox.height) - 216) < .1
            # LibreOffice shares image resources across pages; check the image
            # actually drawn by this page's content stream, not all resources.
            drawn = [operands[0] for operands, operator in ContentStream(page.get_contents(), pdf).operations if operator == b'Do']
            assert len(drawn) == 1, drawn
            color_check(page.images[drawn[0]].image, color)
        print(f'{kind.upper()}: LibreOffice reopened all three slides with exact page dimensions and correct artwork')
