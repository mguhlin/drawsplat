/* Shared illustrated action cards. Preserve labels, controls, and their handlers. */
(()=>{
  const assetRoot=new URL('../',document.currentScript.src);
  const menus='.landing-nav-menu, .menu-panel, .menu-popover, .submenu-popover, [role="menu"]';
  const actions=`${menus.split(', ').map(s=>s+' button, '+s+' a').join(', ')}, .admin-actions button, .admin-actions .admin-button, .quick-actions button, .tool-card, .splash-actions button, .mode-actions button, .export-actions button, .game-ux-help-button, form.controls button[type="submit"]`;
  const descriptions={
    undo:['undo','Reverse your last change.'],redo:['redo','Restore the change you just undid.'],
    'new-document':['text','Start a fresh writing document.'],'new-deck':['insert-image','Start a new slide presentation.'],
    'save-local-document':['adv-library','Keep this document in this browser.'],
    'open-local-library':['adv-library','Find documents saved in this browser.'],
    'save-json':['adv-save','Download an editable copy to your device.'],
    'open-json':['adv-library','Open an editable copy saved on your device.'],
    'save-deck':['adv-save','Download an editable copy of your slides.'],
    'open-deck':['adv-library','Load a saved ShowSplat presentation.'],
    'duplicate-slide':['adv-copy','Make a copy of the selected slide.'],
    'delete-slide':['trash','Remove the selected slide from this deck.'],
    'delete-object':['trash','Remove the selected item from the slide.'],
    'open-find-dialog':['text','Find words and replace them in your document.'],
    'open-help-dialog':['adv-library','Get a guided tour of this app.'],
    'open-shortcuts-dialog':['adv-library','See keys that speed up common actions.'],
    'open-export-dialog':['adv-save','Choose a file format for sharing your work.'],
    'open-image-dialog':['insert-image','Choose a picture to add to your work.'],
    'open-link-dialog':['text','Add a clickable website link.'],
    'delete-all-data':['trash','Remove this app’s data saved in this browser.'],
    'newBtn':['pen','Start a new puzzle to try again.'],
    'adminGateSubmit':['adv-lock','Unlock classroom setup with your admin password.'],
    'adminGenerateLocalPasswordBtn':['adv-lock','Create a temporary password for this browser only.'],
    'adminViewerPreviewBtn':['adv-library','Explore settings in a read-only preview.']
  };
  const labelDescriptions={"Select all objects": "Select every item on the current slide.", "Distribute horizontally": "Space selected items evenly from left to right.", "Distribute vertically": "Space selected items evenly from top to bottom.", "Hide selected slides": "Skip selected slides when presenting.", "Show selected slides": "Include selected slides when presenting.", "Indent selected slides": "Nest selected slides under the preceding section.", "Outdent selected slides": "Move selected slides up one level.", "Collapse selected slides": "Fold slide groups in the slide list.", "Expand selected slides": "Reveal slides inside folded groups.", "Bullet list": "Organize text as a list of points.", "Slide number": "Add a slide number to the current slide.", "Header": "Add a heading to the current slide.", "YouTube video": "Embed a YouTube video using its link.", "MP4/WebM by URL": "Add a video from a direct file link.", "MP4/WebM upload": "Choose a video file from your device.", "Audio by URL": "Attach audio using a direct file link.", "Audio file on slide": "Choose an audio file for this slide.", "Record slide audio": "Record narration for the current slide.", "Song for whole deck": "Choose background music for the presentation.", "Themes and master slide": "Set a consistent appearance for the whole deck.", "Normal": "Return to editing slides.", "Notes": "Write speaker notes for your presentation.", "Master Slide": "Edit the elements shared across your slides.", "Selected slides: light": "Apply a light background to selected slides.", "Selected slides: dark": "Apply a dark background to selected slides.", "Selected slides: purple": "Apply a purple background to selected slides.", "Toggle inspector": "Show or hide controls for the selected item.", "Mail merge (CSV → slides)…": "Create personalized slides from a CSV data file.", "Horizontal rule": "Insert a divider between document sections.", "Page break": "Start the next content on a new page.", "Blockquote": "Set a quoted passage apart from the main text.", "Code block": "Show code in its own formatted block.", "Toggle analysis": "Show or hide writing statistics and feedback.", "Read aloud": "Listen to your document spoken aloud.", "Toggle sidebar": "Show or hide extra editing controls.", "Toggle theme": "Switch the workspace color theme.", "Focus mode (distraction-free)": "Hide extra controls while you write.", "Single": "Use single spacing between lines.", "1.5 lines": "Add a little extra space between lines.", "Double": "Use double spacing between lines.", "Spellcheck on/off": "Toggle the browser’s spelling suggestions.", "Dyslexia-friendly font": "Use a font designed to make reading easier.", "High contrast": "Increase the contrast of workspace controls.", "Reduce motion": "Limit workspace animations.", "WYSIWYG editor": "Edit the document as it will appear.", "Raw Markdown": "Edit the underlying Markdown text.", "Split Markdown": "See Markdown and its preview side by side.", "Convert selection to blank": "Turn selected words into a student fill-in blank.", "Insert citations section": "Add a place to list your sources.", "Toggle Student View": "Preview what students can see.", "Mark teacher only": "Hide the selected content from Student View.", "Scramble selected sentences": "Turn selected sentences into a rearranging activity.", "Insert answer key": "Add teacher answers to the document.", "Add record": "Create another entry in the current table.", "Add field": "Add a new kind of information to your records.", "Replace values": "Find and replace values in your records.", "Design current layout": "Arrange the fields in this layout.", "Form view": "Read and edit one record at a time.", "Card view": "Browse records as individual cards.", "Gallery view": "Browse records with their pictures.", "Label view": "Arrange records as printable labels.", "Report view": "Prepare a report from your records.", "Relationships": "Connect records across related tables.", "Data quality check": "Find data that may need correcting.", "Database maintenance": "Review and maintain your local database.", "Accessibility check": "Review the layout for accessibility issues.", "Student view": "Preview the workspace for students.", "Teacher notes": "Add teaching notes to this project.", "Project Ideas": "Explore starting points for classroom projects.", "Publish read-only page": "Export a page people can browse without editing.", "Lock Layout": "Protect the current arrangement from accidental edits.", "Green Screen Studio…": "Replace a picture’s green background with another image.", "Capture screen": "Choose a screen or window to capture.", "Capture area": "Capture a selected area of your screen.", "Capture area after 3 sec": "Capture an area after a short preparation delay.", "Paste from clipboard": "Add content you copied to the clipboard.", "Ungroup": "Separate the items in the selected group.", "Crop": "Trim the picture to the area you want to keep.", "Box": "Draw a rectangular shape.", "Line": "Draw a straight line.", "Freehand": "Draw freely with your pointer.", "Grayscale": "Remove color from the selected picture.", "Sepia": "Give the selected picture warm brown tones.", "Invert": "Reverse the colors in the selected picture.", "Soft blur": "Soften details in the selected picture.", "Sharpen": "Emphasize edges in the selected picture.", "Lighten": "Make the selected picture brighter.", "Darken": "Make the selected picture darker.", "Pixelate": "Turn the picture into larger blocks of color.", "Mosaic": "Combine pictures into a regular grid.", "Picasso cubism": "Give the picture an angular, geometric effect.", "Oval": "Draw a rounded oval shape.", "Ellipse": "Draw an elliptical shape.", "Square": "Draw a shape with equal sides.", "Diamond": "Draw a diamond shape.", "Pentagon": "Draw a five-sided shape.", "Star": "Draw a star shape."};
  const toolRoutes=[{"url": "/app/whiteboard.html", "description": "Draw, explain, collaborate, and build visual classroom activities.", "icon": "/assets/favicons/whiteboard.svg"}, {"url": "/splatworks/gridsplat/", "description": "Work with spreadsheets, formulas, tables, and classroom data.", "icon": "/assets/icons/splatworks/gridsplat-nav.png"}, {"url": "/splatworks/showsplat/", "description": "Create and present slide decks and browser-based presentations.", "icon": "/assets/icons/splatworks/showsplat-nav.png"}, {"url": "/splatworks/writesplat/", "description": "Write and format classroom documents in the browser.", "icon": "/assets/icons/splatworks/writesplat-nav.png"}, {"url": "/splatworks/listsplat/", "description": "Build friendly lists and database-style classroom projects.", "icon": "/assets/icons/splatworks/listsplat-nav.png"}, {"url": "/solutions/animated-gif/", "description": "Build animated GIFs from image frames and export common video formats.", "icon": "/assets/icons/tools/insert-gif.png"}, {"url": "/solutions/audiosplat/", "description": "Record, arrange, edit, and export private multitrack audio.", "icon": "/solutions/audiosplat/audiosplat-icon.svg"}, {"url": "/solutions/big-link/", "description": "Create a large projected or printable URL card.", "icon": "/assets/icons/tools/adv-share.svg"}, {"url": "/solutions/bingo-caller/", "description": "Run animated bingo calls for a class or group.", "icon": "/assets/icons/tools/adv-play.svg"}, {"url": "/solutions/bingo-card-generator/", "description": "Create and print custom bingo cards.", "icon": "/assets/tool-thumbs/bingo-card-generator.png"}, {"url": "/solutions/brain-sort/", "description": "Turn a messy task dump into an organized checklist.", "icon": "/assets/icons/tools/adv-group.svg"}, {"url": "/solutions/CipherSplat/", "description": "Encrypt files, folders, and private text locally.", "icon": "/assets/favicons/tools.svg"}, {"url": "/solutions/clock-wizard/", "description": "Estimate task time with simple phase breakdowns.", "icon": "/assets/icons/tools/adv-sync.png"}, {"url": "/solutions/coinflipping/", "description": "Flip custom coins for probability, choices, and games.", "icon": "/solutions/coinflipping/assets/coin-heads.png"}, {"url": "/solutions/coloring-book/", "description": "Paint printable line-art pages in the browser.", "icon": "/assets/icons/tools/insert-coloring.png"}, {"url": "/solutions/concept-map/", "description": "Connect ideas visually and show their relationships.", "icon": "/assets/feature-concept-map.svg"}, {"url": "/solutions/dice/", "description": "Roll classroom dice for games, probability, and choices.", "icon": "/assets/tool-thumbs/dice.png"}, {"url": "/solutions/dicebreakers/", "description": "Create dice-based prompts and classroom icebreakers.", "icon": "/assets/tool-thumbs/dicebreakers.png"}, {"url": "/solutions/dotsboxes/", "description": "Play the classic box-claiming strategy game.", "icon": "/assets/games-thumbs/dotsboxes.jpg"}, {"url": "/solutions/drawsketch/", "description": "Open a quick freehand drawing and sketch pad.", "icon": "/assets/icons/tools/pen.png"}, {"url": "/solutions/fortune/", "description": "Spin a teacher-curated wheel for prompts and choices.", "icon": "/assets/icons/tools/insert-spinner.png"}, {"url": "/solutions/graphsplat/", "description": "Create charts from classroom or CSV data, picture graphs, coordinate plots, and interactive function graphs.", "icon": "/solutions/graphsplat/graphsplat-icon.svg"}, {"url": "/solutions/markdown-studio/", "description": "Write, preview, and export structured Markdown pages.", "icon": "/assets/favicons/markdown.svg"}, {"url": "/solutions/mediasplat/", "description": "Split, trim, and join video or audio locally.", "icon": "/solutions/mediasplat/icon.svg"}, {"url": "/solutions/memepuzzle/", "description": "Build and play image-based puzzle activities.", "icon": "/assets/icons/tools/imagegroup.png"}, {"url": "/solutions/memesplat/", "description": "Create captioned memes locally from templates or your own images.", "icon": "/assets/icons/tools/imagegroup.png"}, {"url": "/solutions/mermaid/", "description": "Compose structured diagrams from text syntax with live preview.", "icon": "/assets/feature-mermaid.svg"}, {"url": "/solutions/pdfsplat/", "description": "Edit, sign, crop, sanitize, organize, convert, and protect PDFs locally.", "icon": "/solutions/pdfsplat/pdfsplat.png"}, {"url": "/solutions/qrsplat/", "description": "Create, brand, copy, and optionally update QR codes.", "icon": "/solutions/qrsplat/qrsplat-icon.svg"}, {"url": "/solutions/quiz-flashcard-studio/", "description": "Build quizzes, team activities, and printable flashcards.", "icon": "/assets/tool-thumbs/quiz-flashcard-studio.png"}, {"url": "/solutions/rubric-builder/", "description": "Create practical scoring rubrics for projects and assignments.", "icon": "/assets/favicons/docs.svg"}, {"url": "/solutions/sketchspace-VR/", "description": "Open immersive classroom scenes and guided activities.", "icon": "/solutions/sketchspace-VR/assets/geography.png"}, {"url": "/solutions/splatbot-studio/", "description": "Program a virtual classroom robot with blocks or word commands.", "icon": "/solutions/splatbot-studio/assets/posters/algorithm-development.svg"}, {"url": "/solutions/imagesplat/", "description": "Edit screenshots and images with layers, crop, annotations, and export.", "icon": "/assets/favicons/splatimage-studio.svg"}, {"url": "/solutions/step-splat/", "description": "Break large tasks into clear, bite-size steps.", "icon": "/assets/icons/tools/adv-front.png"}, {"url": "/solutions/storywheel/", "description": "Spin combinations of creative writing prompts.", "icon": "/assets/icons/tools/insert-spinner.png"}, {"url": "/solutions/toneshifter/", "description": "Rewrite text in a chosen tone while keeping its meaning.", "icon": "/assets/icons/tools/text.png"}, {"url": "/solutions/vibe-check/", "description": "Check the likely tone of a tricky written message.", "icon": "/assets/icons/tools/adv-magic.svg"}, {"url": "/solutions/videosplat/", "description": "Edit, anonymize, optimize, and export video locally.", "icon": "/solutions/videosplat/icon.svg"}, {"url": "/solutions/wheel-spinner/", "description": "Paste a list and spin the wheel for a random pick.", "icon": "/assets/icons/tools/insert-spinner.png"}, {"url": "/solutions/wordsearch/", "description": "Generate printable word searches for vocabulary practice.", "icon": "/assets/icons/tools/textgroup.png"}, {"url": "/games/castles/", "description": "Play a two-player castle siege with wind and toppled keeps.", "icon": "/assets/games-thumbs/castles.jpg"}, {"url": "/games/floodfill/", "description": "Merge colors from the corner until the board matches.", "icon": "/assets/games-thumbs/floodfill.jpg"}, {"url": "/games/flowfree/", "description": "Connect matching terminals with non-crossing paths.", "icon": "/assets/games-thumbs/flowfree.jpg"}, {"url": "/games/funquiz/", "description": "Play themed character-trivia quiz packs.", "icon": "/assets/games-thumbs/funquiz.jpg"}, {"url": "/games/gilasplat/", "description": "Play a retro desert-burrow maze arcade game.", "icon": "/assets/games-thumbs/gilasplat.jpg"}, {"url": "/games/lightsout/", "description": "Toggle cells and neighbors to clear the logic grid.", "icon": "/assets/games-thumbs/lightsout.jpg"}, {"url": "/games/splatball/", "description": "Play a colorful paddle-rally arcade game.", "icon": "/assets/games-thumbs/splatball.jpg"}, {"url": "/games/squirrel-run-game/", "description": "Dodge traffic, collect acorns, and reach the tree hollow.", "icon": "/assets/games-thumbs/squirrel-run.jpg"}, {"url": "/games/super-star-trek/", "description": "Command a starship in a classic quadrant strategy game.", "icon": "/assets/games-thumbs/super-star-trek.jpg"}, {"url": "/games/tangram/", "description": "Drag and rotate blocks to fill silhouettes without overlap.", "icon": "/assets/games-thumbs/tangram.jpg"}, {"url": "/games/typing-games/", "description": "Practice typing with racing, word-stack, and passage modes.", "icon": "/assets/games-thumbs/typing-games.jpg"}, {"url": "/games/untangle/", "description": "Move graph nodes until none of their edges cross.", "icon": "/assets/games-thumbs/untangle.jpg"}, {"url": "/admin/admin.html", "description": "Configure storage, classes, access, and provider connections.", "icon": "/assets/favicons/admin.svg"}, {"url": "/parents/", "description": "Open family-facing access, privacy, and classroom connection tools.", "icon": "/assets/favicons/tools.svg"}, {"url": "/pages/background-templates.html", "description": "Browse ready-to-use classroom backgrounds and activity templates.", "icon": "/assets/icons/tools/adv-bg.svg"}, {"url": "/guides/", "description": "Find setup and classroom-use guidance for DrawSplat.", "icon": "/assets/favicons/docs.svg"}, {"url": "/pages/support.html", "description": "Get help with setup, self-hosting, deployment, and DrawSplat use.", "icon": "/assets/favicons/tools.svg"}];
  const routes=[
    [/whiteboard/, 'pen','Draw, explain ideas, and build a board together.'],
    [/admin\/admin|teacher-admin/, 'adv-settings','Connect classroom storage and manage teacher settings.'],
    [/writesplat/, 'text','Write and format documents with classroom tools.'],
    [/showsplat/, 'insert-image','Build slides and present your ideas.'],
    [/gridsplat/, 'insert-mosaic','Explore spreadsheets, data, and charts.'],
    [/listsplat/, 'adv-library','Organize records in a searchable database.'],
    [/imagesplat/, 'insert-image','Edit pictures, remove backgrounds, and create graphics.'],
    [/graphsplat/, 'insert-graph','Turn data into charts and picture graphs.'],
    [/videosplat/, 'insert-gif','Edit video and prepare it for sharing.'],
    [/studio\/?$|pages\/tools/, 'imagegroup','Browse and search all DrawSplat apps.'],
    [/games\/?$|games\/index/, 'insert-widgets','Find games for practice and play.'],
    [/google-setup|teacher-onboarding/, 'adv-cloud-sync','Follow the steps to connect your classroom to Google.'],
    [/guides\/?$|pages\/support/, 'adv-library','Find step-by-step guides and help.'],
    [/parents/, 'adv-group','Find classroom access tools for families.'],
    [/community/, 'adv-group','Share ideas and explore the community board.'],
    [/background-templates/, 'adv-bg','Choose a ready-made background for your board.'],
    [/features/, 'imagegroup','Explore what you can create with DrawSplat.'],
    [/pricing/, 'adv-library','Compare plans and included features.'],
    [/download/, 'adv-save','Get DrawSplat for your own hosting.'],
    [/contact|access\.html/, 'text','Send a question or request access.'],
    [/legal|compliance/, 'adv-lock','Read privacy, accessibility, and school policies.'],
    [/blog/, 'text','Read updates and tips for using DrawSplat.']
  ];
  const rules=[
    [/how to play/i,'insert-widgets','Learn the goal, controls, and a strategy for this game.'],
    [/generate.*qr|build.*qr/i,'insert-mosaic','Create a scannable QR code from your content.'],
    [/\bbold\b/i,'text','Make selected text stand out with heavier letters.'],
    [/\bitalic\b/i,'text','Slant the selected text for emphasis.'],
    [/underline/i,'text','Add a line beneath the selected text.'],
    [/strikethrough/i,'text','Draw a line through selected text.'],
    [/fullscreen|full screen/i,'imagegroup','Expand the workspace to fill your screen.'],
    [/presentation|slideshow|present deck/i,'insert-image','Show your slides to an audience.'],
    [/start|play|resume/i,'insert-gif','Begin or continue the activity.'],
    [/pause|stop/i,'adv-stop','Pause the current activity.'],
    [/settings|options|preferences/i,'adv-settings','Adjust how this app works for you.'],
    [/link|hyperlink/i,'text','Add a clickable website link.'],
    [/table/i,'insert-mosaic','Organize information in rows and columns.'],
    [/insert.*(row|column)|add.*(row|column)/i,'insert-mosaic','Make room for more data in your table.'],
    [/filter/i,'adv-library','Show records that match your criteria.'],
    [/sort/i,'adv-library','Put your data in the order you choose.'],
    [/formula|function/i,'insert-graph','Calculate a result from your data.'],
    [/format|style/i,'text','Change the appearance of selected content.'],
    [/zoom/i,'imagegroup','Adjust how large your workspace appears.'],
    [/reset|restart/i,'trash','Start the activity again.'],
    [/shape|rectangle|circle|arrow/i,'shape-polygon','Add a shape to explain or decorate your work.'],
    [/chart|graph/i,'insert-graph','Turn your data into a visual comparison.'],
    [/emoji|sticker/i,'insert-emoji','Add a playful visual to your work.'],
    [/\bundo\b/i,'undo','Reverse your last change.'],[/\bredo\b/i,'redo','Restore the change you just undid.'],
    [/keyboard|shortcut/i,'adv-library','See keys that speed up common actions.'],
    [/\bprint\b|pdf/i,'adv-save','Prepare a printable copy of your work.'],
    [/\bexport\b/i,'adv-save','Download your work in the selected format.'],
    [/\bimport\b/i,'adv-library','Bring a saved file into this app.'],
    [/\bsave\b|download/i,'adv-save','Keep a copy of your work for later.'],
    [/duplicate|copy/i,'adv-copy','Make a copy of the selected content.'],
    [/delete|remove|clear/i,'trash','Remove the selected content.'],
    [/\bnew\b/i,'pen','Start a fresh piece of work.'],
    [/\bimage\b|picture|photo/i,'insert-image','Add a picture to your work.'],
    [/template|background/i,'adv-bg','Choose a ready-made starting point.'],
    [/\bchart\b|graph/i,'insert-graph','Visualize your data as a graph.'],
    [/\bhelp\b|guide|tutorial/i,'adv-library','Find instructions and tips for this app.'],
    [/\bfind\b|search/i,'text','Locate content in your work.'],
    [/bring.*forward|front/i,'adv-front','Move the selection in front of other items.'],
    [/send.*back|backward/i,'adv-back','Move the selection behind other items.'],
    [/align/i,'adv-group','Line up the selected items.'],
    [/\bgroup\b/i,'adv-group','Keep selected items together as one group.'],
    [/\btext\b/i,'text','Add or format text in your work.'],
    [/\bopen\b|library/i,'adv-library','Choose saved work to open.']
  ];
  function explain(el){
    if(el.closest('.whiteboard-ui')||el.classList.contains('ds-action-card')||el.matches('.studio-nav-heading, .studio-nav-icon-card, [data-no-action-card]'))return;
    const label=(el.textContent||el.getAttribute('aria-label')||'').trim();
    let info=descriptions[el.dataset.action]||descriptions[el.id];
    if(!info&&labelDescriptions[label]){
      const shapes={Star:'shape-star',Oval:'shape-ellipse',Ellipse:'shape-ellipse',Square:'shape-rect',Box:'shape-rect',Diamond:'shape-polygon',Pentagon:'shape-polygon',Line:'shape-line',Freehand:'pen'};
      const icon=shapes[label]||(/video|audio|song/i.test(label)?'insert-gif':/crop|blur|sharpen|sepia|grayscale|invert|pixelate|lighten|darken|screen|cubism/i.test(label)?'insert-image':/record|field|view|layout|relationship/i.test(label)?'insert-mosaic':/slides|slide|master|header/i.test(label)?'insert-image':/distribute/i.test(label)?'adv-group':'text');
      info=[icon,labelDescriptions[label]];
    }
    if(!info&&/^Heading [1-6]$/.test(label))info=['text','Apply this heading level to organize your document.'];
    if(!info&&el.closest('.templates-menu'))info=['insert-image','Add a slide with this ready-made layout.'];
    if(!info&&/archived records/.test(label))info=['adv-library','Show or hide records you have archived.'];
    if(!info&&el.matches('a[href]')){
      const url=new URL(el.href).pathname;
      const tool=toolRoutes.find(t=>new URL(t.url,location.origin).pathname.replace(/\/$/,'')===url.replace(/\/$/,''));
      if(tool)info=[tool.icon,tool.description];
      else {const route=routes.find(([test])=>test.test(url));if(route)info=route.slice(1);}
    }
    if(!info){const rule=rules.find(([test])=>test.test(label+' '+(el.dataset.action||'').replace(/-/g,' ')));if(rule)info=rule.slice(1)}
    // Existing app titles supply more specific explanations when available.
    const title=el.getAttribute('title');
    if(title&&title.length>label.length+10)info=[info?.[0]||'adv-library',title];
    if(!info)return;
    el.classList.add('ds-action-card');
    el.dataset.actionDescription=info[1];
    el.setAttribute('aria-description',info[1]);
    const icons={'adv-library':'adv-library.svg','adv-group':'adv-group.svg','adv-bg':'adv-bg.svg','adv-save':'adv-cloud-down.png','adv-copy':'adv-group.svg','adv-settings':'adv-lock.png',undo:'adv-back.png',redo:'adv-front.png'};
    el.style.setProperty('--ds-action-icon',`url("${new URL(info[0].includes('/')?info[0]:'icons/tools/'+(icons[info[0]]||info[0]+'.png'),info[0].startsWith('/')?location.origin:assetRoot)}")`);
  }
  function enhance(root){
    if(root.nodeType!==1&&root!==document)return;
    if(root.matches?.(actions))explain(root);
    root.querySelectorAll(actions).forEach(explain);
    if(root.matches?.('.menu-popover[role="menu"]'))positionReactMenu(root);
  }
  // Observe added UI only; attribute changes and canvas rendering are excluded.
  const observer=new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1&&!node.closest('svg,canvas,.whiteboard-ui'))enhance(node);
  });
  enhance(document);observer.observe(document.body,{childList:true,subtree:true});
  function positionReactMenu(panel){
    const trigger=panel.closest('.dropdown-menu')?.querySelector(':scope > button');
    if(!trigger)return;
    const rect=trigger.getBoundingClientRect(),width=Math.min(350,innerWidth-24);
    panel.style.setProperty('--ds-menu-left',Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px');
    panel.style.setProperty('--ds-menu-top',Math.min(rect.bottom+8,innerHeight-180)+'px');
    panel.style.setProperty('--ds-menu-width',width+'px');
  }
  function positionMenu(menu){
    const trigger=menu.querySelector(':scope > summary, :scope > button');
    const panel=menu.querySelector(':scope > .menu-panel, :scope > .landing-nav-menu');
    if(!trigger||!panel)return;
    const rect=trigger.getBoundingClientRect(),width=Math.min(350,innerWidth-24);
    panel.style.setProperty('--ds-menu-left',Math.max(12,Math.min(rect.left,innerWidth-width-12))+'px');
    panel.style.setProperty('--ds-menu-top',Math.min(rect.bottom+8,innerHeight-180)+'px');
    panel.style.setProperty('--ds-menu-width',width+'px');
  }
  const menuSelector='details.menu, details.landing-nav-dropdown, .menu:has(> button + .menu-panel)';
  function closeMenus(except){document.querySelectorAll(menuSelector).forEach(menu=>{
    if(menu===except||menu.contains(except))return;
    if(menu.matches('details'))menu.open=false;
    menu.classList.remove('ds-menu-open');
    const button=menu.querySelector(':scope > button');if(button)button.setAttribute('aria-expanded','false');
  })}
  document.addEventListener('toggle',event=>{if(event.target.matches?.('details.menu,details.landing-nav-dropdown')&&event.target.open){closeMenus(event.target);positionMenu(event.target)}},true);
  document.addEventListener('click',event=>{
    const menu=event.target.closest(menuSelector);
    closeMenus(menu);
    if(!menu)return;
    positionMenu(menu);
    const button=event.target.closest('.menu > button');
    if(button&&button.parentElement===menu){const open=menu.classList.toggle('ds-menu-open');button.setAttribute('aria-expanded',String(open))}
    else if(!menu.matches('details')&&event.target.closest('.menu-panel button,.menu-panel a')){menu.classList.remove('ds-menu-open');menu.querySelector(':scope > button')?.setAttribute('aria-expanded','false')}
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenus(null)});
  window.addEventListener('resize',()=>closeMenus(null));
})();
