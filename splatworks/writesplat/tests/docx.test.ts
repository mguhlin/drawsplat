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
    const parsed=new DOMParser().parseFromString(html,'text/html');expect([...parsed.querySelectorAll('ol li')].map(li=>li.textContent)).toEqual(['Plan','Revise']);expect(parsed.querySelector('strong')?.textContent).toBe('Topic');expect(parsed.querySelector('em')?.textContent).toBe('Evidence');expect(parsed.querySelector('a')?.getAttribute('href')).toBe('https://example.org/lesson');expect(parsed.querySelectorAll('tr')).toHaveLength(2);
  });

  it('round-trips DOCX back to HTML on import', async () => {
    const blob = await htmlToDocxBlob('Draft', '<h1>My Title</h1><p>Hello class.</p>');
    const html = await docxToHtml(await blob.arrayBuffer());
    expect(html).toContain('My Title');
    expect(html).toContain('Hello class.');
  });
});

it('exports ruler tabs as real Word tab stops and keeps paragraph spacing and indents',async()=>{
 const blob=await htmlToDocxBlob('Ruler draft','<p style="margin-left:36pt;text-indent:18pt;margin-right:12pt;line-height:1.15;margin-bottom:6pt" data-writer-tabs="[144]">Before<span data-writer-tab="true">\t</span>After</p>');
 const {extractZipEntry}=await import('../src/storage/importDocx');const xml=await extractZipEntry(await blob.arrayBuffer(),'word/document.xml');expect(xml).toContain('w:pos="2880"');expect(xml).toContain('<w:tab/>');expect(xml).toContain('w:left="720"');expect(xml).toContain('w:firstLine="360"');expect(xml).toContain('w:line="276"');
 const html=await docxToHtml(await blob.arrayBuffer());const host=document.createElement('div');host.innerHTML=html;// jsdom's margin shorthand expansion differs from browsers when both vertical and horizontal longhands are present.
 expect(host.querySelector('p')?.getAttribute('style')).toContain('margin-left:36pt');expect(host.querySelector('p')?.style.lineHeight).toBe('1.15');expect(host.querySelector('p')?.getAttribute('data-writer-tabs')).toBe('[144]');
});
