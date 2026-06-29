import { describe, expect, it } from 'vitest';
import { htmlToDocxBlob } from '../src/export/docx';

describe('DOCX export', () => {
  it('creates a non-empty DOCX blob', async () => {
    const blob = await htmlToDocxBlob(
      'Draft',
      '<h1>Draft</h1><p>Hello <strong>class</strong>.</p><ul><li>Revise</li></ul>',
    );

    expect(blob.type).toContain('wordprocessingml.document');
    expect(blob.size).toBeGreaterThan(1000);
  });
});
