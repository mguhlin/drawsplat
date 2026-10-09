/* Local, read-only search over the editable deck. No media is fetched. */
(function () {
  'use strict';
  const clean = value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  const fold = value => clean(value).normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase();
  function htmlText(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html || '');
    const doc = template.content;
    doc.querySelectorAll('script, style, template, .notes').forEach(node => node.remove());
    // Separate blocks/cells so adjacent words stay searchable.
    doc.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, td, th, br').forEach(node => node.append(' '));
    return clean(doc.textContent);
  }
  function indexSlides(slides) {
    return slides.map((slide, index) => {
      const content = clean((slide.elements || []).map(element => {
        if (element.type === 'html') return htmlText(element.html);
        if (element.type === 'table') return (element.rows || []).flat().map(clean).join(' ');
        return [element.text, element.alt, element.title].map(clean).filter(Boolean).join(' ');
      }).join(' '));
      const entry = { index, title: clean(slide.title), content, notes: clean(slide.notes) };
      entry.search = { title: fold(entry.title), content: fold(content), notes: fold(entry.notes) };
      entry.search.all = Object.values(entry.search).join(' ');
      return entry;
    });
  }
  function findSlides(index, query, scope) {
    const tokens = fold(query).split(' ').filter(Boolean);
    const field = ['title', 'content', 'notes'].includes(scope) ? scope : 'all';
    return index.filter(entry => tokens.every(token => entry.search[field].includes(token)));
  }
  function excerpt(text, query) {
    const value = clean(text);
    const first = fold(query).split(' ').find(token => token && fold(value).includes(token));
    const offset = first ? Math.max(0, fold(value).indexOf(first) - 45) : 0;
    return (offset ? '…' : '') + value.slice(offset, offset + 180) + (value.length > offset + 180 ? '…' : '');
  }
  window.ShowSplatSearch = { indexSlides, findSlides, excerpt };
})();
