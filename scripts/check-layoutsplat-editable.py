#!/usr/bin/env python3
"""Check native office objects, then optionally edit/reopen them in LibreOffice.

Run layoutsplat-editable-exports.spec.js first. --office-dir enables actual
LibreOffice PDF rendering and cross-format round trips in the given directory.
"""
import argparse
import json
import re
import subprocess
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--results', type=Path, default=Path('test-results'))
parser.add_argument('--office-dir', type=Path)
parser.add_argument('--odf-schema', type=Path, help='Optional official ODF 1.3 Relax NG schema for lxml validation')
args = parser.parse_args()
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main', 'p': 'http://schemas.openxmlformats.org/presentationml/2006/main', 'd': 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0', 't': 'urn:oasis:names:tc:opendocument:xmlns:text:1.0', 's': 'urn:oasis:names:tc:opendocument:xmlns:style:1.0', 'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'}


def odf_text(node):
    local = node.tag.split('}')[-1]
    if local == 's':
        return ' ' * int(node.get('{%s}c' % NS['t'], 1))
    if local == 'tab':
        return '\t'
    if local == 'line-break':
        return '\n'
    return (node.text or '') + ''.join(odf_text(child) + (child.tail or '') for child in node)


def normal(text):
    return re.sub(r'\s+', ' ', text).strip()


for kind in ['pptx', 'odp']:
    paths = list(args.results.glob(f'layoutsplat-editable-*/editable.{kind}'))
    assert len(paths) == 1, (kind, paths)
    source = paths[0]
    native = json.loads(source.with_name('editable-source.json').read_text())
    linked = next(story for story in native['stories'].values() if story['text'].startswith('Linked story'))
    with ZipFile(source) as archive:
        assert archive.testzip() is None
        contents = {name: archive.read(name) for name in archive.namelist() if not name.endswith('/')}
        for name, content in contents.items():
            if name.endswith(('.xml', '.rels')):
                ET.fromstring(content)
        if kind == 'odp' and args.odf_schema:
            from lxml import etree
            schema = etree.RelaxNG(etree.parse(str(args.odf_schema)))
            for name in ['content.xml', 'styles.xml']:
                schema.assertValid(etree.fromstring(contents[name]))
            print('ODP: content and styles validate against the official ODF 1.3 schema')
        if kind == 'pptx':
            parts = [(name, ET.fromstring(contents[name])) for name in contents if re.match(r'ppt/slides/slide\d+\.xml$', name)]
            assert len(parts) == 2
            paragraphs = [p for _, root in parts for p in root.findall('.//a:p', NS)]
            text = '\n'.join(''.join(p.itertext()) for p in paragraphs)
            linked_text = []
            for _, root in parts:
                for shape in root.findall('.//p:sp', NS):
                    name = shape.find('p:nvSpPr/p:cNvPr', NS).get('name')
                    if any(frame in name for frame in linked['frames']):
                        linked_text.extend(''.join(p.itertext()) for p in shape.findall('.//a:p', NS))
            assert sum(len(root.findall('.//a:tbl', NS)) for _, root in parts) == 1
            assert sum(len(root.findall('.//p:pic', NS)) for _, root in parts) == 2
            rich = next(r for _, root in parts for r in root.findall('.//a:r', NS) if r.find('a:t', NS).text == 'Editable')
            properties = rich.find('a:rPr', NS)
            assert [properties.get(k) for k in ['b', 'i', 'u', 'sz']] == ['1', '1', 'sng', '2100']
            native_link = rich.find('a:rPr/a:hlinkClick', NS)
            assert native_link is not None
            first = parts[0][1]
            for run in first.findall('.//a:t', NS):
                if run.text == 'Editable':
                    run.text = 'Revised'
                if run.text == '98':
                    run.text = '99'
            ellipse = next(s for s in first.findall('.//p:sp', NS) if s.find('p:spPr/a:prstGeom', NS) is not None and s.find('p:spPr/a:prstGeom', NS).get('prst') == 'ellipse')
            ellipse.find('p:spPr/a:solidFill/a:srgbClr', NS).set('val', '3366FF')
            contents[parts[0][0]] = ET.tostring(first, encoding='utf-8', xml_declaration=True)
        else:
            root = ET.fromstring(contents['content.xml'])
            pages = root.findall('.//d:page', NS)
            assert len(pages) == 2
            text = '\n'.join(odf_text(p) for p in root.findall('.//t:p', NS))
            linked_text = []
            for frame in root.findall('.//d:frame', NS):
                name = frame.get('{%s}name' % NS['d'], '')
                if any(frame_id in name for frame_id in linked['frames']):
                    linked_text.extend(odf_text(p) for p in frame.findall('.//t:p', NS))
            assert len(root.findall('.//table:table', NS)) == 1
            assert len(root.findall('.//d:image', NS)) == 3
            assert len(root.findall('.//d:ellipse', NS)) == 1 and len(root.findall('.//d:path', NS)) == 2
            rich = next(span for span in root.findall('.//t:span', NS) if odf_text(span) == 'Editable')
            style_name = rich.get('{%s}style-name' % NS['t'])
            style = next(style for style in root.findall('.//s:style', NS) if style.get('{%s}name' % NS['s']) == style_name)
            assert style.find('s:text-properties', NS).get('{urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0}font-weight') == 'bold'
            for el in root.iter():
                if el.text == 'Editable':
                    el.text = 'Revised'
                if el.text == '98':
                    el.text = '99'
            ellipse = root.find('.//d:ellipse', NS)
            name = ellipse.get('{%s}style-name' % NS['d'])
            style = next(style for style in root.findall('.//s:style', NS) if style.get('{%s}name' % NS['s']) == name)
            style.find('s:graphic-properties', NS).set('{%s}fill-color' % NS['d'], '#3366ff')
            contents['content.xml'] = ET.tostring(root, encoding='utf-8', xml_declaration=True)
        assert normal(' '.join(linked_text)) == normal(linked['text']), (kind, linked_text)
        assert 'Editable rich text' in normal(text) and 'Café & quotes' in normal(text)
        assert 'Ada & Co' in text and '98' in text and text.count('MASTER ELEMENT') == 2
        report = contents['LayoutSplat-conversion.txt'].decode()
        assert 'decorative border' in report
        if kind == 'odp':
            assert 'gradient effect' in report
        print(f'{kind.upper()}: editable rich text, styles, table cells, original picture, vector shapes, masters and complete linked fragments verified')

    if args.office_dir:
        from pypdf import PdfReader
        work = (args.office_dir / kind).resolve()
        work.mkdir(parents=True, exist_ok=True)
        edited = work / f'edited.{kind}'
        with ZipFile(edited, 'w') as archive:
            # Keep mimetype first and uncompressed in the edited ODP too.
            for name, data in contents.items():
                archive.writestr(name, data)
        profile = (work / 'profile').as_uri()
        def office(*arguments):
            subprocess.run(['libreoffice', f'-env:UserInstallation={profile}', '--headless', *arguments], check=True, timeout=60, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        office('--convert-to', 'pdf', '--outdir', str(work), str(source.resolve()), str(edited))
        for filename, word in [('editable.pdf', 'Editable'), ('edited.pdf', 'Revised')]:
            pdf = PdfReader(work / filename)
            assert len(pdf.pages) == 2
            body = '\n'.join(page.extract_text() for page in pdf.pages)
            assert word in body and ('99' if word == 'Revised' else '98') in body, body
            assert body.count('MASTER ELEMENT') == 2
            for page in pdf.pages:
                assert abs(float(page.mediabox.width) - 720) < .1 and abs(float(page.mediabox.height) - 540) < .1
        target = 'odp' if kind == 'pptx' else 'pptx'
        roundtrip = work / 'roundtrip'; roundtrip.mkdir(exist_ok=True)
        office('--convert-to', target, '--outdir', str(roundtrip), str(source.resolve()))
        with ZipFile(roundtrip / f'editable.{target}') as archive:
            if target == 'odp':
                root = ET.fromstring(archive.read('content.xml'))
                assert len(root.findall('.//table:table', NS)) == 1
                assert 'Editable' in ''.join(root.itertext())
                assert len(root.findall('.//d:custom-shape', NS)) + len(root.findall('.//d:path', NS)) >= 3
            else:
                roots = [ET.fromstring(archive.read(n)) for n in archive.namelist() if re.match(r'ppt/slides/slide\d+\.xml$', n)]
                assert sum(len(root.findall('.//a:tbl', NS)) for root in roots) == 1
                assert 'Editable' in ''.join(''.join(root.itertext()) for root in roots)
                assert sum(len(root.findall('.//p:sp', NS)) for root in roots) > 4
        print(f'{kind.upper()}: LibreOffice rendered original and edited text/cell values, and preserved native objects in {target.upper()} round trip')
