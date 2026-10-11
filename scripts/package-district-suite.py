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
    root_page = ZipInfo(prefix+'start-here.html')
    root_page.create_system = 3
    root_page.external_attr = 0o100644 << 16
    root_page.compress_type = ZIP_DEFLATED
    output.writestr(root_page, start)
    for info in archive.infolist():
        if info.filename in ('00-START-HERE.html', 'START-HERE.html'):
            continue
        copied = ZipInfo(prefix+'drawsplat/'+info.filename, info.date_time)
        # Tracked public application files must be readable regardless of the builder's umask.
        mode = 0o40755 if info.is_dir() else (0o100755 if (info.external_attr >> 16) & 0o111 else 0o100644)
        copied.external_attr = (mode << 16) | (16 if info.is_dir() else 0)
        copied.create_system = 3
        copied.compress_type = ZIP_DEFLATED
        output.writestr(copied, archive.read(info))
print(target)
