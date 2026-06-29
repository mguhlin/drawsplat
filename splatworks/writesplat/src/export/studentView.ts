export function createStudentViewHtml(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;
  host.querySelectorAll('[data-teacher-only]').forEach((element) => element.remove());
  return host.innerHTML;
}

export function createTeacherViewHtml(html: string): string {
  return html;
}
