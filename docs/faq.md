# Frequently asked questions (FAQs)

Find quick answers about DrawSplat and SplatWorks. Each answer links to a guide when you need more detail. Use **Search the wiki** to find a topic across all guides.

## Getting started

### What is DrawSplat?

DrawSplat is a browser-based whiteboard for teaching and creating. Draw, write, add images, organize pages, and record explanations. See [whiteboard features](../pages/features.html).

### Is DrawSplat free?

Yes. The software has no per-student or per-seat charge. Running a school server may have costs, and paid setup or training is optional. See [pricing](../pages/pricing.html).

### Do I need an account?

No account is needed for a browser-only board. School classrooms and private online saving need a configured service and a sign-in. Start with the [Teacher Quick Start](../guides/teacher-options-quick-start.html).

### Where do I open the whiteboard?

Use your school’s link, or choose **Apps → Whiteboard** on this site. You can also [open the whiteboard directly](../app/whiteboard.html).

### Which browser or device should I use?

Use an up-to-date browser and test it on the devices your class will use. A larger screen makes editing easier. Media recording needs browser permission; school device policies may block it. Check [accessibility and known limits](../legal/accessibility.html).

### Why does my board start with a white background?

A new board starts plain white so you can choose what your lesson needs. Add a grid, graph paper, or a template when useful. See [templates and backgrounds](../guides/templates-backgrounds.html).

## Saving and sharing

### Does DrawSplat save my work automatically?

Browser autosave keeps a draft in the current browser. It does not upload the board to a school account. For online storage, use **File → Save online** after signing in to your configured service. See [saving and exporting](../guides/saving-exporting.html).

### How do I keep a backup of my board?

Use **Save File** to download a `.drawsplat.json` board. Keep it somewhere you can find again, then use **Load File** to reopen it. PNG and PDF exports are useful for sharing, but keep a board file for later editing.

### Can I open my board on another device?

Yes. Move a saved board file to that device, or use your school’s online Save/Open service. Browser autosave alone does not move between devices. See [online saving](../guides/mysql-setup.html).

### Why is my work missing on a shared device?

The device may use a different browser profile or clear browser data when you sign out. Private browsing also uses temporary storage. Check your saved files and online boards; ask the school for help before clearing anything else. See [browser-only setup](../wiki/setup-browser.html).

### How do I share work or turn in an assignment?

Follow your teacher’s directions. You may export a file, turn in a district assignment, or use a configured Apps Script room. These are separate sharing paths. See [collaboration and turn-ins](../guides/collaboration-turn-ins.html).

### Are audio and video notes included in an online board?

Yes, when you add the finished recording to the board and save it online. A recording draft stays local until added and saved. The district service’s default board limit is 20 MB, so long recordings may be too large. See [what gets saved](../guides/mysql-setup.html#what-gets-saved).

### What should I do if another device saved a newer version?

Save your current work to a local board file first. Then reopen the online copy and decide which changes to keep. Do not discard a draft before you have a backup. See [saving and exporting](../guides/saving-exporting.html).

## School accounts and classrooms

### How does a teacher get started at a self-hosted school?

Open the school’s whiteboard and choose **Options → Get Started with Your School**. Use the school sign-in method shown there. Teachers do not need the separate Teacher Admin settings password to begin on a configured district setup. See [Teacher Quick Start](../guides/teacher-options-quick-start.html).

### Can teachers and students sign in with Google?

Yes, after the district sets up Google sign-in, allowed school domains, and roster-linked accounts. Google identifies the user; MariaDB or MySQL stores the district work. See [classrooms and rosters](../wiki/district-classrooms.html).

### Does a roster CSV create Google accounts or passwords?

No. The district administrator imports school email addresses and class information. Google accounts must already exist, and Google sign-in must be configured. Preview the import before applying it. See the [roster guide](../wiki/district-classrooms.html).

### Who adds teachers and creates classrooms?

The district administrator manages teachers and rosters through district roster administration. Teachers use their assigned classrooms for lessons, turn-ins, and feedback. See [school setup and operations](../wiki/for-technology-admins.html).

### Is the district administrator password the same as the Teacher Admin password?

No. The district administrator account manages the school service and rosters. The Teacher Admin lock protects local advanced settings. Neither is a shared classroom login. See [the account types](../guides/mysql-setup.html#understand-the-accounts).

### Does Google sign-in give DrawSplat access to my Google Drive?

School sign-in and Drive access are separate. Optional Google-backed saving has its own setup and permissions. Review [Google OAuth permissions](../legal/google-oauth-disclosure.html) before connecting a service.

## Installation and maintenance

### Can a district host the whole suite?

Yes. Download the complete district package, extract it, and open `start-here.html`. The checklist includes the whiteboard, SplatWorks, tools, widgets, and games. Components start checked; uncheck anything you do not need. See [district Quick Start](../docs/district-selfhost.html).

### Do I have to use Docker?

No. Docker is the preferred path, but a native path is also available. Choose the path at the start of the checklist. Native hosting needs Node.js, Caddy, and a MariaDB or MySQL service. See [installation choices](../docs/district-selfhost.html).

### Where are the Docker installation instructions?

The [district installation guide](../docs/district-selfhost.html) includes Docker preparation and links to official installation steps. The supplied Debian helper can check the host, prepare Docker, and verify it. Review the steps for your operating system before running them.

### Does DrawSplat work with both MariaDB and MySQL?

Yes. Both use the same saving API. The district package supports bundled MariaDB or MySQL, as well as your own database. Choose the engine before the first launch. See [MySQL / MariaDB setup](../guides/mysql-setup.html).

### Which email and password do I use during first-time setup?

Use the private setup key printed by the launcher to open setup. Choose a district administrator email and password. The starter email is `admin@localhost.test`; the starter password is unique to the installation and hidden by default. There is no universal password. See [first-time setup](../guides/mysql-setup.html#launch-and-finish-first-time-setup).

### Do I need to enter database credentials for the bundled Docker database?

No. Keep **Bundled database** selected. The server uses its generated connection and ignores form overrides. Choose **My own database** only for a native or external database. See [the database guide](../guides/mysql-setup.html).

### What if the database is healthy but the connection test fails?

A running database may still reject the API’s login. Follow the diagnostic message and check the selected database mode, credentials, and connection settings. Do not delete database volumes to fix a normal login error. See [connection setup](../guides/mysql-setup.html).

### Can I rerun setup or change the installed components?

You can rerun the checklist and launchers with an updated plan. They preserve existing settings and data. Changing database engines or moving between Docker and native hosting needs a planned migration; a checkbox does not move the data. See [rerunning Quick Start](../docs/district-selfhost.html).

### What should the school back up?

Back up the database and private configuration, including the password pepper used by the service. Protect the copies and test a restore in a separate installation. Local student project files need their own backup plan. See [backup and recovery](../docs/district-selfhost.html).

## Privacy, access, and licensing

### Where is student work stored?

It depends on the saving path. Browser drafts stay in that browser; district online boards go to the school’s database; configured Apps Script workflows use Google services. Ask the school which path it uses. See [data handling](../wiki/compliance.html).

### Does signing out erase work from a shared device?

Signing out of the online account ends that session but leaves local device copies. Follow the school’s cleanup process after saving important work. See [saving and exporting](../guides/saving-exporting.html).

### How can a parent ask to view or delete a child’s records?

Contact the school and follow its published request process. [Family Access Tools](../parents/index.html) works only with a configured Apps Script family service; it does not manage every district installation. Start with [Parents and students](../wiki/for-parents-and-students.html).

### Does installing DrawSplat make a school legally compliant?

No. The school still needs to review its setup, policies, access controls, and agreements. The Wiki provides review documents and lists known gaps. See [Compliance and district review](../wiki/compliance.html) and the [NDPA / DPA packet](../legal/ndpa-packet.html).

### Does the Apps Script Compliance Console manage MariaDB classrooms?

No. It manages its own Google-backed workflows. District database records need the district’s own access, retention, export, and deletion procedures. See the [Compliance Console guide](../guides/compliance-guide.html).

### Can we modify and self-host DrawSplat?

Yes, under the applicable open-source licenses. DrawSplat generally uses AGPL; some components, including SplatWorks apps, have their own notices. Keep those notices and meet the source-sharing duties that apply. See [licensing](../wiki/licensing.html).

### Who owns the work I create?

Work belongs to its respective authors. Images, music, templates, and other media may have separate license rules. Check permission and attribution needs before sharing. See [licensing and content ownership](../wiki/licensing.html).

## SplatWorks

### What is included in SplatWorks?

[WriteSplat](../pages/writesplat.html) is for writing, [ShowSplat](../pages/showsplat.html) for slides, [GridSplat](../pages/gridsplat.html) for spreadsheets, and [ListSplat](../pages/listsplat.html) for structured records. The [suite overview](../pages/splatworks.html) helps you choose.

### Do SplatWorks apps need a database or an account?

You can use them as browser apps without either. Hosting them with the district suite does not automatically connect every project file to whiteboard account-based saving. Save project backups regularly. See [the suite guide](../pages/splatworks.html).

### Can I exchange files with other office apps?

Each app supports its own formats. WriteSplat supports ODT; ShowSplat offers WebDeck, Markdown, PDF, ODP, and PPTX workflows; GridSplat exchanges spreadsheet data; ListSplat exchanges CSV records. Conversions may change layout or features, so keep an original and check the result. See the [app guides](../pages/splatworks.html).

## Learning and support

### How can I support multilingual learners?

Use a short prompt, a model, and a choice of response formats. Students can combine drawings, text, and recorded explanations. Home-language labels can support new vocabulary. See [teaching tools and lesson ideas](../wiki/for-educators.html).

### Where can I check accessibility support?

Read the [accessibility statement](../legal/accessibility.html) for support and known limits. Test the planned task with the learner’s devices and access tools, and ask the school about accommodations.

### Who should I contact for help?

For school accounts, assignments, or records, start with the teacher or school help desk. For an app bug or service inquiry, use [Contact and support](../pages/contact.html). Include the app, browser, and steps to repeat the issue; leave out passwords and student records.
