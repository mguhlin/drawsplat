# DrawSplat Google Setup

These steps configure the optional Google Apps Script backend for Drive saves, cloud rooms, templates, and turn-ins.

## 1. Create The Google Backend

1. Create a Google Sheet named **DrawSplat Saves**.
2. Open **Extensions > Apps Script**.
3. Paste the contents of `apps-script/Code.gs` into Apps Script.
4. Save the project.
5. Run the `setup()` function once.
6. Approve the requested Google Drive and Google Sheets permissions.

The setup function creates or prepares:

- a Drive folder named **DrawSplat Saves**
- a `Boards` sheet
- a `Rooms` sheet
- a `Templates` sheet
- a `TurnIns` sheet

## 2. Deploy The Web App

1. In Apps Script, choose **Deploy > New deployment**.
2. Select **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to the narrowest option that works for your class or district.
5. Deploy.
6. Copy the Web App URL.
7. Paste the URL into DrawSplat under **Options > Google integration > Script URL**.

For a hosted classroom deployment, you can place that URL in `DEFAULT_GOOGLE_SCRIPT_URL` near the top of `assets/js/app.js`. That keeps students from needing a `script=` value in shared links.

## 3. Teacher Classroom Workflow

1. Open DrawSplat.
2. Switch to **Education Tools**.
3. Enable assignment mode.
4. Create the panels needed for table groups.
5. Add backgrounds, templates, prompts, or teacher-layer content.
6. Enter a unique room name in **Collaboration**.
7. Optionally enter a room password.
8. Start **Cloud Sync**.
9. Click **Copy Student Link**. DrawSplat generates the student URL for the current room and copies it to the clipboard.
10. Share the copied link with students.

Each room name acts as a unique shared whiteboard instance. The generated student link includes `role=student` and the room name so students open directly into the correct shared board.

## 4. Student Workflow

Students open the copied link. The link uses `role=student`, which locks DrawSplat into student mode.

Students can add:

- sticky notes
- images
- drawings
- text
- Mermaid diagrams
- word clouds

Students cannot use the student link to:

- edit the Google Apps Script URL
- change panel backgrounds
- clear panels
- add panels
- edit teacher-layer objects

## 5. How Saving Works

Teacher saves initialize or update the full room board.

Student saves are merged by the Apps Script backend. The backend preserves:

- teacher panel backgrounds
- teacher-layer objects
- existing student-layer objects from other students

Room passwords are stored as salted SHA-256 hashes in the Google Sheet, not as plain text.

## 6. Security Notes

The room password is a classroom access gate, not a full identity system.

Google login and account-level access are controlled by the Apps Script deployment setting. For real student authentication, deploy the Web App using the narrowest access setting allowed by your school or district.
