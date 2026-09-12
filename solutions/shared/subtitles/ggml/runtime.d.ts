import type { WorkerFileSystem } from './model-reader';
interface WhisperRuntime {
  FS: { mkdir(path: string): void; mount(type: unknown, options: unknown, path: string): void; unmount(path: string): void };
  WORKERFS: WorkerFileSystem;
  HEAPF32: Float32Array;
  UTF8ToString(pointer: number): string;
  _malloc(bytes: number): number;
  _free(pointer: number): void;
  _splat_init(): number;
  _splat_transcribe(pointer: number, samples: number): number;
  _splat_count(): number;
  _splat_start(index: number): number;
  _splat_end(index: number): number;
  _splat_text(index: number): number;
  _splat_free(): void;
}
export default function createWhisper(options: { locateFile(path: string): string; print(message: string): void; printErr(message: string): void }): Promise<WhisperRuntime>;
