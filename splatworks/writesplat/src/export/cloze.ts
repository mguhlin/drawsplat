export function createStudentClozeHtml(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;
  host.querySelectorAll<HTMLElement>('[data-cloze-answer]').forEach((element) => {
    const length = Math.max(8, (element.dataset.clozeAnswer ?? element.textContent ?? '').length);
    element.textContent = '_'.repeat(length);
    element.removeAttribute('data-cloze-answer');
    element.classList.add('cloze-blank');
  });
  return host.innerHTML;
}

export function createTeacherClozeHtml(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;
  host.querySelectorAll<HTMLElement>('[data-cloze-answer]').forEach((element) => {
    const answer = element.dataset.clozeAnswer ?? element.textContent ?? '';
    element.textContent = `[${answer}]`;
  });
  return host.innerHTML;
}
