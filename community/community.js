const SCRIPT_URL='https://script.google.com/macros/s/AKfycbysCu4OvMWr1G4ZswXHf1-x-qTEdQENRVUgcVWWQaF8BD_K1K9_D05SAWsgK8LdBvU5/exec';
const GOOGLE_CLIENT_ID='963195660019-rk8867orle2cs0kk6si705en68t55cos.apps.googleusercontent.com';
const MICROSOFT_CLIENT_ID='PASTE_MICROSOFT_OAUTH_CLIENT_ID_HERE';
const MICROSOFT_TENANT='common';
const CATEGORIES=['General','Classroom and Pedagogy','Tools','Administration','Suggestion Box'];
const REFRESH_SECONDS=60;
const STORAGE_KEY='drawsplat-community-user-v2';

let posts=[];
let currentCategory='General';
let openPostId=null;
let user=null;
let counts={};

const $=id=>document.getElementById(id);
const tabsEl=$('tabs'),postsEl=$('posts'),statusText=$('statusText'),catTitle=$('catTitle');
const searchInput=$('searchInput'),sortSelect=$('sortSelect');
const newCategorySel=$('newCategory'),newTitle=$('newTitle'),newBody=$('newBody'),newCount=$('newCount'),postMsg=$('postMsg');
const postModal=$('postModal'),signinPanel=$('signinPanel'),whoBox=$('whoBox'),signinForm=$('signinForm'),signinMsg=$('signinMsg');

CATEGORIES.forEach(c=>newCategorySel.insertAdjacentHTML('beforeend',`<option>${escapeHtml(c)}</option>`));

function escapeHtml(s){return String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function timeLabel(v){const d=new Date(v);return isNaN(d)?'':d.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}
function showMsg(el,text,kind){el.className='msg '+kind;el.textContent=text}
function clearMsg(el){el.className='msg';el.textContent=''}

function googleEnabled(){return !!GOOGLE_CLIENT_ID&&GOOGLE_CLIENT_ID.indexOf('PASTE_')!==0}
function microsoftEnabled(){return !!MICROSOFT_CLIENT_ID&&MICROSOFT_CLIENT_ID.indexOf('PASTE_')!==0}

function loadUser(){
  try{const raw=localStorage.getItem(STORAGE_KEY);if(raw){user=JSON.parse(raw)}}catch(e){user=null}
  renderUser();
}
function saveUser(u){user=u;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(u))}catch(e){}renderUser()}
function signOut(){
  user=null;
  try{localStorage.removeItem(STORAGE_KEY)}catch(e){}
  try{if(window.google&&google.accounts&&google.accounts.id)google.accounts.id.disableAutoSelect()}catch(e){}
  try{if(msalApp){const a=msalApp.getAllAccounts()[0];if(a)msalApp.logoutPopup({account:a,postLogoutRedirectUri:window.location.href.split('?')[0].split('#')[0]}).catch(()=>{})}}catch(e){}
  renderUser();
}
function renderUser(){
  if(user&&user.name&&user.email&&user.sessionToken){
    const tag=user.provider?` <small>via ${escapeHtml(user.provider)}</small>`:'';
    whoBox.innerHTML=`<div class="who"><div><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}${tag}</small></div><button type="button" id="signoutBtn">Sign out</button></div>`;
    signinForm.style.display='none';
    $('signoutBtn').addEventListener('click',signOut);
  }else{
    whoBox.innerHTML='';
    signinForm.style.display='block';
    const anyEnabled=googleEnabled()||microsoftEnabled();
    $('ssoHint').style.display=anyEnabled?'':'none';
    $('ssoUnavailable').style.display=anyEnabled?'none':'';
    const gFallback=$('googleBtnFallback');
    if(gFallback)gFallback.style.display=googleEnabled()?'':'none';
    const mBtn=$('microsoftBtn');
    if(mBtn)mBtn.style.display=microsoftEnabled()?'':'none';
  }
}

function renderTabs(){
  tabsEl.innerHTML=CATEGORIES.map(c=>{
    const cnt=counts[c]||0;
    const active=c===currentCategory?' active':'';
    return `<button class="tab${active}" data-cat="${escapeHtml(c)}" type="button" role="tab" aria-selected="${c===currentCategory}">${escapeHtml(c)}<span class="count">${cnt}</span></button>`;
  }).join('');
  tabsEl.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click',()=>{currentCategory=btn.dataset.cat;openPostId=null;catTitle.textContent=currentCategory;render();renderTabs()});
  });
  catTitle.textContent=currentCategory;
}

function filteredPosts(){
  let list=posts.filter(p=>p.category===currentCategory);
  const q=searchInput.value.trim().toLowerCase();
  if(q){
    list=list.filter(p=>{
      const inPost=[p.title,p.body,p.authorName].join(' ').toLowerCase().includes(q);
      const inReplies=(p.replies||[]).some(r=>[r.body,r.authorName].join(' ').toLowerCase().includes(q));
      return inPost||inReplies;
    });
  }
  const sort=sortSelect.value;
  if(sort==='oldest')list.sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp));
  else if(sort==='busiest')list.sort((a,b)=>(b.replies?.length||0)-(a.replies?.length||0)||new Date(b.timestamp)-new Date(a.timestamp));
  else list.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  return list;
}

function render(){
  const list=filteredPosts();
  if(!list.length){
    postsEl.innerHTML=`<div class="empty"><strong>No posts in ${escapeHtml(currentCategory)} yet</strong>Be the first — start the conversation with a new post.</div>`;
    return;
  }
  postsEl.innerHTML=list.map(p=>{
    const replies=p.replies||[];
    const open=p.id===openPostId;
    return `<article class="post${open?' open':''}" data-id="${escapeHtml(p.id)}">
      <div class="post-head" data-toggle="${escapeHtml(p.id)}">
        <div class="meta">
          <span class="post-cat">${escapeHtml(p.category)}</span>
          <h3 class="post-title">${escapeHtml(p.title)}</h3>
          <div class="post-sub">
            <span>by <strong>${escapeHtml(p.authorName||'Anonymous')}</strong></span>
            <span>${timeLabel(p.timestamp)}</span>
            <span class="replies-pill">${replies.length} ${replies.length===1?'reply':'replies'}</span>
          </div>
        </div>
      </div>
      ${open?`
        <div class="post-body">${escapeHtml(p.body)}</div>
        <div class="replies">
          ${replies.length?replies.map(r=>`<div class="reply">
            <div class="reply-meta"><strong>${escapeHtml(r.authorName||'Anonymous')}</strong> · ${timeLabel(r.timestamp)}</div>
            <div class="reply-body">${escapeHtml(r.body)}</div>
          </div>`).join(''):'<p style="color:var(--muted);margin:0;font-size:14px">No replies yet. Be the first to respond.</p>'}
          <form class="reply-form" data-postid="${escapeHtml(p.id)}">
            <textarea name="body" maxlength="1500" placeholder="${user?'Write a reply...':'Sign in on the right to reply'}" ${user?'':'disabled'}></textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">
              <button class="btn sm" type="submit" ${user?'':'disabled'}>Submit reply</button>
            </div>
            <div class="msg reply-msg"></div>
          </form>
        </div>
      `:''}
    </article>`;
  }).join('');
  postsEl.querySelectorAll('.post-head').forEach(el=>{
    el.addEventListener('click',()=>{const id=el.dataset.toggle;openPostId=openPostId===id?null:id;render()});
  });
  postsEl.querySelectorAll('.reply-form').forEach(f=>{
    f.addEventListener('submit',e=>{e.preventDefault();submitReply(f)});
  });
}

async function api(action,extra,method){
  if(SCRIPT_URL.indexOf('PASTE_YOUR')===0)throw new Error('Backend not configured. Paste your Apps Script Web App URL into SCRIPT_URL.');
  const url=SCRIPT_URL;
  const payload={action,...(extra||{})};
  if((method||'GET')==='GET'){
    const params=new URLSearchParams({...payload,_:Date.now()});
    const res=await fetch(url+'?'+params.toString());
    const data=await res.json();
    if(!data.ok)throw apiError(data);
    return data;
  }
  const body=new URLSearchParams(payload);
  const res=await fetch(url,{method:'POST',body});
  const data=await res.json();
  if(!data.ok)throw apiError(data);
  return data;
}
function apiError(data){
  const err=new Error(data.error||'Request failed.');
  err.code=data.code||'';
  return err;
}
function handleAuthError(err){
  if(err&&err.code==='auth_required'){
    user=null;
    try{localStorage.removeItem(STORAGE_KEY)}catch(e){}
    renderUser();
    return 'Your session expired. Please sign in again.';
  }
  return err.message;
}

async function load(){
  try{
    const data=await api('list',{});
    posts=data.posts||[];
    counts={};
    posts.forEach(p=>counts[p.category]=(counts[p.category]||0)+1);
    const total=posts.length;
    statusText.textContent=`${total} approved post${total===1?'':'s'} · Moderation ${data.moderationEnabled?'ON':'OFF'}`;
    renderTabs();
    render();
  }catch(err){
    statusText.textContent='Connection issue';
    postsEl.innerHTML=`<div class="empty"><strong>${escapeHtml(err.message)}</strong>Set SCRIPT_URL in <code>index.html</code> to your Apps Script Web App URL.</div>`;
  }
}

async function submitReply(form){
  const msgEl=form.querySelector('.reply-msg');
  clearMsg(msgEl);
  if(!user){showMsg(msgEl,'Sign in to reply.','err');return}
  const body=form.querySelector('textarea').value.trim();
  if(!body){showMsg(msgEl,'Reply cannot be empty.','err');return}
  const btn=form.querySelector('button[type="submit"]');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Sending...';
  try{
    const data=await api('reply',{postId:form.dataset.postid,body,sessionToken:user.sessionToken},'POST');
    showMsg(msgEl,data.status==='pending'?'Reply submitted. A moderator will review it shortly.':'Reply posted.','info');
    form.reset();
    await load();
  }catch(err){showMsg(msgEl,handleAuthError(err),'err')}
  finally{btn.disabled=false;btn.textContent='Submit reply'}
}

async function submitPost(){
  clearMsg(postMsg);
  if(!user){showMsg(postMsg,'Sign in first (right side panel).','err');return}
  const category=newCategorySel.value;
  const title=newTitle.value.trim();
  const body=newBody.value.trim();
  if(!title){showMsg(postMsg,'Title is required.','err');return}
  if(!body){showMsg(postMsg,'Message is required.','err');return}
  const btn=$('submitPost');
  btn.disabled=true;btn.innerHTML='<span class="spinner"></span> Submitting...';
  try{
    const data=await api('post',{category,title,body,sessionToken:user.sessionToken},'POST');
    showMsg(postMsg,data.status==='pending'?'Submitted. A moderator will review your post shortly.':'Posted!','ok');
    newTitle.value='';newBody.value='';newCount.textContent='0';
    setTimeout(()=>{postModal.classList.remove('open');clearMsg(postMsg)},1400);
    currentCategory=category;
    await load();
  }catch(err){showMsg(postMsg,handleAuthError(err),'err')}
  finally{btn.disabled=false;btn.textContent='Submit post'}
}

async function completeSignIn(provider,tokens){
  clearMsg(signinMsg);
  try{
    const data=await api('signIn',{provider,...tokens},'POST');
    saveUser({name:data.user.name,email:data.user.email,provider:data.user.provider,sessionToken:data.sessionToken});
    showMsg(signinMsg,'Signed in as '+data.user.name+'.','ok');
    setTimeout(()=>clearMsg(signinMsg),2200);
  }catch(err){showMsg(signinMsg,err.message,'err')}
}

let msalApp=null;
let googleReady=false;

function whenReady(check,cb,tries){
  if(tries==null)tries=60;
  if(check())return cb();
  if(tries<=0)return;
  setTimeout(()=>whenReady(check,cb,tries-1),120);
}

function initGoogle(){
  if(!googleEnabled())return;
  whenReady(()=>window.google&&google.accounts&&google.accounts.id,()=>{
    try{
      google.accounts.id.initialize({
        client_id:GOOGLE_CLIENT_ID,
        callback:resp=>completeSignIn('google',{idToken:resp.credential})
      });
      const host=$('googleBtnHost');
      if(host)google.accounts.id.renderButton(host,{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:240});
      googleReady=true;
    }catch(e){console.warn('Google init failed:',e)}
  });
}

function initMicrosoft(){
  if(!microsoftEnabled())return;
  whenReady(()=>window.msal&&msal.PublicClientApplication,()=>{
    try{
      msalApp=new msal.PublicClientApplication({
        auth:{
          clientId:MICROSOFT_CLIENT_ID,
          authority:'https://login.microsoftonline.com/'+MICROSOFT_TENANT,
          redirectUri:window.location.href.split('?')[0].split('#')[0]
        },
        cache:{cacheLocation:'sessionStorage'}
      });
      const init=msalApp.initialize?msalApp.initialize():Promise.resolve();
      Promise.resolve(init).catch(e=>console.warn('MSAL init error:',e));
    }catch(e){console.warn('Microsoft init failed:',e)}
  });
}

async function microsoftSignIn(){
  clearMsg(signinMsg);
  if(!microsoftEnabled()){showMsg(signinMsg,'Microsoft sign-in is not configured.','err');return}
  const btn=$('microsoftBtn');
  btn.disabled=true;
  try{
    if(!msalApp)initMicrosoft();
    let tries=30;while((!msalApp||!msalApp.loginPopup)&&tries-->0){await new Promise(r=>setTimeout(r,120))}
    if(!msalApp||!msalApp.loginPopup)throw new Error('Microsoft sign-in library failed to load.');
    const result=await msalApp.loginPopup({scopes:['User.Read'],prompt:'select_account'});
    if(!result||!result.accessToken)throw new Error('Microsoft did not return an access token.');
    await completeSignIn('microsoft',{accessToken:result.accessToken});
  }catch(err){
    const m=String(err&&err.message||err);
    if(/user_cancelled|popup_window_error|popup closed/i.test(m))showMsg(signinMsg,'Sign-in canceled.','info');
    else showMsg(signinMsg,m,'err');
  }finally{btn.disabled=false}
}

function googleFallbackSignIn(){
  clearMsg(signinMsg);
  if(!googleEnabled()){showMsg(signinMsg,'Google sign-in is not configured.','err');return}
  if(!window.google||!google.accounts||!google.accounts.id){showMsg(signinMsg,'Google sign-in library not loaded yet. Try again in a moment.','err');return}
  try{google.accounts.id.prompt()}catch(e){showMsg(signinMsg,e.message,'err')}
}

function openNew(e){
  if(e)e.preventDefault();
  if(!user){showMsg(signinMsg,'Sign in first to create a post.','err');return}
  newCategorySel.value=currentCategory;
  clearMsg(postMsg);
  postModal.classList.add('open');
}

newBody.addEventListener('input',()=>newCount.textContent=newBody.value.length);
[searchInput,sortSelect].forEach(el=>el.addEventListener('input',render));
$('refreshBtn').addEventListener('click',load);
$('newPostBtn').addEventListener('click',openNew);
$('newPostBtnTop').addEventListener('click',openNew);
$('cancelPost').addEventListener('click',()=>postModal.classList.remove('open'));
$('submitPost').addEventListener('click',submitPost);
$('microsoftBtn').addEventListener('click',microsoftSignIn);
$('googleBtnFallback').addEventListener('click',googleFallbackSignIn);

const emailField=$('emailField'),passwordField=$('passwordField'),nameField=$('nameField');
const nameFieldWrap=$('nameFieldWrap'),emailSubmitBtn=$('emailSubmitBtn'),emailModeBtn=$('emailModeBtn');
let emailMode='signin';
function setEmailMode(mode){
  emailMode=mode;
  if(mode==='signup'){
    nameFieldWrap.hidden=false;
    passwordField.autocomplete='new-password';
    emailSubmitBtn.textContent='Create account';
    emailModeBtn.textContent='Have an account?';
  }else{
    nameFieldWrap.hidden=true;
    passwordField.autocomplete='current-password';
    emailSubmitBtn.textContent='Sign in';
    emailModeBtn.textContent='Create account';
  }
}
async function submitEmailAuth(){
  clearMsg(signinMsg);
  const email=emailField.value.trim();
  const password=passwordField.value;
  const name=nameField.value.trim();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showMsg(signinMsg,'Please enter a valid email.','err');return}
  if(!password){showMsg(signinMsg,'Please enter your password.','err');return}
  if(emailMode==='signup'){
    if(password.length<8){showMsg(signinMsg,'Password must be at least 8 characters.','err');return}
    if(!name){showMsg(signinMsg,'Please enter a display name.','err');return}
  }
  const originalText=emailSubmitBtn.textContent;
  emailSubmitBtn.disabled=true;
  emailSubmitBtn.innerHTML='<span class="spinner"></span> Working...';
  try{
    if(emailMode==='signup'){
      const data=await api('registerEmail',{email,password,name},'POST');
      saveUser({name:data.user.name,email:data.user.email,provider:data.user.provider,sessionToken:data.sessionToken});
      showMsg(signinMsg,'Account created. Welcome!','ok');
    }else{
      await completeSignIn('email',{email,password});
    }
    passwordField.value='';
  }catch(err){showMsg(signinMsg,err.message,'err')}
  finally{
    emailSubmitBtn.disabled=false;
    emailSubmitBtn.textContent=originalText;
  }
}
emailSubmitBtn.addEventListener('click',submitEmailAuth);
emailModeBtn.addEventListener('click',()=>setEmailMode(emailMode==='signin'?'signup':'signin'));
[emailField,passwordField,nameField].forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submitEmailAuth()}}));

postModal.addEventListener('click',e=>{if(e.target===postModal)postModal.classList.remove('open')});

initGoogle();
initMicrosoft();
loadUser();
renderTabs();
load();
setInterval(load,REFRESH_SECONDS*1000);
