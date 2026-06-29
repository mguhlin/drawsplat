import { describe, expect, it } from 'vitest';
import { createStandaloneHtml } from '../src/export/html';
import { htmlToMarkdown, markdownToHtml } from '../src/export/markdown';
import { htmlToOdtBlob } from '../src/export/odt';
import { htmlToPlainText } from '../src/export/plainText';

describe('document exports', () => {
  it('exports plain text', () => {
    expect(htmlToPlainText('<h1>Draft</h1><p>Hello <strong>class</strong>.</p>')).toBe('Draft\nHello class.\n');
  });

  it('exports markdown', () => {
    expect(htmlToMarkdown('<h1>Draft</h1><p>Hello <strong>class</strong>.</p><ul><li>Revise</li></ul>')).toBe(
      '# Draft\n\nHello **class**.\n\n- Revise\n',
    );
  });

  it('exports deeper headings to markdown', () => {
    expect(htmlToMarkdown('<h4>Section</h4><h5>Detail</h5><h6>Fine point</h6>')).toBe(
      '#### Section\n\n##### Detail\n\n###### Fine point\n',
    );
  });

  it('keeps page breaks visible in markdown export', () => {
    expect(htmlToMarkdown('<p>Page one.</p><div class="page-break" data-page-break="true"></div><p>Page two.</p>')).toBe(
      'Page one.\n\n<div style="page-break-after: always;"></div>\n\nPage two.\n',
    );
  });

  it('exports horizontal rules to markdown', () => {
    expect(htmlToMarkdown('<p>Before</p><hr><p>After</p>')).toBe('Before\n\n---\n\nAfter\n');
  });

  it('imports common markdown blocks', () => {
    expect(markdownToHtml('# Draft\n\nHello **class**.\n\n- Revise\n- Publish')).toBe(
      '<h1>Draft</h1>\n<p>Hello <strong>class</strong>.</p>\n<ul><li>Revise</li><li>Publish</li></ul>',
    );
  });

  it('escapes raw html during markdown import', () => {
    expect(markdownToHtml('<script>alert("x")</script>')).toBe(
      '<p>&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;</p>',
    );
  });

  it('exports odt as an OpenDocument zip', async () => {
    const blob = htmlToOdtBlob('ODT Draft', '<h1>Draft</h1><p>Hello <strong>class</strong>.</p><table><tr><td>Cell</td></tr></table>');
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder().decode(bytes);

    expect(blob.type).toBe('application/vnd.oasis.opendocument.text');
    expect(text).toContain('mimetype');
    expect(text).toContain('content.xml');
    expect(text).toContain('application/vnd.oasis.opendocument.text');
    expect(text).toContain('ODT Draft');
    expect(text).toContain('Hello ');
    expect(text).toContain('table:table');
  });

  it('wraps standalone html', () => {
    const html = createStandaloneHtml('Essay & Notes', '<h1>Draft</h1>');

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<title>Essay &amp; Notes</title>');
    expect(html).toContain('<h1>Draft</h1>');
  });
});
