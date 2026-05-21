/* Keeps the public template gallery aligned with the selected DrawSplat
   language, then passes that language into the whiteboard launch URL. */
(function(){
  function ready(fn){if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fn); else fn()}
  ready(()=>{
    const lang=(window.DRAWSPLAT_LANG||document.documentElement.lang||'en').toLowerCase();
    document.querySelectorAll('a[href*="whiteboard.html?bgTemplate="]').forEach(link=>{
      const url=new URL(link.getAttribute('href'),location.href);
      if(lang&&lang!=='en') url.searchParams.set('lang',lang);
      link.setAttribute('href','../app/whiteboard.html'+url.search);
    });
  });
})();
