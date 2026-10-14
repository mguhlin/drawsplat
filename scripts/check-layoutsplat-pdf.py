"""Independently inspect the sample PDF exported by LayoutSplat's browser test."""
import json
import sys
from pathlib import Path
from pypdf import PdfReader

files = [Path(arg) for arg in sys.argv[1:]] or list(Path('test-results').rglob('layoutsplat-letter-proof.pdf'))
assert files, 'Run the LayoutSplat PDF browser test first.'
for path in files:
    reader = PdfReader(path)
    assert len(reader.pages) == 2, 'The publication must print on exactly two pages.'
    text = '\n'.join(page.extract_text() for page in reader.pages)
    assert text.count('A good publication') == 8, 'Every repeated story paragraph must survive linked flow and print.'
    assert 'THE COMMUNITY EDITION' in text and 'The story continues' in text
    assert any('\u0600' <= char <= '\u06ff' for char in text), 'Arabic must remain selectable text.'
    embedded = []
    for page in reader.pages:
        assert abs(float(page.mediabox.width) - 612) < 0.01 and abs(float(page.mediabox.height) - 792) < 0.01
        for font_ref in page['/Resources']['/Font'].values():
            font = font_ref.get_object()
            if font.get('/Subtype') == '/Type3':
                # Chromium embeds variable-font outlines as Type3 glyph streams.
                # Verify the actual embedded glyph programs and Unicode mapping.
                programs = font.get('/CharProcs')
                assert programs is not None and len(programs.get_object()), 'Type3 glyphs must be embedded.'
                assert all(ref.get_object().get_data() for ref in programs.get_object().values()), 'Empty Type3 glyph stream.'
                assert font.get('/ToUnicode') is not None, 'Type3 text needs a Unicode mapping.'
                embedded.append(str(font.get('/Name', 'embedded Type3 outlines')))
                continue
            if '/DescendantFonts' in font:
                font = font['/DescendantFonts'][0].get_object()
            descriptor = font.get('/FontDescriptor')
            assert descriptor is not None, 'Text fonts must have a font descriptor.'
            descriptor = descriptor.get_object()
            assert any(key in descriptor for key in ['/FontFile', '/FontFile2', '/FontFile3']), 'Print fonts must be embedded.'
            embedded.append(str(font['/BaseFont']))
    print(json.dumps({'pdf': str(path), 'pages': 2, 'page_points': [612, 792], 'story_paragraphs': 8, 'selectable_arabic': True, 'embedded_fonts': sorted(set(embedded))}))
