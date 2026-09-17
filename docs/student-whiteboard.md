# Student-friendly whiteboard

## Start a focused lesson

Open **Options → Choose how much you see → Student lesson tools**. Choose a starting view, pick Everyday drawing, Art and coloring, Draw/type/explain, or Graphs and data, then adjust individual tools. Save lesson tools. Move remains available so students can select and edit their work.

The choices are stored in the board JSON and classroom room state. **Copy Student Link** also includes the starting view and selected tools. Students can change views without enabling tools outside the lesson’s selection. TNT is off for students by default; when enabled, it clears only their editable work and preserves teacher items and backgrounds.

- **Beginner:** large labeled everyday buttons and a roomy canvas.
- **Growing:** compact drawing tools and explained menus.
- **Full:** the existing full editing panels.

## Support different responses

**My response** offers drawing, typing, or a voice recording when those tools are enabled. Recording asks for microphone access and releases the microphone when stopped or the recording dialog closes. Closing an active recording keeps the answer; closing while permission is pending cancels recording. **Show me how** offers tool instructions, short drawing and editing demonstrations, and optional read-aloud when the browser supports speech synthesis. Animations respect reduced motion.

**Find an item** lists page objects, including text where available. Selecting an item focuses the canvas: arrow keys move editable items and Enter edits text. Teacher-layer items remain protected. Beginner and touch input use larger resize handles.

**Move view** pans the workspace without changing object positions. **Center view** resets the view. Downloads use the board coordinates rather than the temporary pan offset.

## Recover mistakes and submit work

Clearing a page, TNT, and resetting the board save a recovery checkpoint. **Undo clearing** restores the previous state immediately; recovery checkpoints persist with the board and can also be opened through File → Restore Point.

The device-save indicator explicitly says **Saved on this device**. Classroom saving has its own indicator and only reports success after the server confirms. Changes made during an older save stay marked unsent.

**Check & turn in** asks students to add their name and confirm they reviewed their work before sending. The dialog shows Check / Send / Received, prevents duplicate sends while a request is pending, and reports Received only after server confirmation. Failed or timed-out sends can be retried, and a Download a backup button stays available. Live verification mocks classroom requests rather than writing test submissions to a real classroom.

## Lesson starters

**Lesson starters** creates a new page for Draw and explain, Compare two ideas, Label this picture, or Show your math. Existing pages stay intact. Prompts use the teacher layer, and the initial response tool set includes drawing, typing, arrows, pictures, and voice notes.
