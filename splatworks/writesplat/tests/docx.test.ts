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

  it('preserves tables, inline formatting, and safe hyperlinks on DOCX import',async()=>{
    const blob=await htmlToDocxBlob('Classroom notes','<p>Read <a href="https://example.org/lesson">the lesson</a>.</p><ol><li>Plan</li><li>Revise</li></ol><table><tbody><tr><td><strong>Topic</strong></td><td><em>Evidence</em></td></tr><tr><td>Rain</td><td>Clouds</td></tr></tbody></table>');
    const html=await docxToHtml(await blob.arrayBuffer());
    expect(html).toContain('<ol><li>Plan</li><li>Revise</li></ol>');expect(html).toContain('<table>');expect(html).toContain('<strong>Topic</strong>');expect(html).toContain('<em>Evidence</em>');expect(html).toContain('href="https://example.org/lesson"');expect((html.match(/<tr>/g)||[]).length).toBe(2);
  });

  it('round-trips DOCX back to HTML on import', async () => {
    const blob = await htmlToDocxBlob('Draft', '<h1>My Title</h1><p>Hello class.</p>');
    const html = await docxToHtml(await blob.arrayBuffer());
    expect(html).toContain('My Title');
    expect(html).toContain('Hello class.');
  });
});
