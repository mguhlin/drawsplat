#!/usr/bin/env python3
"""Subset ICU 68.2 common-data without changing the selected data items."""
from pathlib import Path
import struct, sys

source, target = map(Path, sys.argv[1:3])
data = source.read_bytes()
header = struct.unpack_from('<H', data)[0]
if data[2:4] != b'\xda\x27' or data[12:16] != b'CmnD':
    raise SystemExit('Expected little-endian ICU common-data package.')
count = struct.unpack_from('<I', data, header)[0]
entries = []
for index in range(count):
    name_at, item_at = struct.unpack_from('<II', data, header + 4 + index * 8)
    end = data.index(0, header + name_at)
    name = data[header + name_at:end]
    entries.append((name, item_at))
items = []
for index, (name, offset) in enumerate(entries):
    basename = name.split(b'/')[-1]
    if basename.endswith(b'.cnv') or basename in {b'cnvalias.icu', b'ucase.icu', b'uprops.icu', b'pnames.icu', b'nfc.nrm', b'root.res', b'en.res'}:
        end = entries[index + 1][1] if index + 1 < count else len(data) - header
        items.append((name, data[header + offset:header + end]))
package = bytearray(4 + len(items) * 8)
struct.pack_into('<I', package, 0, len(items))
names = []
for name, item in items:
    names.append(len(package)); package.extend(name + b'\0')
for index, ((name, item), name_at) in enumerate(zip(items, names)):
    while (header + len(package)) % 16: package.append(0)
    struct.pack_into('<II', package, 4 + index * 8, name_at, len(package))
    package.extend(item)
target.write_bytes(data[:header] + package)
print(f'{len(items)} ICU entries: {target.stat().st_size} bytes')
