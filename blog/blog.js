/* Render the DrawSplat blog page from drawsplat.rss (same-origin).
   No external network requests; CSP-friendly.

   The RSS file ships alongside this page in /blog/. Replace it whenever
   you want fresh posts to appear. */
(function () {
  const list = document.getElementById('blogList');
  const status = document.getElementById('blogStatus');

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function formatDate(s) {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function safeUrl(s) {
    const u = String(s || '').trim();
    return /^https?:\/\//i.test(u) ? u : '';
  }

  function renderItems(items) {
    list.textContent = '';
    items.forEach(item => {
      const title = (item.querySelector('title')?.textContent || 'Untitled').trim();
      const linkRaw = (item.querySelector('link')?.textContent || '').trim();
      const link = safeUrl(linkRaw);
      const pub = item.querySelector('pubDate')?.textContent || '';
      const src = (item.querySelector('source')?.textContent || '').trim();
      const desc = (item.querySelector('description')?.textContent || '').trim();
      const dateStr = formatDate(pub);

      const card = document.createElement('article');
      card.className = 'blog-card';
      const titleHtml = link
        ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>`
        : esc(title);
      const metaParts = [];
      if (dateStr) metaParts.push(esc(dateStr));
      if (src) metaParts.push('<span class="blog-source-tag">' + esc(src) + '</span>');
      const metaHtml = metaParts.join(' · ');
      const cta = link
        ? `<a class="blog-card-cta" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Read full post ↗</a>`
        : '';

      card.innerHTML =
        '<h2>' + titleHtml + '</h2>' +
        (metaHtml ? '<p class="blog-card-meta">' + metaHtml + '</p>' : '') +
        (desc ? '<p class="blog-card-desc">' + esc(desc) + '</p>' : '') +
        cta;
      list.appendChild(card);
    });
  }

  function showStatus(message, kind) {
    list.textContent = '';
    const p = document.createElement('p');
    p.className = 'blog-status' + (kind ? ' ' + kind : '');
    p.textContent = message;
    list.appendChild(p);
  }

  async function load() {
    try {
      const res = await fetch('drawsplat.rss', { cache: 'no-cache' });
      if (!res.ok) throw new Error('Could not load feed (HTTP ' + res.status + ').');
      const xml = await res.text();
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const err = doc.querySelector('parsererror');
      if (err) throw new Error('Feed XML is malformed.');
      const items = doc.querySelectorAll('item');
      if (!items.length) {
        showStatus('No blog posts in the feed yet. Check back soon.', '');
        return;
      }
      renderItems(items);
    } catch (e) {
      showStatus('Could not load posts: ' + (e && e.message ? e.message : String(e)), 'error');
    }
  }

  load();
})();
