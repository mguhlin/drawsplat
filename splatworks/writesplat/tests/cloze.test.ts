import { describe, expect, it } from 'vitest';
import { createStudentClozeHtml, createTeacherClozeHtml } from '../src/export/cloze';

describe('cloze exports', () => {
  it('creates student blanks', () => {
    expect(createStudentClozeHtml('<p>The <span data-cloze-answer="moon">moon</span> rises.</p>')).toContain(
      '________',
    );
  });

  it('creates teacher answers', () => {
    expect(createTeacherClozeHtml('<p>The <span data-cloze-answer="moon">moon</span> rises.</p>')).toContain(
      '[moon]',
    );
  });
});
