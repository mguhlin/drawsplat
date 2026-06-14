import type { SheetData } from '../grid/types';
import { exportNativeJson } from './json';
import { downloadText } from './download';

interface FileSystemWritableFileStreamLike {
  close: () => Promise<void>;
  write: (data: string) => Promise<void>;
}

interface FileSystemFileHandleLike {
  createWritable: () => Promise<FileSystemWritableFileStreamLike>;
}

interface SaveFilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{
      accept: Record<string, string[]>;
      description: string;
    }>;
  }) => Promise<FileSystemFileHandleLike>;
}

export async function saveSheetLocally(sheet: SheetData): Promise<string> {
  const text = exportNativeJson(sheet);
  const picker = (window as SaveFilePickerWindow).showSaveFilePicker;

  if (picker) {
    const handle = await picker({
      suggestedName: 'gridsplat.gridsplat.json',
      types: [
        {
          description: 'GridSplat™ file',
          accept: {
            'application/json': ['.gridsplat.json', '.json'],
          },
        },
      ],
    });
    const writable = await handle.createWritable();

    await writable.write(text);
    await writable.close();

    return 'Saved to a local file.';
  }

  downloadText('gridsplat.gridsplat.json', text, 'application/json');

  return 'Downloaded a GridSplat™ file.';
}
