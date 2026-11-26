# SplatWorks blog publication

The publisher serves the existing PlanSplat walkthrough and the 66 migrated
classroom lessons: 19 previously published articles and 47 upcoming articles.
Upcoming lessons retain their original 4:45 a.m. America/Chicago timestamps,
with explicit timezone offsets.

Each article and RSS entry become available together when the server clock
reaches `publishAt`. Before then, every article URL variant returns a generic,
non-cacheable 404. Browser clocks and query parameters do not affect publication.
The blog index reads `/blog/drawsplat.rss`. The feed combines due native articles
and the retained static snapshot in publication order, removing old MGuhlin.org
links and native duplicates before inserting the native entries.

`/blog/publication-schedule.json` returns the next timestamp and published paths,
without future titles or article text. Read that endpoint for the next release;
do not copy a dated status into this guide.

## Sources and images

Markdown and `posts.json` live in `functions/_lib/scheduled-blog/`. `media.json`
records image dimensions. Moved articles use SplatWorks canonical URLs;
`sourceUrl` identifies the retired MGuhlin.org URL for feed deduplication. The
separate PlanSplat walkthrough retains its existing MGuhlin.org canonical because
that original article has not moved.

Classroom images live in `images/drawsplat-classroom/`. PlanSplat screenshots stay
under `assets/plansplat-blog/`. The builder validates local paths, sets image
sizes, and retains alt text. The editorial calendar, manifest, image prompts, and
email drafts live in the Function's private `editorial/` directory.

Pages excludes `functions/` from static uploads. Never copy article sources,
metadata, editorial files, or the generated module into static output. A
middleware guard rejects `/functions/*` and former `/server/blog/*` source URLs.

## Editing and verification

1. Edit the Markdown and matching `posts.json` record. Keep `publishAt` explicit
   and use a native canonical for a moved article.
2. Add local images and dimensions in `media.json`.
3. Run `python3 scripts/build-scheduled-blog.py`,
   `node --test tests/scheduled-blog.test.mjs tests/classroom-blog.test.mjs`, and
   `python3 -m unittest discover -s tests -p 'test_blog_rss.py'`.
4. Run the builder with `--check` and compile Pages Functions. Commit the generated
   module and `_routes.json`. Deploy an immutable, tested commit through the
   verified DrawSplat deployment workflow in the MGuhlin.org repository. It
   publishes to the existing `drawsplat` Pages project serving SplatWorks.org and
   DrawSplat.org.
5. Verify published pages, canonical URLs, images, RSS order and deduplication,
   the schedule, future 404s, and private-source 404s on the live domain.

Date-prefixed articles use month prefixes in `_routes.json`; other scheduled
articles use exact aliases. This stays within [Cloudflare's route limits](https://developers.cloudflare.com/pages/functions/routing/)
without routing the apps, images, static blog index, or static feature pages
through Functions. The exact publication guard still checks each article.

The existing hourly feed refresh imports other published MGuhlin.org and curated
articles. It excludes the moved collection by normalized identity, so archived
or curated copies cannot restore its retired MGuhlin.org links.

## Feature posts and RSS troubleshooting

Publish static feature articles under `blog/`, add their featured card to
`blog/index.html`, and insert an entry in `blog/drawsplat.rss`. Use a stable link
and GUID, the actual article `pubDate`, and `SplatWorks Updates` as the source
marker so refreshes retain the entry. Full article HTML can use `content:encoded`
with absolute links and image URLs for feed readers. The Atom self link keeps
the established subscription at `https://drawsplat.org/blog/drawsplat.rss`.
`https://splatworks.org/blog/drawsplat.rss` serves the same combined collection.

Article publication times are required RSS data, not maintenance timestamps.
The upstream `https://mguhlin.org/drawsplat/rss.xml` must emit each source
article's original `pubDate`; without it, import ordering and future-publication
checks cannot work. A nonempty feed with no valid publication dates now fails
the refresh rather than silently dropping every entry. No replacement dates
are guessed from URLs or assigned from the refresh time.

The refresh workflow updates the GitHub Pages snapshot. Publish the resulting
tested commit to the existing Cloudflare project as well to update the custom
domains. Verify the actual subscription response, including an RSS request with
old conditional headers, rather than relying on a successful snapshot commit.
The live feed combines the snapshot with due classroom articles and sends
`Cache-Control: no-store, no-transform`. Its publication dates determine sorting;
the date of a featured card on the blog homepage does not identify the newest
feed entry.
