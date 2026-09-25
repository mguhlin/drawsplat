#!/usr/bin/env python3
"""Serve one extracted package on loopback only. No third-party dependencies."""
import argparse
import functools
import http.server
import json
from pathlib import Path
import threading
import urllib.parse
import webbrowser

root = Path(__file__).resolve().parent
config = json.loads((root / 'offline-app.json').read_text(encoding='utf-8'))
parser = argparse.ArgumentParser(description='Open this DrawSplat package locally without internet access.')
parser.add_argument('--port', type=int, default=config['port'], help='Local port (default: stable port for this app, preserving browser autosaves).')
parser.add_argument('--no-browser', action='store_true', help='Print the URL without opening a browser.')
args = parser.parse_args()

class LocalHandler(http.server.SimpleHTTPRequestHandler):
    def list_directory(self, path):
        self.send_error(404, 'Open the app using the printed URL.')
        return None

    def do_GET(self):
        host = self.headers.get('Host', '').split(':')[0]
        if host not in ('127.0.0.1', 'localhost'):
            self.send_error(403)
            return
        path = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path)
        if any(part.startswith('.') for part in path.split('/') if part not in ('', '.')):
            self.send_error(404)
            return
        super().do_GET()

    def log_message(self, *args):
        pass

handler = functools.partial(LocalHandler, directory=str(root))
with http.server.ThreadingHTTPServer(('127.0.0.1', args.port), handler) as server:
    url = 'http://127.0.0.1:%d/%s' % (server.server_port, config['entry'].lstrip('/'))
    print(config['name'] + ' is running on this computer only.', flush=True)
    print(url, flush=True)
    print('No internet connection is needed for local editing. Keep this window open; press Ctrl+C to stop.', flush=True)
    if not args.no_browser:
        threading.Timer(0.3, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nLocal app stopped.')
