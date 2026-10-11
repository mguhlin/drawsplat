#!/usr/bin/env python3
import subprocess
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]

class DistrictPackage(unittest.TestCase):
    def test_one_start_page_and_payload_with_rebased_links(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = Path(directory)/'source.zip', Path(directory)/'suite.zip'
            with ZipFile(source, 'w') as archive:
                archive.writestr('start-here.html', '<link href="assets/style.css"><script src="assets/script.js"></script><a href="#setup">Setup</a><a href="https://example.com/">Online</a><a href="docs/guide.html">Guide</a>')
                for name in ['assets/style.css','assets/script.js','docs/guide.html','start-district.sh','START-HERE.html','00-START-HERE.html']:
                    archive.writestr(name, 'fixture')
            subprocess.run(['python3', str(ROOT/'scripts/package-district-suite.py'), str(source), str(target)], check=True, capture_output=True)
            with ZipFile(target) as archive:
                names=archive.namelist()
                prefix='drawsplat-district-suite/'
                self.assertEqual({name[len(prefix):].split('/')[0] for name in names}, {'start-here.html','drawsplat'})
                page=archive.read(prefix+'start-here.html').decode()
                self.assertIn('href="drawsplat/assets/style.css"',page)
                self.assertIn('src="drawsplat/assets/script.js"',page)
                self.assertIn('href="drawsplat/docs/guide.html"',page)
                self.assertIn('href="#setup"',page)
                self.assertIn('href="https://example.com/"',page)
                self.assertIn(prefix+'drawsplat/start-district.sh',names)
                self.assertNotIn(prefix+'drawsplat/START-HERE.html',names)

if __name__ == '__main__': unittest.main()
