# DrawSplat&trade; — Setup

Pick the scenario that matches what you're trying to do. Each one is its own focused doc — no need to read the others.

## Which one are you?

| If you want… | Use this | Roughly how long |
|---|---|---|
| A single-user / projector / "just let me draw" deployment with no accounts and no backend. | [**Browser-only**](setup-browser.md) | 1 minute |
| Cloud saves to Google Drive + Sheets, classroom collaboration rooms, student turn-ins, the full Compliance Console, parent request center. **The supported production path today.** | [**Google Apps Script**](setup-google-apps-script.md) | 10–15 minutes |
| A self-hosted, district-scale deployment with a real database, true RBAC, and your own infrastructure. **Scaffolded but not yet production-ready.** | [**MySQL backend**](setup-mysql.md) | 15–30 minutes (Docker) |

## Common follow-ups after setup

| You want to… | Read this |
|---|---|
| Configure compliance features (Activity Records, Age Band Lock, Family Access Tools, retention, time limits). | [`COMPLIANCE.md`](COMPLIANCE.md) |
| Stand up the Community board (`/community/`) with Google + Microsoft sign-in. | [`../community/Setup.md`](../community/Setup.md) |
| See the architecture roadmap (what's done, what's parked, what's deferred). | [`../COMPLIANCE-ROADMAP.md`](../COMPLIANCE-ROADMAP.md) |

## Three modes side-by-side

If you're not sure which scenario fits, here's the same picture from a different angle:

| Capability | Browser-only | Apps Script | MySQL |
|---|---|---|---|
| Draw, autosave locally | ✅ | ✅ | ✅ |
| Export PNG / PDF / JSON | ✅ | ✅ | ✅ |
| Cross-device cloud saves | ❌ | ✅ | ✅ |
| Collaboration rooms (shared boards) | ❌ | ✅ | ✅ |
| Student turn-ins | ❌ | ✅ | ✅ |
| Activity Records (audit log) | ❌ | ✅ | ✅ |
| Safety filters server-enforced | ❌ (client-side only) | ✅ | ✅ |
| Age Band Lock + Family Access Tools | ❌ | ✅ | ✅ |
| Time-limit enforcement | ❌ | ✅ | ✅ |
| District Privacy Packet | ❌ | ✅ | ⚠️ TODO |
| Google / Microsoft SSO | ❌ | ✅ (community only) | ⚠️ TODO |
| True role-based access (RBAC) | ❌ | ⚠️ limited | ✅ |
| Real-time session enforcement | ❌ | ❌ (polling only) | ⚠️ TODO |
| Scale ceiling (rough) | 1 user | hundreds | thousands |
| Infrastructure you have to run | none | none (uses your Google account) | a Linux server, MySQL, reverse proxy |
| Cost | free | free | server cost |

⚠️ = scaffolded but needs work before it's production-ready. ❌ = not feasible in that mode.

## The free-pricing posture

DrawSplat&trade; is free under AGPL-3.0-or-later. Every mode above costs $0 in software. If your district wants paid **setup, professional learning, or compliance review**, that's a separate service — see [pricing](../pages/pricing.html). Otherwise, pick a setup doc above and you're done.
