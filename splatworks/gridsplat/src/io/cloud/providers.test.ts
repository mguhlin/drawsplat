import { describe, expect, it } from 'vitest';

import { cloudProviders } from './providers';

describe('cloud providers', () => {
  it('defines the supported cloud save adapters', () => {
    expect(cloudProviders.map((provider) => provider.name)).toEqual([
      'Google Drive',
      'Dropbox',
      'OneDrive',
    ]);
  });

  it('reports unconfigured providers clearly', async () => {
    await expect(cloudProviders[1].connect()).rejects.toThrow(
      'VITE_DROPBOX_CLIENT_ID',
    );
  });
});
