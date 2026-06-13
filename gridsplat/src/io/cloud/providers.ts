import type { SheetData } from '../../grid/types';
import { exportNativeJson, importNativeJson } from '../json';
import { getAccessToken, lastFileStorageKey } from './oauth';
import type { CloudProvider } from './provider';

interface ProviderConfig {
  clientId: string;
  id: CloudProvider['id'];
  name: string;
}

function rememberFile(providerId: CloudProvider['id'], fileId: string) {
  localStorage.setItem(lastFileStorageKey(providerId), fileId);
}

function getLastFileId(providerId: CloudProvider['id']): string | null {
  return localStorage.getItem(lastFileStorageKey(providerId));
}

function createUnconfiguredProvider(
  id: CloudProvider['id'],
  name: string,
  envKey: string,
): CloudProvider {
  const message = `${name} needs ${envKey} before cloud saving can work.`;

  return {
    id,
    name,
    connect: async () => {
      throw new Error(message);
    },
    getLastFileId: () => getLastFileId(id),
    isConfigured: () => Boolean(import.meta.env[envKey]),
    load: async () => {
      throw new Error(message);
    },
    save: async () => {
      throw new Error(message);
    },
  };
}

function createGoogleDriveProvider(config: ProviderConfig): CloudProvider {
  async function token() {
    return getAccessToken({
      authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      clientId: config.clientId,
      scope: 'https://www.googleapis.com/auth/drive.file',
      storageKey: 'gridsplat:google-drive:token',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    });
  }

  return {
    id: config.id,
    name: config.name,
    connect: async () => {
      await token();
    },
    getLastFileId: () => getLastFileId(config.id),
    isConfigured: () => Boolean(config.clientId),
    load: async (fileId: string) => {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          fileId,
        )}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${await token()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Google Drive could not open that GridSplat™ file.');
      }

      return importNativeJson(await response.text());
    },
    save: async (sheet: SheetData) => {
      const boundary = `gridsplat-${Date.now()}`;
      const body = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify({
          mimeType: 'application/json',
          name: 'gridsplat.gridsplat.json',
        }),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        exportNativeJson(sheet),
        `--${boundary}--`,
      ].join('\r\n');
      const response = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          body,
          headers: {
            Authorization: `Bearer ${await token()}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Google Drive could not save this sheet.');
      }

      const result = (await response.json()) as { id?: string };
      const fileId = result.id ?? '';

      if (fileId) {
        rememberFile(config.id, fileId);
      }

      return fileId;
    },
  };
}

function createDropboxProvider(config: ProviderConfig): CloudProvider {
  async function token() {
    return getAccessToken({
      authorizeUrl: 'https://www.dropbox.com/oauth2/authorize',
      clientId: config.clientId,
      scope: 'files.content.write files.content.read',
      storageKey: 'gridsplat:dropbox:token',
      tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
    });
  }

  const path = '/GridSplat/gridsplat.gridsplat.json';

  return {
    id: config.id,
    name: config.name,
    connect: async () => {
      await token();
    },
    getLastFileId: () => getLastFileId(config.id),
    isConfigured: () => Boolean(config.clientId),
    load: async (fileId: string) => {
      const response = await fetch(
        'https://content.dropboxapi.com/2/files/download',
        {
          headers: {
            Authorization: `Bearer ${await token()}`,
            'Dropbox-API-Arg': JSON.stringify({ path: fileId || path }),
          },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Dropbox could not open that GridSplat™ file.');
      }

      return importNativeJson(await response.text());
    },
    save: async (sheet: SheetData) => {
      const response = await fetch(
        'https://content.dropboxapi.com/2/files/upload',
        {
          body: exportNativeJson(sheet),
          headers: {
            Authorization: `Bearer ${await token()}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              autorename: false,
              mode: 'overwrite',
              mute: false,
              path,
            }),
          },
          method: 'POST',
        },
      );

      if (!response.ok) {
        throw new Error('Dropbox could not save this sheet.');
      }

      rememberFile(config.id, path);

      return path;
    },
  };
}

function createOneDriveProvider(config: ProviderConfig): CloudProvider {
  async function token() {
    return getAccessToken({
      authorizeUrl:
        'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      clientId: config.clientId,
      scope: 'Files.ReadWrite offline_access',
      storageKey: 'gridsplat:onedrive:token',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    });
  }

  const path = '/GridSplat/gridsplat.gridsplat.json';

  return {
    id: config.id,
    name: config.name,
    connect: async () => {
      await token();
    },
    getLastFileId: () => getLastFileId(config.id),
    isConfigured: () => Boolean(config.clientId),
    load: async (fileId: string) => {
      const target = fileId
        ? `items/${encodeURIComponent(fileId)}/content`
        : `root:${path}:/content`;
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/${target}`,
        {
          headers: {
            Authorization: `Bearer ${await token()}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('OneDrive could not open that GridSplat™ file.');
      }

      return importNativeJson(await response.text());
    },
    save: async (sheet: SheetData) => {
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/drive/root:${path}:/content`,
        {
          body: exportNativeJson(sheet),
          headers: {
            Authorization: `Bearer ${await token()}`,
            'Content-Type': 'application/json',
          },
          method: 'PUT',
        },
      );

      if (!response.ok) {
        throw new Error('OneDrive could not save this sheet.');
      }

      const result = (await response.json()) as { id?: string };
      const fileId = result.id ?? '';

      if (fileId) {
        rememberFile(config.id, fileId);
      }

      return fileId;
    },
  };
}

export const cloudProviders: CloudProvider[] = [
  import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID
    ? createGoogleDriveProvider({
        clientId: import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID,
        id: 'google-drive',
        name: 'Google Drive',
      })
    : createUnconfiguredProvider(
        'google-drive',
        'Google Drive',
        'VITE_GOOGLE_DRIVE_CLIENT_ID',
      ),
  import.meta.env.VITE_DROPBOX_CLIENT_ID
    ? createDropboxProvider({
        clientId: import.meta.env.VITE_DROPBOX_CLIENT_ID,
        id: 'dropbox',
        name: 'Dropbox',
      })
    : createUnconfiguredProvider('dropbox', 'Dropbox', 'VITE_DROPBOX_CLIENT_ID'),
  import.meta.env.VITE_MICROSOFT_GRAPH_CLIENT_ID
    ? createOneDriveProvider({
        clientId: import.meta.env.VITE_MICROSOFT_GRAPH_CLIENT_ID,
        id: 'onedrive',
        name: 'OneDrive',
      })
    : createUnconfiguredProvider(
        'onedrive',
        'OneDrive',
        'VITE_MICROSOFT_GRAPH_CLIENT_ID',
      ),
];
