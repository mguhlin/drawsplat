# ClipSplat illustrated frames

Generated October 5, 2026 using the built-in `image_gen.imagegen` tool via the imagegen skill. Generation mode, one call per original artwork; no reference images and no CLI/API fallback. Every call used `transparent_background: true`. The originals were copied into this directory without image editing. All three are 941 × 1672 RGBA PNGs with transparent centers.

| Picker choice | Saved original |
| --- | --- |
| Paint Party · illustrated | [paint-party.png](paint-party.png) |
| Celestial Magic · illustrated | [celestial-magic.png](celestial-magic.png) |
| Botanical Garden · illustrated | [botanical-garden.png](botanical-garden.png) |

`src/panel-frames.js` imports these images as versioned build assets, loads them on demand, and draws their borders using nine-slice scaling to preserve corner proportions. Illustrated cards use a narrower content region to accommodate the artwork. The generated centers remain transparent so each panel's chosen color appears beneath them.

## Final generation prompts

### Paint Party

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video title cards. Primary request: a richly illustrated, elaborate, joyful PAINT PARTY frame, high quality polished hand-painted illustration with layered purple and lilac paint splashes, glossy gold accents, tiny colorful paper confetti, curled ribbon, tactile brushstroke textures and playful dimensional details around the outer border. DrawSplat family palette purple #6d38e8, deep purple #4720a4, gold #f5b942 with small pink and mint accents. Composition: one complete vertical 9:16 rectangular picture frame, whole frame visible, edge-to-edge artwork only on the outer perimeter. The inner rectangular area spanning x=12% to 84% and y=14% to 80% MUST be completely empty and truly transparent alpha, for later video images and titles. Keep side border decoration in outermost 9% on each side; richer detailed clusters allowed in the top 12% and bottom 16%. Authentic transparent background both inside and outside the frame; no solid backdrop, no checkerboard drawn into the image. No text, words, logo, person, photograph, placeholder rectangle or central object. Distinct beautiful substantial decorative artwork rather than basic flat dots or line icons. Avoid anything covering central content. Deliver only the transparent PNG frame overlay.

### Celestial Magic

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video title cards. Create an elaborate CELESTIAL MAGIC rectangular frame in vertical 9:16 format. Premium storybook illustration: luminous lilac nebula wisps, richly shaded deep purple ribbons, gilded golden crescent moons and faceted stars, delicate constellation lines and sparkling jewel details around the border, whimsical and elegant. Whole frame visible, no clipping. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942. Decorations ONLY around outer perimeter: outermost 9% left/right sides, top 12%, bottom 16%. The inner rectangle x=12% to 84%, y=14% to 80% MUST remain entirely transparent alpha and absolutely empty for user text and photos. Genuine transparent PNG, hollow center, no drawn checkerboard, no filled background, no white or black center, no text, logo, people, photograph or center object. Build detailed dimensional illustrated ornaments, not simplistic code-like dots or icons. Deliver only a beautiful transparent frame overlay.

### Botanical Garden

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video title cards. Create a sophisticated joyful BOTANICAL GARDEN rectangular frame in vertical 9:16 format. Richly detailed layered paper-cut and watercolor illustration: sculpted lush leaves, violet and lilac flowers, tiny gold buds, curling vines, exquisite petals and luminous painterly textures, a few delicate golden butterflies and decorative foliage around outer edges. DrawSplat purple #6d38e8 and #4720a4 and gold #f5b942 with sage and emerald foliage. Whole frame visible and edge-to-edge, no clipping. Ornaments ONLY on outer perimeter in outermost 9% left/right sides, top 12%, bottom 16%. Keep inner rectangle x=12% to 84% and y=14% to 80% absolutely EMPTY with real transparent alpha for later photos and text. Truly transparent PNG, hollow center, no solid background, no checkerboard drawn into artwork, no text, logo, person, photo or central object. Beautiful elaborate illustrated border with substantial corner bouquets and fine vine detail, not simple flat circles or primitive line art. Deliver only transparent frame overlay.

## Additional aesthetic illustrated frames

Generated October 6, 2026 with the built-in `image_gen.imagegen` tool using the imagegen skill, one call per original asset, transparent_background=true. Original new illustrations inspired by the aesthetic frame categories at https://www.magnific.com/free-photos-vectors/instagram-frame and the collage/paper treatment at https://www.renderforest.com/graphic/aesthetic-instagram-frames. No stock artwork was copied or embedded, and no reference image was sent to the generator. Originals were copied without editing, preserving generated alpha.

### Scrapbook Memories

Saved original: [scrapbook-memories.png](scrapbook-memories.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent portrait frame overlay for ClipSplat video panels. Create a premium illustrated SCRAPBOOK MEMORIES frame inspired by aesthetic social-media collage templates: tactile torn ivory paper edges, layered lavender and lilac paper, small strips of semi-transparent washi tape, gold foil flecks, delicate hand-painted floral stickers and purple ribbon curls arranged around the outer rectangular perimeter. One complete vertical 9:16 frame, whole border visible. Sophisticated dimensional paper textures, polished editorial illustration, purple #6d38e8 and #4720a4, warm cream and gold #f5b942. Keep ornamentation strictly within outermost 9% side strips, top 12% and bottom 16%; substantial but tasteful corner clusters. Entire central rectangle x=12% to 84%, y=14% to 80% MUST be completely empty transparent alpha for user images and text. Genuine hollow transparent PNG; transparency both inside and outside, no solid center, no drawn checkerboard, no words, lettering, logo, people, photograph, placeholder photo or central object. Original artwork, no Instagram logo or replicated branded template. Deliver only the transparent frame.

### Sunset Waves

Saved original: [sunset-waves.png](sunset-waves.png)

Final prompt:

Use case: stylized-concept. Asset type: transparent decorative picture-frame overlay for ClipSplat video title panels and image cards. Primary request: SUNSET WAVES: flowing layered watercolor and cut-paper wave ribbons, terracotta peach, lilac, warm golden sunset tones with deep purple accents; sophisticated abstract aesthetic composition with fluid curving border shapes and fine gilded contours. No sun or object in center. One complete rectangular frame in vertical 9:16 format; whole frame visible with no clipped corners. Professional original aesthetic social-media illustration. ClipSplat purple #6d38e8 and #4720a4 and gold #f5b942 harmonized with the named theme. Composition: all ornamentation ONLY on outermost 9% left/right side strips, top 12% and bottom 16%, richer corner detail allowed within those strips. The complete central rectangle x=12% to 84%, y=14% to 80% MUST be absolutely empty and genuinely transparent alpha for later text and pictures. Genuine transparent PNG, hollow center, transparent outside. No background fill, checkerboard, text, lettering, words, logos, photos, people, placeholders or central objects. Deliver only one exquisitely illustrated transparent frame overlay.

### Watercolor Bloom

Saved original: [watercolor-bloom.png](watercolor-bloom.png)

Final prompt:

Use case: stylized-concept. Asset type: transparent decorative picture-frame overlay for ClipSplat video title panels and image cards. Primary request: WATERCOLOR BLOOM: delicate richly painted lilac and lavender wildflowers, translucent watercolor petals, sage eucalyptus leaves, gold ink filigree, subtle deckled ivory paper fragments. Elegant editorial botanical stationery with exquisite organic textures and detailed corner bouquets, airier and softer than lush tropical foliage. One complete rectangular frame in vertical 9:16 format; whole frame visible with no clipped corners. Professional original aesthetic social-media illustration. ClipSplat purple #6d38e8 and #4720a4 and gold #f5b942 harmonized with the named theme. Composition: all ornamentation ONLY on outermost 9% left/right side strips, top 12% and bottom 16%, richer corner detail allowed within those strips. The complete central rectangle x=12% to 84%, y=14% to 80% MUST be absolutely empty and genuinely transparent alpha for later text and pictures. Genuine transparent PNG, hollow center, transparent outside. No background fill, checkerboard, text, lettering, words, logos, photos, people, placeholders or central objects. Deliver only one exquisitely illustrated transparent frame overlay.

### Gilded Deco

Saved original: [gilded-deco.png](gilded-deco.png)

Final prompt:

Use case: stylized-concept. Asset type: transparent decorative picture-frame overlay for ClipSplat video title panels and image cards. Primary request: GILDED DECO: luxurious illustrated art-deco ornament with layered faceted purple gemstones, delicate gold foil fan shapes, fine geometric arches and gilded stepped corner flourishes, refined lilac enamel and deep amethyst accents. Rich dimensional material detail and polished vintage glamour, not simple flat line icons. One complete rectangular frame in vertical 9:16 format; whole frame visible with no clipped corners. Professional original aesthetic social-media illustration. ClipSplat purple #6d38e8 and #4720a4 and gold #f5b942 harmonized with the named theme. Composition: all ornamentation ONLY on outermost 9% left/right side strips, top 12% and bottom 16%, richer corner detail allowed within those strips. The complete central rectangle x=12% to 84%, y=14% to 80% MUST be absolutely empty and genuinely transparent alpha for later text and pictures. Genuine transparent PNG, hollow center, transparent outside. No background fill, checkerboard, text, lettering, words, logos, photos, people, placeholders or central objects. Deliver only one exquisitely illustrated transparent frame overlay.

## Illustrated replacements and video frames

Generated October 6, 2026 with built-in imagegen using the imagegen skill. Seven independent calls, transparent_background=true; originals copied without edits. Celebration Gala, Starlight Dreams and Artist Studio replace the simple confetti, star and paint-splat picker options. Cinema Classics, Vintage Film, Instant Classic and Instant Scrapbook also frame actual video.

### Celebration Gala

Saved original: [celebration.png](celebration.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original CELEBRATION GALA illustrated frame. Luxurious festive dimensional purple silk ribbons, layered gold foil curls and elegantly illustrated celebration ornaments, polished tactile paper textures. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.

### Starlight Dreams

Saved original: [starlight.png](starlight.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original STARLIGHT DREAMS illustrated frame. Exquisite storybook midnight-purple and lilac celestial filigree, luminous gold stars and crescent moon ornaments, jeweled constellation border, dreamy sophisticated illustration. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.

### Artist Studio

Saved original: [artist.png](artist.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original ARTIST STUDIO illustrated frame. Rich dimensional brushstroke layers, violet and lilac artist paint swirls, gilded paint textures and art-paper collage around the perimeter, premium expressive painterly illustration. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.

### Cinema Classics

Saved original: [cinema.png](cinema.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original CINEMA CLASSICS illustrated frame. A beautifully illustrated realistic black photographic film strip rectangular border with gold-edged sprocket holes, subtle glossy highlights and lilac enamel accents, refined cinema aesthetic. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.

### Vintage Film

Saved original: [film-vintage.png](film-vintage.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original VINTAGE FILM illustrated frame. Vintage cream and sepia photographic film-strip border, detailed perforations, gently distressed tactile celluloid, deep purple accent corners and fine warm gold details. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.

### Instant Classic

Saved original: [instant-classic.png](instant-classic.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original INSTANT CLASSIC illustrated frame. A classic ivory instant-photo paper border with rich tactile paper texture, subtle dimensional shadows, fine lavender decorative edge and small gold corner details. Wider bottom paper band like an instant photograph. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.

### Instant Scrapbook

Saved original: [instant-scrapbook.png](instant-scrapbook.png)

Final prompt:

Use case: stylized-concept. Asset type: production transparent decorative frame overlay for ClipSplat portrait video, title panels and image cards. Create one original INSTANT SCRAPBOOK illustrated frame. A beautifully illustrated ivory instant-photo border with torn lavender backing paper, small washi tape corners, elegant purple paper collage details and gold flecks. Wider bottom paper band like an instant photograph. Complete rectangular frame in vertical 9:16 format, entire frame visible. DrawSplat purple #6d38e8 and #4720a4 with gold #f5b942 accents. All artwork must stay in outermost 10% of left/right sides, top 12%, bottom 16%; premium substantial corner detail within those margins. The central rectangle x=14%..86%, y=16%..78% must be completely empty, genuinely transparent alpha to display actual video or a user's image. High quality polished illustration and dimensional materials, not basic vector dots or code-like icons. No text, lettering, logo, people, photograph, placeholder picture, background fill or checkerboard. Transparent inside and outside. Deliver only a transparent PNG frame overlay.
