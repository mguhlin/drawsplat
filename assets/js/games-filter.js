// Hides game links/cards on landing and features pages when a teacher has
// disabled specific games from the admin panel. List is stored per-browser in
// localStorage under drawsplat.disabledGames as a JSON array of game slugs.
(function(){
  const KEY='drawsplat.disabledGames';
  const GAMES=['castles','floodfill','flowfree','funquiz','gilasplat','lightsout','splatball','tangram','untangle'];

  function read(){
    try{
      const raw=localStorage.getItem(KEY);
      if(!raw) return [];
      const arr=JSON.parse(raw);
      return Array.isArray(arr) ? arr.filter(s=>GAMES.includes(s)) : [];
    }catch(_){ return []; }
  }
  function write(list){
    try{ localStorage.setItem(KEY, JSON.stringify(list.filter(s=>GAMES.includes(s)))); }catch(_){}
  }
  function apply(){
    const disabled=new Set(read());
    if(!disabled.size) return;
    // Match both top-level (games/castles/) and ../games/castles/ links.
    document.querySelectorAll('a[href]').forEach(a=>{
      const href=a.getAttribute('href')||'';
      const m=href.match(/(?:^|\/)games\/([a-z0-9_-]+)\//i);
      if(!m) return;
      if(!disabled.has(m[1].toLowerCase())) return;
      // Hide the smallest meaningful container — a card, list item, or the
      // link itself — so the page doesn't end up with an empty grid cell.
      const container=a.closest('.standalone-tool-card, li, .game-card') || a;
      container.style.display='none';
    });
  }

  window.DrawSplatGamesFilter={
    GAMES,
    getDisabled: read,
    setDisabled: write,
    apply
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',apply);
  else apply();
})();
