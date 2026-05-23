# DrawSplat&trade; Community Setup

DrawSplat&trade; Community is a streamlined, self-hosted bulletin board for the DrawSplat&trade; user community. Participants sign in with a display name and email, browse posts by category, start new threads, and reply to others. A single moderator queue keeps approvals manageable in one place.

| File | Purpose |
|---|---|
| `code.gs` | Google Apps Script backend. Stores Posts, Replies, and Users in a single spreadsheet. |
| `index.html` | Public board with category tabs, post composer, and inline replies. |
| `community.js` | All client-side logic for the public board. Kept external so the page can ship with a strict Content-Security-Policy. |
| `Admin.html` | Password-protected moderator console (centralized for posts **and** replies). |
| `admin.js` | Client-side logic for the moderator console. |
| `board.html` | Legacy redirect to `index.html`. |
| `Setup.md` | These setup instructions. |
| `../_headers` | Cloudflare Pages security headers, scoped to `/community/*` only. |

## Categories

The board ships with five categories. Names must match exactly in every file.

- **General** &mdash; introductions, announcements, community chat.
- **Classroom and Pedagogy** &mdash; lesson ideas, strategies, classroom workflows.
- **Tools** &mdash; talking about DrawSplat&trade; tools, integrations, tips.
- **Administration** &mdash; for school and district leaders rolling DrawSplat&trade; out.
- **Suggestion Box** &mdash; feature ideas, wish-list items, feedback.

To change them, edit the `ALLOWED_CATEGORIES` array in `code.gs` and the `CATEGORIES` constant in both `index.html` and `Admin.html`. Re-deploy the script as a new version after editing `code.gs`.

## Step 1 &mdash; Create the Apps Script project

1. Go to [script.google.com](https://script.google.com).
2. Click **New project**.
3. Rename the project (for example, `DrawSplat Community`).
4. Delete the starter code in `Code.gs`.
5. Paste in the contents of `code.gs` from this folder.
6. Save.

## Step 2 &mdash; Run setupNow once

1. In Apps Script, choose `setupNow` from the function dropdown.
2. Click **Run** and authorize the script.
3. The script creates a single spreadsheet named `DrawSplat Community` in your Drive with three tabs:
   - **Posts** &mdash; one row per post
   - **Replies** &mdash; one row per reply (linked to a post by `postId`)
   - **Users** &mdash; one row per registered account (email is the unique key)

## Step 3 &mdash; Set the moderator passcode and OAuth configuration

In Apps Script, open **Project Settings** &gt; **Script Properties**. Add the following properties.

**Required**

| Property | Value |
|---|---|
| `ADMIN_PASSCODE` | Any passcode of your choice, used to access `Admin.html`. |

**Sign-in (configure at least one of Google or Microsoft)**

| Property | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | The OAuth Web Client ID from Google Cloud Console (Step 3a). |
| `MICROSOFT_CLIENT_ID` | The Application (client) ID from your Azure App Registration (Step 3b). |

**Optional**

| Property | Value |
|---|---|
| `MODERATION_ENABLED` | `true` (default) or `false`. Can also be toggled from the moderator console. |
| `SESSION_SECRET` | Auto-generated on first `setupNow` if not set. You can override it with your own long random string to invalidate all existing sessions. |

### Step 3a &mdash; Create the Google OAuth Web Client

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and pick (or create) a project.
2. Open **APIs &amp; Services &gt; OAuth consent screen**, configure it as **External**, fill in the required fields, and publish it.
3. Open **APIs &amp; Services &gt; Credentials &gt; Create credentials &gt; OAuth client ID**.
4. Choose **Web application**.
5. Under **Authorized JavaScript origins**, add every origin you will host the board on, for example:
   - `https://drawsplat.org`
   - `http://localhost:5173` (for local testing)
6. **Authorized redirect URIs** can be left empty for this integration (Google Identity Services uses postMessage, not a redirect).
7. Click **Create** and copy the **Client ID**.
8. Set `GOOGLE_CLIENT_ID` in Apps Script Script Properties to that value, and also paste the same value into the `GOOGLE_CLIENT_ID` constant in `index.html`.

### Step 3b &mdash; Create the Microsoft App Registration

1. Go to the [Azure portal](https://portal.azure.com/) &gt; **Microsoft Entra ID** &gt; **App registrations** &gt; **New registration**.
2. Name: `DrawSplat Community` (or similar).
3. **Supported account types:** `Accounts in any organizational directory and personal Microsoft accounts` (or restrict to your tenant if you prefer).
4. **Redirect URI:** select **Single-page application (SPA)** and enter every origin you will host the board on, for example `https://drawsplat.org` (or the full page URL like `https://drawsplat.org/community/index.html`).
5. Click **Register** and copy the **Application (client) ID**.
6. Open the new app's **Authentication** blade and confirm the redirect URI is listed under **Single-page application**. Add any additional origins here.
7. Open **API permissions**, confirm the default `Microsoft Graph &gt; User.Read` (delegated) permission is present. No admin consent is required for this scope.
8. Set `MICROSOFT_CLIENT_ID` in Apps Script Script Properties to the Application (client) ID, and paste the same value into the `MICROSOFT_CLIENT_ID` constant in `index.html`.

If you want to restrict sign-in to a specific tenant (a single school district, for example), set the `MICROSOFT_TENANT` constant in `index.html` to your tenant ID instead of `'common'`.

## Step 4 &mdash; Deploy as a web app

1. Click **Deploy** &gt; **New deployment**.
2. Select **Web app**.
3. Use these settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**.
5. Copy the Web app URL (ends in `/exec`).

## Step 5 &mdash; Test the backend

Open the Web app URL with `?action=ping` appended. You should see JSON containing `ok:true`, the category list, the moderation state, and whether the passcode is set.

## Step 6 &mdash; Paste configuration into the HTML files

In `community.js`, the first four lines hold the configuration:

```javascript
const SCRIPT_URL = 'https://script.google.com/macros/s/.../exec';
const GOOGLE_CLIENT_ID = '1234567890-xxxxxxxx.apps.googleusercontent.com'; // or leave the PASTE_ placeholder to disable
const MICROSOFT_CLIENT_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';        // or leave the PASTE_ placeholder to disable
const MICROSOFT_TENANT = 'common';
```

Leaving a client ID as its `PASTE_...` placeholder disables that provider's button. You need at least one provider configured so users can sign in.

In `admin.js`, only `SCRIPT_URL` is needed (the moderator console uses the passcode, not OAuth).

## Step 7 &mdash; Host the static files

Place `index.html`, `Admin.html`, and `board.html` in the same folder. Host them on GitHub Pages, a static web host, or anywhere else &mdash; this folder ships as part of `drawsplat.org` under `/community/`.

## Step 8 &mdash; Test the workflow

1. Open `index.html`.
2. Click **Continue with Google** or **Continue with Microsoft**. Your provider verifies you and returns your name and email; the server then issues a 30-day session token and writes / updates your row in the **Users** sheet.
3. Click **+ New Post**, choose a category, write a title and message, and submit.
4. Open `Admin.html` in another tab, enter the moderator passcode, and approve your test post.
5. Refresh `index.html`, expand the post, and submit a test reply. Approve it from the moderator console.
6. Try **Hide**, **Edit**, **Delete**, and the **Toggle moderation** button.
7. With moderation **OFF**, new posts and replies appear immediately without approval.

## Centralized moderation

The moderator console is intentionally one combined queue:

- Default view shows **only pending** items so you can clear the queue quickly.
- Filter by **status** (pending / approved / hidden / all), **category**, or **type** (posts only / replies only / both).
- Each row carries actions: **Approve**, **Mark pending**, **Hide**, **Edit**, **Delete**.
- Deleting a post also removes its replies.
- The **Toggle moderation** button flips the global moderation switch.

## Security hardening

The community pages ship with the following baseline. Most of it is automatic; one item (the moderator passcode) is on you.

### Content-Security-Policy

`_headers` at the repo root applies a strict CSP to `/community/*` when served by Cloudflare Pages. The policy is scoped to the community folder &mdash; nothing else on the site is affected. Highlights:

- `script-src 'self' https://accounts.google.com https://*.gstatic.com https://cdn.jsdelivr.net` &mdash; no `'unsafe-inline'` for scripts. All of our JavaScript is in `community.js` and `admin.js` (external files). If any future XSS slipped past output escaping, the browser would refuse to execute an injected `<script>` block.
- `connect-src` allow-list restricts where the page can `fetch()` to (Apps Script, Google sign-in, Microsoft Graph, Microsoft login).
- `frame-ancestors 'none'` / `X-Frame-Options: DENY` prevent clickjacking by stopping other sites from embedding the board in an iframe.
- `Referrer-Policy: strict-origin-when-cross-origin` keeps sign-in tokens from leaking via referer headers.
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` is required for the Microsoft sign-in popup; it isolates the page from arbitrary cross-origin windows while still allowing MSAL's popup flow.

If you're hosting somewhere other than Cloudflare Pages, port the headers in `_headers` to your platform's equivalent (Netlify `_headers`, Vercel `vercel.json`, Nginx `add_header`, etc.).

### Microsoft token verification

In addition to calling Graph `/me` to confirm the token is signature-valid, the backend decodes the access-token JWT and requires:

- `appid` (or `azp`) equals your `MICROSOFT_CLIENT_ID`
- `iss` starts with `https://sts.windows.net/` or `https://login.microsoftonline.com/`
- `exp` has not passed

This closes the cross-app "confused-deputy" hole where a Graph access token issued to a different application could otherwise be replayed against the community.

### Moderator passcode

The `Admin.html` console is protected by a single passcode stored in `ADMIN_PASSCODE`. Apps Script has no built-in rate limiting, so passcode strength is the only line of defense against brute force.

- Use a **long random passcode** (16 characters or more, mixed character classes).
- A passphrase generator or a password manager is fine. Avoid anything memorable or dictionary-based.
- Do not reuse a passcode from anywhere else.
- Rotate it if you suspect exposure or after team changes.

### Rotating sessions

`SESSION_SECRET` is auto-generated on first `setupNow`. To invalidate every active community session at once (for example, after a suspected leak), open Script Properties and change `SESSION_SECRET` to any other long random string. Every existing session token immediately stops validating.

### Email + password sign-in

A third sign-in option lets users register an email and password without going through Google or Microsoft. It is enabled automatically once you run `setupNow`, and appears in the sign-in panel under **Or use email and password**.

**How passwords are stored**

- The Users sheet gains two columns: `passwordSalt` and `passwordHash`.
- Hashes are produced by iterated HMAC-SHA256 (default 100 iterations) of `salt:password`, keyed by a server-side **pepper** stored only in Script Properties (`PASSWORD_PEPPER`, auto-generated on first run).
- If the spreadsheet leaks but Script Properties stay private, offline cracking is infeasible &mdash; without the pepper an attacker can't compute matching hashes.
- If both leak, the iterated HMAC is still meaningfully harder to brute-force than a plain SHA-256 but is **weaker than bcrypt or argon2** (Apps Script has neither). Long, unique passwords still hold; weak passwords ("password123") would not.
- Raise iteration count by setting `PASSWORD_ITERATIONS` in Script Properties to a larger number (e.g. `200`, `500`). Sign-in latency goes up roughly linearly. Defaults to 100.

**Brute-force protection**

- Apps Script's `CacheService` tracks consecutive failed sign-ins per email.
- After 5 failures within 15 minutes the email is locked for 15 minutes.
- A successful sign-in or account creation clears the counter.

**Known limitations**

- **No password reset flow.** If a user forgets, a moderator must open the Users sheet and clear that user's `passwordHash` and `passwordSalt` cells. The user can then re-register with the same email.
- **No email verification.** Anyone can register `any@email.com`. Accounts attached to email addresses you do not control are not impersonation-proof; the moderation queue is still the line of defense for low-trust posts.
- **The pepper is load-bearing.** Treat `PASSWORD_PEPPER` like any other secret. If it leaks, rotate it &mdash; but be aware that rotating the pepper invalidates every existing password hash (every email/password user has to re-register).
- **Iteration count is conservative** because Apps Script has no native bcrypt/argon2 and HMAC iterations in JavaScript are slow.

**Moderator operations**

- Reset a user's password: clear `passwordSalt` and `passwordHash` on their row.
- Disable an account: change their email to something nonsense (e.g. prefix with `disabled_`); their session token will still work until it expires, so also rotate `SESSION_SECRET` if you need immediate cutoff.
- Promote an OAuth-only account to also have a password: not supported in the UI. The user would need a brand-new account.

## User accounts and security

Accounts are powered entirely by **Google Sign-In** or **Microsoft Sign-In** &mdash; the board never sees, stores, or transmits passwords.

- A participant clicks **Continue with Google** or **Continue with Microsoft**.
- The provider verifies the user and returns a short-lived token to the browser.
- The browser sends the token to your Apps Script backend. The backend verifies it directly with Google (`oauth2.googleapis.com/tokeninfo`) or Microsoft (`graph.microsoft.com/v1.0/me`).
- On success the backend writes / updates a row in the **Users** sheet (`id`, `name`, `email`, `provider`, `providerId`, `createdAt`, `lastSeen`, `postCount`, `replyCount`) and returns a **session token** signed with `SESSION_SECRET` (HMAC-SHA256, 30-day expiry).
- The browser caches the session token in `localStorage`. Every post or reply re-sends it and the backend re-verifies signature + expiry. Identity on each post (`authorName`, `authorEmail`) comes from the verified session, never from the form.
- **Sign out** clears the local session and signs the user out of MSAL where applicable. Rotating `SESSION_SECRET` invalidates every existing session at once.

Email addresses are still visible to moderators only &mdash; never on the public board.

## Troubleshooting

| Problem | Likely fix |
|---|---|
| Board says backend is not configured | Paste the Web app URL into `SCRIPT_URL` in both HTML files. |
| Submit fails with permission error | Set deployment access to **Anyone** and redeploy as a new version. |
| Admin says invalid passcode | Check the `ADMIN_PASSCODE` script property for typos or extra spaces. |
| Edits to `code.gs` are not live | Apps Script requires **Deploy &gt; Manage deployments &gt; Edit &gt; New version &gt; Deploy**. |
| Category rejected | Ensure category names match exactly in `code.gs`, `index.html`, and `Admin.html`. |
| Long content gets trimmed | Default limits: title 120 chars, post body 2000 chars, reply 1500 chars. Adjust in `code.gs` if needed. |
| Google sign-in does nothing when the button is clicked | Confirm the page's exact origin is listed under **Authorized JavaScript origins** in the Cloud Console OAuth client. The browser console shows the failing origin. |
| Microsoft sign-in fails with `AADSTS50011: redirect URI mismatch` | Add the page origin to the **Single-page application** redirect URIs in the Azure App Registration's Authentication blade. |
| Microsoft sign-in fails for personal accounts | In the App Registration, set **Supported account types** to include personal Microsoft accounts (or use the `consumers` tenant in `MICROSOFT_TENANT`). |
| Posts say "Please sign in" right after signing in | The Apps Script web app must be deployed with **Who has access: Anyone**, or the browser will be sending the token to a sign-in challenge instead of your script. |
| Want to invalidate every active session | Set or rotate the `SESSION_SECRET` script property to a new value. All previously issued session tokens immediately stop validating. |
