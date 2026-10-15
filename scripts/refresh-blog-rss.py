#!/usr/bin/env python3
"""Merge published DrawSplat posts into a deterministic same-origin RSS snapshot."""
import argparse
import copy
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime, format_datetime
import html
from pathlib import Path
import re
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

MGUHLIN_FEED = 'https://mguhlin.org/drawsplat/rss.xml'
RAINDROP_FEED = 'https://raindrop.io/collection/71392298/feed'
MEDIA = 'http://search.yahoo.com/mrss/'
ET.register_namespace('media', MEDIA)


def read_feed(data):
    if len(data) > 10_000_000 or b'<!DOCTYPE' in data.upper():
        raise ValueError('Feed is too large or contains a document type declaration.')
    root = ET.fromstring(data)
    if root.tag != 'rss' or root.find('channel') is None:
        raise ValueError('Expected an RSS channel; keeping the existing snapshot.')
    return root.find('channel').findall('item')


def fetch_feed(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 DrawSplatFeedSync/1.0', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=30) as response:
        return read_feed(response.read(10_000_001))


def publication(item):
    try:
        date = parsedate_to_datetime(item.findtext('pubDate', ''))
        return date.replace(tzinfo=timezone.utc) if date.tzinfo is None else date.astimezone(timezone.utc)
    except (ValueError, TypeError, OverflowError):
        return None


def identity(item):
    url = urllib.parse.urlparse(item.findtext('link', '').strip())
    if url.scheme not in ('http', 'https') or not url.hostname:
        return None
    host = url.hostname.lower().removeprefix('www.')
    path = url.path.rstrip('/')
    if host == 'mguhlin.org':
        if path in ('/about', '/about-miguel', '/curriculum-vitae', '/resume'):
            return None
        # Imported WordPress URLs and current /blog/ routes represent one post.
        slug = path.rsplit('/', 1)[-1]
        return host + '/' + re.sub(r'^\d{4}-\d{2}-\d{2}-', '', slug)
    return host + path + ('?' + url.query if url.query else '')


def merge_feeds(current, published, curated, now):
    entries = {}
    local = [item for item in current if item.findtext('source') in ('DrawSplat Updates', 'SplatWorks Updates')]
    for source, items in [('local', local), ('mguhlin', published), ('curated', curated), ('archive', current)]:
        for original in items:
            key, date = identity(original), publication(original)
            if not key or not date or date > now or not original.findtext('title', '').strip() or key in entries:
                continue
            item = copy.deepcopy(original)
            item.find('pubDate').text = format_datetime(date, usegmt=True)
            if source == 'mguhlin':
                marker = item.find('source')
                if marker is None:
                    marker = ET.SubElement(item, 'source')
                marker.set('url', MGUHLIN_FEED)
                marker.text = 'MGuhlin.org'
                image = item.find('{' + MEDIA + '}thumbnail')
                image_url = image.get('url', '') if image is not None else ''
                if urllib.parse.urlparse(image_url).scheme in ('https', 'http'):
                    description = item.find('description')
                    if description is None:
                        description = ET.SubElement(item, 'description')
                    description.text = '<img src="' + html.escape(image_url, quote=True) + '" alt="">' + html.escape(description.text or '')
            entries[key] = item
    root = ET.Element('rss', {'version': '2.0'})
    channel = ET.SubElement(root, 'channel')
    for tag, value in [('title', 'SplatWorks Blog'), ('link', 'https://drawsplat.org/blog/'), ('description', 'SplatWorks ecosystem updates and published articles from MGuhlin.org.'), ('language', 'en-US')]:
        ET.SubElement(channel, tag).text = value
    for item in sorted(entries.values(), key=lambda value: (publication(value), identity(value)), reverse=True):
        channel.append(item)
    ET.indent(root, space='  ')
    return ET.tostring(root, encoding='utf-8', xml_declaration=True) + b'\n'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--snapshot', type=Path, default=Path(__file__).resolve().parents[1] / 'blog/drawsplat.rss')
    args = parser.parse_args()
    current_bytes = args.snapshot.read_bytes() if args.snapshot.exists() else b''
    current = read_feed(current_bytes) if current_bytes else []
    # Fetch and validate both sources before touching the current snapshot.
    published, curated = fetch_feed(MGUHLIN_FEED), fetch_feed(RAINDROP_FEED)
    output = merge_feeds(current, published, curated, datetime.now(timezone.utc))
    if output == current_bytes:
        print('No changes to published blog entries.')
        return
    temporary = args.snapshot.with_suffix('.rss.new')
    temporary.write_bytes(output)
    temporary.replace(args.snapshot)
    print('Updated blog snapshot:', len(read_feed(output)), 'published entries.')


if __name__ == '__main__':
    main()
