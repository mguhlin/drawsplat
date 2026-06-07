import { describe, expect, it } from 'vitest';

import teks from './teks.json';
import { activities, projectIdeas } from './activities';

describe('activities library data', () => {
  it('includes at least seven classroom activities and project ideas', () => {
    expect(activities).toHaveLength(7);
    expect(projectIdeas.length).toBeGreaterThanOrEqual(4);
  });

  it('gives every activity sample data and TEKS tags', () => {
    for (const activity of activities) {
      expect(activity.sampleData.length).toBeGreaterThan(1);
      expect(activity.teks.length).toBeGreaterThan(0);
    }
  });

  it('tracks TEKS verification metadata', () => {
    expect(
      teks.every(
        (standard) =>
          standard.verificationStatus === 'verified' &&
          standard.verifiedDate === '2026-06-07' &&
          standard.sourceUrl.includes('tea.texas.gov'),
      ),
    ).toBe(true);
  });
});
