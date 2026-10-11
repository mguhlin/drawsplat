(() => {
  const form = document.querySelector('.wiki-search');
  if (!form) return;
  const input = form.querySelector('input');
  const results = document.querySelector('.wiki-results');
  const list = results.querySelector('ol');
  const status = results.querySelector('[role="status"]');
  const main = document.querySelector('.wiki-reading main');
  const outline = document.querySelector('.wiki-outline');
  const script = [...document.scripts].find(s => s.src.includes('/support-wiki.js'));
  const root = script.dataset.root ? new URL(script.dataset.root) : new URL('../../', script.src);
  const topics = document.querySelector('.wiki-topics');
  if (matchMedia('(max-width:700px)').matches) topics.open = false;
  const print = document.querySelector('.wiki-print');
  print.hidden = false;
  print.addEventListener('click', () => window.print());
  const index = window.DrawSplatWikiIndex || [];
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function show(query) {
    input.value = query;
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean).slice(0, 12);
    if (!terms.length) {
      results.hidden = true; main.hidden = false; outline.hidden = false; return;
    }
    const matches = index.map(entry => {
      const title = normalize(entry.title + ' ' + entry.description);
      const text = normalize(entry.text);
      return { entry, score: terms.every(t => (title + ' ' + text).includes(t)) ? terms.reduce((n,t) => n + (normalize(entry.title).includes(t) ? 10 : title.includes(t) ? 4 : 1),0) : 0 };
    }).filter(row => row.score).sort((a,b) => b.score-a.score);
    list.replaceChildren();
    for (const { entry } of matches) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = new URL(entry.path, root).href; link.textContent = entry.title;
      const category = document.createElement('p'); category.textContent = entry.category + ' · ' + entry.description;
      const excerpt = document.createElement('p');
      const position = Math.max(0, normalize(entry.text).indexOf(terms[0]));
      const start = Math.max(0, position - 70);
      const snippet = (start ? '…' : '') + entry.text.slice(start, start + 250) + '…';
      // Text nodes only: search queries and article content cannot inject HTML.
      const expression = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
      for (const fragment of snippet.split(expression)) {
        if (terms.includes(normalize(fragment))) { const mark = document.createElement('mark');mark.textContent=fragment;excerpt.append(mark); }
        else excerpt.append(document.createTextNode(fragment));
      }
      item.append(link, category, excerpt); list.append(item);
    }
    status.textContent = matches.length ? `${matches.length} article${matches.length === 1 ? '' : 's'} matching “${query}”.` : `No articles match “${query}”. Try fewer words, or browse the topics.`;
    main.hidden = true; outline.hidden = true; results.hidden = false;
    if (matchMedia('(max-width:700px)').matches) topics.open = false;
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); const url = new URL(location.href);
    input.value.trim() ? url.searchParams.set('q', input.value.trim()) : url.searchParams.delete('q');
    history.pushState(null, '', url); show(input.value.trim());
    results.scrollIntoView({block:'start'});
  });
  results.querySelector('.wiki-clear').addEventListener('click', () => {
    const url = new URL(location.href);url.searchParams.delete('q');history.pushState(null,'',url);show('');main.focus();
  });
  window.addEventListener('popstate', () => show(new URL(location.href).searchParams.get('q') || ''));
  show(new URL(location.href).searchParams.get('q') || '');
})();
