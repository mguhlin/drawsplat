"""Inspect actual 100-page browser output, including embedded font programs."""
import json
import sys
from pathlib import Path
from pypdf import PdfReader
files=[Path(arg) for arg in sys.argv[1:]] or list(Path('test-results').rglob('layoutsplat-100-page-proof.pdf'))
assert files,'Run the 100-page browser proof first.'
for path in files:
    reader=PdfReader(path); assert len(reader.pages)==100,'Page count changed.'
    inspected=set()
    for i,page in enumerate(reader.pages,1):
        assert abs(float(page.mediabox.width)-612)<.01 and abs(float(page.mediabox.height)-792)<.01,'Page geometry changed.'
        text=page.extract_text(); marker=f'LAYOUTPAGE{i:03}'
        assert text.count(marker)==1 and text.count('LAYOUTPAGE')==1,f'Page {i}: duplicate/missing linked fragment.'
        assert 'Complete linked-story print text.' in text,f'Page {i}: incomplete sentence.'
        assert text.count(f'BODYCOPY{i:03}')==8 and text.count('BODYCOPY')==8,f'Page {i}: missing/duplicated body paragraphs.'
        for ref in page['/Resources']['/Font'].values():
            if ref.idnum in inspected: continue
            inspected.add(ref.idnum);font=ref.get_object()
            if font.get('/Subtype')=='/Type3':
                glyphs=font.get('/CharProcs');assert glyphs and all(g.get_object().get_data() for g in glyphs.values())
                assert font.get('/ToUnicode'),'Missing selectable text mapping.'
            else:
                for descendant in font.get('/DescendantFonts',[font]):
                    descriptor=descendant.get_object().get('/FontDescriptor');assert descriptor
                    assert any(descriptor.get_object().get(k) and descriptor.get_object()[k].get_data() for k in ['/FontFile','/FontFile2','/FontFile3']),'Unembedded font.'
    print(json.dumps({'pdf':str(path),'pages':100,'linked_fragments':100,'body_paragraphs':800,'letter_points':[612,792],'embedded_fonts':len(inspected)}))
