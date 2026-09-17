# Student-friendly whiteboard

## Start a focused lesson

Open **Options → Choose how much you see → Student lesson tools**. Choose a starting view, pick Everyday drawing, Art and coloring, Draw/type/explain, or Graphs and data, then adjust individual tools. Save lesson tools. Move remains available so students can select and edit their work.

The choices are stored in the board JSON and classroom room state. **Copy Student Link** also includes the starting view and selected tools. Students can change views without enabling tools outside the lesson’s selection. TNT is off for students by default; when enabled, it clears only their editable work and preserves teacher items and backgrounds.

- **Beginner:** large labeled everyday buttons and a roomy canvas.
- **Growing:** compact drawing tools and explained menus.
- **Full:** the existing full editing panels.

## Support different responses

**My response** offers drawing, typing, or a voice recording when those tools are enabled. Recording asks for microphone access and releases the microphone when stopped or the recording dialog closes. Closing an active recording keeps the answer; closing while permission is pending cancels recording. Recorded notes have Play, Pause, and Stop controls directly on the canvas in every view. Empty editable notes offer Record my voice directly on the card. Playback buttons have larger touch targets. Elapsed time and a playback-position slider make it easy to replay a particular part; length appears when available. Pause keeps your position; Stop returns to the beginning. Playback continues through redraws and stops when its note is removed or its page is left. **Show me how** offers tool instructions, short drawing and editing demonstrations, and optional read-aloud when the browser supports speech synthesis. Animations respect reduced motion.

**Find an item** lists page objects, including text where available. Selecting an item focuses the canvas: arrow keys move editable items and Enter edits text. Teacher-layer items remain protected. Beginner and touch input use larger resize handles.

Select an item, then choose **Edit selected item** (or **Actions** on the floating selection bar). Explained cards offer Edit words, Make a copy, Bring forward, Send backward, and Remove item. **Move a little** provides Small step and Bigger step direction buttons. Protected selections disable editing; mixed selections change only editable items. **Done selecting** clears the selection. Pencil strokes and their clipping regions move together, and both button and keyboard movement can be undone.

**Move view** pans the workspace without changing object positions. **Center view** resets the view. Downloads use the board coordinates rather than the temporary pan offset.

## Recover mistakes and submit work

Clearing a page, TNT, and resetting the board save a recovery checkpoint. **Undo clearing** restores the previous state immediately; recovery checkpoints persist with the board and can also be opened through File → Restore Point.

The device-save indicator explicitly says **Saved on this device**. Classroom saving has its own indicator and only reports success after the server confirms. Changes made during an older save stay marked unsent.

**Check & turn in** asks students to add their name and confirm they reviewed their work before sending. The dialog shows Check / Send / Received, prevents duplicate sends while a request is pending, and reports Received only after server confirmation. Failed or timed-out sends can be retried, and a Download a backup button stays available. Live verification mocks classroom requests rather than writing test submissions to a real classroom.

## Lesson starters

**Lesson starters** creates a new page for Draw and explain, Compare two ideas, Label this picture, or Show your math. Existing pages stay intact. Prompts use the teacher layer, and the initial response tool set includes drawing, typing, arrows, pictures, and voice notes.

## Picture buttons and fun stamps

The toolbar now separates **ADD** (a picture with a plus, for pictures and learning tools) from **PAGE** (a page with a paint roller, for backgrounds and reveal effects). The Add menu includes Add Image, Coloring Book, Graph Creator, Picture Graph, Classroom Widgets, and Dot Pictures.

Choose **Stamps** from the toolbar or everyday tool row. Eight searchable trays contain 80 named stamps: Animals, Nature, Space, School, Food, Sports, Music, and Silly. Recent remembers up to 12 picks on this device. Pick a stamp, choose Small/Medium/Large, and tap repeatedly to place it. The active strip offers Change stamp, Stamp in middle, and Done stamping. Desktop pointers show a faint placement preview that never enters saves or downloads. Turn left/right rotates by 45 degrees; Flip stamp mirrors the picture. Reset stamp returns to Medium size with no rotation or flip. Placed stamps retain their orientation in board saves. With the canvas focused, Enter or Space stamps in the middle, and Escape returns to Move.

Stamps have transparent backgrounds and stay separate editable objects. Each placement can be undone; stamps persist in board saves and classroom state. Student stamps use the student layer and owner. The teacher’s Pictures and Stamps lesson setting controls access. Built-in stamps use emoji artwork provided by the device, so appearance can vary between operating systems.

## Coloring for younger learners

Choosing a coloring page opens a dedicated **Color my picture** station above the canvas. Ten big named color swatches, **Fill a space**, **Brush**, **Undo color**, and **Done coloring** replace the crowded floating image toolbar. New pages start with Fill a space and fit the available canvas, including phones. Brush shows Small, Medium, and Big brush buttons. Custom colors, Spray paint, and Picture options live under More colors & tools. Undo keeps the picture selected so children can keep coloring.

**ADD → Dot Pictures** opens the dot-picture picker. **Color my dot picture** then offers the same named swatches and **Paint dots** with “Pick a color. Tap or drag over the dots.” A single tap applies the chosen color without opening another palette. Dot Paint no longer occupies the Draw menu. Picture options selects the entire dot picture. Pictures-enabled student lessons allow dot coloring; teacher-protected dots remain read-only.

The everyday toolbar above the canvas has illustrated Undo, Redo, and Audio controls alongside the learner helpers. Undo and the former “Undo that” action were identical; there is now one visible Undo button. Audio toggles sound effects, without muting recorded audio notes. Stamps has one larger entry on the left; Beginner view brings that same button into its top drawing tools because the sidebar is hidden. Paint Bucket, Delete Selected, and TNT have direct left-toolbar buttons; TNT keeps its confirmation and classroom permission controls.

Choose **Stamps → Chemistry** for labeled atoms, H₂O, O₂, CO₂, and other common molecules, ionic-lattice and subatomic-particle models. Search using either plain formulas (`H2O`) or subscripts (`H₂O`), names, or geometry names. Chemistry stamps start larger for readable symbols. The tray explains bond and wedge notation; the models support [TEA’s chemistry progression](https://tea.texas.gov/curriculum-and-instruction/curriculum-standards/k-12-vertical-alignment-chemistry.pdf).

**Lesson starters → Built-in layouts** includes all nine built-in layouts, with descriptions. Each starts a named new page and keeps existing pages intact. The original Tools menu still offers the same layouts for the current frame or a new frame.

## Teacher and student entry views

On first entry, **Are you a teacher or student?** offers two illustrated choices. Teacher view exposes lesson starters and teaching controls; student view follows this board’s lesson tools and starting view. DrawSplat remembers the choice on this browser. Click **Teacher view** or **Student view** above the canvas to change it later. The choice changes the interface and is not authentication; Teacher Admin keeps its password. Student classroom links skip the chooser, remain in student mode, and retain the teacher’s assigned tools.

## Short video notes

Teachers can choose **Video note** above the canvas. To allow student recording, open **Options → Student lesson tools**, check **Video notes (allow student recording)**, and save the lesson tools. The permission is stored in board files and student links; it starts off for students. Existing teacher video notes remain playable when recording is off.

Click **Record** to request the camera and optional microphone. Clips stop at 30 seconds or 5 MB. Stop turns off the camera, then lets you watch, retake, name, describe, and add the clip. Closing, changing tabs, or leaving the page also releases the camera. Added cards offer Play, Pause, Stop, and native seeking/volume controls. Move or resize the card using its title. Recorded sound is unaffected by the sound-effects Audio switch. Saved board JSON and classroom state retain the clip; PNG/PDF exports show its still picture. Recording formats depend on the browser; use a current browser that supports WebM or MP4.

For existing Google classrooms, replace the copied Apps Script with the current `apps-script/Code.gs` and update its web-app deployment to enforce the teacher’s video setting in room merges. Publishing DrawSplat updates the installer’s script, but cannot update scripts already installed in educators’ Google accounts.

### Easier recording and lesson setup

**Student tools** above the canvas opens the teacher’s lesson settings directly, including the video-recording checkbox. It is hidden in student view.

Video notes now show a **Record → Watch → Add** guide and a progress bar with seconds remaining. After stopping, **Watch clip**, **Try again**, **Discard clip**, and **Add to board** give clear next steps. Closing a reviewed clip changes the toolbar action to **Finish video**, so the unfinished recording is easy to find. Naming and descriptions are under **Name & describe (optional)**, keeping the phone recording controls visible. Stopped recordings are kept locally and can be recovered after a browser reload, until the draft expires. Adding or discarding resets the title and description for a fresh note. Playing another voice or video note pauses other note playback and preserves its position.

### Review a voice answer

Choose **My response → Record my voice**, record up to one minute, then press **Stop**. Use **Listen** and the audio controls to review or pause. Choose **Try again**, **Discard**, or **Add to board**. Recording does not create an empty board item, and adding a finished answer creates one undo step.

Closing the recorder stops recording and releases the microphone. The **Finish voice** button returns to an unfinished recording, including a stopped recording recovered after a refresh. The draft status tells you when local recovery is ready. Return to the original board page before adding a draft. Teachers control student access to audio in **Student tools**. Voice and video recording cannot run together.

### Choose and name a response

**My response** now shows illustrated cards explaining drawing, typing, voice, and video. Only methods allowed by the lesson appear. If none are available, the dialog explains this.

Voice recording includes **Name my note (optional)**. The name appears on the finished audio card and in **Find an item**, and stays in saved boards. If you open a voice draft from another page, **Return to my recording page** takes you back before adding it.

### Recover unfinished recordings

After stopping, wait for **kept on this device**. A refreshed page restores **Finish voice** or **Finish video**, without opening the microphone or camera. Names and video descriptions are recovered too. **Add** and **Discard** remove the recovery copy. Drafts are specific to the board, teacher/student view, student name, and classroom link context. Student recording permissions are checked again before recovery. Drafts expire after the configured browser-session duration (24 hours by default, capped at seven days), and an expired browser-only session clears recovery storage.

An active recording or a draft still being saved prompts before you leave. If browser storage fails, the recorder asks you to add the recording before leaving. Recovery stays on this browser and device; adding a note keeps it in the board for sharing or saving a file.

Video drafts now offer **Return to my recording page** when opened from a different page. Voice notes, video notes, and their review players pause one another so only one plays at a time. Pause keeps the current position. Recording pauses existing note playback.

## Private MySQL online saving

When your school configures MySQL saving, **File → Save online** keeps a private copy in your signed-in saving account. **Open online board** lists your own saved work; saving is explicit, so device autosave alone does not upload changes. Add voice/video notes to the board before saving them online.

A student link configures the saving service and lesson tools; it does not open the teacher’s private board. Your school supplies student accounts. Google classroom turn-in and shared-room sync are separate features.

If another device saved a newer copy, keep your work with **Save File**, then open the online copy before continuing. On shared devices, use **File → Online account → Sign out**; signing out leaves device copies, so follow your school’s device cleanup routine.
