export function htmlToPlainText(html: string): string {
  const host = document.createElement('div');
  host.innerHTML = html;

  host.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  host.querySelectorAll('p, h1, h2, h3, li, blockquote').forEach((block) => {
    block.appendChild(document.createTextNode('\n'));
  });

  return `${host.textContent?.replace(/\n{3,}/g, '\n\n').trim() ?? ''}\n`;
}
