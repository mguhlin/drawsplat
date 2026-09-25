"""Create portable HTML shortcuts with honest file-origin fallbacks."""
from html import escape
from urllib.parse import urlsplit, urlunsplit


def add_entry_pages(folder, name, entry):
    def explicit_index(url):
        parts = urlsplit(url)
        path = parts.path + ('index.html' if parts.path.endswith('/') else '')
        return urlunsplit(('', '', path, parts.query, parts.fragment))

    (folder / 'open-app.js').write_text("""(() => {
  const script = document.currentScript;
  const target = location.protocol === 'file:' ? script.dataset.file : script.dataset.host;
  location.replace(new URL(target, location.href).href);
})();
""", encoding='utf-8')

    def shortcut(filename, title, hosted, direct=False, file_entry=None):
        hosted = explicit_index(hosted)
        local = explicit_index(file_entry or hosted) if direct else 'START-HERE.html'
        (folder / filename).write_text(f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Open {escape(title)}</title><script defer src="open-app.js" data-host="{escape(hosted, quote=True)}" data-file="{escape(local, quote=True)}"></script></head>
<body><h1>Open {escape(title)}</h1><p>Opening the app or its offline setup instructions…</p><p><a href="{escape(local, quote=True)}">Continue</a> · <a href="START-HERE.html">Offline instructions</a></p></body></html>''', encoding='utf-8')

    shortcut('OPEN-APP.html', name, entry, name in ('PDFSplat', 'CipherSplat'))
    if not (folder / 'index.html').exists():
        shortcut('index.html', name, entry, name in ('PDFSplat', 'CipherSplat'))
    links = []
    for app, slug in [('VideoSplat', 'videosplat'), ('MediaSplat', 'mediasplat'), ('AudioSplat', 'audiosplat'), ('PDFSplat', 'pdfsplat'), ('CipherSplat', 'CipherSplat')]:
        target = f'solutions/{slug}/index.html'
        if app == name == 'CipherSplat':
            target = 'index.html?offline=1'
        if not (folder / target.split('?')[0]).is_file():
            continue
        offline = f'solutions/{slug}/offline/index.html'
        cipher_direct = app == 'CipherSplat' and ((folder / offline).exists() or (folder / target.split('?')[0]).read_text().find('./shared/assets/') >= 0)
        direct = app == 'PDFSplat' or cipher_direct
        file_entry = offline if app == 'CipherSplat' and (folder / offline).exists() else target
        filename = f'Open-{app}.html'
        shortcut(filename, app, target, direct, file_entry)
        note = 'opens directly from disk' if direct else 'local launcher required (Python 3)'
        links.append(f'<li><a href="{filename}">Open {app}</a> — {note}.</li>')
    guide = folder / 'START-HERE.html'
    content = guide.read_text()
    content = content.replace('<ul>', '<h2>Root-level shortcuts</h2><p>Open OPEN-APP.html (or the root index.html in an individual package). A shortcut opens the app directly when supported; otherwise it opens these launcher instructions. HTML shortcuts cannot start Python automatically.</p><ul>' + ''.join(links) + '</ul><h2>Local launcher</h2><ul>', 1)
    guide.write_text(content, encoding='utf-8')
