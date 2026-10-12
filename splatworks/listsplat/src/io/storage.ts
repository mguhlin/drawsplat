import {workspaceStorage} from '../../../shared/file-bridge.js';
import { assertListSplatFile } from '../model/database';
import type { ListSplatFile } from '../model/types';

const AUTOSAVE_KEY = 'listsplat.autosave.v1';

export function saveAutosave(project: ListSplatFile): void {
  workspaceStorage().setItem(AUTOSAVE_KEY, JSON.stringify(project));
}

export function loadAutosave(): ListSplatFile | null {
  const raw = workspaceStorage().getItem(AUTOSAVE_KEY);
  if (!raw) {
    return null;
  }
  const parsed: unknown = JSON.parse(raw);
  assertListSplatFile(parsed);
  return parsed;
}

export function downloadFile(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
