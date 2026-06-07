import type { CloudProvider } from './provider';

function createUnconfiguredProvider(
  id: CloudProvider['id'],
  name: string,
  envKey: string,
): CloudProvider {
  return {
    id,
    name,
    connect: async () => {
      throw new Error(`${name} needs ${envKey} before cloud saving can work.`);
    },
    isConfigured: () => Boolean(import.meta.env[envKey]),
    load: async () => {
      throw new Error(`${name} loading is not connected yet.`);
    },
    save: async () => {
      throw new Error(`${name} saving is not connected yet.`);
    },
  };
}

export const cloudProviders: CloudProvider[] = [
  createUnconfiguredProvider(
    'google-drive',
    'Google Drive',
    'VITE_GOOGLE_DRIVE_CLIENT_ID',
  ),
  createUnconfiguredProvider('dropbox', 'Dropbox', 'VITE_DROPBOX_CLIENT_ID'),
  createUnconfiguredProvider(
    'onedrive',
    'OneDrive',
    'VITE_MICROSOFT_GRAPH_CLIENT_ID',
  ),
];
