# SplatWorks / DrawSplat — PROTECT v2.0 report cards

Review date: October 15, 2026. Based on the deployed v3.1.38 controls and current policy documents.

These are conservative, provisional evidence scores. They distinguish implemented capabilities and published requirements from operational proof. They are not independent certifications, legal opinions, or final approval of a named district. The public evidence review is 9/14; the unverified self-hosted deployment-readiness baseline is 8/14. The lower district baseline reflects missing district-specific facts, not an inherent privacy disadvantage of self-hosting. Self-hosting offers the stronger control ceiling.

## Scope and interpretation

Public: supervised browser-only use on SplatWorks.org / DrawSplat.org; optional cloud storage, AI, SSO and backends off. Local processing does not eliminate request metadata to the public host or remote libraries/media. 9/14 falls in Approve with conditions. The district reviewer must close material gaps in a signed addendum and operating controls before approving the stated use.

District: self-hosted ecosystem plus district MariaDB/MySQL classroom services; external integrations off unless separately approved. No named district installation was inspected. 8/14 is a provisional readiness baseline, not a measured deployment score; Hold until the evidence packet supports a final score. An uninspected installation should remain formally ungraded in the deployment review form.

| Category | Public | District readiness |
|---|---:|---:|
| Parental rights & access | 1/2 | 1/2 |
| Retention & deletion | 1/2 | 1/2 |
| Opt-out options | 2/2 | 2/2 |
| Transparency | 2/2 | 1/2 |
| Encryption & security | 1/2 | 1/2 |
| Consent & age | 1/2 | 1/2 |
| Third-party management | 1/2 | 1/2 |
| **Total** | **9/14** | **8/14** |

**Parental rights & access:** Controls and deadlines exist; an end-to-end assisted request rehearsal covering all record locations is not evidenced.

**Retention & deletion:** Schedules and deletion tools exist; enabled expiry, external copies and backup destruction/restore evidence remain deployment dependent.

**Opt-out options:** Local workflows and optional connections; published no-sale, no-targeted-advertising, no-profiling and no-training restrictions. Optional processing is excluded from these scopes.

**Transparency:** Public inventory, hosting boundaries, dates and provider register are published. A particular district must add exact processing/log/backup locations and configuration.

**Encryption & security:** Public HTTPS/headers and district security controls are documented; actual endpoint/database/object/backup encryption and incident operations are not fully evidenced.

**Consent & age:** Age bands and school/parent pathways are documented; ecosystem-wide operational consent/age enforcement is not demonstrated.

**Third-party management:** Dated provider register and notice/objection process exist; complete enabled resource/provider inventory, executed terms and flow-down evidence remain pending.

## Conditions for a public 13/14

Raise parental rights, retention, encryption/security and third-party management to 2; retain the existing 2s for opt-outs and transparency. Consent/age remains 1 pending broader verified enforcement. The 13 target applies only to the supervised, school-authorized local-use scope; it does not authorize direct-child connected processing.

1. Publish a monitored school rights contact and complete an assisted access/correction/export/deletion drill across both origins, relevant browser profiles and exported copies; acknowledge within 10 school days and fulfill within 30 calendar days, or sooner when law requires.
2. Explicitly enable and test the chosen local expiry; verify handling of downloads and shared copies, host logs, backups and restores. Do not silently erase existing drafts. Verify 30-day active and 90-day backup termination deadlines where applicable, including legal exceptions with stated end dates.
3. Verify managed-device/profile isolation, encryption of devices and relevant copies/backups, access controls, tested HTTPS/hardening, a named security contact and the 72-hour confirmed-breach process. Browser storage is not application-encrypted by default.
4. Finish the public host and enabled library/media provider inventory; verify contracts, regions/transfer safeguards, retention, flow-down terms and the 30-day change-notice/objection process. A provider register is not an executed contract.
5. Keep optional cloud/AI/backend processing off. Verify the consent basis for the approved ages and educational purpose; separately review every connected feature before enabling it.

## Conditions for a district 14/14

Raise all six partial categories to 2 and maintain opt-outs at 2. The target is contingent on evidence, not achieved by installing the ZIP.

1. Name the operator and school rights contact; rehearse verified parent/eligible-student access, correction, export and erasure across every enabled app and store. Legacy name-only submissions need verified manual matching; shared files/media/backups are separate copies.
2. Enable backend retention intentionally and prove deletion jobs operate. Rehearse export/termination, active destruction within 30 days and backup expiry within 90 days; replay erasures on restore. Publish separate schedules for rosters, accounts, assignments, downloads and logs.
3. Record exact server, processing, log and backup countries/regions and an approved component/data-flow inventory. Self-hosting does not automatically disable external libraries, media or integrations.
4. Prove HTTPS, database transport, disk/database/object/backup encryption, least privilege, protected audit records, secret management, patching, restore and incident response. Document notification within 72 hours after confirmation, or a shorter applicable deadline.
5. Approve age bands and implement school authorization/required verified parental consent before covered processing; verify older-minor protections, parent visibility and eligible-student rights. An AI approval checkbox does not establish consent.
6. Execute applicable agreements and provider flow-down terms, including transfer safeguards, approved scopes, no sale/profiling/training, deletion and notice. Operate the 30-day change/objection process. Review any AI, cloud, SSO, Google Apps Script or other added service as a distinct data flow.

Re-audit at least annually and after material component, hosting, integration or policy changes. A missing critical legal prerequisite blocks the affected use even if the numerical total reaches 12 or more.

## Sources

- https://mguhlin.org/images/frameworks/ctobs/TCEA_PROTECT_Rubric_v2-1024x576.png
- https://splatworks.org/legal/protect-review
- https://splatworks.org/privacy/
- https://splatworks.org/legal/terms-privacy
- https://splatworks.org/legal/service-providers
- https://splatworks.org/data/privacy-retention.json
- https://splatworks.org/data/privacy-inventory.json
