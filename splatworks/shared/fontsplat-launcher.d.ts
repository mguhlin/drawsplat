export interface FontSplatArtwork { file: File; dataUrl: string; width: number; height: number; alt: string; }
export function openFontSplat(options?: {text?: string; onInsert?: (artwork: FontSplatArtwork) => void | Promise<void>}): HTMLDialogElement | undefined;
