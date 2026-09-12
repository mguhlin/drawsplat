#!/usr/bin/env bash
set -euo pipefail
# Requires Emscripten 3.1.74, CMake and Ninja on PATH. Build tools stay outside the repo.
splat_bridge_dir="$(cd "$(dirname "$0")" && pwd)"
splat_build_dir="${SPLAT_GGML_BUILD_DIR:-/tmp/splat-ggml-build}"
mkdir -p "$splat_build_dir"
if [ ! -d "$splat_build_dir/source/.git" ]; then
  git clone https://github.com/ggml-org/whisper.cpp.git "$splat_build_dir/source"
fi
git -C "$splat_build_dir/source" checkout --detach 2eeeba56e9edd762b4b38467bab96c2517163158
# The upstream example enables pthreads globally. Our engine already runs in a
# dedicated worker and uses one inference thread, including in AudioSplat where
# SharedArrayBuffer isolation would interfere with its sign-in popup workflow.
python3 - "$splat_build_dir/source/CMakeLists.txt" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1])
s = p.read_text().replace('set(CMAKE_C_FLAGS   "${CMAKE_C_FLAGS}   -pthread")', '')
s = s.replace('set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -pthread")', '')
p.write_text(s)
PY
emcmake cmake -S "$splat_bridge_dir" -B "$splat_build_dir/build" -G Ninja \
  -DWHISPER_SOURCE="$splat_build_dir/source" -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_C_FLAGS=-msimd128 -DCMAKE_CXX_FLAGS=-msimd128
cmake --build "$splat_build_dir/build" --parallel 4
cp "$splat_build_dir/build/splat-whisper.js" "$splat_bridge_dir/runtime.js"
cp "$splat_build_dir/build/splat-whisper.wasm" "$splat_bridge_dir/splat-whisper.wasm"
cp "$splat_build_dir/source/LICENSE" "$splat_bridge_dir/LICENSE"

chmod 644 "$splat_bridge_dir/runtime.js" "$splat_bridge_dir/splat-whisper.wasm"
