"""Deliberately corrupt print features, checked independently of Ghostscript."""
import importlib.util
from pathlib import Path
import tempfile
import unittest
from pypdf import PdfWriter
from pypdf.generic import (ArrayObject, BooleanObject, DecodedStreamObject,
    DictionaryObject, FloatObject, NameObject, NumberObject, TextStringObject)
spec = importlib.util.spec_from_file_location('pdfx', Path(__file__).resolve().parents[1]/'splatworks/layoutsplat/printer/pdfx.py')
pdfx = importlib.util.module_from_spec(spec); spec.loader.exec_module(pdfx)
def dictionary(**kwargs): return DictionaryObject({NameObject('/'+k):v for k,v in kwargs.items()})
def stream(data):
    obj = DecodedStreamObject(); obj.set_data(data); return obj
class PrintPreflight(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory(); self.addCleanup(self.folder.cleanup)
        self.source = Path(self.folder.name)/'source.pdf'; self.output = Path(self.folder.name)/'press.pdf'
        w=PdfWriter(); w.add_blank_page(612,792); w.write(self.source)
        self.writer=PdfWriter(); self.page=self.writer.add_blank_page(612,792)
        self.writer.add_metadata({'/GTS_PDFXVersion':'PDF/X-3:2002','/Trapped':'/False'})
        self.profile=b'fixture ICC'; icc=stream(self.profile); icc[NameObject('/N')]=NumberObject(4)
        self.writer._root_object[NameObject('/OutputIntents')]=ArrayObject([dictionary(S=NameObject('/GTS_PDFX'),DestOutputProfile=self.writer._add_object(icc))])
    def check(self):
        self.writer.write(self.output); return pdfx.preflight(self.output,self.profile,self.source)
    def test_clean_structure_has_reproducible_evidence(self):
        report=self.check(); self.assertEqual(report['errors'],[]); self.assertEqual(report['pages'],1)
        self.assertEqual(len(report['output_sha256']),64); self.assertIn('pypdf_version',report)
    def test_missing_font_is_rejected(self):
        self.page[NameObject('/Resources')]=dictionary(Font=dictionary(F1=dictionary(Subtype=NameObject('/Type1'),BaseFont=NameObject('/Helvetica'))))
        self.assertIn('An unembedded font remains.',self.check()['errors'])
    def test_type3_missing_glyph_and_unicode_are_rejected(self):
        self.page[NameObject('/Resources')]=dictionary(Font=dictionary(F1=dictionary(Subtype=NameObject('/Type3'),CharProcs=dictionary())))
        errors=self.check()['errors']; self.assertTrue(any('glyph' in e for e in errors)); self.assertTrue(any('Unicode' in e for e in errors))
    def test_transparency_and_actions_are_rejected(self):
        self.page[NameObject('/Resources')]=dictionary(ExtGState=dictionary(G1=dictionary(ca=FloatObject(.5))))
        self.page[NameObject('/AA')]=dictionary(O=dictionary(S=NameObject('/JavaScript'),JS=TextStringObject('test')))
        errors=self.check()['errors']; self.assertIn('Live transparency remains.',errors); self.assertTrue(any('actions' in e for e in errors))
    def test_nested_form_unmanaged_vector_rgb_is_rejected(self):
        form=stream(b'1 0 0 rg 0 0 10 10 re f'); form.update(dictionary(Subtype=NameObject('/Form'),BBox=ArrayObject([NumberObject(x) for x in [0,0,10,10]]),Resources=dictionary()))
        self.page[NameObject('/Resources')]=dictionary(XObject=dictionary(Fm=self.writer._add_object(form)))
        self.page[NameObject('/Contents')]=self.writer._add_object(stream(b'/Fm Do'))
        self.assertIn('Uncharacterized RGB vector/text color remains.',self.check()['errors'])
    def test_pdfx3_characterized_rgb_is_allowed(self):
        profile=stream(b'characterized fixture'); profile[NameObject('/N')]=NumberObject(3)
        self.page[NameObject('/Resources')]=dictionary(ColorSpace=dictionary(DefaultRGB=ArrayObject([NameObject('/ICCBased'),self.writer._add_object(profile)])))
        self.page[NameObject('/Contents')]=self.writer._add_object(stream(b'1 0 0 rg 0 0 10 10 re f'))
        self.assertEqual(self.check()['errors'],[])
    def test_self_referencing_default_rgb_fails_without_recursing(self):
        self.page[NameObject('/Resources')]=dictionary(ColorSpace=dictionary(DefaultRGB=NameObject('/DeviceRGB')))
        self.page[NameObject('/Contents')]=self.writer._add_object(stream(b'1 0 0 rg'))
        self.assertIn('Uncharacterized RGB vector/text color remains.',self.check()['errors'])
    def test_changed_trim_is_rejected(self):
        self.page[NameObject('/TrimBox')]=ArrayObject([NumberObject(x) for x in [10,10,602,782]])
        self.assertTrue(any('trim box changed' in e for e in self.check()['errors']))
    def test_encrypted_output_fails_explicitly(self):
        self.writer.encrypt('private'); self.assertTrue(any('Encrypted' in e for e in self.check()['errors']))
    def test_broken_output_fails_in_report(self):
        self.output.write_bytes(b'not a PDF'); report=pdfx.preflight(self.output,self.profile,self.source)
        self.assertEqual(report['status'],'failed'); self.assertTrue(any('could not finish' in e for e in report['errors']))
if __name__=='__main__': unittest.main()
