# PuzzleMaker Library authoring guide

Use these requirements for every activity added to the PuzzleMaker Library.

## Meme image standard

- Use a photorealistic image rather than clip art, diagrams, cartoons, or flat vector artwork.
- Make the subject immediately recognizable and directly connected to the activity's lesson content.
- Add a short, genuinely funny, classroom-appropriate joke in the classic meme format: one setup line at the top and one punchline at the bottom.
- Render captions in bold, condensed, uppercase white lettering with a thick black outline. Keep every word fully visible and readable at card-preview size.
- Prefer a landscape 16:10 composition, with the main subject unobscured by the captions.
- Do not include logos, watermarks, copyrighted characters, student likenesses, stereotypes, insults, or humor aimed at a protected group.
- Check spelling, punctuation, factual accuracy, and age appropriateness before publishing.
- Write useful alternative text that identifies the subject and communicates the joke.

The five existing images in `images/` are the approved visual and humor reference.

### Image-generation prompt pattern

> Create a photorealistic, funny classic internet meme for a [grade band] [subject] lesson about [concept]. Show [clear lesson-related scene]. Use a landscape 16:10 composition. Add bold condensed white uppercase meme text with a very thick black outline, centered and fully readable. TOP: “[setup]” BOTTOM: “[punchline]”. No logos, no watermark, no extra text.

## Library packaging

- Store the optimized library preview in `images/` as a descriptive JPEG filename.
- Reference that image from the activity's source JSON with a relative `./images/...` path.
- Keep the library download flow intact so it embeds the image as a data URL in the downloaded JSON. The resulting setup must remain portable to another browser or device.
- Include the activity title, grade band, content area, standards, questions, answers, and tile order.
