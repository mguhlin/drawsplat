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
