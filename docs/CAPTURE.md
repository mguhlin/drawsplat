# DrawSplat&trade; District Reviewer Evidence Capture Guide

This file is the operator checklist for replacing the placeholders in [legal/ndpa-packet.html &sect; 12 — Evidence gallery](../legal/ndpa-packet.html#section-12) with real screenshots from your DrawSplat&trade; deployment.

Each capture should reflect **your district's own deployment** (your spreadsheet, your roster, your audit log), not a generic preview. Once captured, drop each file into `legal/evidence/<capture-key>.png` and swap the matching `<div class="evidence-placeholder" data-capture="...">` element for an `<img src="evidence/<capture-key>.png" alt="...">`.

## Browser setup

- **Browser zoom**: 100% (default).
- **Window width**: 1440 px wide is a good default; the Compliance Console renders cleanly at 1280–1600.
- **Theme**: default light theme; don't capture in inverted-colors / dark-mode browser plugin.
- **Device pixel ratio**: 1× is fine. 2× retina is also fine — the Pages CSS caps `img { max-width:100% }` so dimensions don't matter for layout.
- **Crop**: use the browser's built-in screenshot tool (Firefox: right-click → "Take a screenshot"; Chrome devtools: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> → "Capture node screenshot") to grab just the relevant panel, not the whole viewport with tabs.
- **PII**: blur or replace any student name, parent email, classroom code, or board title before saving the PNG. The District Privacy Packet capture is the only one that *should* contain real data — and only if your district is comfortable with the reviewer seeing it.

## The six captures

### 1. `compliance-console-overview.png` — Compliance Console overview

**Where**: Teacher Admin → Compliance Console.
**State**: every `<details>` collapsed except the heading. The bullet list of subsections (Safety Review, Image Approval Queue, Family Access Tools, …) should be visible.
**What it proves**: every safeguard is one page, expandable per reviewer interest.

### 2. `image-approval-queue.png` — Image Approval Queue

**Where**: Teacher Admin → Compliance Console → Image Approval Queue (Days 1.3 / 1.4) → Load Image Queue.
**State**:
- "Require teacher approval for student image uploads" checkbox: **ON**.
- Status filter: **Pending**.
- At least two pending rows visible, each with a thumbnail, uploader name (blurred), and the Approve / Reject buttons.
**Setup**: in a separate browser window, open the whiteboard as a student (`?role=student`), upload two test images, then come back to the Compliance Console and refresh.
**What it proves**: the moderation step between student upload and student-visible image is live, not theoretical.

### 3. `family-access-queue.png` — Family Access Tools request queue

**Where**: Teacher Admin → Compliance Console → Family Access Tools → Load Requests.
**State**: at least one verified request visible (status `verified` or `approved`), with the Approve / Decline / Note controls visible.
**Setup**: submit a test request at `/parents/` using `studentName: "Test Student"`, then use the teacher-issued code from the student row to verify it.
**What it proves**: the parent-request workflow is end-to-end, not a static form.

### 4. `audit-records.png` — Activity Records (audit log)

**Where**: Teacher Admin → Compliance Console → Activity Records.
**State**:
- Date range: **last 7 days**.
- Filter: empty (so the page shows mixed actions).
- At least one row each of `BOARD_FREEZE`, `TEXT_FILTER_HIT`, `IMAGE_APPROVED`, `PARENT_REQUEST_CREATED`, `DATA_EXPORT` visible.
**Setup**: trigger each action once in the day before capturing — easiest is a scripted "demo run" the operator does once and then captures.
**What it proves**: every compliance-relevant action leaves an immutable trail.

### 5. `privacy-packet-download.png` — District Privacy Packet download

**Where**: Teacher Admin → Compliance Console → District Privacy Packet.
**State**: capture the moment after clicking **Download District Privacy Packet** — the toast / status line should show "Packet downloaded (N bytes, M audit rows, K parent requests)" and the download bar should still be visible.
**What it proves**: the one-click ZIP exists and includes the compliance config + last 90 days of audit + parent-request log.

### 6. `data-export-delete.png` — Per-student Export / Delete

**Where**: Teacher Admin → Compliance Console → Student Age Band Lock → Load Students.
**State**: at least one row visible, expanded enough to show the Export Data button (green) and Delete Data button (red).
**Setup**: blur the student name first.
**What it proves**: FERPA-style inspect / correct / delete rights are live; an admin can run them per-student without engineering involvement.

## Filing the PNGs

```
legal/
  evidence/
    compliance-console-overview.png
    image-approval-queue.png
    family-access-queue.png
    audit-records.png
    privacy-packet-download.png
    data-export-delete.png
```

Then in `legal/ndpa-packet.html`, replace each placeholder:

```html
<!-- before -->
<div class="evidence-placeholder" data-capture="image-approval-queue">…</div>

<!-- after -->
<img src="evidence/image-approval-queue.png" alt="Image Approval Queue with two pending uploads showing thumbnails and Approve / Reject buttons.">
```

Keep the alt text descriptive — the page is going to a district reviewer who may be using a screen reader, and the alt text is what they hear in lieu of the screenshot.

## Suggested cadence

Re-capture every release where the relevant UI changes (`legal/`, `admin/`, `assets/js/admin.js`, `assets/js/app.js`, `apps-script/Code.gs` substantially). Don't auto-screenshot from a CI job — the captures are evidence, not artifacts, and stale ones are worse than no ones.
