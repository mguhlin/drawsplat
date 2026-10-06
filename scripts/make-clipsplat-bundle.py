#!/usr/bin/env python3
"""Package ClipSplat and its exact local encoder dependencies."""
from pathlib import Path
import hashlib, shutil, subprocess, sys, tempfile, zipfile

root = Path(__file__).resolve().parent.parent
version = sys.argv[1] if len(sys.argv) > 1 else 'v1.1.1'
if not version or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-' for c in version):
    raise SystemExit('Use a simple version label, such as v1.1.1')
out = root / 'dist'
out.mkdir(exist_ok=True)
archive = out / f'clipsplat-selfhost-{version}.zip'
with tempfile.TemporaryDirectory(prefix='clipsplat-package-') as temp:
    stage = Path(temp) / f'clipsplat-selfhost-{version}'
    app = stage / 'solutions/clipsplat'
    shutil.copytree(root / 'solutions/clipsplat', app, ignore=shutil.ignore_patterns('node_modules', 'dist', 'test-results', 'playwright-report'))
    runtime = stage / 'solutions/mediasplat/ffmpeg'
    runtime.mkdir(parents=True)
    for name in ['ffmpeg-core.js', 'ffmpeg-core.part-01', 'ffmpeg-core.part-02']:
        shutil.copy2(root / 'solutions/mediasplat/ffmpeg' / name, runtime / name)
    (stage / 'README.txt').write_text('ClipSplat self-host package\n\nExtract the whole ZIP. Open START-HERE.html for local use (Python 3).\nFor hosting, upload solutions/ to your web root and open /solutions/clipsplat/.\nKeep solutions/mediasplat/ffmpeg/ intact: it supplies the local MP4 encoder.\nCamera and microphone require HTTPS or localhost. No media is uploaded.\nOnline sharing/external links require internet. Save originals; no autosave.\nSource and dependency metadata are included under solutions/clipsplat/.\n')
    subprocess.run([sys.executable, str(root / 'scripts/add-offline-launcher.py'), str(stage), 'ClipSplat', 'solutions/clipsplat/'], check=True)
    with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as z:
        for path in sorted(stage.rglob('*')):
            if path.is_file():
                z.write(path, path.relative_to(Path(temp)))
checksum = out / f'SHA256SUMS-clipsplat-{version}.txt'
checksum.write_text(f'{hashlib.sha256(archive.read_bytes()).hexdigest()}  {archive.name}\n')
print(archive)
print(checksum)
