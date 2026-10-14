#!/usr/bin/env python3
"""Prepare PDF/X-3 using Ghostscript and independently inspect with pypdf.
Requires Ghostscript and pypdf. The report is structural preflight, not ISO certification.
Usage: python pdfx.py proof.pdf press.pdf --icc printer.icc --condition "Printer stock"
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

def ps_string(value):
    return '(' + str(value).replace('\\', '\\\\').replace('(', '\\(').replace(')', '\\)') + ')'

def preflight(path, expected_profile, source):
    import math
    import pypdf
    from pypdf import PdfReader
    from pypdf.generic import ContentStream
    errors, boxes = [], []
    report = {'status': 'failed', 'scope': 'Independent structural preflight; not exhaustive ISO PDF/X certification. Obtain printer approval.',
              'pages': 0, 'boxes': boxes, 'errors': errors, 'icc_sha256': hashlib.sha256(expected_profile).hexdigest(),
              'source_sha256': hashlib.sha256(Path(source).read_bytes()).hexdigest(),
              'output_sha256': hashlib.sha256(Path(path).read_bytes()).hexdigest(), 'pypdf_version': pypdf.__version__,
              'fonts_inspected': 0, 'content_streams_inspected': 0}
    try:
        pdf, original = PdfReader(path), PdfReader(source)
        if pdf.is_encrypted or original.is_encrypted:
            errors.append('Encrypted input cannot be inspected. Encryption is not allowed in PDF/X.'); return report
        metadata = pdf.metadata or {}
        if metadata.get('/GTS_PDFXVersion') != 'PDF/X-3:2002': errors.append('PDF/X-3 metadata is missing.')
        if str(metadata.get('/Trapped')) not in ('/False', '/True'): errors.append('Trapping status is missing.')
        root = pdf.trailer['/Root']
        if any(key in root for key in ['/OpenAction', '/AA', '/AcroForm']): errors.append('Interactive actions/forms are present.')
        names = root.get('/Names', {})
        if any(key in names for key in ['/JavaScript', '/EmbeddedFiles']): errors.append('Executable or attached content is present.')
        intents = root.get('/OutputIntents', [])
        if not intents: errors.append('Output intent is missing.')
        else:
            intent = intents[0].get_object(); stream = intent.get('/DestOutputProfile')
            if str(intent.get('/S')) != '/GTS_PDFX' or not stream: errors.append('Print output intent/profile is missing.')
            elif stream.get_object().get_data() != expected_profile or stream.get_object().get('/N') != 4:
                errors.append('The embedded CMYK ICC profile differs from the supplied profile.')
        report['pages'] = len(pdf.pages)
        if not pdf.pages: errors.append('The document has no pages.')
        if len(pdf.pages) != len(original.pages): errors.append('The page count changed.')
        inspected, fonts, streams = set(), set(), set()
        def identity(obj):
            ref = getattr(obj, 'indirect_reference', None) or obj
            return (getattr(ref, 'idnum', id(obj)), getattr(ref, 'generation', 0))
        def unmanaged_rgb(space, res, seen=None):
            space = space.get_object() if hasattr(space, 'get_object') else space
            seen = set() if seen is None else seen
            if isinstance(space, str):
                if space == '/DeviceRGB':
                    if space in seen: return True
                    default = res.get('/ColorSpace', {}).get('/DefaultRGB')
                    return not default or unmanaged_rgb(default, res, seen | {'/DeviceRGB'})
                if space in seen: return True
                named = res.get('/ColorSpace', {}).get(space)
                return unmanaged_rgb(named, res, seen | {space}) if named else False
            if isinstance(space, list) and space:
                if space[0] == '/Indexed': return unmanaged_rgb(space[1], res, seen)
                if space[0] == '/Separation': return unmanaged_rgb(space[2], res, seen)
                if space[0] == '/DeviceN': return unmanaged_rgb(space[2], res, seen)
            return False  # ICCBased and CalRGB are characterized RGB allowed by PDF/X-3.
        def content(stream, res):
            if stream is None: return
            key = (identity(stream), identity(res))
            if key in streams: return
            streams.add(key); report['content_streams_inspected'] += 1
            for operands, operator in ContentStream(stream, pdf).operations:
                if operator in (b'rg', b'RG') and unmanaged_rgb('/DeviceRGB', res): errors.append('Uncharacterized RGB vector/text color remains.')
                if operator in (b'cs', b'CS') and operands and unmanaged_rgb(operands[0], res): errors.append('An uncharacterized RGB content color space remains.')
        def resources(res):
            res = res.get_object() if hasattr(res, 'get_object') else res
            key = identity(res)
            if key in inspected: return
            inspected.add(key)
            for ref in res.get('/Font', {}).values():
                font = ref.get_object(); key = identity(font)
                if key in fonts: continue
                fonts.add(key); report['fonts_inspected'] += 1
                if font.get('/Subtype') == '/Type3':
                    programs = font.get('/CharProcs', {})
                    if not programs or not all(item.get_object().get_data() for item in programs.values()): errors.append('A Type3 font has missing or empty embedded glyph programs.')
                    mapping = font.get('/ToUnicode')
                    if mapping is None or not mapping.get_object().get_data(): errors.append('A Type3 font lacks selectable-text Unicode mappings.')
                    resources(font.get('/Resources', {}))
                    for glyph in programs.values(): content(glyph.get_object(), font.get('/Resources', {}))
                else:
                    for descendant in font.get('/DescendantFonts', [font]):
                        descriptor = descendant.get_object().get('/FontDescriptor')
                        if not descriptor or not any(k in descriptor.get_object() and descriptor.get_object()[k].get_data() for k in ['/FontFile', '/FontFile2', '/FontFile3']): errors.append('An unembedded font remains.')
            for ref in res.get('/ExtGState', {}).values():
                state = ref.get_object()
                if float(state.get('/ca', 1)) != 1 or float(state.get('/CA', 1)) != 1 or state.get('/SMask', '/None') != '/None': errors.append('Live transparency remains.')
            for ref in res.get('/Shading', {}).values():
                if unmanaged_rgb(ref.get_object().get('/ColorSpace'), res): errors.append('An uncharacterized RGB shading remains.')
            for ref in res.get('/Pattern', {}).values():
                pattern = ref.get_object(); key = identity(pattern)
                if key in inspected: continue
                inspected.add(key)
                shading = pattern.get('/Shading')
                if shading and unmanaged_rgb(shading.get_object().get('/ColorSpace'), res): errors.append('An uncharacterized RGB shading remains.')
                child = pattern.get('/Resources', res)
                if pattern.get('/Resources'): resources(child)
                if pattern.get('/PatternType') == 1: content(pattern, child)
            for ref in res.get('/XObject', {}).values():
                obj = ref.get_object(); key = identity(obj)
                if key in inspected: continue
                inspected.add(key)
                if obj.get('/SMask') and obj.get('/SMask') != '/None': errors.append('An image has live transparency.')
                if obj.get('/Group', {}).get('/S') == '/Transparency': errors.append('A live transparency group remains.')
                if unmanaged_rgb(obj.get('/ColorSpace'), res): errors.append('An uncharacterized RGB image remains.')
                child = obj.get('/Resources', res)
                if obj.get('/Resources'): resources(child)
                if obj.get('/Subtype') == '/Form': content(obj, child)
        for i, page in enumerate(pdf.pages):
            media = [float(v) for v in page.mediabox]; trim = [float(v) for v in page.trimbox]; bleed = [float(v) for v in page.bleedbox]
            if any(not all(math.isfinite(v) for v in box) or box[2] <= box[0] or box[3] <= box[1] for box in [media, trim, bleed]): errors.append(f'Page {i+1}: invalid page box geometry.')
            if not all(media[j] <= bleed[j] <= trim[j] for j in [0, 1]) or not all(trim[j] <= bleed[j] <= media[j] for j in [2, 3]): errors.append(f'Page {i+1}: page boxes are not nested.')
            if i < len(original.pages) and any(abs(float(a)-float(b)) > .1 for a, b in zip(page.trimbox, original.pages[i].trimbox)): errors.append(f'Page {i+1}: trim box changed.')
            if page.get('/Annots') or page.get('/AA'): errors.append(f'Page {i+1}: annotations/actions remain.')
            if page.get('/Group', {}).get('/S') == '/Transparency': errors.append('A live transparency group remains.')
            res = page.get('/Resources', {}); resources(res); content(page.get_contents(), res)
            boxes.append({'media':media, 'trim':trim, 'bleed':bleed})
    except Exception as error:
        errors.append(f'PDF inspection could not finish: {type(error).__name__}: {error}')
    report['errors'] = sorted(set(errors)); report['status'] = 'passed structural checks' if not errors else 'failed'
    return report

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path); parser.add_argument('output', type=Path)
    parser.add_argument('--icc', required=True, type=Path); parser.add_argument('--condition', default='Printer-supplied CMYK profile')
    args = parser.parse_args(); source = args.source.resolve(); output = args.output.resolve(); profile = args.icc.resolve()
    if output.exists() or output == source: parser.error('Choose a new output filename; existing files are never overwritten.')
    executable = shutil.which('gs') or shutil.which('gswin64c') or shutil.which('gswin32c')
    if not executable: parser.error('Install Ghostscript first.')
    data = profile.read_bytes()
    if len(data) < 128 or data[36:40] != b'acsp' or data[16:20] != b'CMYK': parser.error('Choose a printer-provided CMYK ICC profile.')
    definitions = f'''%!PS
[ /GTS_PDFXVersion (PDF/X-3:2002) /Trapped /False /DOCINFO pdfmark
[/_objdef {{icc}} /type /stream /OBJ pdfmark
[{{icc}} << /N 4 >> /PUT pdfmark
[{{icc}} {ps_string(profile)} (r) file /PUT pdfmark
[/_objdef {{intent}} /type /dict /OBJ pdfmark
[{{intent}} << /Type /OutputIntent /S /GTS_PDFX /OutputConditionIdentifier {ps_string(args.condition)} /Info {ps_string(args.condition)} /DestOutputProfile {{icc}} >> /PUT pdfmark
[{{Catalog}} << /OutputIntents [{{intent}}] >> /PUT pdfmark
'''
    with tempfile.TemporaryDirectory(prefix='layoutsplat-print-') as folder:
        prefix = Path(folder)/'pdfx.ps'; prefix.write_text(definitions)
        command = [executable, '-dSAFER', '--permit-file-read='+str(profile), '-dPDFX=3', '-dPDFACompatibilityPolicy=2', '-dBATCH', '-dNOPAUSE', '-sDEVICE=pdfwrite', '-sColorConversionStrategy=CMYK', '-sOutputICCProfile='+str(profile), '-dEmbedAllFonts=true', '-dAutoRotatePages=/None', '-sOutputFile='+str(output), str(prefix), str(source)]
        result = subprocess.run(command, capture_output=True, text=True)
        if result.returncode: raise SystemExit(result.stderr or result.stdout)
    report = preflight(output, data, source); report['ghostscript_log'] = result.stdout + result.stderr; report['ghostscript_version'] = subprocess.check_output([executable, '--version'], text=True).strip()
    output.with_suffix('.preflight.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({key:report[key] for key in ['status','scope','pages','errors']}, indent=2))
    if report['errors']: raise SystemExit(1)

if __name__ == '__main__': main()
