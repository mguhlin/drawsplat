cmake_minimum_required(VERSION 3.20)
project(splat_whisper LANGUAGES C CXX)
set(CMAKE_CXX_STANDARD 17)
set(WHISPER_BUILD_TESTS OFF CACHE BOOL "" FORCE)
set(WHISPER_BUILD_EXAMPLES OFF CACHE BOOL "" FORCE)
set(WHISPER_BUILD_SERVER OFF CACHE BOOL "" FORCE)
set(GGML_OPENMP OFF CACHE BOOL "" FORCE)
set(GGML_NATIVE OFF CACHE BOOL "" FORCE)
set(GGML_CPU_REPACK OFF CACHE BOOL "" FORCE)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "" FORCE)
add_subdirectory(${WHISPER_SOURCE} whisper-source)
add_executable(splat-whisper bridge.cpp)
target_link_libraries(splat-whisper PRIVATE whisper)
target_compile_options(splat-whisper PRIVATE -O3 -msimd128)
target_link_options(splat-whisper PRIVATE
  -O3 -msimd128 --no-entry -lworkerfs.js
  "-sENVIRONMENT=worker" "-sMODULARIZE=1" "-sEXPORT_ES6=1" "-sDYNAMIC_EXECUTION=0"
  "-sALLOW_MEMORY_GROWTH=1" "-sINITIAL_MEMORY=67108864" "-sMAXIMUM_MEMORY=4294967296"
  "-sSTACK_SIZE=5242880" "-sFORCE_FILESYSTEM=1"
  "-sEXPORTED_FUNCTIONS=['_malloc','_free','_splat_init','_splat_transcribe','_splat_count','_splat_start','_splat_end','_splat_text','_splat_free']"
  "-sEXPORTED_RUNTIME_METHODS=['FS','WORKERFS','HEAPF32','UTF8ToString']")
set_target_properties(splat-whisper PROPERTIES SUFFIX ".js")
