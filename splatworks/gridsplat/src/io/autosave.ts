import {workspaceStorage} from '../../../shared/file-bridge.js';
import type { SheetData } from '../grid/types';
import { exportNativeJson, importNativeJson } from './json';

const AUTOSAVE_KEY = 'gridsplat.autosave.v1';

export function saveAutosave(sheet: SheetData, storage = workspaceStorage()) {
  storage.setItem(AUTOSAVE_KEY, exportNativeJson(sheet));
}

export function loadAutosave(storage = workspaceStorage()): SheetData | null {
  const saved = storage.getItem(AUTOSAVE_KEY);

  if (!saved) {
    return null;
  }

  return importNativeJson(saved);
}

export function clearAutosave(storage = workspaceStorage()) {
  storage.removeItem(AUTOSAVE_KEY);
}
