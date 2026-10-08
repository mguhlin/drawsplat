/* Original educational word-board game. Vocabulary is local; no accounts or uploads. */
(() => {
'use strict';
const $=id=>document.getElementById(id),t=key=>WidgetI18n.t(key),N=15;
const values={a:1,b:3,c:3,d:2,e:1,f:4,g:2,h:4,i:1,j:8,k:5,l:1,m:3,n:1,o:1,p:3,q:10,r:1,s:1,t:1,u:1,v:4,w:4,x:8,y:4,z:10};
const entries=[...RegularVocabulary,...CipherVocabulary].filter(v=>/^[a-z]{2,15}$/.test(v.word));
let dictionary=new Set();
let board,rack=[],selected=[7,7],vertical=false,playerScore=0,computerScore=0,turn=1,busy=false,over=false,moves=[],used=new Set(),cpuTimer,best=0,legal=[],hintEntry=null;
try{best=Number(localStorage.getItem('drawsplat.reactor.best'))||0}catch{}
const filtered=()=>entries.filter(v=>$('subject').value==='general'?v.subject==='general':v.subject!=='general'&&($('subject').value==='all'||v.subject===$('subject').value)&&($('vocabBand').value==='all'||v.band===$('vocabBand').value));
const inside=(r,c)=>r>=0&&r<N&&c>=0&&c<N;
let activeEntries=[],activeWords=new Set();const chosen=()=>activeEntries;
function bonus(r,c){if((r===0||r===7||r===14)&&(c===0||c===7||c===14)&&!(r===7&&c===7))return'TW';if(r===c||r+c===14)return'DW';if([1,5,9,13].includes(r)&&[1,5,9,13].includes(c))return'TL';if((r%4===3&&c%4===3)||(r===7&&[3,11].includes(c))||(c===7&&[3,11].includes(r)))return'DL';return''}
function evaluate(word,r,c,down,letters=null){
 if(!activeWords.has(word)||used.has(word))return null;
 const dr=down?1:0,dc=down?0:1,len=word.length,endR=r+dr*(len-1),endC=c+dc*(len-1);
 if(!inside(r,c)||!inside(endR,endC)||board[r-dr]?.[c-dc]||board[endR+dr]?.[endC+dc])return null;
 const fresh=[],available=letters?.slice();let connected=false,main=0,mult=1,crossTotal=0;
 for(let i=0;i<len;i++){
  const rr=r+dr*i,cc=c+dc*i,ch=word[i],old=board[rr][cc];
  if(old){if(old.letter!==ch)return null;connected=true;main+=values[ch];continue}
  if(available){const at=available.indexOf(ch);if(at<0)return null;available.splice(at,1)}
  fresh.push({r:rr,c:cc,letter:ch});const b=bonus(rr,cc),lm=b==='TL'?3:b==='DL'?2:1,wm=b==='TW'?3:b==='DW'?2:1;main+=values[ch]*lm;mult*=wm;
  const cr=down?0:1,ccr=down?1:0;let before='',after='',crossPoints=values[ch]*lm;
  for(let k=1;inside(rr-cr*k,cc-ccr*k)&&board[rr-cr*k][cc-ccr*k];k++){const tile=board[rr-cr*k][cc-ccr*k];before=tile.letter+before;crossPoints+=values[tile.letter]}
  for(let k=1;inside(rr+cr*k,cc+ccr*k)&&board[rr+cr*k][cc+ccr*k];k++){const tile=board[rr+cr*k][cc+ccr*k];after+=tile.letter;crossPoints+=values[tile.letter]}
  if(before||after){if(!dictionary.has(before+ch+after))return null;connected=true;crossTotal+=crossPoints*wm}
 }
 if(!fresh.length||fresh.length>7)return null;
 if(!board.flat().some(Boolean)){if(!fresh.some(p=>p.r===7&&p.c===7))return null}else if(!connected)return null;
 return{word,r,c,down,fresh,score:main*mult+crossTotal+(fresh.length===7?50:0)};
}
function allMoves(letters=null){const result=[];for(const entry of chosen())if(!used.has(entry.word))for(let r=0;r<N;r++)for(let c=0;c<N;c++)for(const down of [false,true]){const move=evaluate(entry.word,r,c,down,letters);if(move)result.push(move)}return result}
function newRack(){const possible=allMoves();if(!possible.length)return[];const seed=possible[Math.floor(Math.random()*possible.length)];const result=seed.fresh.map(p=>p.letter);const filler='eeeeeeeeaaaaaaaaiiiiiiioooooonnnnnrrrrrrttttttllllssssuuuuddggbbccmmppffhhvvwwykjxqz';while(result.length<7)result.push(filler[Math.floor(Math.random()*filler.length)]);return result.sort(()=>Math.random()-.5)}
function drawBoard(){const word=$('reactorWord').value.trim().toLowerCase(),preview=evaluate(word,...selected,vertical,rack);const nodes=$('board').children;for(let r=0;r<N;r++)for(let c=0;c<N;c++){const b=nodes[r*N+c],tile=board[r][c],ghost=preview?.fresh.find(p=>p.r===r&&p.c===c);b.className=[tile?'filled':'',tile?.owner==='computer'?'cpu':'',ghost?'preview':'',r===selected[0]&&c===selected[1]?'selected':''].filter(Boolean).join(' ');b.replaceChildren();const label=tile?.letter||ghost?.letter||((r===7&&c===7)?'★':bonus(r,c));b.append(document.createTextNode(label.toUpperCase()));if(tile||ghost){const small=document.createElement('small');small.textContent=values[tile?.letter||ghost.letter];b.append(small)}b.setAttribute('aria-label',`${r+1}, ${c+1}: ${label||'empty'}`);b.setAttribute('aria-pressed',String(r===selected[0]&&c===selected[1]));b.disabled=busy||over}
 $('placement').textContent=t('position')+`: ${selected[0]+1}, ${selected[1]+1} · `+t(vertical?'down':'across')+(preview?' · '+t('previewReady')+' '+preview.score+' '+t('points'):word?' · '+t('invalidMove'):'');const scroller=$('board').parentElement,cell=$('board').children[selected[0]*N+selected[1]];if(cell)scroller.scrollLeft=cell.offsetLeft-scroller.offsetLeft-scroller.clientWidth/2+cell.offsetWidth/2;$('direction').textContent=t(vertical?'down':'across');$('playWord').disabled=!preview||busy||over;
}
function render(){
 const general=$('subject').value==='general';$('vocabBand').disabled=general;$('vocabNote').textContent=t(general?'regularNote':'teksNote');$('wordPrompt').textContent=t(general?'chooseRegularWord':'chooseWord');$('bankHeading').textContent=t(general?'regularBank':'wordBank');
 $('playerScore').textContent=playerScore;$('computerScore').textContent=computerScore;$('round').textContent=Math.min(turn,10)+' / 10';$('best').textContent=best;
 $('rack').replaceChildren();for(const ch of rack){const b=document.createElement('button');b.textContent=ch.toUpperCase();const small=document.createElement('small');small.textContent=values[ch];b.append(small);b.disabled=busy||over;b.addEventListener('click',()=>{$('reactorWord').value+=ch;drawBoard();$('reactorWord').focus()});$('rack').append(b)}
 $('hint').disabled=busy||over;$('exchange').disabled=busy||over;$('direction').disabled=busy||over;$('reactorWord').disabled=busy||over;
 legal=over||busy?[]:allMoves(rack);const playable=new Set(legal.map(m=>m.word));$('wordBank').replaceChildren();for(const e of chosen()){const b=document.createElement('button');b.textContent=e.word;b.classList.toggle('playable',playable.has(e.word));b.disabled=busy||over;b.addEventListener('click',()=>{const m=legal.find(m=>m.word===e.word);if(m){selected=[m.r,m.c];vertical=m.down}$('reactorWord').value=e.word;showDefinition(e.word);drawBoard()});$('wordBank').append(b)}
 $('moveLog').replaceChildren();for(const move of moves){const li=document.createElement('li');li.textContent=t(move.owner==='player'?'you':'computer')+': '+move.word+' +'+move.score;const learn=document.createElement('button');learn.type='button';learn.className='secondary';learn.textContent=move.word;learn.addEventListener('click',()=>showDefinition(move.word));li.append(' ',learn);$('moveLog').append(li)}drawBoard();
}
function showDefinition(word){const e=chosen().find(e=>e.word===word)||entries.find(e=>e.word===word);if(!e)return;$('reactorDefinition').hidden=false;$('definitionWord').textContent=word;$('definitionText').textContent=e.definition;$('definitionSource').hidden=!e.source;if(e.source){$('definitionSource').href=e.source;$('definitionSource').textContent=t(e.subject)+' · '+e.standard+' · TEKS'}else{$('definitionSource').removeAttribute('href');$('definitionSource').textContent=''}}
function apply(move,owner){move.fresh.forEach(p=>board[p.r][p.c]={letter:p.letter,owner});used.add(move.word);moves.push({...move,owner});if(owner==='player')playerScore+=move.score;else computerScore+=move.score;if(owner==='player')showDefinition(move.word)}
function finish(){over=true;busy=false;clearTimeout(cpuTimer);if(playerScore>best){best=playerScore;try{localStorage.setItem('drawsplat.reactor.best',String(best))}catch{}}$('feedback').textContent=t('matchOver')+' · '+t('you')+': '+playerScore+' · '+t('computer')+': '+computerScore;render()}
function clearHint(){hintEntry=null;$('reactorHint').hidden=true;$('hintText').textContent=''}
function definitionHint(){if(busy||over)return;const m=legal.slice().sort((a,b)=>b.score-a.score)[0];if(!m){$('feedback').textContent=t('noMoves');return}hintEntry??=chosen().find(e=>e.word===m.word);$('hintText').textContent=hintEntry.definition;$('reactorHint').hidden=false}
function computerTurn(){clearHint();busy=true;$('feedback').textContent=t('computerThinking');render();cpuTimer=setTimeout(()=>{const cpuRack=newRack(),options=allMoves(cpuRack).sort((a,b)=>b.score-a.score);if(options.length)apply(options[0],'computer');turn++;busy=false;$('reactorWord').value='';if(turn>10||!allMoves().length){finish();return}rack=newRack();$('feedback').textContent=t('yourTurn');render()},650)}
function play(){if(busy||over)return;const m=evaluate($('reactorWord').value.trim().toLowerCase(),...selected,vertical,rack);if(!m){$('feedback').textContent=t('invalidMove');return}apply(m,'player');computerTurn()}
function reset(){clearHint();activeEntries=filtered();activeWords=new Set(activeEntries.map(e=>e.word));dictionary=new Set(activeWords);clearTimeout(cpuTimer);board=Array.from({length:N},()=>Array(N).fill(null));used=new Set();moves=[];playerScore=computerScore=0;turn=1;busy=over=false;selected=[7,7];vertical=false;$('reactorWord').value='';$('reactorDefinition').hidden=true;rack=newRack();$('feedback').textContent=t('yourTurn');render();if(!rack.length){$('feedback').textContent=t('noMoves');over=true;render()}}
for(let r=0;r<N;r++)for(let c=0;c<N;c++){const b=document.createElement('button');b.type='button';b.dataset.row=r;b.dataset.col=c;b.dataset.bonus=bonus(r,c);b.addEventListener('click',()=>{selected=[r,c];drawBoard()});b.addEventListener('keydown',e=>{const delta={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];if(delta){e.preventDefault();selected=[Math.max(0,Math.min(N-1,r+delta[0])),Math.max(0,Math.min(N-1,c+delta[1]))];drawBoard();$('board').children[selected[0]*N+selected[1]].focus()}else if(e.key==='Enter'&&$('reactorWord').value){e.preventDefault();play()}});$('board').append(b)}
$('direction').addEventListener('click',()=>{vertical=!vertical;drawBoard()});$('reactorWord').addEventListener('input',drawBoard);$('reactorWord').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();play()}});$('playWord').addEventListener('click',play);$('hint').addEventListener('click',definitionHint);$('exchange').addEventListener('click',computerTurn);$('reset').addEventListener('click',reset);for(const id of ['subject','vocabBand'])$(id).addEventListener('change',reset);window.addEventListener('widget-i18n:changed',render);reset();
})();
