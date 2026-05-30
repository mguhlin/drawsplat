// Game Access admin panel — checkbox per game, persists to localStorage via
// games-filter.js. Disabled games are hidden from the landing and Features pages.
(function(){
  const TITLES={castles:'Castles',floodfill:'Flood Fill',flowfree:'Flow Free',funquiz:'Fun Quiz',gilasplat:'GilaSplat',lightsout:'Lights Out',splatball:'Splatball',tangram:'Tangram Packing',untangle:'Untangle'};
  function render(){
    const wrap=document.getElementById('gameAccessList'); if(!wrap) return;
    const disabled=new Set(window.DrawSplatGamesFilter.getDisabled());
    wrap.innerHTML=window.DrawSplatGamesFilter.GAMES.map(slug=>{
      const checked=disabled.has(slug)?'':'checked';
      const label=TITLES[slug]||slug;
      return '<label class="config-row"><input type="checkbox" data-game="'+slug+'" '+checked+'> '+label+'</label>';
    }).join('');
  }
  function save(){
    const wrap=document.getElementById('gameAccessList'); if(!wrap) return;
    const disabled=Array.from(wrap.querySelectorAll('input[type="checkbox"]')).filter(cb=>!cb.checked).map(cb=>cb.dataset.game);
    window.DrawSplatGamesFilter.setDisabled(disabled);
    const status=document.getElementById('gameAccessStatus');
    if(status){ status.textContent='Saved. The landing and Features pages will hide '+disabled.length+' game(s).'; status.className='hint success'; }
  }
  function enableAll(){
    window.DrawSplatGamesFilter.setDisabled([]);
    render();
    const status=document.getElementById('gameAccessStatus');
    if(status){ status.textContent='All games enabled.'; status.className='hint success'; }
  }
  function init(){
    if(!window.DrawSplatGamesFilter){ return; }
    render();
    document.getElementById('saveGameAccessBtn')?.addEventListener('click',save);
    document.getElementById('resetGameAccessBtn')?.addEventListener('click',enableAll);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
