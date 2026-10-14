/* Static-host fallback for the matching Cloudflare short-link redirects. */
const splatworksAppTarget = document.getElementById('splatworksAppTarget');
if (splatworksAppTarget) {
  const destination = new URL(splatworksAppTarget.href);
  destination.search = location.search; destination.hash = location.hash;
  location.replace(destination.href);
}
