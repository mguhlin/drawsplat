# SplatWorks classroom series

The 66 classroom articles moved from MGuhlin.org to the SplatWorks blog: 19
previously published lessons and 47 scheduled lessons. Upcoming articles retain
their original 4:45 a.m. America/Chicago publication times through December 24,
2026. Two previously withdrawn posts remain withdrawn.

Articles, metadata, image dimensions, and the generated server bundle live in
`functions/_lib/scheduled-blog/`. Every moved article uses its SplatWorks URL as
its canonical. Former MGuhlin.org addresses redirect to the native article.
Earlier writing outside this classroom series stays in the original blog.

Editorial references live with the server-side sources, outside static uploads:

- [Calendar](../../functions/_lib/scheduled-blog/editorial/calendar.md)
- [CSV calendar](../../functions/_lib/scheduled-blog/editorial/calendar.csv)
- [Manifest and image prompts](../../functions/_lib/scheduled-blog/editorial/manifest.json)
- [Minto review and email drafts](../../functions/_lib/scheduled-blog/editorial/minto-editorial-review.md)

The 67 local image files under `images/drawsplat-classroom/` include the article
heroes and a classroom screenshot. Original alt text is retained.

Upcoming articles use Miguel's conversational portfolio voice and titles centered
on classroom questions. Their conclusion and three supporting reasons remain in
place. Historical lessons retain their existing text.

The Pages Function releases each article and RSS entry together using the server
clock. No timed rebuild is needed. The RSS refresher excludes both the old and
native copies of this series from its static archive; the Function supplies
exactly the articles whose publication time has arrived.
