import type { SheetData } from '../grid/types';
import { exportNativeJson, importNativeJson } from './json';

const AUTOSAVE_KEY = 'gridsplat.autosave.v1';

export function saveAutosave(sheet: SheetData, storage = window.localStorage) {
  storage.setItem(AUTOSAVE_KEY, exportNativeJson(sheet));
}

export function loadAutosave(storage = window.localStorage): SheetData | null {
  const saved = storage.getItem(AUTOSAVE_KEY);

  if (!saved) {
    return null;
  }

  return importNativeJson(saved);
}

export function clearAutosave(storage = window.localStorage) {
  storage.removeItem(AUTOSAVE_KEY);
}
