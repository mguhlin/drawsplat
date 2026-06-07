import type { SheetData } from '../../grid/types';

export interface CloudProvider {
  readonly id: 'google-drive' | 'dropbox' | 'onedrive';
  readonly name: string;
  connect: () => Promise<void>;
  isConfigured: () => boolean;
  load: (fileId: string) => Promise<SheetData>;
  save: (sheet: SheetData) => Promise<string>;
}
