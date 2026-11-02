# SplatLMS · Learning Management System

**SplatLMS is the Learning Management System in the SplatWorks ecosystem.** Use it to organize courses, enroll learners, teach lessons, collect assignments, assess learning and track progress. Create with DrawSplat and the office, media and assessment tools; bring that work into a course through lesson links and supported file submissions.

[Explore SplatLMS](../pages/splatlms.html) · [Download SplatLMS v1.0.0](../pages/download.html#splatlms-download) · [Source and release documentation](https://github.com/mguhlin/splatlms)

## How the ecosystem fits together

| Your task | SplatWorks component | How it connects to a course |
| --- | --- | --- |
| Organize teaching and learning | SplatLMS | Publish lessons, enroll learners, create assignments and quizzes, give feedback and review progress. |
| Explain and model | DrawSplat Whiteboard | Link a board activity from a lesson; export the result for an assignment. |
| Write, present and publish | WriteSplat, ShowSplat, LayoutSplat | Create a document, presentation or publication; submit an export accepted by the assignment. |
| Explore data | GridSplat, ListSplat | Build spreadsheets or structured records; submit an accepted export or report. |
| Create accessible media | AudioSplat, VideoSplat, MediaSplat, PDFSplat | Make recordings, captioned media or documents for lessons and learner work. |
| Design practice and feedback | QuizSplat, RubricSplat | Link practice activities and use rubric criteria when building an LMS assignment. Tool quiz files do not automatically become LMS quizzes. |
| Plan individual work | PlanSplat | Keep a personal study plan. PlanSplat and SplatLMS assignments are managed separately. |

These are teaching workflows using links and exports. Opening a tool does not automatically enroll a learner, submit work, copy a rubric, synchronize grades, or connect tool storage to the LMS. SplatLMS learner accounts, whiteboard school accounts, and optional Google Drive connections remain separate. Configure and validate any identity-provider integration for your installation.

## Start with SplatWorks Educator

The released installer includes **SplatWorks Educator**, the first published course. Its five modules introduce the ecosystem, DrawSplat teaching and creation, office apps and media, practice and feedback, and typing activities, suitable K–12 games and a capstone.

- Twenty written lesson sections and practical activities.
- Five knowledge checks with 25 questions in total; completion uses twenty lesson steps and five checks passed at 80%.
- Twenty optional video overviews with synthetic English narration, captions, WebVTT files and full transcripts. The written lessons are complete without the videos.
- A field guide, worksheets, illustrations and course badge.

Practice and capstone artifacts are self-checked unless an instructor creates an assignment. The course currently awards **0 approved CPE/GT hours**; its badge does not establish external accreditation.

## For teachers and learners

1. Ask your school or course provider for its installed SplatLMS address and account instructions. The public SplatWorks product page introduces the LMS; it is not a shared learner login.
2. Open the course catalog and enroll using the options your provider enables. Start with SplatWorks Educator or a course assigned by your instructor.
3. Read a lesson and follow its activity link to the appropriate SplatWorks tool.
4. Save an editable project backup and export the format requested by the instructor. Return to the course and submit through its assignment, if one has been created. Check the confirmation and retain a copy.
5. Complete the course checks and review feedback and progress in SplatLMS.

For course authors: link tools from the lesson editor, state the expected export format and permitted file size, and create the corresponding assignment and assessment criteria. Test the activity with a learner account before publishing it to a group. A native project file may need its original tool to reopen; a PDF, image or other supported viewing format can help reviewers.

## Download and installation

Get the **SplatLMS v1.0.0 installation ZIP** from [SplatWorks Downloads](../pages/download.html#splatlms-download), or use its [GitHub release](https://github.com/mguhlin/splatlms/releases/tag/v1.0.0). Verify it against the release's [SHA-256 checksums](https://github.com/mguhlin/splatlms/releases/download/v1.0.0/SHA256SUMS.txt). Extract the entire package and follow its `README.md` and `installer/README.md`.

SplatLMS is part of the ecosystem and uses a **separate server installation** from the static office apps and DrawSplat packages. Existing static ZIPs retain their listed contents. Static hosting, GitHub Pages and the Python launcher for the creative tools cannot run the PHP LMS or store its learner records.

### Native setup

Install PHP 8.1+ and the extensions checked by the installer, including PDO SQLite (or PDO MySQL), mbstring, GD, fileinfo and Phar. The runtime does not need Node.js or Composer. Choose SQLite for a simple installation, or configure MariaDB/MySQL for your deployment.

From the extracted package root on Linux or macOS:

```bash
bash installer/install.sh
bash installer/serve.sh 8000
```

The installer asks for your administrator credentials and database choice. No default login or real learner database is shipped. Open `http://localhost:8000` for local evaluation. Use the package's web-server guidance and HTTPS for production; the evaluation server is not the production hosting plan.

### Docker setup

Follow `installer/README.md` and `installer/docker-compose.yml` in the package. Supply `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` through your deployment environment, then run:

```bash
docker compose -f installer/docker-compose.yml up -d --build
```

The supplied configuration binds to `localhost:8080`. Provide an HTTPS host or reverse proxy and persistent storage for a production deployment. Test account creation, course enrollment, assignment upload, quiz completion, feedback and backup recovery before inviting learners.

## Data, privacy and administration

The application code lives in `splatlms/`; persistent configuration, credentials, uploads and the default database live in `splatlms-data/`. Course folders and reader assets live in `content/`. `SPLATLMS_DATA` and `SPLATLMS_COURSES` can override those locations. Keep private data outside the public web root and use the supplied routing/configuration guidance.

The school's LMS host stores account, enrollment, submission and progress records. The public SplatWorks static site does not collect those LMS records. Keep database and uploaded-file backups together, protect credentials, define retention and family-request procedures, and test recovery. With MariaDB/MySQL, include a database backup as well as persistent files and course content. The browser-data controls on SplatWorks.org do not erase records from a school's LMS installation.

SplatLMS includes administration for organizations/groups, authoring, reports, transcripts, badges/certificates, MFA, scoped API access, SSO configuration and updates. External identity and email providers require administrator configuration and end-to-end validation. Review [SplatWorks privacy and deployment guidance](../legal/terms-privacy.html) alongside the [SplatLMS security documentation](https://github.com/mguhlin/splatlms/blob/main/SECURITY.md) and your school's policies. Documentation is not a district approval or compliance certification.

## Updates, license and support

Use SplatLMS's own update process and release instructions. Back up code, course content, persistent data and any external database first. The update archive is for an existing compatible SplatLMS installation; use the full ZIP for a fresh install. Check the edition and version, test the update, and verify a rollback/recovery path. Sapiqo data is not automatically migrated by installing SplatLMS.

SplatLMS is adapted from **Sapiqo LMS by Miguel Guhlin** and retains its **CC BY-SA 4.0** license, upstream attribution and third-party notices. Individual SplatWorks applications keep their own licenses. See [LICENSE](https://github.com/mguhlin/splatlms/blob/main/LICENSE), [UPSTREAM.md](https://github.com/mguhlin/splatlms/blob/main/UPSTREAM.md) and [THIRD_PARTY_NOTICES.md](https://github.com/mguhlin/splatlms/blob/main/THIRD_PARTY_NOTICES.md).

[Report an LMS issue](https://github.com/mguhlin/splatlms/issues) · [SplatWorks contact and support](../pages/contact.html) · [Browse all ecosystem tools](../studio/index.html)

Product artwork and the SplatLMS logo on this site are reused from the SplatLMS v1.0.0 product site (`site/assets/hero.webp` and `logo.png`). See its upstream and asset notices.
