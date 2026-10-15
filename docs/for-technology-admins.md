# For technology admins

Set up SplatWorks for your school, connect accounts, and keep saved work safe. Choose the hosting path first, then test it with a teacher and student account.

## Choose your setup

| Setup | What it provides | Guide |
| --- | --- | --- |
| Browser only | Whiteboard tools and files saved on a device. No server or accounts are needed. | [Browser-only setup](../wiki/setup-browser.html) |
| Complete district suite | School-hosted apps, database-backed whiteboard saving, and classroom workflows. Choose Docker or a native install. | [District installation and Quick Start](../docs/district-selfhost.html) |
| Individual apps | Selected apps served from your own website. | [Modular self-hosting](../wiki/modular-selfhost.html) |
| Apps Script connection | Optional Google Drive and Sheets workflows. This is separate from district database hosting. | [Apps Script setup](../guides/google-setup.html) |

Get current packages from [Downloads](../pages/download.html). The complete SplatWorks suite includes DrawSplat, office apps, creative tools, widgets, and games; choose the components your school needs.

## Connect saving and school accounts

- Follow [MySQL / MariaDB setup](../guides/mysql-setup.html) to finish first-time setup and create the district administrator account.
- Set up [classrooms and rosters](../wiki/district-classrooms.html). Import a roster CSV or use supported Google school sign-in after configuring it.
- Review [Google OAuth permissions](../legal/google-oauth-disclosure.html). School sign-in and Google Drive access use different permissions.
- If you use Apps Script, follow the [Web App URL guide](../guides/apps-script-web-app-url.html) and the [technical reference](../wiki/setup-google-apps-script.html).

Teachers should use the school sign-in path you set up. Do not share the district administrator password with classrooms.

## Review privacy and access

Start with [Compliance and district review](../wiki/compliance.html). It explains which controls apply to each storage path. Use the [NDPA / DPA review packet](../legal/ndpa-packet.html) when reviewing an agreement.

The [Apps Script Compliance Console](../guides/compliance-guide.html) manages its own Google-backed workflows. It does not manage the district database’s private boards or classroom tables. Set and document your district’s access, retention, export, and deletion procedures.

Publish a clear contact and request process for families. The [Parents and students guide](../wiki/for-parents-and-students.html) explains where to start.

## Check before classroom use

- Confirm secure website access and the correct school sign-in settings.
- Test teacher and student access with separate accounts.
- Save a board, reopen it, and test an assignment and turn-in.
- Make a backup and test recovery. Restart the services and confirm saved work remains.
- Check the expected classroom load and review [known compliance gaps](../legal/compliance-gaps.html).

The installation guide includes backup, restart, and update steps. Keep passwords and backup files private. Hosting the SplatWorks apps does not automatically add database saving to each app.

## Maintain the service

Check [release notes](../pages/release-notes.html) before updates. Keep a backup, test changes, and confirm the school’s key workflows afterward. See [licensing](../wiki/licensing.html) for source and license duties, or [contact support](../pages/contact.html) for help.
