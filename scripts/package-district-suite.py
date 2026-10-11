#!/usr/bin/env python3
"""Repack a tracked Git archive with one visible installation page at the top."""
import re
import sys
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

source, target = map(Path, sys.argv[1:])
prefix = 'drawsplat-district-suite/'
with ZipFile(source) as archive, ZipFile(target, 'w', ZIP_DEFLATED, compresslevel=6) as output:
    start = archive.read('start-here.html').decode()
    # Rebase only relative HTML resource/navigation attributes; anchors and remote URLs stay intact.
    start = re.sub(r'(\b(?:href|src)=")([^"#:/][^":]*)(")', lambda m: m[1]+'drawsplat/'+m[2]+m[3], start)
    output.writestr(prefix+'start-here.html', start)
    for info in archive.infolist():
        if info.filename in ('00-START-HERE.html', 'START-HERE.html'):
            continue
        copied = ZipInfo(prefix+'drawsplat/'+info.filename, info.date_time)
        copied.external_attr = info.external_attr
        copied.create_system = info.create_system
        copied.compress_type = ZIP_DEFLATED
        output.writestr(copied, archive.read(info))
print(target)
