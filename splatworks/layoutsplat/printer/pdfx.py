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
    from pypdf import PdfReader
    pdf = PdfReader(path)
    errors = []
    if pdf.is_encrypted: errors.append('Encryption is not allowed.')
    if pdf.metadata.get('/GTS_PDFXVersion') != 'PDF/X-3:2002': errors.append('PDF/X-3 metadata is missing.')
    if str(pdf.metadata.get('/Trapped')) not in ('/False', '/True'): errors.append('Trapping status is missing.')
    root = pdf.trailer['/Root']
    if any(key in root for key in ['/OpenAction', '/AA', '/AcroForm']): errors.append('Interactive actions/forms are present.')
    intents = root.get('/OutputIntents', [])
    if not intents: errors.append('Output intent is missing.')
    else:
        intent = intents[0].get_object()
        stream = intent.get('/DestOutputProfile')
        if str(intent.get('/S')) != '/GTS_PDFX' or not stream: errors.append('Print output intent/profile is missing.')
        elif stream.get_object().get_data() != expected_profile: errors.append('The embedded ICC profile differs from the supplied profile.')
    original = PdfReader(source)
    if len(pdf.pages) != len(original.pages): errors.append('The page count changed.')
    inspected = set()
    def resources(res):
        res = res.get_object()
        for ref in res.get('/Font', {}).values():
            font = ref.get_object()
            descendants = font.get('/DescendantFonts', [font])
            for descendant in descendants:
                descriptor = descendant.get_object().get('/FontDescriptor')
                if font.get('/Subtype') != '/Type3' and (not descriptor or not any(k in descriptor.get_object() for k in ['/FontFile', '/FontFile2', '/FontFile3'])): errors.append('An unembedded font remains.')
        for ref in res.get('/ExtGState', {}).values():
            state = ref.get_object()
            if float(state.get('/ca', 1)) != 1 or float(state.get('/CA', 1)) != 1 or state.get('/SMask', '/None') != '/None': errors.append('Live transparency remains.')
        for ref in res.get('/XObject', {}).values():
            key = (getattr(ref, 'idnum', id(ref)), getattr(ref, 'generation', 0))
            if key in inspected: continue
            inspected.add(key); obj = ref.get_object()
            if obj.get('/SMask'): errors.append('An image has live transparency.')
            if obj.get('/ColorSpace') == '/DeviceRGB': errors.append('An unconverted RGB image remains.')
            if obj.get('/Resources'): resources(obj['/Resources'])
    boxes = []
    for i, page in enumerate(pdf.pages):
        media = [float(v) for v in page.mediabox]; trim = [float(v) for v in page.trimbox]; bleed = [float(v) for v in page.bleedbox]
        if not all(media[j] <= bleed[j] <= trim[j] for j in [0, 1]) or not all(trim[j] <= bleed[j] <= media[j] for j in [2, 3]): errors.append(f'Page {i+1}: page boxes are not nested.')
        if i < len(original.pages) and any(abs(float(a)-float(b)) > .1 for a, b in zip(page.trimbox, original.pages[i].trimbox)): errors.append(f'Page {i+1}: trim box changed.')
        if page.get('/Annots'): errors.append(f'Page {i+1}: annotations remain.')
        resources(page.get('/Resources', {})); boxes.append({'media':media,'trim':trim,'bleed':bleed})
    return {'status': 'passed structural checks' if not errors else 'failed', 'scope':'Independent structural preflight; not exhaustive ISO PDF/X certification. Obtain printer approval.', 'pages':len(pdf.pages),'boxes':boxes,'errors':sorted(set(errors)), 'icc_sha256':hashlib.sha256(expected_profile).hexdigest()}

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
    report = preflight(output, data, source); report['ghostscript_log'] = result.stdout + result.stderr
    output.with_suffix('.preflight.json').write_text(json.dumps(report, indent=2)+'\n')
    print(json.dumps({key:report[key] for key in ['status','scope','pages','errors']}, indent=2))
    if report['errors']: raise SystemExit(1)

if __name__ == '__main__': main()
