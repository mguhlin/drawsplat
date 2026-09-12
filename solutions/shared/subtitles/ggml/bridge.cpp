#include "whisper.h"
#include <emscripten.h>
#include <algorithm>

static whisper_context * context = nullptr;
extern "C" {
EMSCRIPTEN_KEEPALIVE int splat_init() {
    auto options = whisper_context_default_params();
    options.use_gpu = false;
    options.flash_attn = true;
    context = whisper_init_from_file_with_params("/model/model.bin", options);
    return context ? 1 : 0;
}
EMSCRIPTEN_KEEPALIVE int splat_transcribe(const float * audio, int samples) {
    if (!context) return -1;
    auto options = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    options.n_threads = 1;
    options.language = "en";
    options.translate = false;
    options.no_context = true;
    options.print_realtime = options.print_progress = options.print_timestamps = options.print_special = false;
    options.suppress_nst = true;
    options.progress_callback = [](whisper_context *, whisper_state *, int progress, void *) {
        EM_ASM({ self.postMessage({type: 'progress', message: 'Transcribing with your local model: ' + $0 + '%'}); }, progress);
    };
    return whisper_full(context, options, audio, samples);
}
EMSCRIPTEN_KEEPALIVE int splat_count() { return whisper_full_n_segments(context); }
EMSCRIPTEN_KEEPALIVE double splat_start(int i) { return whisper_full_get_segment_t0(context, i) / 100.0; }
EMSCRIPTEN_KEEPALIVE double splat_end(int i) { return whisper_full_get_segment_t1(context, i) / 100.0; }
EMSCRIPTEN_KEEPALIVE const char * splat_text(int i) { return whisper_full_get_segment_text(context, i); }
EMSCRIPTEN_KEEPALIVE void splat_free() { if (context) whisper_free(context); context = nullptr; }
}
