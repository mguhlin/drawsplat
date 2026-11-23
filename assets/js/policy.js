/* Print the complete policy without changing the reader's disclosure choices. */
(function () {
  const sections = [...document.querySelectorAll('main .policy-details')];
  let openBeforePrint = null;
  function revealLinkedSection() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    for (let node = target.parentElement; node; node = node.parentElement) {
      if (node.tagName === 'DETAILS') node.open = true;
    }
    if (id) requestAnimationFrame(() => target.scrollIntoView({block:'start'}));
  }
  window.addEventListener('hashchange', revealLinkedSection);
  revealLinkedSection();
  window.addEventListener('beforeprint', () => {
    if (openBeforePrint !== null) return;
    openBeforePrint = sections.filter(section => section.open);
    sections.forEach(section => { section.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (openBeforePrint === null) return;
    sections.forEach(section => { section.open = openBeforePrint.includes(section); });
    openBeforePrint = null;
  });
})();
