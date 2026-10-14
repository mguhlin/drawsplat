# SplatWorks.org and DrawSplat.org

Updated October 14, 2026.

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
