# SplatWorks.org and DrawSplat.org

Updated October 15, 2026.

The user purchased SplatWorks.org and started connecting it to the existing
Cloudflare deployment. Both domains should serve the same source and application
paths. The homepage presents SplatWorks™ as the suite, including LayoutSplat;
DrawSplat™ remains the whiteboard. Existing tools, guides, and downloads remain
accessible through their current links.

## Domain connection

In the same Cloudflare account, ensure the SplatWorks.org zone is Active. A domain
purchased elsewhere needs the nameservers assigned by Cloudflare. In Workers &
Pages, find the deployment where DrawSplat.org is already attached, and add
SplatWorks.org and www.splatworks.org as additional custom domains. Keep
DrawSplat.org attached.

For Pages, use Custom domains → Set up a domain. For Workers, use Settings →
Domains & Routes → Add → Custom Domain, or the Domains tab available in newer
dashboards. Add domains through the hosting project so Cloudflare configures
DNS and HTTPS for the correct deployment.

- [Cloudflare domain setup](https://developers.cloudflare.com/learning-paths/get-started/add-domain-to-cf/)
- [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
- [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## Verification and storage

At the initial check on October 14, SplatWorks.org did not resolve through the
verification connection. Cloudflare activation was pending. After activation,
check HTTPS, the homepage, `/app/whiteboard.html`, `/pages/splatworks`, and
`/splatworks/layoutsplat/` on the new domain. Existing URLs on DrawSplat.org must
also remain functional.

Browser drafts are stored separately on each domain. Users continuing existing
work should open it on DrawSplat.org or save a project file there and reopen the
file on SplatWorks.org. Do not add an automatic redirect for existing application
URLs until a deliberate draft migration is available. The homepage canonical URL
remains DrawSplat.org while the new domain is pending; a later canonical switch
should follow successful live verification.

SplatWorks.org resolved and returned the shared SplatWorks™ homepage during
production verification on October 14, 2026. The v0.2 feature deployment succeeded
on both Cloudflare Pages and Workers. Both domains remain attached.

## Short app links

The paths `/layoutsplat`, `/writesplat`, `/showsplat`, `/gridsplat`, and
`/listsplat` redirect to their existing `/splatworks/<app>/` addresses on both
production domains. `_redirects` supplies Cloudflare 301 rules; each root folder
has a static HTML fallback for GitHub Pages and local servers. Query parameters
and fragments are preserved by the static fallback. Browser drafts remain tied
to the domain, so a redirect within one domain keeps that domain’s workspace.


## Google Drive authorization

The five office apps and AudioSplat use the shared Google web client
`31274545407-l338d2doafet21gv8u4qmq2jk3j03jq3.apps.googleusercontent.com`
for their explicit Drive actions. After the administrator added the SplatWorks
origin on October 15, 2026, the anonymous production check reached Google's
sign-in screen on both SplatWorks.org and DrawSplat.org without
`origin_mismatch`. Both public origins are now authorized.

To maintain these origins or configure the corresponding client setting:

1. Open [Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients?project=31274545407).
2. Select the web client with the ID above.
3. Keep `https://splatworks.org` and `https://drawsplat.org` under
   **Authorized JavaScript origins**. Use each origin without an app path or
   trailing slash.
4. Save, allow the setting to propagate, then recheck a Drive action on both domains.

No account was authenticated and no project was uploaded during that anonymous
check. Native-file transfers, denial, cancellation, and upload failures were
checked with simulated Google responses. A real account save also depends on
the Google project and the account's Workspace permissions.

[Drive saving and district client setup](../pages/splatworks.html#save-to-google-drive).

## Public hosting and startup connections

The published document headers include `Cache-Control: no-transform` to prevent
Cloudflare from automatically inserting its browser analytics script. Large
JavaScript, WASM and media resources keep their normal cache/compression policy.
This follows [Cloudflare's documented behavior](https://developers.cloudflare.com/web-analytics/faq/).
The Content Security Policy continues to restrict scripts and connections.
Cloudflare still receives the hosting request metadata described in the shared
[security, privacy and terms](../legal/terms-privacy.html).
