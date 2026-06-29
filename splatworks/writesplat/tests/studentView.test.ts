import { describe, expect, it } from 'vitest';
import { createStudentViewHtml, createTeacherViewHtml } from '../src/export/studentView';

describe('student view exports', () => {
  it('strips teacher-only content from student HTML', () => {
    expect(createStudentViewHtml('<p>Show <span data-teacher-only="true">hide</span></p>')).toBe('<p>Show </p>');
  });

  it('preserves teacher-only content for teacher HTML', () => {
    const html = '<p>Show <span data-teacher-only="true">hide</span></p>';

    expect(createTeacherViewHtml(html)).toBe(html);
  });
});
