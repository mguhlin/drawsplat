// Session preferences are optional; failures must not interrupt editing or capture.
export function readSessionPreference(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function writeSessionPreference(key: string, value: string): void {
  try { sessionStorage.setItem(key, value); } catch { /* Keep the active in-memory setting. */ }
}
