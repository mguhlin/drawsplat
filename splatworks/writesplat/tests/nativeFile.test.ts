import { describe, expect, it } from 'vitest';
import { assertWriteSplatFile, createNativeFile } from '../src/storage/nativeFile';

describe('WriteSplat native file', () => {
  it('creates a readable v1 native file', () => {
    const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello class.' }] }] };
    const file = createNativeFile('Essay Draft', doc, { author: 'Miguel Guhlin' });

    expect(file.app).toBe('WriteSplatTM');
    expect(file.version).toBe(1);
    expect(file.metadata.title).toBe('Essay Draft');
    expect(file.metadata.author).toBe('Miguel Guhlin');
    expect(file.document.format).toBe('prosemirror-json');
    if (file.document.format === 'prosemirror-json') {
      expect(file.document.content).toEqual(doc);
    }
    expect(() => assertWriteSplatFile(file)).not.toThrow();
  });

  it('preserves caller-provided metadata for local saves', () => {
    const file = createNativeFile('College Draft', { type: 'doc' }, {
      answerKey: ['First. Second. Third.'],
      citations: ['Guhlin, Miguel. "Classroom Writing."'],
      createdAt: '2026-06-29T00:00:00.000Z',
      studentView: true,
      targetGrade: '13',
    });

    expect(file.createdAt).toBe('2026-06-29T00:00:00.000Z');
    expect(file.metadata.targetGrade).toBe('13');
    expect(file.teacher.answerKey).toEqual(['First. Second. Third.']);
    expect(file.teacher.citations).toEqual(['Guhlin, Miguel. "Classroom Writing."']);
    expect(file.teacher.studentView).toBe(true);
  });

  it('still accepts foundation html files during migration', () => {
    const file: any = {
      app: 'WriteSplatTM',
      version: 1,
      createdAt: '2026-06-29T00:00:00.000Z',
      updatedAt: '2026-06-29T00:00:00.000Z',
      metadata: { title: 'Old Draft', targetGrade: '6' },
      document: { format: 'html', body: '<p>Hello class.</p>' },
      teacher: { studentView: false, citations: [], answerKey: [] },
    };

    expect(() => assertWriteSplatFile(file)).not.toThrow();
    expect(file.metadata.author).toBe('');
  });

  it('rejects unsupported files', () => {
    expect(() => assertWriteSplatFile({ app: 'OtherApp', version: 1 })).toThrow(
      'This is not a supported WriteSplatTM file.',
    );
  });
});
