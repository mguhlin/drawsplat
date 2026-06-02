(function(){
  const categories=[
    {key:'Classroom',title:'Classroom Teachers',empty:'No independent classroom teachers yet.'},
    {key:'Campus',title:'Campuses',empty:'No campus-managed classroom groups yet.'},
    {key:'District',title:'Districts',empty:'No district-managed campus groups yet.'}
  ];
  const $=id=>document.getElementById(id);
  const state={config:null,instances:[],sessionToken:'',user:null};
  const sessionKey='drawsplat.hubAdmin.session';
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const clean=s=>String(s||'').trim();
  const configured=s=>clean(s)&&clean(s).indexOf('PASTE_')!==0;
  const msg=(id,text,cls='')=>{const el=$(id);if(el){el.textContent=text;el.className='msg '+cls}};

  function registryUrl(){return clean(state.config&&state.config.instanceRegistryUrl)}
  function googleClientId(){return clean(state.config&&state.config.googleClientId)}
  function saveSession(){try{localStorage.setItem(sessionKey,JSON.stringify({sessionToken:state.sessionToken,user:state.user}))}catch(_){}}
  function loadSession(){try{const raw=localStorage.getItem(sessionKey);if(raw)Object.assign(state,JSON.parse(raw))}catch(_){}}
  function clearSession(){
    state.sessionToken='';state.user=null;try{localStorage.removeItem(sessionKey)}catch(_){}
    $('adminSurface').classList.add('hidden');
    msg('authMsg','Session cleared. Sign in with an approved Google account.');
  }
  async function api(action,payload={}){
    const url=registryUrl();
    if(!url)throw new Error('Hub registry URL is not configured in hub/config.json.');
    const body={action,...payload};
    const res=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(body)});
    const out=await res.json();
    if(!out.ok)throw new Error(out.error||'Hub registry request failed.');
    return out;
  }
  function childList(item){
    const children=item.category==='District'?(item.campuses||[]):(item.teachers||item.classrooms||[]);
    if(!children.length)return '';
    const label=item.category==='District'?'Campuses':'Classrooms';
    return `<div><p class="activity">${label}</p><ul class="children">${children.map(child=>`<li class="child"><strong>${esc(child.name||child.slug||'Untitled')}</strong><span>${esc(child.summary||child.teacher||child.status||'Configured classroom')}</span></li>`).join('')}</ul></div>`;
  }
  function card(item){
    const model=item.licenseModel||item.ownerType||item.category||'Campus';
    return `<article class="card"><div><h3>${esc(item.name||item.slug)}</h3><p>${esc(item.summary||'DrawSplat instance')}</p><p class="activity">Activity: ${esc(item.lastActivity||'No activity reported')}</p></div><div class="meta"><span class="pill">${esc(model)}</span><span class="pill status">${esc(item.status||'Setup')}</span></div>${childList(item)}<div class="actions"><a class="button primary" href="${esc(item.path||'#')}">Open</a><a class="button" href="${esc(item.adminPath||'#')}">Admin</a><a class="button" href="${esc(item.whiteboardPath||'#')}">Board</a></div></article>`;
  }
  function haystack(item){
    const childText=[...(item.teachers||[]),...(item.classrooms||[]),...(item.campuses||[])].map(x=>[x.name,x.slug,x.teacher,x.summary,x.status].join(' ')).join(' ');
    return [item.name,item.slug,item.status,item.category,item.summary,item.licenseModel,item.ownerType,childText].join(' ').toLowerCase();
  }
  function render(){
    const q=$('searchInput').value.trim().toLowerCase(), only=$('categoryFilter').value;
    const filtered=state.instances.filter(x=>(!only||x.category===only)&&(!q||haystack(x).includes(q)));
    $('sections').innerHTML=categories.map(cat=>{
      const items=filtered.filter(x=>(x.category||'Campus')===cat.key).sort((a,b)=>String(a.name||a.slug).localeCompare(String(b.name||b.slug)));
      return `<section class="section"><h2>${cat.title}</h2>${items.length?`<div class="grid">${items.map(card).join('')}</div>`:`<div class="empty">${cat.empty}</div>`}</section>`;
    }).join('');
  }
  async function loadInstances(){
    if(registryUrl()&&state.sessionToken){
      const out=await api('hubInstancesGet',{sessionToken:state.sessionToken});
      state.instances=Array.isArray(out.instances)?out.instances:[];
    }else{
      const res=await fetch('instances.json',{cache:'no-cache'});
      state.instances=res.ok?await res.json():[];
    }
    render();
  }
  function showAdmin(){
    $('adminSurface').classList.remove('hidden');
    msg('authMsg','Signed in as '+(state.user&&state.user.email?state.user.email:'approved admin')+'.','ok');
    loadInstances().catch(err=>msg('authMsg',err.message,'err'));
  }
  async function bindGoogle(idToken){
    if(!idToken)return msg('authMsg','Google did not return an ID token.','err');
    try{
      const out=await api('hubAdminGoogleAuth',{idToken});
      state.sessionToken=out.sessionToken;
      state.user=out.user;
      saveSession();
      showAdmin();
    }catch(err){msg('authMsg',err.message,'err')}
  }
  function googlePrompt(){
    if(!window.google||!google.accounts||!google.accounts.id)return msg('authMsg','Google sign-in library is still loading.','err');
    try{
      google.accounts.id.prompt(notification=>{
        if(!notification)return;
        if(notification.isNotDisplayed&&notification.isNotDisplayed()){
          const reason=notification.getNotDisplayedReason?notification.getNotDisplayedReason():'unknown_reason';
          msg('authMsg','Google did not show the sign-in prompt ('+reason+'). Use the Google button above, or check that the OAuth client ID and allowed origin are configured.','err');
        }else if(notification.isSkippedMoment&&notification.isSkippedMoment()){
          const reason=notification.getSkippedReason?notification.getSkippedReason():'unknown_reason';
          msg('authMsg','Google skipped the sign-in prompt ('+reason+'). Use the Google button above, or clear the browser Google sign-in state and try again.','err');
        }else if(notification.isDismissedMoment&&notification.isDismissedMoment()){
          msg('authMsg','Google sign-in prompt was dismissed. Try the Google button above when ready.');
        }
      });
    }catch(err){msg('authMsg',err.message,'err')}
  }
  function initGoogle(){
    if(!registryUrl()){
      msg('authMsg','Hub registry URL is not configured. Dashboard data stays hidden until the Apps Script registry URL is added to hub/config.json.','err');
      return;
    }
    if(!configured(googleClientId())){
      msg('authMsg','Google OAuth client ID is not configured in hub/config.json.','err');
      return;
    }
    const wait=tries=>{
      if(window.google&&google.accounts&&google.accounts.id){
        google.accounts.id.initialize({client_id:googleClientId(),callback:resp=>bindGoogle(resp.credential)});
        google.accounts.id.renderButton($('googleHost'),{theme:'outline',size:'large',shape:'pill',text:'continue_with',width:280});
        if(state.sessionToken)showAdmin();else msg('authMsg','Sign in with an approved Google account.');
        return;
      }
      if(tries>0)setTimeout(()=>wait(tries-1),120);
    };
    wait(60);
  }
  function slugify(text){
    return clean(text).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);
  }
  async function addTeacher(){
    const teacherName=clean($('teacherName').value);
    const teacherEmail=clean($('teacherEmail').value).toLowerCase();
    const category=$('teacherScope').value;
    const slug=slugify($('teacherSlug').value||teacherName||teacherEmail.split('@')[0]);
    if(!teacherName||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(teacherEmail)||!slug)return msg('teacherMsg','Enter a teacher name, valid email, and slug.','err');
    try{
      if(!registryUrl()||!state.sessionToken)throw new Error('Sign in through the Hub registry before adding teachers.');
      const out=await api('hubTeacherAdd',{sessionToken:state.sessionToken,teacher:{name:teacherName,email:teacherEmail,slug,category,parentSlug:category==='Campus'?'hubcampus':''}});
      state.instances=out.instances||state.instances;
      render();
      const extra=out.folderUrl?' Folder shared: '+out.folderUrl:'';
      msg('teacherMsg','Teacher added and shared as editor.'+extra,'ok');
    }catch(err){msg('teacherMsg',err.message,'err')}
  }
  async function boot(){
    loadSession();
    try{
      const res=await fetch('config.json',{cache:'no-cache'});
      state.config=res.ok?await res.json():{};
    }catch(_){state.config={}}
    $('googlePromptBtn').addEventListener('click',googlePrompt);
    $('clearSessionBtn').addEventListener('click',clearSession);
    $('addTeacherBtn').addEventListener('click',addTeacher);
    $('searchInput').addEventListener('input',render);
    $('categoryFilter').addEventListener('change',render);
    initGoogle();
  }
  boot();
})();
