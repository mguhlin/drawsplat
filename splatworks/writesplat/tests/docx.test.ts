import { describe, expect, it } from 'vitest';
import { htmlToDocxBlob } from '../src/export/docx';
import { docxToHtml } from '../src/storage/importDocx';

describe('DOCX export', () => {
  it('creates a non-empty DOCX blob', async () => {
    const blob = await htmlToDocxBlob(
      'Draft',
      '<h1>Draft</h1><p>Hello <strong>class</strong>.</p><ul><li>Revise</li></ul>',
    );

    expect(blob.type).toContain('wordprocessingml.document');
    expect(blob.size).toBeGreaterThan(1000);
  });

  it('round-trips DOCX back to HTML on import', async () => {
    const blob = await htmlToDocxBlob('Draft', '<h1>My Title</h1><p>Hello class.</p>');
    const html = await docxToHtml(await blob.arrayBuffer());
    expect(html).toContain('My Title');
    expect(html).toContain('Hello class.');
  });
});
