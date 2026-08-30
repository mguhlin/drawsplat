import { describe, expect, it } from 'vitest';
import { htmlToOdtBlob } from '../src/export/odt';
import { odtToHtml } from '../src/storage/importOdt';

describe('OpenDocument support', () => {
  it('round-trips common classroom document structure', async () => {
    const source = '<h2>Science Notes</h2><p>A <strong>careful</strong> observation.</p><ul><li>Question</li><li>Evidence</li></ul><table><tbody><tr><td>Claim</td><td>Reasoning</td></tr></tbody></table>';
    const blob = htmlToOdtBlob('Lab Draft', source);
    const html = await odtToHtml(await blob.arrayBuffer());

    expect(html).toContain('<h1>Lab Draft</h1>');
    expect(html).toContain('<h2>Science Notes</h2>');
    expect(html).toContain('<strong>careful</strong>');
    expect(html).toContain('<ul><li>Question</li><li>Evidence</li></ul>');
    expect(html).toContain('<table>');
    expect(html).toContain('<td>Claim</td>');
  });

  it('rejects files without OpenDocument content.xml', async () => {
    await expect(odtToHtml(new TextEncoder().encode('not an odt').buffer)).rejects.toThrow(/OpenDocument/);
  });
});

