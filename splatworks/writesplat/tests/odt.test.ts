import { describe, expect, it } from 'vitest';
import { htmlToOdtBlob } from '../src/export/odt';
import { odtToHtml } from '../src/storage/importOdt';

describe('OpenDocument support', () => {
  it('round-trips common classroom document structure', async () => {
    const source = '<h2>Science Notes</h2><p>A <strong>careful</strong> observation.</p><ul><li>Question</li><li>Evidence</li></ul><table><tbody><tr><td>Claim</td><td>Reasoning</td></tr></tbody></table>';
    const blob = htmlToOdtBlob('Lab Draft', source);
    const html = await odtToHtml(await blob.arrayBuffer());

    const parsed=new DOMParser().parseFromString(html,'text/html');
    expect(parsed.querySelector('h1')).toBeNull();
    expect(parsed.querySelector('h2')?.textContent).toBe('Science Notes');
    expect(parsed.querySelector('span[style*="font-weight:bold"]')?.textContent).toBe('careful');
    expect([...parsed.querySelectorAll('ul li')].map(li=>li.textContent)).toEqual(['Question','Evidence']);
    expect(parsed.querySelector('td')?.textContent).toBe('Claim');
  });

  it('rejects files without OpenDocument content.xml', async () => {
    await expect(odtToHtml(new TextEncoder().encode('not an odt').buffer)).rejects.toThrow(/OpenDocument/);
  });
});

