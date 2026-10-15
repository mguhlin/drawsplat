/* Print the complete policy without changing the reader's disclosure choices. */
(function () {
  const sections = [...document.querySelectorAll('main .policy-details')];
  let openBeforePrint = null;
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
