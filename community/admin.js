const SCRIPT_URL='https://script.google.com/macros/s/AKfycbwH_tYTRSwetnMJjQPg0RNG8SYTGBDmi8uuewSY8HXZ5DghXdwWiJvCkngaU9hsRJRn/exec';
const CATEGORIES=['General','Classroom and Pedagogy','Tools','Administration','Suggestion Box'];

let posts=[],replies=[],postIndex={};
let moderationEnabled=true;
const $=id=>document.getElementById(id);
const pc=$('passcode'),msg=$('msg'),queue=$('queue'),statusPanel=$('statusPanel'),filtersPanel=$('filtersPanel');
const search=$('search'),statusFilter=$('statusFilter'),categoryFilter=$('categoryFilter'),typeFilter=$('typeFilter');
const counts=$('counts'),toggleState=$('toggleState');

CATEGORIES.forEach(c=>categoryFilter.insertAdjacentHTML('beforeend',`<option>${escapeHtml(c)}</option>`));

function escapeHtml(s){return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function escapeAttr(s){return escapeHtml(s).replace(/"/g,'&quot;')}
function timeLabel(v){const d=new Date(v);return isNaN(d)?'':d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function show(text,kind){msg.className='msg '+kind;msg.textContent=text}
function clear(){msg.className='msg';msg.textContent=''}

async function api(action,extra,method){
  if(SCRIPT_URL.indexOf('PASTE_YOUR')===0)throw new Error('Backend not configured. Set SCRIPT_URL in admin.js.');
  const passcode=pc.value;
  if((method||'GET')==='GET'){
    const params=new URLSearchParams({action,passcode,...extra,_:Date.now()});
    const res=await fetch(SCRIPT_URL+'?'+params.toString());
    const data=await res.json();
    if(!data.ok)throw new Error(data.error||'Request failed.');
    return data;
  }
  const body=new URLSearchParams({action,passcode,...extra});
  const res=await fetch(SCRIPT_URL,{method:'POST',body});
  const data=await res.json();
  if(!data.ok)throw new Error(data.error||'Request failed.');
  return data;
}

async function load(){
  clear();
  try{
    const data=await api('adminList',{});
    posts=data.posts||[];
    replies=data.replies||[];
    moderationEnabled=!!data.moderationEnabled;
    postIndex={};posts.forEach(p=>postIndex[p.id]=p);
    statusPanel.style.display='block';
    filtersPanel.style.display='block';
    updateStats();
    render();
    show('Console loaded.','ok');
    setTimeout(clear,1800);
  }catch(err){show(err.message,'err')}
}

function updateStats(){
  const pp=posts.filter(x=>x.status==='pending').length;
  const rp=replies.filter(x=>x.status==='pending').length;
  const pa=posts.filter(x=>x.status==='approved').length;
  const ra=replies.filter(x=>x.status==='approved').length;
  const ph=posts.filter(x=>x.status==='hidden').length;
  const rh=replies.filter(x=>x.status==='hidden').length;
  toggleState.textContent=moderationEnabled?'ON':'OFF';
  toggleState.className='toggle-state'+(moderationEnabled?'':' off');
  counts.innerHTML=`<strong>${pp+rp}</strong> awaiting review · <strong>${pa+ra}</strong> approved · <strong>${ph+rh}</strong> hidden · <strong>${posts.length}</strong> posts · <strong>${replies.length}</strong> replies`;
}

function combined(){
  return [
    ...posts.map(p=>({...p,_type:'post'})),
    ...replies.map(r=>({...r,_type:'reply'}))
  ];
}

function filtered(){
  let arr=combined();
  const q=search.value.trim().toLowerCase();
  if(q)arr=arr.filter(x=>[x.title,x.body,x.authorName,x.authorEmail,x.category,x.status].join(' ').toLowerCase().includes(q));
  if(statusFilter.value!=='all')arr=arr.filter(x=>x.status===statusFilter.value);
  if(categoryFilter.value!=='all')arr=arr.filter(x=>{
    if(x._type==='post')return x.category===categoryFilter.value;
    const parent=postIndex[x.postId];
    return parent&&parent.category===categoryFilter.value;
  });
  if(typeFilter.value!=='all')arr=arr.filter(x=>x._type===typeFilter.value);
  arr.sort((a,b)=>{
    const sa=a.status==='pending'?0:a.status==='approved'?1:2;
    const sb=b.status==='pending'?0:b.status==='approved'?1:2;
    if(sa!==sb)return sa-sb;
    return new Date(b.timestamp)-new Date(a.timestamp);
  });
  return arr;
}

function render(){
  const arr=filtered();
  if(!arr.length){queue.innerHTML='<section class="panel" style="text-align:center;color:var(--muted)">No matching items.</section>';return}
  queue.innerHTML=arr.map(x=>{
    const isPost=x._type==='post';
    const parent=isPost?null:postIndex[x.postId];
    const cat=isPost?x.category:(parent?parent.category:'—');
    const title=isPost?x.title:(parent?'Reply to: '+parent.title:'Reply (parent missing)');
    const editGrid=isPost?`
      <div class="grid">
        <input id="title-${escapeAttr(x.id)}" value="${escapeAttr(x.title)}" placeholder="Title">
        <select id="category-${escapeAttr(x.id)}">${CATEGORIES.map(c=>`<option ${c===x.category?'selected':''}>${escapeHtml(c)}</option>`).join('')}</select>
        <input id="name-${escapeAttr(x.id)}" value="${escapeAttr(x.authorName)}" placeholder="Author name">
        <input id="email-${escapeAttr(x.id)}" value="${escapeAttr(x.authorEmail)}" placeholder="Author email">
      </div>`:`
      <div class="grid">
        <input id="name-${escapeAttr(x.id)}" value="${escapeAttr(x.authorName)}" placeholder="Author name">
        <input id="email-${escapeAttr(x.id)}" value="${escapeAttr(x.authorEmail)}" placeholder="Author email">
      </div>`;
    return `<article class="item ${escapeHtml(x.status)}" data-id="${escapeAttr(x.id)}" data-type="${escapeAttr(x._type)}">
      <span class="type">${isPost?'Post':'Reply'}</span>
      <div class="badges">
        <span class="badge ${escapeHtml(x.status)}">${escapeHtml(x.status)}</span>
        <span class="badge cat">${escapeHtml(cat)}</span>
      </div>
      <h3>${escapeHtml(title)}</h3>
      <div class="meta"><strong>${escapeHtml(x.authorName||'Anonymous')}</strong> · ${escapeHtml(x.authorEmail||'no email')} · ${timeLabel(x.timestamp)}</div>
      <div class="body">${escapeHtml(x.body)}</div>
      <div class="actions">
        <button class="btn green sm" data-act="setStatus" data-status="approved" ${x.status==='approved'?'disabled':''}>Approve</button>
        <button class="btn sm" data-act="setStatus" data-status="pending" ${x.status==='pending'?'disabled':''}>Mark pending</button>
        <button class="btn red sm" data-act="setStatus" data-status="hidden" ${x.status==='hidden'?'disabled':''}>Hide</button>
        <button class="btn ghost sm" data-act="toggleEdit">Edit</button>
        <button class="btn red sm" data-act="deleteItem">Delete</button>
      </div>
      <div class="editbox" id="edit-${escapeAttr(x.id)}">
        ${editGrid}
        <textarea id="body-${escapeAttr(x.id)}" placeholder="Body">${escapeHtml(x.body)}</textarea>
        <div class="actions">
          <button class="btn gold sm" data-act="saveEdit">Save edits</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function toggleEdit(id){const el=document.getElementById('edit-'+id);if(el)el.classList.toggle('open')}

async function setStatus(type,id,status){
  try{await api('setStatus',{type,id,status},'POST');await load()}catch(err){show(err.message,'err')}
}

async function saveEdit(type,id){
  try{
    const body=$('body-'+id).value;
    const name=$('name-'+id)?.value||'';
    const email=$('email-'+id)?.value||'';
    const patch={type,id,body,authorName:name,authorEmail:email};
    if(type==='post'){
      patch.title=$('title-'+id).value;
      patch.category=$('category-'+id).value;
    }
    await api('update',patch,'POST');
    await load();
  }catch(err){show(err.message,'err')}
}

async function deleteItem(type,id){
  const label=type==='post'?'Delete this post and all of its replies?':'Delete this reply?';
  if(!confirm(label))return;
  try{await api('delete',{type,id},'POST');await load()}catch(err){show(err.message,'err')}
}

queue.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-act]');
  if(!btn)return;
  const item=btn.closest('.item');
  if(!item)return;
  const id=item.dataset.id;
  const type=item.dataset.type;
  const act=btn.dataset.act;
  if(act==='setStatus')setStatus(type,id,btn.dataset.status);
  else if(act==='toggleEdit')toggleEdit(id);
  else if(act==='saveEdit')saveEdit(type,id);
  else if(act==='deleteItem')deleteItem(type,id);
});

$('loginBtn').addEventListener('click',load);
$('refreshBtn').addEventListener('click',load);
$('toggleMod').addEventListener('click',async()=>{
  try{await api('setModeration',{enabled:String(!moderationEnabled)},'POST');await load()}catch(err){show(err.message,'err')}
});
[search,statusFilter,categoryFilter,typeFilter].forEach(el=>el.addEventListener('input',render));
pc.addEventListener('keydown',e=>{if(e.key==='Enter')load()});
