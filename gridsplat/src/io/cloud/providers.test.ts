import { describe, expect, it } from 'vitest';

import { cloudProviders } from './providers';

describe('cloud providers', () => {
  it('defines the planned cloud save adapters', () => {
    expect(cloudProviders.map((provider) => provider.name)).toEqual([
      'Google Drive',
      'Dropbox',
      'OneDrive',
    ]);
  });

  it('reports unconfigured providers clearly', async () => {
    await expect(cloudProviders[0].connect()).rejects.toThrow(
      'VITE_GOOGLE_DRIVE_CLIENT_ID',
    );
  });
});
