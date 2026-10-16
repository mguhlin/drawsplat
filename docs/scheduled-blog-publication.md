# Scheduled SplatWorks blog publication

The PlanSplat walkthrough is scheduled for **October 16, 2026 at 6:00 p.m.
America/Chicago (CDT)**, equivalent to **23:00 UTC**. Its native URL is
`https://splatworks.org/blog/plansplat-student-planner/`, with the same route on
DrawSplat.org. The original MGuhlin.org article has the same publication time and
uses that site's existing scheduled-build publisher.

SplatWorks' Pages Function checks the server clock for each article and RSS
request. Before the publication timestamp, every article URL variant returns a
non-cacheable generic 404 and the RSS contains no scheduled title or description.
At the timestamp, the article and its feed entry become available together,
without a timed rebuild or GitHub cron. The blog index reads that RSS snapshot
and lists the article on its next load. The existing hourly feed refresh continues
for other MGuhlin.org articles; the Function removes a duplicate canonical copy of
this post if the hourly import later adds one.

`/blog/publication-schedule.json` reports only the next timestamp and already
published paths. It never includes future titles or article text.

Source articles and metadata live in `functions/_lib/scheduled-blog/`, inside the Pages Functions source directory, which Pages excludes from static assets. `scripts/build-scheduled-blog.py` creates the server-side HTML bundle and
an explicit `_routes.json`. Functions run only for the feed, schedule endpoint,
and exact scheduled article paths. A middleware guard also returns a non-cacheable 404 for the former `/server/blog/` source paths and all `/functions/` source requests, before the asset cache can respond. App, image and ordinary static blog routes remain static. This requires Cloudflare Pages Functions; a static-only host
continues to show the existing static RSS and does not run the publication gate.

## Editing an article

1. Edit the Markdown in `functions/_lib/scheduled-blog/` and its record in `posts.json`. Use an
   explicit timezone offset for `publishAt`; daylight Central time is `-05:00`.
2. Add screenshots as local assets and confirm their paths. The PlanSplat tour
   contains 21 screenshots of fictional coursework in v1.2.1.
3. Run `python3 scripts/build-scheduled-blog.py`, then
   `node --test tests/scheduled-blog.test.mjs`. The tests cover the exact boundary,
   aliases, the RSS, duplicate handling, and the lack of early content exposure.
4. Commit generated outputs with the source. Deploy with the `functions/` folder
   available to Wrangler, along with `functions/_lib/scheduled-blog/` for bundling. Never copy those source files into static asset output. Pages does not apply the Workers `.assetsignore` file to its static uploads. Keep bundled sources under `functions/`, and verify their URLs return 404 after deployment.
5. Verify the live schedule endpoint, the generic 404 before publication, the
   absence of the title in RSS, and screenshot availability. The builder's output
   can be rendered locally with a test clock at/after publication for preview.

The canonical link in the SplatWorks copy points to the original MGuhlin.org
article. Changing this post's scheduled date requires changing the frontmatter in
that separate repository as well. Existing Google account credentials and planner
content are not involved in blog publication.
