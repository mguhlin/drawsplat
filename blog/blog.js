/* Render the DrawSplat blog page from drawsplat.rss (same-origin).
   No external network requests; CSP-friendly.

   The RSS file ships alongside this page in /blog/. Replace it whenever
   you want fresh posts to appear. */
(function () {
  const list = document.getElementById('blogList');
  const status = document.getElementById('blogStatus');

  /* The upstream RSS comes from a "DrawSplat" search and occasionally pulls
     in false-positive posts (e.g. an "About Me" or CV page that happens to
     mention DrawSplat once). To keep this page focused, any item whose link
     contains one of these substrings is skipped during render. Add or
     remove entries to curate; matching is case-sensitive substring. */
  const EXCLUDE_LINK_PATTERNS = [
    '/about-miguel/',
    '/curriculum-vitae/',
  ];

  function isExcluded(link) {
    if (!link) return false;
    for (let i = 0; i < EXCLUDE_LINK_PATTERNS.length; i++) {
      if (link.indexOf(EXCLUDE_LINK_PATTERNS[i]) !== -1) return true;
    }
    return false;
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* Some feeds (Raindrop, WordPress) wrap descriptions in HTML — e.g.
     "<img src='...'/><br/>real text…". textContent gives us that as a
     plain string with the HTML re-decoded; strip tags so the displayed
     excerpt is just the prose. */
  function stripHtml(s) {
    return String(s || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function formattedDescription(raw) {
    const wrap = document.createElement('div');
    wrap.innerHTML = String(raw || '')
      .replace(/<img[^>]*>/gi, '')
      .replace(/<(\/?)(b|strong|em|i|p|br)\b[^>]*>/gi, '<$1$2>')
      .replace(/<(?!\/?(?:b|strong|em|i|p|br)\b)[^>]*>/gi, ' ');
    return wrap.innerHTML.replace(/\s+/g, ' ').trim();
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

  function cleanTitle(s) {
    return String(s || '').replace(/\s+[–-]\s+Another Think Coming\s*$/i, '').trim();
  }

  /* Raindrop's RSS embeds the post's first image as the leading <img> inside
     <description>. Extract its src so we can render a real thumbnail next
     to each card. Returns an empty string when no img is found. */
  function extractFirstImageSrc(rawDescription) {
    const m = String(rawDescription || '').match(/<img[^>]+src=["']([^"']+)["']/i);
    if (!m) return '';
    return safeUrl(m[1]);
  }

  function renderItems(items) {
    list.textContent = '';
    let rendered = 0;
    items.forEach(item => {
      const title = cleanTitle(item.querySelector('title')?.textContent || 'Untitled');
      const linkRaw = (item.querySelector('link')?.textContent || '').trim();
      if (isExcluded(linkRaw)) return;
      rendered++;
      const link = safeUrl(linkRaw);
      const pub = item.querySelector('pubDate')?.textContent || '';
      const rawDesc = item.querySelector('description')?.textContent || '';
      const desc = stripHtml(rawDesc);
      const descHtml = formattedDescription(rawDesc);
      const thumbSrc = extractFirstImageSrc(rawDesc);
      const dateStr = formatDate(pub);

      const card = document.createElement('article');
      card.className = 'blog-card' + (thumbSrc ? ' has-thumb' : '');
      const titleHtml = link
        ? `<a href="${esc(link)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>`
        : esc(title);
      const metaParts = [];
      if (dateStr) metaParts.push(esc(dateStr));
      const metaHtml = metaParts.join(' · ');
      const cta = link
        ? `<a class="blog-card-cta" href="${esc(link)}" target="_blank" rel="noopener noreferrer">Read full post ↗</a>`
        : '';
      // Wrap the thumbnail in the link too so clicking it opens the post.
      const thumbHtml = thumbSrc
        ? (link
            ? `<a class="blog-card-thumb-link" href="${esc(link)}" target="_blank" rel="noopener noreferrer"><img class="blog-card-thumb" src="${esc(thumbSrc)}" alt="" loading="lazy" referrerpolicy="no-referrer"></a>`
            : `<img class="blog-card-thumb" src="${esc(thumbSrc)}" alt="" loading="lazy" referrerpolicy="no-referrer">`)
        : '';

      card.innerHTML =
        thumbHtml +
        '<div class="blog-card-body">' +
          '<h2>' + titleHtml + '</h2>' +
          (metaHtml ? '<p class="blog-card-meta">' + metaHtml + '</p>' : '') +
          (desc ? '<div class="blog-card-desc">' + descHtml + '</div>' : '') +
          cta +
        '</div>';
      list.appendChild(card);
    });
    if (rendered === 0) {
      showStatus('No DrawSplat posts in the feed yet. Check back soon.', '');
    }
  }

  function showStatus(message, kind) {
    list.textContent = '';
    const p = document.createElement('p');
    p.className = 'blog-status' + (kind ? ' ' + kind : '');
    p.textContent = message;
    list.appendChild(p);
  }

  async function load() {
    showStatus('Loading posts…', '');
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
