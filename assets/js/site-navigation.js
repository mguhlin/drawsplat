(() => {
  for (const nav of document.querySelectorAll('.site-nav')) {
    nav.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const open = nav.querySelector('details[open]');
      if (open) { open.open = false; open.querySelector('summary').focus(); }
    });
    document.addEventListener('click', event => {
      if (!nav.contains(event.target)) for (const menu of nav.querySelectorAll('details[open]')) menu.open = false;
    });
  }
})();
