import { describe, expect, it } from 'vitest';
import { spreadsheetTemplates } from './templates';

describe('spreadsheetTemplates', () => {
  it('includes everyday, financial literacy, and teacher templates', () => {
    expect(spreadsheetTemplates.length).toBeGreaterThanOrEqual(8);
    expect(
      spreadsheetTemplates.some((item) => item.id === 'allowance-tracker'),
    ).toBe(true);
    expect(
      spreadsheetTemplates.some((item) => item.id === 'check-register'),
    ).toBe(true);
    expect(
      spreadsheetTemplates.some((item) => item.id === 'simple-gradebook'),
    ).toBe(true);
  });
});
