import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET
spec = importlib.util.spec_from_file_location('feed', Path(__file__).resolve().parents[1] / 'scripts/refresh-blog-rss.py')
feed = importlib.util.module_from_spec(spec)
spec.loader.exec_module(feed)

def item(title, link, date, local=False):
    node=ET.Element('item')
    for key,value in [('title',title),('link',link),('pubDate',date),('guid',link),('description','A classroom article.')]:ET.SubElement(node,key).text=value
    if local:ET.SubElement(node,'source',{'url':'https://drawsplat.org/'}).text='DrawSplat Updates'
    return node

class BlogFeedTests(unittest.TestCase):
    def test_source_date_deduplication_archive_and_local_preservation(self):
        old=item('Old copy','http://mguhlin.org/2026/10/14/classroom/','Thu, 15 Oct 2026 12:00:00 GMT')
        new=item('Source copy','https://mguhlin.org/blog/2026-10-11-classroom/','Wed, 14 Oct 2026 09:45:00 GMT')
        local=item('Local update','https://drawsplat.org/blog/update','Sun, 11 Oct 2026 15:00:00 GMT',True)
        archive=item('Earlier post','https://example.org/earlier','Tue, 01 Sep 2026 12:00:00 GMT')
        output=feed.merge_feeds([old,local,archive],[new],[old],datetime(2026,10,16,tzinfo=timezone.utc))
        items=feed.read_feed(output);self.assertEqual(len(items),3);self.assertEqual(items[0].findtext('title'),'Source copy');self.assertEqual(items[0].findtext('pubDate'),'Wed, 14 Oct 2026 09:45:00 GMT')
        self.assertEqual(output,feed.merge_feeds(items,[new],[old],datetime(2026,10,17,tzinfo=timezone.utc)))
    def test_future_items_stay_hidden_until_publication_time(self):
        scheduled=item('New DrawSplat guide','https://mguhlin.org/blog/new-guide','Wed, 14 Oct 2026 09:45:00 GMT')
        before=datetime(2026,10,14,9,44,tzinfo=timezone.utc);after=datetime(2026,10,14,9,45,tzinfo=timezone.utc)
        self.assertEqual(len(feed.read_feed(feed.merge_feeds([], [scheduled], [], before))),0)
        self.assertEqual(len(feed.read_feed(feed.merge_feeds([], [scheduled], [], after))),1)
    def test_invalid_feeds_and_links_are_rejected(self):
        for value in [b'<html>Not a feed</html>',b'<!DOCTYPE rss><rss><channel/></rss>']:
            with self.assertRaises(ValueError):feed.read_feed(value)
        bad=item('Unsafe','javascript:alert(1)','Wed, 14 Oct 2026 09:45:00 GMT')
        self.assertIsNone(feed.identity(bad))
        self.assertIsNone(feed.identity(item('Profile','https://mguhlin.org/about/','Wed, 14 Oct 2026 09:45:00 GMT')))
if __name__=='__main__':unittest.main()
