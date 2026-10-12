export const MAX_TRANSFER_BYTES: number;
export function saveTransfer(file: File, preset: string, original?: File): Promise<string>;
export function readTransfer(id: string): Promise<{ id: string; file: File; original?: File; preset: string; createdAt: number }>;
export function removeTransfer(id: string): Promise<void>;
