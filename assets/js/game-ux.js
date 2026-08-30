(()=>{
  'use strict';
  const slug=location.pathname.split('/').filter(Boolean).at(-1)||'';
  const games={
    castles:{goal:'Destroy the other castle before yours falls.',controls:'Choose an action each turn, aim carefully, and watch the wind.',tip:'Start with a safe shot, observe where it lands, then adjust one thing at a time.'},
    floodfill:{goal:'Make the entire board one color within the move limit.',controls:'Choose a color to grow the connected area from the starting corner.',tip:'Pick the color that touches the largest part of your current region.'},
    flowfree:{goal:'Connect every matching color pair and fill the whole board.',controls:'Drag from one colored dot to its partner. Paths cannot cross.',tip:'Connect pairs near the edges first to leave room through the middle.'},
    funquiz:{goal:'Answer each question and learn from the feedback.',controls:'Choose one answer, check the feedback, then move to the next question.',tip:'Read every option before choosing. A wrong answer is useful feedback, not a penalty.'},
    gilasplat:{goal:'Complete the run while managing hazards and resources.',controls:'Use the on-screen controls or keyboard shown in the game.',tip:'Learn the pattern first; speed comes after accuracy.'},
    lightsout:{goal:'Turn off every light in as few moves as you can.',controls:'Select a cell to flip it and its up, down, left, and right neighbors.',tip:'Work in a consistent direction so you can see the effect of each move.'},
    splatball:{goal:'Outscore the other player before the match ends.',controls:'Use the displayed player controls; pause whenever the class needs a break.',tip:'Watch the ball, return to position, and anticipate rather than chase.'},
    'squirrel-run-game':{goal:'Cross the lanes, collect acorns, and reach the tree hollow safely.',controls:'Use arrow keys, WASD, or the large touch direction buttons.',tip:'Pause at lane edges and look for a safe gap before moving.'},
    'super-star-trek':{goal:'Protect the galaxy by finding and defeating enemy ships before time runs out.',controls:'Choose commands from the bridge and read the terminal response after every action.',tip:'Check your status and map before spending energy or moving to a new sector.'},
    tangram:{goal:'Fit every piece completely inside the silhouette.',controls:'Drag pieces to move them and use the game controls to rotate when available.',tip:'Place the largest pieces first, then use smaller pieces to fill gaps.'},
    'typing-games':{goal:'Build accurate typing habits while completing the selected challenge.',controls:'Keep your hands ready, type the shown letters or words, and use P to pause.',tip:'Accuracy first. A steady rhythm becomes speed with practice.'},
    untangle:{goal:'Move the points until none of the connecting lines cross.',controls:'Drag one point at a time and watch the crossing counter.',tip:'Move outside points apart first, then solve the crowded center.'}
  };
  const info=games[slug]; if(!info) return;
  const link=document.createElement('link');link.rel='stylesheet';link.href='../../assets/css/game-ux.css';document.head.appendChild(link);
  const main=document.querySelector('main')||document.querySelector('.wrap')||document.body;
  if(!main.id) main.id='game-main';
  if(main===document.body) main.setAttribute('tabindex','-1');
  const skip=document.createElement('a');skip.className='game-ux-skip';skip.href='#'+main.id;skip.textContent='Skip to game';document.body.prepend(skip);
  const coach=document.createElement('section');coach.className='game-ux-coach';coach.setAttribute('aria-label','Game goal');coach.innerHTML=`<p><strong>Goal:</strong> ${info.goal}</p><button type="button" class="game-ux-help-button" aria-haspopup="dialog">How to play</button>`;
  const header=document.querySelector('.ds-games-header');(header?.after.bind(header)||document.body.prepend.bind(document.body))(coach);
  const dialog=document.createElement('dialog');dialog.className='game-ux-dialog';dialog.innerHTML=`<article><h2>How to play</h2><p><strong>Your goal:</strong> ${info.goal}</p><ul><li>${info.controls}</li><li><strong>Strategy tip:</strong> ${info.tip}</li><li>You can stop, ask for help, or try again at any time.</li></ul><p><kbd>?</kbd> opens these instructions.</p><footer><button type="button">Let’s play</button></footer></article>`;document.body.appendChild(dialog);
  const open=()=>typeof dialog.showModal==='function'?dialog.showModal():dialog.setAttribute('open','');
  coach.querySelector('button').addEventListener('click',event=>{event.stopPropagation();open()});dialog.querySelector('button').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{e.stopPropagation();if(e.target===dialog)dialog.close()});
  document.addEventListener('keydown',e=>{if(e.key==='?'&&!/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)){e.preventDefault();open()}if(e.key==='Escape'&&dialog.open)dialog.close()});
  const live=document.createElement('div');live.className='game-ux-live';live.setAttribute('role','status');live.setAttribute('aria-live','polite');document.body.appendChild(live);
  document.querySelectorAll('canvas').forEach((canvas,i)=>{if(!canvas.hasAttribute('tabindex'))canvas.tabIndex=0;if(!canvas.getAttribute('aria-label'))canvas.setAttribute('aria-label',`Game board ${i+1}`)});
  document.querySelectorAll('button').forEach(button=>{if(!button.getAttribute('aria-label')&&!button.textContent.trim()&&button.title)button.setAttribute('aria-label',button.title)});
})();
