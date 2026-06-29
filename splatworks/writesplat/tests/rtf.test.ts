import { describe, expect, it } from 'vitest';
import { htmlToRtf } from '../src/export/rtf';

describe('RTF export', () => {
  it('exports common formatting', () => {
    const rtf = htmlToRtf('<h1>Draft</h1><p>Hello <strong>class</strong> and <em>teachers</em>.</p>');

    expect(rtf).toContain('{\\rtf1');
    expect(rtf).toContain('\\fs40\\b Draft\\b0\\fs24');
    expect(rtf).toContain('\\b class\\b0');
    expect(rtf).toContain('\\i teachers\\i0');
  });

  it('keeps table text in readable rows', () => {
    const rtf = htmlToRtf('<table><tr><td>A</td><td>B</td></tr></table>');

    expect(rtf).toContain('A | B');
  });

  it('exports H4-H6 as bold smaller headings', () => {
    const rtf = htmlToRtf('<h4>Section</h4><h5>Detail</h5><h6>Fine point</h6>');

    expect(rtf).toContain('\\fs24\\b Section\\b0\\fs24');
    expect(rtf).toContain('\\fs22\\b Detail\\b0\\fs24');
    expect(rtf).toContain('\\fs20\\b Fine point\\b0\\fs24');
  });

  it('keeps horizontal rules as separators', () => {
    expect(htmlToRtf('<p>Before</p><hr><p>After</p>')).toContain('\\emdash\\emdash\\emdash');
  });
});
