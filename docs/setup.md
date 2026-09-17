# DrawSplat&trade; — Setup

Pick the scenario that matches what you're trying to do. Each one is its own focused doc — no need to read the others.

## Which one are you?

| If you want… | Use this | Roughly how long |
|---|---|---|
| A single-user / projector / "just let me draw" deployment with no accounts and no backend. | [**Browser-only**](setup-browser.md) | 1 minute |
| Cloud saves to Google Drive + Sheets, classroom collaboration rooms, student turn-ins, the full Compliance Console, parent request center. **The supported production path today.** | [**Google Apps Script**](setup-google-apps-script.md) | 10–15 minutes |
| Private account-owned online Save/Open using Railway, DigitalOcean, or an existing MySQL 8 server. | [**MySQL backend**](setup-mysql.md) | Depends on hosting |

## Common follow-ups after setup

| You want to… | Read this |
|---|---|
| Configure compliance features (Activity Records, Age Band Lock, Family Access Tools, retention, time limits). | [`COMPLIANCE.md`](COMPLIANCE.md) |
| Stand up the Community board (`/community/`) with Google + Microsoft sign-in. | [`../community/Setup.md`](../community/Setup.md) |
| See the architecture roadmap (what's done, what's parked, what's deferred). | [`../COMPLIANCE-ROADMAP.md`](../COMPLIANCE-ROADMAP.md) |

## Three modes side-by-side

If you're not sure which scenario fits, here's the same picture from a different angle:

| Capability | Browser-only | Apps Script | MySQL connection |
|---|---|---|---|
| Drawing, device autosave, file/snapshot export | Yes | Yes | Yes |
| Cross-device Save/Open | No | Yes | Yes, signed-in account’s private boards |
| Automatic shared-room sync | No | Yes | Not connected |
| Student turn-in and teacher review | No | Yes | Not connected |
| Cloud reusable template galleries / moderation | No | Yes | Not connected |
| Classroom Compliance Console and family workflow | No | Yes | Advanced backend modules require separate validation |
| Recording notes and device-local draft recovery | Yes | Yes | Yes; added notes are included in saved board JSON |
| Infrastructure to operate | None | Your Google deployment | Node.js 22 API + MySQL 8 + HTTPS |
| Software cost | Free | Free | Free; hosting/storage billed by your provider |

The MySQL setup wizard tests the API’s `private-boards-v1` capability before enabling
it. Create a teacher saving account, then use **File → Save online / Open online board**.
Student accounts must be school-provisioned. A student launch link configures saving;
it does not share the teacher’s board. See [the hosting guide](setup-mysql.md).

Switching providers does not migrate existing work or enable simultaneous saving to
both providers. Keep **Save File** backups. MySQL private boards retain their current
copy until deleted; browser timed sessions and recording drafts have separate expiry.
The published site needs a separately deployed API/database to use MySQL saving.

## The free-pricing posture

DrawSplat&trade; is free under AGPL-3.0-or-later. Every mode above costs $0 in software. If your district wants paid **setup, professional learning, or compliance review**, that's a separate service — see [pricing](../pages/pricing.html). Otherwise, pick a setup doc above and you're done.
